import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosInstance';

interface UserData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null as UserData | null,
    role: null as string | null
  }),
  actions: {
    async setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
      await this.fetchProfile();
    },
    async init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        try {
          const decoded: any = jwtDecode(token);
          this.role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;
          await this.fetchProfile();
        } catch (e) {
          this.logout();
        }
      }
    },
    async fetchProfile() {
      if (!this.token) return;
      try {
        const res = await api.get('Auth/profile');
        this.user = res.data;
        this.role = res.data.role;
      } catch (e) {
        this.logout();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.role = null;
      localStorage.removeItem('token');
    }
  }
});