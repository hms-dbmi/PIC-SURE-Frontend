<script lang="ts">
  import * as admin from '#lib/admin/entities.ts';

  interface Props {
    // The application's uuid, if the privilege has one.
    application?: string;
  }

  let { application }: Props = $props();
</script>

{application ? admin.applications.find(application)?.name : 'none'}
