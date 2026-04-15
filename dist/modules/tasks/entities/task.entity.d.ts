import { User } from '../../users/entities/user.entity';
export declare class Task {
    id: string;
    title: string;
    information?: string;
    startDate: Date;
    dueDate: Date;
    associateAssignedId: string;
    associateAssigned: User;
    createdAt: Date;
    updatedAt: Date;
}
