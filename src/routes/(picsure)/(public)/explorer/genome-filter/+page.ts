import { redirect } from '@sveltejs/kit';

// 302 rather than 301: a permanently cached redirect would be hard to undo if this path is
// ever reused.
export const load = () => {
  redirect(302, '/explorer/genotypes');
};
