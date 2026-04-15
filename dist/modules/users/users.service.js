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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const user_entity_1 = require("./entities/user.entity");
const admin_profile_entity_1 = require("./entities/admin-profile.entity");
const associate_profile_entity_1 = require("./entities/associate-profile.entity");
const customer_profile_entity_1 = require("./entities/customer-profile.entity");
let UsersService = class UsersService {
    userRepository;
    adminProfileRepository;
    associateProfileRepository;
    customerProfileRepository;
    constructor(userRepository, adminProfileRepository, associateProfileRepository, customerProfileRepository) {
        this.userRepository = userRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.customerProfileRepository = customerProfileRepository;
    }
    async create(createUserDto, createdBy) {
        if (createUserDto.role === user_entity_1.UserRole.ASSOCIATE &&
            createdBy &&
            createdBy.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can create Associates');
        }
        const normalizedEmail = createUserDto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            email: normalizedEmail,
            password: hashedPassword,
            role: createUserDto.role,
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);
        const profile = await this.createProfile(savedUser.id, createUserDto);
        return this.toUserView(savedUser, profile);
    }
    async createAssociate(createAssociateDto, createdBy) {
        if (createdBy && createdBy.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can create associates');
        }
        if (createAssociateDto.role !== user_entity_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Role must be associate');
        }
        const normalizedEmail = createAssociateDto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const password = createAssociateDto.password ?? this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            email: normalizedEmail,
            password: hashedPassword,
            role: user_entity_1.UserRole.ASSOCIATE,
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);
        const { firstName, lastName } = this.splitName(createAssociateDto.name);
        const associateProfile = await this.associateProfileRepository.save(this.associateProfileRepository.create({
            userId: savedUser.id,
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
        return this.toUserView(savedUser, associateProfile);
    }
    async findAll() {
        const users = await this.userRepository.find({
            relations: ['adminProfile', 'associateProfile', 'customerProfile'],
        });
        return users.map((user) => this.toUserView(user, this.getProfileFromUser(user)));
    }
    async findAssignedCustomers(associateId) {
        const associate = await this.userRepository.findOne({
            where: { id: associateId },
            relations: ['associateProfile', 'customers', 'customers.customerProfile'],
        });
        if (!associate)
            throw new common_1.NotFoundException('Associate not found');
        if (associate.role !== user_entity_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Only associates can access assigned customers');
        }
        return associate.customers.map((customer) => this.toUserView(customer, customer.customerProfile));
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['adminProfile', 'associateProfile', 'customerProfile'],
        });
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        return this.toUserView(user, this.getProfileFromUser(user));
    }
    async update(id, updateUserDto) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['adminProfile', 'associateProfile', 'customerProfile'],
        });
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        if (updateUserDto.role && updateUserDto.role !== user.role) {
            throw new common_1.ForbiddenException('Changing role is not supported by this endpoint');
        }
        if (updateUserDto.email) {
            const normalizedEmail = updateUserDto.email.trim().toLowerCase();
            const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('Email already in use');
            }
            user.email = normalizedEmail;
        }
        if (updateUserDto.password) {
            user.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        const profile = this.getProfileFromUser(user);
        if (!profile) {
            throw new common_1.NotFoundException('User profile not found');
        }
        profile.firstName = updateUserDto.firstName ?? profile.firstName;
        profile.lastName = updateUserDto.lastName ?? profile.lastName;
        profile.phoneNumber = updateUserDto.phoneNumber ?? profile.phoneNumber;
        profile.address = updateUserDto.address ?? profile.address;
        profile.dateOfBirth = updateUserDto.dateOfBirth ?? profile.dateOfBirth;
        profile.profilePhoto = updateUserDto.profilePhoto ?? profile.profilePhoto;
        await this.userRepository.save(user);
        const updatedProfile = await this.saveProfile(user.role, profile);
        return this.toUserView(user, updatedProfile);
    }
    async assignCustomerToAssociate(customerId, associateId) {
        const associate = await this.userRepository.findOne({
            where: { id: associateId, role: user_entity_1.UserRole.ASSOCIATE },
            relations: ['associateProfile', 'customers'],
        });
        if (!associate)
            throw new common_1.NotFoundException('Associate not found');
        const customer = await this.userRepository.findOne({
            where: { id: customerId, role: user_entity_1.UserRole.CUSTOMER },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const alreadyAssigned = associate.customers.some((c) => c.id === customerId);
        if (!alreadyAssigned) {
            associate.customers.push(customer);
            await this.userRepository.save(associate);
        }
        return this.toUserView(associate, associate.associateProfile);
    }
    async assignCustomerToAssociates(customerId, associateIds) {
        const customer = await this.userRepository.findOne({
            where: { id: customerId, role: user_entity_1.UserRole.CUSTOMER },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const uniqueAssociateIds = [...new Set(associateIds)];
        const assignedAssociateIds = [];
        for (const associateId of uniqueAssociateIds) {
            const associate = await this.userRepository.findOne({
                where: { id: associateId, role: user_entity_1.UserRole.ASSOCIATE },
                relations: ['customers'],
            });
            if (!associate) {
                throw new common_1.NotFoundException(`Associate ${associateId} not found`);
            }
            const alreadyAssigned = associate.customers.some((c) => c.id === customerId);
            if (!alreadyAssigned) {
                associate.customers.push(customer);
                await this.userRepository.save(associate);
            }
            assignedAssociateIds.push(associateId);
        }
        return {
            customerId,
            assignedAssociateIds,
            totalAssigned: assignedAssociateIds.length,
        };
    }
    async assignCustomersToAssociate(associateId, customerIds) {
        const associate = await this.userRepository.findOne({
            where: { id: associateId, role: user_entity_1.UserRole.ASSOCIATE },
            relations: ['customers'],
        });
        if (!associate)
            throw new common_1.NotFoundException('Associate not found');
        const uniqueCustomerIds = [...new Set(customerIds)];
        const assignedCustomerIds = [];
        for (const customerId of uniqueCustomerIds) {
            const customer = await this.userRepository.findOne({
                where: { id: customerId, role: user_entity_1.UserRole.CUSTOMER },
            });
            if (!customer) {
                throw new common_1.NotFoundException(`Customer ${customerId} not found`);
            }
            const alreadyAssigned = associate.customers.some((c) => c.id === customerId);
            if (!alreadyAssigned) {
                associate.customers.push(customer);
            }
            assignedCustomerIds.push(customerId);
        }
        await this.userRepository.save(associate);
        return {
            associateId,
            assignedCustomerIds,
            totalAssigned: assignedCustomerIds.length,
        };
    }
    async remove(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        user.isActive = false;
        await this.userRepository.save(user);
    }
    getProfileFromUser(user) {
        return user.adminProfile ?? user.associateProfile ?? user.customerProfile;
    }
    async createProfile(userId, createUserDto) {
        const profileData = {
            userId,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            phoneNumber: createUserDto.phoneNumber,
            address: createUserDto.address,
            dateOfBirth: createUserDto.dateOfBirth,
            profilePhoto: createUserDto.profilePhoto,
        };
        switch (createUserDto.role) {
            case user_entity_1.UserRole.ADMIN:
                return this.adminProfileRepository.save(this.adminProfileRepository.create(profileData));
            case user_entity_1.UserRole.ASSOCIATE:
                return this.associateProfileRepository.save(this.associateProfileRepository.create(profileData));
            case user_entity_1.UserRole.CUSTOMER:
                return this.customerProfileRepository.save(this.customerProfileRepository.create(profileData));
            default:
                throw new common_1.ForbiddenException('Unsupported role');
        }
    }
    async saveProfile(role, profile) {
        switch (role) {
            case user_entity_1.UserRole.ADMIN:
                return this.adminProfileRepository.save(profile);
            case user_entity_1.UserRole.ASSOCIATE:
                return this.associateProfileRepository.save(profile);
            case user_entity_1.UserRole.CUSTOMER:
                return this.customerProfileRepository.save(profile);
            default:
                throw new common_1.ForbiddenException('Unsupported role');
        }
    }
    toUserView(user, profile) {
        if (!profile) {
            throw new common_1.NotFoundException('User profile not found');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            phoneNumber: profile.phoneNumber,
            address: profile.address,
            dateOfBirth: profile.dateOfBirth,
            profilePhoto: profile.profilePhoto,
            lastActive: profile instanceof associate_profile_entity_1.AssociateProfile ? profile.lastActive : undefined,
            taskAssigned: profile instanceof associate_profile_entity_1.AssociateProfile ? profile.taskAssigned : undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
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
    generateTemporaryPassword() {
        return `${(0, crypto_1.randomBytes)(6).toString('hex')}A1!`;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_profile_entity_1.AdminProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map