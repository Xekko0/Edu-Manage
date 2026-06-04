import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      patchUser: (partial) => set((state) => ({
        user: state.user ? { ...state.user, ...partial } : null,
      })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'edusmart-auth' },
  ),
);

export default useAuthStore;
