import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
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
    private readonly associateCustomerRepository;
    private readonly associateProfileRepository;
    private readonly customerInviteRepository;
    private readonly userRepository;
    private readonly applicationTypesService;
    private readonly applicationWorkflowService;
    private readonly customerApplicationWorkflowService;
    private readonly customerInviteMailService;
    private readonly configService;
    private readonly dataSource;
    private readonly logger;
    constructor(customerRepository: Repository<CustomerProfile>, applicationRepository: Repository<CustomerApplication>, associateCustomerRepository: Repository<AssociateCustomer>, associateProfileRepository: Repository<AssociateProfile>, customerInviteRepository: Repository<CustomerInvite>, userRepository: Repository<User>, applicationTypesService: ApplicationTypesService, applicationWorkflowService: ApplicationWorkflowService, customerApplicationWorkflowService: CustomerApplicationWorkflowService, customerInviteMailService: CustomerInviteMailService, configService: ConfigService, dataSource: DataSource);
    create(dto: CreateCustomerApiDto, createdBy: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>>;
    inviteCustomer(dto: InviteCustomerDto, actor: JwtActor): Promise<{
        inviteSent: true;
        email: string;
        expiresAt: Date;
    }>;
    createFromLegacyDto(dto: CreateCustomerDto, createdBy?: JwtActor): Promise<CustomerProfile>;
    findAll(actor: JwtActor, query: ListCustomersQueryDto): Promise<ReturnType<CustomersService['toCustomerSummary']>[]>;
    findMyInfo(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        applicationType: string | null;
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
                uploadedAt: Date | null;
            }>;
        }>;
    }>;
    findOneDetail(customerId: string, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>>;
    updateCustomer(customerId: string, dto: UpdateCustomerDto, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>>;
    removeCustomer(customerId: string, actor: JwtActor): Promise<void>;
    addApplication(customerId: string, dto: CreateCustomerApplicationDto, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>>;
    updateApplication(customerId: string, applicationId: string, dto: UpdateCustomerApplicationDto, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>>;
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
    private resolveApplicationType;
    private resolveApplicationTypeForLegacy;
    private resolveTypeFromLegacyLabel;
    private splitName;
    private toCustomerSummary;
}
