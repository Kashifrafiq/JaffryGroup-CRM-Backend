import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';
import { CustomerApplicationDocument } from './entities/customer-application-document.entity';
import { DOCUMENT_SECTIONS_BY_CODE } from './data/workflow-documents.data';
import { pipelineTitlesForApplicationTypeCode } from './data/workflow-pipelines.data';

@Injectable()
export class ApplicationWorkflowTemplatesSeedService {
  private readonly logger = new Logger(ApplicationWorkflowTemplatesSeedService.name);

  constructor(
    @InjectRepository(ApplicationType)
    private readonly applicationTypeRepository: Repository<ApplicationType>,
    @InjectRepository(ApplicationPipelineStepTemplate)
    private readonly pipelineTemplateRepository: Repository<ApplicationPipelineStepTemplate>,
    @InjectRepository(ApplicationDocumentRequirement)
    private readonly documentRequirementRepository: Repository<ApplicationDocumentRequirement>,
    @InjectRepository(CustomerApplicationDocument)
    private readonly customerApplicationDocumentRepository: Repository<CustomerApplicationDocument>,
  ) {}

  async seedTemplates(): Promise<void> {
    const types = await this.applicationTypeRepository.find();
    for (const type of types) {
      const code = type.code.trim().toLowerCase();
      await this.syncPipelineTemplates(type.id, code);
      await this.syncDocumentTemplates(type.id, code);
    }
    this.logger.log('Application workflow templates synced (pipelines + document requirements)');
  }

  private async syncPipelineTemplates(applicationTypeId: string, code: string): Promise<void> {
    const titles = [...pipelineTitlesForApplicationTypeCode(code)];
    await this.pipelineTemplateRepository.delete({ applicationTypeId });
    if (!titles.length) {
      return;
    }
    await this.pipelineTemplateRepository.save(
      titles.map((title, stepIndex) =>
        this.pipelineTemplateRepository.create({
          applicationTypeId,
          stepIndex,
          title,
        }),
      ),
    );
  }

  private async syncDocumentTemplates(applicationTypeId: string, code: string): Promise<void> {
    const sections = DOCUMENT_SECTIONS_BY_CODE[code];
    const existing = await this.documentRequirementRepository.find({
      where: { applicationTypeId },
    });
    const referencedCounts = await this.getRequirementReferenceCounts(existing.map((r) => r.id));
    const existingByKey = new Map(existing.map((r) => [r.requirementKey, r]));

    const desiredKeys = new Set<string>();
    if (sections?.length) {
      for (let si = 0; si < sections.length; si++) {
        const section = sections[si];
        for (let ii = 0; ii < section.items.length; ii++) {
          desiredKeys.add(`${code}_s${si}_i${ii}`);
        }
      }
    }

    if (!sections?.length) {
      const deletableIds: string[] = [];
      for (const row of existing) {
        const refCount = referencedCounts.get(row.id) ?? 0;
        if (refCount === 0) {
          deletableIds.push(row.id);
        } else {
          this.logger.warn(
            `Skipping delete of document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`,
          );
        }
      }
      if (deletableIds.length) {
        await this.documentRequirementRepository.delete({ id: In(deletableIds) });
      }
      return;
    }

    let sortOrder = 0;
    const rowsToSave: ApplicationDocumentRequirement[] = [];
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      for (let ii = 0; ii < section.items.length; ii++) {
        const requirementKey = `${code}_s${si}_i${ii}`;
        const itemLabel = section.items[ii];
        const prev = existingByKey.get(requirementKey);
        if (prev) {
          prev.sectionTitle = section.sectionTitle;
          prev.itemLabel = itemLabel;
          prev.sortOrder = sortOrder++;
          rowsToSave.push(prev);
        } else {
          rowsToSave.push(
            this.documentRequirementRepository.create({
              applicationTypeId,
              requirementKey,
              sectionTitle: section.sectionTitle,
              itemLabel,
              sortOrder: sortOrder++,
            }),
          );
        }
      }
    }
    if (rowsToSave.length) {
      await this.documentRequirementRepository.save(rowsToSave);
    }

    const staleDeletableIds: string[] = [];
    for (const row of existing) {
      if (desiredKeys.has(row.requirementKey)) {
        continue;
      }
      const refCount = referencedCounts.get(row.id) ?? 0;
      if (refCount === 0) {
        staleDeletableIds.push(row.id);
      } else {
        this.logger.warn(
          `Keeping stale document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`,
        );
      }
    }
    if (staleDeletableIds.length) {
      await this.documentRequirementRepository.delete({ id: In(staleDeletableIds) });
    }
  }

  private async getRequirementReferenceCounts(requirementIds: string[]): Promise<Map<string, number>> {
    if (!requirementIds.length) {
      return new Map();
    }
    const raw = await this.customerApplicationDocumentRepository
      .createQueryBuilder('cad')
      .select('cad.documentRequirementId', 'id')
      .addSelect('COUNT(*)', 'count')
      .where('cad.documentRequirementId IN (:...ids)', { ids: requirementIds })
      .groupBy('cad.documentRequirementId')
      .getRawMany<{ id: string; count: string }>();

    return new Map(raw.map((row) => [row.id, Number(row.count)]));
  }
}
