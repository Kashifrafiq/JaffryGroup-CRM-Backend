import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssociatePipelineStep } from '../users/entities/associate-pipeline-step.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplication } from './entities/customer-application.entity';

export type PipelineStepAssignee = { id: string; name: string };

@Injectable()
export class PipelineStepAssignmentService {
  private readonly logger = new Logger(PipelineStepAssignmentService.name);

  constructor(
    @InjectRepository(AssociatePipelineStep)
    private readonly assignmentRepository: Repository<AssociatePipelineStep>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    @InjectRepository(CustomerApplicationPipelineProgress)
    private readonly pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
  ) {}

  async resolvePipelineProgress(
    customerId: string,
    applicationId: string,
    stepIndex: number,
  ): Promise<CustomerApplicationPipelineProgress> {
    const app = await this.applicationRepository.findOne({
      where: { id: applicationId, customerId },
      select: ['id'],
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for this customer`);
    }

    const row = await this.pipelineProgressRepository.findOne({
      where: { customerApplicationId: applicationId, stepIndex },
    });
    if (!row) {
      throw new NotFoundException(`Pipeline step ${stepIndex} not found for this application`);
    }
    return row;
  }

  async assignAssociatesToStep(
    pipelineProgressId: string,
    associateIds: string[],
  ): Promise<{ pipelineProgressId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    const progress = await this.pipelineProgressRepository.findOne({
      where: { id: pipelineProgressId },
    });
    if (!progress) {
      throw new NotFoundException('Pipeline step not found');
    }

    const uniqueAssociateIds = [...new Set(associateIds.map((id) => id.trim()).filter(Boolean))];
    const assignedAssociateIds: string[] = [];

    for (const associateId of uniqueAssociateIds) {
      const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
      if (!associate) {
        throw new NotFoundException(`Associate ${associateId} not found`);
      }

      const existing = await this.assignmentRepository.findOne({
        where: { associateId, pipelineProgressId },
      });
      if (!existing) {
        await this.assignmentRepository.save(
          this.assignmentRepository.create({ associateId, pipelineProgressId }),
        );
      }
      assignedAssociateIds.push(associateId);
    }

    return { pipelineProgressId, assignedAssociateIds, totalAssigned: assignedAssociateIds.length };
  }

  async unassignAssociateFromStep(
    pipelineProgressId: string,
    associateId: string,
  ): Promise<{ pipelineProgressId: string; associateId: string; removed: boolean }> {
    const result = await this.assignmentRepository.delete({ pipelineProgressId, associateId });
    return {
      pipelineProgressId,
      associateId,
      removed: (result.affected ?? 0) > 0,
    };
  }

  async replaceAssociatesOnStep(
    pipelineProgressId: string,
    associateIds: string[],
  ): Promise<{ pipelineProgressId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    await this.assignmentRepository.delete({ pipelineProgressId });
    if (!associateIds.length) {
      return { pipelineProgressId, assignedAssociateIds: [], totalAssigned: 0 };
    }
    return this.assignAssociatesToStep(pipelineProgressId, associateIds);
  }

  async assignAllStepsForCustomerToAssociate(
    customerId: string,
    associateId: string,
  ): Promise<number> {
    const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
    if (!associate) {
      throw new NotFoundException(`Associate ${associateId} not found`);
    }

    const apps = await this.applicationRepository.find({
      where: { customerId },
      select: ['id'],
    });
    if (!apps.length) {
      return 0;
    }

    const progressRows = await this.pipelineProgressRepository.find({
      where: {
        customerApplicationId: In(apps.map((a) => a.id)),
        isActive: true,
      },
      select: ['id'],
    });

    let assigned = 0;
    for (const row of progressRows) {
      const existing = await this.assignmentRepository.findOne({
        where: { associateId, pipelineProgressId: row.id },
      });
      if (!existing) {
        await this.assignmentRepository.save(
          this.assignmentRepository.create({ associateId, pipelineProgressId: row.id }),
        );
        assigned += 1;
      }
    }
    return assigned;
  }

  async getCustomerIdsForAssociate(associateId: string): Promise<string[]> {
    const links = await this.assignmentRepository
      .createQueryBuilder('aps')
      .innerJoin('aps.pipelineProgress', 'pp')
      .innerJoin('pp.customerApplication', 'app')
      .where('aps.associateId = :associateId', { associateId })
      .select('DISTINCT app.customerId', 'customerId')
      .getRawMany<{ customerId: string }>();

    return links.map((r) => r.customerId);
  }

  async hasAccessToCustomer(associateId: string, customerId: string): Promise<boolean> {
    const count = await this.assignmentRepository
      .createQueryBuilder('aps')
      .innerJoin('aps.pipelineProgress', 'pp')
      .innerJoin('pp.customerApplication', 'app')
      .where('aps.associateId = :associateId', { associateId })
      .andWhere('app.customerId = :customerId', { customerId })
      .getCount();
    return count > 0;
  }

  async hasAccessToApplication(associateId: string, customerApplicationId: string): Promise<boolean> {
    const count = await this.assignmentRepository
      .createQueryBuilder('aps')
      .innerJoin('aps.pipelineProgress', 'pp')
      .where('aps.associateId = :associateId', { associateId })
      .andWhere('pp.customerApplicationId = :customerApplicationId', { customerApplicationId })
      .getCount();
    return count > 0;
  }

  async hasAccessToStep(
    associateId: string,
    customerApplicationId: string,
    stepIndex: number,
  ): Promise<boolean> {
    const count = await this.assignmentRepository
      .createQueryBuilder('aps')
      .innerJoin('aps.pipelineProgress', 'pp')
      .where('aps.associateId = :associateId', { associateId })
      .andWhere('pp.customerApplicationId = :customerApplicationId', { customerApplicationId })
      .andWhere('pp.stepIndex = :stepIndex', { stepIndex })
      .getCount();
    return count > 0;
  }

  async getAssignedPipelineProgressIdsForAssociate(
    associateId: string,
    customerId: string,
    applicationId?: string,
  ): Promise<string[]> {
    const qb = this.assignmentRepository
      .createQueryBuilder('aps')
      .innerJoin('aps.pipelineProgress', 'pp')
      .innerJoin('pp.customerApplication', 'app')
      .where('aps.associateId = :associateId', { associateId })
      .andWhere('app.customerId = :customerId', { customerId })
      .select('pp.id', 'pipelineProgressId');

    if (applicationId?.trim()) {
      qb.andWhere('app.id = :applicationId', { applicationId: applicationId.trim() });
    }

    const rows = await qb.getRawMany<{ pipelineProgressId: string }>();
    return rows.map((r) => r.pipelineProgressId);
  }

  async getAssigneesByProgressIds(
    progressIds: string[],
  ): Promise<Map<string, PipelineStepAssignee[]>> {
    const result = new Map<string, PipelineStepAssignee[]>();
    if (!progressIds.length) {
      return result;
    }

    const links = await this.assignmentRepository.find({
      where: { pipelineProgressId: In(progressIds) },
      relations: ['associate'],
    });

    for (const link of links) {
      const assignees = result.get(link.pipelineProgressId) ?? [];
      assignees.push({
        id: link.associate.id,
        name: `${link.associate.firstName} ${link.associate.lastName}`.trim(),
      });
      result.set(link.pipelineProgressId, assignees);
    }
    return result;
  }

  async getAssigneesForCustomerApplications(
    customerId: string,
  ): Promise<Map<string, Map<number, PipelineStepAssignee[]>>> {
    const apps = await this.applicationRepository.find({
      where: { customerId },
      relations: ['pipelineProgress'],
    });

    const progressIds = apps.flatMap((a) => (a.pipelineProgress ?? []).map((p) => p.id));
    const assigneesByProgressId = await this.getAssigneesByProgressIds(progressIds);

    const byApplication = new Map<string, Map<number, PipelineStepAssignee[]>>();
    for (const app of apps) {
      const stepMap = new Map<number, PipelineStepAssignee[]>();
      for (const step of app.pipelineProgress ?? []) {
        stepMap.set(step.stepIndex, assigneesByProgressId.get(step.id) ?? []);
      }
      byApplication.set(app.id, stepMap);
    }
    return byApplication;
  }
}
