import { AssociateProfile } from '../../users/entities/associate-profile.entity';
import { TaskPriority, TaskStatus } from './task.enums';
export declare class Task {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo?: AssociateProfile | null;
    createdAt: Date;
    updatedAt: Date;
}
