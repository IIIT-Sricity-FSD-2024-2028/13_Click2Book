import { Route } from './interfaces/route.interface';
export declare class RouteRepository {
    private routes;
    create(data: Omit<Route, 'routeId'>): Route;
    findAll(): Route[];
    findById(routeId: string): Route | undefined;
    findBySourceAndDestination(source: string, destination: string): Route[];
    update(routeId: string, data: Partial<Route>): Route | undefined;
    remove(routeId: string): boolean;
}
