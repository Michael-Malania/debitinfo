import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { RsGeService } from '@/modules/rsge/rsge.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RsGeVerifyDto } from './dto/rsge-verify.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rsGeService: RsGeService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(reply, result.tokens);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(reply, result.tokens);
    return result;
  }

  @Public()
  @Post('rs-ge/verify')
  @HttpCode(HttpStatus.OK)
  async rsGeVerify(
    @Body() dto: RsGeVerifyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.rsGeVerify(dto);
    this.setAuthCookies(reply, result.tokens);
    return result;
  }

  @Public()
  @Get('rs-ge/taxpayer/:identCode')
  async getTaxpayerInfo(@Param('identCode') identCode: string) {
    return this.rsGeService.getTaxpayerPublicInfo(identCode);
  }

  @Public()
  @Get('rs-ge/status')
  async getRsGeStatus() {
    return {
      sandboxMode: this.rsGeService.isSandboxMode(),
      message: this.rsGeService.isSandboxMode()
        ? 'RS.GE Sandbox Adapter აქტიურია (ემულირებს ოფიციალურ პროტოკოლს)'
        : 'RS.GE Live სერვისი აქტიურია',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = dto.refreshToken || req.cookies?.['refresh_token'];
    const result = await this.authService.refreshTokens(token);
    this.setAuthCookies(reply, result.tokens);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/' });
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  private setAuthCookies(reply: FastifyReply, tokens: { accessToken: string; refreshToken: string }) {
    const isProduction = process.env.NODE_ENV === 'production';

    reply.setCookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }
}
