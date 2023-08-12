import { NumSign, compareNumbers, divModFloor, divModTrunc } from './utils'

const maxLow = 1e8 // exclusive // TODO: explain why

export class LargeInt {
  constructor(
    public high: number,
    public low: number,
  ) {}

  addLargeInt(num: LargeInt, sign: 1 | -1 = 1): LargeInt {
    return balanceAndCreate(this.high + num.high * sign, this.low + num.low * sign)
  }

  /*
  different than PlainTime/Duration::add, for minification
  */
  addNumber(num: number): LargeInt {
    if (num) {
      return balanceAndCreate(this.high, this.low + num)
    }
    return this
  }

  mult(multiplier: number): LargeInt {
    return balanceAndCreate(this.high * multiplier, this.low * multiplier)
  }

  divModFloor(divisor: number): [LargeInt, number] {
    const { high, low } = this
    const [newHigh, highRemainder] = divModFloor(high, divisor)
    const [newLow, remainder] = divModFloor(highRemainder * maxLow + low, divisor)

    return [
      balanceAndCreate(newHigh, newLow),
      remainder,
    ]
  }

  divModTrunc(divisor: number): [LargeInt, number] {
    const { high, low } = this
    const [newHigh, highRemainder] = divModTrunc(high, divisor)
    const [newLow, remainder] = divModTrunc(highRemainder * maxLow + low, divisor)

    return [
      balanceAndCreate(newHigh, newLow),
      remainder,
    ]
  }

  toNumber(): number {
    return this.high * maxLow + this.low
  }

  toBigInt(): bigint {
    return BigInt(this.high) * BigInt(maxLow) + BigInt(this.low)
  }
}

function balanceAndCreate(high: number, low: number) {
  const [extraHigh, newLow] = divModFloor(low, maxLow)
  return new LargeInt(high + extraHigh, newLow)
}

export function numberToLargeInt(num: number): LargeInt {
  return new LargeInt(...divModFloor(num, maxLow))
}

export function bigIntToLargeInt(num: bigint): LargeInt {
  // must create BigInt lazily for if browser lacks support
  return new LargeInt(
    ...(divModFloor(num, BigInt(maxLow)).map(Number) as [number, number]),
  )
}

export function compareLargeInts(a: LargeInt, b: LargeInt): NumSign {
  return compareNumbers(a.high, b.high) || compareNumbers(a.low, b.low)
}
