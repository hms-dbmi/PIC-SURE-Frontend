<script lang="ts">
  import { JoinTypes } from '$lib/models/Filter';

  let { value = JoinTypes.AND, onChange }: { value: JoinTypes, onChange: (event: Event) => void } = $props();
</script>

<select 
  id="boolean-select" 
  class="select w-fit" 
  bind:value={value} 
  onchange={onChange}
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => e.stopPropagation()}
>
  <option value={JoinTypes.AND} selected>And</option>
  <option value={JoinTypes.OR}>Or</option>
</select>