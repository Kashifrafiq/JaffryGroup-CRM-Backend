import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  canCustomerPreviewDocument,
  canCustomerPreviewFile,
  isFileUploadedByCustomerUser,
  isUploadedByCustomerUser,
  mapVisibleCustomerFiles,
} from './customer-document-visibility';
import { isCustomerDocumentVisible } from './customer-document-display';
import { isCustomerPipelineStepVisible } from './customer-pipeline-display';
import { CustomerApplication } from './entities/customer-application.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService } from './pipeline-step-assignment.service';
import { DocumentAssignmentService } from './document-assignment.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { JwtActor } from './jwt-actor.type';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentFile } from '../applications/entities/customer-application-document-file.entity';
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
    @InjectRepository(CustomerApplicationDocumentFile)
    private readonly applicationDocumentFileRepository: Repository<CustomerApplicationDocumentFile>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    private readonly pipelineStepAssignmentService: PipelineStepAssignmentService,
    private readonly documentAssignmentService: DocumentAssignmentService,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      'applicationDocuments.files',
      'applicationType',
    ]);
    const assignedDocumentIds = await this.assignedDocumentIdsForActor(actor, cid);
    const assignedPipelineProgressIds = await this.assignedPipelineProgressIdsForActor(
      actor,
      cid,
      aid,
    );
    return this.buildWorkflowPayload(app, undefined, new Map(), {
      assignedDocumentIds,
      assignedPipelineProgressIds,
      includeDocumentAssignees: actor.role === UserRole.ADMIN,
    });
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
    this.assertPipelineStepIsActive(row);
    row.completedAt = completed ? new Date() : null;
    await this.pipelineProgressRepository.save(row);
    return await this.buildWorkflowPayload(await this.loadApplication(cid, aid, [
      'pipelineProgress',
      'applicationDocuments',
      'applicationDocuments.files',
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
    const app = await this.loadApplication(cid, aid, ['applicationType']);
    const doc = await this.loadDocumentRow(cid, aid, did, []);
    this.assertDocumentIsActive(doc);
    if (actor.role === UserRole.CUSTOMER) {
      await this.assertCustomerCanUploadDocument(doc, actor.id);
    } else if (actor.role === UserRole.ASSOCIATE) {
      await this.assertCanAccessDocument(actor, did);
    }
    if (doc.status === CustomerApplicationDocumentStatus.WAIVED) {
      throw new BadRequestException('Document was waived; re-open before upload.');
    }
    const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
    if (!customer) {
      throw new NotFoundException(`Customer #${cid} not found`);
    }

    const pendingFile = await this.applicationDocumentFileRepository.save(
      this.applicationDocumentFileRepository.create({
        customerApplicationDocumentId: doc.id,
        mimeType: dto.contentType,
        originalFilename: dto.filename,
      }),
    );

    const key = this.s3StorageService.buildDocumentObjectKey({
      customerId: cid,
      firstName: customer.firstName,
      lastName: customer.lastName,
      applicationId: aid,
      applicationName: app.applicationType.name,
      documentName: doc.itemLabel,
      fileId: pendingFile.id,
      originalFilename: dto.filename,
    });
    const signed = await this.s3StorageService.createPresignedPutUrl(key, dto.contentType);
    pendingFile.storageKey = key;
    pendingFile.bucket = signed.bucket;
    await this.applicationDocumentFileRepository.save(pendingFile);

    return {
      uploadUrl: signed.uploadUrl,
      bucket: signed.bucket,
      key: signed.key,
      expiresIn: signed.expiresIn,
      fileId: pendingFile.id,
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
    const app = await this.loadApplication(cid, aid, ['applicationType']);
    const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
    this.assertDocumentIsActive(doc);
    if (actor.role === UserRole.CUSTOMER) {
      await this.assertCustomerCanUploadDocument(doc, actor.id);
    } else if (actor.role === UserRole.ASSOCIATE) {
      await this.assertCanAccessDocument(actor, did);
    }
    const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
    if (!customer) {
      throw new NotFoundException(`Customer #${cid} not found`);
    }

    if (dto.fileId?.trim()) {
      const file = await this.loadDocumentFileRow(did, dto.fileId.trim());
      const expectedPrefix = this.s3StorageService.buildDocumentRequirementPrefix({
        customerId: cid,
        firstName: customer.firstName,
        lastName: customer.lastName,
        applicationId: aid,
        applicationName: app.applicationType.name,
        documentName: doc.itemLabel,
      });
      if (!dto.storageKey.startsWith(expectedPrefix)) {
        throw new BadRequestException('storageKey does not match this document requirement');
      }
      if (file.storageKey && file.storageKey !== dto.storageKey) {
        throw new BadRequestException('storageKey does not match presigned key for this file');
      }
      file.storageKey = dto.storageKey;
      file.originalFilename = dto.originalFilename;
      file.mimeType = dto.mimeType;
      file.sizeBytes = dto.sizeBytes;
      file.uploadedAt = new Date();
      file.uploadedByUserId = actor.id;
      await this.applicationDocumentFileRepository.save(file);
      doc.status = CustomerApplicationDocumentStatus.UPLOADED;
      await this.applicationDocumentRepository.save(doc);
    } else {
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
    }

    if (actor.role === UserRole.CUSTOMER) {
      return this.getCustomerWorkflow(cid, aid, actor);
    }
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
    if (actor.role === UserRole.ASSOCIATE) {
      await this.assertCanAccessDocument(actor, did);
    }
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
    fileId?: string,
  ) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
    if (actor.role === UserRole.ASSOCIATE) {
      await this.assertCanAccessDocument(actor, did);
    }

    if (fileId?.trim()) {
      const file = await this.loadDocumentFileRow(did, fileId.trim());
      if (!file.storageKey) {
        throw new BadRequestException('Document file is not uploaded yet');
      }
      return this.s3StorageService.createPresignedGetUrl(file.storageKey);
    }

    if (!doc.storageKey) {
      throw new BadRequestException('Document file is not uploaded yet');
    }
    return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
  }

  async getDocumentReadUrlForCustomerUser(
    applicationId: string,
    documentId: string,
    actor: JwtActor,
    fileId?: string,
  ) {
    if (actor.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customer can use this endpoint');
    }
    const customerId = await this.customerIdForUser(actor.id);
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    const did = this.tid(documentId);
    await this.assertCanAccessApplication(actor, cid, aid);
    const doc = await this.loadDocumentRow(cid, aid, did, ['files']);

    if (fileId?.trim()) {
      const file = await this.loadDocumentFileRow(did, fileId.trim());
      await this.assertCustomerCanPreviewFile(file, actor.id);
      if (!file.storageKey) {
        throw new BadRequestException('Document file is not uploaded yet');
      }
      return this.s3StorageService.createPresignedGetUrl(file.storageKey);
    }

    await this.assertCustomerCanPreviewDocument(doc, actor.id);
    if (!doc.storageKey) {
      throw new BadRequestException('Document file is not uploaded yet');
    }
    return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
  }

  /** Customer portal: pending requirements + only files the customer uploaded. */
  async getCustomerWorkflow(customerId: string, applicationId: string, actor: JwtActor) {
    const cid = this.tid(customerId);
    const aid = this.tid(applicationId);
    if (actor.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customer can use this workflow view');
    }
    await this.assertCanAccessApplication(actor, cid, aid);
    const app = await this.loadApplication(cid, aid, [
      'pipelineProgress',
      'applicationDocuments',
      'applicationDocuments.files',
      'applicationType',
    ]);
    const uploaderRoleByUserId = await this.uploaderRoleMapForDocuments(
      app.applicationDocuments ?? [],
    );
    return this.buildWorkflowPayload(app, actor.id, uploaderRoleByUserId);
  }

  async buildWorkflowPayload(
    app: CustomerApplication,
    customerUserId?: string,
    uploaderRoleByUserId: Map<string, UserRole> = new Map(),
    options?: {
      assignedDocumentIds?: string[] | null;
      assignedPipelineProgressIds?: string[] | null;
      includeDocumentAssignees?: boolean;
    },
  ) {
    const progressRows = (app.pipelineProgress ?? [])
      .slice()
      .filter(isCustomerPipelineStepVisible)
      .sort((a, b) => a.stepIndex - b.stepIndex)
      .filter((p) => {
        if (options?.assignedPipelineProgressIds == null) {
          return true;
        }
        return options.assignedPipelineProgressIds.includes(p.id);
      });
    const assigneesByProgressId = await this.pipelineStepAssignmentService.getAssigneesByProgressIds(
      progressRows.map((p) => p.id),
    );
    const documentIds = (app.applicationDocuments ?? []).map((d) => d.id);
    const documentAssigneesById = options?.includeDocumentAssignees
      ? await this.documentAssignmentService.getAssigneesByDocumentIds(documentIds)
      : new Map();

    const steps = progressRows.map((p) => ({
      id: p.id,
      stepIndex: p.stepIndex,
      title: p.title,
      isCustom: p.isCustom,
      completedAt: p.completedAt ?? null,
      assignedTo: assigneesByProgressId.get(p.id) ?? [],
    }));
    const documents = (app.applicationDocuments ?? [])
      .slice()
      .filter(isCustomerDocumentVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((d) => {
        if (options?.assignedDocumentIds == null) {
          return true;
        }
        return options.assignedDocumentIds.includes(d.id);
      })
      .map((d) => {
        const attachmentFiles = (d.files ?? []).filter((f) => !!f.uploadedAt && !!f.storageKey);
        const legacyUploadedByCustomer =
          customerUserId && d.uploadedAt
            ? isUploadedByCustomerUser(d, customerUserId, uploaderRoleByUserId)
            : undefined;
        const customerFiles = customerUserId
          ? mapVisibleCustomerFiles(d.files ?? [], customerUserId, uploaderRoleByUserId)
          : undefined;
        const adminFiles = !customerUserId
          ? attachmentFiles.map((file) => ({
              id: file.id,
              originalFilename: file.originalFilename ?? null,
              mimeType: file.mimeType ?? null,
              sizeBytes: file.sizeBytes ?? null,
              uploadedAt: file.uploadedAt ?? null,
              uploadedByUserId: file.uploadedByUserId ?? null,
              storageKey: file.storageKey ?? null,
            }))
          : undefined;

        const uploadedByCustomer =
          customerUserId !== undefined
            ? (customerFiles?.length ?? 0) > 0 || !!legacyUploadedByCustomer
            : undefined;
        const hasAnyUpload =
          attachmentFiles.length > 0 || (!!d.uploadedAt && !!d.storageKey);

        const row: Record<string, unknown> = {
          id: d.id,
          status: d.status,
          requirementKey: d.requirementKey,
          sectionTitle: d.sectionTitle,
          itemLabel: d.itemLabel,
          sortOrder: d.sortOrder,
          isCustom: d.isCustom,
          uploaded: hasAnyUpload,
          fileCount: attachmentFiles.length + (d.uploadedAt && d.storageKey ? 1 : 0),
          originalFilename: d.originalFilename ?? null,
          mimeType: d.mimeType ?? null,
          sizeBytes: d.sizeBytes ?? null,
          uploadedAt: d.uploadedAt ?? null,
          canPreview: customerUserId
            ? (customerFiles?.some((f) => f.canPreview) ?? false) ||
              canCustomerPreviewDocument(d, customerUserId, uploaderRoleByUserId)
            : true,
          files: customerUserId ? customerFiles : adminFiles,
        };
        if (!customerUserId) {
          row.storageKey = d.storageKey ?? null;
          row.bucket = d.bucket ?? null;
          row.uploadedByUserId = d.uploadedByUserId ?? null;
          row.notes = d.notes ?? null;
          row.assignedTo = documentAssigneesById.get(d.id) ?? [];
        }
        if (uploadedByCustomer !== undefined) {
          row.uploadedByMe = uploadedByCustomer;
        }
        return row;
      });
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
      relations: [...relations],
    });
    if (!doc) {
      throw new NotFoundException(`Document #${documentId} not found for this application`);
    }
    return doc;
  }

  private async loadDocumentFileRow(
    documentId: string,
    fileId: string,
  ): Promise<CustomerApplicationDocumentFile> {
    const file = await this.applicationDocumentFileRepository.findOne({
      where: { id: fileId, customerApplicationDocumentId: documentId },
    });
    if (!file) {
      throw new NotFoundException(`File #${fileId} not found for this document`);
    }
    return file;
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
    const [pipelineAllowed, documentAllowed] = await Promise.all([
      this.pipelineStepAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
      this.documentAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
    ]);
    if (!pipelineAllowed && !documentAllowed) {
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
    const documentAllowed = await this.documentAssignmentService.hasAccessToApplication(
      associateProfile.id,
      applicationId,
    );
    if (!allowed && !documentAllowed) {
      throw new ForbiddenException('You do not have access to this application');
    }
  }

  private async assignedDocumentIdsForActor(
    actor: JwtActor,
    customerId: string,
  ): Promise<string[] | null> {
    if (actor.role !== UserRole.ASSOCIATE) {
      return null;
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      return [];
    }
    return this.documentAssignmentService.getAssignedDocumentIdsForAssociate(
      associateProfile.id,
      customerId,
    );
  }

  private async assignedPipelineProgressIdsForActor(
    actor: JwtActor,
    customerId: string,
    applicationId: string,
  ): Promise<string[] | null> {
    if (actor.role !== UserRole.ASSOCIATE) {
      return null;
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      return [];
    }
    return this.pipelineStepAssignmentService.getAssignedPipelineProgressIdsForAssociate(
      associateProfile.id,
      customerId,
      applicationId,
    );
  }

  private async assertCanAccessDocument(actor: JwtActor, documentId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('You do not have access to this document');
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      throw new ForbiddenException('You do not have access to this document');
    }
    const allowed = await this.documentAssignmentService.hasAccessToDocument(
      associateProfile.id,
      documentId,
    );
    if (!allowed) {
      throw new ForbiddenException('You are not assigned to this document');
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

  private async uploaderRoleMapForDocuments(
    documents: Array<{
      uploadedByUserId?: string | null;
      files?: Array<{ uploadedByUserId?: string | null }>;
    }>,
  ): Promise<Map<string, UserRole>> {
    const uploaderIds = [
      ...new Set(
        documents
          .flatMap((d) => [
            d.uploadedByUserId?.trim(),
            ...(d.files ?? []).map((f) => f.uploadedByUserId?.trim()),
          ])
          .filter((id): id is string => !!id),
      ),
    ];
    if (!uploaderIds.length) {
      return new Map();
    }
    const users = await this.userRepository.find({
      where: { id: In(uploaderIds) },
      select: ['id', 'role'],
    });
    return new Map(users.map((u) => [u.id, u.role]));
  }

  private assertDocumentIsActive(doc: CustomerApplicationDocument): void {
    if (!isCustomerDocumentVisible(doc)) {
      throw new BadRequestException('This document requirement was removed for this customer');
    }
  }

  private assertPipelineStepIsActive(step: CustomerApplicationPipelineProgress): void {
    if (!isCustomerPipelineStepVisible(step)) {
      throw new BadRequestException('This pipeline step was removed for this customer');
    }
  }

  private async assertCustomerCanUploadDocument(
    doc: CustomerApplicationDocument,
    customerUserId: string,
  ): Promise<void> {
    if (!doc.uploadedAt || !doc.storageKey) {
      return;
    }
    const roleMap = await this.uploaderRoleMapForDocuments([doc]);
    if (!isUploadedByCustomerUser(doc, customerUserId, roleMap)) {
      throw new ForbiddenException(
        'This document was uploaded by your team. You cannot replace or view it here.',
      );
    }
  }

  private async assertCustomerCanPreviewDocument(
    doc: CustomerApplicationDocument,
    customerUserId: string,
  ): Promise<void> {
    const roleMap = await this.uploaderRoleMapForDocuments([doc]);
    if (!canCustomerPreviewDocument(doc, customerUserId, roleMap)) {
      throw new ForbiddenException('You can only preview documents you uploaded');
    }
  }

  private async assertCustomerCanPreviewFile(
    file: CustomerApplicationDocumentFile,
    customerUserId: string,
  ): Promise<void> {
    const roleMap = await this.uploaderRoleMapForDocuments([
      { uploadedByUserId: file.uploadedByUserId },
    ]);
    if (!canCustomerPreviewFile(file, customerUserId, roleMap)) {
      throw new ForbiddenException('You can only preview documents you uploaded');
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
