import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  login: (user, token) => set({ user, accessToken: token }),
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    set({ user: null, accessToken: null });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isLoading: false });
    } catch (error) {
      // It will attempt to refresh in the interceptor. If that fails, it logs out.
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
