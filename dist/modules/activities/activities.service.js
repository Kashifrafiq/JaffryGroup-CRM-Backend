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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const customer_activity_entity_1 = require("./entities/customer-activity.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const associate_customer_entity_1 = require("../users/entities/associate-customer.entity");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
let ActivitiesService = class ActivitiesService {
    activityRepository;
    customerRepository;
    associateRepository;
    associateCustomerRepository;
    constructor(activityRepository, customerRepository, associateRepository, associateCustomerRepository) {
        this.activityRepository = activityRepository;
        this.customerRepository = customerRepository;
        this.associateRepository = associateRepository;
        this.associateCustomerRepository = associateCustomerRepository;
    }
    async create(customerId, dto, actor) {
        const customer = await this.customerRepository.findOne({ where: { id: customerId } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        let associateId = null;
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            associateId = await this.associateIdForUser(actor.id);
            await this.assertAssociateAssignedToCustomer(associateId, customerId);
        }
        else if (dto.associateId) {
            associateId = dto.associateId.trim();
            await this.assertAssociateAssignedToCustomer(associateId, customerId);
        }
        const row = this.activityRepository.create({
            customerId,
            associateId,
            activityType: dto.activityType,
            details: dto.details.trim(),
            createdByUserId: actor.id,
        });
        return this.activityRepository.save(row);
    }
    async findByCustomer(customerId, actor) {
        await this.assertCanAccessCustomer(actor, customerId);
        return this.activityRepository.find({
            where: { customerId },
            relations: ['associate'],
            order: { createdAt: 'DESC' },
        });
    }
    async remove(customerId, activityId, actor) {
        await this.assertCanAccessCustomer(actor, customerId);
        const row = await this.activityRepository.findOne({
            where: { id: activityId, customerId },
            relations: ['associate'],
        });
        if (!row) {
            throw new common_1.NotFoundException(`Activity #${activityId} not found for this customer`);
        }
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            const associateId = await this.associateIdForUser(actor.id);
            if (!row.associateId || row.associateId !== associateId) {
                throw new common_1.ForbiddenException('You can only delete your own activities');
            }
        }
        await this.activityRepository.remove(row);
    }
    async assertCanAccessCustomer(actor, customerId) {
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            return;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const associateId = await this.associateIdForUser(actor.id);
        await this.assertAssociateAssignedToCustomer(associateId, customerId);
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
    async assertAssociateAssignedToCustomer(associateId, customerId) {
        const link = await this.associateCustomerRepository.findOne({
            where: { associateId, customerId },
            select: ['id'],
        });
        if (!link) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_activity_entity_1.CustomerActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(3, (0, typeorm_1.InjectRepository)(associate_customer_entity_1.AssociateCustomer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map