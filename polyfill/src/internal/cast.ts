import {
  isObjectLike,
  requireNumberIsPositive,
  requireObjectLike,
  toFiniteNumber,
  toIntegerWithTrunc,
  toPositiveIntegerWithTruncation,
} from 'temporal-utils/protected'
import * as errorMessages from './errorMessages'
import { Callable, bindArgs, throwRangeError, throwTypeError } from './utils'

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

/*
Disallows undefined/null. Does RangeError
*/
export function requirePropDefined<V>(
  optionName: string,
  optionVal: V | null | undefined,
): V {
  if (optionVal == null) {
    throwRangeError(errorMessages.missingField(optionName))
  }
  return optionVal
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
    throwTypeError(errorMessages.invalidEntity(entityName, arg))
  }
  return arg
}

/*
Already known to be number
Also, responsible for ensuring not -0
Other top-level funcs handle this themselves
*/
export function requireNumberIsInteger(
  num: number,
  entityName = 'number',
): number {
  if (!Number.isInteger(num)) {
    throwRangeError(errorMessages.expectedInteger(entityName, num))
  }
  return num || 0 // ensure no -0
}

// Casting
// -----------------------------------------------------------------------------

export function toString(arg: string): string {
  if (typeof arg === 'symbol') {
    throwTypeError(errorMessages.forbiddenSymbolToString)
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

// Spec: booleans must be converted to BigInt before number check.
// true -> 1n, false -> 0n. If not bigint/string/boolean, throw TypeError.
export function toBigInt(bi: bigint): bigint {
  if (typeof bi === 'boolean') {
    return BigInt(bi ? 1 : 0)
  }
  if (typeof bi === 'string') {
    return BigInt(bi)
  }
  if (typeof bi !== 'bigint') {
    throwTypeError(errorMessages.invalidBigInt(bi))
  }
  return bi
}

export {
  requireObjectLike,
  toFiniteNumber,
  toIntegerWithTrunc,
  toPositiveIntegerWithTruncation,
}

/*
In official spec, this is called toIntegerIfIntegral
*/
export function toStrictInteger(arg: number, entityName?: string): number {
  return requireNumberIsInteger(toFiniteNumber(arg, entityName), entityName)
}
