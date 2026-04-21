import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    let stepIndex = 0;
    for (const title of titles) {
      await this.pipelineTemplateRepository.save(
        this.pipelineTemplateRepository.create({
          applicationTypeId,
          stepIndex: stepIndex++,
          title,
        }),
      );
    }
  }

  private async syncDocumentTemplates(applicationTypeId: string, code: string): Promise<void> {
    const sections = DOCUMENT_SECTIONS_BY_CODE[code];
    const existing = await this.documentRequirementRepository.find({
      where: { applicationTypeId },
    });
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
      for (const row of existing) {
        const refCount = await this.customerApplicationDocumentRepository.count({
          where: { documentRequirementId: row.id },
        });
        if (refCount === 0) {
          await this.documentRequirementRepository.delete({ id: row.id });
        } else {
          this.logger.warn(
            `Skipping delete of document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`,
          );
        }
      }
      return;
    }

    let sortOrder = 0;
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
          await this.documentRequirementRepository.save(prev);
        } else {
          await this.documentRequirementRepository.save(
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

    for (const row of existing) {
      if (desiredKeys.has(row.requirementKey)) {
        continue;
      }
      const refCount = await this.customerApplicationDocumentRepository.count({
        where: { documentRequirementId: row.id },
      });
      if (refCount === 0) {
        await this.documentRequirementRepository.delete({ id: row.id });
      } else {
        this.logger.warn(
          `Keeping stale document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`,
        );
      }
    }
  }
}
