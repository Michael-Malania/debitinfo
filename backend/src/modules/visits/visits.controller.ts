import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  VisitsService,
  CompleteVisitTaskDto,
  CreateVisitTaskDto,
} from './visits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FIELD_OFFICER, UserRole.ADMIN, UserRole.ANALYST)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('tasks')
  async getTasks(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('district') district?: string,
  ) {
    return await this.visitsService.getTasks(user, status, district);
  }

  @Get('metrics')
  async getMetrics(@CurrentUser() user: any) {
    return await this.visitsService.getMetrics(user);
  }

  @Get('tasks/:id')
  async getTaskById(@Param('id') id: string) {
    return await this.visitsService.getTaskById(id);
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteVisitTaskDto,
    @CurrentUser() user: any,
  ) {
    return await this.visitsService.completeTask(id, dto, user);
  }

  @Post('tasks')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  async createTask(
    @Body() dto: CreateVisitTaskDto,
    @CurrentUser() user: any,
  ) {
    return await this.visitsService.createTask(dto, user);
  }
}
