<script lang="ts">
  import type { FilterInterface } from '$lib/models/Filter.svelte';
  import { Operator, type OperatorType } from '$lib/models/query/Query';
  import { toggleOperator } from '$lib/stores/Filter';

  let {
    siblingA,
    siblingB,
    operator = $bindable(),
  }: {
    siblingA: FilterInterface;
    siblingB: FilterInterface;
    operator: OperatorType;
  } = $props();
  let id = $derived(siblingA.uuid.split('-')[0] + '-' + siblingB.uuid.split('-')[0]);

  function change() {
    toggleOperator(siblingA, siblingB);
  }
</script>

<select
  data-testid={`operator-dropdown-${id}`}
  class="select operator-select"
  value={operator}
  onchange={change}
>
  <option value={Operator.AND}>{Operator.AND}</option>
  <option value={Operator.OR}>{Operator.OR}</option>
</select>
