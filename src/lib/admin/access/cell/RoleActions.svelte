<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import * as admin from '#lib/admin/resources.ts';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editRole(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/configuration/role/${data.cell}/edit`));
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    try {
      await admin.roles.remove(data.cell);
      toaster.success({
        title: `Successfully deleted role '${data.row.name}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete role '${data.row.name}' as it is still in use by a user`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting role '${data.row.name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid={`admin-role-edit-${data.cell}`}
    shortcut="e"
    disabled={!$isTopAdmin}
    onclick={editRole}
  />
  <ConfirmButton
    icon="fa-solid fa-trash fa-xl"
    label="Delete (d)"
    shortcut="d"
    data-testid="admin-role-delete-{data.cell}"
    title="Delete Role?"
    confirmLabel="Yes"
    cancelLabel="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
  >
    Are you sure you want to delete role '{data.row.name}'?
  </ConfirmButton>
</div>
