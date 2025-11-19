import { y as setContext, K as getContext } from './index-DMPVr6nO.js';

function createContext(defaultValue) {
  const key = Symbol();
  const set = (value) => setContext(key, value);
  const get = () => getContext(key) ?? defaultValue;
  return [set, get, key];
}

export { createContext as c };
//# sourceMappingURL=create-context-CgHykjw-.js.map
