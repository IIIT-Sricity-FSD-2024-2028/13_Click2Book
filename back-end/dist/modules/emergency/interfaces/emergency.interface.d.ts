import { EmergencyType } from '../enums/emergency-type.enum';
import { EmergencyStatus } from '../enums/emergency-status.enum';
export interface EmergencyAlert {
    alertId: string;
    bookingId: string;
    customerId: string;
    tripId: string;
    type: EmergencyType;
    message?: string;
    lat?: number;
    lng?: number;
    status: EmergencyStatus;
    createdAt: string;
    resolvedAt?: string;
}
