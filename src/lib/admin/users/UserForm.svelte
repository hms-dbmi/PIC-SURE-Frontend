<script lang="ts">
  import { resolve } from '$app/paths';
  import Switch from '#lib/ui/Switch.svelte';

  import type { ExtendedUser } from '#lib/auth/model/user.ts';
  import type { Connection } from '#lib/auth/model/connection.ts';

  import * as admin from '#lib/admin/entities.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import AdminForm from '#lib/admin/forms/AdminForm.svelte';
  import TextField from '#lib/admin/forms/TextField.svelte';
  import CheckboxGroup from '#lib/admin/forms/CheckboxGroup.svelte';
  import { saveEntity } from '#lib/admin/forms/saveEntity.ts';

  interface Props {
    user?: ExtendedUser;
    roleList: [string, string][];
    connections: readonly Connection[];
  }

  let { user, roleList, connections }: Props = $props();

  // Edited copies: they reset if the page hands the form another user.
  let email = $derived(user?.email ?? '');
  let connection = $derived(user?.connection ?? '');
  let active = $derived(user ? user.active : true);
  let roles = $derived(
    roleList.map(([, uuid]) => uuid).filter((uuid) => user?.roles.includes(uuid)),
  );

  async function sendUser() {
    const generalMetadata = JSON.parse(user?.generalMetadata || '{"email":""}');
    generalMetadata.email = email;
    const request = {
      email,
      connection: await admin.connections.get(connection),
      generalMetadata: JSON.stringify(generalMetadata),
      active,
      roles: admin.rolesForSave(roles),
    };
    if (user) return admin.users.update({ ...request, uuid: user.uuid });
    if (await admin.findUserByEmailAndConnection(email, connection)) {
      toaster.error({ title: 'Cannot add a user and connection pair that already exists.' });
      return false;
    }
    return admin.users.add(request);
  }

  function saveUser() {
    return saveEntity({
      isNew: !user,
      noun: 'user',
      name: email,
      save: sendUser,
      redirect: resolve('/(picsure)/(authorized)/(admin)/admin/users'),
    });
  }
</script>

<AdminForm
  entity="user"
  cancelHref={resolve('/(picsure)/(authorized)/(admin)/admin/users')}
  validate={() => (roles.length === 0 ? 'At least one role must be selected.' : undefined)}
  onsave={saveUser}
>
  <Switch name="Active" tone="success" checked={active} onchange={(checked) => (active = checked)}>
    {active ? 'Active' : 'Inactive'}
  </Switch>

  {#if user?.uuid}
    <TextField label="UUID:" value={user.uuid} disabled />
    <TextField label="Subject:" value={user.subject} disabled />
  {/if}

  <TextField label="Email:" type="email" bind:value={email} required disabled={!!user?.email} />

  <label class={['label', !user?.connection && 'required']}>
    <span>Connection:</span>
    <select bind:value={connection} required disabled={!!user?.connection}>
      <option selected={!user || !user.connection} disabled value>none</option>
      {#each connections as connection (connection.uuid)}
        <option value={connection.uuid} selected={user && user.connection === connection.uuid}
          >{connection.label}</option
        >
      {/each}
    </select>
  </label>

  <CheckboxGroup
    legend="Roles:"
    options={roleList}
    bind:selected={roles}
    data-testid="admin-user-role-checkboxes"
  />
</AdminForm>
