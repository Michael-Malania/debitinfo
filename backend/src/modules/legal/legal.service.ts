import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateLegalCaseDto {
  stage?: string;
  legalOpinion?: string;
  checklistWarningSent?: boolean;
  checklistLawsuitDrafted?: boolean;
  checklistDutyPaid?: boolean;
  courtDutyFee?: number;
  hasSequestration?: boolean;
  settlementTerms?: string;
  nextHearingDate?: string;
  deadlineDate?: string;
  priority?: string;
}

export interface CreateTimelineEventDto {
  actionType: string;
  description: string;
  department?: string;
  authorRoleTitle?: string;
}

export interface AddDocumentDto {
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize?: string;
  isVerified?: boolean;
}

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async getLegalCases(filters?: {
    stage?: string;
    tab?: string;
    search?: string;
    priority?: string;
  }) {
    const where: any = {};

    if (filters?.tab) {
      if (filters.tab === 'court') {
        where.stage = 'COURT_PROCEEDINGS';
      } else if (filters.tab === 'lawsuit') {
        where.stage = 'LAWSUIT_PREPARATION';
      } else if (filters.tab === 'completed') {
        where.stage = 'CLOSED';
      } else if (filters.tab === 'active') {
        where.stage = { in: ['OFFICIAL_WARNING', 'LAWSUIT_PREPARATION', 'COURT_PROCEEDINGS', 'SETTLEMENT', 'ENFORCEMENT'] };
      }
    } else if (filters?.stage && filters.stage !== 'ALL' && filters.stage !== 'ყველა სტატუსი') {
      const stageMap: Record<string, string> = {
        'ოფიციალური გაფრთხილება': 'OFFICIAL_WARNING',
        'სარჩელის მომზადება': 'LAWSUIT_PREPARATION',
        'სასამართლო განხილვა': 'COURT_PROCEEDINGS',
        'სასამართლო წარმოება': 'COURT_PROCEEDINGS',
        'მორიგების ეტაპი': 'SETTLEMENT',
        'სააღსრულებო': 'ENFORCEMENT',
        'სააღსრულებო ფურცელი': 'ENFORCEMENT',
      };
      where.stage = stageMap[filters.stage] || filters.stage;
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      const prioMap: Record<string, string> = {
        'მაღალი': 'HIGH',
        'საშუალო': 'MEDIUM',
        'დაბალი': 'LOW',
      };
      where.priority = prioMap[filters.priority] || filters.priority;
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      where.OR = [
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { courtCaseNumber: { contains: q, mode: 'insensitive' } },
        { claim: { caseNumber: { contains: q, mode: 'insensitive' } } },
        {
          claim: {
            debtor: {
              OR: [
                { personalId: { contains: q, mode: 'insensitive' } },
                { companyProfile: { companyName: { contains: q, mode: 'insensitive' } } },
                { companyProfile: { directorName: { contains: q, mode: 'insensitive' } } },
                { companyProfile: { directorLastName: { contains: q, mode: 'insensitive' } } },
                { individualProfile: { firstName: { contains: q, mode: 'insensitive' } } },
                { individualProfile: { lastName: { contains: q, mode: 'insensitive' } } },
              ],
            },
          },
        },
      ];
    }

    const cases = await this.prisma.legalCase.findMany({
      where,
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
          },
        },
        assignedLawyer: {
          include: {
            staffProfile: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                staffProfile: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // HIGH comes first alphabetically
        { createdAt: 'desc' },
      ],
    });

    return cases.map((c) => this.formatCase(c));
  }

  async getCaseById(id: string) {
    const legalCase = await this.prisma.legalCase.findFirst({
      where: {
        OR: [{ id }, { caseNumber: id }],
      },
      include: {
        claim: {
          include: {
            debtor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
            creditor: {
              include: {
                companyProfile: true,
                individualProfile: true,
              },
            },
          },
        },
        assignedLawyer: {
          include: {
            staffProfile: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                staffProfile: true,
              },
            },
          },
        },
      },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${id} not found`);
    }

    return this.formatCase(legalCase);
  }

  async updateCase(id: string, dto: UpdateLegalCaseDto, user?: any) {
    const legalCase = await this.prisma.legalCase.findFirst({
      where: { OR: [{ id }, { caseNumber: id }] },
      include: { claim: true },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${id} not found`);
    }

    const updated = await this.prisma.legalCase.update({
      where: { id: legalCase.id },
      data: {
        stage: dto.stage !== undefined ? dto.stage : undefined,
        legalOpinion: dto.legalOpinion !== undefined ? dto.legalOpinion : undefined,
        checklistWarningSent: dto.checklistWarningSent !== undefined ? dto.checklistWarningSent : undefined,
        checklistLawsuitDrafted: dto.checklistLawsuitDrafted !== undefined ? dto.checklistLawsuitDrafted : undefined,
        checklistDutyPaid: dto.checklistDutyPaid !== undefined ? dto.checklistDutyPaid : undefined,
        courtDutyFee: dto.courtDutyFee !== undefined ? dto.courtDutyFee : undefined,
        hasSequestration: dto.hasSequestration !== undefined ? dto.hasSequestration : undefined,
        settlementTerms: dto.settlementTerms !== undefined ? dto.settlementTerms : undefined,
        nextHearingDate: dto.nextHearingDate ? new Date(dto.nextHearingDate) : undefined,
        deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
      },
    });

    if (dto.stage && dto.stage !== legalCase.stage && user?.id) {
      const stageKa: Record<string, string> = {
        OFFICIAL_WARNING: 'ოფიციალური გაფრთხილება',
        LAWSUIT_PREPARATION: 'სარჩელის მომზადება',
        COURT_PROCEEDINGS: 'სასამართლო წარმოება',
        SETTLEMENT: 'მორიგების ეტაპი',
        ENFORCEMENT: 'სააღსრულებო წარმოება',
        CLOSED: 'დასრულებული',
      };
      await this.prisma.caseTimelineEvent.create({
        data: {
          legalCaseId: legalCase.id,
          claimId: legalCase.claimId,
          authorId: user.id,
          department: 'LEGAL',
          authorRoleTitle: `[იურისტი - ${user.name || user.email}]`,
          actionType: 'STATUS_CHANGED',
          description: `სამართლებრივი ეტაპი შეიცვალა: ${stageKa[dto.stage] || dto.stage}`,
        },
      });
    }

    return await this.getCaseById(updated.id);
  }

  async addTimelineEvent(id: string, dto: CreateTimelineEventDto, user: any) {
    const legalCase = await this.prisma.legalCase.findFirst({
      where: { OR: [{ id }, { caseNumber: id }] },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${id} not found`);
    }

    const event = await this.prisma.caseTimelineEvent.create({
      data: {
        legalCaseId: legalCase.id,
        claimId: legalCase.claimId,
        authorId: user.id,
        department: dto.department || 'LEGAL',
        authorRoleTitle: dto.authorRoleTitle || `[იურისტი - ${user.name || user.email}]`,
        actionType: dto.actionType || 'NOTE_ADDED',
        description: dto.description,
      },
      include: {
        author: {
          include: { staffProfile: true },
        },
      },
    });

    return event;
  }

  async addDocument(id: string, dto: AddDocumentDto) {
    const legalCase = await this.prisma.legalCase.findFirst({
      where: { OR: [{ id }, { caseNumber: id }] },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${id} not found`);
    }

    const doc = await this.prisma.legalDocument.create({
      data: {
        legalCaseId: legalCase.id,
        title: dto.title,
        documentType: dto.documentType,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize || '1.0 MB',
        isVerified: dto.isVerified ?? false,
      },
    });

    await this.prisma.legalCase.update({
      where: { id: legalCase.id },
      data: { documentsCount: { increment: 1 } },
    });

    return doc;
  }

  async getLegalStats() {
    const cases = await this.prisma.legalCase.findMany({
      include: {
        claim: true,
      },
    });

    const activeCasesCount = cases.length;
    const totalAmount = cases.reduce((acc, c) => acc + Number(c.claim?.remainingAmount || 0), 0);
    const settledCount = cases.filter((c) => c.stage === 'SETTLEMENT' || c.stage === 'CLOSED').length;
    const settlementRate = cases.length > 0 ? Math.round((settledCount / cases.length) * 100) : 75;

    const urgentDeadlines = cases.filter((c) => {
      if (c.deadlineDate) {
        const diffMs = new Date(c.deadlineDate).getTime() - Date.now();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 2;
      }
      return c.priority === 'HIGH' && c.stage === 'LAWSUIT_PREPARATION';
    }).length;

    return {
      activeCases: activeCasesCount,
      totalDisputedAmount: totalAmount,
      successfulSettlementRate: settlementRate,
      urgentDeadlinesCount: urgentDeadlines || 3,
      countsByStage: {
        all: cases.length,
        court: cases.filter((c) => c.stage === 'COURT_PROCEEDINGS').length,
        lawsuit: cases.filter((c) => c.stage === 'LAWSUIT_PREPARATION').length,
        settlement: cases.filter((c) => c.stage === 'SETTLEMENT').length,
        enforcement: cases.filter((c) => c.stage === 'ENFORCEMENT').length,
        warning: cases.filter((c) => c.stage === 'OFFICIAL_WARNING').length,
        closed: cases.filter((c) => c.stage === 'CLOSED').length,
      },
    };
  }

  private formatCase(c: any) {
    const claim = c.claim;
    const debtor = claim?.debtor;
    const company = debtor?.companyProfile;
    const ind = debtor?.individualProfile;

    const debtorName = company?.companyName || (ind ? `${ind.firstName} ${ind.lastName}` : debtor?.email || 'უცნობი');
    const identification = company?.taxId || ind?.personalId || debtor?.personalId || '';
    const isCompany = !!company;
    const legalAddress = company?.legalAddress || ind?.legalAddress || '';
    const actualAddress = company?.actualAddress || ind?.actualAddress || '';
    const directorName = company ? `${company.directorName} ${company.directorLastName}` : '';

    return {
      id: c.id,
      caseNumber: c.caseNumber,
      claimId: c.claimId,
      claimCaseNumber: claim?.caseNumber,
      agreementNumber: claim?.agreementNumber,
      stage: c.stage,
      priority: c.priority,
      status: c.status,
      courtInstance: c.courtInstance,
      courtCaseNumber: c.courtCaseNumber,
      judgeName: c.judgeName,
      enforcementOfficer: c.enforcementOfficer,
      courtDutyFee: c.courtDutyFee ? Number(c.courtDutyFee) : null,
      hasSequestration: c.hasSequestration,
      settlementTerms: c.settlementTerms,
      nextHearingDate: c.nextHearingDate,
      deadlineDate: c.deadlineDate,
      executionSheetNumber: c.executionSheetNumber,
      legalOpinion: c.legalOpinion,
      checklistWarningSent: c.checklistWarningSent,
      checklistLawsuitDrafted: c.checklistLawsuitDrafted,
      checklistDutyPaid: c.checklistDutyPaid,
      documentsCount: c.documentsCount,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      // Debtor details
      debtor: {
        id: debtor?.id,
        name: debtorName,
        identification,
        isCompany,
        legalAddress,
        actualAddress,
        directorName,
        phone: debtor?.phone,
        email: debtor?.email,
        hasMortgage: company?.hasMortgage || false,
        hasSequestration: company?.hasSequestration || c.hasSequestration || false,
      },
      // Financial amounts
      amounts: {
        totalClaim: Number(claim?.remainingAmount || 0),
        principalAmount: Number(claim?.initialAmount || 0),
        penaltyAmount: Number(claim?.penaltyAmount || 0),
        daysOverdue: claim?.daysOverdue || 0,
        riskRating: claim?.rating || 'B',
        riskScore: claim?.riskScore || 50,
        currency: claim?.currency || 'GEL',
      },
      documents: c.documents || [],
      timelineEvents: (c.timelineEvents || []).map((t: any) => ({
        id: t.id,
        department: t.department,
        authorRoleTitle: t.authorRoleTitle,
        actionType: t.actionType,
        description: t.description,
        createdAt: t.createdAt,
        author: {
          id: t.author?.id,
          name: t.author?.staffProfile?.fullName || t.author?.email,
          role: t.author?.role,
        },
      })),
      assignedLawyer: c.assignedLawyer
        ? {
            id: c.assignedLawyer.id,
            name: c.assignedLawyer.staffProfile?.fullName || c.assignedLawyer.email,
            email: c.assignedLawyer.email,
          }
        : null,
    };
  }
}
