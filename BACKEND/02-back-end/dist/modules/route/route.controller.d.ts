import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/route.dto';
export declare class RouteController {
    private readonly routeService;
    constructor(routeService: RouteService);
    create(dto: CreateRouteDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    findAll(source?: string, destination?: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route[]>;
    findOne(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    update(id: string, dto: CreateRouteDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
