import { create } from "zustand";

interface AuthState {
  csrfToken: string;
  isAuthenticated: boolean;
  setCSRFToken: (token: string) => void;
  setAuthenticated: (status: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  csrfToken: "",
  isAuthenticated: false,

  setCSRFToken: (token) => set({ csrfToken: token }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  clearAuth: () => set({ csrfToken: "", isAuthenticated: false }),
}));
