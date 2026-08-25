import { EmergencyType } from '../enums/emergency-type.enum';
export declare class CreateEmergencyAlertDto {
    bookingId: string;
    customerId: string;
    type: EmergencyType;
    message?: string;
    lat?: number;
    lng?: number;
}
