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
exports.UpdateLocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const tracking_status_enum_1 = require("../enums/tracking-status.enum");
class UpdateLocationDto {
    providerId;
    lat;
    lng;
    status;
    nextStop;
}
exports.UpdateLocationDto = UpdateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P001', description: 'Provider updating the location — must own the trip\'s vehicle' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "providerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 17.385 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 78.4867 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: tracking_status_enum_1.TrackingStatus, example: tracking_status_enum_1.TrackingStatus.EN_ROUTE }),
    (0, class_validator_1.IsEnum)(tracking_status_enum_1.TrackingStatus),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Vijayawada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "nextStop", void 0);
//# sourceMappingURL=tracking.dto.js.map