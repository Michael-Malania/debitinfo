import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, User } from '@prisma/client';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('debtor/my-liabilities')
  @Roles(UserRole.DEBTOR, UserRole.ADMIN)
  async getMyLiabilities(@CurrentUser() user: User) {
    return this.claimsService.getDebtorLiabilities(user.id);
  }

  @Get('creditor/my-claims')
  @Roles(UserRole.CREDITOR, UserRole.ADMIN)
  async getMyClaims(@CurrentUser() user: User) {
    return this.claimsService.getCreditorClaims(user.id);
  }

  @Post('debtor/claims/:id/dispute')
  @Roles(UserRole.DEBTOR, UserRole.ADMIN)
  async openDispute(
    @CurrentUser('id') userId: string,
    @Param('id') claimId: string,
    @Body('reason') reason: string,
  ) {
    return this.claimsService.openDispute(userId, claimId, reason || 'დავის გახსნა დებიტორის მიერ');
  }
}
