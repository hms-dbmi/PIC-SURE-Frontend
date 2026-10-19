import { untrack } from 'svelte';
import { session } from '#lib/auth/session.svelte.ts';
import { config } from '#lib/config/config.svelte.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

/**
 * The terms of service and the app's one dialog for them, which `TermsDialog` renders from the root
 * layout. The dialog holds a signed-in user who has yet to accept the terms, on every page, and the
 * footer link opens it to read them. PSAMA answers 403 to such a user's requests until they
 * accept; the dialog keeps the app from looking usable before then.
 */
class TermsOfService {
  // Only an explicit `false`: a profile that hasn't loaded yet (as during login) says nothing.
  #required = $derived(
    session.isLoggedIn &&
      session.user.acceptedTOS === false &&
      config.features.termsOfService &&
      config.features.enforceTermsOfService,
  );
  #reading = $state(false);
  // The token the user closed the required terms under, which they can do when the terms fail to
  // load, so a broken endpoint can't lock them out. A new token, from a sign-in or a refresh, shows
  // them again.
  #closedFor = $state('');

  /**
   * The signed-in user has yet to accept the terms: the dialog can't be dismissed and offers only
   * Accept and Reject.
   */
  get required() {
    return this.#required;
  }

  get dialogOpen() {
    return this.#reading || (this.#required && this.#closedFor !== session.token);
  }

  set dialogOpen(open: boolean) {
    assertNoSsrWrite('termsOfService');
    this.#reading = open;
    if (!open && untrack(() => this.#required)) this.#closedFor = untrack(() => session.token);
  }
}

export const termsOfService = new TermsOfService();
