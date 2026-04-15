import { User } from './user.entity';
export declare class AdminProfile {
    id: string;
    userId: string;
    user: User;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    createdAt: Date;
    updatedAt: Date;
}
