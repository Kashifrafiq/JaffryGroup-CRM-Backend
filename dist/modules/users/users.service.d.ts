import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateUserDto } from './dto/update-user.dto';
type UserView = {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    firstName: string;
    lastName: string;
    name: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    profilePhoto?: string;
    lastActive?: Date;
    taskAssigned?: number;
    createdAt: Date;
    updatedAt: Date;
};
export declare class UsersService {
    private readonly userRepository;
    private readonly adminProfileRepository;
    private readonly associateProfileRepository;
    private readonly customerProfileRepository;
    constructor(userRepository: Repository<User>, adminProfileRepository: Repository<AdminProfile>, associateProfileRepository: Repository<AssociateProfile>, customerProfileRepository: Repository<CustomerProfile>);
    create(createUserDto: CreateUserDto, createdBy?: Pick<User, 'id' | 'role'>): Promise<UserView>;
    createAssociate(createAssociateDto: CreateAssociateDto, createdBy?: Pick<User, 'id' | 'role'>): Promise<UserView>;
    findAll(): Promise<UserView[]>;
    findAssignedCustomers(associateId: string): Promise<UserView[]>;
    findOne(id: string): Promise<UserView>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserView>;
    assignCustomerToAssociate(customerId: string, associateId: string): Promise<UserView>;
    assignCustomerToAssociates(customerId: string, associateIds: string[]): Promise<{
        customerId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    assignCustomersToAssociate(associateId: string, customerIds: string[]): Promise<{
        associateId: string;
        assignedCustomerIds: string[];
        totalAssigned: number;
    }>;
    remove(id: string): Promise<void>;
    private getProfileFromUser;
    private createProfile;
    private saveProfile;
    private toUserView;
    private splitName;
    private generateTemporaryPassword;
}
export {};
