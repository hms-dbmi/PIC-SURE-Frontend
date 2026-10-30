/** The access-control entities that share the configuration pages' new and edit routes. */
export const ACCESS_KINDS = ['connection', 'privilege', 'role'] as const;

export type AccessKind = (typeof ACCESS_KINDS)[number];

export function isAccessKind(value: string): value is AccessKind {
  return (ACCESS_KINDS as readonly string[]).includes(value);
}
