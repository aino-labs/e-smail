import { create } from "zustand";

interface AuthState {
  csrfToken: string;
  isAuthenticated: boolean;
  setCSRFToken: (token: string) => void;
  setAuthenticated: (status: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  csrfToken: "",
  isAuthenticated: false,

  setCSRFToken: (token) => {
    console.log("Previous CSRF state:", get().csrfToken);
    console.log("Setting new CSRF state:", token);
    set({ csrfToken: token });
    console.log("New CSRF state:", get().csrfToken);
  },
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  clearAuth: () => set({ csrfToken: "", isAuthenticated: false }),
}));
