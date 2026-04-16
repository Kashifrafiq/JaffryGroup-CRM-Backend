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
var UsersSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const user_role_enum_1 = require("./entities/user-role.enum");
const admin_profile_entity_1 = require("./entities/admin-profile.entity");
const associate_profile_entity_1 = require("./entities/associate-profile.entity");
const customer_profile_entity_1 = require("./entities/customer-profile.entity");
let UsersSeedService = UsersSeedService_1 = class UsersSeedService {
    usersRepository;
    adminProfileRepository;
    associateProfileRepository;
    customerProfileRepository;
    configService;
    logger = new common_1.Logger(UsersSeedService_1.name);
    constructor(usersRepository, adminProfileRepository, associateProfileRepository, customerProfileRepository, configService) {
        this.usersRepository = usersRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.configService = configService;
    }
    async onApplicationBootstrap() {
        await this.consolidateUserTables();
        await this.backfillProfilesForExistingUsers();
        await this.dropLegacyProfileTables();
        const adminEmail = this.configService
            .get('ADMIN_EMAIL', 'kashif@vanestone.tech')
            .trim()
            .toLowerCase();
        const adminPassword = this.configService.get('ADMIN_PASSWORD', '123K@shif');
        const existingAdmin = await this.usersRepository.findOne({
            where: { email: adminEmail },
            relations: ['adminProfile'],
        });
        if (existingAdmin) {
            if (!existingAdmin.adminProfile) {
                await this.adminProfileRepository.save(this.adminProfileRepository.create({
                    userId: existingAdmin.id,
                    firstName: 'Kashif',
                    lastName: 'Admin',
                }));
            }
            return;
        }
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = this.usersRepository.create({
            email: adminEmail,
            password: hashedPassword,
            role: user_role_enum_1.UserRole.ADMIN,
            isActive: true,
        });
        const savedAdmin = await this.usersRepository.save(adminUser);
        await this.adminProfileRepository.save(this.adminProfileRepository.create({
            userId: savedAdmin.id,
            firstName: 'Kashif',
            lastName: 'Admin',
        }));
        this.logger.log(`Seeded default admin user: ${adminEmail}`);
    }
    async backfillProfilesForExistingUsers() {
        const users = await this.usersRepository.find({
            relations: ['adminProfile', 'associateProfile', 'customerProfile'],
        });
        const needsProfile = users.filter((user) => !user.adminProfile && !user.associateProfile && !user.customerProfile);
        if (!needsProfile.length) {
            return;
        }
        const legacyRows = await this.loadLegacyProfileRows();
        const legacyById = new Map(legacyRows.map((row) => [row.id, row]));
        for (const user of needsProfile) {
            const legacyRow = legacyById.get(user.id);
            const firstName = legacyRow?.firstName ?? 'User';
            const lastName = legacyRow?.lastName ?? user.role;
            const baseProfile = {
                userId: user.id,
                firstName,
                lastName,
                phoneNumber: legacyRow?.phoneNumber ?? undefined,
                address: legacyRow?.address ?? undefined,
                dateOfBirth: legacyRow?.dateOfBirth ?? undefined,
                profilePhoto: legacyRow?.profilePhoto ?? undefined,
            };
            if (user.role === user_role_enum_1.UserRole.ADMIN) {
                await this.adminProfileRepository.save(this.adminProfileRepository.create(baseProfile));
            }
            else if (user.role === user_role_enum_1.UserRole.ASSOCIATE) {
                await this.associateProfileRepository.save(this.associateProfileRepository.create({
                    ...baseProfile,
                    email: user.email,
                    role: user_role_enum_1.UserRole.ASSOCIATE,
                }));
            }
            else if (user.role === user_role_enum_1.UserRole.CUSTOMER) {
                await this.customerProfileRepository.save(this.customerProfileRepository.create({
                    ...baseProfile,
                    email: user.email,
                    role: user_role_enum_1.UserRole.CUSTOMER,
                }));
            }
        }
        this.logger.log(`Backfilled ${needsProfile.length} role profile records`);
    }
    async loadLegacyProfileRows() {
        try {
            return await this.usersRepository.query('SELECT id, role, "firstName", "lastName", "phoneNumber", address, "dateOfBirth", "profilePhoto" FROM users');
        }
        catch {
            return [];
        }
    }
    async dropLegacyProfileTables() {
        try {
            await this.usersRepository.query('DROP TABLE IF EXISTS admin_profiles CASCADE');
            await this.usersRepository.query('DROP TABLE IF EXISTS associate_profiles CASCADE');
            await this.usersRepository.query('DROP TABLE IF EXISTS customer_profiles CASCADE');
            this.logger.log('Dropped legacy *_profiles tables when present');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Could not drop legacy *_profiles tables: ${message}`);
        }
    }
    async consolidateUserTables() {
        try {
            const tableRows = (await this.usersRepository.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user', 'users')"));
            const hasUser = tableRows.some((row) => row.tablename === 'user');
            const hasUsers = tableRows.some((row) => row.tablename === 'users');
            if (!hasUser && hasUsers) {
                return;
            }
            if (hasUser && !hasUsers) {
                await this.usersRepository.query('ALTER TABLE "user" RENAME TO users');
                this.logger.log('Renamed legacy user table to users');
                return;
            }
            await this.usersRepository.query(`INSERT INTO users (
          id, email, password, "firstName", "lastName", "phoneNumber", address, "dateOfBirth", "profilePhoto", role, "isActive", "createdAt", "updatedAt"
        )
        SELECT
          u.id, u.email, u.password, u."firstName", u."lastName", u."phoneNumber", u.address, u."dateOfBirth", u."profilePhoto", u.role, u."isActive", u."createdAt", u."updatedAt"
        FROM "user" u
        WHERE NOT EXISTS (
          SELECT 1 FROM users nu WHERE nu.id = u.id OR nu.email = u.email
        )`);
            await this.usersRepository.query('DROP TABLE IF EXISTS "user" CASCADE');
            this.logger.log('Consolidated user table into users and dropped user');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Could not consolidate user/users tables: ${message}`);
        }
    }
};
exports.UsersSeedService = UsersSeedService;
exports.UsersSeedService = UsersSeedService = UsersSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_profile_entity_1.AdminProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], UsersSeedService);
//# sourceMappingURL=users.seed.service.js.map