import { Injectable } from '@nestjs/common';
import { Schedule } from './interfaces/schedule.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class ScheduleRepository {
  private schedules: Schedule[] = [
    // Hyderabad → Chennai  (R001)
    { scheduleId: 'SCH001', routeId: 'R001', providerId: 'P001', departureTime: '21:00', arrivalTime: '06:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '06:30', fare: 600 },
    { scheduleId: 'SCH002', routeId: 'R001', providerId: 'P002', departureTime: '22:00', arrivalTime: '08:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '08:00', fare: 850 },
    { scheduleId: 'SCH003', routeId: 'R001', providerId: 'P002', departureTime: '08:00', arrivalTime: '18:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '18:00', fare: 750 },
    // Bangalore → Mumbai (R002)
    { scheduleId: 'SCH004', routeId: 'R002', providerId: 'P002', departureTime: '20:00', arrivalTime: '10:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '10:00', fare: 1400 },
    { scheduleId: 'SCH005', routeId: 'R002', providerId: 'P002', departureTime: '18:00', arrivalTime: '08:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '08:00', fare: 1200 },
    // Delhi → Jaipur (R003)
    { scheduleId: 'SCH006', routeId: 'R003', providerId: 'P001', departureTime: '06:00', arrivalTime: '10:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '10:30', fare: 350 },
    { scheduleId: 'SCH007', routeId: 'R003', providerId: 'P001', departureTime: '14:00', arrivalTime: '18:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '18:30', fare: 380 },
    // Hyderabad → Bangalore (R004)
    { scheduleId: 'SCH008', routeId: 'R004', providerId: 'P001', departureTime: '07:00', arrivalTime: '16:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '16:00', fare: 500 },
    // Mumbai → Pune (R006)
    { scheduleId: 'SCH009', routeId: 'R006', providerId: 'P002', departureTime: '09:00', arrivalTime: '12:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '12:30', fare: 350 },
    { scheduleId: 'SCH010', routeId: 'R006', providerId: 'P002', departureTime: '21:00', arrivalTime: '00:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '00:30', fare: 499 },
    { scheduleId: 'SCH011', routeId: 'R006', providerId: 'P002', departureTime: '07:00', arrivalTime: '10:30', journeyDate: '2026-06-02', arrivalTimeToDestination: '10:30', fare: 299 },
    // Vijayawada → Tirupati (R007)
    { scheduleId: 'SCH012', routeId: 'R007', providerId: 'P001', departureTime: '23:00', arrivalTime: '05:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '05:00', fare: 450 },
    // Bangalore → Mysore (R008)
    { scheduleId: 'SCH013', routeId: 'R008', providerId: 'P001', departureTime: '06:30', arrivalTime: '09:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '09:30', fare: 150 },
    { scheduleId: 'SCH014', routeId: 'R008', providerId: 'P002', departureTime: '10:00', arrivalTime: '13:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '13:00', fare: 180 },
    // Hyderabad → Vijayawada (R010)
    { scheduleId: 'SCH015', routeId: 'R010', providerId: 'P001', departureTime: '06:00', arrivalTime: '11:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '11:00', fare: 320 },
    { scheduleId: 'SCH016', routeId: 'R010', providerId: 'P001', departureTime: '16:00', arrivalTime: '21:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '21:00', fare: 350 },
    // Chennai → Coimbatore (R005) — Orange Travels (P003, unapproved)
    { scheduleId: 'SCH017', routeId: 'R005', providerId: 'P003', departureTime: '22:00', arrivalTime: '05:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '05:00', fare: 550 },
    // Hyderabad → Chennai (R001) — SRS Travels, 3rd provider on this route
    { scheduleId: 'SCH018', routeId: 'R001', providerId: 'P004', departureTime: '19:30', arrivalTime: '05:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '05:30', fare: 650 },
    // Bangalore → Mumbai (R002) — VRL Travels, 2nd provider on this route
    { scheduleId: 'SCH019', routeId: 'R002', providerId: 'P005', departureTime: '19:00', arrivalTime: '09:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '09:00', fare: 1300 },
    // Hyderabad → Bangalore (R004) — Parveen Travels, 2nd provider on this route
    { scheduleId: 'SCH020', routeId: 'R004', providerId: 'P006', departureTime: '20:00', arrivalTime: '05:00', journeyDate: '2026-06-02', arrivalTimeToDestination: '05:00', fare: 480 },
    // Mumbai → Pune (R006) — Jabbar & Suresh Travels, 2nd/3rd providers on this route
    { scheduleId: 'SCH021', routeId: 'R006', providerId: 'P008', departureTime: '08:00', arrivalTime: '11:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '11:30', fare: 330 },
    { scheduleId: 'SCH022', routeId: 'R006', providerId: 'P009', departureTime: '11:00', arrivalTime: '14:30', journeyDate: '2026-06-01', arrivalTimeToDestination: '14:30', fare: 280 },
    // Bangalore → Mysore (R008) — Ganesh Travels, 3rd provider on this route
    { scheduleId: 'SCH023', routeId: 'R008', providerId: 'P010', departureTime: '08:00', arrivalTime: '11:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '11:00', fare: 165 },
    // Bangalore → Mumbai (R002) — APSRTC, 3rd provider on this route
    { scheduleId: 'SCH024', routeId: 'R002', providerId: 'P001', departureTime: '21:00', arrivalTime: '11:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '11:00', fare: 1350 },
    // Hyderabad → Bangalore (R004) — KPN Tours, 3rd provider on this route
    { scheduleId: 'SCH025', routeId: 'R004', providerId: 'P002', departureTime: '09:00', arrivalTime: '18:00', journeyDate: '2026-06-01', arrivalTimeToDestination: '18:00', fare: 520 },
  ];

  create(data: Omit<Schedule, 'scheduleId'>): Schedule {
    const schedule: Schedule = { scheduleId: generateId('SCH'), ...data };
    this.schedules.push(schedule);
    return schedule;
  }

  findAll(): Schedule[] { return this.schedules; }
  findById(scheduleId: string): Schedule | undefined { return this.schedules.find(s => s.scheduleId === scheduleId); }
  findByProvider(providerId: string): Schedule[] { return this.schedules.filter(s => s.providerId === providerId); }
  findByRoute(routeId: string): Schedule[] { return this.schedules.filter(s => s.routeId === routeId); }
  findByDate(journeyDate: string): Schedule[] { return this.schedules.filter(s => s.journeyDate === journeyDate); }

  update(scheduleId: string, data: Partial<Schedule>): Schedule | undefined {
    const i = this.schedules.findIndex(s => s.scheduleId === scheduleId);
    if (i === -1) return undefined;
    this.schedules[i] = { ...this.schedules[i], ...data };
    return this.schedules[i];
  }

  remove(scheduleId: string): boolean {
    const i = this.schedules.findIndex(s => s.scheduleId === scheduleId);
    if (i === -1) return false;
    this.schedules.splice(i, 1);
    return true;
  }
}
