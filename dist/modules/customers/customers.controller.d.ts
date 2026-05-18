import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { InviteCustomerDto } from './dto/invite-customer.dto';
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
        }[];
    }>;
    invite(dto: InviteCustomerDto, req: RequestWithJwtUser): Promise<{
        inviteSent: true;
        email: string;
        expiresAt: Date;
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
        }[];
    }[]>;
    me(req: RequestWithJwtUser): Promise<{
        id: string;
        name: string;
        email: string;
        applicationType: string | null;
    }>;
    myPipeline(req: RequestWithJwtUser): Promise<{
        customerId: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            pipelineSteps: Array<{
                stepIndex: number;
                title: string;
                completed: boolean;
                completedAt: Date | null;
            }>;
        }>;
    }>;
    myDocuments(req: RequestWithJwtUser): Promise<{
        customerId: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            summary: {
                uploaded: number;
                remaining: number;
                total: number;
            };
            documents: Array<{
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                status: string;
                uploaded: boolean;
                uploadedAt: Date | null;
            }>;
        }>;
    }>;
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
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
            pipelineSteps: {
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                itemLabel: string;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
            }[] | undefined;
        }[];
    }>;
    removeApplication(customerId: string, applicationId: string, req: RequestWithJwtUser): Promise<void>;
}
export {};
