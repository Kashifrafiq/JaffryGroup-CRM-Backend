import { UserRole } from '../../users/entities/user-role.enum';
export declare class CreateAssociateDto {
    name: string;
    email: string;
    role: UserRole;
    lastActive?: string;
    taskAssigned?: number;
    phoneNumber?: string;
    address?: string;
    profilePhoto?: string;
}
