import { Gender } from '../enums/gender.enum';

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  password: string;
  age: number;
  gender: Gender;
  phoneNumber: string;
  createdAt: string;
  profilePicture?: string;  // relative URL path e.g. /uploads/profile/C001-xxx.jpg
}
