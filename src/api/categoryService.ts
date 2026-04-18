import api from './axiosInstance';
import type { Category } from '../types';

export const categoryService = {
    getAll() {
        return api.get<Category[]>('Categories');
    }
};