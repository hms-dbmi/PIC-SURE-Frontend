import { A as createScope, x as compact, B as ensure, C as MachineStatus, m as isFunction, D as identity, w as warn, E as toArray, F as isString, I as INIT_STATE } from './index-BB9JrA1L.js';
import { X as current_component, E as noop } from './index-BKfiikQf.js';

// src/prop-types.ts
function createNormalizer(fn) {
  return new Proxy({}, {
    get(_target, key) {
      if (key === "style")
        return (props) => {
          return fn({ style: props }).style;
        };
      return fn;
    }
  });
}

// src/create-props.ts
var createProps = () => (props) => Array.from(new Set(props));

function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
const propMap = {
  className: "class",
  defaultChecked: "checked",
  defaultValue: "value",
  htmlFor: "for",
  onBlur: "onfocusout",
  onChange: "oninput",
  onFocus: "onfocusin",
  onDoubleClick: "ondblclick"
};
function toStyleString(style) {
  let string = "";
  for (let key in style) {
    const value = style[key];
    if (value === null || value === void 0)
      continue;
    if (!key.startsWith("--"))
      key = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    string += `${key}:${value};`;
  }
  return string;
}
const preserveKeys = "viewBox,className,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(",");
function toSvelteProp(key) {
  if (key in propMap)
    return propMap[key];
  if (preserveKeys.includes(key))
    return key;
  return key.toLowerCase();
}
function toSveltePropValue(key, value) {
  if (key === "style" && typeof value === "object")
    return toStyleString(value);
  if (value === false)
    return;
  return value;
}
const normalizeProps = createNormalizer((props) => {
  const normalized = {};
  for (const key in props) {
    normalized[toSvelteProp(key)] = toSveltePropValue(key, props[key]);
  }
  return normalized;
});
function bindable(props) {
  const initial = props().defaultValue ?? props().value;
  const eq = props().isEqual ?? Object.is;
  let value = initial;
  const controlled = props().value !== void 0;
  let valueRef = { current: value };
  let prevValue = { current: void 0 };
  const setValueFn = (v) => {
    const next = isFunction(v) ? v(valueRef.current) : v;
    const prev = prevValue.current;
    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev });
    }
    if (!controlled) value = next;
    if (!eq(next, prev)) {
      props().onChange?.(next, prev);
    }
  };
  function get() {
    return controlled ? props().value : value;
  }
  return {
    initial,
    ref: valueRef,
    get,
    set(val) {
      const exec = props().sync ? noop : identity;
      exec(() => setValueFn(val));
    },
    invoke(nextValue, prevValue2) {
      props().onChange?.(nextValue, prevValue2);
    },
    hash(value2) {
      return props().hash?.(value2) ?? String(value2);
    }
  };
}
bindable.cleanup = (fn) => {
  onDestroy(() => fn());
};
bindable.ref = (defaultValue) => {
  let value = defaultValue;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    }
  };
};
function useRefs(refs) {
  const ref = { current: refs };
  return {
    get(key) {
      return ref.current[key];
    },
    set(key, value) {
      ref.current[key] = value;
    }
  };
}
const track = (deps, effect) => {
};
function access(userProps) {
  if (isFunction(userProps)) return userProps();
  return userProps;
}
function useMachine(machine, userProps) {
  const scope = (() => {
    const { id, ids, getRootNode } = access(userProps);
    return createScope({ id, ids, getRootNode });
  })();
  const debug = (...args) => {
    if (machine.debug) console.log(...args);
  };
  const props = machine.props?.({
    props: compact(access(userProps)),
    scope
  }) ?? access(userProps);
  const prop = useProp(() => props);
  const context = machine.context?.({
    prop,
    bindable,
    get scope() {
      return scope;
    },
    flush,
    getContext() {
      return ctx;
    },
    getComputed() {
      return computed;
    },
    getRefs() {
      return refs;
    }
  });
  const ctx = {
    get(key) {
      return context?.[key].get();
    },
    set(key, value) {
      context?.[key].set(value);
    },
    initial(key) {
      return context?.[key].initial;
    },
    hash(key) {
      const current = context?.[key].get();
      return context?.[key].hash(current);
    }
  };
  let effects = /* @__PURE__ */ new Map();
  let transitionRef = { current: null };
  let previousEventRef = { current: null };
  let eventRef = { current: { type: "" } };
  const getEvent = () => ({
    ...eventRef.current,
    current() {
      return eventRef.current;
    },
    previous() {
      return previousEventRef.current;
    }
  });
  const getState = () => ({
    ...state,
    hasTag(tag) {
      const currentState = state.get();
      return !!machine.states[currentState]?.tags?.includes(tag);
    },
    matches(...values) {
      const currentState = state.get();
      return values.includes(currentState);
    }
  });
  const refs = useRefs(machine.refs?.({ prop, context: ctx }) ?? {});
  const getParams = () => ({
    state: getState(),
    context: ctx,
    event: getEvent(),
    prop,
    send,
    action,
    guard,
    track,
    refs,
    computed,
    flush,
    scope,
    choose
  });
  const action = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.actions?.[s];
      if (!fn) warn(`[zag-js] No implementation found for action "${JSON.stringify(s)}"`);
      return fn;
    });
    for (const fn of fns) {
      fn?.(getParams());
    }
  };
  const guard = (str) => {
    if (isFunction(str)) return str(getParams());
    return machine.implementations?.guards?.[str](getParams());
  };
  const effect = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.effects?.[s];
      if (!fn) warn(`[zag-js] No implementation found for effect "${JSON.stringify(s)}"`);
      return fn;
    });
    const cleanups = [];
    for (const fn of fns) {
      const cleanup = fn?.(getParams());
      if (cleanup) cleanups.push(cleanup);
    }
    return () => cleanups.forEach((fn) => fn?.());
  };
  const choose = (transitions) => {
    return toArray(transitions).find((t) => {
      let result = !t.guard;
      if (isString(t.guard)) result = !!guard(t.guard);
      else if (isFunction(t.guard)) result = t.guard(getParams());
      return result;
    });
  };
  const computed = (key) => {
    ensure(machine.computed, () => `[zag-js] No computed object found on machine`);
    const fn = machine.computed[key];
    return fn({
      context: ctx,
      event: getEvent(),
      prop,
      refs,
      scope,
      computed
    });
  };
  const state = bindable(() => ({
    defaultValue: machine.initialState({ prop }),
    onChange(nextState, prevState) {
      if (prevState) {
        const exitEffects = effects.get(prevState);
        exitEffects?.();
        effects.delete(prevState);
      }
      if (prevState) {
        action(machine.states[prevState]?.exit);
      }
      action(transitionRef.current?.actions);
      const cleanup = effect(machine.states[nextState]?.effects);
      if (cleanup) effects.set(nextState, cleanup);
      if (prevState === INIT_STATE) {
        action(machine.entry);
        const cleanup2 = effect(machine.effects);
        if (cleanup2) effects.set(INIT_STATE, cleanup2);
      }
      action(machine.states[nextState]?.entry);
    }
  }));
  let status = MachineStatus.NotStarted;
  onDestroy(() => {
    debug("unmounting...");
    status = MachineStatus.Stopped;
    effects.forEach((fn) => fn?.());
    effects = /* @__PURE__ */ new Map();
    transitionRef.current = null;
    action(machine.exit);
  });
  const send = (event) => {
    if (status !== MachineStatus.Started) return;
    previousEventRef.current = eventRef.current;
    eventRef.current = event;
    let currentState = state.get();
    const transitions = machine.states[currentState].on?.[event.type] ?? machine.on?.[event.type];
    const transition = choose(transitions);
    if (!transition) return;
    transitionRef.current = transition;
    const target = transition.target ?? currentState;
    const changed = target !== currentState;
    if (changed) {
      state.set(target);
    } else if (transition.reenter && !changed) {
      state.invoke(currentState, currentState);
    } else {
      action(transition.actions);
    }
  };
  machine.watch?.(getParams());
  return {
    get state() {
      return getState();
    },
    send,
    context: ctx,
    prop,
    scope,
    refs,
    computed,
    get event() {
      return getEvent();
    },
    getStatus: () => status
  };
}
function useProp(value) {
  return function get(key) {
    return value()[key];
  };
}
function flush(fn) {
  queueMicrotask(() => {
  });
}

export { createProps as c, normalizeProps as n, onDestroy as o, toStyleString as t, useMachine as u };
//# sourceMappingURL=machine.svelte-D_VZYMjT.js.map
