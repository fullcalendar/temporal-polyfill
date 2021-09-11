import { PossibleOffsetInfo, RawTransition, TimeZoneImpl } from './timeZoneImpl'

export class FixedTimeZoneImpl implements TimeZoneImpl {
  constructor(
    private offsetMins: number,
  ) {}

  getPossibleOffsets(): PossibleOffsetInfo {
    return [this.offsetMins, 0]
  }

  getOffset(): number {
    return this.offsetMins
  }

  getTransition(): RawTransition | undefined {
    return undefined
  }
}
