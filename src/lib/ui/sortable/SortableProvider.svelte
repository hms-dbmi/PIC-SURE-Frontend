<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { browser } from '$app/env';
  import { DragDropProvider } from '@dnd-kit/svelte';
  import {
    Accessibility,
    DragDropManager,
    KeyboardSensor,
    PointerSensor,
    StyleInjector,
    defaultPreset,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
  } from '@dnd-kit/dom';

  type Announcements = NonNullable<Parameters<typeof Accessibility.configure>[0]>['announcements'];

  interface Props {
    /** Screen-reader messages; dnd-kit's defaults name the dragged item by its id. */
    announcements?: Announcements;
    onDragStart?: (event: DragStartEvent) => void;
    onDragOver?: (event: DragOverEvent) => void;
    onDragEnd?: (event: DragEndEvent) => void;
    children: Snippet;
  }

  let { announcements, onDragStart, onDragOver, onDragEnd, children }: Props = $props();

  const sensors = [KeyboardSensor, PointerSensor];
  // dnd-kit positions the drag overlay with a <style> element it injects, which the CSP blocks
  // without a nonce. This reuses the page's script nonce, which hooks.server.ts also allows in
  // style-src (withStyleNonce).
  const nonce = browser
    ? (document.querySelector<HTMLElement>('style[nonce], script[nonce]')?.nonce ?? undefined)
    : undefined;
  // The Accessibility plugin reads its announcements once, when the manager is built. They are
  // functions that read the caller's state, so reading the prop once is enough.
  const configured = untrack(() => announcements);
  const plugins = [
    ...defaultPreset.plugins.map((plugin) =>
      plugin === Accessibility && configured
        ? Accessibility.configure({ announcements: configured })
        : plugin,
    ),
    StyleInjector.configure({ nonce }),
  ];
  // Built here rather than by DragDropProvider, which applies plugin options only after the
  // plugins exist, too late for the announcements. DragDropProvider still overwrites a given
  // manager's plugins and sensors with its own props (dnd-kit's defaults when they're missing),
  // so pass both again; it never destroys a manager it was given, so this component does.
  const manager = new DragDropManager({ plugins, sensors });
  onDestroy(() => manager.destroy());
</script>

<DragDropProvider {manager} {plugins} {sensors} {onDragStart} {onDragOver} {onDragEnd}>
  {@render children()}
</DragDropProvider>
