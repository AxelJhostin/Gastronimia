import { apiFetch } from './http';

export interface UserMe {
  id: string;
  email: string;
  roles: ('ADMIN' | 'MANAGER' | 'TEACHER')[];
}

export const authApi = {
  getMe: async (): Promise<UserMe> => {
    return apiFetch<UserMe>('/auth/me');
  },
};