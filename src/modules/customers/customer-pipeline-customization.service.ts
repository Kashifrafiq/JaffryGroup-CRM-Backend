import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerPipelineStepOverrideDto } from './dto/customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './dto/customer-custom-pipeline-step.dto';

@Injectable()
export class CustomerPipelineCustomizationService {
  constructor(
    @InjectRepository(CustomerApplicationPipelineProgress)
    private readonly pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
  ) {}

  async applyOnCreate(
    customerId: string,
    overrides: CustomerPipelineStepOverrideDto[] = [],
    customPipelineSteps: CustomerCustomPipelineStepDto[] = [],
  ): Promise<void> {
    if (!overrides.length && !customPipelineSteps.length) {
      return;
    }
    const apps = await this.loadApplications(customerId);
    if (overrides.length) {
      await this.applyOverrides(apps, overrides, 'create');
    }
    if (customPipelineSteps.length) {
      await this.insertCustomPipelineSteps(apps, customPipelineSteps);
    }
  }

  async applyOnUpdate(
    customerId: string,
    overrides: CustomerPipelineStepOverrideDto[] = [],
    customPipelineSteps: CustomerCustomPipelineStepDto[] = [],
  ): Promise<void> {
    if (!overrides.length && !customPipelineSteps.length) {
      return;
    }
    const apps = await this.loadApplications(customerId);
    if (overrides.length) {
      await this.applyOverrides(apps, overrides, 'update');
    }
    if (customPipelineSteps.length) {
      await this.insertCustomPipelineSteps(apps, customPipelineSteps);
    }
  }

  async applySingleOverride(
    customerId: string,
    applicationId: string,
    pipelineProgressId: string,
    patch: Pick<CustomerPipelineStepOverrideDto, 'title' | 'removed'>,
  ): Promise<CustomerApplicationPipelineProgress> {
    const step = await this.pipelineProgressRepository
      .createQueryBuilder('step')
      .innerJoin('step.customerApplication', 'app')
      .where('step.id = :pipelineProgressId', { pipelineProgressId })
      .andWhere('app.id = :applicationId', { applicationId })
      .andWhere('app.customerId = :customerId', { customerId })
      .getOne();
    if (!step) {
      throw new NotFoundException(
        `Pipeline step #${pipelineProgressId} not found for customer #${customerId}`,
      );
    }
    this.patchPipelineRow(step, patch);
    return this.pipelineProgressRepository.save(step);
  }

  async addCustomPipelineStep(
    customerId: string,
    applicationId: string,
    dto: CustomerCustomPipelineStepDto,
  ): Promise<CustomerApplicationPipelineProgress> {
    const apps = await this.loadApplications(customerId);
    const app = apps.find((a) => a.id === applicationId);
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for customer #${customerId}`);
    }
    const [created] = await this.insertCustomPipelineSteps([app], [dto]);
    return created;
  }

  private async loadApplications(customerId: string): Promise<CustomerApplication[]> {
    return this.applicationRepository.find({
      where: { customerId },
      relations: ['applicationType', 'pipelineProgress'],
    });
  }

  private async applyOverrides(
    apps: CustomerApplication[],
    overrides: CustomerPipelineStepOverrideDto[],
    mode: 'create' | 'update',
  ): Promise<void> {
    for (const override of overrides) {
      const step = this.resolveStepForOverride(apps, override, mode);
      this.patchPipelineRow(step, override);
      await this.pipelineProgressRepository.save(step);
    }
  }

  private resolveStepForOverride(
    apps: CustomerApplication[],
    override: CustomerPipelineStepOverrideDto,
    mode: 'create' | 'update',
  ): CustomerApplicationPipelineProgress {
    if (override.pipelineProgressId?.trim()) {
      if (mode === 'create') {
        throw new BadRequestException(
          'pipelineProgressId is only valid when editing an existing customer',
        );
      }
      const match = apps
        .flatMap((app) => app.pipelineProgress ?? [])
        .find((step) => step.id === override.pipelineProgressId!.trim());
      if (!match) {
        throw new NotFoundException(
          `Pipeline step #${override.pipelineProgressId} not found for this customer`,
        );
      }
      return match;
    }

    if (override.stepIndex === undefined) {
      throw new BadRequestException('Provide stepIndex or pipelineProgressId for pipelineOverrides');
    }

    const scopedApps = this.filterApps(apps, override);
    if (scopedApps.length !== 1) {
      throw new BadRequestException(
        scopedApps.length === 0
          ? `No application found for pipeline override stepIndex ${override.stepIndex}`
          : `Multiple applications match stepIndex ${override.stepIndex} — provide applicationTypeId or applicationTypeCode`,
      );
    }

    const step = (scopedApps[0].pipelineProgress ?? []).find(
      (row) => row.stepIndex === override.stepIndex,
    );
    if (!step) {
      throw new NotFoundException(
        `No pipeline step with stepIndex ${override.stepIndex} found for this customer application`,
      );
    }
    return step;
  }

  private async insertCustomPipelineSteps(
    apps: CustomerApplication[],
    customPipelineSteps: CustomerCustomPipelineStepDto[],
  ): Promise<CustomerApplicationPipelineProgress[]> {
    const created: CustomerApplicationPipelineProgress[] = [];
    for (const entry of customPipelineSteps) {
      const scopedApps = this.filterApps(apps, entry);
      if (scopedApps.length !== 1) {
        throw new BadRequestException(
          scopedApps.length === 0
            ? 'No application found for customPipelineSteps entry'
            : 'Multiple applications match customPipelineSteps entry — provide applicationTypeId or applicationTypeCode',
        );
      }
      const app = scopedApps[0];
      const maxIndex = (app.pipelineProgress ?? []).reduce(
        (max, step) => Math.max(max, step.stepIndex),
        -1,
      );
      const stepIndex = entry.stepIndex ?? maxIndex + 1;
      const existing = (app.pipelineProgress ?? []).find((step) => step.stepIndex === stepIndex);
      if (existing) {
        throw new BadRequestException(
          `Pipeline stepIndex ${stepIndex} already exists for this customer application`,
        );
      }
      const row = this.pipelineProgressRepository.create({
        customerApplicationId: app.id,
        pipelineStepTemplateId: null,
        stepIndex,
        title: entry.title.trim(),
        isCustom: true,
        isActive: true,
        completedAt: null,
      });
      const saved = await this.pipelineProgressRepository.save(row);
      app.pipelineProgress = [...(app.pipelineProgress ?? []), saved];
      created.push(saved);
    }
    return created;
  }

  private filterApps<
    T extends { applicationTypeId?: string; applicationTypeCode?: string },
  >(apps: CustomerApplication[], ref: T): CustomerApplication[] {
    if (ref.applicationTypeId?.trim()) {
      return apps.filter((app) => app.applicationTypeId === ref.applicationTypeId!.trim());
    }
    if (ref.applicationTypeCode?.trim()) {
      const code = ref.applicationTypeCode.trim().toLowerCase();
      return apps.filter((app) => app.applicationType?.code === code);
    }
    if (apps.length === 1) {
      return apps;
    }
    return apps;
  }

  private patchPipelineRow(
    step: CustomerApplicationPipelineProgress,
    patch: Pick<CustomerPipelineStepOverrideDto, 'title' | 'removed'>,
  ): void {
    if (patch.title !== undefined) {
      step.title = patch.title.trim();
    }
    if (patch.removed !== undefined) {
      step.isActive = !patch.removed;
    }
  }
}
