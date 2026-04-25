import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
export declare class UsersSeedService implements OnApplicationBootstrap {
    private readonly usersRepository;
    private readonly adminProfileRepository;
    private readonly associateProfileRepository;
    private readonly customerProfileRepository;
    private readonly configService;
    private readonly logger;
    constructor(usersRepository: Repository<User>, adminProfileRepository: Repository<AdminProfile>, associateProfileRepository: Repository<AssociateProfile>, customerProfileRepository: Repository<CustomerProfile>, configService: ConfigService);
    onApplicationBootstrap(): Promise<void>;
    private shouldRunBootstrapSeeds;
    private backfillProfilesForExistingUsers;
    private loadLegacyProfileRows;
    private dropLegacyProfileTables;
    private consolidateUserTables;
}
