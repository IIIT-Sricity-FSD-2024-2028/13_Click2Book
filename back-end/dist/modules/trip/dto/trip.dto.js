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
exports.UpdateTripStatusDto = exports.CreateTripDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const trip_status_enum_1 = require("../enums/trip-status.enum");
class CreateTripDto {
    scheduleId;
    vehicleId;
}
exports.CreateTripDto = CreateTripDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SCH001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "scheduleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'V001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "vehicleId", void 0);
class UpdateTripStatusDto {
    tripStatus;
}
exports.UpdateTripStatusDto = UpdateTripStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: trip_status_enum_1.TripStatus, example: trip_status_enum_1.TripStatus.IN_PROGRESS }),
    (0, class_validator_1.IsEnum)(trip_status_enum_1.TripStatus),
    __metadata("design:type", String)
], UpdateTripStatusDto.prototype, "tripStatus", void 0);
//# sourceMappingURL=trip.dto.js.map