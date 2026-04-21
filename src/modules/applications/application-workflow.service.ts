import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';
import { CustomerApplicationPipelineProgress } from './entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from './entities/customer-application-document.entity';
import { CustomerApplicationDocumentStatus } from './entities/customer-application-document-status.enum';

@Injectable()
export class ApplicationWorkflowService {
  /**
   * Creates per-application pipeline rows and document slots from templates for the given type.
   */
  async instantiateForNewApplication(
    manager: EntityManager,
    customerApplicationId: string,
    applicationTypeId: string,
  ): Promise<void> {
    const pipelineTemplates = await manager.find(ApplicationPipelineStepTemplate, {
      where: { applicationTypeId },
      order: { stepIndex: 'ASC' },
    });
    for (const t of pipelineTemplates) {
      await manager.save(
        CustomerApplicationPipelineProgress,
        manager.create(CustomerApplicationPipelineProgress, {
          customerApplicationId,
          stepIndex: t.stepIndex,
          title: t.title,
          completedAt: null,
        }),
      );
    }

    const docTemplates = await manager.find(ApplicationDocumentRequirement, {
      where: { applicationTypeId },
      order: { sortOrder: 'ASC' },
    });
    for (const d of docTemplates) {
      await manager.save(
        CustomerApplicationDocument,
        manager.create(CustomerApplicationDocument, {
          customerApplicationId,
          documentRequirementId: d.id,
          status: CustomerApplicationDocumentStatus.PENDING,
        }),
      );
    }
  }
}
