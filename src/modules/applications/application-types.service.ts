import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';

@Injectable()
export class ApplicationTypesService {
  constructor(
    @InjectRepository(ApplicationType)
    private readonly applicationTypeRepository: Repository<ApplicationType>,
  ) {}

  findActive(): Promise<ApplicationType[]> {
    return this.applicationTypeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findActiveById(id: string): Promise<ApplicationType> {
    const row = await this.applicationTypeRepository.findOne({
      where: { id, isActive: true },
    });
    if (!row) {
      throw new NotFoundException('Application type not found or inactive');
    }
    return row;
  }

  async findActiveByCode(code: string): Promise<ApplicationType | null> {
    const normalized = code.trim().toLowerCase();
    return this.applicationTypeRepository.findOne({
      where: { code: normalized, isActive: true },
    });
  }

  async findActiveByNameIgnoreCase(name: string): Promise<ApplicationType | null> {
    return this.applicationTypeRepository
      .createQueryBuilder('t')
      .where('t.isActive = true')
      .andWhere('LOWER(t.name) = LOWER(:n)', { n: name.trim() })
      .getOne();
  }
}
