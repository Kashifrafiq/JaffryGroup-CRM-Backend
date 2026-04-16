import { TaskPriority, TaskStatus } from '../entities/task.enums';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assignedTo?: string;
}
