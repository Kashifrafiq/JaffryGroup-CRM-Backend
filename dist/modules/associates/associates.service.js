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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../tasks/entities/task.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const associate_invite_entity_1 = require("./entities/associate-invite.entity");
const associate_invite_mail_service_1 = require("./associate-invite-mail.service");
let AssociatesService = class AssociatesService {
    associateRepository;
    inviteRepository;
    userRepository;
    taskRepository;
    configService;
    inviteMailService;
    constructor(associateRepository, inviteRepository, userRepository, taskRepository, configService, inviteMailService) {
        this.associateRepository = associateRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.configService = configService;
        this.inviteMailService = inviteMailService;
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
    async inviteAssociate(dto, createdBy) {
        if (createdBy.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can invite associates');
        }
        const normalizedEmail = dto.email.trim().toLowerCase();
        await this.assertEmailIsAvailableForInvite(normalizedEmail);
        const frontendBase = this.configService.get('FRONTEND_INVITE_URL_BASE')?.trim();
        if (!frontendBase) {
            throw new common_1.BadRequestException('FRONTEND_INVITE_URL_BASE is required');
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = this.getInviteExpiryDate();
        const inviteLink = `${frontendBase}${frontendBase.includes('?') ? '&' : '?'}token=${token}`;
        const invite = this.inviteRepository.create({
            email: normalizedEmail,
            firstName: dto.firstName?.trim() || null,
            lastName: dto.lastName?.trim() || null,
            roleLabel: dto.roleLabel?.trim() || null,
            department: dto.department?.trim() || null,
            phoneNumber: dto.phoneNumber?.trim() || null,
            address: dto.address?.trim() || null,
            profilePhoto: dto.profilePhoto?.trim() || null,
            tokenHash,
            expiresAt,
            acceptedAt: null,
            createdByUserId: createdBy.id,
        });
        await this.inviteRepository.save(invite);
        try {
            await this.inviteMailService.sendAssociateInvite({
                to: normalizedEmail,
                inviteLink,
            });
        }
        catch (error) {
            await this.inviteRepository.delete(invite.id);
            throw error;
        }
        return {
            inviteSent: true,
            email: normalizedEmail,
            expiresAt,
        };
    }
    async findAll() {
        return this.associateRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const associate = await this.associateRepository.findOne({ where: { id } });
        if (!associate) {
            throw new common_1.NotFoundException(`Associate #${id} not found`);
        }
        return associate;
    }
    async update(id, dto) {
        const associate = await this.findOne(id);
        if (dto.email !== undefined) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            const existing = await this.associateRepository.findOne({ where: { email: normalizedEmail } });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('Email already in use');
            }
            associate.email = normalizedEmail;
        }
        if (dto.name !== undefined) {
            const { firstName, lastName } = this.splitName(dto.name);
            associate.firstName = firstName;
            associate.lastName = lastName;
        }
        if (dto.role !== undefined) {
            associate.role = dto.role.trim();
        }
        if (dto.department !== undefined) {
            associate.department = dto.department;
        }
        if (dto.status !== undefined) {
            associate.status = dto.status;
        }
        if (dto.lastActive !== undefined) {
            associate.lastActive = dto.lastActive ? new Date(dto.lastActive) : undefined;
        }
        if (dto.taskAssigned !== undefined) {
            associate.taskAssigned = dto.taskAssigned;
        }
        if (dto.phoneNumber !== undefined) {
            associate.phoneNumber = dto.phoneNumber;
        }
        if (dto.address !== undefined) {
            associate.address = dto.address;
        }
        if (dto.profilePhoto !== undefined) {
            associate.profilePhoto = dto.profilePhoto;
        }
        return this.associateRepository.save(associate);
    }
    async remove(id) {
        await this.findOne(id);
        const assignedTasks = await this.taskRepository.count({
            where: { assignedTo: { id } },
        });
        if (assignedTasks > 0) {
            throw new common_1.ConflictException('Cannot delete associate while tasks are assigned to them; reassign or remove those tasks first.');
        }
        await this.associateRepository.delete(id);
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
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getInviteExpiryDate() {
        const hoursRaw = this.configService.get('ASSOCIATE_INVITE_EXPIRES_HOURS', '48');
        const hours = Number(hoursRaw);
        const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 48;
        return new Date(Date.now() + safeHours * 60 * 60 * 1000);
    }
    async assertEmailIsAvailableForInvite(email) {
        const [existingUser, existingInvite] = await Promise.all([
            this.userRepository.findOne({ where: { email } }),
            this.inviteRepository.findOne({
                where: {
                    email,
                    acceptedAt: (0, typeorm_2.IsNull)(),
                    expiresAt: (0, typeorm_2.MoreThan)(new Date()),
                },
            }),
        ]);
        if (existingUser) {
            throw new common_1.ConflictException('Email already in use');
        }
        if (existingInvite) {
            throw new common_1.ConflictException('An active invite already exists for this email');
        }
    }
};
exports.AssociatesService = AssociatesService;
exports.AssociatesService = AssociatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(associate_invite_entity_1.AssociateInvite)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        associate_invite_mail_service_1.AssociateInviteMailService])
], AssociatesService);
//# sourceMappingURL=associates.service.js.map