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
exports.RouteService = void 0;
const common_1 = require("@nestjs/common");
const route_repository_1 = require("./route.repository");
const response_util_1 = require("../../common/utils/response.util");
let RouteService = class RouteService {
    routeRepo;
    constructor(routeRepo) {
        this.routeRepo = routeRepo;
    }
    create(dto) {
        const route = this.routeRepo.create(dto);
        return (0, response_util_1.successResponse)('Route created successfully', route);
    }
    findAll() {
        return (0, response_util_1.successResponse)('All routes retrieved', this.routeRepo.findAll());
    }
    findById(id) {
        const route = this.routeRepo.findById(id);
        if (!route)
            throw new common_1.NotFoundException(`Route ${id} not found`);
        return (0, response_util_1.successResponse)('Route retrieved', route);
    }
    search(source, destination) {
        const routes = this.routeRepo.findBySourceAndDestination(source, destination);
        return (0, response_util_1.successResponse)(`Routes from ${source} to ${destination}`, routes);
    }
    update(id, dto) {
        const route = this.routeRepo.findById(id);
        if (!route)
            throw new common_1.NotFoundException(`Route ${id} not found`);
        return (0, response_util_1.successResponse)('Route updated', this.routeRepo.update(id, dto));
    }
    remove(id) {
        if (!this.routeRepo.findById(id))
            throw new common_1.NotFoundException(`Route ${id} not found`);
        this.routeRepo.remove(id);
        return (0, response_util_1.successResponse)('Route deleted');
    }
};
exports.RouteService = RouteService;
exports.RouteService = RouteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [route_repository_1.RouteRepository])
], RouteService);
//# sourceMappingURL=route.service.js.map