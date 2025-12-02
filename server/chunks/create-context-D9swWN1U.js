import { y as setContext, K as getContext } from './index-C9dy-hDW.js';

function createContext(defaultValue) {
  const key = Symbol();
  const set = (value) => setContext(key, value);
  const get = () => getContext(key) ?? defaultValue;
  return [set, get, key];
}

export { createContext as c };
//# sourceMappingURL=create-context-D9swWN1U.js.map
