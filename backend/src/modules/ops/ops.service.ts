import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, EntityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface ContactPersonDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  relationType?: string;
}

export interface CreateStaffDto {
  email: string;
  password?: string;
  personalId: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  legalAddress?: string;
  actualAddress?: string;
  role: 'ADMIN' | 'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL';
  department?: string;
  phone?: string;
  internalExt?: string;
  contactPerson?: ContactPersonDto;
}

export interface UpdateStaffDto {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  legalAddress?: string;
  actualAddress?: string;
  role?: 'ADMIN' | 'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL';
  department?: string;
  phone?: string;
  status?: string;
  internalExt?: string;
  contactPerson?: ContactPersonDto;
}

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all staff members (excluding regular users, debtors, creditors)
   */
  async getStaffMembers() {
    const staffRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.ANALYST,
      UserRole.OPERATOR,
      UserRole.FIELD_OFFICER,
      UserRole.LEGAL,
    ];

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: staffRoles },
      },
      include: {
        staffProfile: {
          include: {
            contactPersons: true,
          },
        },
        individualProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const fn = u.staffProfile?.firstName || u.individualProfile?.firstName || '';
      const ln = u.staffProfile?.lastName || u.individualProfile?.lastName || '';
      const fullName = u.staffProfile?.fullName || (fn && ln ? `${fn} ${ln}` : u.email.split('@')[0]);
      const cp = u.staffProfile?.contactPersons?.[0] || null;

      return {
        id: u.id,
        email: u.email,
        personalId: u.personalId,
        role: u.role,
        status: u.status,
        phone: u.phone,
        isRsVerified: u.isRsVerified,
        createdAt: u.createdAt,
        fullName,
        firstName: fn,
        lastName: ln,
        legalAddress: u.staffProfile?.legalAddress || u.individualProfile?.legalAddress || '',
        actualAddress: u.staffProfile?.actualAddress || u.individualProfile?.actualAddress || '',
        department: u.staffProfile?.department || this.getDefaultDepartment(u.role),
        internalExt: u.staffProfile?.internalExt || '—',
        joinedDate: u.staffProfile?.joinedDate || u.createdAt,
        contactPerson: cp
          ? {
              id: cp.id,
              firstName: cp.firstName,
              lastName: cp.lastName,
              phone: cp.phone,
              email: cp.email,
              address: cp.address,
              relationType: cp.relationType,
            }
          : null,
      };
    });
  }

  /**
   * Create / Register a new staff member (Admin only)
   */
  async createStaffMember(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase().trim() }, { personalId: dto.personalId.trim() }],
      },
    });

    if (existing) {
      throw new BadRequestException('მითითებული ელფოსტით ან პირადი ნომრით მომხმარებელი უკვე არსებობს');
    }

    const rawFirstName = dto.firstName?.trim() || '';
    const rawLastName = dto.lastName?.trim() || '';
    const fullName = (rawFirstName && rawLastName)
      ? `${rawFirstName} ${rawLastName}`
      : (dto.fullName?.trim() || `${rawFirstName} ${rawLastName}`.trim() || dto.email.split('@')[0]);

    const firstName = rawFirstName || fullName.split(' ')[0] || '';
    const lastName = rawLastName || fullName.split(' ').slice(1).join(' ') || '';
    const legalAddress = dto.legalAddress?.trim() || null;
    const actualAddress = dto.actualAddress?.trim() || legalAddress || null;

    const rawPassword = dto.password?.trim() || 'Debitinfo2024!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const targetRole = UserRole[dto.role] || UserRole.OPERATOR;
    const department = dto.department?.trim() || this.getDefaultDepartment(targetRole);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        personalId: dto.personalId.trim(),
        entityType: EntityType.PHYSICAL,
        role: targetRole,
        phone: dto.phone || null,
        status: 'ACTIVE',
        isRsVerified: true,
        individualProfile: {
          create: {
            firstName,
            lastName,
            legalAddress,
            actualAddress: actualAddress || 'თბილისი',
          },
        },
        staffProfile: {
          create: {
            fullName,
            firstName,
            lastName,
            legalAddress,
            actualAddress,
            department,
            internalExt: dto.internalExt || `${Math.floor(100 + Math.random() * 900)}`,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        staffProfile: true,
        individualProfile: true,
      },
    });

    this.logger.log(`Created new staff member: ${newUser.email} (${newUser.role})`);

    let contactPersonRecord = null;
    if (
      dto.contactPerson &&
      dto.contactPerson.firstName?.trim() &&
      dto.contactPerson.lastName?.trim() &&
      dto.contactPerson.phone?.trim()
    ) {
      contactPersonRecord = await this.prisma.contactPerson.create({
        data: {
          firstName: dto.contactPerson.firstName.trim(),
          lastName: dto.contactPerson.lastName.trim(),
          phone: dto.contactPerson.phone.trim(),
          email: dto.contactPerson.email?.trim() || null,
          address: dto.contactPerson.address?.trim() || null,
          relationType: dto.contactPerson.relationType?.trim() || 'EMERGENCY',
          staffProfileId: newUser.staffProfile?.id,
          userId: newUser.id,
        },
      });
      this.logger.log(
        `Created contact person ${contactPersonRecord.firstName} ${contactPersonRecord.lastName} for ${newUser.email}`
      );
    }

    return {
      success: true,
      message: `თანამშრომელი ${fullName} (${dto.role}) წარმატებით დარეგისტრირდა!`,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.staffProfile?.fullName,
        firstName: newUser.staffProfile?.firstName,
        lastName: newUser.staffProfile?.lastName,
        legalAddress: newUser.staffProfile?.legalAddress,
        actualAddress: newUser.staffProfile?.actualAddress,
        role: newUser.role,
        department: newUser.staffProfile?.department,
        initialPassword: rawPassword,
        contactPerson: contactPersonRecord,
      },
    };
  }

  /**
   * Update an existing staff member
   */
  async updateStaffMember(id: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true, individualProfile: true },
    });

    if (!user) {
      throw new NotFoundException('თანამშრომელი ვერ მოიძებნა');
    }

    const firstName = dto.firstName !== undefined ? dto.firstName.trim() : user.staffProfile?.firstName;
    const lastName = dto.lastName !== undefined ? dto.lastName.trim() : user.staffProfile?.lastName;
    const fullName = dto.fullName !== undefined
      ? dto.fullName.trim()
      : (firstName && lastName ? `${firstName} ${lastName}` : undefined);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role ? UserRole[dto.role] : undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        staffProfile: {
          upsert: {
            create: {
              fullName: fullName || user.email,
              firstName: firstName || null,
              lastName: lastName || null,
              legalAddress: dto.legalAddress !== undefined ? dto.legalAddress : null,
              actualAddress: dto.actualAddress !== undefined ? dto.actualAddress : null,
              department: dto.department || this.getDefaultDepartment(dto.role || user.role),
              internalExt: dto.internalExt || '100',
              status: dto.status || 'ACTIVE',
            },
            update: {
              fullName: fullName !== undefined ? fullName : undefined,
              firstName: firstName !== undefined ? firstName : undefined,
              lastName: lastName !== undefined ? lastName : undefined,
              legalAddress: dto.legalAddress !== undefined ? dto.legalAddress : undefined,
              actualAddress: dto.actualAddress !== undefined ? dto.actualAddress : undefined,
              department: dto.department !== undefined ? dto.department : undefined,
              internalExt: dto.internalExt !== undefined ? dto.internalExt : undefined,
              status: dto.status !== undefined ? dto.status : undefined,
            },
          },
        },
      },
      include: {
        staffProfile: {
          include: {
            contactPersons: true,
          },
        },
      },
    });

    if (
      dto.contactPerson &&
      dto.contactPerson.firstName?.trim() &&
      dto.contactPerson.lastName?.trim() &&
      dto.contactPerson.phone?.trim()
    ) {
      const existingCP = await this.prisma.contactPerson.findFirst({
        where: { staffProfileId: updatedUser.staffProfile?.id },
      });

      if (existingCP) {
        await this.prisma.contactPerson.update({
          where: { id: existingCP.id },
          data: {
            firstName: dto.contactPerson.firstName.trim(),
            lastName: dto.contactPerson.lastName.trim(),
            phone: dto.contactPerson.phone.trim(),
            email: dto.contactPerson.email?.trim() || null,
            address: dto.contactPerson.address?.trim() || null,
            relationType: dto.contactPerson.relationType?.trim() || 'EMERGENCY',
          },
        });
      } else if (updatedUser.staffProfile?.id) {
        await this.prisma.contactPerson.create({
          data: {
            firstName: dto.contactPerson.firstName.trim(),
            lastName: dto.contactPerson.lastName.trim(),
            phone: dto.contactPerson.phone.trim(),
            email: dto.contactPerson.email?.trim() || null,
            address: dto.contactPerson.address?.trim() || null,
            relationType: dto.contactPerson.relationType?.trim() || 'EMERGENCY',
            staffProfileId: updatedUser.staffProfile.id,
            userId: updatedUser.id,
          },
        });
      }
    }

    return {
      success: true,
      message: 'თანამშრომლის მონაცემები წარმატებით განახლდა',
      user: updatedUser,
    };
  }

  /**
   * Delete / Deactivate staff member
   */
  async deleteStaffMember(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('თანამშრომელი ვერ მოიძებნა');
    }

    // Safety: prevent deleting the master super-admin
    if (user.email === 'admin@debitinfo.ge') {
      throw new BadRequestException('მთავარი სისტემური ადმინისტრატორის წაშლა შეუძლებელია');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      success: true,
      message: 'თანამშრომელი წარმატებით წაიშალა სისტემიდან',
    };
  }

  /**
   * Quick stats for the Ops Dashboard
   */
  async getOpsStats() {
    const [staffCount, usersCount, stagedCount, claimsCount] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: {
            in: [
              UserRole.ADMIN,
              UserRole.ANALYST,
              UserRole.OPERATOR,
              UserRole.FIELD_OFFICER,
              UserRole.LEGAL,
            ],
          },
        },
      }),
      this.prisma.user.count(),
      this.prisma.stagedRegistryItem.count(),
      this.prisma.debtClaim.count(),
    ]);

    return {
      staffCount,
      usersCount,
      stagedRegistryCount: stagedCount,
      activeClaimsCount: claimsCount,
      serverTime: new Date().toISOString(),
    };
  }

  private getDefaultDepartment(role: UserRole | string): string {
    switch (role) {
      case UserRole.ADMIN:
      case 'ADMIN':
        return 'მენეჯმენტი & IT ადმინისტრირება';
      case UserRole.ANALYST:
      case 'ANALYST':
        return 'რისკების ანალიტიკა & რეესტრი';
      case UserRole.OPERATOR:
      case 'OPERATOR':
        return 'ქოლ-ცენტრი & მოლაპარაკებები (CRM)';
      case UserRole.FIELD_OFFICER:
      case 'FIELD_OFFICER':
        return 'საველე მონიტორინგი & ინსპექცია';
      case UserRole.LEGAL:
      case 'LEGAL':
        return 'იურიდიული დეპარტამენტი & სააღსრულებო';
      default:
        return 'საოპერაციო დეპარტამენტი';
    }
  }
}
