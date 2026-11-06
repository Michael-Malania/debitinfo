import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, PaymentReceiptStatus, PaymentStatus, ClaimStatus } from '@prisma/client';

export interface SubmitDebtorReceiptDto {
  claimId?: string;
  amount: number;
  paymentDate?: string;
  receiptFileUrl?: string;
  debtorNotes?: string;
}

export interface ConfirmByCreditorDto {
  confirmationReceiptUrl?: string;
  notes?: string;
}

export interface ConfirmByAccountantDto {
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1 & 2: Debtor submits payment receipt
   */
  async submitDebtorReceipt(dto: SubmitDebtorReceiptDto, user: any) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('გთხოვთ მიუთითოთ ვალიდური გადახდილი თანხა');
    }

    // Find the claim associated with this debtor
    let claim: any = null;
    if (dto.claimId) {
      claim = await this.prisma.debtClaim.findUnique({
        where: { id: dto.claimId },
        include: { creditor: { include: { companyProfile: true } }, debtor: { include: { individualProfile: true } } },
      });
    } else {
      claim = await this.prisma.debtClaim.findFirst({
        where: { debtorId: user.id },
        include: { creditor: { include: { companyProfile: true } }, debtor: { include: { individualProfile: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!claim) {
      // Fallback to first active claim if none tied directly
      claim = await this.prisma.debtClaim.findFirst({
        include: { creditor: { include: { companyProfile: true } }, debtor: { include: { individualProfile: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!claim) {
      throw new NotFoundException('აქტიური საკრედიტო საქმე ვერ მოიძებნა');
    }

    const debtorName = user.individualProfile
      ? `${user.individualProfile.firstName} ${user.individualProfile.lastName}`.trim()
      : user.companyProfile?.companyName || user.email;

    const creditorName = claim.creditor?.companyProfile?.companyName || claim.creditor?.email || 'კრედიტორი';

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        claimId: claim.id,
        debtorId: user.id || claim.debtorId,
        debtorName,
        creditorId: claim.creditorId,
        creditorName,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        receiptNumber,
        receiptFileUrl: dto.receiptFileUrl || `/receipts/transfer_${receiptNumber}.pdf`,
        debtorNotes: dto.debtorNotes || 'გადახდის ქვითარი ატვირთულია დებიტორის მიერ',
        status: PaymentReceiptStatus.PENDING_CONFIRMATION,
      },
    });

    return receipt;
  }

  /**
   * Get Debtor payments & receipt history
   */
  async getDebtorPayments(user: any) {
    const receipts = await this.prisma.paymentReceipt.findMany({
      where: user?.role === UserRole.DEBTOR ? { debtorId: user.id } : undefined,
      orderBy: { paymentDate: 'desc' },
    });

    return receipts;
  }

  /**
   * 3 & 4: Get Creditor's pending and historical receipts
   */
  async getCreditorPayments(user: any) {
    const receipts = await this.prisma.paymentReceipt.findMany({
      where: user?.role === UserRole.CREDITOR ? { creditorId: user.id } : undefined,
      orderBy: { paymentDate: 'desc' },
    });

    const pendingCount = receipts.filter(r => r.status === PaymentReceiptStatus.PENDING_CONFIRMATION).length;
    const confirmedCount = receipts.filter(r => r.status !== PaymentReceiptStatus.PENDING_CONFIRMATION).length;

    return {
      receipts,
      metrics: {
        totalReceipts: receipts.length,
        pendingCount,
        confirmedCount,
      },
    };
  }

  /**
   * Shared transactional helper for confirming a payment receipt idempotently
   * and synchronizing DebtClaim, StagedRegistryItem, PaymentTransaction, and RepaymentInstallment
   */
  private async processReceiptConfirmation(
    receiptId: string,
    buildReceiptUpdate: (receipt: any, alreadyConfirmed: boolean) => any,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.paymentReceipt.findUnique({
        where: { id: receiptId },
        include: {
          claim: {
            include: {
              debtor: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new NotFoundException('ქვითარი ვერ მოიძებნა');
      }

      const alreadyConfirmed =
        receipt.status === PaymentReceiptStatus.CONFIRMED_BY_CREDITOR ||
        receipt.status === PaymentReceiptStatus.CONFIRMED_BY_ACCOUNTANT;

      const updated = await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: buildReceiptUpdate(receipt, alreadyConfirmed),
      });

      // Only deduct balance and allocate installments on the first confirmation
      if (!alreadyConfirmed && receipt.claim) {
        const paidAmt = Number(receipt.amount || 0);
        const currentRemaining = Number(receipt.claim.remainingAmount || 0);
        const newRemaining = Math.max(0, Math.round((currentRemaining - paidAmt) * 100) / 100);
        const newStatus = newRemaining === 0 ? ClaimStatus.SETTLED : receipt.claim.status;

        await tx.debtClaim.update({
          where: { id: receipt.claimId },
          data: {
            remainingAmount: newRemaining,
            status: newStatus,
            lastActivityAt: new Date(),
          },
        });

        // Upsert PaymentTransaction for BI Analytics & Ledger
        const txRef = receipt.receiptNumber || `RCP-${receipt.id}`;
        await tx.paymentTransaction.upsert({
          where: { transactionRef: txRef },
          update: {
            amount: paidAmt,
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
          },
          create: {
            claimId: receipt.claimId,
            amount: paidAmt,
            currency: 'GEL',
            provider: 'BANK_TRANSFER',
            transactionRef: txRef,
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
          },
        });

        // FIFO allocation across unpaid RepaymentInstallment rows
        const unpaidInstallments = await tx.repaymentInstallment.findMany({
          where: {
            schedule: { claimId: receipt.claimId, isActive: true },
            isPaid: false,
          },
          orderBy: { installmentNo: 'asc' },
        });

        let remainingToAllocate = paidAmt;
        for (const inst of unpaidInstallments) {
          if (remainingToAllocate <= 0) break;
          const instTotal = Number(inst.amount || 0);
          const instPaid = Number(inst.paidAmount || 0);
          const instNeed = Math.max(0, instTotal - instPaid);
          if (instNeed <= 0) continue;

          const applied = Math.min(remainingToAllocate, instNeed);
          const newInstPaid = Math.round((instPaid + applied) * 100) / 100;
          const isNowPaid = newInstPaid >= instTotal - 0.01;
          remainingToAllocate = Math.max(0, Math.round((remainingToAllocate - applied) * 100) / 100);

          await tx.repaymentInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: newInstPaid,
              isPaid: isNowPaid,
              paidAt: isNowPaid ? new Date() : inst.paidAt,
            },
          });
        }

        // Synchronize linked StagedRegistryItem balance and status
        const debtorPin = receipt.claim.debtor?.personalId;
        const agrNum = receipt.claim.agreementNumber;
        const stagedCandidates = await tx.stagedRegistryItem.findMany({
          where: {
            type: 'DEBTOR',
            OR: [
              { matchedUserId: receipt.debtorId },
              ...(debtorPin ? [{ personalId: debtorPin }, { taxId: debtorPin }] : []),
              ...(agrNum ? [{ agreementNumber: agrNum }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const exactStaged =
          stagedCandidates.find((s) => agrNum && s.agreementNumber === agrNum) ||
          stagedCandidates[0];

        if (exactStaged) {
          await tx.stagedRegistryItem.update({
            where: { id: exactStaged.id },
            data: {
              amount: newRemaining,
              status: newRemaining === 0 ? 'CLOSED' : exactStaged.status,
              matchedUserId: receipt.debtorId || exactStaged.matchedUserId,
            },
          });
        }
      }

      return updated;
    });
  }

  /**
   * 4: Creditor confirms receipt of payment
   */
  async confirmByCreditor(receiptId: string, dto: ConfirmByCreditorDto, user: any) {
    const creditorName =
      user?.companyProfile?.companyName || user?.email || 'შპს ჯეო ტრეიდინგი (კრედიტორი)';

    return this.processReceiptConfirmation(receiptId, (receipt) => ({
      status: PaymentReceiptStatus.CONFIRMED_BY_CREDITOR,
      confirmedByRole: UserRole.CREDITOR,
      confirmedByUserId: user?.id,
      confirmedByUserName: `${creditorName}`,
      confirmationReceiptUrl:
        dto.confirmationReceiptUrl || `/receipts/creditor_confirm_${receipt.receiptNumber}.pdf`,
      confirmedAt: new Date(),
    }));
  }

  /**
   * 5 & 6: Accountant retrieves all payments & pending queue
   */
  async getAccountantPayments() {
    const receipts = await this.prisma.paymentReceipt.findMany({
      orderBy: { paymentDate: 'desc' },
      include: {
        claim: {
          select: {
            caseNumber: true,
            remainingAmount: true,
            initialAmount: true,
          },
        },
      },
    });

    const pendingList = receipts.filter(r => r.status === PaymentReceiptStatus.PENDING_CONFIRMATION);
    const confirmedByCreditor = receipts.filter(r => r.status === PaymentReceiptStatus.CONFIRMED_BY_CREDITOR);
    const confirmedByAccountant = receipts.filter(r => r.status === PaymentReceiptStatus.CONFIRMED_BY_ACCOUNTANT);

    const totalConfirmedGEL = [...confirmedByCreditor, ...confirmedByAccountant].reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    return {
      receipts,
      metrics: {
        totalCount: receipts.length,
        pendingCount: pendingList.length,
        confirmedByCreditorCount: confirmedByCreditor.length,
        confirmedByAccountantCount: confirmedByAccountant.length,
        totalConfirmedGEL,
      },
    };
  }

  /**
   * 6: Accountant confirms payment on behalf of creditor and generates official order
   */
  async confirmByAccountant(receiptId: string, dto: ConfirmByAccountantDto, user: any) {
    const orderNumber = `ACC-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const accountantName = user?.staffProfile?.fullName || 'მარიამ წიკლაური (მთავარი ბუღალტერი)';

    return this.processReceiptConfirmation(receiptId, () => ({
      status: PaymentReceiptStatus.CONFIRMED_BY_ACCOUNTANT,
      confirmedByRole: UserRole.ACCOUNTANT,
      confirmedByUserId: user?.id,
      confirmedByUserName: accountantName,
      accountantOrderNumber: orderNumber,
      accountantOrderNotes:
        dto.notes || 'დადასტურებულია კრედიტორის სატელეფონო დასტურის საფუძველზე',
      confirmedAt: new Date(),
    }));
  }

  /**
   * 8: Document metadata / printable voucher details
   */
  async getReceiptDocument(receiptId: string) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: { claim: true },
    });

    if (!receipt) {
      throw new NotFoundException('დოკუმენტი ვერ მოიძებნა');
    }

    return {
      receipt,
      documentType:
        receipt.status === PaymentReceiptStatus.CONFIRMED_BY_ACCOUNTANT
          ? 'ACCOUNTANT_CONFIRMATION_ORDER'
          : 'CREDITOR_PAYMENT_RECEIPT',
    };
  }
}
