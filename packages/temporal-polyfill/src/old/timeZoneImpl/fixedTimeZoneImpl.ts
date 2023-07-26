import { RawTransition, TimeZoneImpl } from './timeZoneImpl'

export class FixedTimeZoneImpl extends TimeZoneImpl {
  constructor(
    id: string,
    private offsetNano: number,
  ) {
    super(id)
  }

  getPossibleOffsets(): number[] {
    return [this.offsetNano]
  }

  getOffset(): number {
    return this.offsetNano
  }

  getTransition(): RawTransition | undefined {
    return undefined
  }
}
