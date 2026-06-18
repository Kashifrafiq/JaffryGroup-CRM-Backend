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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const pipeline_step_assignment_service_1 = require("../customers/pipeline-step-assignment.service");
const document_assignment_service_1 = require("../customers/document-assignment.service");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const customer_reminder_entity_1 = require("./entities/customer-reminder.entity");
const customer_reminder_enums_1 = require("./entities/customer-reminder.enums");
let RemindersService = class RemindersService {
    reminderRepository;
    customerRepository;
    associateRepository;
    pipelineStepAssignmentService;
    documentAssignmentService;
    constructor(reminderRepository, customerRepository, associateRepository, pipelineStepAssignmentService, documentAssignmentService) {
        this.reminderRepository = reminderRepository;
        this.customerRepository = customerRepository;
        this.associateRepository = associateRepository;
        this.pipelineStepAssignmentService = pipelineStepAssignmentService;
        this.documentAssignmentService = documentAssignmentService;
    }
    async create(customerId, dto, actor) {
        await this.assertCanAccessCustomer(actor, customerId);
        const customer = await this.customerRepository.findOne({ where: { id: customerId }, select: ['id'] });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        const associateId = actor.role === user_role_enum_1.UserRole.ASSOCIATE ? await this.associateIdForUser(actor.id) : null;
        const row = this.reminderRepository.create({
            customerId,
            associateId,
            title: dto.title.trim(),
            description: dto.description?.trim() ?? null,
            remindAt: new Date(dto.remindAt),
            status: dto.status ?? customer_reminder_enums_1.CustomerReminderStatus.PENDING,
            createdByUserId: actor.id,
        });
        return this.reminderRepository.save(row);
    }
    async findByCustomer(customerId, actor) {
        await this.assertCanAccessCustomer(actor, customerId);
        return this.reminderRepository.find({
            where: { customerId },
            relations: ['associate'],
            order: { remindAt: 'ASC', createdAt: 'DESC' },
        });
    }
    async findOne(customerId, reminderId, actor) {
        await this.assertCanAccessCustomer(actor, customerId);
        const row = await this.reminderRepository.findOne({
            where: { id: reminderId, customerId },
            relations: ['associate'],
        });
        if (!row) {
            throw new common_1.NotFoundException(`Reminder #${reminderId} not found for this customer`);
        }
        return row;
    }
    async update(customerId, reminderId, dto, actor) {
        const row = await this.findOne(customerId, reminderId, actor);
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE && row.createdByUserId !== actor.id) {
            throw new common_1.ForbiddenException('You can only update reminders created by you');
        }
        if (dto.title !== undefined)
            row.title = dto.title.trim();
        if (dto.description !== undefined)
            row.description = dto.description?.trim() ?? null;
        if (dto.remindAt !== undefined)
            row.remindAt = new Date(dto.remindAt);
        if (dto.status !== undefined)
            row.status = dto.status;
        return this.reminderRepository.save(row);
    }
    async remove(customerId, reminderId, actor) {
        const row = await this.findOne(customerId, reminderId, actor);
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE && row.createdByUserId !== actor.id) {
            throw new common_1.ForbiddenException('You can only delete reminders created by you');
        }
        await this.reminderRepository.remove(row);
    }
    async assertCanAccessCustomer(actor, customerId) {
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            return;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const associateId = await this.associateIdForUser(actor.id);
        const [pipelineAllowed, documentAllowed] = await Promise.all([
            this.pipelineStepAssignmentService.hasAccessToCustomer(associateId, customerId),
            this.documentAssignmentService.hasAccessToCustomer(associateId, customerId),
        ]);
        if (!pipelineAllowed && !documentAllowed) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
    }
    async associateIdForUser(userId) {
        const associate = await this.associateRepository.findOne({
            where: { userId },
            select: ['id'],
        });
        if (!associate) {
            throw new common_1.ForbiddenException('Associate profile not found');
        }
        return associate.id;
    }
};
exports.RemindersService = RemindersService;
exports.RemindersService = RemindersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_reminder_entity_1.CustomerReminder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pipeline_step_assignment_service_1.PipelineStepAssignmentService,
        document_assignment_service_1.DocumentAssignmentService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map