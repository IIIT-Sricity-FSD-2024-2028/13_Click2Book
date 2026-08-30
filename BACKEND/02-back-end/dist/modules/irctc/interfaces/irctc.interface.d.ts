import { IrctcStatus } from '../enums/irctc-status.enum';
export interface Irctc {
    irctcId: string;
    irctcUsername: string;
    linkedPhoneNumber: string;
    verificationStatus: IrctcStatus;
}
