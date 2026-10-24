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

    return {
      kpis: {
        totalPrincipal,
        totalRecovered,
        recoveryRate: Math.round(recoveryRate * 10) / 10,
        activeClaimsCount: claims.length,
        activeDebtorsCount: activeDebtorsCount.size,
      },
      claims,
    };
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
}
