<script lang="ts">
  import { Segment } from '@skeletonlabs/skeleton-svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
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
</script>

<Segment
  {name}
  {value}
  onValueChange={(e) => {
    if (e.value != null) onchange(e.value);
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
