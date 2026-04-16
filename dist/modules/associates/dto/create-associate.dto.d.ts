import { AssociateStatus } from '../../users/entities/associate-profile.entity';
export declare class CreateAssociateDto {
    name: string;
    email: string;
    role: string;
    department: string;
    status?: AssociateStatus;
    lastActive?: string;
    taskAssigned?: number;
    phoneNumber?: string;
    address?: string;
    profilePhoto?: string;
}
