import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserSettingsState {
  theme: "light" | "dark";
  language: "ru" | "en";
  notificationsEnabled: boolean;
  anonymousEnabled: boolean;
  sidebarDropdownVisible: boolean;

  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
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
      anonymousEnabled: true,
      sidebarDropdownVisible: false,

      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", nextTheme);
          return { theme: nextTheme };
        }),
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
