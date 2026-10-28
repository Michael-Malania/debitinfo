import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, PaymentReceiptStatus } from '@prisma/client';

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
   * 4: Creditor confirms receipt of payment
   */
  async confirmByCreditor(receiptId: string, dto: ConfirmByCreditorDto, user: any) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: { claim: true },
    });

    if (!receipt) {
      throw new NotFoundException('ქვითარი ვერ მოიძებნა');
    }

    const creditorName = user?.companyProfile?.companyName || user?.email || 'შპს ჯეო ტრეიდინგი (კრედიტორი)';

    const updated = await this.prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        status: PaymentReceiptStatus.CONFIRMED_BY_CREDITOR,
        confirmedByRole: UserRole.CREDITOR,
        confirmedByUserId: user?.id,
        confirmedByUserName: `${creditorName}`,
        confirmationReceiptUrl: dto.confirmationReceiptUrl || `/receipts/creditor_confirm_${receipt.receiptNumber}.pdf`,
        confirmedAt: new Date(),
      },
    });

    // Update claim remaining amount
    if (receipt.claim) {
      const currentRemaining = Number(receipt.claim.remainingAmount);
      const newRemaining = Math.max(0, currentRemaining - Number(receipt.amount));
      await this.prisma.debtClaim.update({
        where: { id: receipt.claimId },
        data: {
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'SETTLED' : receipt.claim.status,
        },
      });
    }

    return updated;
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
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: { claim: true },
    });

    if (!receipt) {
      throw new NotFoundException('ქვითარი ვერ მოიძებნა');
    }

    const orderNumber = `ACC-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const accountantName = user?.staffProfile?.fullName || 'მარიამ წიკლაური (მთავარი ბუღალტერი)';

    const updated = await this.prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        status: PaymentReceiptStatus.CONFIRMED_BY_ACCOUNTANT,
        confirmedByRole: UserRole.ACCOUNTANT,
        confirmedByUserId: user?.id,
        confirmedByUserName: accountantName,
        accountantOrderNumber: orderNumber,
        accountantOrderNotes: dto.notes || 'დადასტურებულია კრედიტორის სატელეფონო დასტურის საფუძველზე',
        confirmedAt: new Date(),
      },
    });

    // Update claim remaining amount
    if (receipt.claim) {
      const currentRemaining = Number(receipt.claim.remainingAmount);
      const newRemaining = Math.max(0, currentRemaining - Number(receipt.amount));
      await this.prisma.debtClaim.update({
        where: { id: receipt.claimId },
        data: {
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'SETTLED' : receipt.claim.status,
        },
      });
    }

    return updated;
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
