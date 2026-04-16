import { UserRole } from './entities/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { BulkAssignAssociatesDto, BulkAssignCustomersDto } from './dto/bulk-assign.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
type JwtRequestUser = {
    id: string;
    email: string;
    role: UserRole;
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: {
        user: JwtRequestUser;
    }): Promise<{
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
    }>;
    createCustomer(createCustomerDto: CreateCustomerDto, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-profile.entity").CustomerProfile>;
    findAll(): Promise<{
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
    }[]>;
    getMyCustomers(req: {
        user: JwtRequestUser;
    }): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
    }>;
    assign(customerId: string, associateId: string): Promise<import("./entities/associate-customer.entity").AssociateCustomer>;
    assignCustomerToMultipleAssociates(customerId: string, body: BulkAssignAssociatesDto): Promise<{
        customerId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    assignMultipleCustomersToAssociate(associateId: string, body: BulkAssignCustomersDto): Promise<{
        associateId: string;
        assignedCustomerIds: string[];
        totalAssigned: number;
    }>;
    remove(id: string): Promise<void>;
}
export {};
