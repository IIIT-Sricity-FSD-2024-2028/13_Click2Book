import { ConflictException, Injectable } from '@nestjs/common';
import { TransactionLedger } from './interfaces/transaction-ledger.interface';
import { generateId } from '../../common/utils/id.util';

type MutableLedgerFields = Pick<TransactionLedger, 'supportCost' | 'adminNet' | 'status' | 'updatedAt'>;

@Injectable()
export class LedgerRepository {
  private ledgers: TransactionLedger[] = [];

  create(data: Omit<TransactionLedger, 'ledgerId' | 'status' | 'createdAt' | 'updatedAt'>): TransactionLedger {
    if (this.findByBooking(data.bookingId)) {
      throw new ConflictException(`Ledger already exists for booking ${data.bookingId}`);
    }
    const now = new Date().toISOString();
    const ledger: TransactionLedger = {
      ledgerId: generateId('LDG'),
      ...data,
      status: 'clean',
      createdAt: now,
      updatedAt: now,
    };
    this.ledgers.push(ledger);
    return ledger;
  }

  findAll(): TransactionLedger[] {
    return this.ledgers;
  }

  findByBooking(bookingId: string): TransactionLedger | undefined {
    return this.ledgers.find((l) => l.bookingId === bookingId);
  }

  // Only supportCost, adminNet, status, updatedAt may ever be mutated —
  // baseFare/convenienceFee/platformCommission/operatorPayout/gatewayFee are immutable after creation.
  update(bookingId: string, data: Partial<MutableLedgerFields>): TransactionLedger | undefined {
    const i = this.ledgers.findIndex((l) => l.bookingId === bookingId);
    if (i === -1) return undefined;
    const { supportCost, adminNet, status } = data;
    this.ledgers[i] = {
      ...this.ledgers[i],
      ...(supportCost !== undefined ? { supportCost } : {}),
      ...(adminNet !== undefined ? { adminNet } : {}),
      ...(status !== undefined ? { status } : {}),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
    return this.ledgers[i];
  }
}
