import { UserRole } from '../entities/user-role.enum';
export declare class CreateCustomerDto {
    name: string;
    email: string;
    phone: string;
    property: string;
    applicationType?: string;
    applicationTypeId?: string;
    applicationTypeCode?: string;
    applicationTypeIds?: string[];
    applicationTypeCodes?: string[];
    role?: UserRole;
    address?: string;
    profilePhoto?: string;
}
