import { defineParams } from '@sveltejs/kit/params';

import { isAccessKind } from '#lib/admin/access/model/kind.ts';

export const params = defineParams({
  accessKind: (param) => (isAccessKind(param) ? param : undefined),
});
