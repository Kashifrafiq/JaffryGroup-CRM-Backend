import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminEmail = this.configService
      .get<string>('ADMIN_EMAIL', 'kashif@vanestone.tech')
      .trim()
      .toLowerCase();
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '123K@shif');

    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail },
      select: ['id', 'email'],
    });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = this.usersRepository.create({
      firstName: 'Kashif',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await this.usersRepository.save(adminUser);
    this.logger.log(`Seeded default admin user: ${adminEmail}`);
  }
}
