<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';

  import { getUser, updateUser } from '$lib/stores/Users';
  import { getConnection } from '$lib/stores/Connections';
  import { getRole } from '$lib/stores/Roles';
  import { getPrivilege } from '$lib/stores/Privileges';

  let { data = { cell: '', row: { status: '', email: '' } } } = $props();

  function edit(event: Event) {
    event.stopPropagation();
    goto(`/admin/users/${data.cell}/edit`);
  }

  function userActivation(activate: boolean) {
    return async (event: Event) => {
      event.stopPropagation();
      const user = await getUser(data.cell);

      modalStore.trigger({
        type: 'confirm',
        title: `${activate ? 'R' : 'D'}eactivate User?`,
        body: `Are you sure you want to ${activate ? 'r' : 'd'}eactiveate user '${user.email}'?`,
        buttonTextConfirm: activate ? 'Reactivate' : 'Deactivate',
        response: async (confirm: boolean) => {
          if (!confirm) return;

          let newUser = {
            ...user,
            active: activate,
            connection: await getConnection(user.connection),
            roles: await Promise.all(
              user.roles.map((uuid: string) =>
                getRole(uuid).then((role) => ({
                  ...role,
                  privileges: role.privileges.map((uuid: string) => getPrivilege(uuid)),
                })),
              ),
            ),
          };
          try {
            await updateUser(newUser);
            toastStore.trigger({
              message: `Successfully ${activate ? 'r' : 'd'}eactivated user '${user.email}'`,
              background: 'variant-filled-success',
            });
          } catch (error) {
            console.error(error);
            toastStore.trigger({
              message: `An error occured while ${activate ? 'r' : 'd'}eactivating user '${
                user.email
              }'`,
              background: 'variant-filled-error',
            });
          }
        },
      });
    };
  }
</script>

{#if data.row.status === 'Active'}
  <button
    data-testid={`user-edit-btn-${data.cell}`}
    type="button"
    title="Edit"
    aria-label="Edit"
    class="btn-icon-color"
    onclick={edit}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
  </button>
  <button
    data-testid={`user-deactivate-btn-${data.cell}`}
    type="button"
    title="Deactivate user"
    aria-label="Deactivate user"
    class="btn-icon-color"
    onclick={userActivation(false)}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
  </button>
{:else}
  <button
    data-testid={`user-activate-btn-${data.cell}`}
    type="button"
    title="Reactivate user"
    aria-label="Reactivate user"
    class="btn-icon-color"
    onclick={userActivation(true)}
  >
    <i class="fa-solid fa-trash-arrow-up fa-xl"></i>
  </button>
{/if}
