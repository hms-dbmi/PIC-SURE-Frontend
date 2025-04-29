<script lang="ts">
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
    goto(`/admin/users/${data.cell}/edit`);
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
    title="Edit"
    aria-label="Edit"
    class="btn-icon-color"
    onclick={edit}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
  </button>
{/if}
<Modal
  data-testid="user-{data.cell}-{active ? 'D' : 'R'}eactivate-btn"
  title="{active ? 'D' : 'R'}eactivate User?"
  confirmText="{active ? 'D' : 'R'}eactivate"
  onconfirm={() => toggleActivate(!active)}
  withDefault
>
  {#snippet trigger()}
    <button
      data-testid="user-{active ? 'd' : 'r'}eactivate-btn-{data.cell}"
      type="button"
      title="{active ? 'D' : 'R'}eactivate user"
      aria-label="{active ? 'D' : 'R'}eactivate user"
      class="btn-icon-color"
    >
      <i class="fa-solid fa-trash{active ? '' : '-arrow-up'} fa-xl"></i>
    </button>
  {/snippet}
  Are you sure you want to {active ? 'd' : 'r'}eactiveate user '{data.row.email}'?
</Modal>
