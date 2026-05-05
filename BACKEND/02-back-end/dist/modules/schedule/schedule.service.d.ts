import { ScheduleRepository } from './schedule.repository';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
export declare class ScheduleService {
    private readonly scheduleRepo;
    constructor(scheduleRepo: ScheduleRepository);
    create(dto: CreateScheduleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    findAll(providerId?: string, date?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    update(id: string, dto: UpdateScheduleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
