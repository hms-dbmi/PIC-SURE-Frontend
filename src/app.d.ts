// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Locals {}
  interface PageData {
    mode?: import('#lib/explorer/mode.ts').ExploreMode;
  }
  interface Error {
    message: string;
  }
  // interface Platform {}
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
  }
}
