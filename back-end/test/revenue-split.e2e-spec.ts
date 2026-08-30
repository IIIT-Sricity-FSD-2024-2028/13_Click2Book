import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Revenue & Cost Split (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  // Creates a brand-new trip (so seats get initialized) on SCH001 (fare ₹600, provider P001, vehicle V001)
  // and books+confirms a fresh booking on it. Returns the bookingId.
  async function bookAndConfirm(scheduleId: string, vehicleId: string, seatNumber: number) {
    const tripRes = await request(server)
      .post('/api/trips')
      .set('x-role', 'PROVIDER')
      .send({ scheduleId, vehicleId })
      .expect(201);
    const tripId = tripRes.body.data.tripId;

    const bookingRes = await request(server)
      .post('/api/bookings')
      .set('x-role', 'CUSTOMER')
      .send({ customerId: 'C001', tripId, seatNumber })
      .expect(201);
    const bookingId = bookingRes.body.data.bookingId;

    await request(server)
      .patch(`/api/bookings/${bookingId}/confirm`)
      .set('x-role', 'CUSTOMER')
      .expect(200);

    return { tripId, bookingId };
  }

  it('creates a ledger row with the correct 4-way split when a booking is made (SCH001 fare ₹600)', async () => {
    const { bookingId } = await bookAndConfirm('SCH001', 'V001', 1);

    const ledgerRes = await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200);

    const ledger = ledgerRes.body.data;
    expect(ledger.baseFare).toBe(60000); // ₹600 -> paise
    expect(ledger.platformCommission).toBe(6000); // 10% default commission
    expect(ledger.operatorPayout).toBe(54000); // 60000 - 6000
    expect(ledger.convenienceFee).toBe(2500); // default flat fee
    expect(ledger.gatewayFee).toBe(900); // 1.5% of 60000
    expect(ledger.adminNet).toBe(6000 + 2500 - 900); // 7600
    expect(ledger.status).toBe('clean');
    expect(ledger.supportCost).toBe(0);
  });

  it('cancelling a booking marks the ledger cancelled, leaves convenienceFee untouched, and applies the cancellation support cost', async () => {
    const { bookingId } = await bookAndConfirm('SCH001', 'V001', 2);

    const before = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    await request(server)
      .post('/api/cancellations')
      .set('x-role', 'CUSTOMER')
      .send({ bookingId })
      .expect(201);

    const after = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    expect(after.status).toBe('cancelled');
    expect(after.convenienceFee).toBe(before.convenienceFee); // never touched by cancellation
    expect(after.baseFare).toBe(before.baseFare); // immutable
    expect(after.operatorPayout).toBe(before.operatorPayout); // immutable
    expect(after.supportCost).toBe(800); // default cancellation cost weight
    const expectedPool = after.platformCommission + after.convenienceFee;
    expect(after.adminNet).toBe(expectedPool - after.gatewayFee - after.supportCost);

    const ticketsRes = await request(server)
      .get(`/api/support-ticket/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200);
    expect(ticketsRes.body.data.some((t: any) => t.category === 'cancellation')).toBe(true);
  });

  it('an SOS alert creates a zero-cost support ticket that is still listed for the booking', async () => {
    const { tripId, bookingId } = await bookAndConfirm('SCH002', 'V004', 1);

    // Depart the trip so SOS is allowed
    await request(server)
      .patch(`/api/trips/${tripId}/confirm`)
      .set('x-role', 'PROVIDER')
      .expect(200);

    await request(server)
      .post('/api/emergency')
      .set('x-role', 'CUSTOMER')
      .send({ bookingId, customerId: 'C001', type: 'SAFETY', message: 'Testing SOS' })
      .expect(201);

    const ticketsRes = await request(server)
      .get(`/api/support-ticket/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200);

    const sosTicket = ticketsRes.body.data.find((t: any) => t.category === 'sos');
    expect(sosTicket).toBeDefined();
    expect(sosTicket.costApplied).toBe(0);
  });

  it('an admin config change applies to new bookings only — earlier ledger rows stay immutable', async () => {
    const { bookingId: oldBookingId } = await bookAndConfirm('SCH006', 'V012', 1);
    const oldLedgerBefore = (await request(server)
      .get(`/api/admin/ledger/${oldBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(oldLedgerBefore.platformCommission).toBe(3500); // 10% of ₹350 -> 35000 paise

    await request(server)
      .post('/api/admin/revenue-config')
      .set('x-role', 'ADMIN')
      .send({ commissionPct: 20 })
      .expect(200);

    const { bookingId: newBookingId } = await bookAndConfirm('SCH006', 'V012', 2);
    const newLedger = (await request(server)
      .get(`/api/admin/ledger/${newBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(newLedger.platformCommission).toBe(7000); // 20% of ₹350 -> 35000 paise

    const oldLedgerAfter = (await request(server)
      .get(`/api/admin/ledger/${oldBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(oldLedgerAfter.platformCommission).toBe(oldLedgerBefore.platformCommission);
    expect(oldLedgerAfter.baseFare).toBe(oldLedgerBefore.baseFare);
  });

  it('an admin config update that would exceed the platform pool still saves with 200 and a warning', async () => {
    const res = await request(server)
      .post('/api/admin/revenue-config')
      .set('x-role', 'ADMIN')
      .send({
        commissionPct: 1,
        convenienceFeeFlat: 100,
        gatewayFeePct: 50,
        supportCostWeights: { complaint: 50000, dispute: 50000 },
      })
      .expect(200);

    expect(typeof res.body.warning).toBe('string');
    expect(res.body.success).toBe(true);
    expect(res.body.data.commissionPct).toBe(1);
  });
});
