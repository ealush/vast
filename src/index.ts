type TStateInput<S> = S | (() => S);
type TSetStateInput<S> = S | ((prevState: S) => S);
type TStateHandlerReturn<S> = [S, (nextState: TSetStateInput<S>) => void];

export default function createState(onStateChange?: Function) {
  const state: {
    references: any[];
  } = {
    references: [],
  };

  const registrations: [
    any,
    (<S>(currentState: S, prevState: S) => void)?
  ][] = [];

  return {
    registerStateKey,
    reset,
  };

  /**
   * Registers a new key in the state, takes the initial value (may be a function that returns the initial value), returns a function.
   *
   * @example
   *
   * const useColor = state.registerStateKey("blue");
   *
   * let [color, setColor] = useColor(); // -> ["blue", Function]
   *
   * setColor("green");
   *
   * useColor()[0]; -> "green"
   */
  function registerStateKey<S>(
    initialState?: TStateInput<S>,
    onUpdate?: () => void
  ): () => TStateHandlerReturn<S> {
    const key = registrations.length;
    registrations.push([initialState, onUpdate]);
    return initKey(key, initialState);
  }

  function reset(): void {
    state.references = [];
    registrations.forEach(([initialValue], index) =>
      initKey(index, initialValue)
    );
  }

  function initKey<S>(key: number, initialState?: TStateInput<S>) {
    current().push();
    set(key, optionalFunctionValue(initialState));

    return function useStateKey(): TStateHandlerReturn<S> {
      return [
        current()[key],
        (nextState: TSetStateInput<S>) =>
          set(key, optionalFunctionValue(nextState, [current()[key]])),
      ];
    };
  }

  function current(): any[] {
    return state.references;
  }

  function set(key: number, value: any): void {
    const prevValue = state.references[key];
    state.references[key] = value;

    const [, onUpdate] = registrations[key];

    if (isFunction(onUpdate)) {
      onUpdate(value, prevValue);
    }

    if (isFunction(onStateChange)) {
      onStateChange();
    }
  }
}

function isFunction(f: any): f is Function {
  return typeof f === 'function';
}

function optionalFunctionValue(value: any, args?: any[]): any {
  return isFunction(value) ? value.apply(null, args) : value;
}
