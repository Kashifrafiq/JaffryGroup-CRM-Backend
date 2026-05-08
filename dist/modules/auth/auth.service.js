"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../users/entities/user.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const associate_invite_entity_1 = require("../associates/entities/associate-invite.entity");
let AuthService = class AuthService {
    usersRepository;
    invitesRepository;
    jwtService;
    dataSource;
    constructor(usersRepository, invitesRepository, jwtService, dataSource) {
        this.usersRepository = usersRepository;
        this.invitesRepository = invitesRepository;
        this.jwtService = jwtService;
        this.dataSource = dataSource;
    }
    async adminLogin(adminLoginDto) {
        const user = await this.findUserForLogin(adminLoginDto.email);
        const names = this.getUserNames(user);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admin can login here');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is inactive');
        }
        const token = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: names.firstName,
                lastName: names.lastName,
                role: user.role,
            },
        };
    }
    async associateLogin(associateLoginDto) {
        const user = await this.findUserForLogin(associateLoginDto.email);
        const names = this.getUserNames(user);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(associateLoginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Only associate can login here');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is inactive');
        }
        const token = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: names.firstName,
                lastName: names.lastName,
                role: user.role,
            },
        };
    }
    async validateAssociateInviteToken(token) {
        const invite = await this.findActiveInviteByToken(token);
        return {
            email: invite.email,
            firstName: invite.firstName ?? null,
            lastName: invite.lastName ?? null,
            roleLabel: invite.roleLabel ?? null,
            department: invite.department ?? null,
            phoneNumber: invite.phoneNumber ?? null,
            address: invite.address ?? null,
            profilePhoto: invite.profilePhoto ?? null,
            expiresAt: invite.expiresAt,
        };
    }
    async acceptAssociateInvite(dto) {
        const token = dto.token.trim();
        const normalizedEmail = dto.email.trim().toLowerCase();
        const invite = await this.findActiveInviteByToken(token);
        if (invite.email !== normalizedEmail) {
            throw new common_1.UnauthorizedException('Invite token does not match email');
        }
        const existing = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const existingAssociate = await this.dataSource.getRepository(associate_profile_entity_1.AssociateProfile).findOne({
            where: { email: normalizedEmail },
        });
        if (existingAssociate?.userId) {
            throw new common_1.ConflictException('Associate profile is already linked to a user');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.dataSource.transaction(async (manager) => {
            const userRow = manager.create(user_entity_1.User, {
                email: normalizedEmail,
                password: passwordHash,
                role: user_role_enum_1.UserRole.ASSOCIATE,
                isActive: true,
            });
            const user = await manager.save(user_entity_1.User, userRow);
            if (existingAssociate) {
                existingAssociate.userId = user.id;
                existingAssociate.email = normalizedEmail;
                existingAssociate.firstName = dto.firstName.trim();
                existingAssociate.lastName = dto.lastName.trim();
                existingAssociate.role = (dto.roleLabel ?? invite.roleLabel ?? existingAssociate.role ?? 'associate').trim();
                existingAssociate.department =
                    dto.department ?? invite.department ?? existingAssociate.department ?? undefined;
                existingAssociate.phoneNumber =
                    dto.phoneNumber ?? invite.phoneNumber ?? existingAssociate.phoneNumber ?? undefined;
                existingAssociate.address = dto.address ?? invite.address ?? existingAssociate.address ?? undefined;
                existingAssociate.profilePhoto =
                    dto.profilePhoto ?? invite.profilePhoto ?? existingAssociate.profilePhoto ?? undefined;
                await manager.save(associate_profile_entity_1.AssociateProfile, existingAssociate);
            }
            else {
                const associateRow = manager.create(associate_profile_entity_1.AssociateProfile);
                associateRow.email = normalizedEmail;
                associateRow.userId = user.id;
                associateRow.firstName = dto.firstName.trim();
                associateRow.lastName = dto.lastName.trim();
                associateRow.role = (dto.roleLabel ?? invite.roleLabel ?? 'associate').trim();
                associateRow.department = dto.department ?? invite.department ?? undefined;
                associateRow.phoneNumber = dto.phoneNumber ?? invite.phoneNumber ?? undefined;
                associateRow.address = dto.address ?? invite.address ?? undefined;
                associateRow.profilePhoto = dto.profilePhoto ?? invite.profilePhoto ?? undefined;
                await manager.save(associate_profile_entity_1.AssociateProfile, associateRow);
            }
            invite.acceptedAt = new Date();
            await manager.save(associate_invite_entity_1.AssociateInvite, invite);
        });
        return {
            accepted: true,
            email: normalizedEmail,
            message: 'Associate account created successfully. You can now log in.',
        };
    }
    async findUserForLogin(emailInput) {
        const email = emailInput.trim().toLowerCase();
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.adminProfile', 'adminProfile')
            .leftJoinAndSelect('user.associateProfile', 'associateProfile')
            .leftJoinAndSelect('user.customerProfile', 'customerProfile')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    getUserNames(user) {
        const profile = user.adminProfile ?? user.associateProfile ?? user.customerProfile;
        if (!profile) {
            throw new common_1.UnauthorizedException('Profile missing for user');
        }
        return {
            firstName: profile.firstName,
            lastName: profile.lastName,
        };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token.trim()).digest('hex');
    }
    async findActiveInviteByToken(token) {
        const tokenHash = this.hashToken(token);
        const invite = await this.invitesRepository.findOne({
            where: {
                tokenHash,
                acceptedAt: (0, typeorm_2.IsNull)(),
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!invite) {
            throw new common_1.UnauthorizedException('Invalid or expired invite token');
        }
        return invite;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(associate_invite_entity_1.AssociateInvite)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        typeorm_2.DataSource])
], AuthService);
//# sourceMappingURL=auth.service.js.map