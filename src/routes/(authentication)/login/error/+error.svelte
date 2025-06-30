<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{page.status}: {page?.error?.message ?? 'An unkown error occured.'}</h1>
