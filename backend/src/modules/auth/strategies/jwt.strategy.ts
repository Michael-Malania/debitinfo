import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  personalId: string;
  role: string;
  entityType: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: FastifyRequest) => {
          if (request?.cookies && request.cookies['access_token']) {
            return request.cookies['access_token'];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'debitinfo-super-secret-access-token-key-2024'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        individualProfile: true,
        companyProfile: true,
        staffProfile: true,
      },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა ან ანგარიში შეჩერებულია');
    }

    return user;
  }
}
