import { User } from './user.entity';
import { UserRole } from './user-role.enum';
export declare class CustomerProfile {
    id: string;
    email?: string;
    role: UserRole;
    userId?: string;
    user?: User;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    createdAt: Date;
    updatedAt: Date;
}
