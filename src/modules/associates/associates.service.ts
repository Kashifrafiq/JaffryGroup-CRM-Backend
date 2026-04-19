import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { AssociateProfile, AssociateStatus } from '../users/entities/associate-profile.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@Injectable()
export class AssociatesService {
  constructor(
    @InjectRepository(AssociateProfile)
    private readonly associateRepository: Repository<AssociateProfile>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async createAssociate(
    createAssociateDto: CreateAssociateDto,
    createdBy?: Pick<User, 'id' | 'role'>,
  ): Promise<AssociateProfile> {
    if (createdBy && createdBy.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can create associates');
    }

    const normalizedEmail = createAssociateDto.email.trim().toLowerCase();
    const existing = await this.associateRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const fallbackName = normalizedEmail.split('@')[0] || 'Associate User';
    const { firstName, lastName } = this.splitName(createAssociateDto.name ?? fallbackName);
    return this.associateRepository.save(
      this.associateRepository.create({
        email: normalizedEmail,
        role: createAssociateDto.role.trim(),
        department: createAssociateDto.department,
        status: createAssociateDto.status ?? AssociateStatus.ACTIVE,
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
  }

  async findAll(): Promise<AssociateProfile[]> {
    return this.associateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AssociateProfile> {
    const associate = await this.associateRepository.findOne({ where: { id } });
    if (!associate) {
      throw new NotFoundException(`Associate #${id} not found`);
    }
    return associate;
  }

  async update(id: string, dto: UpdateAssociateDto): Promise<AssociateProfile> {
    const associate = await this.findOne(id);

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.associateRepository.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
      associate.email = normalizedEmail;
    }

    if (dto.name !== undefined) {
      const { firstName, lastName } = this.splitName(dto.name);
      associate.firstName = firstName;
      associate.lastName = lastName;
    }

    if (dto.role !== undefined) {
      associate.role = dto.role.trim();
    }
    if (dto.department !== undefined) {
      associate.department = dto.department;
    }
    if (dto.status !== undefined) {
      associate.status = dto.status;
    }
    if (dto.lastActive !== undefined) {
      associate.lastActive = dto.lastActive ? new Date(dto.lastActive) : undefined;
    }
    if (dto.taskAssigned !== undefined) {
      associate.taskAssigned = dto.taskAssigned;
    }
    if (dto.phoneNumber !== undefined) {
      associate.phoneNumber = dto.phoneNumber;
    }
    if (dto.address !== undefined) {
      associate.address = dto.address;
    }
    if (dto.profilePhoto !== undefined) {
      associate.profilePhoto = dto.profilePhoto;
    }

    return this.associateRepository.save(associate);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const assignedTasks = await this.taskRepository.count({
      where: { assignedTo: { id } },
    });
    if (assignedTasks > 0) {
      throw new ConflictException(
        'Cannot delete associate while tasks are assigned to them; reassign or remove those tasks first.',
      );
    }
    await this.associateRepository.delete(id);
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
