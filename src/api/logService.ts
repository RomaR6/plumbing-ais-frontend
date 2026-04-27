import api from './axiosInstance';

export const logService = {
    logAction: (action: string, userId: number) => 
        api.post('Logs', { action, userId })
};