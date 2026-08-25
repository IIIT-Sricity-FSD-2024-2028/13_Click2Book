"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
const vehicle_type_enum_1 = require("./enums/vehicle-type.enum");
let VehicleRepository = class VehicleRepository {
    vehicles = [
        { vehicleId: 'V001', providerId: 'P001', vehicleNumber: 'APSRTC Garuda Plus', vehicleType: vehicle_type_enum_1.VehicleType.AC, totalSeats: 45, remainingSeats: 38,
            busName: 'APSRTC Garuda Plus', amenities: ['Charging Point', 'AC', 'Reading Light'], boardingPoint: 'Majestic', droppingPoint: 'Kachiguda', rating: 4.2 },
        { vehicleId: 'V002', providerId: 'P001', vehicleNumber: 'APSRTC Rajadhani', vehicleType: vehicle_type_enum_1.VehicleType.AC, totalSeats: 40, remainingSeats: 35,
            busName: 'APSRTC Rajadhani Express', amenities: ['AC', 'Charging Point', 'Water Bottle'], boardingPoint: 'Jubilee Bus Stand', droppingPoint: 'CMBT', rating: 4.0 },
        { vehicleId: 'V003', providerId: 'P002', vehicleNumber: 'Orange Travels Sleeper', vehicleType: vehicle_type_enum_1.VehicleType.SLEEPER, totalSeats: 36, remainingSeats: 30,
            busName: 'Orange Travels AC Sleeper', amenities: ['WiFi', 'Blanket', 'Charging Point', 'Pillow'], boardingPoint: 'Dadar', droppingPoint: 'Shivaji Nagar', rating: 4.5 },
        { vehicleId: 'V004', providerId: 'P002', vehicleNumber: 'VRL Travels Volvo', vehicleType: vehicle_type_enum_1.VehicleType.VOLVO, totalSeats: 41, remainingSeats: 28,
            busName: 'VRL Travels Volvo AC', amenities: ['WiFi', 'AC', 'Charging Point', 'Blanket'], boardingPoint: 'Majestic', droppingPoint: 'Guindy', rating: 4.6 },
        { vehicleId: 'V005', providerId: 'P002', vehicleNumber: 'SRS Travels AC Sleeper', vehicleType: vehicle_type_enum_1.VehicleType.SLEEPER, totalSeats: 40, remainingSeats: 22,
            busName: 'SRS Travels AC Sleeper', amenities: ['AC', 'Blanket', 'Charging Point'], boardingPoint: 'Hebbal', droppingPoint: 'Tambaram', rating: 4.3 },
        { vehicleId: 'V006', providerId: 'P002', vehicleNumber: 'Kaveri Travels Express', vehicleType: vehicle_type_enum_1.VehicleType.AC, totalSeats: 50, remainingSeats: 40,
            busName: 'Kaveri Travels AC Express', amenities: ['AC', 'Charging Point'], boardingPoint: 'Satellite Bus Stand', droppingPoint: 'Koyambedu', rating: 4.1 },
        { vehicleId: 'V007', providerId: 'P002', vehicleNumber: 'RedBus Express AC', vehicleType: vehicle_type_enum_1.VehicleType.AC, totalSeats: 45, remainingSeats: 38,
            busName: 'RedBus Express', amenities: ['WiFi', 'AC', 'Charging Point', 'Water Bottle'], boardingPoint: 'Electronic City', droppingPoint: 'Madurai Bus Stand', rating: 4.4 },
        { vehicleId: 'V008', providerId: 'P002', vehicleNumber: 'Orange Travels Pune', vehicleType: vehicle_type_enum_1.VehicleType.VOLVO, totalSeats: 41, remainingSeats: 35,
            busName: 'Orange Travels Volvo (Mumbai-Pune)', amenities: ['WiFi', 'AC', 'Charging Point', 'Blanket', 'Pillow'], boardingPoint: 'Dadar', droppingPoint: 'Shivaji Nagar', rating: 4.7 },
        { vehicleId: 'V009', providerId: 'P001', vehicleNumber: 'Rajdhani Express 12951', vehicleType: vehicle_type_enum_1.VehicleType.TRAIN, totalSeats: 120, remainingSeats: 85,
            busName: 'Rajdhani Express', amenities: ['AC', 'Meals', 'Bedding', 'Charging Point'], boardingPoint: 'Delhi H.Nizamuddin', droppingPoint: 'Mumbai Central', rating: 4.8 },
        { vehicleId: 'V010', providerId: 'P001', vehicleNumber: 'Shatabdi Express 12001', vehicleType: vehicle_type_enum_1.VehicleType.TRAIN, totalSeats: 100, remainingSeats: 60,
            busName: 'Shatabdi Express', amenities: ['AC Chair Car', 'Meals', 'Charging Point'], boardingPoint: 'Bangalore City', droppingPoint: 'Chennai Central', rating: 4.7 },
        { vehicleId: 'V011', providerId: 'P001', vehicleNumber: 'Vande Bharat 20901', vehicleType: vehicle_type_enum_1.VehicleType.TRAIN, totalSeats: 90, remainingSeats: 72,
            busName: 'Vande Bharat Express', amenities: ['AC', 'Meals', 'WiFi', 'Charging Point', 'Panoramic Windows'], boardingPoint: 'Hyderabad', droppingPoint: 'Vijayawada', rating: 4.9 },
        { vehicleId: 'V012', providerId: 'P001', vehicleNumber: 'Duronto Express 12213', vehicleType: vehicle_type_enum_1.VehicleType.TRAIN, totalSeats: 110, remainingSeats: 90,
            busName: 'Duronto Express', amenities: ['AC', 'Meals', 'Bedding', 'Charging Point'], boardingPoint: 'Delhi', droppingPoint: 'Jaipur', rating: 4.6 },
    ];
    create(data) {
        const vehicle = { vehicleId: (0, id_util_1.generateId)('V'), ...data, remainingSeats: data.totalSeats };
        this.vehicles.push(vehicle);
        return vehicle;
    }
    findAll() { return this.vehicles; }
    findById(vehicleId) { return this.vehicles.find(v => v.vehicleId === vehicleId); }
    findByProvider(providerId) { return this.vehicles.filter(v => v.providerId === providerId); }
    decrementSeat(vehicleId) {
        const v = this.vehicles.find(v => v.vehicleId === vehicleId);
        if (!v || v.remainingSeats <= 0)
            return false;
        v.remainingSeats--;
        return true;
    }
    incrementSeat(vehicleId) {
        const v = this.vehicles.find(v => v.vehicleId === vehicleId);
        if (v && v.remainingSeats < v.totalSeats)
            v.remainingSeats++;
    }
    update(vehicleId, data) {
        const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
        if (i === -1)
            return undefined;
        this.vehicles[i] = { ...this.vehicles[i], ...data };
        return this.vehicles[i];
    }
    remove(vehicleId) {
        const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
        if (i === -1)
            return false;
        this.vehicles.splice(i, 1);
        return true;
    }
};
exports.VehicleRepository = VehicleRepository;
exports.VehicleRepository = VehicleRepository = __decorate([
    (0, common_1.Injectable)()
], VehicleRepository);
//# sourceMappingURL=vehicle.repository.js.map