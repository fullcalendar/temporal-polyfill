import { isObjectlike } from './utils'

// TODO: rename 'ensure' to 'require' ?
// -------------------------------------------------------------------------------------------------

export function ensureObjectlike<O extends {}>(arg: O): O {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like');
  }
  return arg;
}

function ensureType<A>(typeName: string, arg: A): A {
  if (typeof arg !== typeName) {
    throw new TypeError(`Must be certain type ${typeName}`);
  }
  return arg;
}

export const ensureString = ensureType.bind(undefined, 'string') as (arg: string) => string
export const ensureBoolean = ensureType.bind(undefined, 'boolean') as (arg: boolean) => boolean
export const ensureNumber = ensureType.bind(undefined, 'number') as (arg: number) => number

export function ensureStringOrUndefined(input: string | undefined): string | undefined {
  if (input !== undefined && typeof input !== 'string') {
    throw new TypeError('Must be string or undefined')
  }
  return input
}

export function ensureIntegerOrUndefined(input: number | undefined): number | undefined {
  if (input === undefined) {
    // good
  } else if (typeof input === 'number') {
    if (!Number.isInteger(input)) {
      throw new RangeError('Cannot accept non-integer')
    }
  } else {
    throw new TypeError('Invalid type. Expected integer or undefined')
  }
  return input
}

export function ensureInteger(arg: number): number {
  return ensureNumberIsInteger(ensureNumber(arg));
}

export function ensurePositiveInteger(arg: number): number {
  return ensureNumberIsPositive(ensureInteger(arg))
}

function ensureNumberIsInteger(num: number): number {
  if (!Number.isInteger(num)) {
    throw new RangeError('must be integer');
  }
  return num || 0; // ensure no -0... TODO: why???
}

function ensureNumberIsPositive(num: number): number {
  if (num <= 0) {
    throw new RangeError('Must be positive')
  }
  return num
}

// Casting
// -------------------------------------------------------------------------------------------------

export function toString(arg: string): string {
  if (isObjectlike(arg)) {
    return String(arg)
  }
  return ensureString(arg)
}

export function toBigInt(bi: bigint): bigint {
  if (typeof bi === 'string') {
    return BigInt(bi)
  }
  if (typeof bi !== 'bigint') {
    throw new TypeError('Invalid bigint')
  }
  return bi
}

export function toNumber(arg: number): number {
  if (typeof arg === 'bigint') {
    throw new TypeError('Cannot convert bigint to number')
  }

  arg = Number(arg)

  if (isNaN(arg)) {
    throw new RangeError('not a number')
  }
  if (!Number.isFinite(arg)) {
    throw new RangeError('must be finite')
  }

  return arg
}

export function toInteger(arg: number): number {
  return Math.trunc(toNumber(arg)) || 0 // ensure no -0
}

export function toStrictInteger(arg: number): number {
  return ensureNumberIsInteger(toNumber(arg))
}

export function toPositiveInteger(arg: number): number {
  return ensureNumberIsPositive(toNumber(arg))
}

// ID-like
// -------------------------------------------------------------------------------------------------

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : ensureString(idLike.id)
}

export function isIdLikeEqual(
  calendarSlot0: IdLike,
  calendarSlot1: IdLike,
): boolean {
  return calendarSlot0 === calendarSlot1 || getId(calendarSlot0) === getId(calendarSlot1)
}
