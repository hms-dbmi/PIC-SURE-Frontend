import { isToastShowing, toaster } from '#lib/ui/toaster.ts';
import { config } from '#lib/config/config.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { runSyncQuery } from '#lib/api/picsure/query.ts';
import { buildDescriptor } from '#lib/query/descriptor.svelte.ts';
import { isCountValueEqual } from '#lib/query/counts/format.ts';
import { statEntries } from '#lib/query/counts/statProviders.ts';
import { createQueryCountService, type QueryCountService } from '#lib/query/counts/service.ts';
import type { ResultCountSnapshot } from '#lib/query/counts/snapshot.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

export interface LandingStat {
  key: string;
  label: string;
  auth: boolean;
  /** Undefined while loading. */
  snapshot?: ResultCountSnapshot;
}

const NO_FILTERS = { phenotypicClause: null, genomicFilters: [] };

export class LandingStats {
  #service: QueryCountService;
  #stats = $state.raw<LandingStat[]>([]);
  #lastRequest = '';
  #generation = 0;

  readonly open = $derived(this.#stats.filter((stat) => !stat.auth));
  readonly auth = $derived(this.#stats.filter((stat) => stat.auth));

  constructor(service: QueryCountService) {
    this.#service = service;
  }

  async load() {
    assertNoSsrWrite('LandingStats');
    try {
      const loggedIn = session.isLoggedIn;
      const entries = statEntries(config.branding.landing.stats || [], {
        loggedIn,
        loginOpen: config.features.login.open,
      });

      // The open and signed-in lists differ, so signing in reloads and nothing else does.
      const thisRequest = entries.map(({ auth, key }) => [auth, key].join(',')).join(';');
      if (this.#lastRequest === thisRequest) return;
      this.#lastRequest = thisRequest;
      const generation = ++this.#generation;

      if (loggedIn) {
        const consents = await session.ensureConsentsLoaded();
        if (consents === undefined) {
          this.#lastRequest = '';
        }
      }
      if (generation !== this.#generation) return;

      // Every reload asks again: the dictionary stats depend on whose consents they're sent with.
      this.#service.clear();
      this.#stats = entries.map(({ key, label, auth }) => ({ key, label, auth }));
      entries.forEach(({ auth, provider }, i) => {
        this.#service.getCount(buildDescriptor(!auth, NO_FILTERS), provider).then((snapshot) => {
          if (generation !== this.#generation) return;
          this.#stats = this.#stats.map((stat, j) => (i === j ? { ...stat, snapshot } : stat));
        });
      });
    } catch (error) {
      console.error(error);
      if (!isToastShowing('stats-error')) {
        toaster.error({
          id: 'stats-error',
          title:
            'An error occured while loading statistics. If this problem persists, please contact an administrator.',
          closable: true,
        });
      }
    }
  }
}

function countOf(stat: LandingStat) {
  return stat.snapshot?.summary.hasError ? null : stat.snapshot?.count;
}

/** Whether both lists show the same stats with the same loaded counts. */
export function statsMatch(open: LandingStat[], auth: LandingStat[]): boolean {
  if (open.length === 0 || auth.length === 0) return false;

  const openByKey = Object.fromEntries(open.map((stat) => [stat.key, stat]));
  const authByKey = Object.fromEntries(auth.map((stat) => [stat.key, stat]));
  if (Object.keys(openByKey).length !== Object.keys(authByKey).length) return false;

  for (const [key, openStat] of Object.entries(openByKey)) {
    const authStat = authByKey[key];
    if (!authStat || openStat.label !== authStat.label) return false;
    if (!openStat.snapshot || !authStat.snapshot) return false;
    if (!isCountValueEqual(countOf(openStat), countOf(authStat))) return false;
  }
  return true;
}

export const landingStats = new LandingStats(
  createQueryCountService({
    transport: (request, openEndpoint) => runSyncQuery(request, { openEndpoint }),
  }),
);
