export interface ToastOptions {
  /** A toast with the id of a visible one updates it instead of adding another. */
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

// The toast store lives in Toaster.svelte so that nothing outside it holds Skeleton's API.
export { toaster, isToastShowing } from '#lib/ui/Toaster.svelte';
