<script lang="ts">
  import type { ConfigOrigin } from '#lib/config/admin.ts';
  import { tones } from '#lib/ui/surface.ts';

  interface Props {
    /** The field's key; names the testid. */
    name: string;
    origin: ConfigOrigin;
    /** The value in effect, shown as the tooltip. */
    resolvedValue: string;
  }

  let { name, origin, resolvedValue }: Props = $props();

  const LABEL = { env: 'Env', api: 'API', default: 'Default' };
  const CLASS = {
    env: `${tones['tonal-primary']} border border-primary-500`,
    api: `${tones['tonal-success']} border border-success-500`,
    default: `${tones['tonal-surface']} border border-surface-500`,
  };
  const DOT_CLASS = {
    env: 'bg-primary-500',
    api: 'bg-success-500',
    default: 'bg-surface-500',
  };
</script>

<span
  class="badge {CLASS[origin]} rounded-full inline-flex items-center gap-1.5"
  data-testid={`admin-config-field-origin-${name}`}
  title={`Resolved value: ${resolvedValue}`}
>
  <span class="inline-block w-1.5 h-1.5 rounded-full {DOT_CLASS[origin]}"></span>
  {LABEL[origin]}
</span>
