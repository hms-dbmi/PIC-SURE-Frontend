const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// shared by every widget on the page: the script tag survives component destroy, so api.js loads
// at most once per page load however many widgets ask for it
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    // a finished script element never re-fires events: if it didn't give us the API, drop it so
    // a later caller injects a fresh one instead of waiting forever
    script.addEventListener('load', (event) => {
      if (window.turnstile) return resolve(window.turnstile);
      (event.target as HTMLScriptElement).remove();
      reject(new Error('Turnstile script loaded without defining its API'));
    });
    script.addEventListener('error', (event) => {
      (event.target as HTMLScriptElement).remove();
      reject(new Error('Failed to load the Turnstile script'));
    });
  });
}
