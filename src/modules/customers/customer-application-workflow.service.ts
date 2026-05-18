import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerApplication } from './entities/customer-application.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService } from './pipeline-step-assignment.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { JwtActor } from './jwt-actor.type';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentStatus } from '../applications/entities/customer-application-document-status.enum';
import { S3StorageService } from '../applications/s3-storage.service';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';

@Injectable()
export class CustomerApplicationWorkflowService {
  constructor(
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
    @InjectRepository(CustomerApplicationPipelineProgress)
    private readonly pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>,
    @InjectRepository(CustomerApplicationDocument)
    private readonly applicationDocumentRepository: Repository<CustomerApplicationDocument>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    private readonly pipelineStepAssignmentService: PipelineStepAssignmentService,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepository: Repository<CustomerProfile>,
    private readonly s3StorageService: S3StorageService,
  ) {}

  /** Path/query UUIDs sometimes include stray spaces from clients; Postgres rejects those. */
  private tid(id: string): string {
    return id.trim();
  }

  async getWorkflow(customerId: string, applicationId: string, actor: JwtActor) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const app = await this.loadApplication(cid, aid, [
      'pipelineProgress',
      'applicationDocuments',
      'applicationDocuments.requirement',
      'applicationType',
    ]);
    return this.buildWorkflowPayload(app);
  }

  async assignPipelineStepAssociates(
    customerId: string,
    applicationId: string,
    stepIndex: number,
    associateIds: string[],
  ) {
    const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(
      this.tid(customerId),
      this.tid(applicationId),
      stepIndex,
    );
    return this.pipelineStepAssignmentService.assignAssociatesToStep(progress.id, associateIds);
  }

  async replacePipelineStepAssociates(
    customerId: string,
    applicationId: string,
    stepIndex: number,
    associateIds: string[],
  ) {
    const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(
      this.tid(customerId),
      this.tid(applicationId),
      stepIndex,
    );
    return this.pipelineStepAssignmentService.replaceAssociatesOnStep(progress.id, associateIds);
  }

  async unassignPipelineStepAssociate(
    customerId: string,
    applicationId: string,
    stepIndex: number,
    associateId: string,
  ) {
    const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(
      this.tid(customerId),
      this.tid(applicationId),
      stepIndex,
    );
    return this.pipelineStepAssignmentService.unassignAssociateFromStep(progress.id, associateId);
  }

  async patchPipelineStep(
    customerId: string,
    applicationId: string,
    stepIndex: number,
    completed: boolean,
    actor: JwtActor,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    await this.assertCanAccessApplication(actor, cid, aid);
    await this.assertCanModifyPipelineStep(actor, aid, stepIndex);
    const app = await this.loadApplication(cid, aid, []);
    const row = await this.pipelineProgressRepository.findOne({
      where: { customerApplicationId: app.id, stepIndex },
    });
    if (!row) {
      throw new NotFoundException(`Pipeline step ${stepIndex} not found for this application`);
    }
    row.completedAt = completed ? new Date() : null;
    await this.pipelineProgressRepository.save(row);
    return await this.buildWorkflowPayload(await this.loadApplication(cid, aid, [
      'pipelineProgress',
      'applicationDocuments',
      'applicationDocuments.requirement',
      'applicationType',
    ]));
  }

  async presignDocumentUpload(
    customerId: string,
    applicationId: string,
    documentId: string,
    dto: PresignDocumentUploadDto,
    actor: JwtActor,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
    if (doc.status === CustomerApplicationDocumentStatus.WAIVED) {
      throw new BadRequestException('Document was waived; re-open before upload.');
    }
    const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
    if (!customer) {
      throw new NotFoundException(`Customer #${cid} not found`);
    }
    const key = this.s3StorageService.buildDocumentObjectKey({
      customerId: cid,
      firstName: customer.firstName,
      lastName: customer.lastName,
      documentId: doc.id,
      originalFilename: dto.filename,
    });
    const signed = await this.s3StorageService.createPresignedPutUrl(key, dto.contentType);
    doc.storageKey = key;
    doc.bucket = signed.bucket;
    doc.mimeType = dto.contentType;
    doc.originalFilename = dto.filename;
    await this.applicationDocumentRepository.save(doc);
    return {
      uploadUrl: signed.uploadUrl,
      bucket: signed.bucket,
      key: signed.key,
      expiresIn: signed.expiresIn,
    };
  }

  async presignDocumentUploadForCustomerUser(
    applicationId: string,
    documentId: string,
    dto: PresignDocumentUploadDto,
    actor: JwtActor,
  ) {
    if (actor.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customer can use this endpoint');
    }
    const customerId = await this.customerIdForUser(actor.id);
    return this.presignDocumentUpload(customerId, applicationId, documentId, dto, actor);
  }

  async completeDocumentUpload(
    customerId: string,
    applicationId: string,
    documentId: string,
    dto: CompleteDocumentUploadDto,
    actor: JwtActor,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
    const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
    if (!customer) {
      throw new NotFoundException(`Customer #${cid} not found`);
    }
    const expectedPrefix =
      this.s3StorageService.buildCustomerDocumentsFolder(
        customer.id,
        customer.firstName,
        customer.lastName,
      ) + '/';
    if (!dto.storageKey.startsWith(expectedPrefix)) {
      throw new BadRequestException('storageKey does not match this customer');
    }
    if (doc.storageKey && doc.storageKey !== dto.storageKey) {
      throw new BadRequestException('storageKey does not match presigned key for this document');
    }
    doc.storageKey = dto.storageKey;
    doc.originalFilename = dto.originalFilename;
    doc.mimeType = dto.mimeType;
    doc.sizeBytes = dto.sizeBytes;
    doc.status = CustomerApplicationDocumentStatus.UPLOADED;
    doc.uploadedAt = new Date();
    doc.uploadedByUserId = actor.id;
    await this.applicationDocumentRepository.save(doc);
    return this.getWorkflow(cid, aid, actor);
  }

  async completeDocumentUploadForCustomerUser(
    applicationId: string,
    documentId: string,
    dto: CompleteDocumentUploadDto,
    actor: JwtActor,
  ) {
    if (actor.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customer can use this endpoint');
    }
    const customerId = await this.customerIdForUser(actor.id);
    return this.completeDocumentUpload(customerId, applicationId, documentId, dto, actor);
  }

  async patchDocument(
    customerId: string,
    applicationId: string,
    documentId: string,
    dto: PatchApplicationDocumentDto,
    actor: JwtActor,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, []);
    if (dto.status === CustomerApplicationDocumentStatus.UPLOADED) {
      throw new BadRequestException('Use presign + complete flow to mark uploaded');
    }
    if (dto.status !== undefined) {
      doc.status = dto.status;
    }
    if (dto.notes !== undefined) {
      doc.notes = dto.notes;
    }
    await this.applicationDocumentRepository.save(doc);
    return this.getWorkflow(cid, aid, actor);
  }

  async getDocumentReadUrl(
    customerId: string,
    applicationId: string,
    documentId: string,
    actor: JwtActor,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, []);
    if (!doc.storageKey) {
      throw new BadRequestException('Document file is not uploaded yet');
    }
    return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
  }

  async buildWorkflowPayload(app: CustomerApplication) {
    const progressRows = (app.pipelineProgress ?? []).slice().sort((a, b) => a.stepIndex - b.stepIndex);
    const assigneesByProgressId = await this.pipelineStepAssignmentService.getAssigneesByProgressIds(
      progressRows.map((p) => p.id),
    );
    const steps = progressRows.map((p) => ({
      stepIndex: p.stepIndex,
      title: p.title,
      completedAt: p.completedAt ?? null,
      assignedTo: assigneesByProgressId.get(p.id) ?? [],
    }));
    const documents = (app.applicationDocuments ?? [])
      .slice()
      .sort((a, b) => a.requirement.sortOrder - b.requirement.sortOrder)
      .map((d) => ({
        id: d.id,
        status: d.status,
        requirementKey: d.requirement.requirementKey,
        sectionTitle: d.requirement.sectionTitle,
        itemLabel: d.requirement.itemLabel,
        sortOrder: d.requirement.sortOrder,
        storageKey: d.storageKey ?? null,
        bucket: d.bucket ?? null,
        originalFilename: d.originalFilename ?? null,
        mimeType: d.mimeType ?? null,
        sizeBytes: d.sizeBytes ?? null,
        uploadedAt: d.uploadedAt ?? null,
        uploadedByUserId: d.uploadedByUserId ?? null,
        notes: d.notes ?? null,
      }));
    return {
      applicationId: app.id,
      applicationType: {
        id: app.applicationType.id,
        code: app.applicationType.code,
        name: app.applicationType.name,
      },
      pipelineSteps: steps,
      documents,
    };
  }

  private async loadApplication(
    customerId: string,
    applicationId: string,
    relations: string[],
  ): Promise<CustomerApplication> {
    const app = await this.applicationRepository.findOne({
      where: { id: applicationId, customerId },
      relations: ['applicationType', ...relations],
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for this customer`);
    }
    return app;
  }

  private async loadDocumentRow(
    customerId: string,
    applicationId: string,
    documentId: string,
    relations: string[],
  ): Promise<CustomerApplicationDocument> {
    const app = await this.applicationRepository.findOne({
      where: { id: applicationId, customerId },
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for this customer`);
    }
    const doc = await this.applicationDocumentRepository.findOne({
      where: { id: documentId, customerApplicationId: applicationId },
      relations: ['requirement', ...relations],
    });
    if (!doc) {
      throw new NotFoundException(`Document #${documentId} not found for this application`);
    }
    return doc;
  }

  private async assertCanAccess(actor: JwtActor, customerId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      if (actor.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException('Insufficient permissions');
      }
      const customer = await this.customerProfileRepository.findOne({
        where: { id: customerId, userId: actor.id },
        select: ['id'],
      });
      if (!customer) {
        throw new ForbiddenException('You do not have access to this customer');
      }
      return;
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      throw new ForbiddenException('You do not have access to this customer');
    }
    const allowed = await this.pipelineStepAssignmentService.hasAccessToCustomer(
      associateProfile.id,
      customerId,
    );
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this customer');
    }
  }

  private async assertCanAccessApplication(
    actor: JwtActor,
    customerId: string,
    applicationId: string,
  ): Promise<void> {
    await this.assertCanAccess(actor, customerId);
    if (actor.role !== UserRole.ASSOCIATE) {
      return;
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      throw new ForbiddenException('You do not have access to this application');
    }
    const allowed = await this.pipelineStepAssignmentService.hasAccessToApplication(
      associateProfile.id,
      applicationId,
    );
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this application');
    }
  }

  private async assertCanModifyPipelineStep(
    actor: JwtActor,
    applicationId: string,
    stepIndex: number,
  ): Promise<void> {
    if (actor.role !== UserRole.ASSOCIATE) {
      return;
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      throw new ForbiddenException('You do not have access to this pipeline step');
    }
    const allowed = await this.pipelineStepAssignmentService.hasAccessToStep(
      associateProfile.id,
      applicationId,
      stepIndex,
    );
    if (!allowed) {
      throw new ForbiddenException('You are not assigned to this pipeline step');
    }
  }

  private async customerIdForUser(userId: string): Promise<string> {
    const customer = await this.customerProfileRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!customer) {
      throw new ForbiddenException('Customer profile not found for current user');
    }
    return customer.id;
  }
}
