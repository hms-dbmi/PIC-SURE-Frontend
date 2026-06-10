export {}; // This makes the file a module, preventing global scope pollution

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
  }
}
