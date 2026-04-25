import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationWorkflowTemplatesSeedService } from './application-workflow-templates.seed.service';

/**
 * Bootstrap rows for `application_types`. Upserted by stable `code`.
 *
 * **Client contract:** Prefer live data from `GET /application-types` and send
 * `applicationTypeId` (or `applicationTypeCode` from that list) on create/update so the
 * app stays in sync with the DB. When you add product lines, either extend this list or
 * insert rows elsewhere and rely only on the API (no hard-coded label map required).
 */
const APPLICATION_TYPE_SEEDS: ReadonlyArray<{
  code: string;
  name: string;
  sortOrder: number;
}> = [
  { code: 'loc', name: 'Line of credit', sortOrder: 10 },
  { code: 'mortgage_purchase', name: 'Mortgage — purchase', sortOrder: 20 },
  { code: 'mortgage_refinance', name: 'Mortgage — refinance', sortOrder: 30 },
  { code: 'bookkeeping', name: 'Bookkeeping', sortOrder: 40 },
  { code: 'financial_reporting', name: 'Financial reporting', sortOrder: 45 },
  { code: 'business_credit', name: 'Business credit', sortOrder: 50 },
  { code: 'taxation', name: 'Taxation', sortOrder: 55 },
  { code: 'corporate_compliance', name: 'Corporate compliance', sortOrder: 60 },
  { code: 'other', name: 'Other', sortOrder: 99 },
];

@Injectable()
export class ApplicationsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ApplicationsSeedService.name);

  constructor(
    @InjectRepository(ApplicationType)
    private readonly applicationTypeRepository: Repository<ApplicationType>,
    private readonly workflowTemplatesSeed: ApplicationWorkflowTemplatesSeedService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.shouldRunBootstrapSeeds()) {
      this.logger.log('Skipping application seeds on bootstrap (RUN_BOOTSTRAP_SEEDS=false)');
      return;
    }

    for (const row of APPLICATION_TYPE_SEEDS) {
      const existing = await this.applicationTypeRepository.findOne({
        where: { code: row.code },
      });
      if (existing) {
        await this.applicationTypeRepository.update(existing.id, {
          name: row.name,
          sortOrder: row.sortOrder,
          isActive: true,
        });
      } else {
        await this.applicationTypeRepository.save(
          this.applicationTypeRepository.create({
            code: row.code,
            name: row.name,
            sortOrder: row.sortOrder,
            isActive: true,
            metadata: {},
          }),
        );
      }
    }
    this.logger.log(`Seeded ${APPLICATION_TYPE_SEEDS.length} application types (upsert by code)`);
    await this.workflowTemplatesSeed.seedTemplates();
  }

  private shouldRunBootstrapSeeds(): boolean {
    const raw = this.configService.get<string>('RUN_BOOTSTRAP_SEEDS', 'true');
    return ['true', '1', 'yes', 'on'].includes(raw.trim().toLowerCase());
  }
}
