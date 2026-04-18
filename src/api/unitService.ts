import api from './axiosInstance';
import type { Unit } from '../types';

export const unitService = {
    getAll() {
        return api.get<Unit[]>('Units');
    }
};