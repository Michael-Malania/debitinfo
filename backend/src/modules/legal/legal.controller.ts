import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  LegalService,
  UpdateLegalCaseDto,
  CreateTimelineEventDto,
  AddDocumentDto,
} from './legal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LEGAL, UserRole.ADMIN)
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('cases')
  async getLegalCases(
    @Query('stage') stage?: string,
    @Query('tab') tab?: string,
    @Query('search') search?: string,
    @Query('priority') priority?: string,
  ) {
    return await this.legalService.getLegalCases({ stage, tab, search, priority });
  }

  @Get('stats')
  async getLegalStats() {
    return await this.legalService.getLegalStats();
  }

  @Get('cases/:id')
  async getCaseById(@Param('id') id: string) {
    return await this.legalService.getCaseById(id);
  }

  @Patch('cases/:id')
  async updateCase(
    @Param('id') id: string,
    @Body() dto: UpdateLegalCaseDto,
    @CurrentUser() user: any,
  ) {
    return await this.legalService.updateCase(id, dto, user);
  }

  @Post('cases/:id/timeline')
  async addTimelineEvent(
    @Param('id') id: string,
    @Body() dto: CreateTimelineEventDto,
    @CurrentUser() user: any,
  ) {
    return await this.legalService.addTimelineEvent(id, dto, user);
  }

  @Post('cases/:id/documents')
  async addDocument(
    @Param('id') id: string,
    @Body() dto: AddDocumentDto,
  ) {
    return await this.legalService.addDocument(id, dto);
  }
}
