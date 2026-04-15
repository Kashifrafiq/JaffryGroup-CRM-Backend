import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.validateDates(createTaskDto.startDate, createTaskDto.dueDate);
    await this.ensureAssociate(createTaskDto.associateAssignedId);

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      information: createTaskDto.information,
      startDate: new Date(createTaskDto.startDate),
      dueDate: new Date(createTaskDto.dueDate),
      associateAssignedId: createTaskDto.associateAssignedId,
    });

    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ['associateAssigned', 'associateAssigned.associateProfile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['associateAssigned', 'associateAssigned.associateProfile'],
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (updateTaskDto.startDate || updateTaskDto.dueDate) {
      const start = updateTaskDto.startDate ?? task.startDate.toISOString();
      const due = updateTaskDto.dueDate ?? task.dueDate.toISOString();
      this.validateDates(start, due);
    }

    if (updateTaskDto.associateAssignedId) {
      await this.ensureAssociate(updateTaskDto.associateAssignedId);
      task.associateAssignedId = updateTaskDto.associateAssignedId;
    }

    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.information !== undefined) task.information = updateTaskDto.information;
    if (updateTaskDto.startDate !== undefined) task.startDate = new Date(updateTaskDto.startDate);
    if (updateTaskDto.dueDate !== undefined) task.dueDate = new Date(updateTaskDto.dueDate);

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  private validateDates(startDate: string, dueDate: string): void {
    const start = new Date(startDate);
    const due = new Date(dueDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime())) {
      throw new BadRequestException('Invalid startDate or dueDate');
    }
    if (due < start) {
      throw new BadRequestException('dueDate must be after or equal to startDate');
    }
  }

  private async ensureAssociate(associateId: string): Promise<void> {
    const associate = await this.userRepository.findOne({
      where: { id: associateId, role: UserRole.ASSOCIATE },
    });
    if (!associate) {
      throw new NotFoundException('Associate not found');
    }
  }
}
