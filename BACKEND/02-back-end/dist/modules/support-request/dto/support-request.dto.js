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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSupportRequestDto = exports.CreateSupportRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const support_status_enum_1 = require("../enums/support-status.enum");
class CreateSupportRequestDto {
    customerId;
    description;
}
exports.CreateSupportRequestDto = CreateSupportRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My booking B001 was confirmed but seat not assigned.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 1000),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "description", void 0);
class UpdateSupportRequestDto {
    supporterId;
    status;
}
exports.UpdateSupportRequestDto = UpdateSupportRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'SUP001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupportRequestDto.prototype, "supporterId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: support_status_enum_1.SupportStatus, example: support_status_enum_1.SupportStatus.RESOLVED }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(support_status_enum_1.SupportStatus),
    __metadata("design:type", String)
], UpdateSupportRequestDto.prototype, "status", void 0);
//# sourceMappingURL=support-request.dto.js.map