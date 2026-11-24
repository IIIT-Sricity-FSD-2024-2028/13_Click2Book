import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AdminRepository } from './admin.repository';
import { BookingRepository } from '../booking/booking.repository';
import { PaymentRepository } from '../payment/payment.repository';
import { CreateAdminDto } from './dto/admin.dto';
import { successResponse } from '../../common/utils/response.util';
import { CustomerRepository } from '../customer/customer.repository';
import { ProviderRepository } from '../provider/provider.repository';
import { SupportRepository } from '../support/support.repository';
import { RefundRepository } from '../refund/refund.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly paymentRepo: PaymentRepository,
    @Optional() private readonly moduleRef?: ModuleRef,
  ) {}

  create(dto: CreateAdminDto) {
    if (this.adminRepo.findByEmail(dto.email))
      throw new ConflictException('Admin email already exists');
    return successResponse('Admin created', this.adminRepo.create(dto));
  }

  findAll() {
    return successResponse('All admins', this.adminRepo.findAll());
  }

  findById(id: string) {
    const a = this.adminRepo.findById(id);
    if (!a) throw new NotFoundException(`Admin ${id} not found`);
    return successResponse('Admin retrieved', a);
  }

  getDashboard() {
    const allBookings = this.bookingRepo.findAll();
    const allPayments = this.paymentRepo.findAll();
    const getRepo = (token: any) => {
      try {
        return this.moduleRef?.get(token, { strict: false });
      } catch {
        return undefined;
      }
    };
    const refundRepo = getRepo(RefundRepository) as RefundRepository | undefined;
    const customerRepo = getRepo(CustomerRepository) as CustomerRepository | undefined;
    const providerRepo = getRepo(ProviderRepository) as ProviderRepository | undefined;
    const supportRepo = getRepo(SupportRepository) as SupportRepository | undefined;
    const allRefunds = refundRepo?.findAll() || [];
    const customers = customerRepo?.findAll() || [];
    const providers = providerRepo?.findAll() || [];
    const supportStaff = supportRepo?.findAll() || [];
    const successPayments = allPayments.filter((p) =>
      ['SUCCESS', 'REFUNDED'].includes(String(p.paymentStatus).toUpperCase()),
    );
    const grossRevenue = successPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const completedRefunds = allRefunds
      .filter((r) => String(r.refundStatus).toUpperCase() === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);
    const netRevenue = Math.max(0, grossRevenue - completedRefunds);
    const status = (value: any) => String(value || '').toUpperCase();
    const periodRevenue = (days: number) => {
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - (days - 1));
      return (
        successPayments
          .filter((p) => p.paymentDate && new Date(p.paymentDate) >= cutoff)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0) -
        allRefunds
          .filter(
            (r) =>
              String(r.refundStatus).toUpperCase() === 'COMPLETED' &&
              r.completedDate &&
              new Date(r.completedDate) >= cutoff,
          )
          .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0)
      );
    };
    const last7 = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const payments = successPayments
        .filter((p) => String(p.paymentDate || '').slice(0, 10) === key)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const refunds = allRefunds
        .filter(
          (r) =>
            String(r.completedDate || r.refundDate || '').slice(0, 10) ===
              key && String(r.refundStatus).toUpperCase() === 'COMPLETED',
        )
        .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);
      return { date: key, amount: Math.max(0, payments - refunds) };
    });

    return successResponse('Admin dashboard', {
      totalBookings: allBookings.length,
      pendingBookings: allBookings.filter(
        (b) => status(b.bookingStatus) === 'PENDING',
      ).length,
      confirmedBookings: allBookings.filter(
        (b) => status(b.bookingStatus) === 'CONFIRMED',
      ).length,
      completedBookings: allBookings.filter(
        (b) => status(b.bookingStatus) === 'COMPLETED',
      ).length,
      cancelledBookings: allBookings.filter(
        (b) => status(b.bookingStatus) === 'CANCELLED',
      ).length,
      refundedBookings: allBookings.filter((b) =>
        allRefunds.some(
          (r) =>
            r.bookingId === b.bookingId &&
            String(r.refundStatus).toUpperCase() === 'COMPLETED',
        ),
      ).length,
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => status(c.status) === 'ACTIVE')
        .length,
      inactiveCustomers: customers.filter(
        (c) => status(c.status) === 'INACTIVE',
      ).length,
      totalProviders: providers.length,
      activeProviders: providers.filter(
        (p) => p.approved && status(p.status) === 'ACTIVE',
      ).length,
      inactiveProviders: providers.filter(
        (p) => !p.approved || status(p.status) === 'INACTIVE',
      ).length,
      totalSupportStaff: supportStaff.length,
      activeSupportStaff: supportStaff.filter(
        (s) => status(s.status) === 'ACTIVE',
      ).length,
      inactiveSupportStaff: supportStaff.filter(
        (s) => status(s.status) === 'INACTIVE',
      ).length,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalRefunds: Number(completedRefunds.toFixed(2)),
      totalRevenue: Number(netRevenue.toFixed(2)),
      dailyRevenue: Number(periodRevenue(1).toFixed(2)),
      weeklyRevenue: Number(periodRevenue(7).toFixed(2)),
      monthlyRevenue: Number(periodRevenue(30).toFixed(2)),
      revenueByDay: last7,
      totalPayments: successPayments.length,
      recentBookings: allBookings
        .slice()
        .sort((a, b) =>
          String(b.bookingDate || '').localeCompare(
            String(a.bookingDate || ''),
          ),
        )
        .slice(0, 8),
    });
  }
}
