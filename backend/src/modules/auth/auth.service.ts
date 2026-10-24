import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { RsGeService } from '@/modules/rsge/rsge.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RsGeVerifyDto } from './dto/rsge-verify.dto';
import { EntityType, UserRole, User } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rsGeService: RsGeService,
  ) {}

  /**
   * User Registration (Physical Person or Corporate Entity)
   */
  async register(dto: RegisterDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanPersonalId = dto.personalId.trim();

    // Check existing identity
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { personalId: cleanPersonalId }],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        throw new ConflictException('მომხმარებელი მითითებული ელ-ფოსტით უკვე არსებობს');
      }
      throw new ConflictException('მომხმარებელი მითითებული პირადი ნომრით/საიდენტიფიკაციო კოდით უკვე რეგისტრირებულია');
    }

    // Taxpayer validation via RS.GE (Mock sandbox or live)
    let rsInfo = null;
    try {
      rsInfo = await this.rsGeService.getTaxpayerPublicInfo(cleanPersonalId);
    } catch (e) {
      this.logger.warn(`RS.GE public info lookup skipped or failed for ${cleanPersonalId}: ${e.message}`);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Public self-registration always assigns REGULAR user role (neither DEBTOR nor CREDITOR)
    // Debtor or Creditor status is strictly assigned by an Analyst via Excel/DB synchronization
    const userRole = UserRole.REGULAR;

    // Atomic transaction for User + Profile
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          personalId: cleanPersonalId,
          entityType: dto.entityType,
          role: userRole,
          phone: dto.phone || null,
          isRsVerified: rsInfo ? true : false,
          status: 'ACTIVE',
        },
      });

      if (dto.entityType === EntityType.PHYSICAL) {
        const fallbackName = rsInfo?.fullName?.split(' ') || ['გიორგი', 'ბერიძე'];
        await tx.individualProfile.create({
          data: {
            userId: createdUser.id,
            firstName: dto.firstName || fallbackName[0] || 'სახელი',
            lastName: dto.lastName || fallbackName.slice(1).join(' ') || 'გვარი',
            legalAddress: dto.legalAddress || 'ქ. თბილისი',
            actualAddress: dto.actualAddress || dto.legalAddress || 'ქ. თბილისი',
          },
        });
      } else {
        const companyName = dto.companyName || rsInfo?.fullName || `შპს ${cleanPersonalId}`;
        const directorName = dto.directorName || 'გიორგი';
        const directorLastName = dto.directorLastName || 'ბერიძე';
        const directorPin = dto.directorPin || '01019012345';
        const directorPhone = dto.directorPhone || dto.phone || '+995 599 00 00 00';
        const directorEmail = dto.directorEmail || cleanEmail;

        await tx.companyProfile.create({
          data: {
            userId: createdUser.id,
            companyName,
            legalForm: dto.legalForm || rsInfo?.registeredSubject || 'შპს',
            taxId: cleanPersonalId,
            legalAddress: dto.legalAddress || 'ქ. თბილისი, საქართველო',
            actualAddress: dto.actualAddress || dto.legalAddress || 'ქ. თბილისი, საქართველო',
            isVatPayer: rsInfo ? rsInfo.vatPayer : false,
            hasMortgage: rsInfo ? rsInfo.mortgage : false,
            hasSequestration: rsInfo ? rsInfo.sequestration : false,
            rsDataPayload: rsInfo?.rawPayload || undefined,
            directorName,
            directorLastName,
            directorPin,
            directorPhone,
            directorEmail,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: createdUser.id,
          action: 'REGISTER',
          entity: 'USER',
          entityId: createdUser.id,
          metadata: {
            role: userRole,
            entityType: dto.entityType,
            isRsVerified: createdUser.isRsVerified,
          },
        },
      });

      return createdUser;
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        individualProfile: true,
        companyProfile: true,
      },
    });

    const tokens = await this.generateTokens(fullUser);
    await this.updateRefreshToken(fullUser.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(fullUser),
      tokens,
      rsGeInfo: rsInfo,
    };
  }

  /**
   * User Login (supports Email, 11-digit Personal PIN, or 9-digit Company Tax ID)
   */
  async login(dto: LoginDto) {
    const ident = dto.identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: ident.toLowerCase() },
          { personalId: ident },
        ],
      },
      include: {
        individualProfile: true,
        companyProfile: true,
        staffProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('არასწორი მონაცემები: მომხმარებელი ვერ მოიძებნა ან პაროლი მცდარია');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('ანგარიში შეჩერებულია ადმინისტრაციის მიერ');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('არასწორი პაროლი');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        metadata: { role: user.role, identifierUsed: ident },
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * RS.GE OAuth SSO Verification (Single Sign-On Callback)
   */
  async rsGeVerify(dto: RsGeVerifyDto) {
    const rsResult = await this.rsGeService.verifyOAuthKey(dto.authKey);

    const persNo = rsResult.persNo.trim();
    const isLegal = persNo.length === 9;

    let user = await this.prisma.user.findUnique({
      where: { personalId: persNo },
      include: {
        individualProfile: true,
        companyProfile: true,
        staffProfile: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      // Auto-provision verified user from official RS.GE data
      isNewUser = true;
      const defaultEmail = `${persNo}@rsge.ge`;
      const role = dto.role || UserRole.REGULAR;
      const entityType = isLegal ? EntityType.LEGAL : EntityType.PHYSICAL;

      const createdUserId = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: defaultEmail,
            personalId: persNo,
            entityType,
            role,
            isRsVerified: true,
            rsAuthKey: dto.authKey,
            status: 'ACTIVE',
          },
        });

        if (isLegal) {
          await tx.companyProfile.create({
            data: {
              userId: created.id,
              companyName: rsResult.fullName,
              legalForm: rsResult.payerType || 'შპს',
              taxId: persNo,
              legalAddress: rsResult.address || 'ქ. თბილისი, საქართველო',
              actualAddress: rsResult.address || 'ქ. თბილისი, საქართველო',
              isVatPayer: true,
              directorName: 'დირექტორი',
              directorLastName: rsResult.fullName,
              directorPin: '01019012345',
              directorPhone: '+995 599 00 00 00',
              directorEmail: defaultEmail,
            },
          });
        } else {
          const parts = rsResult.fullName.split(' ');
          await tx.individualProfile.create({
            data: {
              userId: created.id,
              firstName: parts[0] || 'გიორგი',
              lastName: parts.slice(1).join(' ') || 'ბერიძე',
              legalAddress: rsResult.address || 'ქ. თბილისი',
              actualAddress: rsResult.address || 'ქ. თბილისი',
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: created.id,
            action: 'RS_OAUTH_PROVISION',
            entity: 'USER',
            entityId: created.id,
            metadata: { persNo, role },
          },
        });

        return created.id;
      });

      user = await this.prisma.user.findUnique({
        where: { id: createdUserId },
        include: {
          individualProfile: true,
          companyProfile: true,
          staffProfile: true,
        },
      });
    } else {
      // Existing user: mark RS verified and update auth key
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isRsVerified: true,
          rsAuthKey: dto.authKey,
        },
      });
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
      isNewUser,
      rsResult,
    };
  }

  /**
   * Token Refresh
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'debitinfo-super-secret-refresh-token-key-2024'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          individualProfile: true,
          companyProfile: true,
          staffProfile: true,
        },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('ტოკენი არავალიდურია');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('ტოკენი გაუქმებულია');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return { tokens };
    } catch (e) {
      throw new UnauthorizedException('Refresh token-ის ვადა ამოიწურა, გთხოვთ ხელახლა გაიაროთ ავტორიზაცია');
    }
  }

  /**
   * User Logout
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true, message: 'სისტემიდან გამოსვლა წარმატებულია' };
  }

  /**
   * Current Authenticated User Identity (/api/v1/auth/me)
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualProfile: true,
        companyProfile: true,
        staffProfile: true,
        _count: {
          select: {
            ownedClaims: true,
            liabilities: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა');
    }

    return this.sanitizeUser(user);
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      personalId: user.personalId,
      role: user.role,
      entityType: user.entityType,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'debitinfo-super-secret-access-token-key-2024',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'debitinfo-super-secret-refresh-token-key-2024',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const saltRounds = 10;
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }
}
