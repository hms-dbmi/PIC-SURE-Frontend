<script lang="ts">
  interface Props {
    /** Size classes, e.g. `h-4 w-32`. */
    class?: string;
    shape?: 'bar' | 'pill' | 'box';
    'data-testid'?: string;
  }

  let { class: className = '', shape = 'bar', 'data-testid': testid }: Props = $props();

  const shapes = { bar: 'rounded', pill: 'rounded-full', box: 'rounded-sm' } as const;
</script>

<div
  class="placeholder animate-pulse {shapes[shape]} {className}"
  aria-hidden="true"
  data-testid={testid}
></div>
