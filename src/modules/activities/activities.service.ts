import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(CustomerActivity)
    private readonly activityRepository: Repository<CustomerActivity>,
    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,
    @InjectRepository(AssociateProfile)
    private readonly associateRepository: Repository<AssociateProfile>,
    private readonly pipelineStepAssignmentService: PipelineStepAssignmentService,
    private readonly documentAssignmentService: DocumentAssignmentService,
  ) {}

  async create(
    customerId: string,
    dto: CreateCustomerActivityDto,
    actor: JwtActor,
  ): Promise<CustomerActivity> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    let associateId: string | null = null;
    if (actor.role === UserRole.ASSOCIATE) {
      associateId = await this.associateIdForUser(actor.id);
      await this.assertAssociateAssignedToCustomer(associateId, customerId);
    } else if (dto.associateId) {
      associateId = dto.associateId.trim();
      await this.assertAssociateAssignedToCustomer(associateId, customerId);
    }

    const row = this.activityRepository.create({
      customerId,
      associateId,
      activityType: dto.activityType,
      details: dto.details.trim(),
      createdByUserId: actor.id,
    });
    return this.activityRepository.save(row);
  }

  async findByCustomer(customerId: string, actor: JwtActor): Promise<CustomerActivity[]> {
    await this.assertCanAccessCustomer(actor, customerId);
    return this.activityRepository.find({
      where: { customerId },
      relations: ['associate'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(customerId: string, activityId: string, actor: JwtActor): Promise<void> {
    await this.assertCanAccessCustomer(actor, customerId);
    const row = await this.activityRepository.findOne({
      where: { id: activityId, customerId },
      relations: ['associate'],
    });
    if (!row) {
      throw new NotFoundException(`Activity #${activityId} not found for this customer`);
    }

    if (actor.role === UserRole.ASSOCIATE) {
      const associateId = await this.associateIdForUser(actor.id);
      if (!row.associateId || row.associateId !== associateId) {
        throw new ForbiddenException('You can only delete your own activities');
      }
    }

    await this.activityRepository.remove(row);
  }

  private async assertCanAccessCustomer(actor: JwtActor, customerId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const associateId = await this.associateIdForUser(actor.id);
    await this.assertAssociateAssignedToCustomer(associateId, customerId);
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

  private async assertAssociateAssignedToCustomer(
    associateId: string,
    customerId: string,
  ): Promise<void> {
    const [pipelineAllowed, documentAllowed] = await Promise.all([
      this.pipelineStepAssignmentService.hasAccessToCustomer(associateId, customerId),
      this.documentAssignmentService.hasAccessToCustomer(associateId, customerId),
    ]);
    if (!pipelineAllowed && !documentAllowed) {
      throw new ForbiddenException('You do not have access to this customer');
    }
  }
}
