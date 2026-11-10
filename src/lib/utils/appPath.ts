// resolve() can't type-check a path built at runtime, because TypeScript gives up on a union
// as large as the app's `Path` type. It accepts this branded '' unchecked instead.
export type UncheckedPath = '' & { readonly __uncheckedPath: true };

// For runtime paths like '/explorer?search=x'. Pass literals to resolve() so they stay checked.
// Drops the leading slash kit 3 pathnames don't use.
export function appPath(path: string): UncheckedPath {
  return path.replace(/^\/+/, '') as UncheckedPath;
}
