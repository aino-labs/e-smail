import { create } from "zustand";

export type ViewType = "inbox" | "sent" | "drafts" | "trash" | string;

interface UIState {
  // State
  currentView: ViewType;
  sidebarDropdownVisible: boolean;
  openSettingsOnProfile: boolean;

  // Actions
  setCurrentView: (view: ViewType) => void;
  setSidebarDropdownVisible: (visible: boolean) => void;
  setOpenSettingsOnProfile: (open: boolean) => void;

  // Optional helpers for quick resets or toggles
  toggleSidebarDropdown: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Default values
  currentView: "inbox",
  sidebarDropdownVisible: false,
  openSettingsOnProfile: false,

  // Setters
  setCurrentView: (view) => set({ currentView: view }),

  setSidebarDropdownVisible: (visible) =>
    set({ sidebarDropdownVisible: visible }),

  setOpenSettingsOnProfile: (open) => set({ openSettingsOnProfile: open }),

  // Toggle convenience method
  toggleSidebarDropdown: () =>
    set((state) => ({ sidebarDropdownVisible: !state.sidebarDropdownVisible })),
}));
