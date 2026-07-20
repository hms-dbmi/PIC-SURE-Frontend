export {}; // This makes the file a module, preventing global scope pollution

declare global {
  interface TurnstileRenderOptions {
    sitekey: string;
    action: string;
    theme: 'auto' | 'light' | 'dark';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }

  interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
    remove: (widgetId: string) => void;
  }

  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
    turnstile?: TurnstileApi;
  }
}
