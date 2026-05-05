import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
export declare class ScheduleController {
    private readonly scheduleService;
    constructor(scheduleService: ScheduleService);
    create(dto: CreateScheduleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    findAll(providerId?: string, date?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    update(id: string, dto: UpdateScheduleDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/schedule.interface").Schedule>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
