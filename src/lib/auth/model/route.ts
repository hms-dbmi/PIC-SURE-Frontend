import type { Access } from '#lib/auth/access.ts';
import type { User } from '#lib/auth/model/user.ts';
import type { Features } from '#lib/config/index.ts';

export interface Route {
  path: string;
  text: string;
  /** The policy of the page the link opens. The link shows to the visitors it lets in. */
  access: Access;
  /** Who sees the link instead, when that isn't who `access` lets in. */
  visibleTo?: (user: User | undefined, features: Features) => boolean;
}
