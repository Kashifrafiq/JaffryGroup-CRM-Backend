import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserProfile = AdminProfile | AssociateProfile | CustomerProfile;

type UserView = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  profilePhoto?: string;
  lastActive?: Date;
  taskAssigned?: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepository: Repository<CustomerProfile>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<UserView> {
    if (
      createUserDto.role === UserRole.ASSOCIATE &&
      createdBy &&
      createdBy.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only Admin can create Associates');
    }

    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) throw new ConflictException('Email already in use');

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

  async createAssociate(
    createAssociateDto: CreateAssociateDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<UserView> {
    if (createdBy && createdBy.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can create associates');
    }
    if (createAssociateDto.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Role must be associate');
    }

    const normalizedEmail = createAssociateDto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) throw new ConflictException('Email already in use');

    const password = createAssociateDto.password ?? this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.ASSOCIATE,
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    const { firstName, lastName } = this.splitName(createAssociateDto.name);
    const associateProfile = await this.associateProfileRepository.save(
      this.associateProfileRepository.create({
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
      }),
    );

    return this.toUserView(savedUser, associateProfile);
  }

  async findAll(): Promise<UserView[]> {
    const users = await this.userRepository.find({
      relations: ['adminProfile', 'associateProfile', 'customerProfile'],
    });
    return users.map((user) => this.toUserView(user, this.getProfileFromUser(user)));
  }

  async findAssignedCustomers(associateId: string): Promise<UserView[]> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId },
      relations: ['associateProfile', 'customers', 'customers.customerProfile'],
    });
    if (!associate) throw new NotFoundException('Associate not found');
    if (associate.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Only associates can access assigned customers');
    }

    return associate.customers.map((customer) =>
      this.toUserView(customer, customer.customerProfile),
    );
  }

  async findOne(id: string): Promise<UserView> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['adminProfile', 'associateProfile', 'customerProfile'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    return this.toUserView(user, this.getProfileFromUser(user));
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserView> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['adminProfile', 'associateProfile', 'customerProfile'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (updateUserDto.role && updateUserDto.role !== user.role) {
      throw new ForbiddenException('Changing role is not supported by this endpoint');
    }

    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
      user.email = normalizedEmail;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const profile = this.getProfileFromUser(user);
    if (!profile) {
      throw new NotFoundException('User profile not found');
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

  async assignCustomerToAssociate(customerId: string, associateId: string): Promise<UserView> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId, role: UserRole.ASSOCIATE },
      relations: ['associateProfile', 'customers'],
    });
    if (!associate) throw new NotFoundException('Associate not found');

    const customer = await this.userRepository.findOne({
      where: { id: customerId, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const alreadyAssigned = associate.customers.some((c) => c.id === customerId);
    if (!alreadyAssigned) {
      associate.customers.push(customer);
      await this.userRepository.save(associate);
    }

    return this.toUserView(associate, associate.associateProfile);
  }

  async assignCustomerToAssociates(
    customerId: string,
    associateIds: string[],
  ): Promise<{ customerId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    const customer = await this.userRepository.findOne({
      where: { id: customerId, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const uniqueAssociateIds = [...new Set(associateIds)];
    const assignedAssociateIds: string[] = [];

    for (const associateId of uniqueAssociateIds) {
      const associate = await this.userRepository.findOne({
        where: { id: associateId, role: UserRole.ASSOCIATE },
        relations: ['customers'],
      });
      if (!associate) {
        throw new NotFoundException(`Associate ${associateId} not found`);
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

  async assignCustomersToAssociate(
    associateId: string,
    customerIds: string[],
  ): Promise<{ associateId: string; assignedCustomerIds: string[]; totalAssigned: number }> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId, role: UserRole.ASSOCIATE },
      relations: ['customers'],
    });
    if (!associate) throw new NotFoundException('Associate not found');

    const uniqueCustomerIds = [...new Set(customerIds)];
    const assignedCustomerIds: string[] = [];

    for (const customerId of uniqueCustomerIds) {
      const customer = await this.userRepository.findOne({
        where: { id: customerId, role: UserRole.CUSTOMER },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
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

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  private getProfileFromUser(user: User): UserProfile | undefined {
    return user.adminProfile ?? user.associateProfile ?? user.customerProfile;
  }

  private async createProfile(userId: string, createUserDto: CreateUserDto): Promise<UserProfile> {
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
      case UserRole.ADMIN:
        return this.adminProfileRepository.save(this.adminProfileRepository.create(profileData));
      case UserRole.ASSOCIATE:
        return this.associateProfileRepository.save(
          this.associateProfileRepository.create(profileData),
        );
      case UserRole.CUSTOMER:
        return this.customerProfileRepository.save(
          this.customerProfileRepository.create(profileData),
        );
      default:
        throw new ForbiddenException('Unsupported role');
    }
  }

  private async saveProfile(role: UserRole, profile: UserProfile): Promise<UserProfile> {
    switch (role) {
      case UserRole.ADMIN:
        return this.adminProfileRepository.save(profile as AdminProfile);
      case UserRole.ASSOCIATE:
        return this.associateProfileRepository.save(profile as AssociateProfile);
      case UserRole.CUSTOMER:
        return this.customerProfileRepository.save(profile as CustomerProfile);
      default:
        throw new ForbiddenException('Unsupported role');
    }
  }

  private toUserView(user: User, profile?: UserProfile): UserView {
    if (!profile) {
      throw new NotFoundException('User profile not found');
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
      lastActive:
        profile instanceof AssociateProfile ? profile.lastActive : undefined,
      taskAssigned:
        profile instanceof AssociateProfile ? profile.taskAssigned : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private splitName(name: string): { firstName: string; lastName: string } {
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

  private generateTemporaryPassword(): string {
    return `${randomBytes(6).toString('hex')}A1!`;
  }
}
