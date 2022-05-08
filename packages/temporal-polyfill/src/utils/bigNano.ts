import { Temporal } from 'temporal-spec'
import { nanoInMilli } from '../dateUtils/units'
import { compareValues, numSign } from './math'

export type BigNanoInput = BigNano | bigint | string

// operations do not support floating-point math
export class BigNano {
  // cannot have conflicting signs
  // nanoRemainder must be below nanoInMilli
  constructor(
    public milli: number,
    public nanoRemainder: number = 0,
  ) {}

  sign(): Temporal.ComparisonResult {
    return numSign(this.milli) || numSign(this.nanoRemainder)
  }

  neg(): BigNano {
    return new BigNano(-this.milli || 0, -this.nanoRemainder || 0) // prevents -0
  }

  abs(): BigNano {
    return this.sign() < 0 ? this.neg() : this
  }

  add(input: BigNano | number): BigNano {
    const [milliAdd, nanoAdd] = ensureVals(input, true) // skipBalance=true
    return createBigNano(this.nanoRemainder + nanoAdd, this.milli + milliAdd) // will balance
  }

  sub(input: BigNano | number): BigNano {
    const [milliAdd, nanoAdd] = ensureVals(input, true) // skipBalance=true
    return createBigNano(this.nanoRemainder - nanoAdd, this.milli - milliAdd) // will balance
  }

  mult(n: number): BigNano {
    return createBigNano(this.nanoRemainder * n, this.milli * n)
  }

  div(n: number): BigNano {
    const milliFloat = this.milli / n
    const milli = Math.trunc(milliFloat)
    const nanoUnder = Math.trunc((milliFloat - milli) * nanoInMilli)
    const nanoRemainder = Math.trunc(this.nanoRemainder / n) + nanoUnder
    return createBigNano(nanoRemainder, milli) // will balance
  }

  toNumber(): number {
    return this.milli * nanoInMilli + this.nanoRemainder
  }

  toBigInt(): bigint {
    return BigInt(this.milli) * BigInt(nanoInMilli) + BigInt(this.nanoRemainder)
  }

  // valueOf(): void {
  //   throw new Error('Cant get valueOf of BigNano')
  // }
}

export function compareBigNanos(
  a: BigNano,
  b: BigNano,
): Temporal.ComparisonResult {
  return compareValues(a.milli, b.milli) ||
    compareValues(a.nanoRemainder, b.nanoRemainder)
}

export function ensureBigNano(input: BigNanoInput): BigNano {
  if (input instanceof BigNano) {
    return input
  }
  if (typeof input === 'bigint') {
    const nanoInMilliBI = BigInt(nanoInMilli)
    return new BigNano(
      Number(input / nanoInMilliBI), // does trunc
      Number(input % nanoInMilliBI),
    )
  }
  if (typeof input === 'string') { // TODO: write test
    const gapIndex = input.length - 6
    return new BigNano(
      Number(input.substr(gapIndex)),
      Number(input.substr(0, gapIndex)),
    )
  }
  throw new TypeError('Must supply bigint or string')
}

// balances+creates
// accepts [nano, milli] - different than the constructor!
export function createBigNano(nano: number, milli = 0): BigNano {
  return new BigNano(...balanceVals(nano, milli))
}

// returns [milli, nanoRemainger]
function ensureVals(input: BigNano | number, skipBalance?: boolean): [number, number] {
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
  const signMilli = numSign(newMilli) // all signs must equal this
  const signNano = numSign(newNano)

  // ensure same signs. more performant way to do this?
  if (signNano && signNano !== (signMilli || 1)) {
    newMilli += signNano
    newNano -= nanoInMilli * signNano
  }

  return [newMilli, newNano]
}
