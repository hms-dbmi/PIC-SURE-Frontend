import { goto } from '$app/navigation';
import { toaster } from '#lib/ui/toaster.ts';

interface SaveOptions {
  isNew: boolean;
  /** The entity in the toasts, e.g. "role". */
  noun: string;
  /** The record's display name in the toasts. */
  name: string;
  /** Sends the record. Resolving to `false` means it reported its own failure and nothing saved. */
  save: () => Promise<unknown>;
  /** Where to go after a save, already resolved. */
  redirect: string;
}

/** Saves an admin record, toasts the outcome and leaves the form on success. */
export async function saveEntity({ isNew, noun, name, save, redirect }: SaveOptions) {
  const subject = `${isNew ? 'new ' : ''}${noun} '${name}'`;
  try {
    if ((await save()) === false) return;
    toaster.success({ title: `Successfully saved ${subject}` });
    goto(redirect);
  } catch (error) {
    console.error(error);
    toaster.error({ title: `An error occurred while saving ${subject}` });
  }
}
