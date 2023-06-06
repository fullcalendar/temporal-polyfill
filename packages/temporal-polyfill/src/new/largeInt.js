import { compareNumbers, divMod } from './util'

const maxLow = 1e8 // exclusive // TODO: explain why
const maxLowBigInt = typeof BigInt !== 'undefined' && BigInt(maxLow)

export class LargeInt {
  constructor(high, low) {
    this.high = high
    this.low = low
  }

  addLargeInt(n) {
    return balanceAndCreate(this.high + n.high, this.low + n.low)
  }

  add(n) {
    return balanceAndCreate(this.high, this.low + n)
  }

  mult(multiplier) {
    return balanceAndCreate(this.high * multiplier, this.low * multiplier)
  }

  divMod(divisor, preserveLargeInt) {
    const { high, low } = this
    const [newHigh, highRemainder] = divMod(high, divisor)
    const [newLow, remainder] = divMod(highRemainder * maxLow + low, divisor)

    return [
      preserveLargeInt
        ? balanceAndCreate(newHigh, newLow)
        : newHigh * maxLow + newLow,
      remainder,
    ]
  }

  toNumber() {
    return this.high * maxLow + this.low
  }

  toBigInt() {
    return BigInt(this.high) * maxLowBigInt + BigInt(this.low)
  }
}

function balanceAndCreate(high, low) {
  const [extraHigh, newLow] = divMod(low, maxLow)
  return new LargeInt(high + extraHigh, newLow)
}

export function numberToLargeInt(n) {
  return new LargeInt(...divMod(n, maxLow))
}

export function bigIntToLargeInt(n) {
  return new LargeInt(...divMod(n, maxLowBigInt).map(Number))
}

export function compareLargeInts(a, b) {
  return compareNumbers(a.high, b.high) || compareNumbers(a.low, b.low)
}
