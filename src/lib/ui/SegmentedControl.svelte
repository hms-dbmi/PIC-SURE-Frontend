<script lang="ts">
  import { tick } from 'svelte';
  import { Segment } from '@skeletonlabs/skeleton-svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    /** Prefix of the radios' name; each control gets a name of its own. */
    name: string;
    value: string;
    options: Option[];
    onchange: (value: string) => void;
    /** Colour of the indicator behind the selected option. */
    tone?: keyof typeof tones;
  }

  const tones = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
  };

  let { name, value, options, onchange, tone = 'primary' }: Props = $props();

  // Radios that share a name are one group to the browser: arrow keys would walk from one control
  // into the next, and only one of them would be reachable by Tab.
  const uid = $props.id();
  const groupName = $derived(`${name}-${uid}`);

  let root: HTMLElement;

  async function pick(next: string) {
    const hadFocus = root.contains(document.activeElement);
    onchange(next);
    if (!hadFocus) return;
    // The {#key} remount replaced the focused radio: focus its replacement, so arrow keys keep
    // working.
    await tick();
    root.querySelector<HTMLInputElement>('input:checked')?.focus();
  }
</script>

<!-- Remounts on a new value: Skeleton's Segment doesn't move its indicator when `value` changes. -->
<div class="contents" bind:this={root}>
  {#key value}
    <Segment
      name={groupName}
      {value}
      onValueChange={(e) => {
        if (e.value != null) pick(e.value);
      }}
      background="bg-white border-surface-400 border"
      indicatorBg={tones[tone]}
      indicatorClasses="scale-[1.04]"
      padding="0"
      gap="0"
    >
      {#each options as option (option.value)}
        <Segment.Item value={option.value}>{option.label}</Segment.Item>
      {/each}
    </Segment>
  {/key}
</div>
