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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const route_service_1 = require("./route.service");
const route_dto_1 = require("./dto/route.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let RouteController = class RouteController {
    routeService;
    constructor(routeService) {
        this.routeService = routeService;
    }
    create(dto) { return this.routeService.create(dto); }
    findAll(source, destination) {
        if (source && destination)
            return this.routeService.search(source, destination);
        return this.routeService.findAll();
    }
    findOne(id) { return this.routeService.findById(id); }
    update(id, dto) {
        return this.routeService.update(id, dto);
    }
    remove(id) { return this.routeService.remove(id); }
};
exports.RouteController = RouteController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new route (Provider/Admin)' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [route_dto_1.CreateRouteDto]),
    __metadata("design:returntype", void 0)
], RouteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all routes' }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: false, example: 'Hyderabad' }),
    (0, swagger_1.ApiQuery)({ name: 'destination', required: false, example: 'Chennai' }),
    __param(0, (0, common_1.Query)('source')),
    __param(1, (0, common_1.Query)('destination')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RouteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get route by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'R001' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RouteController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.PROVIDER, role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update route (Provider/Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'R001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'PROVIDER' } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, route_dto_1.CreateRouteDto]),
    __metadata("design:returntype", void 0)
], RouteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete route (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 'R001' }),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, schema: { example: 'ADMIN' } }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RouteController.prototype, "remove", null);
exports.RouteController = RouteController = __decorate([
    (0, swagger_1.ApiTags)('Routes'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('routes'),
    __metadata("design:paramtypes", [route_service_1.RouteService])
], RouteController);
//# sourceMappingURL=route.controller.js.map