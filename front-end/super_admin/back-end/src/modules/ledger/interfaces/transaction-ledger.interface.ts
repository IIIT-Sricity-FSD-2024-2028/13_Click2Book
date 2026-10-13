export type LedgerStatus = 'clean' | 'cancelled' | 'disputed';

export interface TransactionLedger {
  ledgerId: string;
  bookingId: string;
  tripId?: string; // trip the booking is for — lets operators see revenue per bus
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
  createdAt: string;
  updatedAt: string;
}
