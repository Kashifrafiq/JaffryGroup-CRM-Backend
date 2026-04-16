import { UserRole } from '../entities/user-role.enum';
export declare class CreateCustomerDto {
    name: string;
    email: string;
    role: UserRole;
    phoneNumber?: string;
    address?: string;
    profilePhoto?: string;
}
