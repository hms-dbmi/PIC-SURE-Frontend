<script module lang="ts">
  export interface TocEntry {
    id: string;
    label: string;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';

  interface Props {
    entries: TocEntry[];
    onselect?: (id: string) => void;
  }

  const { entries, onselect }: Props = $props();

  let active: string = $state('');

  $effect(() => {
    const targets = entries.map(({ id }) => ({ id, element: document.getElementById(id) }));
    const scroller = document.getElementById('page');
    if (!scroller || targets.length === 0) {
      active = entries[0]?.id ?? '';
      return;
    }

    const update = () => {
      const viewportTop = scroller.getBoundingClientRect().top;
      if (
        scroller.scrollTop <= 4 ||
        (targets[0].element && targets[0].element.getBoundingClientRect().top > viewportTop)
      ) {
        active = targets[0].id;
        return;
      }
      // Short final sections may never reach the activation line.
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        active = targets[targets.length - 1].id;
        return;
      }
      const threshold = viewportTop + scroller.clientHeight * 0.4;
      let current = targets[0].id;
      for (const { id, element } of targets) {
        if (element && element.getBoundingClientRect().top <= threshold) current = id;
      }
      active = current;
    };
    const resize = new ResizeObserver(update);
    resize.observe(scroller);
    for (const { element } of targets) {
      if (element) resize.observe(element);
    }
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      resize.disconnect();
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  });

  function visit(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    active = id;
    target.scrollIntoView();
    const heading = target.matches('h1, h2, h3, h4, h5, h6')
      ? target
      : target.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  afterNavigate(async ({ type, to }) => {
    if (type !== 'popstate') return;
    const id = entries.find((entry) => `#${encodeURIComponent(entry.id)}` === to?.url.hash)?.id;
    if (id) {
      await tick();
      // SvelteKit resets hash focus in a deferred task after afterNavigate.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (page.url.href === to?.url.href) visit(id);
    }
  });

  async function select(event: MouseEvent, id: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onselect?.(id);
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- URL preserves the current resolved path and query
    await goto(`${page.url.pathname}${page.url.search}#${encodeURIComponent(id)}`, {
      noScroll: true,
      keepFocus: true,
    });
    visit(id);
  }
</script>

<nav aria-label="On this page" data-testid="toc">
  <span class="text-sm font-bold">On this page</span>
  <ul class="mt-4 border-l-2 border-surface-200-800 text-sm">
    {#each entries as entry (entry.id)}
      {@const current = active === entry.id}
      <li>
        <a
          href="#{encodeURIComponent(entry.id)}"
          class="-ml-0.5 block border-l-4 py-1.5 pl-3 hover:underline {current
            ? 'border-primary-500 font-bold'
            : 'border-transparent text-primary-600-400'}"
          aria-current={current ? 'true' : undefined}
          onclick={(event) => void select(event, entry.id)}>{entry.label}</a
        >
      </li>
    {/each}
  </ul>
</nav>
