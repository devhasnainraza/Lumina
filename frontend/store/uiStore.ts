import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
}

interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'alert' | 'custom' | null;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebar: SidebarState;
  modal: ModalState;
  toasts: Toast[];
  theme: 'dark';
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebar: {
    isOpen: true,
    isMobile: false,
  },
  modal: {
    isOpen: false,
    type: null,
  },
  toasts: [],
  theme: 'dark',

  setSidebarOpen: (isOpen) =>
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen },
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
    })),

  openModal: (modal) =>
    set({
      modal: { ...modal, isOpen: true },
    }),

  closeModal: () =>
    set({
      modal: { isOpen: false, type: null },
    }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Math.random().toString(36) }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
