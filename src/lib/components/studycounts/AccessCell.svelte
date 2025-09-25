<script lang="ts">
  import type { CleanedStudyData } from '$lib/models/api/Studies';

  interface Props {
    data: CleanedStudyData;
  }

  let { data: study }: Props = $props();
</script>

{#if study?.isPublic}
  <span class="btn preset-filled-success-500">Public</span>
{:else if study?.hasAccess}
  <a
    href={study?.additional_info_link || '#'}
    target="_blank"
    rel="noopener noreferrer"
    class="btn preset-filled-success-500"
  >
    Access Granted
  </a>
{:else}
  <a
    href={study?.additional_info_link || '#'}
    target="_blank"
    rel="noopener noreferrer"
    class="btn preset-filled-primary-500"
  >
    Request
  </a>
{/if}
