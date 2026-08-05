import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserSettingsState {
  theme: "light" | "dark";
  language: "ru" | "en";
  notificationsEnabled: boolean;
  anonymousEnabled: boolean;
  sidebarDropdownVisible: boolean;

  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: "ru" | "en") => void;
  setSidebarDropdownVisible: (visible: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAnonymousEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      language: "ru",
      notificationsEnabled: false,
      anonymousEnabled: false,
      sidebarDropdownVisible: false,

      setTheme: (theme: "light" | "dark") => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarDropdownVisible: (sidebarDropdownVisible) =>
        set({ sidebarDropdownVisible }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setAnonymousEnabled: (anonymousEnabled) => set({ anonymousEnabled }),
    }),
    {
      name: "app-settings",
    },
  ),
);
