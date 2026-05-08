import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AssociateInvite } from '../associates/entities/associate-invite.entity';
import { AcceptAssociateInviteDto } from './dto/accept-associate-invite.dto';
import { CustomerInvite } from '../customers/entities/customer-invite.entity';
import { AcceptCustomerInviteDto } from './dto/accept-customer-invite.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AssociateInvite)
    private readonly invitesRepository: Repository<AssociateInvite>,
    @InjectRepository(CustomerInvite)
    private readonly customerInvitesRepository: Repository<CustomerInvite>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const user = await this.findUserForLogin(adminLoginDto.email);
    const names = this.getUserNames(user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can login here');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
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

  async associateLogin(associateLoginDto: AdminLoginDto) {
    const user = await this.findUserForLogin(associateLoginDto.email);
    const names = this.getUserNames(user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(associateLoginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Only associate can login here');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
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

  async customerLogin(customerLoginDto: AdminLoginDto) {
    const user = await this.findUserForLogin(customerLoginDto.email);
    const names = this.getUserNames(user);

    const isPasswordValid = await bcrypt.compare(customerLoginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customer can login here');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
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

  async validateAssociateInviteToken(token: string) {
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

  async acceptAssociateInvite(dto: AcceptAssociateInviteDto) {
    const token = dto.token.trim();
    const normalizedEmail = dto.email.trim().toLowerCase();
    const invite = await this.findActiveInviteByToken(token);
    if (invite.email !== normalizedEmail) {
      throw new UnauthorizedException('Invite token does not match email');
    }

    const existing = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const existingAssociate = await this.dataSource.getRepository(AssociateProfile).findOne({
      where: { email: normalizedEmail },
    });
    if (existingAssociate?.userId) {
      throw new ConflictException('Associate profile is already linked to a user');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.dataSource.transaction(async (manager) => {
      const userRow = manager.create(User, {
        email: normalizedEmail,
        password: passwordHash,
        role: UserRole.ASSOCIATE,
        isActive: true,
      });
      const user = await manager.save(User, userRow);

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
        await manager.save(AssociateProfile, existingAssociate);
      } else {
        const associateRow = manager.create(AssociateProfile);
        associateRow.email = normalizedEmail;
        associateRow.userId = user.id;
        associateRow.firstName = dto.firstName.trim();
        associateRow.lastName = dto.lastName.trim();
        associateRow.role = (dto.roleLabel ?? invite.roleLabel ?? 'associate').trim();
        associateRow.department = dto.department ?? invite.department ?? undefined;
        associateRow.phoneNumber = dto.phoneNumber ?? invite.phoneNumber ?? undefined;
        associateRow.address = dto.address ?? invite.address ?? undefined;
        associateRow.profilePhoto = dto.profilePhoto ?? invite.profilePhoto ?? undefined;
        await manager.save(AssociateProfile, associateRow);
      }

      invite.acceptedAt = new Date();
      await manager.save(AssociateInvite, invite);
    });

    return {
      accepted: true,
      email: normalizedEmail,
      message: 'Associate account created successfully. You can now log in.',
    };
  }

  async validateCustomerInviteToken(token: string) {
    const invite = await this.findActiveCustomerInviteByToken(token);
    return {
      email: invite.email,
      firstName: invite.firstName ?? null,
      lastName: invite.lastName ?? null,
      phoneNumber: invite.phoneNumber ?? null,
      property: invite.property ?? null,
      address: invite.address ?? null,
      profilePhoto: invite.profilePhoto ?? null,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptCustomerInvite(dto: AcceptCustomerInviteDto) {
    const token = dto.token.trim();
    const normalizedEmail = dto.email.trim().toLowerCase();
    const invite = await this.findActiveCustomerInviteByToken(token);
    if (invite.email !== normalizedEmail) {
      throw new UnauthorizedException('Invite token does not match email');
    }

    const existing = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const existingCustomer = await this.dataSource.getRepository(CustomerProfile).findOne({
      where: { email: normalizedEmail },
    });
    if (!existingCustomer) {
      throw new NotFoundException('Customer profile not found. Create customer first.');
    }
    if (existingCustomer.userId) {
      throw new ConflictException('Customer profile is already linked to a user');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.dataSource.transaction(async (manager) => {
      const userRow = manager.create(User, {
        email: normalizedEmail,
        password: passwordHash,
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      const user = await manager.save(User, userRow);

      existingCustomer.userId = user.id;
      existingCustomer.email = normalizedEmail;
      existingCustomer.firstName = dto.firstName.trim();
      existingCustomer.lastName = dto.lastName.trim();
      await manager.save(CustomerProfile, existingCustomer);

      invite.acceptedAt = new Date();
      await manager.save(CustomerInvite, invite);
    });

    return {
      accepted: true,
      email: normalizedEmail,
      message: 'Customer account created successfully. You can now log in.',
    };
  }

  private async findUserForLogin(emailInput: string): Promise<User> {
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
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private getUserNames(user: User): { firstName: string; lastName: string } {
    const profile = user.adminProfile ?? user.associateProfile ?? user.customerProfile;
    if (!profile) {
      throw new UnauthorizedException('Profile missing for user');
    }

    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token.trim()).digest('hex');
  }

  private async findActiveInviteByToken(token: string): Promise<AssociateInvite> {
    const tokenHash = this.hashToken(token);
    const invite = await this.invitesRepository.findOne({
      where: {
        tokenHash,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!invite) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }
    return invite;
  }

  private async findActiveCustomerInviteByToken(token: string): Promise<CustomerInvite> {
    const tokenHash = this.hashToken(token);
    const invite = await this.customerInvitesRepository.findOne({
      where: {
        tokenHash,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!invite) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }
    return invite;
  }
}
