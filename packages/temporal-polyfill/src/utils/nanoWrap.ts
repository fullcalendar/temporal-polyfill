import { nanoInMilli } from '../dateUtils/units'

export class NanoWrap {
  constructor(
    // always have same sign
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
    const milliFloat = this.milli / n
    const milliInt = Math.trunc(milliFloat)
    const milliUnder = Math.trunc((milliFloat - milliInt) * nanoInMilli)
    const nano = Math.trunc(this.nano / n) + milliUnder
    return balance(milliInt, nano)
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
    return new NanoWrap(
      Number(input / nanoInMilliBI), // does trunc
      Number(input % nanoInMilliBI),
    )
  }
  return input
}

function balance(milli: number, nano: number): NanoWrap {
  return new NanoWrap(
    milli + Math.trunc(nano / nanoInMilli),
    nano % nanoInMilli,
  )
}
