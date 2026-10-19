import { createToaster } from '@skeletonlabs/skeleton-svelte';

export interface ToastOptions {
  /** A toast with the same id replaces the visible one. */
  id?: string;
  title?: string;
  description?: string;
  /** Milliseconds before the toast hides itself. */
  duration?: number;
  closable?: boolean;
}

export interface Toasts {
  success(options: ToastOptions): void;
  error(options: ToastOptions): void;
}

// Skeleton's toast store. Only Toaster.svelte renders it; everything else goes through `toaster`.
export const toastStore = createToaster({ placement: 'top' });

export const toaster: Toasts = toastStore;

export function isToastShowing(id: string): boolean {
  return toastStore.getVisibleToasts().find((toast) => toast.id === id) !== undefined;
}
