import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<User> {
    if (
      createUserDto.role === UserRole.ASSOCIATE &&
      createdBy &&
      createdBy.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only Admin can create Associates');
    }

    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findAssignedCustomers(associateId: string): Promise<User[]> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId },
      relations: ['customers'],
    });
    if (!associate) throw new NotFoundException('Associate not found');
    return associate.customers;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async assignCustomerToAssociate(
    customerId: string,
    associateId: string,
  ): Promise<User> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId, role: UserRole.ASSOCIATE },
      relations: ['customers'],
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

    return associate;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }
}
