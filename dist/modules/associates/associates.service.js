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
exports.AssociatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
let AssociatesService = class AssociatesService {
    associateRepository;
    constructor(associateRepository) {
        this.associateRepository = associateRepository;
    }
    async createAssociate(createAssociateDto, createdBy) {
        if (createdBy && createdBy.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can create associates');
        }
        const normalizedEmail = createAssociateDto.email.trim().toLowerCase();
        const existing = await this.associateRepository.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            throw new common_1.ConflictException('Email already in use');
        }
        const fallbackName = normalizedEmail.split('@')[0] || 'Associate User';
        const { firstName, lastName } = this.splitName(createAssociateDto.name ?? fallbackName);
        return this.associateRepository.save(this.associateRepository.create({
            email: normalizedEmail,
            role: createAssociateDto.role.trim(),
            department: createAssociateDto.department,
            status: createAssociateDto.status ?? associate_profile_entity_1.AssociateStatus.ACTIVE,
            firstName,
            lastName,
            phoneNumber: createAssociateDto.phoneNumber,
            address: createAssociateDto.address,
            profilePhoto: createAssociateDto.profilePhoto,
            lastActive: createAssociateDto.lastActive
                ? new Date(createAssociateDto.lastActive)
                : undefined,
            taskAssigned: createAssociateDto.taskAssigned ?? 0,
        }));
    }
    splitName(name) {
        const trimmed = name.trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return { firstName: 'Associate', lastName: 'User' };
        }
        if (parts.length === 1) {
            return { firstName: parts[0], lastName: 'Associate' };
        }
        return {
            firstName: parts[0],
            lastName: parts.slice(1).join(' '),
        };
    }
};
exports.AssociatesService = AssociatesService;
exports.AssociatesService = AssociatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AssociatesService);
//# sourceMappingURL=associates.service.js.map