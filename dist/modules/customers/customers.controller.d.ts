import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerApplicationDto } from './dto/create-customer-application.dto';
import { UpdateCustomerApplicationDto } from './dto/update-customer-application.dto';
type RequestWithJwtUser = {
    user: Pick<User, 'id' | 'email' | 'role'>;
};
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    private actor;
    create(dto: CreateCustomerApiDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }>;
    findAll(query: ListCustomersQueryDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }[]>;
    findOne(customerId: string, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }>;
    update(customerId: string, dto: UpdateCustomerDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }>;
    remove(customerId: string, req: RequestWithJwtUser): Promise<void>;
    addApplication(customerId: string, dto: CreateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }>;
    updateApplication(customerId: string, applicationId: string, dto: UpdateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | undefined;
        name: string;
        email: string;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
        }[];
    }>;
    removeApplication(customerId: string, applicationId: string, req: RequestWithJwtUser): Promise<void>;
}
export {};
