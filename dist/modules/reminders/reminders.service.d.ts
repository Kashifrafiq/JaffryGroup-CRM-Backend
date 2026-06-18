import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user-role.enum';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService } from '../customers/pipeline-step-assignment.service';
import { DocumentAssignmentService } from '../customers/document-assignment.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { CustomerReminder } from './entities/customer-reminder.entity';
import { CreateCustomerReminderDto } from './dto/create-customer-reminder.dto';
import { UpdateCustomerReminderDto } from './dto/update-customer-reminder.dto';
type JwtActor = {
    id: string;
    role: UserRole;
};
export declare class RemindersService {
    private readonly reminderRepository;
    private readonly customerRepository;
    private readonly associateRepository;
    private readonly pipelineStepAssignmentService;
    private readonly documentAssignmentService;
    constructor(reminderRepository: Repository<CustomerReminder>, customerRepository: Repository<CustomerProfile>, associateRepository: Repository<AssociateProfile>, pipelineStepAssignmentService: PipelineStepAssignmentService, documentAssignmentService: DocumentAssignmentService);
    create(customerId: string, dto: CreateCustomerReminderDto, actor: JwtActor): Promise<CustomerReminder>;
    findByCustomer(customerId: string, actor: JwtActor): Promise<CustomerReminder[]>;
    findOne(customerId: string, reminderId: string, actor: JwtActor): Promise<CustomerReminder>;
    update(customerId: string, reminderId: string, dto: UpdateCustomerReminderDto, actor: JwtActor): Promise<CustomerReminder>;
    remove(customerId: string, reminderId: string, actor: JwtActor): Promise<void>;
    private assertCanAccessCustomer;
    private associateIdForUser;
}
export {};
