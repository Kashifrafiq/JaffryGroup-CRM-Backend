"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("./entities/task.entity");
const task_enums_1 = require("./entities/task.enums");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
let TasksService = class TasksService {
    taskRepository;
    associateRepository;
    constructor(taskRepository, associateRepository) {
        this.taskRepository = taskRepository;
        this.associateRepository = associateRepository;
    }
    async create(createTaskDto) {
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
            priority: createTaskDto.priority ?? task_enums_1.TaskPriority.MEDIUM,
            status: createTaskDto.status ?? task_enums_1.TaskStatus.TODO,
            assignedTo: assigneeId ? { id: assigneeId } : null,
        });
        return this.taskRepository.save(task);
    }
    async findAll() {
        return this.taskRepository.find({
            relations: ['assignedTo'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['assignedTo'],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task #${id} not found`);
        }
        return task;
    }
    async update(id, updateTaskDto) {
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
            }
            else {
                const aid = String(raw).trim();
                await this.ensureAssignee(aid);
                task.assignedTo = { id: aid };
            }
        }
        if (updateTaskDto.title !== undefined)
            task.title = updateTaskDto.title;
        if (updateTaskDto.description !== undefined)
            task.description = updateTaskDto.description;
        if (updateTaskDto.priority !== undefined)
            task.priority = updateTaskDto.priority;
        if (updateTaskDto.status !== undefined)
            task.status = updateTaskDto.status;
        if (updateTaskDto.startDate !== undefined)
            task.startDate = new Date(updateTaskDto.startDate);
        if (updateTaskDto.endDate !== undefined)
            task.endDate = new Date(updateTaskDto.endDate);
        return this.taskRepository.save(task);
    }
    async remove(id) {
        const task = await this.findOne(id);
        await this.taskRepository.remove(task);
    }
    validateDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Invalid startDate or endDate');
        }
        if (end < start) {
            throw new common_1.BadRequestException('endDate must be after or equal to startDate');
        }
    }
    async ensureAssignee(assigneeId) {
        const id = assigneeId?.trim() ?? '';
        if (!this.isUuid(id)) {
            throw new common_1.BadRequestException('assignedTo must be a valid UUID (use the id from POST /associates response).');
        }
        const associate = await this.associateRepository.findOne({ where: { id } });
        if (!associate) {
            throw new common_1.NotFoundException('Assignee associate not found');
        }
    }
    isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map