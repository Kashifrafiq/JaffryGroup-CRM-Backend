import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import { AssociateCustomer } from './entities/associate-customer.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
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
  property?: string;
  applicationType?: string;
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
    @InjectRepository(AssociateCustomer)
    private readonly associateCustomerRepository: Repository<AssociateCustomer>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<UserView> {
    if (createUserDto.role === UserRole.ASSOCIATE || createUserDto.role === UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Use dedicated endpoints: POST /associates or POST /users/customers',
      );
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

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<CustomerProfile> {
    if (
      createdBy &&
      createdBy.role !== UserRole.ADMIN &&
      createdBy.role !== UserRole.ASSOCIATE
    ) {
      throw new ForbiddenException('Only Admin or Associate can create customers');
    }
    const effectiveRole = createCustomerDto.role ?? UserRole.CUSTOMER;
    if (effectiveRole !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Role must be customer');
    }

    const normalizedEmail = createCustomerDto.email.trim().toLowerCase();
    const existing = await this.customerProfileRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException('Email already in use');

    const phone = createCustomerDto.phone?.trim() ?? '';
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }

    const { firstName, lastName } = this.splitName(createCustomerDto.name);
    return this.customerProfileRepository.save(
      this.customerProfileRepository.create({
        email: normalizedEmail,
        role: UserRole.CUSTOMER,
        firstName,
        lastName,
        phoneNumber: phone,
        property: createCustomerDto.property.trim(),
        applicationType: createCustomerDto.applicationType.trim(),
        address: createCustomerDto.address,
        profilePhoto: createCustomerDto.profilePhoto,
      }),
    );
  }

  async findAll(): Promise<UserView[]> {
    const users = await this.userRepository.find({
      relations: ['adminProfile', 'associateProfile', 'customerProfile'],
    });
    return users.map((user) => this.toUserView(user, this.getProfileFromUser(user)));
  }

  async findAssignedCustomers(associateUserId: string): Promise<UserView[]> {
    const user = await this.userRepository.findOne({ where: { id: associateUserId } });
    if (!user) throw new NotFoundException('Associate not found');
    if (user.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Only associates can access assigned customers');
    }

    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: associateUserId },
    });
    if (!associateProfile) {
      return [];
    }

    const links = await this.associateCustomerRepository.find({
      where: { associateId: associateProfile.id },
    });
    const customerIds = links.map((l) => l.customerId);
    if (!customerIds.length) {
      return [];
    }

    const customers = await this.customerProfileRepository.find({
      where: { id: In(customerIds) },
    });

    return customers.map((c) => this.toStandaloneCustomerView(c));
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

  async assignCustomerToAssociate(customerId: string, associateId: string): Promise<AssociateCustomer> {
    const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
    if (!associate) throw new NotFoundException('Associate not found');

    const customer = await this.customerProfileRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await this.associateCustomerRepository.findOne({
      where: { associateId, customerId },
    });
    if (existing) {
      return existing;
    }

    return this.associateCustomerRepository.save(
      this.associateCustomerRepository.create({ associateId, customerId }),
    );
  }

  async assignCustomerToAssociates(
    customerId: string,
    associateIds: string[],
  ): Promise<{ customerId: string; assignedAssociateIds: string[]; totalAssigned: number }> {
    const customer = await this.customerProfileRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const uniqueAssociateIds = [...new Set(associateIds)];
    const assignedAssociateIds: string[] = [];

    for (const associateId of uniqueAssociateIds) {
      const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
      if (!associate) {
        throw new NotFoundException(`Associate ${associateId} not found`);
      }

      const existing = await this.associateCustomerRepository.findOne({
        where: { associateId, customerId },
      });
      if (!existing) {
        await this.associateCustomerRepository.save(
          this.associateCustomerRepository.create({ associateId, customerId }),
        );
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
    const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
    if (!associate) throw new NotFoundException('Associate not found');

    const uniqueCustomerIds = [...new Set(customerIds)];
    const assignedCustomerIds: string[] = [];

    for (const customerId of uniqueCustomerIds) {
      const customer = await this.customerProfileRepository.findOne({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      const existing = await this.associateCustomerRepository.findOne({
        where: { associateId, customerId },
      });
      if (!existing) {
        await this.associateCustomerRepository.save(
          this.associateCustomerRepository.create({ associateId, customerId }),
        );
      }
      assignedCustomerIds.push(customerId);
    }
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
          this.associateProfileRepository.create({
            ...profileData,
            email: createUserDto.email.trim().toLowerCase(),
            role: UserRole.ASSOCIATE,
          }),
        );
      case UserRole.CUSTOMER:
        return this.customerProfileRepository.save(
          this.customerProfileRepository.create({
            ...profileData,
            email: createUserDto.email.trim().toLowerCase(),
            role: UserRole.CUSTOMER,
          }),
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

  private toStandaloneCustomerView(customer: CustomerProfile): UserView {
    return {
      id: customer.id,
      email: customer.email ?? '',
      role: UserRole.CUSTOMER,
      isActive: true,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      phoneNumber: customer.phoneNumber,
      property: customer.property,
      applicationType: customer.applicationType,
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      profilePhoto: customer.profilePhoto,
      lastActive: undefined,
      taskAssigned: undefined,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
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
      property: profile instanceof CustomerProfile ? profile.property : undefined,
      applicationType:
        profile instanceof CustomerProfile ? profile.applicationType : undefined,
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

}
