<script lang="ts">
  interface Props {
    columns: number;
    children?: import('svelte').Snippet;
  }

  let { columns, children }: Props = $props();
  
  // Define explicit grid classes so Tailwind can detect them
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12'
  };
  
  const gridClass = gridClasses[columns as keyof typeof gridClasses] || 'grid-cols-1';
</script>

<div class={`grid ${gridClass} divide-x py-4`}>
  {@render children?.()}
</div>
