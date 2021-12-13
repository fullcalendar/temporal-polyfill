import { RawTransition, TimeZoneImpl } from './timeZoneImpl'

export class FixedTimeZoneImpl extends TimeZoneImpl {
  constructor(
    id: string,
    private offsetSecs: number,
  ) {
    super(id)
  }

  getPossibleOffsets(): number[] {
    return [this.offsetSecs]
  }

  getOffset(): number {
    return this.offsetSecs
  }

  getTransition(): RawTransition | undefined {
    return undefined
  }
}
