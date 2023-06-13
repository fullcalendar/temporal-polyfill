import { compareNumbers, divMod } from './utils'

const maxLow = 1e8 // exclusive // TODO: explain why

export class LargeInt {
  constructor(high, low) {
    this.high = high
    this.low = low
  }

  addLargeInt(n, sign = 1) {
    return balanceAndCreate(this.high + n.high * sign, this.low + n.low * sign)
  }

  add(n) {
    return balanceAndCreate(this.high, this.low + n)
  }

  mult(multiplier) {
    return balanceAndCreate(this.high * multiplier, this.low * multiplier)
  }

  divMod(divisor) {
    const { high, low } = this
    const [newHigh, highRemainder] = divMod(high, divisor)
    const [newLow, remainder] = divMod(highRemainder * maxLow + low, divisor)

    return [
      balanceAndCreate(newHigh, newLow),
      remainder,
    ]
  }

  divModTrunc(divisor) { // TODO: rename a lot of stuff?
    let [largeInt, remainder] = this.divMod(divisor)

    if (largeInt.computeSign() === -1 && remainder) {
      largeInt = largeInt.add(1)
      remainder -= divisor
    }

    return [largeInt, remainder]
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
  const [extraHigh, newLow] = divMod(low, maxLow)
  return new LargeInt(high + extraHigh, newLow)
}

export function numberToLargeInt(n) {
  return new LargeInt(...divMod(n, maxLow))
}

export function bigIntToLargeInt(n) {
  // must create BigInt lazily for if browser lacks support
  return new LargeInt(...divMod(n, BigInt(maxLow)).map(Number))
}

export function compareLargeInts(a, b) {
  return compareNumbers(a.high, b.high) || compareNumbers(a.low, b.low)
}
