"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const task_entity_1 = require("../tasks/entities/task.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const associates_controller_1 = require("./associates.controller");
const associates_service_1 = require("./associates.service");
let AssociatesModule = class AssociatesModule {
};
exports.AssociatesModule = AssociatesModule;
exports.AssociatesModule = AssociatesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([associate_profile_entity_1.AssociateProfile, task_entity_1.Task])],
        controllers: [associates_controller_1.AssociatesController],
        providers: [associates_service_1.AssociatesService],
    })
], AssociatesModule);
//# sourceMappingURL=associates.module.js.map