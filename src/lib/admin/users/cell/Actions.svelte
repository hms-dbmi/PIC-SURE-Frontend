<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { toaster } from '#lib/ui/toaster.ts';
  import { getUser, updateUser } from '#lib/admin/users/Users.ts';
  import { getConnection } from '#lib/admin/access/Connections.ts';
  import { getRole } from '#lib/admin/access/Roles.ts';
  import { getPrivilege } from '#lib/admin/access/Privileges.ts';

  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';

  let { data = { cell: '', row: { status: '', email: '' } } } = $props();
  const active = $derived(data.row.status === 'Active');

  function edit(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/users/${data.cell}/edit`));
  }

  async function toggleActivate(active: boolean) {
    const user = await getUser(data.cell);
    if (!user) return;

    const connection = await getConnection(user.connection);
    const roles = await Promise.all(
      user.roles.map((uuid: string) =>
        getRole(uuid).then((role) => ({
          ...role,
          privileges: role.privileges.map((uuid: string) => getPrivilege(uuid)),
        })),
      ),
    );

    if (!(user && connection && roles.length > 0)) return;

    let newUser = { ...user, active, connection, roles };
    try {
      await updateUser(newUser);
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
  <button
    data-testid="admin-user-edit-{data.cell}"
    type="button"
    title="Edit (e)"
    aria-label="Edit (e)"
    data-key="e"
    class="btn-icon-color"
    onclick={edit}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
  </button>
{/if}
<ConfirmDialog
  data-testid="admin-user-{active ? 'deactivate' : 'reactivate'}-{data.cell}"
  title="{active ? 'D' : 'R'}eactivate User?"
  confirmLabel="{active ? 'D' : 'R'}eactivate"
  triggerTitle={active ? 'Deactivate user (d)' : 'Reactivate user (r)'}
  triggerKey={active ? 'd' : 'r'}
  triggerClass="btn-icon-color"
  onconfirm={() => toggleActivate(!active)}
>
  {#snippet trigger()}
    <i class="fa-solid fa-trash{active ? '' : '-arrow-up'} fa-xl"></i>
    <span class="sr-only">{active ? 'Deactivate user (d)' : 'Reactivate user (r)'}</span>
  {/snippet}
  Are you sure you want to {active ? 'd' : 'r'}eactiveate user '{data.row.email}'?
</ConfirmDialog>
