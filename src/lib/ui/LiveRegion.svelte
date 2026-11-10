<script lang="ts">
  interface Props {
    /** Usually an Announcer's `message`. */
    message: string;
    /** `assertive` interrupts the screen reader; keep it for errors. */
    politeness?: 'polite' | 'assertive';
    'aria-label'?: string;
    'data-testid'?: string;
  }

  let { message, politeness = 'polite', ...rest }: Props = $props();
</script>

<p
  class="sr-only"
  role={politeness === 'assertive' ? 'alert' : 'status'}
  aria-live={politeness}
  aria-atomic="true"
  {...rest}
>
  {message}
</p>
