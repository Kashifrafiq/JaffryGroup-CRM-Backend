import { UserRole } from '../users/entities/user-role.enum';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PatchTaskStatusDto } from './dto/patch-task-status.dto';
type JwtRequestUser = {
    id: string;
    email: string;
    role: UserRole;
};
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto): Promise<import("./entities/task.entity").Task>;
    findAll(): Promise<import("./entities/task.entity").Task[]>;
    listAssignees(): Promise<{
        id: string;
        name: string;
    }[]>;
    findOne(id: string): Promise<import("./entities/task.entity").Task>;
    update(id: string, updateTaskDto: UpdateTaskDto): Promise<import("./entities/task.entity").Task>;
    updateStatus(id: string, dto: PatchTaskStatusDto, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/task.entity").Task>;
    remove(id: string): Promise<void>;
}
export {};
