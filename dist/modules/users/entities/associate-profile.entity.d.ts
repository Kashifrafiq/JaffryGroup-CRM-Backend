import { User } from './user.entity';
import { UserRole } from './user-role.enum';
export declare class AssociateProfile {
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
    lastActive?: Date;
    taskAssigned: number;
    createdAt: Date;
    updatedAt: Date;
}
