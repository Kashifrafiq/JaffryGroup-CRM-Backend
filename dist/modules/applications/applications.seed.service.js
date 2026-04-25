"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ApplicationsSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const application_type_entity_1 = require("./entities/application-type.entity");
const application_workflow_templates_seed_service_1 = require("./application-workflow-templates.seed.service");
const APPLICATION_TYPE_SEEDS = [
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
let ApplicationsSeedService = ApplicationsSeedService_1 = class ApplicationsSeedService {
    applicationTypeRepository;
    workflowTemplatesSeed;
    configService;
    logger = new common_1.Logger(ApplicationsSeedService_1.name);
    constructor(applicationTypeRepository, workflowTemplatesSeed, configService) {
        this.applicationTypeRepository = applicationTypeRepository;
        this.workflowTemplatesSeed = workflowTemplatesSeed;
        this.configService = configService;
    }
    async onApplicationBootstrap() {
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
            }
            else {
                await this.applicationTypeRepository.save(this.applicationTypeRepository.create({
                    code: row.code,
                    name: row.name,
                    sortOrder: row.sortOrder,
                    isActive: true,
                    metadata: {},
                }));
            }
        }
        this.logger.log(`Seeded ${APPLICATION_TYPE_SEEDS.length} application types (upsert by code)`);
        await this.workflowTemplatesSeed.seedTemplates();
    }
    shouldRunBootstrapSeeds() {
        const raw = this.configService.get('RUN_BOOTSTRAP_SEEDS', 'true');
        return ['true', '1', 'yes', 'on'].includes(raw.trim().toLowerCase());
    }
};
exports.ApplicationsSeedService = ApplicationsSeedService;
exports.ApplicationsSeedService = ApplicationsSeedService = ApplicationsSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(application_type_entity_1.ApplicationType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        application_workflow_templates_seed_service_1.ApplicationWorkflowTemplatesSeedService,
        config_1.ConfigService])
], ApplicationsSeedService);
//# sourceMappingURL=applications.seed.service.js.map