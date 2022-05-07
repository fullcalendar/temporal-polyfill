import { nanoInMilli } from '../dateUtils/units'
import { positiveModulo } from '../utils/math'

export class NanoWrap {
  constructor(
    public milli: number,
    public nano: number,
  ) {}

  // only integers allowed
  add(n: number): NanoWrap {
    return balance(this.milli, this.nano + n)
  }

  // only integers allowed
  // needed?
  sub(n: number): NanoWrap {
    return this.add(-n)
  }

  subWrap(w: NanoWrap): NanoWrap {
    return balance(this.milli - w.milli, this.nano - w.nano)
  }

  // only integers allowed
  mult(n: number): NanoWrap {
    return balance(this.milli * n, this.nano * n)
  }

  div(n: number): NanoWrap {
    return balance(Math.trunc(this.milli / n), Math.trunc(this.nano / n))
  }

  toNumber(): number {
    return this.milli * nanoInMilli + this.nano
  }

  toBigInt(): bigint {
    return BigInt(this.milli) * BigInt(nanoInMilli) + BigInt(this.nano)
  }
}

export function ensureNanoWrap(input: bigint | NanoWrap): NanoWrap {
  if (typeof input === 'bigint') {
    const nanoInMilliBI = BigInt(nanoInMilli)
    const milliBI = input / nanoInMilliBI
    const nanoBI = input - (milliBI * nanoInMilliBI)
    return new NanoWrap(Number(milliBI), Number(nanoBI))
  }
  return input
}

function balance(milli: number, nano: number): NanoWrap {
  return new NanoWrap(
    milli + Math.floor(nano / nanoInMilli),
    positiveModulo(nano, nanoInMilli),
  )
}
