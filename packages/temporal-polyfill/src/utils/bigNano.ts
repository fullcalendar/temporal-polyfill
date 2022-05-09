import { Temporal } from 'temporal-spec'
import { compareValues, numSign } from './math'

// MAX_SAFE_INTEGER has 16 digits, but go lower so low value doesn't overflow
const maxLowDigits = 8
const maxLowNum = Math.pow(10, maxLowDigits)

export type BigNanoInput = BigNano | bigint | number | string

// TODO: rename to LargeInt
export class BigNano {
  constructor(
    public high: number,
    public low: number,
  ) {}

  sign(): Temporal.ComparisonResult {
    return numSign(this.high) || numSign(this.low)
  }

  neg(): BigNano {
    return new BigNano(-this.high || 0, -this.low || 0) // prevents -0
  }

  abs(): BigNano {
    return this.sign() < 0 ? this.neg() : this
  }

  add(input: BigNano | number): BigNano {
    const [high, low] = getHighLow(input)
    return balanceAndCreate(this.high + high, this.low + low)
  }

  sub(input: BigNano | number): BigNano {
    const [high, low] = getHighLow(input)
    return balanceAndCreate(this.high - high, this.low - low)
  }

  mult(n: number): BigNano {
    return balanceAndCreate(this.high * n, this.low * n)
  }

  div(n: number): BigNano {
    const highFloat = this.high / n
    // use string manip to avoid floating-point precision loss
    const afterDecimal = highFloat.toFixed(maxLowDigits + 1).split('.')[1]
    const high = Math.trunc(highFloat) || 0 // prevent -0
    // we previously got one digit extra so we can trunc, whereas toFixed does rounding
    const lowScraps = Math.trunc(parseInt(afterDecimal) / 10) * (numSign(highFloat) || 1)
    const low = Math.trunc(this.low / n) + lowScraps
    return balanceAndCreate(high, low)
  }

  toNumber(): number {
    return this.high * maxLowNum + this.low
  }

  toBigInt(): bigint {
    return BigInt(this.high) * BigInt(maxLowNum) + BigInt(this.low)
  }

  // valueOf(): void {
  //   throw new Error('Cant get valueOf of BigNano')
  // }
}

export function createBigNano(input: BigNanoInput): BigNano {
  let high: number
  let low: number
  if (input instanceof BigNano) {
    high = input.high
    low = input.low
  } else if (typeof input === 'number') { // TODO: don't allow this in Instant or ZonedDateTime
    high = Math.trunc(input / maxLowNum)
    low = input % maxLowNum
  } else if (typeof input === 'bigint') {
    const maxNumBI = BigInt(maxLowNum)
    high = Number(input / maxNumBI)
    low = Number(input % maxNumBI)
  } else if (typeof input === 'string') { // TODO: write test
    const gapIndex = input.length - maxLowDigits
    high = Number(input.substr(gapIndex))
    low = Number(input.substr(0, gapIndex))
  } else {
    throw new Error('Invalid type of BigNano')
  }
  return new BigNano(high, low)
}

export function compareBigNanos(a: BigNano, b: BigNano): Temporal.ComparisonResult {
  return compareValues(a.high, b.high) || compareValues(a.low, b.low)
}

function getHighLow(input: BigNano | number): [number, number] {
  if (typeof input === 'number') {
    return [0, input]
  }
  return [input.high, input.low]
}

function balanceAndCreate(high: number, low: number): BigNano {
  let newLow = low % maxLowNum
  let newHigh = high + Math.trunc(low / maxLowNum)
  const signHigh = numSign(newHigh) // all signs must equal this
  const signLow = numSign(newLow)

  // ensure same signs. more performant way to do this?
  if (signLow && signHigh && signLow !== signHigh) {
    newHigh += signLow
    newLow -= maxLowNum * signLow
  }

  return new BigNano(newHigh, newLow)
}
