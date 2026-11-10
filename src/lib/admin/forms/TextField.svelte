<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'children' | 'class'> {
    label: string;
    value?: string;
  }

  let {
    label,
    value = $bindable(''),
    type = 'text',
    required = false,
    disabled = false,
    ...rest
  }: Props = $props();
</script>

<!-- A field the user can't change isn't marked required. -->
<label class={['label', required && !disabled && 'required']}>
  <span>{label}</span>
  <input
    {type}
    class="input"
    bind:value
    {required}
    {disabled}
    minlength={required ? 1 : undefined}
    maxlength={required ? 255 : undefined}
    {...rest}
  />
</label>
