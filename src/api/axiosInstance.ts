import axios from 'axios';
import router from '../router';

const api = axios.create({
    baseURL: 'https://localhost:7047/api/',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            if (error.response.status === 403) {
                router.push('/');
            }
        }
        return Promise.reject(error);
    }
);

export default api;