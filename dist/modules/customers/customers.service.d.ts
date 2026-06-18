import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService, PipelineStepAssignee } from './pipeline-step-assignment.service';
import { DocumentAssignmentService, DocumentAssignee } from './document-assignment.service';
import { CreateCustomerDto } from '../users/dto/create-customer.dto';
import { CustomerApplication } from './entities/customer-application.entity';
import { ApplicationTypesService } from '../applications/application-types.service';
import { ApplicationWorkflowService } from '../applications/application-workflow.service';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerApplicationDto } from './dto/create-customer-application.dto';
import { UpdateCustomerApplicationDto } from './dto/update-customer-application.dto';
import { InviteCustomerDto } from './dto/invite-customer.dto';
import { CustomerInvite } from './entities/customer-invite.entity';
import { CustomerInviteMailService } from './customer-invite-mail.service';
export declare class CustomersService {
    private readonly customerRepository;
    private readonly applicationRepository;
    private readonly associateProfileRepository;
    private readonly pipelineStepAssignmentService;
    private readonly documentAssignmentService;
    private readonly customerInviteRepository;
    private readonly userRepository;
    private readonly applicationTypesService;
    private readonly applicationWorkflowService;
    private readonly customerApplicationWorkflowService;
    private readonly customerInviteMailService;
    private readonly configService;
    private readonly dataSource;
    private readonly logger;
    constructor(customerRepository: Repository<CustomerProfile>, applicationRepository: Repository<CustomerApplication>, associateProfileRepository: Repository<AssociateProfile>, pipelineStepAssignmentService: PipelineStepAssignmentService, documentAssignmentService: DocumentAssignmentService, customerInviteRepository: Repository<CustomerInvite>, userRepository: Repository<User>, applicationTypesService: ApplicationTypesService, applicationWorkflowService: ApplicationWorkflowService, customerApplicationWorkflowService: CustomerApplicationWorkflowService, customerInviteMailService: CustomerInviteMailService, configService: ConfigService, dataSource: DataSource);
    create(dto: CreateCustomerApiDto, createdBy: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>;
    inviteCustomer(dto: InviteCustomerDto, actor: JwtActor): Promise<{
        inviteSent: true;
        email: string;
        expiresAt: Date;
    }>;
    createFromLegacyDto(dto: CreateCustomerDto, createdBy?: JwtActor): Promise<CustomerProfile>;
    findAll(actor: JwtActor, query: ListCustomersQueryDto): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>[]>;
    findMyInfo(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
        }>;
    }>;
    findMyPipelineProgress(userId: string): Promise<{
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
    findMyDocuments(userId: string): Promise<{
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
                uploadedByMe: boolean;
                uploadedAt: Date | null;
                canPreview: boolean;
                originalFilename: string | null;
                fileCount: number;
                files: Array<{
                    id: string;
                    originalFilename: string | null;
                    uploadedAt: Date | null;
                    uploadedByMe: boolean;
                    canPreview: boolean;
                }>;
            }>;
        }>;
    }>;
    findCustomerDocuments(customerId: string, actor: JwtActor, query: {
        associateId: string;
        applicationId?: string;
    }): Promise<{
        customerId: string;
        customerName: string;
        associateId: string;
        associateName: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                code: string;
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
                sortOrder: number;
                status: string;
                uploaded: boolean;
                fileCount: number;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                sizeBytes: string | null;
                uploadedAt: Date | null;
                uploadedByUserId: string | null;
                notes: string | null;
                assignedTo: DocumentAssignee[];
                files: Array<{
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }>;
            }>;
        }>;
    }>;
    findCustomerPipelineSteps(customerId: string, actor: JwtActor, query: {
        associateId: string;
        applicationId?: string;
    }): Promise<{
        customerId: string;
        customerName: string;
        associateId: string;
        associateName: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            summary: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: Array<{
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: PipelineStepAssignee[];
            }>;
        }>;
    }>;
    findOneDetail(customerId: string, actor: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>;
    updateCustomer(customerId: string, dto: UpdateCustomerDto, actor: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>;
    removeCustomer(customerId: string, actor: JwtActor): Promise<void>;
    addApplication(customerId: string, dto: CreateCustomerApplicationDto, actor: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>;
    updateApplication(customerId: string, applicationId: string, dto: UpdateCustomerApplicationDto, actor: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>;
    removeApplication(customerId: string, applicationId: string, actor: JwtActor): Promise<void>;
    private queryCustomersWithFiltersForList;
    private intersectIdSets;
    private customerIdsForAssociateUser;
    private assertCanAccessCustomer;
    private assertAdminOrAssociate;
    private assertEmailAvailable;
    private assertCustomerEmailAvailableForInvite;
    private hashToken;
    private getCustomerInviteExpiryDate;
    private resolveAssociateAssignmentOnCreate;
    private attachAssignedAssociates;
    private uniqueAssignees;
    private assertHasApplicationTypeInput;
    private instantiateApplicationsForCustomer;
    private resolveApplicationTypes;
    private resolveApplicationTypesForLegacy;
    private resolveApplicationType;
    private resolveTypeFromLegacyLabel;
    private uploaderRoleMapForDocuments;
    private splitName;
    private toCustomerSummary;
}
