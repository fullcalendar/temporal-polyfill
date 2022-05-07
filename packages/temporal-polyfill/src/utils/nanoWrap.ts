import { Temporal } from 'temporal-spec'
import { nanoInMilli } from '../dateUtils/units'
import { compareValues, numSign } from './math'

export type NanoInput = NanoWrap | bigint | string

// TODO: rename to BigNano
// operations do not support floating-point math
export class NanoWrap {
  // cannot have conflicting signs
  // nanoRemainder must be below nanoInMilli
  constructor(
    public milli: number,
    public nanoRemainder: number = 0,
  ) {}

  sign(): number {
    return numSign(this.milli) || numSign(this.nanoRemainder)
  }

  abs(): NanoWrap {
    if (this.sign() < 0) {
      return new NanoWrap(-this.milli, -this.nanoRemainder)
    }
    return this
  }

  // TODO: make separate util
  cmp(input: NanoWrap | number): Temporal.ComparisonResult {
    const [milliOther, nanoOther] = ensureVals(input)
    return compareValues(this.milli, milliOther) ||
      compareValues(this.nanoRemainder, nanoOther)
  }

  add(input: NanoWrap | number): NanoWrap {
    const [milliAdd, nanoAdd] = ensureVals(input, true) // skipBalance=true
    return createNanoWrap(this.nanoRemainder + nanoAdd, this.milli + milliAdd) // will balance
  }

  sub(input: NanoWrap | number): NanoWrap {
    const [milliAdd, nanoAdd] = ensureVals(input, true) // skipBalance=true
    return createNanoWrap(this.nanoRemainder - nanoAdd, this.milli - milliAdd) // will balance
  }

  mult(n: number): NanoWrap {
    return createNanoWrap(this.nanoRemainder * n, this.milli * n)
  }

  div(n: number): NanoWrap {
    const milliFloat = this.milli / n
    const milli = Math.trunc(milliFloat)
    const nanoUnder = Math.trunc((milliFloat - milli) * nanoInMilli)
    const nanoRemainder = Math.trunc(this.nanoRemainder / n) + nanoUnder
    return createNanoWrap(nanoRemainder, milli) // will balance
  }

  toNumber(): number {
    return this.milli * nanoInMilli + this.nanoRemainder
  }

  toBigInt(): bigint {
    return BigInt(this.milli) * BigInt(nanoInMilli) + BigInt(this.nanoRemainder)
  }
}

export function ensureNanoWrap(input: NanoInput): NanoWrap {
  if (input instanceof NanoWrap) {
    return input
  }
  if (typeof input === 'bigint') {
    const nanoInMilliBI = BigInt(nanoInMilli)
    return new NanoWrap(
      Number(input / nanoInMilliBI), // does trunc
      Number(input % nanoInMilliBI),
    )
  }
  if (typeof input === 'string') { // TODO: write test
    const gapIndex = input.length - 6
    return new NanoWrap(
      Number(input.substr(gapIndex)),
      Number(input.substr(0, gapIndex)),
    )
  }
  throw new TypeError('Must supply bigint or string')
}

// balances+creates
// accepts [nano, milli] - different than the constructor!
export function createNanoWrap(nano: number, milli = 0): NanoWrap {
  return new NanoWrap(...balanceVals(nano, milli))
}

// returns [milli, nanoRemainger]
function ensureVals(input: NanoWrap | number, skipBalance?: boolean): [number, number] {
  if (typeof input === 'number') {
    return skipBalance ? [0, input] : balanceVals(input, 0)
  }
  return [input.milli, input.nanoRemainder]
}

// accepts [nano, milli] - different than the constructor!
// returns [milli, nanoRemainger]
function balanceVals(nano: number, milli: number): [number, number] {
  let newNano = nano % nanoInMilli
  let newMilli = milli + Math.trunc(nano / nanoInMilli)
  const newSign = numSign(newMilli)
  const altSign = numSign(newNano)

  if (altSign && altSign !== (newSign || 1)) {
    newMilli += altSign
    newNano -= nanoInMilli * altSign
  }

  return [newMilli, newNano]
}
