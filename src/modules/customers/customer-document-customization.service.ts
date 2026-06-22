import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentStatus } from '../applications/entities/customer-application-document-status.enum';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerDocumentOverrideDto } from './dto/customer-document-override.dto';
import { CustomerCustomDocumentDto } from './dto/customer-custom-document.dto';

@Injectable()
export class CustomerDocumentCustomizationService {
  constructor(
    @InjectRepository(CustomerApplicationDocument)
    private readonly documentRepository: Repository<CustomerApplicationDocument>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
  ) {}

  async applyOnCreate(
    customerId: string,
    overrides: CustomerDocumentOverrideDto[] = [],
    customDocuments: CustomerCustomDocumentDto[] = [],
  ): Promise<void> {
    if (!overrides.length && !customDocuments.length) {
      return;
    }
    const apps = await this.loadApplications(customerId);
    if (overrides.length) {
      await this.applyOverrides(apps, overrides, 'create');
    }
    if (customDocuments.length) {
      await this.insertCustomDocuments(apps, customDocuments);
    }
  }

  async applyOnUpdate(
    customerId: string,
    overrides: CustomerDocumentOverrideDto[] = [],
    customDocuments: CustomerCustomDocumentDto[] = [],
  ): Promise<void> {
    if (!overrides.length && !customDocuments.length) {
      return;
    }
    const apps = await this.loadApplications(customerId);
    if (overrides.length) {
      await this.applyOverrides(apps, overrides, 'update');
    }
    if (customDocuments.length) {
      await this.insertCustomDocuments(apps, customDocuments);
    }
  }

  async applySingleOverride(
    customerId: string,
    applicationId: string,
    documentId: string,
    patch: Pick<CustomerDocumentOverrideDto, 'itemLabel' | 'sectionTitle' | 'sortOrder' | 'removed'>,
  ): Promise<CustomerApplicationDocument> {
    const doc = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.customerApplication', 'app')
      .where('doc.id = :documentId', { documentId })
      .andWhere('doc.customerApplicationId = :applicationId', { applicationId })
      .andWhere('app.customerId = :customerId', { customerId })
      .getOne();
    if (!doc) {
      throw new NotFoundException(`Document #${documentId} not found for customer #${customerId}`);
    }
    this.patchDocumentRow(doc, patch);
    return this.documentRepository.save(doc);
  }

  async addCustomDocument(
    customerId: string,
    applicationId: string,
    dto: CustomerCustomDocumentDto,
  ): Promise<CustomerApplicationDocument> {
    const apps = await this.loadApplications(customerId);
    const app = apps.find((a) => a.id === applicationId);
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for customer #${customerId}`);
    }
    const [created] = await this.insertCustomDocuments([app], [dto]);
    return created;
  }

  private async loadApplications(customerId: string): Promise<CustomerApplication[]> {
    return this.applicationRepository.find({
      where: { customerId },
      relations: ['applicationType', 'applicationDocuments'],
    });
  }

  private async applyOverrides(
    apps: CustomerApplication[],
    overrides: CustomerDocumentOverrideDto[],
    mode: 'create' | 'update',
  ): Promise<void> {
    for (const override of overrides) {
      const doc = this.resolveDocumentForOverride(apps, override, mode);
      this.patchDocumentRow(doc, override);
      await this.documentRepository.save(doc);
    }
  }

  private resolveDocumentForOverride(
    apps: CustomerApplication[],
    override: CustomerDocumentOverrideDto,
    mode: 'create' | 'update',
  ): CustomerApplicationDocument {
    if (override.documentId?.trim()) {
      if (mode === 'create') {
        throw new BadRequestException('documentId is only valid when editing an existing customer');
      }
      const match = apps
        .flatMap((app) => app.applicationDocuments ?? [])
        .find((doc) => doc.id === override.documentId!.trim());
      if (!match) {
        throw new NotFoundException(`Document #${override.documentId} not found for this customer`);
      }
      return match;
    }

    const requirementKey = override.requirementKey?.trim();
    if (!requirementKey) {
      throw new BadRequestException('Provide requirementKey or documentId for documentOverrides');
    }

    const scopedApps = this.filterApps(apps, override);
    if (scopedApps.length !== 1) {
      throw new BadRequestException(
        scopedApps.length === 0
          ? `No application found for document override requirementKey "${requirementKey}"`
          : `Multiple applications match requirementKey "${requirementKey}" — provide applicationTypeId or applicationTypeCode`,
      );
    }

    const doc = (scopedApps[0].applicationDocuments ?? []).find(
      (row) => row.requirementKey === requirementKey,
    );
    if (!doc) {
      throw new NotFoundException(
        `No document with requirementKey "${requirementKey}" found for this customer application`,
      );
    }
    return doc;
  }

  private async insertCustomDocuments(
    apps: CustomerApplication[],
    customDocuments: CustomerCustomDocumentDto[],
  ): Promise<CustomerApplicationDocument[]> {
    const created: CustomerApplicationDocument[] = [];
    for (const entry of customDocuments) {
      const scopedApps = this.filterApps(apps, entry);
      if (scopedApps.length !== 1) {
        throw new BadRequestException(
          scopedApps.length === 0
            ? 'No application found for customDocuments entry'
            : 'Multiple applications match customDocuments entry — provide applicationTypeId or applicationTypeCode',
        );
      }
      const app = scopedApps[0];
      const maxSort = (app.applicationDocuments ?? []).reduce(
        (max, d) => Math.max(max, d.sortOrder),
        -1,
      );
      const sortOrder = entry.sortOrder ?? maxSort + 1;
      const id = randomUUID();
      const row = this.documentRepository.create({
        customerApplicationId: app.id,
        documentRequirementId: null,
        requirementKey: `custom_${id.replace(/-/g, '').slice(0, 12)}`,
        sectionTitle: entry.sectionTitle.trim(),
        itemLabel: entry.itemLabel.trim(),
        sortOrder,
        isCustom: true,
        isActive: true,
        status: CustomerApplicationDocumentStatus.PENDING,
      });
      const saved = await this.documentRepository.save(row);
      app.applicationDocuments = [...(app.applicationDocuments ?? []), saved];
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

  private patchDocumentRow(
    doc: CustomerApplicationDocument,
    patch: Pick<
      CustomerDocumentOverrideDto,
      'itemLabel' | 'sectionTitle' | 'sortOrder' | 'removed'
    >,
  ): void {
    if (patch.itemLabel !== undefined) {
      doc.itemLabel = patch.itemLabel.trim();
    }
    if (patch.sectionTitle !== undefined) {
      doc.sectionTitle = patch.sectionTitle.trim();
    }
    if (patch.sortOrder !== undefined) {
      doc.sortOrder = patch.sortOrder;
    }
    if (patch.removed !== undefined) {
      doc.isActive = !patch.removed;
    }
  }
}
