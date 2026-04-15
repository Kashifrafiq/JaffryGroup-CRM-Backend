import { AdminProfile } from './admin-profile.entity';
import { AssociateProfile } from './associate-profile.entity';
import { CustomerProfile } from './customer-profile.entity';
export declare enum UserRole {
    ADMIN = "admin",
    ASSOCIATE = "associate",
    CUSTOMER = "customer"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    role: UserRole;
    isActive: boolean;
    adminProfile?: AdminProfile;
    associateProfile?: AssociateProfile;
    customerProfile?: CustomerProfile;
    customers: User[];
    associates: User[];
    createdAt: Date;
    updatedAt: Date;
}
