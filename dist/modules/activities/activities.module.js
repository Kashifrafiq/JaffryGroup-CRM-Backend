"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activities_controller_1 = require("./activities.controller");
const activities_service_1 = require("./activities.service");
const customer_activity_entity_1 = require("./entities/customer-activity.entity");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customers_module_1 = require("../customers/customers.module");
let ActivitiesModule = class ActivitiesModule {
};
exports.ActivitiesModule = ActivitiesModule;
exports.ActivitiesModule = ActivitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            customers_module_1.CustomersModule,
            typeorm_1.TypeOrmModule.forFeature([customer_activity_entity_1.CustomerActivity, customer_profile_entity_1.CustomerProfile, associate_profile_entity_1.AssociateProfile]),
        ],
        controllers: [activities_controller_1.ActivitiesController],
        providers: [activities_service_1.ActivitiesService],
    })
], ActivitiesModule);
//# sourceMappingURL=activities.module.js.map