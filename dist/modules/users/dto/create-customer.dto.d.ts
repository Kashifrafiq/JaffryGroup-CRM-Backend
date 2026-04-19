import { UserRole } from '../entities/user-role.enum';
export declare class CreateCustomerDto {
    name: string;
    email: string;
    phone: string;
    property: string;
    applicationType: string;
    role?: UserRole;
    address?: string;
    profilePhoto?: string;
}
