import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { AdminLoggerMiddleware } from './common/middleware/admin-logger.middleware';
import { AdminController } from './modules/admin/admin.controller';
import { ReportController } from './modules/report/report.controller';
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
import { RevenueSplitModule } from './modules/revenue-split/revenue-split.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { SupportTicketModule } from './modules/support-ticket/support-ticket.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [
    // ── Logging (global — must come first so LoggerService is available everywhere)
    LoggerModule,

    // ── Rate limiting (Phase 4C) — 100 requests per IP per 60-second window
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Auth
    AuthModule,

    // ── Revenue & cost split
    // Registered before AdminModule: RevenueSplitController's literal
    // 'admin/revenue-config' path must be matched before AdminController's
    // 'admin/:id' wildcard route, and Nest/Express resolve routes in
    // registration order, not by specificity — AdminModule registering
    // first would let 'admin/:id' swallow 'admin/revenue-config' as id='revenue-config'.
    RevenueSplitModule,
    LedgerModule,
    SupportTicketModule,
    PayoutsModule,

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
  providers: [
    // Phase 4C: Global rate limiting — 100 requests per 60 seconds per IP.
    // Applied to ALL routes. Limits are generous enough that normal frontend
    // dashboard usage (5-10 req/load) never triggers throttling.
    // Swagger is also covered; use @SkipThrottle() on any route if needed.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Middleware registration — filled in by Phase 3B/3C/3D.
   * NestModule interface is implemented here so later phases
   * only add apply() calls without further structural changes.
   */
  configure(consumer: MiddlewareConsumer): void {
    // Phase 3B: Attach unique x-request-id to every request
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    // Phase 3C: Log every HTTP request/response to application.log (+ error.log for 5xx)
    consumer.apply(LoggingMiddleware).forRoutes('*');

    // Phase 3D: Router-level middleware — ONLY fires for AdminController and ReportController routes.
    // Using controller class references correctly accounts for the global /api prefix.
    consumer.apply(AdminLoggerMiddleware).forRoutes(AdminController, ReportController);
  }
}
