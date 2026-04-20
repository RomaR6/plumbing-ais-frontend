import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null as string | null,
    role: null as string | null
  }),
  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
      this.decodeAndSetData(token);
    },
    init() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        this.decodeAndSetData(token);
      }
    },
    decodeAndSetData(token: string) {
      try {
        const decoded: any = jwtDecode(token);
        
        this.user = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 
                    decoded.unique_name || 
                    decoded.name;
                    
        this.role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
                    decoded.role;
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