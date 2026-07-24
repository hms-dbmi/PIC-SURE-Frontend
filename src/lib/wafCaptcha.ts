import { log, createLog } from '$lib/logger';
import { isOpenAccess } from '$lib/AccessState';

const PENDING_KEY = 'waf-captcha-pending';
const GUARD_KEY = 'waf-captcha-guard';
const LOOP_WINDOW_MS = 30_000;
const STALE_PENDING_MS = 10 * 60_000;

// Dedupes a burst of concurrent WAF 405s so one incident produces one log and one reload.
let reloadInitiated = false;

export function isWafCaptchaResponse(res: Response): boolean {
  return res.status === 405 && res.headers.get('x-amzn-waf-action') === 'captcha';
}

// Returns true when a reload is imminent (caller must go silent), false when the
// loop guard tripped and the caller should surface its normal error state.
export function handleWafCaptcha(path: string): boolean {
  if (reloadInitiated) return true;

  const mode = isOpenAccess() ? 'open' : 'authorized';

  const lastReload = Number(sessionStorage.getItem(GUARD_KEY));
  if (lastReload && Date.now() - lastReload < LOOP_WINDOW_MS) {
    log(createLog('ERROR', 'waf.captcha_loop', { path, mode }, { status: 405 }));
    return false;
  }

  reloadInitiated = true;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ts: Date.now(), path, mode }));
  sessionStorage.setItem(GUARD_KEY, String(Date.now()));
  // keepalive so the reload below doesn't abort this POST.
  log(createLog('ACTION', 'waf.captcha_shown', { path, mode }, { status: 405 }), {
    keepalive: true,
  });
  window.location.reload();
  return true;
}

export function logWafCaptchaResolution(): void {
  const pending = sessionStorage.getItem(PENDING_KEY);
  if (!pending) return;
  sessionStorage.removeItem(PENDING_KEY);

  try {
    const { ts, path, mode } = JSON.parse(pending);
    if (Date.now() - ts > STALE_PENDING_MS) return; // abandoned at the CAPTCHA; not a resolution
    log(createLog('ACTION', 'waf.captcha_resolved', { path, mode, durationMs: Date.now() - ts }));
    // Anchor the loop-guard window to the completed reload, not the detection instant.
    sessionStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch {
    return;
  }
}
