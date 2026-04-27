import api from './axiosInstance';
import type { Product } from '../types';

export const productService = {
    getAll: () => api.get<Product[]>('Products'),
    
    getById: (id: number) => api.get<Product>(`Products/${id}`),
    
    create: (data: Partial<Product>) => api.post<Product>('Products', data),
    
    update: (id: number, data: Product) => api.put<Product>(`Products/${id}`, data),
    
    delete: (id: number) => api.delete(`Products/${id}`)
};