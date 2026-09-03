<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { toaster } from '$lib/toaster';
  import { getUser, updateUser } from '$lib/stores/Users';
  import { getConnection } from '$lib/stores/Connections';
  import { getRole } from '$lib/stores/Roles';
  import { getPrivilege } from '$lib/stores/Privileges';

  import Modal from '$lib/components/Modal.svelte';

  let { data = { cell: '', row: { status: '', email: '' } } } = $props();
  const active = $derived(data.row.status === 'Active');

  function edit(event: Event) {
    event.stopPropagation();
    goto(resolve(`/admin/users/${data.cell}/edit`));
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
    data-testid="user-{data.cell}-edit-btn"
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
<Modal
  data-testid="user-{data.cell}-{active ? 'D' : 'R'}eactivate"
  title="{active ? 'D' : 'R'}eactivate User?"
  confirmText="{active ? 'D' : 'R'}eactivate"
  triggerTitle={active ? 'Deactivate user (d)' : 'Reactivate user (r)'}
  data-key={active ? 'd' : 'r'}
  triggerBase="btn-icon-color"
  onconfirm={() => toggleActivate(!active)}
  withDefault
>
  {#snippet trigger()}
    <i class="fa-solid fa-trash{active ? '' : '-arrow-up'} fa-xl"></i>
    <span class="sr-only">{active ? 'Deactivate user (d)' : 'Reactivate user (r)'}</span>
  {/snippet}
  Are you sure you want to {active ? 'd' : 'r'}eactiveate user '{data.row.email}'?
</Modal>
