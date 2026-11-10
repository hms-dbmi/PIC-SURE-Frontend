<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { toaster } from '#lib/ui/toaster.ts';
  import * as admin from '#lib/admin/entities.ts';

  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

  interface Props {
    uuid: string;
    email: string;
    status: string;
  }

  let { uuid, email, status }: Props = $props();
  const active = $derived(status === 'Active');

  function edit(event: Event) {
    event.stopPropagation();
    goto(resolve('/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit', { uuid }));
  }

  async function toggleActivate(active: boolean) {
    const who = `user '${email}'`;
    try {
      const stored = await admin.users.get(uuid);
      const connection = await admin.connections.get(stored.connection);
      await admin.users.update({
        ...stored,
        active,
        connection,
        roles: admin.rolesForSave(stored.roles),
      });
      toaster.success({
        title: `Successfully ${active ? 'reactivated' : 'deactivated'} ${who}`,
      });
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occurred while ${active ? 'reactivating' : 'deactivating'} ${who}`,
      });
    }
  }
</script>

{#if active}
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid="admin-user-edit-{uuid}"
    shortcut="e"
    onclick={edit}
  />
{/if}
<ConfirmButton
  icon="fa-solid fa-trash{active ? '' : '-arrow-up'} fa-xl"
  label={active ? 'Deactivate user (d)' : 'Reactivate user (r)'}
  shortcut={active ? 'd' : 'r'}
  data-testid="admin-user-{active ? 'deactivate' : 'reactivate'}-{uuid}"
  title="{active ? 'D' : 'R'}eactivate User?"
  confirmLabel="{active ? 'D' : 'R'}eactivate"
  onconfirm={() => toggleActivate(!active)}
>
  Are you sure you want to {active ? 'd' : 'r'}eactivate user '{email}'?
</ConfirmButton>
