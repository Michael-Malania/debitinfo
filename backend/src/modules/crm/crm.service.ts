import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallDisposition, ClaimStatus, UserRole } from '@prisma/client';

export interface LogCallDto {
  claimId: string;
  disposition: CallDisposition;
  promisedDate?: string;
  promisedAmount?: number;
  notes: string;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get queue of claims that need calls / follow-up
   */
  async getQueue(search?: string, priority?: string) {
    const claims = await this.prisma.debtClaim.findMany({
      where: {
        status: {
          in: [
            ClaimStatus.ACTIVE,
            ClaimStatus.OVERDUE,
            ClaimStatus.DISPUTED,
            ClaimStatus.IN_LITIGATION,
            ClaimStatus.RESTRUCTURED,
          ],
        },
      },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
          },
        },
        creditor: {
          include: {
            companyProfile: true,
            individualProfile: true,
          },
        },
        crmLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        schedules: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: [{ daysOverdue: 'desc' }, { remainingAmount: 'desc' }],
    });

    let formatted = claims.map((c) => this.formatQueueItem(c));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      formatted = formatted.filter(
        (i) =>
          i.debtorName.toLowerCase().includes(q) ||
          i.debtorPersonalId.includes(q) ||
          i.debtorPhone.includes(q) ||
          i.caseNumber.toLowerCase().includes(q),
      );
    }

    if (priority === 'HIGH') {
      formatted = formatted.filter((i) => i.daysOverdue >= 60 || i.remainingAmount >= 10000);
    } else if (priority === 'CALLBACK') {
      formatted = formatted.filter((i) => i.lastDisposition === 'CALLBACK');
    }

    return formatted;
  }

  /**
   * Get claim details for the active call panel
   */
  async getClaimForCall(claimId: string) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: claimId },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
          },
        },
        creditor: {
          include: {
            companyProfile: true,
            individualProfile: true,
          },
        },
        crmLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: {
              include: { staffProfile: true },
            },
          },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        schedules: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
        paymentReceipts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${claimId} not found`);
    }

    return this.formatCallDetail(claim);
  }

  /**
   * Log a phone call result & disposition into PostgreSQL
   */
  async logCall(dto: LogCallDto, user: any) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: dto.claimId },
      include: {
        debtor: {
          include: {
            individualProfile: true,
            companyProfile: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${dto.claimId} not found`);
    }

    const log = await this.prisma.crmCallLog.create({
      data: {
        claimId: claim.id,
        operatorId: user.id,
        disposition: dto.disposition,
        promisedDate: dto.promisedDate ? new Date(dto.promisedDate) : null,
        promisedAmount: dto.promisedAmount ? dto.promisedAmount : null,
        notes: dto.notes,
      },
    });

    // Translate disposition for timeline
    const dispositionKa: Record<string, string> = {
      PROMISE_TO_PAY: 'დათანხმდა დაფარვას / შეპირება',
      REFUSED: 'კატეგორიული უარი დაფარვაზე',
      WRONG_NUMBER: 'ნომერი არასწორია / შეცვლილია',
      CALLBACK: 'დაინიშნა განმეორებითი გადარეკვა',
      VOICEMAIL: 'ხმოვანი ფოსტა / მიუწვდომელი',
      DISPUTE_RAISED: 'სადავო მოთხოვნა / პრეტენზია',
    };

    const dispLabel = dispositionKa[dto.disposition] || dto.disposition;
    const operatorName = user.staffProfile?.fullName || user.email;

    await this.prisma.caseTimelineEvent.create({
      data: {
        claimId: claim.id,
        authorId: user.id,
        department: 'CALL_CENTER',
        authorRoleTitle: `ქოლ-ცენტრის ოპერატორი - ${operatorName}`,
        actionType: 'CALL_MADE',
        description: `სატელეფონო ზარი განხორციელდა. შედეგი: ${dispLabel}. ${
          dto.promisedAmount ? `შეთანხმებული თანხა: ${dto.promisedAmount} ₾ (ვადა: ${dto.promisedDate || 'უახლოეს დღეებში'}). ` : ''
        }${dto.notes ? `კომენტარი: ${dto.notes}` : ''}`,
      },
    });

    // Update claim status if promise made
    if (dto.disposition === CallDisposition.PROMISE_TO_PAY) {
      await this.prisma.debtClaim.update({
        where: { id: claim.id },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }

    return log;
  }

  /**
   * Get CRM KPI metrics (calls today, promises, recovered amount)
   */
  async getCrmStats(operatorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereToday: any = {
      createdAt: { gte: today },
    };

    if (operatorId) {
      whereToday.operatorId = operatorId;
    }

    const todayLogs = await this.prisma.crmCallLog.findMany({
      where: whereToday,
      include: { claim: true },
    });

    const callsCount = todayLogs.length;
    const promisesCount = todayLogs.filter(
      (l) => l.disposition === CallDisposition.PROMISE_TO_PAY,
    ).length;
    const unreachableCount = todayLogs.filter(
      (l) =>
        l.disposition === CallDisposition.VOICEMAIL ||
        l.disposition === CallDisposition.WRONG_NUMBER,
    ).length;

    const promisedAmountTotal = todayLogs.reduce(
      (sum, l) => sum + Number(l.promisedAmount || 0),
      0,
    );

    return {
      callsToday: callsCount,
      dailyTarget: 60,
      promisesCount,
      unreachableCount,
      promisedAmountTotal,
      activeQueueCount: await this.prisma.debtClaim.count({
        where: { status: { in: [ClaimStatus.ACTIVE, ClaimStatus.OVERDUE, ClaimStatus.IN_LITIGATION] } },
      }),
    };
  }

  private formatQueueItem(c: any) {
    const isLegal = c.debtor.entityType === 'LEGAL';
    const debtorName = isLegal
      ? (c.debtor.companyProfile?.companyName || c.debtor.email)
      : (c.debtor.individualProfile
          ? `${c.debtor.individualProfile.firstName} ${c.debtor.individualProfile.lastName}`.trim()
          : c.debtor.email);

    const creditorName = c.creditor?.companyProfile?.companyName || c.creditor?.email || 'კრედიტორი';
    const lastLog = c.crmLogs && c.crmLogs.length > 0 ? c.crmLogs[0] : null;

    return {
      id: c.id,
      caseNumber: c.caseNumber,
      agreementNumber: c.agreementNumber,
      debtorName,
      debtorPersonalId: c.debtor.personalId,
      debtorPhone: c.debtor.phone || '+995 599 00 00 00',
      creditorName,
      initialAmount: Number(c.initialAmount),
      remainingAmount: Number(c.remainingAmount),
      penaltyAmount: Number(c.penaltyAmount),
      currency: c.currency,
      daysOverdue: c.daysOverdue,
      status: c.status,
      rating: c.rating,
      riskScore: c.riskScore,
      lastDisposition: lastLog?.disposition || null,
      lastCallDate: lastLog?.createdAt || null,
      lastCallNotes: lastLog?.notes || null,
    };
  }

  private formatCallDetail(c: any) {
    const isLegal = c.debtor.entityType === 'LEGAL';
    const debtorName = isLegal
      ? (c.debtor.companyProfile?.companyName || c.debtor.email)
      : (c.debtor.individualProfile
          ? `${c.debtor.individualProfile.firstName} ${c.debtor.individualProfile.lastName}`.trim()
          : c.debtor.email);

    const address = isLegal
      ? (c.debtor.companyProfile?.actualAddress || c.debtor.companyProfile?.legalAddress)
      : (c.debtor.individualProfile?.actualAddress || c.debtor.individualProfile?.legalAddress);

    return {
      id: c.id,
      caseNumber: c.caseNumber,
      agreementNumber: c.agreementNumber,
      debtorName,
      debtorPersonalId: c.debtor.personalId,
      debtorPhone: c.debtor.phone || '+995 599 00 00 00',
      debtorAddress: address || 'ქ. თბილისი',
      creditorName: c.creditor?.companyProfile?.companyName || c.creditor?.email,
      initialAmount: Number(c.initialAmount),
      remainingAmount: Number(c.remainingAmount),
      penaltyAmount: Number(c.penaltyAmount),
      currency: c.currency,
      daysOverdue: c.daysOverdue,
      status: c.status,
      rating: c.rating,
      riskScore: c.riskScore,
      crmLogs: c.crmLogs.map((l: any) => ({
        id: l.id,
        operatorName: l.operator?.staffProfile?.fullName || l.operator?.email,
        disposition: l.disposition,
        promisedDate: l.promisedDate,
        promisedAmount: l.promisedAmount ? Number(l.promisedAmount) : null,
        notes: l.notes,
        createdAt: l.createdAt,
      })),
      timelineEvents: c.timelineEvents.map((e: any) => ({
        id: e.id,
        authorRoleTitle: e.authorRoleTitle,
        actionType: e.actionType,
        description: e.description,
        createdAt: e.createdAt,
      })),
      supportingDocuments: c.supportingDocuments || [
        {
          id: 'doc-01',
          title: 'სასაქონლო ზედნადები (RS.GE #WAYBILL-8841)',
          docType: 'WAYBILL',
          fileName: 'rs_waybill_8841.pdf',
          fileUrl: '/documents/rs_waybill_8841.pdf',
          fileSize: '1.2 MB',
          description: 'საქონლის მიწოდების ოფიციალური საგადასახადო ზედნადები',
        },
        {
          id: 'doc-02',
          title: 'ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი',
          docType: 'ACCOUNT_TURNOVER',
          fileName: 'brunviti_barati_2024.xlsx',
          fileUrl: '/documents/brunviti_barati_2024.xlsx',
          fileSize: '480 KB',
          description: 'ურთიერთშედარების აქტი და ბრუნვის ამონაწერი Excel ფორმატში',
        },
        {
          id: 'doc-03',
          title: 'ხელშეკრულება & მიღება-ჩაბარების აქტი #AGR-8841',
          docType: 'CONTRACT',
          fileName: 'khelshekruleba_8841.pdf',
          fileUrl: '/documents/khelshekruleba_8841.pdf',
          fileSize: '2.4 MB',
          description: 'მხარეთა შორის გაფორმებული საკრედიტო ხელშეკრულება',
        },
      ],
      paymentReceipts: c.paymentReceipts || [],
      schedules: c.schedules || [],
    };
  }
}
