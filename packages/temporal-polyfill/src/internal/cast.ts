import * as errorMessages from './errorMessages'
import { Callable, bindArgs, isObjectLike } from './utils'

// Require
// -----------------------------------------------------------------------------

export function requireStringOrUndefined(
  input: string | undefined,
): string | undefined {
  if (input !== undefined) {
    return requireString(input)
  }
}

export function requirePositiveIntegerOrUndefined(
  input: number | undefined,
): number | undefined {
  if (input !== undefined) {
    return requirePositiveInteger(input)
  }
}

export function requireIntegerOrUndefined(
  input: number | undefined,
): number | undefined {
  if (input !== undefined) {
    return requireInteger(input)
  }
}

export function requirePositiveInteger(arg: number): number {
  return requireNumberIsPositive(requireInteger(arg))
}

export function requireInteger(arg: number): number {
  return requireNumberIsInteger(requireNumber(arg))
}

export function requireNonNullish<T>(o: T): T {
  if (o == null) {
    throw new TypeError(errorMessages.forbiddenNullish)
  }
  return o
}

/*
Disallows undefined/null. Does RangeError
*/
export function requirePropDefined<V>(
  optionName: string,
  optionVal: V | null | undefined,
): V {
  if (optionVal == null) {
    throw new RangeError(errorMessages.missingField(optionName))
  }
  return optionVal
}

export function requireObjectLike<O extends {}>(arg: O): O {
  if (!isObjectLike(arg)) {
    throw new TypeError(errorMessages.invalidObject)
  }
  return arg
}

export const requireString = bindArgs(requireType<string>, 'string')
export const requireBoolean = bindArgs(requireType<boolean>, 'boolean')
export const requireNumber = bindArgs(requireType<number>, 'number')
export const requireFunction = bindArgs(requireType<Callable>, 'function')

function requireType<A>(
  typeName: string,
  arg: A,
  entityName: string = typeName,
): A {
  // biome-ignore lint/suspicious/useValidTypeof: dynamic by design
  if (typeof arg !== typeName) {
    throw new TypeError(errorMessages.invalidEntity(entityName, arg))
  }
  return arg
}

/*
Already known to be number
Also, responsible for ensuring not -0
Other top-level funcs handle this themselves
*/
function requireNumberIsInteger(num: number, entityName = 'number'): number {
  if (!Number.isInteger(num)) {
    throw new RangeError(errorMessages.expectedInteger(entityName, num))
  }
  return num || 0 // ensure no -0
}

/*
Already known to be number
*/
function requireNumberIsPositive(num: number, entityName = 'number'): number {
  if (num <= 0) {
    throw new RangeError(errorMessages.expectedPositive(entityName, num))
  }
  return num
}

// Casting
// -----------------------------------------------------------------------------

export function toString(arg: string): string {
  if (typeof arg === 'symbol') {
    throw new TypeError(errorMessages.forbiddenSymbolToString)
  }
  return String(arg)
}

/*
see ToPrimitiveAndRequireString
*/
export function toStringViaPrimitive(arg: string, entityName?: string): string {
  if (isObjectLike(arg)) {
    return String(arg)
  }
  return requireString(arg, entityName)
}

export function toBigInt(bi: bigint): bigint {
  if (typeof bi === 'string') {
    return BigInt(bi)
  }
  if (typeof bi !== 'bigint') {
    throw new TypeError(errorMessages.invalidBigInt(bi))
  }
  return bi
}

export function toNumber(arg: number, entityName = 'number'): number {
  if (typeof arg === 'bigint') {
    throw new TypeError(errorMessages.forbiddenBigIntToNumber(entityName))
  }

  arg = Number(arg)

  if (!Number.isFinite(arg)) {
    throw new RangeError(errorMessages.expectedFinite(entityName, arg))
  }

  return arg
}

export function toInteger(arg: number, entityName?: string): number {
  return Math.trunc(toNumber(arg, entityName)) || 0 // ensure no -0
}

export function toStrictInteger(arg: number, entityName?: string): number {
  return requireNumberIsInteger(toNumber(arg, entityName), entityName)
}

export function toPositiveInteger(arg: number, entityName?: string): number {
  return requireNumberIsPositive(toInteger(arg, entityName), entityName)
}
