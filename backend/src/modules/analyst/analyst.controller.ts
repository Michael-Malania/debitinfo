import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Post('register-creditor')
  async registerCreditor(@Body() dto: any) {
    return await this.analystService.registerCreditor(dto);
  }

  @Post('creditors/:taxId/debtors')
  async addDebtorsToCreditor(
    @Param('taxId') taxId: string,
    @Body() body: { debtors: any[] },
  ) {
    return await this.analystService.addDebtorsToCreditor(taxId, body.debtors || []);
  }

  // ==========================================================================
  // SMART BI & ANALYTICS CONTROLLER ENDPOINTS
  // ==========================================================================

  @Get('bi/metadata')
  async getBiFilterMetadata() {
    return await this.analystService.getBiFilterMetadata();
  }

  @Post('bi/query')
  async biQuery(@Body() body: any) {
    return await this.analystService.biQuery(body || {});
  }

  @Get('bi/schedules-comparison')
  async getSchedulesComparison(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('compareYoY') compareYoY?: string,
  ) {
    return await this.analystService.getSchedulesComparison({
      dateFrom,
      dateTo,
      compareYoY: compareYoY === 'true' || compareYoY === '1',
    });
  }

  @Get('bi/legal-performance')
  async getLegalPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('lawyerId') lawyerId?: string,
  ) {
    return await this.analystService.getLegalPerformance({
      dateFrom,
      dateTo,
      lawyerId,
    });
  }

  @Get('bi/visitors-performance')
  async getVisitorsPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('officerId') officerId?: string,
  ) {
    return await this.analystService.getVisitorsPerformance({
      dateFrom,
      dateTo,
      officerId,
    });
  }

  @Get('bi/call-center-performance')
  async getCallCenterPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('hourFrom') hourFrom?: string,
    @Query('hourTo') hourTo?: string,
    @Query('operatorId') operatorId?: string,
    @Query('teamLeadId') teamLeadId?: string,
  ) {
    return await this.analystService.getCallCenterPerformance({
      dateFrom,
      dateTo,
      hourFrom: hourFrom ? Number(hourFrom) : undefined,
      hourTo: hourTo ? Number(hourTo) : undefined,
      operatorId,
      teamLeadId,
    });
  }

  @Get('bi/statute-limitations')
  async getStatuteLimitations(
    @Query('monthsLookback') monthsLookback?: string,
    @Query('monthsLookahead') monthsLookahead?: string,
  ) {
    return await this.analystService.getStatuteLimitations({
      monthsLookback: monthsLookback ? Number(monthsLookback) : undefined,
      monthsLookahead: monthsLookahead ? Number(monthsLookahead) : undefined,
    });
  }
}
