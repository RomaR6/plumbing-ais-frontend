import api from './axiosInstance';
import type { Product } from '../types';

export const productService = {
    getAll() {
        return api.get<Product[]>('Products');
    },
    getById(id: number) {
        return api.get<Product>(`Products/${id}`);
    },
    create(data: Partial<Product>) {
        return api.post<Product>('Products', data);
    },
    update(id: number, data: Partial<Product>) {
        return api.put<Product>(`Products/${id}`, data);
    },
    delete(id: number) {
        return api.delete(`Products/${id}`);
    }
};