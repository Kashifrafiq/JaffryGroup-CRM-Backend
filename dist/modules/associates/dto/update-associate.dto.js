"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssociateDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_associate_dto_1 = require("./create-associate.dto");
class UpdateAssociateDto extends (0, mapped_types_1.PartialType)(create_associate_dto_1.CreateAssociateDto) {
}
exports.UpdateAssociateDto = UpdateAssociateDto;
//# sourceMappingURL=update-associate.dto.js.map