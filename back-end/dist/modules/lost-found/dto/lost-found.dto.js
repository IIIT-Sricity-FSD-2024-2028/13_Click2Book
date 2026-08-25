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
exports.UpdateLostFoundStatusDto = exports.CreateLostFoundItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const lost_found_status_enum_1 = require("../enums/lost-found-status.enum");
class CreateLostFoundItemDto {
    tripId;
    bookingId;
    customerId;
    itemDescription;
    category;
    dateLost;
    contactPhone;
}
exports.CreateLostFoundItemDto = CreateLostFoundItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'T001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'B001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Black backpack with a laptop, left near seat 12' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 500),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "itemDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bag' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-01' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "dateLost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLostFoundItemDto.prototype, "contactPhone", void 0);
class UpdateLostFoundStatusDto {
    status;
    foundNote;
}
exports.UpdateLostFoundStatusDto = UpdateLostFoundStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: lost_found_status_enum_1.LostFoundStatus, example: lost_found_status_enum_1.LostFoundStatus.FOUND }),
    (0, class_validator_1.IsEnum)(lost_found_status_enum_1.LostFoundStatus),
    __metadata("design:type", String)
], UpdateLostFoundStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Found under the last row, held at the depot office.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateLostFoundStatusDto.prototype, "foundNote", void 0);
//# sourceMappingURL=lost-found.dto.js.map