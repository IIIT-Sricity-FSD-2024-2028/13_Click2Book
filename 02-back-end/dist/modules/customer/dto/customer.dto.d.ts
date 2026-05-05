import { Gender } from '../enums/gender.enum';
export declare class CreateCustomerDto {
    name: string;
    email: string;
    password: string;
    age: number;
    gender: Gender;
    phoneNumber: string;
}
export declare class UpdateCustomerDto {
    name?: string;
    age?: number;
    gender?: Gender;
    phoneNumber?: string;
}
