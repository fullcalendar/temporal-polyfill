import { PossibleOffsetInfo, RawTransition, TimeZoneImpl } from './timeZoneImpl'

export class FixedTimeZoneImpl extends TimeZoneImpl {
  constructor(
    id: string,
    private offsetSecs: number,
  ) {
    super(id)
  }

  getPossibleOffsets(): PossibleOffsetInfo {
    return [this.offsetSecs, 0]
  }

  getOffset(): number {
    return this.offsetSecs
  }

  getTransition(): RawTransition | undefined {
    return undefined
  }
}
