import { PossibleOffsetInfo, RawTransition, TimeZoneImpl } from './timeZoneImpl'

export class FixedTimeZoneImpl extends TimeZoneImpl {
  constructor(
    id: string,
    private offsetMins: number,
  ) {
    super(id)
  }

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
