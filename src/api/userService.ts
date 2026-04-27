import api from './axiosInstance';

export const userService = {
    getAll: () => api.get('Users'),
    updateRole: (userId: number, newRole: string) => 
        api.put(`Users/${userId}/role`, { role: newRole }),
    deleteUser: (id: number) => api.delete(`Users/${id}`)
};