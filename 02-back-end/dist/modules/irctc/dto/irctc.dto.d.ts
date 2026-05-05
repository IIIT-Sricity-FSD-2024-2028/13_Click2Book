import { IrctcStatus } from '../enums/irctc-status.enum';
export declare class CreateIrctcDto {
    irctcUsername: string;
    linkedPhoneNumber: string;
}
export declare class UpdateIrctcStatusDto {
    verificationStatus: IrctcStatus;
}
