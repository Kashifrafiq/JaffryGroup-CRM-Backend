import { CreateTaskDto } from './create-task.dto';
declare const UpdateTaskDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateTaskDto, "assignedTo">>>;
export declare class UpdateTaskDto extends UpdateTaskDto_base {
    assignedTo?: string | null;
}
export {};
