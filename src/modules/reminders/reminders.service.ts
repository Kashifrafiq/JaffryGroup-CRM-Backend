import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user-role.enum';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService } from '../customers/pipeline-step-assignment.service';
import { DocumentAssignmentService } from '../customers/document-assignment.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { CustomerReminder } from './entities/customer-reminder.entity';
import { CreateCustomerReminderDto } from './dto/create-customer-reminder.dto';
import { UpdateCustomerReminderDto } from './dto/update-customer-reminder.dto';
import { CustomerReminderStatus } from './entities/customer-reminder.enums';

type JwtActor = {
  id: string;
  role: UserRole;
};

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(CustomerReminder)
    private readonly reminderRepository: Repository<CustomerReminder>,
    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,
    @InjectRepository(AssociateProfile)
    private readonly associateRepository: Repository<AssociateProfile>,
    private readonly pipelineStepAssignmentService: PipelineStepAssignmentService,
    private readonly documentAssignmentService: DocumentAssignmentService,
  ) {}

  async create(
    customerId: string,
    dto: CreateCustomerReminderDto,
    actor: JwtActor,
  ): Promise<CustomerReminder> {
    await this.assertCanAccessCustomer(actor, customerId);
    const customer = await this.customerRepository.findOne({ where: { id: customerId }, select: ['id'] });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const associateId = actor.role === UserRole.ASSOCIATE ? await this.associateIdForUser(actor.id) : null;
    const row = this.reminderRepository.create({
      customerId,
      associateId,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      remindAt: new Date(dto.remindAt),
      status: dto.status ?? CustomerReminderStatus.PENDING,
      createdByUserId: actor.id,
    });
    return this.reminderRepository.save(row);
  }

  async findByCustomer(customerId: string, actor: JwtActor): Promise<CustomerReminder[]> {
    await this.assertCanAccessCustomer(actor, customerId);
    return this.reminderRepository.find({
      where: { customerId },
      relations: ['associate'],
      order: { remindAt: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(customerId: string, reminderId: string, actor: JwtActor): Promise<CustomerReminder> {
    await this.assertCanAccessCustomer(actor, customerId);
    const row = await this.reminderRepository.findOne({
      where: { id: reminderId, customerId },
      relations: ['associate'],
    });
    if (!row) {
      throw new NotFoundException(`Reminder #${reminderId} not found for this customer`);
    }
    return row;
  }

  async update(
    customerId: string,
    reminderId: string,
    dto: UpdateCustomerReminderDto,
    actor: JwtActor,
  ): Promise<CustomerReminder> {
    const row = await this.findOne(customerId, reminderId, actor);

    if (actor.role === UserRole.ASSOCIATE && row.createdByUserId !== actor.id) {
      throw new ForbiddenException('You can only update reminders created by you');
    }

    if (dto.title !== undefined) row.title = dto.title.trim();
    if (dto.description !== undefined) row.description = dto.description?.trim() ?? null;
    if (dto.remindAt !== undefined) row.remindAt = new Date(dto.remindAt);
    if (dto.status !== undefined) row.status = dto.status;

    return this.reminderRepository.save(row);
  }

  async remove(customerId: string, reminderId: string, actor: JwtActor): Promise<void> {
    const row = await this.findOne(customerId, reminderId, actor);
    if (actor.role === UserRole.ASSOCIATE && row.createdByUserId !== actor.id) {
      throw new ForbiddenException('You can only delete reminders created by you');
    }
    await this.reminderRepository.remove(row);
  }

  private async assertCanAccessCustomer(actor: JwtActor, customerId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const associateId = await this.associateIdForUser(actor.id);
    const [pipelineAllowed, documentAllowed] = await Promise.all([
      this.pipelineStepAssignmentService.hasAccessToCustomer(associateId, customerId),
      this.documentAssignmentService.hasAccessToCustomer(associateId, customerId),
    ]);
    if (!pipelineAllowed && !documentAllowed) {
      throw new ForbiddenException('You do not have access to this customer');
    }
  }

  private async associateIdForUser(userId: string): Promise<string> {
    const associate = await this.associateRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!associate) {
      throw new ForbiddenException('Associate profile not found');
    }
    return associate.id;
  }
}
