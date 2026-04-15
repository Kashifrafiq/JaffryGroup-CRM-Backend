import { UserRole } from '../entities/user.entity';
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    role: UserRole;
}
