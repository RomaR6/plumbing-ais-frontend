import api from './axiosInstance';
import type { Stock, Location, Warehouse } from '../types';

export const stockService = {
    getAllStocks: () => api.get<Stock[]>('Stocks'),
    
    createTransaction: (productId: number, locationId: number, quantity: number, type: string, contractorId?: number) => 
        api.post('Stocks/transaction', null, { 
            params: { productId, locationId, quantity, type, contractorId } 
        }),

    moveStock: (productId: number, fromLocationId: number, toLocationId: number, quantity: number) =>
        api.post('Stocks/move', null, { 
            params: { productId, fromLocationId, toLocationId, quantity } 
        }),

    getLocations: () => api.get<Location[]>('Locations'),
    createLocation: (location: Partial<Location>) => api.post<Location>('Locations', location),
    deleteLocation: (id: number) => api.delete(`Locations/${id}`),
    getWarehouses: () => api.get<Warehouse[]>('Warehouses')
};