<script lang="ts">
  import { resolve } from '$app/paths';

  import type { Role } from '#lib/auth/model/role.ts';
  import * as admin from '#lib/admin/entities.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import AdminForm from '#lib/admin/forms/AdminForm.svelte';
  import TextField from '#lib/admin/forms/TextField.svelte';
  import CheckboxGroup from '#lib/admin/forms/CheckboxGroup.svelte';
  import { saveEntity } from '#lib/admin/forms/saveEntity.ts';

  interface Props {
    role?: Role;
    privilegeList: [string, string][];
  }

  let { role, privilegeList }: Props = $props();

  // Edited copies: they reset if the page hands the form another role.
  let name = $derived(role?.name ?? '');
  let description = $derived(role?.description ?? '');
  let privileges = $derived(
    privilegeList.map(([, uuid]) => uuid).filter((uuid) => role?.privileges.includes(uuid)),
  );

  function saveRole() {
    const edited: Role = { name, description, privileges };
    return saveEntity({
      isNew: !role,
      noun: 'role',
      name,
      save: () =>
        role ? admin.roles.update({ ...edited, uuid: role.uuid }) : admin.roles.add(edited),
      redirect: resolve('/(picsure)/(authorized)/(admin)/admin/configuration'),
    });
  }
</script>

<AdminForm
  entity="role"
  uuid={role?.uuid}
  disabled={!session.isTopAdmin}
  cancelHref={resolve('/(picsure)/(authorized)/(admin)/admin/configuration')}
  validate={() =>
    privileges.length === 0 ? 'At least one privilege must be selected.' : undefined}
  onsave={saveRole}
>
  <TextField label="Name:" bind:value={name} required />
  <TextField label="Description:" bind:value={description} required />
  <CheckboxGroup
    legend="Privileges:"
    options={privilegeList}
    bind:selected={privileges}
    data-testid="admin-role-privilege-checkboxes"
  />
</AdminForm>
