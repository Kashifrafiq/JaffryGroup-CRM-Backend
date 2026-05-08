"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reminders_controller_1 = require("./reminders.controller");
const reminders_service_1 = require("./reminders.service");
const customer_reminder_entity_1 = require("./entities/customer-reminder.entity");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const associate_customer_entity_1 = require("../users/entities/associate-customer.entity");
let RemindersModule = class RemindersModule {
};
exports.RemindersModule = RemindersModule;
exports.RemindersModule = RemindersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                customer_reminder_entity_1.CustomerReminder,
                customer_profile_entity_1.CustomerProfile,
                associate_profile_entity_1.AssociateProfile,
                associate_customer_entity_1.AssociateCustomer,
            ]),
        ],
        controllers: [reminders_controller_1.RemindersController],
        providers: [reminders_service_1.RemindersService],
    })
], RemindersModule);
//# sourceMappingURL=reminders.module.js.map