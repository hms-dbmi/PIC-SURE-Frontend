type Listener = () => void;

const listeners = new Set<Listener>();

// api.ts reports a forbidden logout here because the stores that react to it import api.ts
export function onAccessDenied(listener: Listener) {
  listeners.add(listener);
}

export function reportAccessDenied() {
  listeners.forEach((listener) => listener());
}
