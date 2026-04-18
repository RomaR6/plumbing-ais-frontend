import api from './axiosInstance';
import type { Brand } from '../types';

export const brandService = {
    getAll() {
        return api.get<Brand[]>('Brands');
    }
};