import { User } from './user.entity';
export declare enum AssociateStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class AssociateProfile {
    id: string;
    email?: string;
    role: string;
    userId?: string;
    user?: User;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    lastActive?: Date;
    department?: string;
    status: AssociateStatus;
    taskAssigned: number;
    createdAt: Date;
    updatedAt: Date;
}
