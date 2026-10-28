import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all liabilities for the currently authenticated debtor
   */
  async getDebtorLiabilities(debtorUserId: string) {
    const claims = await this.prisma.debtClaim.findMany({
      where: { debtorId: debtorUserId },
      include: {
        creditor: {
          select: {
            id: true,
            email: true,
            personalId: true,
            companyProfile: true,
          },
        },
        schedules: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
        disputes: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregated KPI summary
    let totalInitial = 0;
    let totalRemaining = 0;
    let totalPaid = 0;
    let activeDisputesCount = 0;

    claims.forEach((c) => {
      const init = Number(c.initialAmount) || 0;
      const rem = Number(c.remainingAmount) || 0;
      totalInitial += init;
      totalRemaining += rem;
      totalPaid += Math.max(0, init - rem);
      activeDisputesCount += c.disputes.filter((d) => d.status === 'OPEN').length;
    });

    return {
      summary: {
        totalInitial,
        totalRemaining,
        totalPaid,
        activeClaimsCount: claims.length,
        activeDisputesCount,
        rating: claims[0]?.rating || 'B',
        riskScore: claims[0]?.riskScore || 68,
      },
      claims,
    };
  }

  /**
   * Get all claims portfolio for the currently authenticated creditor
   */
  async getCreditorClaims(creditorUserId: string) {
    const claims = await this.prisma.debtClaim.findMany({
      where: { creditorId: creditorUserId },
      include: {
        debtor: {
          select: {
            id: true,
            email: true,
            personalId: true,
            individualProfile: true,
          },
        },
        schedules: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
        payments: true,
        disputes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalPrincipal = 0;
    let totalRecovered = 0;
    let activeDebtorsCount = new Set<string>();

    claims.forEach((c) => {
      const init = Number(c.initialAmount) || 0;
      const rem = Number(c.remainingAmount) || 0;
      totalPrincipal += init;
      totalRecovered += Math.max(0, init - rem);
      activeDebtorsCount.add(c.debtorId);
    });

    const recoveryRate = totalPrincipal > 0 ? (totalRecovered / totalPrincipal) * 100 : 0;

    const dbConfigs = await this.prisma.claimStatusConfig.findMany();
    const statusConfigsMap: Record<string, any> = {};
    dbConfigs.forEach((cfg) => {
      statusConfigsMap[cfg.code] = cfg;
    });

    const enrichedClaims = claims.map((c) => ({
      ...c,
      statusConfig: statusConfigsMap[c.status] || {
        code: c.status,
        label: c.status,
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
        borderClass: 'border-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        colorHex: '#059669',
      },
    }));

    return {
      kpis: {
        totalPrincipal,
        totalRecovered,
        recoveryRate: Math.round(recoveryRate * 10) / 10,
        activeClaimsCount: claims.length,
        activeDebtorsCount: activeDebtorsCount.size,
      },
      statusConfigs: statusConfigsMap,
      claims: enrichedClaims,
    };
  }

  /**
   * Get all database-driven claim status configurations
   */
  async getStatusConfigs() {
    return this.prisma.claimStatusConfig.findMany({
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Open a dispute on a specific claim
   */
  async openDispute(debtorUserId: string, claimId: string, reason: string) {
    const claim = await this.prisma.debtClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('სასარჩელო მოთხოვნა ვერ მოიძებნა');
    }

    if (claim.debtorId !== debtorUserId) {
      throw new ForbiddenException('თქვენ არ გაქვთ უფლება გახსნათ დავა ამ საქმეზე');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        claimId,
        reason,
        status: 'OPEN',
      },
    });

    await this.prisma.debtClaim.update({
      where: { id: claimId },
      data: { status: 'DISPUTED' },
    });

    return dispute;
  }

  /**
   * Creditor imports debtors batch (via Excel template or manual modal)
   * These arrive with status 'PENDING_VERIFICATION' for the Analyst to cross-check in RS.GE
   */
  async importCreditorDebtors(creditorUserId: string, debtors: any[]) {
    const creditor = await this.prisma.user.findUnique({
      where: { id: creditorUserId },
      include: { companyProfile: true },
    });
    const creditorName = creditor?.companyProfile?.companyName || creditor?.email || 'კრედიტორი';

    const createdItems = [];
    for (const d of debtors) {
      const item = await this.prisma.stagedRegistryItem.create({
        data: {
          type: 'DEBTOR',
          personalId: d.personalId || d.taxId || '01019012345',
          name: d.name || d.fullName || 'ახალი დებიტორი',
          companyOrPerson: d.entityType === 'LEGAL' ? 'იურიდიული პირი' : 'ფიზიკური პირი',
          agreementNumber: d.agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
          amount: Number(d.amount) || 0,
          creditorName,
          overdueDays: Number(d.overdueDays) || 0,
          status: 'PENDING_VERIFICATION',
          sourceFile: d.sourceFile || 'creditor_upload.xlsx',
        },
      });
      createdItems.push(item);
    }
    return { success: true, count: createdItems.length, items: createdItems };
  }

  /**
   * Get all debtors uploaded by this creditor (including PENDING_VERIFICATION and VERIFIED)
   */
  async getCreditorUploadedDebtors(creditorUserId: string) {
    const creditor = await this.prisma.user.findUnique({
      where: { id: creditorUserId },
      include: { companyProfile: true },
    });
    const creditorName = creditor?.companyProfile?.companyName || creditor?.email;
    return this.prisma.stagedRegistryItem.findMany({
      where: {
        type: 'DEBTOR',
        creditorName: creditorName,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
