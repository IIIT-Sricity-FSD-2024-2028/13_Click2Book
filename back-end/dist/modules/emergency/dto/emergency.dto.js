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
exports.CreateEmergencyAlertDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const emergency_type_enum_1 = require("../enums/emergency-type.enum");
class CreateEmergencyAlertDto {
    bookingId;
    customerId;
    type;
    message;
    lat;
    lng;
}
exports.CreateEmergencyAlertDto = CreateEmergencyAlertDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'B001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmergencyAlertDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmergencyAlertDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: emergency_type_enum_1.EmergencyType, example: emergency_type_enum_1.EmergencyType.SAFETY }),
    (0, class_validator_1.IsEnum)(emergency_type_enum_1.EmergencyType),
    __metadata("design:type", String)
], CreateEmergencyAlertDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Driver is speeding and passengers are worried.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreateEmergencyAlertDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 17.385 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateEmergencyAlertDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 78.4867 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateEmergencyAlertDto.prototype, "lng", void 0);
//# sourceMappingURL=emergency.dto.js.map