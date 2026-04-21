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
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }>;
    findAll(query: ListCustomersQueryDto, req: RequestWithJwtUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }[]>;
    findOne(customerId: string, req: RequestWithJwtUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }>;
    update(customerId: string, dto: UpdateCustomerDto, req: RequestWithJwtUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }>;
    remove(customerId: string, req: RequestWithJwtUser): Promise<void>;
    addApplication(customerId: string, dto: CreateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }>;
    updateApplication(customerId: string, applicationId: string, dto: UpdateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string;
        phoneNumber: string | undefined;
        property: string | undefined;
        address: string | undefined;
        profilePhoto: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        applications: {
            id: string;
            status: import("./entities/customer-application-status.enum").CustomerApplicationStatus;
            pipeline: Record<string, unknown> | null;
            createdAt: Date;
            updatedAt: Date;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            workflow: {
                applicationId: string;
                applicationType: {
                    id: string;
                    code: string;
                    name: string;
                };
                pipelineSteps: {
                    stepIndex: number;
                    title: string;
                    completedAt: Date | null;
                }[];
                documents: {
                    id: string;
                    status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                    requirementKey: string;
                    sectionTitle: string;
                    itemLabel: string;
                    sortOrder: number;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                    notes: string | null;
                }[];
            };
        }[];
    }>;
    removeApplication(customerId: string, applicationId: string, req: RequestWithJwtUser): Promise<void>;
}
export {};
