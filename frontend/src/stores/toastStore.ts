import "crypto";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error";
}

type Listener = () => void;

const MAX_TOASTS = 5;
let memoryStore: ToastItem[] = [];
let listeners: Listener[] = [];

export const toast = {
  show(message: string, type: "success" | "error" = "success") {
    const id = crypto.randomUUID();
    const newToast = { id, message, type };

    if (memoryStore.length >= MAX_TOASTS) {
      memoryStore = [...memoryStore.slice(1), newToast];
    } else {
      memoryStore = [...memoryStore, newToast];
    }

    emitChange();
  },

  dismiss(id: string) {
    memoryStore = memoryStore.filter((item) => item.id !== id);
    emitChange();
  },

  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getSnapshot() {
    return memoryStore;
  },
};

function emitChange() {
  listeners.forEach((listener) => listener());
}
