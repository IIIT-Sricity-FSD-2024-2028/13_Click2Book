import { RouteRepository } from './route.repository';
import { CreateRouteDto } from './dto/route.dto';
export declare class RouteService {
    private readonly routeRepo;
    constructor(routeRepo: RouteRepository);
    create(dto: CreateRouteDto): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    findAll(): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route[]>;
    findById(id: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    search(source: string, destination: string): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route[]>;
    update(id: string, dto: Partial<CreateRouteDto>): import("../../common/utils/response.util").ApiResponse<import("./interfaces/route.interface").Route>;
    remove(id: string): import("../../common/utils/response.util").ApiResponse<unknown>;
}
