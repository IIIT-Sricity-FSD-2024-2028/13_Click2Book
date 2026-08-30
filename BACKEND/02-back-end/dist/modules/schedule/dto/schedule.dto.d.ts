export declare class CreateScheduleDto {
    routeId: string;
    providerId: string;
    departureTime: string;
    arrivalTime: string;
    journeyDate: string;
    arrivalTimeToDestination: string;
    fare: number;
}
export declare class UpdateScheduleDto {
    departureTime?: string;
    fare?: number;
}
