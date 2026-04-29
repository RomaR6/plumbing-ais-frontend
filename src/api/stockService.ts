import api from './axiosInstance';
import type { Stock, Location, Warehouse, TransactionGroupRequest } from '../types';

export const stockService = {
    getAllStocks: () => api.get<Stock[]>('Stocks'),
    
    createTransaction: (data: TransactionGroupRequest) => 
        api.post('Stocks/transaction', data),

    moveStock: (productId: number, fromLocationId: number, toLocationId: number, quantity: number, description?: string) =>
        api.post('Stocks/move', { 
            productId, 
            fromLocationId, 
            toLocationId, 
            quantity,
            description
        }),

    getLocations: () => api.get<Location[]>('Locations'),
    createLocation: (location: Partial<Location>) => api.post<Location>('Locations', location),
    deleteLocation: (id: number) => api.delete(`Locations/${id}`),
    getWarehouses: () => api.get<Warehouse[]>('Warehouses'),
    updateStockManual: (id: number, stock: Stock) => api.put(`Stocks/${id}`, stock)
};