import api from './axiosInstance';
import type { Product } from '../types';

export const productService = {
    
    getAll() {
        return api.get<Product[]>('products');
    },
    
    getById(id: number) {
        return api.get<Product>(`products/${id}`);
    },
    
    create(data: Partial<Product>) {
        return api.post<Product>('products', data);
    },
    
    update(id: number, data: Partial<Product>) {
        return api.put<Product>(`products/${id}`, data);
    },
    
    delete(id: number) {
        return api.delete(`products/${id}`);
    }
};