import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OpsService, CreateStaffDto, UpdateStaffDto } from './ops.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('staff')
  async getStaffMembers() {
    return await this.opsService.getStaffMembers();
  }

  @Post('staff')
  async createStaffMember(@Body() dto: CreateStaffDto) {
    return await this.opsService.createStaffMember(dto);
  }

  @Patch('staff/:id')
  async updateStaffMember(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return await this.opsService.updateStaffMember(id, dto);
  }

  @Delete('staff/:id')
  async deleteStaffMember(@Param('id') id: string) {
    return await this.opsService.deleteStaffMember(id);
  }

  @Get('stats')
  async getOpsStats() {
    return await this.opsService.getOpsStats();
  }
}
