"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRepository = void 0;
const common_1 = require("@nestjs/common");
const id_util_1 = require("../../common/utils/id.util");
let RouteRepository = class RouteRepository {
    routes = [
        { routeId: 'R001', source: 'Hyderabad', destination: 'Chennai', distance: 625 },
        { routeId: 'R002', source: 'Bangalore', destination: 'Mumbai', distance: 980 },
        { routeId: 'R003', source: 'Delhi', destination: 'Jaipur', distance: 270 },
        { routeId: 'R004', source: 'Hyderabad', destination: 'Bangalore', distance: 560 },
        { routeId: 'R005', source: 'Chennai', destination: 'Coimbatore', distance: 500 },
        { routeId: 'R006', source: 'Mumbai', destination: 'Pune', distance: 150 },
        { routeId: 'R007', source: 'Vijayawada', destination: 'Tirupati', distance: 340 },
        { routeId: 'R008', source: 'Bangalore', destination: 'Mysore', distance: 140 },
        { routeId: 'R009', source: 'Delhi', destination: 'Agra', distance: 200 },
        { routeId: 'R010', source: 'Hyderabad', destination: 'Vijayawada', distance: 270 },
    ];
    create(data) {
        const route = { routeId: (0, id_util_1.generateId)('R'), ...data };
        this.routes.push(route);
        return route;
    }
    findAll() { return this.routes; }
    findById(routeId) {
        return this.routes.find((r) => r.routeId === routeId);
    }
    findBySourceAndDestination(source, destination) {
        return this.routes.filter((r) => r.source.toLowerCase() === source.toLowerCase() &&
            r.destination.toLowerCase() === destination.toLowerCase());
    }
    update(routeId, data) {
        const i = this.routes.findIndex((r) => r.routeId === routeId);
        if (i === -1)
            return undefined;
        this.routes[i] = { ...this.routes[i], ...data };
        return this.routes[i];
    }
    remove(routeId) {
        const i = this.routes.findIndex((r) => r.routeId === routeId);
        if (i === -1)
            return false;
        this.routes.splice(i, 1);
        return true;
    }
};
exports.RouteRepository = RouteRepository;
exports.RouteRepository = RouteRepository = __decorate([
    (0, common_1.Injectable)()
], RouteRepository);
//# sourceMappingURL=route.repository.js.map