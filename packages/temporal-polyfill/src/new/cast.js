
export function strictNumber(input) {

}

export function strictInstanceOf(obj, Class) {
}

export function strictArrayOfStrings(obj) { // rethink
}

export function strictArrayOfType(obj) { // used?
}

export function strictArray() {

}

export function toObject() {
}

export function toNumber(value) {
  if (typeof value === 'bigint') {
    throw new TypeError('Cannot convert BigInt to number')
  }
  return Number(value)
}

export function toInteger(value) {
  const num = toNumber(value)
  if (isNaN(num)) return 0
  const integer = Math.trunc(num)
  if (num === 0) return 0
  return integer
}

export function toString(value) {
  if (typeof value === 'symbol') {
    throw new TypeError('Cannot convert a Symbol value to a String')
  }
  return String(value)
}

export function toIntegerThrowOnInfinity(value) {
  const integer = toInteger(value)
  if (!Number.isFinite(integer)) {
    throw new RangeError('infinity is out of range')
  }
  return integer
}

export function toPositiveInteger(valueParam, property) {
  const value = toInteger(valueParam)
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (value < 1) {
    if (property !== undefined) {
      throw new RangeError(`property '${property}' cannot be a a number less than one`)
    }
    throw new RangeError('Cannot convert a number less than one to a positive integer')
  }
  return value
}

export function toIntegerWithoutRounding(valueParam) {
  const value = toNumber(valueParam)
  if (isNaN(value)) return 0
  if (!Number.isFinite(value)) {
    throw new RangeError('infinity is out of range')
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`unsupported fractional value ${value}`)
  }
  return toInteger(value) // ℝ(value) in spec text; converts -0 to 0
}
