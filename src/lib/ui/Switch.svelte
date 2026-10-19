<script lang="ts">
  import { Switch } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    checked: boolean;
    onchange: (checked: boolean) => void;
    /** Accessible name, for a switch without a visible label. */
    label?: string;
    /** Track colour while checked. */
    tone?: keyof typeof tones;
    /** Visible label, after the switch. */
    children?: Snippet;
    /** Drawn on the thumb while checked. */
    checkedIcon?: Snippet;
  }

  const tones = {
    primary: 'preset-filled-primary-500',
    success: 'bg-success-500',
  };

  let { name, checked, onchange, label, tone = 'primary', children, checkedIcon }: Props = $props();
</script>

<Switch
  {name}
  {label}
  {checked}
  controlActive={tones[tone]}
  onCheckedChange={(e) => onchange(e.checked)}
  activeChild={checkedIcon}
  {children}
/>
