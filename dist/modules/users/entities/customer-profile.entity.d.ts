import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import type { CustomerApplication } from '../../customers/entities/customer-application.entity';
export declare class CustomerProfile {
    id: string;
    email?: string;
    role: UserRole;
    userId?: string;
    user?: User;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    property?: string;
    applicationType?: string;
    applications?: CustomerApplication[];
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    createdAt: Date;
    updatedAt: Date;
}
