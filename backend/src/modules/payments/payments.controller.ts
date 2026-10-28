import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  PaymentsService,
  SubmitDebtorReceiptDto,
  ConfirmByCreditorDto,
  ConfirmByAccountantDto,
} from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 1 & 2: Debtor submits payment receipt
   */
  @Post('submit-receipt')
  async submitDebtorReceipt(
    @Body() dto: SubmitDebtorReceiptDto,
    @CurrentUser() user: any,
  ) {
    return await this.paymentsService.submitDebtorReceipt(dto, user);
  }

  /**
   * Debtor gets their payment receipts
   */
  @Get('debtor')
  async getDebtorPayments(@CurrentUser() user: any) {
    return await this.paymentsService.getDebtorPayments(user);
  }

  /**
   * 3: Creditor retrieves payments & pending submissions
   */
  @Get('creditor')
  async getCreditorPayments(@CurrentUser() user: any) {
    return await this.paymentsService.getCreditorPayments(user);
  }

  /**
   * 4: Creditor confirms receipt of funds
   */
  @Post(':id/confirm-creditor')
  async confirmByCreditor(
    @Param('id') id: string,
    @Body() dto: ConfirmByCreditorDto,
    @CurrentUser() user: any,
  ) {
    return await this.paymentsService.confirmByCreditor(id, dto, user);
  }

  /**
   * 5: Accountant retrieves all payments queue
   */
  @Get('accountant')
  async getAccountantPayments() {
    return await this.paymentsService.getAccountantPayments();
  }

  /**
   * 6: Accountant confirms payment and generates official order
   */
  @Post(':id/confirm-accountant')
  async confirmByAccountant(
    @Param('id') id: string,
    @Body() dto: ConfirmByAccountantDto,
    @CurrentUser() user: any,
  ) {
    return await this.paymentsService.confirmByAccountant(id, dto, user);
  }

  /**
   * 8: Document download / view endpoint
   */
  @Get(':id/document')
  async getReceiptDocument(@Param('id') id: string) {
    return await this.paymentsService.getReceiptDocument(id);
  }
}
