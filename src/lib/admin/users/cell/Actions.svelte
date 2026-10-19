<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { toaster } from '#lib/ui/toaster.ts';
  import * as admin from '#lib/admin/entities.ts';

  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

  interface Props {
    /** The table's cell contract: `cell` is the user's uuid. */
    data: { cell: string; row: { status?: string; email?: string } };
  }

  let { data }: Props = $props();
  const active = $derived(data.row.status === 'Active');

  function edit(event: Event) {
    event.stopPropagation();
    goto(resolve('/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit', { uuid: data.cell }));
  }

  async function toggleActivate(active: boolean) {
    const user = await admin.users.get(data.cell);
    if (!user) return;

    const connection = await admin.connections.get(user.connection);
    const roles = admin.rolesForSave(user.roles);

    if (!(user && connection && roles.length > 0)) return;

    const newUser = { ...user, active, connection, roles };
    try {
      await admin.users.update(newUser);
      toaster.success({
        title: `Successfully ${active ? 'r' : 'd'}eactivated user '${newUser.email}'`,
      });
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while ${active ? 'r' : 'd'}eactivating user '${user.email}'`,
      });
    }
  }
</script>

{#if active}
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid="admin-user-edit-{data.cell}"
    shortcut="e"
    onclick={edit}
  />
{/if}
<ConfirmButton
  icon="fa-solid fa-trash{active ? '' : '-arrow-up'} fa-xl"
  label={active ? 'Deactivate user (d)' : 'Reactivate user (r)'}
  shortcut={active ? 'd' : 'r'}
  data-testid="admin-user-{active ? 'deactivate' : 'reactivate'}-{data.cell}"
  title="{active ? 'D' : 'R'}eactivate User?"
  confirmLabel="{active ? 'D' : 'R'}eactivate"
  onconfirm={() => toggleActivate(!active)}
>
  Are you sure you want to {active ? 'd' : 'r'}eactivate user '{data.row.email}'?
</ConfirmButton>
