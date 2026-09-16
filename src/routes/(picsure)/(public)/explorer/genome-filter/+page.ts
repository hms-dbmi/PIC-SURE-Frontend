import { redirect } from '@sveltejs/kit';

// This was genomic filtering's only address for the life of the feature, and it sat behind a
// prominent button in the Explore search bar, so bookmarks and history entries for it are real
// rather than theoretical. The Genotypes tab is where it went; send them there instead of to a
// bare 404 that carries none of the app's chrome and offers no way back.
//
// 302 rather than 301, matching the sibling gate in genotypes/+page.ts: a permanently cached
// redirect would be hard to undo if this path is ever reused. The target applies its own
// availability gate, so a deployment with genomic search off still ends up on /explorer.
export const load = () => {
  redirect(302, '/explorer/genotypes');
};
