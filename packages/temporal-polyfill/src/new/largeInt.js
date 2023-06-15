import { compareNumbers, divFloorMod } from './utils'

const maxLow = 1e8 // exclusive // TODO: explain why

export class LargeInt {
  constructor(high, low) {
    this.high = high
    this.low = low
  }

  addLargeInt(n, sign = 1) {
    return balanceAndCreate(this.high + n.high * sign, this.low + n.low * sign)
  }

  /*
  different than PlainTime/Duration::add, for minification
  */
  addNumber(n) {
    return balanceAndCreate(this.high, this.low + n)
  }

  mult(multiplier) {
    return balanceAndCreate(this.high * multiplier, this.low * multiplier)
  }

  divFloorMod(divisor) {
    const { high, low } = this
    const [newHigh, highRemainder] = divFloorMod(high, divisor)
    const [newLow, remainder] = divFloorMod(highRemainder * maxLow + low, divisor)

    return [
      balanceAndCreate(newHigh, newLow),
      remainder,
    ]
  }

  divTruncMod(divisor) {
    let [whole, remainder] = this.divFloorMod(divisor)

    if (whole.computeSign() === -1 && remainder) {
      whole = whole.addNumber(1)
      remainder -= divisor
    }

    return [whole, remainder]
  }

  mod2() {
    return (this.low % 2) * this.computeSign()
  }

  /*
  different than Duration::sign, for minification
  */
  computeSign() {
    return Math.sign(this.high) || Math.sign(this.low)
  }

  toNumber() {
    return this.high * maxLow + this.low
  }

  toBigInt() {
    return BigInt(this.high) * BigInt(maxLow) + BigInt(this.low)
  }
}

function balanceAndCreate(high, low) {
  const [extraHigh, newLow] = divFloorMod(low, maxLow)
  return new LargeInt(high + extraHigh, newLow)
}

export function numberToLargeInt(n) {
  return new LargeInt(...divFloorMod(n, maxLow))
}

export function bigIntToLargeInt(n) {
  // must create BigInt lazily for if browser lacks support
  return new LargeInt(...divFloorMod(n, BigInt(maxLow)).map(Number))
}

export function compareLargeInts(a, b) {
  return compareNumbers(a.high, b.high) || compareNumbers(a.low, b.low)
}
