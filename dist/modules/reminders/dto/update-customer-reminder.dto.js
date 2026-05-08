"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomerReminderDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_customer_reminder_dto_1 = require("./create-customer-reminder.dto");
class UpdateCustomerReminderDto extends (0, mapped_types_1.PartialType)(create_customer_reminder_dto_1.CreateCustomerReminderDto) {
}
exports.UpdateCustomerReminderDto = UpdateCustomerReminderDto;
//# sourceMappingURL=update-customer-reminder.dto.js.map