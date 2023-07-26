import { Temporal } from 'temporal-spec'
import { compareValues, numSign } from './math'
import { padEnd } from './string'

// MAX_SAFE_INTEGER has 16 digits, but go lower so low value doesn't overflow
const maxLowDigits = 8
const maxLowNum = Math.pow(10, maxLowDigits)

export type LargeIntArgStrict = LargeInt | bigint | string
export type LargeIntArg = LargeIntArgStrict | number // allow number, which might loose precision

export class LargeInt {
  constructor(
    public high: number,
    public low: number,
  ) {}

  sign(): Temporal.ComparisonResult {
    return numSign(this.high) || numSign(this.low)
  }

  neg(): LargeInt {
    return new LargeInt(-this.high || 0, -this.low || 0) // prevents -0
  }

  abs(): LargeInt {
    return this.sign() < 0 ? this.neg() : this
  }

  add(input: LargeInt | number): LargeInt {
    const [high, low] = getHighLow(input)
    return balanceAndCreate(this.high + high, this.low + low)
  }

  sub(input: LargeInt | number): LargeInt {
    const [high, low] = getHighLow(input)
    return balanceAndCreate(this.high - high, this.low - low)
  }

  mult(n: number): LargeInt {
    return balanceAndCreate(this.high * n, this.low * n)
  }

  div(n: number): LargeInt {
    const highFloat = this.high / n
    let highStr = String(highFloat) // more exact output than toFixed

    if (highStr.indexOf('e-') !== -1) { // has negative scientific notation?
      highStr = highFloat.toFixed(20) // return maximum-guaranteed precision
    }

    const highDot = highStr.indexOf('.')
    let lowScraps = 0

    if (highDot !== -1) {
      let afterDot = highStr.substr(highDot + 1)
      afterDot = padEnd(afterDot, maxLowDigits, '0')
      afterDot = afterDot.substr(0, maxLowDigits)
      lowScraps = parseInt(afterDot) * (numSign(highFloat) || 1)
    }

    const high = Math.trunc(highFloat) || 0 // prevent -0
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
  //   throw new Error('Cant get valueOf of LargeInt')
  // }
}

export function createLargeInt(input: LargeIntArg): LargeInt
export function createLargeInt(input: LargeIntArgStrict, strict: true): LargeInt
export function createLargeInt(input: LargeIntArg, strict?: true): LargeInt {
  let high: number
  let low: number
  if (input instanceof LargeInt) {
    high = input.high
    low = input.low
  } else if (typeof input === 'number') { // TODO: don't allow this in Instant or ZonedDateTime
    if (strict) {
      throw new TypeError('Must supply bigint, not number')
    }
    high = Math.trunc(input / maxLowNum)
    low = input % maxLowNum || 0
  } else if (typeof input === 'bigint') {
    const maxNumBI = BigInt(maxLowNum)
    high = Number(input / maxNumBI)
    low = Number(input % maxNumBI || 0)
  } else if (typeof input === 'string') { // TODO: write test
    input = input.trim()
    if (input.match(/\D/)) {
      throw new SyntaxError(`Cannot parse ${input} to a BigInt`)
    }
    const gapIndex = input.length - maxLowDigits
    high = Number(input.substr(gapIndex))
    low = Number(input.substr(0, gapIndex))
  } else {
    throw new Error('Invalid type of BigNano')
  }
  return new LargeInt(high, low)
}

export function compareLargeInts(a: LargeInt, b: LargeInt): Temporal.ComparisonResult {
  return compareValues(a.high, b.high) || compareValues(a.low, b.low)
}

function getHighLow(input: LargeInt | number): [number, number] {
  if (typeof input === 'number') {
    return [0, input]
  }
  return [input.high, input.low]
}

function balanceAndCreate(high: number, low: number): LargeInt {
  let newLow = low % maxLowNum || 0
  let newHigh = high + Math.trunc(low / maxLowNum)
  const signHigh = numSign(newHigh) // all signs must equal this
  const signLow = numSign(newLow)

  // ensure same signs. more performant way to do this?
  if (signLow && signHigh && signLow !== signHigh) {
    newHigh += signLow
    newLow -= maxLowNum * signLow
  }

  return new LargeInt(newHigh, newLow)
}
