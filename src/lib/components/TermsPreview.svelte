<script lang="ts">
  import { sanitizeHTML } from '$lib/utilities/HTML';

  interface Props {
    terms: string;
    class?: string;
  }

  let { terms, class: className = '' }: Props = $props();
</script>

<div id="terms-of-service" class={className}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html sanitizeHTML(terms)}
</div>
