import { Injectable } from '@nestjs/common';
import { Route } from './interfaces/route.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class RouteRepository {
  private routes: Route[] = [
    { routeId: 'R001', source: 'Hyderabad',  destination: 'Chennai',   distance: 625 },
    { routeId: 'R002', source: 'Bangalore',  destination: 'Mumbai',    distance: 980 },
    { routeId: 'R003', source: 'Delhi',      destination: 'Jaipur',    distance: 270 },
    { routeId: 'R004', source: 'Hyderabad',  destination: 'Bangalore', distance: 560 },
    { routeId: 'R005', source: 'Chennai',    destination: 'Coimbatore',distance: 500 },
    { routeId: 'R006', source: 'Mumbai',     destination: 'Pune',      distance: 150 },
    { routeId: 'R007', source: 'Vijayawada', destination: 'Tirupati',  distance: 340 },
    { routeId: 'R008', source: 'Bangalore',  destination: 'Mysore',    distance: 140 },
    { routeId: 'R009', source: 'Delhi',      destination: 'Agra',      distance: 200 },
    { routeId: 'R010', source: 'Hyderabad',  destination: 'Vijayawada',distance: 270 },
  ];

  create(data: Omit<Route, 'routeId'>): Route {
    const route: Route = { routeId: generateId('R'), ...data };
    this.routes.push(route);
    return route;
  }

  findAll(): Route[] { return this.routes; }

  findById(routeId: string): Route | undefined {
    return this.routes.find((r) => r.routeId === routeId);
  }

  findBySourceAndDestination(source: string, destination: string): Route[] {
    return this.routes.filter(
      (r) =>
        r.source.toLowerCase() === source.toLowerCase() &&
        r.destination.toLowerCase() === destination.toLowerCase(),
    );
  }

  update(routeId: string, data: Partial<Route>): Route | undefined {
    const i = this.routes.findIndex((r) => r.routeId === routeId);
    if (i === -1) return undefined;
    this.routes[i] = { ...this.routes[i], ...data };
    return this.routes[i];
  }

  remove(routeId: string): boolean {
    const i = this.routes.findIndex((r) => r.routeId === routeId);
    if (i === -1) return false;
    this.routes.splice(i, 1);
    return true;
  }
}
