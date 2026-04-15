import { User } from './user.entity';
export declare class AssociateProfile {
    id: string;
    userId: string;
    user: User;
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
