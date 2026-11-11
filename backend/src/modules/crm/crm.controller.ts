import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmService, LogCallDto, SaveScheduleDto, RespondScheduleDto, AddDebtorContactDto } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST, UserRole.DEBTOR, UserRole.REGULAR)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('queue')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async getQueue(
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @CurrentUser() user?: any,
  ) {
    return await this.crmService.getQueue(search, priority, user);
  }

  @Get('claims/:id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST, UserRole.DEBTOR)
  async getClaimForCall(@Param('id') id: string) {
    return await this.crmService.getClaimForCall(id);
  }

  @Post('call-log')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async logCall(
    @Body() dto: LogCallDto,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.logCall(dto, user);
  }

  @Post('claims/:id/contacts')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async addDebtorContact(
    @Param('id') claimId: string,
    @Body() dto: AddDebtorContactDto,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.addDebtorContact(claimId, dto, user);
  }

  @Delete('claims/:id/contacts/:contactId')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async deleteDebtorContact(
    @Param('id') claimId: string,
    @Param('contactId') contactId: string,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.deleteDebtorContact(claimId, contactId, user);
  }

  @Post('claims/:id/schedule')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async saveClaimSchedule(
    @Param('id') claimId: string,
    @Body() dto: SaveScheduleDto,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.saveClaimSchedule(claimId, dto, user);
  }

  @Post('schedules/:id/respond')
  @Roles(UserRole.DEBTOR, UserRole.REGULAR, UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async respondToSchedule(
    @Param('id') scheduleId: string,
    @Body() dto: RespondScheduleDto,
    @CurrentUser() user: any,
  ) {
    return await this.crmService.respondToSchedule(scheduleId, dto, user);
  }

  @Get('stats')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.ANALYST)
  async getCrmStats(@CurrentUser() user: any) {
    const operatorId = user.role === UserRole.OPERATOR ? user.id : undefined;
    return await this.crmService.getCrmStats(operatorId);
  }

  @Public()
  @Roles()
  @Get('blog')
  async getBlogPosts() {
    return await this.crmService.getBlogPosts();
  }

  @Post('blog')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async createBlogPost(@Body() dto: any, @CurrentUser() user: any) {
    return await this.crmService.createBlogPost(dto, user);
  }

  @Delete('blog/:id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  async deleteBlogPost(@Param('id') id: string) {
    return await this.crmService.deleteBlogPost(id);
  }
}
