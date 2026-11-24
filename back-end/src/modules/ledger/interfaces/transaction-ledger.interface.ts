export type LedgerStatus = 'clean' | 'cancelled' | 'disputed';
export type PayoutStatus = 'pending' | 'paid';

export interface TransactionLedger {
  ledgerId: string;
  bookingId: string;
  providerId: string; // resolved from Trip.scheduleId -> Schedule.providerId, immutable
  adminId: string; // owning platform admin (see LedgerService.createForBooking), immutable
  baseFare: number; // paise — snapshotted at booking creation, immutable
  convenienceFee: number; // paise — immutable, never refunded/reduced
  platformCommission: number; // paise
  operatorPayout: number; // paise — immutable
  gatewayFee: number; // paise
  supportCost: number; // paise — starts at 0, only changed via applySupportCost
  adminNet: number; // paise
  status: LedgerStatus;
  payoutStatus: PayoutStatus; // 'paid' once the operatorPayout has been transferred to the provider
  transferId?: string; // the PayoutTransfer that paid this row
  paidOutAt?: string;
  createdAt: string;
  updatedAt: string;
}
