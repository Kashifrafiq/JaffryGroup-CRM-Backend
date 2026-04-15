import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';

type LegacyProfileRow = {
  id: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  profilePhoto: string | null;
};

@Injectable()
export class UsersSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepository: Repository<CustomerProfile>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.consolidateUserTables();
    await this.backfillProfilesForExistingUsers();
    await this.dropLegacyProfileTables();

    const adminEmail = this.configService
      .get<string>('ADMIN_EMAIL', 'kashif@vanestone.tech')
      .trim()
      .toLowerCase();
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '123K@shif');

    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail },
      relations: ['adminProfile'],
    });

    if (existingAdmin) {
      if (!existingAdmin.adminProfile) {
        await this.adminProfileRepository.save(
          this.adminProfileRepository.create({
            userId: existingAdmin.id,
            firstName: 'Kashif',
            lastName: 'Admin',
          }),
        );
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = this.usersRepository.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    const savedAdmin = await this.usersRepository.save(adminUser);
    await this.adminProfileRepository.save(
      this.adminProfileRepository.create({
        userId: savedAdmin.id,
        firstName: 'Kashif',
        lastName: 'Admin',
      }),
    );
    this.logger.log(`Seeded default admin user: ${adminEmail}`);
  }

  private async backfillProfilesForExistingUsers(): Promise<void> {
    const users = await this.usersRepository.find({
      relations: ['adminProfile', 'associateProfile', 'customerProfile'],
    });

    const needsProfile = users.filter(
      (user) => !user.adminProfile && !user.associateProfile && !user.customerProfile,
    );
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

      if (user.role === UserRole.ADMIN) {
        await this.adminProfileRepository.save(this.adminProfileRepository.create(baseProfile));
      } else if (user.role === UserRole.ASSOCIATE) {
        await this.associateProfileRepository.save(
          this.associateProfileRepository.create(baseProfile),
        );
      } else if (user.role === UserRole.CUSTOMER) {
        await this.customerProfileRepository.save(this.customerProfileRepository.create(baseProfile));
      }
    }

    this.logger.log(`Backfilled ${needsProfile.length} role profile records`);
  }

  private async loadLegacyProfileRows(): Promise<LegacyProfileRow[]> {
    try {
      return await this.usersRepository.query(
        'SELECT id, role, "firstName", "lastName", "phoneNumber", address, "dateOfBirth", "profilePhoto" FROM users',
      );
    } catch {
      return [];
    }
  }

  private async dropLegacyProfileTables(): Promise<void> {
    try {
      await this.usersRepository.query('DROP TABLE IF EXISTS admin_profiles CASCADE');
      await this.usersRepository.query('DROP TABLE IF EXISTS associate_profiles CASCADE');
      await this.usersRepository.query('DROP TABLE IF EXISTS customer_profiles CASCADE');
      this.logger.log('Dropped legacy *_profiles tables when present');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not drop legacy *_profiles tables: ${message}`);
    }
  }

  private async consolidateUserTables(): Promise<void> {
    try {
      const tableRows = (await this.usersRepository.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user', 'users')",
      )) as Array<{ tablename: string }>;
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

      await this.usersRepository.query(
        `INSERT INTO users (
          id, email, password, "firstName", "lastName", "phoneNumber", address, "dateOfBirth", "profilePhoto", role, "isActive", "createdAt", "updatedAt"
        )
        SELECT
          u.id, u.email, u.password, u."firstName", u."lastName", u."phoneNumber", u.address, u."dateOfBirth", u."profilePhoto", u.role, u."isActive", u."createdAt", u."updatedAt"
        FROM "user" u
        WHERE NOT EXISTS (
          SELECT 1 FROM users nu WHERE nu.id = u.id OR nu.email = u.email
        )`,
      );

      await this.usersRepository.query('DROP TABLE IF EXISTS "user" CASCADE');
      this.logger.log('Consolidated user table into users and dropped user');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not consolidate user/users tables: ${message}`);
    }
  }
}
