import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user-role.enum';
import { CustomerActivity } from './entities/customer-activity.entity';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { PipelineStepAssignmentService } from '../customers/pipeline-step-assignment.service';
import { DocumentAssignmentService } from '../customers/document-assignment.service';
type JwtActor = {
    id: string;
    role: UserRole;
};
export declare class ActivitiesService {
    private readonly activityRepository;
    private readonly customerRepository;
    private readonly associateRepository;
    private readonly pipelineStepAssignmentService;
    private readonly documentAssignmentService;
    constructor(activityRepository: Repository<CustomerActivity>, customerRepository: Repository<CustomerProfile>, associateRepository: Repository<AssociateProfile>, pipelineStepAssignmentService: PipelineStepAssignmentService, documentAssignmentService: DocumentAssignmentService);
    create(customerId: string, dto: CreateCustomerActivityDto, actor: JwtActor): Promise<CustomerActivity>;
    findByCustomer(customerId: string, actor: JwtActor): Promise<CustomerActivity[]>;
    remove(customerId: string, activityId: string, actor: JwtActor): Promise<void>;
    private assertCanAccessCustomer;
    private associateIdForUser;
    private assertAssociateAssignedToCustomer;
}
export {};
