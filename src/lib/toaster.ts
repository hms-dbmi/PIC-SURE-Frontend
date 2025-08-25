import { createToaster } from '@skeletonlabs/skeleton-svelte';

export const toaster = createToaster({ placement: 'top' });

export function isToastShowing(id: string): boolean {
  return toaster.getVisibleToasts().find((toast) => toast.id === id) !== undefined;
}
