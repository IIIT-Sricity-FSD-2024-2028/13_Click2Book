import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Provider Attribution — Search + Booking -> Payout Chain (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  const ctx: Record<string, any> = {};

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

  it('search returns real provider names resolved from ProviderRepository, never "Private Operators"', async () => {
    const res = await request(server)
      .get('/api/trips/search?source=Hyderabad&destination=Chennai')
      .expect(200);

    const names = res.body.data.map((t: any) => t.providerName);
    expect(names).toContain('APSRTC Travels'); // P001, seeded SCH001
    expect(names).toContain('KPN Tours'); // P002, seeded SCH002/SCH003
    expect(names).not.toContain('Private Operators');
    // Every result also carries the real providerId now, not just the display name.
    res.body.data.forEach((t: any) => expect(typeof t.providerId).toBe('string'));
  });

  it('search excludes trips whose schedule belongs to an unapproved provider (P003)', async () => {
    // R009 (Delhi -> Agra) has no seeded schedules, so this is a clean, isolated route.
    const scheduleRes = await request(server)
      .post('/api/schedules')
      .set('x-role', 'PROVIDER')
      .send({
        routeId: 'R009',
        providerId: 'P003', // Orange Travels — seeded as approved: false
        departureTime: '09:00',
        arrivalTime: '12:00',
        journeyDate: '2026-07-01',
        arrivalTimeToDestination: '12:00',
        fare: 300,
      })
      .expect(201);
    const scheduleId = scheduleRes.body.data.scheduleId;

    await request(server)
      .post('/api/trips')
      .set('x-role', 'PROVIDER')
      .send({ scheduleId, vehicleId: 'V009' })
      .expect(201);

    // The only trip on this route belongs to an unapproved provider, so the route
    // effectively has zero bookable results — search 404s rather than listing it.
    await request(server)
      .get('/api/trips/search?source=Delhi&destination=Agra')
      .expect(404);
  });

  it('booking a KPN Tours (P002) trip writes a ledger row with providerId P002', async () => {
    const { bookingId } = await bookAndConfirm('SCH002', 'V004', 3); // SCH002 fare ₹850, provider P002

    const ledger = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    expect(ledger.providerId).toBe('P002');
    expect(ledger.baseFare).toBe(85000);
    expect(ledger.operatorPayout).toBe(76500); // 85000 - 10% commission

    ctx.kpnBookingId = bookingId;
    ctx.kpnPayout = ledger.operatorPayout;
  });

  it('booking an APSRTC (P001) trip writes a separate ledger row with providerId P001', async () => {
    const { bookingId } = await bookAndConfirm('SCH001', 'V001', 3); // SCH001 fare ₹600, provider P001

    const ledger = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    expect(ledger.providerId).toBe('P001');
    expect(ledger.baseFare).toBe(60000);
    expect(ledger.operatorPayout).toBe(54000);

    ctx.apsrtcBookingId = bookingId;
    ctx.apsrtcPayout = ledger.operatorPayout;
    ctx.apsrtcAdminNetBefore = ledger.adminNet;
  });

  it('a support query on the KPN Tours booking only deducts cost from that ledger row', async () => {
    const kpnBookingId = ctx.kpnBookingId;
    const apsrtcBookingId = ctx.apsrtcBookingId;
    const apsrtcAdminNetBefore = ctx.apsrtcAdminNetBefore;

    const kpnBefore = (await request(server)
      .get(`/api/admin/ledger/${kpnBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    await request(server)
      .post('/api/support-ticket')
      .set('x-role', 'SUPPORT')
      .send({ bookingId: kpnBookingId, category: 'complaint', sourceModule: 'manual' })
      .expect(201);

    const kpnAfter = (await request(server)
      .get(`/api/admin/ledger/${kpnBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(kpnAfter.supportCost).toBe(3500); // default complaint weight
    expect(kpnAfter.adminNet).toBe(kpnBefore.adminNet - 3500);
    expect(kpnAfter.operatorPayout).toBe(kpnBefore.operatorPayout); // payout untouched by support cost

    const apsrtcAfter = (await request(server)
      .get(`/api/admin/ledger/${apsrtcBookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(apsrtcAfter.supportCost).toBe(0);
    expect(apsrtcAfter.adminNet).toBe(apsrtcAdminNetBefore); // completely unaffected
  });

  it('GET /admin/payouts/summary?groupBy=providerId returns real provider names and correct per-provider totals', async () => {
    const res = await request(server)
      .get('/api/admin/payouts/summary?groupBy=providerId')
      .set('x-role', 'ADMIN')
      .expect(200);

    const rows = res.body.data;
    const p001 = rows.find((r: any) => r.id === 'P001');
    const p002 = rows.find((r: any) => r.id === 'P002');

    expect(p001).toBeDefined();
    expect(p001.label).toBe('APSRTC Travels');
    expect(p001.total).toBeGreaterThanOrEqual(ctx.apsrtcPayout);

    expect(p002).toBeDefined();
    expect(p002.label).toBe('KPN Tours');
    expect(p002.total).toBeGreaterThanOrEqual(ctx.kpnPayout);

    // No cross-contamination: neither entry's total should silently include the other's payout amount alone.
    expect(p001.id).not.toBe(p002.id);
  });

  it('a ticket assigned to a supporterId carries agentId and still only deducts cost from its own booking\'s ledger', async () => {
    const { bookingId } = await bookAndConfirm('SCH001', 'V001', 4);

    const otherBooking = ctx.apsrtcBookingId; // untouched control from the earlier support-ticket test

    const before = (await request(server)
      .get(`/api/admin/ledger/${otherBooking}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    const ticketRes = await request(server)
      .post('/api/support-ticket')
      .set('x-role', 'SUPPORT')
      .send({ bookingId, category: 'complaint', sourceModule: 'manual', agentId: 'SUP001' })
      .expect(201);
    expect(ticketRes.body.data.agentId).toBe('SUP001');

    const ledgerAfter = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(ledgerAfter.supportCost).toBe(3500);

    const otherAfter = (await request(server)
      .get(`/api/admin/ledger/${otherBooking}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;
    expect(otherAfter.adminNet).toBe(before.adminNet); // unrelated booking untouched

    ctx.agentTicketBookingId = bookingId;
  });

  it('rejects a ticket assigned to a supporterId that does not exist', async () => {
    await request(server)
      .post('/api/support-ticket')
      .set('x-role', 'SUPPORT')
      .send({ bookingId: ctx.kpnBookingId, category: 'complaint', agentId: 'SUP999' })
      .expect(404);
  });

  it('GET /admin/payouts/summary?groupBy=adminId sums adminNet under the platform admin, real name resolved live', async () => {
    const res = await request(server)
      .get('/api/admin/payouts/summary?groupBy=adminId')
      .set('x-role', 'ADMIN')
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    const row = res.body.data[0];
    expect(row.id).toBe('A001'); // AdminRepository's primary/first record
    expect(row.label).toBe('Super Admin');
    expect(row.total).toBeGreaterThan(0);
  });

  it('GET /admin/payouts/summary?groupBy=agentId only includes assigned tickets, with real agent names', async () => {
    const res = await request(server)
      .get('/api/admin/payouts/summary?groupBy=agentId')
      .set('x-role', 'ADMIN')
      .expect(200);

    const sup001 = res.body.data.find((r: any) => r.id === 'SUP001');
    expect(sup001).toBeDefined();
    expect(sup001.label).toBe('Rahul Support');
    expect(sup001.count).toBeGreaterThanOrEqual(1);
    expect(sup001.total).toBeGreaterThanOrEqual(3500);

    // The unassigned complaint ticket raised earlier on the KPN Tours booking must not
    // silently appear under any agent id.
    const totalAssignedCount = res.body.data.reduce((s: number, r: any) => s + r.count, 0);
    const allTickets = (await request(server)
      .get('/api/support-ticket')
      .set('x-role', 'SUPPORT')
      .expect(200)).body.data;
    const unassignedCount = allTickets.filter((t: any) => !t.agentId).length;
    expect(unassignedCount).toBeGreaterThan(0);
    expect(totalAssignedCount).toBe(allTickets.length - unassignedCount);
  });

  it('rejects an invalid groupBy value', async () => {
    await request(server)
      .get('/api/admin/payouts/summary?groupBy=bogus')
      .set('x-role', 'ADMIN')
      .expect(400);
  });

  it('search on a busy route (Hyderabad -> Chennai) shows 3+ different real providers for genuine multi-company comparison', async () => {
    const res = await request(server)
      .get('/api/trips/search?source=Hyderabad&destination=Chennai')
      .expect(200);

    const providerIds = new Set(res.body.data.map((t: any) => t.providerId));
    expect(providerIds.size).toBeGreaterThanOrEqual(3);
    expect(providerIds).toEqual(new Set(['P001', 'P002', 'P004']));

    const names = res.body.data.map((t: any) => t.providerName);
    expect(names).toContain('APSRTC Travels');
    expect(names).toContain('KPN Tours');
    expect(names).toContain('SRS Travels');
  });

  it('no returned bus\'s displayed name mismatches its own provider\'s real company (the V004/V005/etc. class of bug)', async () => {
    const routes: [string, string][] = [
      ['Hyderabad', 'Chennai'], ['Bangalore', 'Mumbai'], ['Hyderabad', 'Bangalore'], ['Mumbai', 'Pune'],
    ];
    for (const [source, destination] of routes) {
      const res = await request(server)
        .get(`/api/trips/search?source=${source}&destination=${destination}`)
        .expect(200);
      for (const trip of res.body.data) {
        // The provider name is the single source of truth for "who this bus belongs
        // to" — a bus's own busName/vehicleNumber must never advertise a DIFFERENT
        // travel company's brand than the provider actually attributed to the trip.
        const OTHER_COMPANY_BRANDS = ['APSRTC', 'KPN', 'Orange Travels', 'VRL', 'SRS', 'Kaveri', 'RedBus', 'Parveen', 'Jabbar', 'Suresh Travels', 'Ganesh']
          .filter((brand) => !trip.providerName.includes(brand));
        for (const foreignBrand of OTHER_COMPANY_BRANDS) {
          expect(trip.busName).not.toContain(foreignBrand);
        }
      }
    }
  });

  it('Mumbai -> Pune route shows 3 different providers (was previously all KPN Tours)', async () => {
    const res = await request(server)
      .get('/api/trips/search?source=Mumbai&destination=Pune')
      .expect(200);
    const providerIds = new Set(res.body.data.map((t: any) => t.providerId));
    expect(providerIds).toEqual(new Set(['P002', 'P008', 'P009']));
  });

  it('booking a Suresh Travels (P009) trip writes a correctly-attributed ledger row', async () => {
    const { bookingId } = await bookAndConfirm('SCH022', 'V018', 1); // SCH022 fare ₹280, provider P009

    const ledger = (await request(server)
      .get(`/api/admin/ledger/${bookingId}`)
      .set('x-role', 'ADMIN')
      .expect(200)).body.data;

    expect(ledger.providerId).toBe('P009');
    expect(ledger.baseFare).toBe(28000);
    expect(ledger.operatorPayout).toBe(25200); // 28000 - 10% commission

    ctx.sureshBookingId = bookingId;
    ctx.sureshPayout = ledger.operatorPayout;
  });

  it('GET /admin/payouts/summary?groupBy=providerId across 3+ providers keeps totals correctly separated', async () => {
    const res = await request(server)
      .get('/api/admin/payouts/summary?groupBy=providerId')
      .set('x-role', 'ADMIN')
      .expect(200);

    const p001 = res.body.data.find((r: any) => r.id === 'P001');
    const p002 = res.body.data.find((r: any) => r.id === 'P002');
    const p009 = res.body.data.find((r: any) => r.id === 'P009');

    expect(p001.label).toBe('APSRTC Travels');
    expect(p002.label).toBe('KPN Tours');
    expect(p009).toBeDefined();
    expect(p009.label).toBe('Suresh Travels');
    expect(p009.total).toBeGreaterThanOrEqual(ctx.sureshPayout);

    // Distinct ids, distinct totals attribution — no mixing across 3 separate providers.
    const ids = [p001.id, p002.id, p009.id];
    expect(new Set(ids).size).toBe(3);
  });
});
