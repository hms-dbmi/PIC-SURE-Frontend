<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { deletePrivilege } from '#lib/admin/access/Privileges.ts';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editPrivilege(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/configuration/privilege/${data.cell}/edit`));
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    try {
      await deletePrivilege(data.cell);
      toaster.success({
        title: `Successfully deleted privilege '${data.row.name}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete privilege '${data.row.name}' as it is still in use by a role`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting privilege '${data.row.name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid={`admin-privilege-edit-${data.cell}`}
    shortcut="e"
    disabled={!$isTopAdmin}
    onclick={editPrivilege}
  />
  <ConfirmButton
    icon="fa-solid fa-trash fa-xl"
    label="Delete (d)"
    shortcut="d"
    data-testid="admin-privilege-delete-{data.cell}"
    title="Delete Privilege?"
    confirmLabel="Yes"
    cancelLabel="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
  >
    Are you sure you want to delete privilege '{data.row.name}'?
  </ConfirmButton>
</div>
