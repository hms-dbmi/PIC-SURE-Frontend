import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import { toaster } from '#lib/ui/toaster.ts';
import { saveEntity } from '#lib/admin/forms/saveEntity.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));

const options = { noun: 'role', name: 'Analyst', redirect: '/admin/configuration' };

describe('saveEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('toasts and leaves the form after a save', async () => {
    await saveEntity({ ...options, isNew: true, save: async () => ({}) });

    expect(toaster.success).toHaveBeenCalledWith({
      title: "Successfully saved new role 'Analyst'",
    });
    expect(goto).toHaveBeenCalledWith('/admin/configuration');
  });

  it('stays on the form when the save fails', async () => {
    await saveEntity({ ...options, isNew: false, save: () => Promise.reject(new Error('500')) });

    expect(toaster.error).toHaveBeenCalledWith({
      title: "An error occurred while saving role 'Analyst'",
    });
    expect(goto).not.toHaveBeenCalled();
  });

  it('stays quiet when the save reports its own refusal', async () => {
    await saveEntity({ ...options, isNew: true, save: async () => false });

    expect(toaster.success).not.toHaveBeenCalled();
    expect(toaster.error).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });
});
