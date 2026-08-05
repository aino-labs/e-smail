import { create } from "zustand";
import { persist } from "zustand/middleware";
import { URLMINIO } from "../api/config";

interface UserState {
  name: string;
  surname: string;
  email: string;
  is_male: boolean;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  image_path: string;
  updatedAt: number | null;
  anonymousEnabled: boolean;
  isProfileLoaded: boolean;

  setProfileData: (profileData: Partial<UserState>) => void;
  setImagePath: (path: string) => void;
  setAnonymousEnabled: (enabled: boolean) => void;
  clearProfile: () => void;
  getAvatarUrl: () => string;
}

const initialState = {
  name: "",
  surname: "",
  email: "",
  is_male: true,
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  image_path: "",
  updatedAt: null as number | null,
  anonymousEnabled: true,
  isProfileLoaded: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProfileData: (profileData) =>
        set((state) => ({ ...state, ...profileData, isProfileLoaded: true })),
      setImagePath: (path) => set({ image_path: path }),
      setAnonymousEnabled: (enabled) => set({ anonymousEnabled: enabled }),
      clearProfile: () => set({ ...initialState }),
      getAvatarUrl: () => {
        const { image_path, updatedAt } = get();

        if (image_path) {
          // Return full external or data URLs as-is
          if (/^(https?:|data:|\/\/)/i.test(image_path)) {
            return image_path;
          }

          // Clean slash collisions between domain and path
          const cleanBase = (URLMINIO || "").replace(/\/$/, "");
          const cleanPath = image_path.replace(/^\//, "");
          const baseUrl = `${cleanBase}/${cleanPath}`;

          // Append timestamp parameter only if available
          return updatedAt ? `${baseUrl}?t=${updatedAt}` : baseUrl;
        }

        return "/assets/svg/Avatar.svg";
      },
    }),
    {
      name: "user-profile",
      partialize: (state) => {
        const { getAvatarUrl, ...persistedState } = state;
        return persistedState;
      },
    },
  ),
);
