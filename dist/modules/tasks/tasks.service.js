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
const user_entity_1 = require("../users/entities/user.entity");
let TasksService = class TasksService {
    taskRepository;
    userRepository;
    constructor(taskRepository, userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }
    async create(createTaskDto) {
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
    async findAll() {
        return this.taskRepository.find({
            relations: ['associateAssigned', 'associateAssigned.associateProfile'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['associateAssigned', 'associateAssigned.associateProfile'],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task #${id} not found`);
        }
        return task;
    }
    async update(id, updateTaskDto) {
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
        if (updateTaskDto.title !== undefined)
            task.title = updateTaskDto.title;
        if (updateTaskDto.information !== undefined)
            task.information = updateTaskDto.information;
        if (updateTaskDto.startDate !== undefined)
            task.startDate = new Date(updateTaskDto.startDate);
        if (updateTaskDto.dueDate !== undefined)
            task.dueDate = new Date(updateTaskDto.dueDate);
        return this.taskRepository.save(task);
    }
    async remove(id) {
        const task = await this.findOne(id);
        await this.taskRepository.remove(task);
    }
    validateDates(startDate, dueDate) {
        const start = new Date(startDate);
        const due = new Date(dueDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime())) {
            throw new common_1.BadRequestException('Invalid startDate or dueDate');
        }
        if (due < start) {
            throw new common_1.BadRequestException('dueDate must be after or equal to startDate');
        }
    }
    async ensureAssociate(associateId) {
        const associate = await this.userRepository.findOne({
            where: { id: associateId, role: user_entity_1.UserRole.ASSOCIATE },
        });
        if (!associate) {
            throw new common_1.NotFoundException('Associate not found');
        }
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map