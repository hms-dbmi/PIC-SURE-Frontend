<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { toaster } from '#lib/ui/toaster.ts';
  import { getUser, updateUser } from '#lib/admin/users/Users.ts';
  import { getConnection } from '#lib/admin/access/Connections.ts';
  import { getRole } from '#lib/admin/access/Roles.ts';
  import { getPrivilege } from '#lib/admin/access/Privileges.ts';

  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

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
  Are you sure you want to {active ? 'd' : 'r'}eactiveate user '{data.row.email}'?
</ConfirmButton>
