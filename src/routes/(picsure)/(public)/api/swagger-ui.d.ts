declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
  export interface SwaggerReact {
    createElement(type: unknown, props?: unknown, ...children: unknown[]): unknown;
    useRef<T>(value: T): { current: T };
    useLayoutEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
    useState<T>(value: T): [T, (value: T) => void];
  }

  export interface SwaggerSystem {
    React: SwaggerReact;
    specActions: { updateSpec(spec: string): void };
  }

  export type SwaggerComponent = (props: Record<string, unknown>) => unknown;

  interface SwaggerConfig {
    domNode: HTMLElement;
    spec: Record<string, unknown>;
    supportedSubmitMethods: string[];
    tryItOutEnabled: boolean;
    deepLinking: boolean;
    queryConfigEnabled: boolean;
    persistAuthorization: boolean;
    docExpansion: string;
    requestInterceptor: () => never;
    plugins: Array<(system: SwaggerSystem) => unknown>;
  }

  export default function SwaggerUI(config: SwaggerConfig): SwaggerSystem;
}
