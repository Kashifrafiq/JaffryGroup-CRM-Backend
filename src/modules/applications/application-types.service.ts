import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';

@Injectable()
export class ApplicationTypesService {
  constructor(
    @InjectRepository(ApplicationType)
    private readonly applicationTypeRepository: Repository<ApplicationType>,
    @InjectRepository(ApplicationPipelineStepTemplate)
    private readonly pipelineTemplateRepository: Repository<ApplicationPipelineStepTemplate>,
    @InjectRepository(ApplicationDocumentRequirement)
    private readonly documentRequirementRepository: Repository<ApplicationDocumentRequirement>,
  ) {}

  findActive(): Promise<ApplicationType[]> {
    return this.applicationTypeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findActiveById(id: string): Promise<ApplicationType> {
    const row = await this.applicationTypeRepository.findOne({
      where: { id, isActive: true },
    });
    if (!row) {
      throw new NotFoundException('Application type not found or inactive');
    }
    return row;
  }

  async findActiveByCode(code: string): Promise<ApplicationType | null> {
    const normalized = code.trim().toLowerCase();
    return this.applicationTypeRepository.findOne({
      where: { code: normalized, isActive: true },
    });
  }

  async findActiveByNameIgnoreCase(name: string): Promise<ApplicationType | null> {
    return this.applicationTypeRepository
      .createQueryBuilder('t')
      .where('t.isActive = true')
      .andWhere('LOWER(t.name) = LOWER(:n)', { n: name.trim() })
      .getOne();
  }

  async getWorkflowTemplate(applicationTypeId: string) {
    const normalizedTypeId = applicationTypeId.trim();
    const type = await this.findActiveById(normalizedTypeId);
    const [pipelineRows, documentRows] = await Promise.all([
      this.pipelineTemplateRepository.find({
        where: { applicationTypeId: normalizedTypeId },
        order: { stepIndex: 'ASC' },
      }),
      this.documentRequirementRepository.find({
        where: { applicationTypeId: normalizedTypeId },
        order: { sortOrder: 'ASC' },
      }),
    ]);

    return {
      applicationType: {
        id: type.id,
        code: type.code,
        name: type.name,
      },
      pipelineSteps: pipelineRows.map((row) => ({
        stepIndex: row.stepIndex,
        title: row.title,
      })),
      documents: documentRows.map((row) => ({
        id: row.id,
        requirementKey: row.requirementKey,
        sectionTitle: row.sectionTitle,
        itemLabel: row.itemLabel,
        sortOrder: row.sortOrder,
      })),
    };
  }
}
