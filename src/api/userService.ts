import api from './axiosInstance';

export const userService = {
    getAll() { return api.get('Users'); },
    updateRole(userId: number, newRole: string) { 
        return api.put(`Users/${userId}/role`, { role: newRole }); 
    }
};