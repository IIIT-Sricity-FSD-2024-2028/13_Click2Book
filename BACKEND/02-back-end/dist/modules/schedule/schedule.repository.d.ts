import { Schedule } from './interfaces/schedule.interface';
export declare class ScheduleRepository {
    private schedules;
    create(data: Omit<Schedule, 'scheduleId'>): Schedule;
    findAll(): Schedule[];
    findById(scheduleId: string): Schedule | undefined;
    findByProvider(providerId: string): Schedule[];
    findByRoute(routeId: string): Schedule[];
    findByDate(journeyDate: string): Schedule[];
    update(scheduleId: string, data: Partial<Schedule>): Schedule | undefined;
    remove(scheduleId: string): boolean;
}
