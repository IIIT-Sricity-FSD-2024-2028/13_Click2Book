import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProviderModule } from './modules/provider/provider.module';
import { SupportModule } from './modules/support/support.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { SeatModule } from './modules/seat/seat.module';
import { RouteModule } from './modules/route/route.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { TripModule } from './modules/trip/trip.module';
import { OfferModule } from './modules/offer/offer.module';
import { IrctcModule } from './modules/irctc/irctc.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CancellationModule } from './modules/cancellation/cancellation.module';
import { RefundModule } from './modules/refund/refund.module';
import { ReviewModule } from './modules/review/review.module';
import { SupportRequestModule } from './modules/support-request/support-request.module';
import { ReportModule } from './modules/report/report.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { LostFoundModule } from './modules/lost-found/lost-found.module';

@Module({
  imports: [
    // Auth
    AuthModule,

    // User/Actor modules
    CustomerModule,
    AdminModule,
    ProviderModule,
    SupportModule,

    // Transport infrastructure
    RouteModule,
    VehicleModule,
    SeatModule,
    ScheduleModule,
    TripModule,

    // Booking workflow
    OfferModule,
    BookingModule,
    PaymentModule,
    CancellationModule,
    RefundModule,

    // Supplementary
    IrctcModule,
    ReviewModule,
    SupportRequestModule,
    ReportModule,

    // In-trip safety & recovery
    TrackingModule,
    EmergencyModule,
    LostFoundModule,
  ],
})
export class AppModule {}
