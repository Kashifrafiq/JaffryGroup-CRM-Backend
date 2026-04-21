"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const applications_module_1 = require("../applications/applications.module");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const associate_customer_entity_1 = require("../users/entities/associate-customer.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const customers_controller_1 = require("./customers.controller");
const customer_application_workflow_controller_1 = require("./customer-application-workflow.controller");
const customers_service_1 = require("./customers.service");
const customer_application_workflow_service_1 = require("./customer-application-workflow.service");
let CustomersModule = class CustomersModule {
};
exports.CustomersModule = CustomersModule;
exports.CustomersModule = CustomersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            applications_module_1.ApplicationsModule,
            typeorm_1.TypeOrmModule.forFeature([customer_profile_entity_1.CustomerProfile, customer_application_entity_1.CustomerApplication, associate_customer_entity_1.AssociateCustomer, associate_profile_entity_1.AssociateProfile]),
        ],
        controllers: [customer_application_workflow_controller_1.CustomerApplicationWorkflowController, customers_controller_1.CustomersController],
        providers: [customers_service_1.CustomersService, customer_application_workflow_service_1.CustomerApplicationWorkflowService],
        exports: [customers_service_1.CustomersService],
    })
], CustomersModule);
//# sourceMappingURL=customers.module.js.map