import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssociateProfile, AssociateStatus } from '../users/entities/associate-profile.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateAssociateDto } from './dto/create-associate.dto';

@Injectable()
export class AssociatesService {
  constructor(
    @InjectRepository(AssociateProfile)
    private readonly associateRepository: Repository<AssociateProfile>,
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
