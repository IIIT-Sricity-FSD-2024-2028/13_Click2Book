import { Injectable } from '@nestjs/common';
import { Report } from './interfaces/report.interface';

@Injectable()
export class ReportRepository {
  private reports: Report[] = [];

  save(report: Report): Report {
    const existing = this.reports.findIndex(r => r.adminId === report.adminId && r.reportDate === report.reportDate);
    if (existing !== -1) { this.reports[existing] = report; return report; }
    this.reports.push(report);
    return report;
  }

  findAll(): Report[] { return this.reports; }
  findByAdmin(adminId: string): Report[] { return this.reports.filter(r => r.adminId === adminId); }
  findByDate(reportDate: string): Report[] { return this.reports.filter(r => r.reportDate === reportDate); }
}
