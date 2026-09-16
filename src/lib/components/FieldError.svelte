<script lang="ts">
  interface Props {
    testid: string;
    message: string;
  }

  let { testid, message }: Props = $props();
</script>

<p class="text-xs text-left text-error-500 mt-1.5" data-testid={testid}>{message}</p>
