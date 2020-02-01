import { Runtype, create, Static } from '../runtype';
import show from '../show';

export interface StringDictionary<V extends Runtype> extends Runtype<{ [_: string]: Static<V> }> {
  tag: 'dictionary';
  key: 'string';
  value: V;
}

export interface NumberDictionary<V extends Runtype> extends Runtype<{ [_: number]: Static<V> }> {
  tag: 'dictionary';
  key: 'number';
  value: V;
}

/**
 * Construct a runtype for arbitrary dictionaries.
 */
export function Dictionary<V extends Runtype>(value: V, key?: 'string'): StringDictionary<V>;
export function Dictionary<V extends Runtype>(value: V, key?: 'number'): NumberDictionary<V>;
export function Dictionary<V extends Runtype>(value: V, key = 'string'): any {
  return create<Runtype>(
    (x, visitedSet = new Set(), failedSet = new Set()) => {
      if (x === null || x === undefined) {
        const a = create<any>(x as never, { tag: 'dictionary', key, value });
        return { success: false, message: `Expected ${show(a)}, but was ${x}` };
      }

      if (typeof x !== 'object') {
        const a = create<any>(x as never, { tag: 'dictionary', key, value });
        return { success: false, message: `Expected ${show(a.reflect)}, but was ${typeof x}` };
      }

      if (Object.getPrototypeOf(x) !== Object.prototype) {
        if (!Array.isArray(x)) {
          const a = create<any>(x as never, { tag: 'dictionary', key, value });
          return {
            success: false,
            message: `Expected ${show(a.reflect)}, but was ${Object.getPrototypeOf(x)}`,
          };
        } else if (key === 'string')
          return { success: false, message: 'Expected dictionary, but was array' };
      }

      if (visitedSet.has(x) && !failedSet.has(x)) return { success: true, value: x };
      visitedSet.add(x);

      for (const k in x) {
        // Object keys are unknown strings
        if (key === 'number') {
          if (isNaN(+k))
            return {
              success: false,
              message: 'Expected dictionary key to be a number, but was string',
            };
        }

        let validated = value.validate((x as any)[k], visitedSet, failedSet);
        if (!validated.success) {
          failedSet.add(x);
          return {
            success: false,
            message: validated.message,
            key: validated.key ? `${k}.${validated.key}` : k,
          };
        }
      }

      return { success: true, value: x };
    },
    { tag: 'dictionary', key, value },
  );
}
