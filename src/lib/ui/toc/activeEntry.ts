export interface ScrollViewport {
  top: number;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

export interface SectionPosition {
  id: string;
  top: number | null;
}

export function getActiveEntry(scroller: ScrollViewport, targets: SectionPosition[]): string {
  const first = targets[0];
  if (!first) return '';
  if (scroller.scrollTop <= 4 || (first.top !== null && first.top > scroller.top)) {
    return first.id;
  }
  // Short final sections may never reach the activation line.
  if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
    return targets[targets.length - 1].id;
  }
  const threshold = scroller.top + scroller.clientHeight * 0.4;
  let current = first.id;
  for (const { id, top } of targets) {
    if (top !== null && top <= threshold) current = id;
  }
  return current;
}
