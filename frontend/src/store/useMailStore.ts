import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Email {
  id: number;
  subject: string;
  sender?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export type Folder = {
  id: number;
  name: string;
  emails: Email[];
  createdAt: string;
  order: number;
};

interface MailState {
  folders: Folder[];
  currentFolderId: number | null;
  unreadCount: number;
  emailCache: Record<number, Email>;

  setFolders: (folders: Folder[]) => void;
  setCurrentFolderId: (folderId: number | null) => void;
  setUnreadCount: (unreadCount: number) => void;
  cacheEmails: (emails: Record<number, Email>) => void;
  cacheSingleEmail: (email: Email) => void;
  clearEmailCache: () => void;
}

export const useMailStore = create<MailState>()(
  persist(
    (set) => ({
      folders: [],
      currentFolderId: null,
      unreadCount: 0,
      emailCache: {},

      setFolders: (folders) => set({ folders }),
      setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),

      cacheEmails: (newEmails) =>
        set((state) => ({
          emailCache: { ...state.emailCache, ...newEmails },
        })),

      cacheSingleEmail: (email) =>
        set((state) => ({
          emailCache: { ...state.emailCache, [email.id]: email },
        })),

      clearEmailCache: () => set({ emailCache: {} }),
    }),
    {
      name: "mail-state",
      partialize: (state) => ({
        folders: state.folders,
        currentFolderId: state.currentFolderId,
        unreadCount: state.unreadCount,
      }),
    },
  ),
);
