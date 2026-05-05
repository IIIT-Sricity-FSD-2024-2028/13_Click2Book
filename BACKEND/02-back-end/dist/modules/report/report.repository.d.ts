import { Report } from './interfaces/report.interface';
export declare class ReportRepository {
    private reports;
    save(report: Report): Report;
    findAll(): Report[];
    findByAdmin(adminId: string): Report[];
    findByDate(reportDate: string): Report[];
}
