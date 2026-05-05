import { SupportStatus } from '../enums/support-status.enum';
export declare class CreateSupportRequestDto {
    customerId: string;
    description: string;
}
export declare class UpdateSupportRequestDto {
    supporterId?: string;
    status?: SupportStatus;
}
