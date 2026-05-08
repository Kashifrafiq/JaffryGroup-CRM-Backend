import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskStatus } from './entities/task.enums';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
type JwtActor = {
    id: string;
    role: UserRole;
};
export declare class TasksService {
    private readonly taskRepository;
    private readonly associateRepository;
    constructor(taskRepository: Repository<Task>, associateRepository: Repository<AssociateProfile>);
    create(createTaskDto: CreateTaskDto): Promise<Task>;
    findAll(): Promise<Task[]>;
    findAssignableAssociates(): Promise<{
        id: string;
        name: string;
    }[]>;
    findOne(id: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task>;
    updateStatusByActor(id: string, status: TaskStatus, actor: JwtActor): Promise<Task>;
    remove(id: string): Promise<void>;
    private validateDates;
    private ensureAssignee;
    private isUuid;
}
export {};
