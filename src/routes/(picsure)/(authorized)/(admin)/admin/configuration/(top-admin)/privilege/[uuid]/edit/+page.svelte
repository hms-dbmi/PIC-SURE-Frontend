<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import PrivilegeForm from '#lib/admin/access/PrivilegeForm.svelte';

  import type { Privilege } from '#lib/auth/model/privilege.ts';
  import * as admin from '#lib/admin/resources.ts';
  import Loading from '#lib/ui/Loading.svelte';

  let privilege: Privilege = $state({
    name: '',
    description: '',
    application: '',
  });

  async function load() {
    if (page.params?.uuid) {
      privilege = await admin.privileges.get(page.params.uuid);
    }
    await admin.applications.load();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit Privilege</title>
</svelte:head>

<Content title="Edit Privilege" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-privilege-edit">
      <PrivilegeForm applicationList={admin.applications.options} {privilege} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving privilege {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
