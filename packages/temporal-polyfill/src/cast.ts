import { isObjectlike } from './utils'

// Primitives
// -------------------------------------------------------------------------------------------------

export function ensureInstanceOf<T>(Class: { new(): T; }, obj: T): T {
  if (!(obj instanceof Class)) {
    throw new TypeError('Must be certain type'); // TODO: show Class's symbol?
  }
  return obj;
}
function ensureType<A>(typeName: string, arg: A): A {
  if (typeof arg !== typeName) {
    throw new TypeError(`Must be certain type ${typeName}`);
  }
  return arg;
}

export const ensureString = ensureType.bind(undefined, 'string') as (arg: string) => string;

export const ensureNumber = ensureType.bind(undefined, 'number') as (arg: number) => number;

export const ensureBoolean = ensureType.bind(undefined, 'boolean') as (arg: boolean) => boolean;

export function ensureInteger(arg: number): number {
  return ensureNumberIsInteger(ensureNumber(arg));
}

export function ensureArray<A extends any[]>(arg: A): A {
  if (!Array.isArray(arg)) {
    throw new TypeError('Must be array');
  }
  return arg;
}

export function ensureObjectlike<O extends {}>(arg: O): O {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like');
  }
  return arg;
}

export function toString(arg: string): string {
  if (typeof arg === 'symbol') {
    throw new TypeError('Cannot convert a Symbol to a String');
  }
  return String(arg);
}
/*
truncates floats
*/

export function toInteger(arg: number): number {
  return Math.trunc(toNumber(arg)) || 0; // ensure no -0
}
/*
throws error on floats
*/

export function toIntegerStrict(arg: number): number {
  return ensureNumberIsInteger(toNumber(arg));
}
function ensureNumberIsInteger(num: number): number {
  if (!Number.isInteger(num)) {
    throw new RangeError('must be integer');
  }
  return num || 0; // ensure no -0
}
/*
Caller must do ||0 to ensure no -0
*/
export function toNumber(arg: number): number {
  arg = Number(arg);
  if (isNaN(arg)) {
    throw new RangeError('not a number');
  }
  if (!Number.isFinite(arg)) {
    throw new RangeError('must be finite');
  }
  return arg;
}
