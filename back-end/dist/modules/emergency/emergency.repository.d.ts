import { EmergencyAlert } from './interfaces/emergency.interface';
import { EmergencyStatus } from './enums/emergency-status.enum';
export declare class EmergencyRepository {
    private alerts;
    create(data: Omit<EmergencyAlert, 'alertId' | 'status' | 'createdAt'>): EmergencyAlert;
    findAll(): EmergencyAlert[];
    findById(alertId: string): EmergencyAlert | undefined;
    findByStatus(status: EmergencyStatus): EmergencyAlert[];
    findByCustomer(customerId: string): EmergencyAlert[];
    update(alertId: string, data: Partial<EmergencyAlert>): EmergencyAlert | undefined;
}
