import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmService, LogCallDto } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('queue')
  async getQueue(
    @Query('search') search?: string,
    @Query('priority') priority?: string,
  ) {
    return await this.crmService.getQueue(search, priority);
  }

  @Get('claims/:id')
  async getClaimForCall(@Param('id') id: string) {
    return await this.crmService.getClaimForCall(id);
  }

  @Post('call-log')
  async logCall(
    @Body() dto: LogCallDto,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.logCall(dto, user);
  }

  @Get('stats')
  async getCrmStats(@CurrentUser() user: any) {
    const operatorId = user.role === UserRole.OPERATOR ? user.id : undefined;
    return await this.crmService.getCrmStats(operatorId);
  }
}
