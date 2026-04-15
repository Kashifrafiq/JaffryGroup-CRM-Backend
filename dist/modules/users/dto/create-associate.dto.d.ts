import { UserRole } from '../entities/user.entity';
export declare class CreateAssociateDto {
    name: string;
    email: string;
    role: UserRole;
    lastActive?: string;
    taskAssigned?: number;
    phoneNumber?: string;
    address?: string;
    profilePhoto?: string;
    password?: string;
}
