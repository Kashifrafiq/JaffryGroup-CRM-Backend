import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssociateCustomerApplicationDocument } from '../users/entities/associate-customer-application-document.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { DocumentAssignmentOnCreateDto } from './dto/document-assignment-on-create.dto';
import { DocumentAssignmentDto } from './dto/document-assignment.dto';

export type DocumentAssignee = { id: string; name: string };

@Injectable()
export class DocumentAssignmentService {
  constructor(
    @InjectRepository(AssociateCustomerApplicationDocument)
    private readonly assignmentRepository: Repository<AssociateCustomerApplicationDocument>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    @InjectRepository(CustomerApplicationDocument)
    private readonly documentRepository: Repository<CustomerApplicationDocument>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
  ) {}

  async replaceAssociatesOnDocument(
    documentId: string,
    associateIds: string[],
  ): Promise<{ documentId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document #${documentId} not found`);
    }

    await this.assignmentRepository.delete({ customerApplicationDocumentId: documentId });
    if (!associateIds.length) {
      return { documentId, assignedAssociateIds: [], totalAssigned: 0 };
    }
    return this.assignAssociatesToDocument(documentId, associateIds);
  }

  async assignAssociatesToDocument(
    documentId: string,
    associateIds: string[],
  ): Promise<{ documentId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document #${documentId} not found`);
    }

    const uniqueAssociateIds = [...new Set(associateIds.map((id) => id.trim()).filter(Boolean))];
    const assignedAssociateIds: string[] = [];

    for (const associateId of uniqueAssociateIds) {
      const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
      if (!associate) {
        throw new NotFoundException(`Associate ${associateId} not found`);
      }

      const existing = await this.assignmentRepository.findOne({
        where: { associateId, customerApplicationDocumentId: documentId },
      });
      if (!existing) {
        await this.assignmentRepository.save(
          this.assignmentRepository.create({
            associateId,
            customerApplicationDocumentId: documentId,
          }),
        );
      }
      assignedAssociateIds.push(associateId);
    }

    return { documentId, assignedAssociateIds, totalAssigned: assignedAssociateIds.length };
  }

  async applyAssignmentsOnCreate(
    customerId: string,
    assignments: DocumentAssignmentOnCreateDto[],
  ): Promise<void> {
    if (!assignments.length) {
      return;
    }

    const apps = await this.applicationRepository.find({
      where: { customerId },
      relations: ['applicationType', 'applicationDocuments'],
    });

    const documents = apps.flatMap((app) =>
      (app.applicationDocuments ?? []).map((doc) => ({
        doc,
        applicationTypeId: app.applicationTypeId,
        applicationTypeCode: app.applicationType?.code ?? null,
      })),
    );

    for (const assignment of assignments) {
      const matches = documents.filter(({ doc, applicationTypeId, applicationTypeCode }) => {
        if (doc.requirementKey !== assignment.requirementKey.trim()) {
          return false;
        }
        if (assignment.applicationTypeId?.trim()) {
          return applicationTypeId === assignment.applicationTypeId.trim();
        }
        if (assignment.applicationTypeCode?.trim()) {
          return applicationTypeCode === assignment.applicationTypeCode.trim();
        }
        return true;
      });

      if (matches.length !== 1) {
        throw new BadRequestException(
          matches.length === 0
            ? `No document found for requirementKey "${assignment.requirementKey}"`
            : `Multiple documents match requirementKey "${assignment.requirementKey}" — provide applicationTypeId or applicationTypeCode`,
        );
      }

      await this.replaceAssociatesOnDocument(matches[0].doc.id, assignment.associateIds);
    }
  }

  async applyAssignmentsOnUpdate(
    customerId: string,
    assignments: DocumentAssignmentDto[],
  ): Promise<void> {
    if (!assignments.length) {
      return;
    }

    const documentIds = [...new Set(assignments.map((a) => a.documentId.trim()).filter(Boolean))];
    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.customerApplication', 'app')
      .where('doc.id IN (:...documentIds)', { documentIds })
      .andWhere('app.customerId = :customerId', { customerId })
      .getMany();

    const documentById = new Map(documents.map((doc) => [doc.id, doc]));
    for (const assignment of assignments) {
      const documentId = assignment.documentId.trim();
      if (!documentById.has(documentId)) {
        throw new NotFoundException(
          `Document #${documentId} not found for customer #${customerId}`,
        );
      }
      await this.replaceAssociatesOnDocument(documentId, assignment.associateIds);
    }
  }

  async getCustomerIdsForAssociate(associateId: string): Promise<string[]> {
    const links = await this.assignmentRepository
      .createQueryBuilder('ada')
      .innerJoin('ada.customerApplicationDocument', 'doc')
      .innerJoin('doc.customerApplication', 'app')
      .where('ada.associateId = :associateId', { associateId })
      .select('DISTINCT app.customerId', 'customerId')
      .getRawMany<{ customerId: string }>();

    return links.map((r) => r.customerId);
  }

  async hasAccessToCustomer(associateId: string, customerId: string): Promise<boolean> {
    const count = await this.assignmentRepository
      .createQueryBuilder('ada')
      .innerJoin('ada.customerApplicationDocument', 'doc')
      .innerJoin('doc.customerApplication', 'app')
      .where('ada.associateId = :associateId', { associateId })
      .andWhere('app.customerId = :customerId', { customerId })
      .getCount();
    return count > 0;
  }

  async hasAccessToDocument(associateId: string, documentId: string): Promise<boolean> {
    const count = await this.assignmentRepository.count({
      where: { associateId, customerApplicationDocumentId: documentId },
    });
    return count > 0;
  }

  async hasAccessToApplication(associateId: string, customerApplicationId: string): Promise<boolean> {
    const count = await this.assignmentRepository
      .createQueryBuilder('ada')
      .innerJoin('ada.customerApplicationDocument', 'doc')
      .where('ada.associateId = :associateId', { associateId })
      .andWhere('doc.customerApplicationId = :customerApplicationId', { customerApplicationId })
      .getCount();
    return count > 0;
  }

  async getAssignedDocumentIdsForAssociate(
    associateId: string,
    customerId?: string,
  ): Promise<string[]> {
    const qb = this.assignmentRepository
      .createQueryBuilder('ada')
      .innerJoin('ada.customerApplicationDocument', 'doc')
      .innerJoin('doc.customerApplication', 'app')
      .where('ada.associateId = :associateId', { associateId })
      .select('doc.id', 'documentId');

    if (customerId) {
      qb.andWhere('app.customerId = :customerId', { customerId });
    }

    const rows = await qb.getRawMany<{ documentId: string }>();
    return rows.map((r) => r.documentId);
  }

  async getAssigneesByDocumentIds(
    documentIds: string[],
  ): Promise<Map<string, DocumentAssignee[]>> {
    const result = new Map<string, DocumentAssignee[]>();
    if (!documentIds.length) {
      return result;
    }

    const links = await this.assignmentRepository.find({
      where: { customerApplicationDocumentId: In(documentIds) },
      relations: ['associate'],
    });

    for (const link of links) {
      const assignees = result.get(link.customerApplicationDocumentId) ?? [];
      assignees.push({
        id: link.associate.id,
        name: `${link.associate.firstName} ${link.associate.lastName}`.trim(),
      });
      result.set(link.customerApplicationDocumentId, assignees);
    }
    return result;
  }
}
