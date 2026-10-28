import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AnalystService, AssignRoleDto, DispatchTaskDto } from './analyst.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/analyst')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ANALYST, UserRole.ADMIN)
export class AnalystController {
  constructor(private readonly analystService: AnalystService) {}

  @Get('users')
  async getRegisteredUsers() {
    return await this.analystService.getRegisteredUsers();
  }

  @Get('excel-registry/debtors')
  async getExcelDebtors() {
    return await this.analystService.getExcelDebtors();
  }

  @Get('excel-registry/creditors')
  async getExcelCreditors() {
    return await this.analystService.getExcelCreditors();
  }

  @Get('staff-options')
  async getStaffOptions() {
    return await this.analystService.getStaffOptions();
  }

  @Get('claims-options')
  async getClaimsOptions() {
    return await this.analystService.getClaimsOptions();
  }

  @Get('workload-stats')
  async getWorkloadStats() {
    return await this.analystService.getWorkloadStats();
  }

  @Post('assign-role')
  async assignRole(@Body() dto: AssignRoleDto) {
    return await this.analystService.assignRole(dto);
  }

  @Post('excel-sync')
  async syncExcelData(@Body() body: { items?: any[] }) {
    return await this.analystService.syncExcelData(body?.items);
  }

  @Post('dispatch-task')
  async dispatchTask(
    @Body() dto: DispatchTaskDto,
    @CurrentUser() user: any,
  ) {
    return await this.analystService.dispatchTask(dto, user);
  }

  @Get('pending-debtors')
  async getPendingDebtors() {
    return await this.analystService.getPendingDebtors();
  }

  @Post('verify-debtor/:id')
  async verifyDebtor(@Param('id') id: string) {
    return await this.analystService.verifyDebtor(id);
  }
}
