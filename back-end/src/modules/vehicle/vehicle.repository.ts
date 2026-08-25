import { Injectable } from '@nestjs/common';
import { Vehicle } from './interfaces/vehicle.interface';
import { generateId } from '../../common/utils/id.util';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class VehicleRepository {
  private vehicles: Vehicle[] = [
    // APSRTC Provider (P001)
    { vehicleId: 'V001', providerId: 'P001', vehicleNumber: 'APSRTC Garuda Plus',      vehicleType: VehicleType.AC,     totalSeats: 45, remainingSeats: 38,
      busName: 'APSRTC Garuda Plus', amenities: ['Charging Point', 'AC', 'Reading Light'], boardingPoint: 'Majestic', droppingPoint: 'Kachiguda', rating: 4.2 } as any,
    { vehicleId: 'V002', providerId: 'P001', vehicleNumber: 'APSRTC Rajadhani',        vehicleType: VehicleType.AC,     totalSeats: 40, remainingSeats: 35,
      busName: 'APSRTC Rajadhani Express', amenities: ['AC', 'Charging Point', 'Water Bottle'], boardingPoint: 'Jubilee Bus Stand', droppingPoint: 'CMBT', rating: 4.0 } as any,
    // Private Operators (P002)
    { vehicleId: 'V003', providerId: 'P002', vehicleNumber: 'Orange Travels Sleeper',  vehicleType: VehicleType.SLEEPER,totalSeats: 36, remainingSeats: 30,
      busName: 'Orange Travels AC Sleeper', amenities: ['WiFi', 'Blanket', 'Charging Point', 'Pillow'], boardingPoint: 'Dadar', droppingPoint: 'Shivaji Nagar', rating: 4.5 } as any,
    { vehicleId: 'V004', providerId: 'P002', vehicleNumber: 'VRL Travels Volvo',       vehicleType: VehicleType.VOLVO,  totalSeats: 41, remainingSeats: 28,
      busName: 'VRL Travels Volvo AC', amenities: ['WiFi', 'AC', 'Charging Point', 'Blanket'], boardingPoint: 'Majestic', droppingPoint: 'Guindy', rating: 4.6 } as any,
    { vehicleId: 'V005', providerId: 'P002', vehicleNumber: 'SRS Travels AC Sleeper',  vehicleType: VehicleType.SLEEPER,totalSeats: 40, remainingSeats: 22,
      busName: 'SRS Travels AC Sleeper', amenities: ['AC', 'Blanket', 'Charging Point'], boardingPoint: 'Hebbal', droppingPoint: 'Tambaram', rating: 4.3 } as any,
    { vehicleId: 'V006', providerId: 'P002', vehicleNumber: 'Kaveri Travels Express',  vehicleType: VehicleType.AC,     totalSeats: 50, remainingSeats: 40,
      busName: 'Kaveri Travels AC Express', amenities: ['AC', 'Charging Point'], boardingPoint: 'Satellite Bus Stand', droppingPoint: 'Koyambedu', rating: 4.1 } as any,
    { vehicleId: 'V007', providerId: 'P002', vehicleNumber: 'RedBus Express AC',       vehicleType: VehicleType.AC,     totalSeats: 45, remainingSeats: 38,
      busName: 'RedBus Express', amenities: ['WiFi', 'AC', 'Charging Point', 'Water Bottle'], boardingPoint: 'Electronic City', droppingPoint: 'Madurai Bus Stand', rating: 4.4 } as any,
    { vehicleId: 'V008', providerId: 'P002', vehicleNumber: 'Orange Travels Pune',     vehicleType: VehicleType.VOLVO,  totalSeats: 41, remainingSeats: 35,
      busName: 'Orange Travels Volvo (Mumbai-Pune)', amenities: ['WiFi', 'AC', 'Charging Point', 'Blanket', 'Pillow'], boardingPoint: 'Dadar', droppingPoint: 'Shivaji Nagar', rating: 4.7 } as any,
    // Trains (P001)
    { vehicleId: 'V009', providerId: 'P001', vehicleNumber: 'Rajdhani Express 12951',  vehicleType: VehicleType.TRAIN,  totalSeats: 120, remainingSeats: 85,
      busName: 'Rajdhani Express', amenities: ['AC', 'Meals', 'Bedding', 'Charging Point'], boardingPoint: 'Delhi H.Nizamuddin', droppingPoint: 'Mumbai Central', rating: 4.8 } as any,
    { vehicleId: 'V010', providerId: 'P001', vehicleNumber: 'Shatabdi Express 12001',  vehicleType: VehicleType.TRAIN,  totalSeats: 100, remainingSeats: 60,
      busName: 'Shatabdi Express', amenities: ['AC Chair Car', 'Meals', 'Charging Point'], boardingPoint: 'Bangalore City', droppingPoint: 'Chennai Central', rating: 4.7 } as any,
    { vehicleId: 'V011', providerId: 'P001', vehicleNumber: 'Vande Bharat 20901',      vehicleType: VehicleType.TRAIN,  totalSeats: 90,  remainingSeats: 72,
      busName: 'Vande Bharat Express', amenities: ['AC', 'Meals', 'WiFi', 'Charging Point', 'Panoramic Windows'], boardingPoint: 'Hyderabad', droppingPoint: 'Vijayawada', rating: 4.9 } as any,
    { vehicleId: 'V012', providerId: 'P001', vehicleNumber: 'Duronto Express 12213',   vehicleType: VehicleType.TRAIN,  totalSeats: 110, remainingSeats: 90,
      busName: 'Duronto Express', amenities: ['AC', 'Meals', 'Bedding', 'Charging Point'], boardingPoint: 'Delhi', droppingPoint: 'Jaipur', rating: 4.6 } as any,
  ];

  create(data: Omit<Vehicle, 'vehicleId' | 'remainingSeats'>): Vehicle {
    const vehicle: Vehicle = { vehicleId: generateId('V'), ...data, remainingSeats: data.totalSeats };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  findAll(): Vehicle[] { return this.vehicles; }
  findById(vehicleId: string): Vehicle | undefined { return this.vehicles.find(v => v.vehicleId === vehicleId); }
  findByProvider(providerId: string): Vehicle[] { return this.vehicles.filter(v => v.providerId === providerId); }

  decrementSeat(vehicleId: string): boolean {
    const v = this.vehicles.find(v => v.vehicleId === vehicleId);
    if (!v || v.remainingSeats <= 0) return false;
    v.remainingSeats--;
    return true;
  }

  incrementSeat(vehicleId: string): void {
    const v = this.vehicles.find(v => v.vehicleId === vehicleId);
    if (v && v.remainingSeats < v.totalSeats) v.remainingSeats++;
  }

  update(vehicleId: string, data: Partial<Vehicle>): Vehicle | undefined {
    const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
    if (i === -1) return undefined;
    this.vehicles[i] = { ...this.vehicles[i], ...data };
    return this.vehicles[i];
  }

  remove(vehicleId: string): boolean {
    const i = this.vehicles.findIndex(v => v.vehicleId === vehicleId);
    if (i === -1) return false;
    this.vehicles.splice(i, 1);
    return true;
  }
}
