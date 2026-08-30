import { Provider } from './interfaces/provider.interface';
export declare class ProviderRepository {
    private providers;
    create(data: Omit<Provider, 'providerId' | 'approved'>): Provider;
    findAll(): Provider[];
    findById(providerId: string): Provider | undefined;
    findByEmail(email: string): Provider | undefined;
    update(providerId: string, data: Partial<Provider>): Provider | undefined;
    remove(providerId: string): boolean;
}
