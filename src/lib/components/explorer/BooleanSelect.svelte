<script lang="ts">
  import { JoinTypes } from '$lib/models/Filter';

  let { value = JoinTypes.AND, onChange }: { value: JoinTypes, onChange: (value: JoinTypes) => void } = $props();
</script>

<select class="select preset-filled-primary-500" bind:value={value} onchange={() => onChange(value)}>
  <option value={JoinTypes.AND} selected>And</option>
  <option value={JoinTypes.OR}>Or</option>
</select>