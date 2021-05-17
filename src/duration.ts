export class Duration {
  constructor(
    readonly years: number,
    readonly months: number,
    readonly weeks: number,
    readonly days: number,
    readonly hours: number,
    readonly minutes: number,
    readonly seconds: number,
    readonly milliseconds: number
  ) {}

  // TODO: This needs to be thought through further
  from() {}
}
