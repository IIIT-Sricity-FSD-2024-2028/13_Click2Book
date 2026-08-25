import { Injectable } from '@nestjs/common';
import { EmergencyAlert } from './interfaces/emergency.interface';
import { EmergencyStatus } from './enums/emergency-status.enum';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class EmergencyRepository {
  private alerts: EmergencyAlert[] = [];

  create(data: Omit<EmergencyAlert, 'alertId' | 'status' | 'createdAt'>): EmergencyAlert {
    const alert: EmergencyAlert = {
      alertId: generateId('EMG'),
      ...data,
      status: EmergencyStatus.OPEN,
      createdAt: new Date().toISOString(),
    };
    this.alerts.push(alert);
    return alert;
  }

  findAll(): EmergencyAlert[] { return this.alerts; }
  findById(alertId: string): EmergencyAlert | undefined { return this.alerts.find(a => a.alertId === alertId); }
  findByStatus(status: EmergencyStatus): EmergencyAlert[] { return this.alerts.filter(a => a.status === status); }
  findByCustomer(customerId: string): EmergencyAlert[] { return this.alerts.filter(a => a.customerId === customerId); }

  update(alertId: string, data: Partial<EmergencyAlert>): EmergencyAlert | undefined {
    const i = this.alerts.findIndex(a => a.alertId === alertId);
    if (i === -1) return undefined;
    this.alerts[i] = { ...this.alerts[i], ...data };
    return this.alerts[i];
  }
}
