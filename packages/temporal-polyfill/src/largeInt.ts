import { NumSign, compareNumbers, divModFloor, divModTrunc } from './utils'

/*
The multiplier for the `high` value. Max value for the stored `low` value.
Roughly half the number of sigfigs as Number.MAX_SAFE_INTEGER
so that Number arithmetic on the `low` value has plenty of space to overflow
before being transplanted to the `high` value.

TODO: dry DayTimeNano:
  [days, timeNano]
Should be convient for operations that need time
Should get rid of roundByIncLarge
*/
const maxLow = 1e8
const maxLowBigInt = typeof BigInt === undefined ? undefined! : BigInt(maxLow)

export class LargeInt {
  /*
  How these internal numbers are derived:
    [high, low] = divModTrunc(input, maxLow)
    (Using `trunc` results in fewer sigfigs and more precise division later)
  How these internal numbers generate real numbers:
    output = high * maxLow + low
  */
  constructor(
    public high: number,
    public low: number,
  ) {}

  addLargeInt(num: LargeInt, sign: 1 | -1 = 1): LargeInt {
    return balanceAndCreate(this.high + num.high * sign, this.low + num.low * sign)
  }

  addNumber(num: number): LargeInt {
    if (num) {
      return balanceAndCreate(this.high, this.low + num)
    }
    return this
  }

  mult(multiplier: number): LargeInt {
    // Will never conflicting newHighSign/newLowSign
    // but use balanceAndCreate anyway because it's convenient
    return balanceAndCreate(this.high * multiplier, this.low * multiplier)
  }

  divModFloor(divisor: number): [LargeInt, number] {
    return divModLarge(divModFloor, this, divisor)
  }

  divModTrunc(divisor: number): [LargeInt, number] {
    return divModLarge(divModTrunc, this, divisor)
  }

  toNumber(): number {
    return this.high * maxLow + this.low
  }

  toBigInt(): bigint {
    return BigInt(this.high) * maxLowBigInt + BigInt(this.low)
  }
}

function balanceAndCreate(high: number, low: number) {
  let [extraHigh, newLow] = divModTrunc(low, maxLow)
  let newHigh = high + extraHigh
  const newHighSign = Math.sign(newHigh)

  // ensure nonconflicting signs
  if (newHighSign && newHighSign === -Math.sign(newLow)) {
    newHigh -= newHighSign
    newLow += newHighSign * maxLow
  }

  return new LargeInt(newHigh, newLow)
}

/*
Large divisors are only allowed if few sigfigs at a high power,
otherwise `highRemainder * maxLow + low` could loose precision
*/
function divModLarge(
  divModFunc: (smallNum: number, divisor: number) => [number, number],
  num: LargeInt,
  divisor: number,
): [
  LargeInt,
  number,
] {
  const { high, low } = num
  const [newHigh, highRemainder] = divModFunc(high, divisor)
  const [newLow, remainder] = divModFunc(highRemainder * maxLow + low, divisor)

  return [
    balanceAndCreate(newHigh, newLow),
    remainder,
  ]
}

export function numberToLargeInt(num: number): LargeInt {
  return new LargeInt(...divModTrunc(num, maxLow))
}

export function bigIntToLargeInt(num: bigint): LargeInt {
  return new LargeInt(
    Number(num / maxLowBigInt), // BigInt does trunc
    Number(num % maxLowBigInt), // "
  )
}

export function compareLargeInts(a: LargeInt, b: LargeInt): NumSign {
  return compareNumbers(a.high, b.high) || compareNumbers(a.low, b.low)
}
