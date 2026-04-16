import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskPriority, TaskStatus } from './entities/task.enums';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssociateProfile } from '../users/entities/associate-profile.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(AssociateProfile)
    private readonly associateRepository: Repository<AssociateProfile>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.validateDates(createTaskDto.startDate, createTaskDto.endDate);
    const assigneeId = createTaskDto.assignedTo?.trim();
    if (assigneeId) {
      await this.ensureAssignee(assigneeId);
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description ?? null,
      startDate: new Date(createTaskDto.startDate),
      endDate: new Date(createTaskDto.endDate),
      priority: createTaskDto.priority ?? TaskPriority.MEDIUM,
      status: createTaskDto.status ?? TaskStatus.TODO,
      assignedTo: assigneeId ? ({ id: assigneeId } as AssociateProfile) : null,
    });

    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (updateTaskDto.startDate || updateTaskDto.endDate) {
      const start = updateTaskDto.startDate ?? task.startDate.toISOString();
      const end = updateTaskDto.endDate ?? task.endDate.toISOString();
      this.validateDates(start, end);
    }

    if (updateTaskDto.assignedTo !== undefined) {
      const raw = updateTaskDto.assignedTo;
      if (raw === null || (typeof raw === 'string' && !raw.trim())) {
        task.assignedTo = null;
      } else {
        const aid = String(raw).trim();
        await this.ensureAssignee(aid);
        task.assignedTo = { id: aid } as AssociateProfile;
      }
    }

    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.priority !== undefined) task.priority = updateTaskDto.priority;
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;
    if (updateTaskDto.startDate !== undefined) task.startDate = new Date(updateTaskDto.startDate);
    if (updateTaskDto.endDate !== undefined) task.endDate = new Date(updateTaskDto.endDate);

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  private validateDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    if (end < start) {
      throw new BadRequestException('endDate must be after or equal to startDate');
    }
  }

  private async ensureAssignee(assigneeId: string): Promise<void> {
    const id = assigneeId?.trim() ?? '';
    if (!this.isUuid(id)) {
      throw new BadRequestException(
        'assignedTo must be a valid UUID (use the id from POST /associates response).',
      );
    }
    const associate = await this.associateRepository.findOne({ where: { id } });
    if (!associate) {
      throw new NotFoundException('Assignee associate not found');
    }
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}
