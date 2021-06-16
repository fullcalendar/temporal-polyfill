export const format = (
  tokenStr: string,
  ms: number,
  locale = 'en-us',
  options?: Intl.DateTimeFormatOptions
): string => {
  const matches: { [key: string]: Intl.DateTimeFormatOptions } = {
    YY: { year: '2-digit' },
    YYYY: { year: 'numeric' },
    M: { month: 'numeric' },
    MM: { month: '2-digit' },
    MMM: { month: 'short' },
    MMMM: { month: 'long' },
    D: { day: 'numeric' },
    DD: { day: '2-digit' },
    // d: Numeric day of week,
    dd: { weekday: 'narrow' },
    ddd: { weekday: 'short' },
    dddd: { weekday: 'long' },
    H: { hour: 'numeric', hour12: false },
    HH: { hour: '2-digit', hour12: false },
    h: { hour: 'numeric', hour12: true },
    hh: { hour: '2-digit', hour12: true },
    // a: am / pm,
    // A: AM / PM,
    m: { minute: 'numeric' },
    mm: { minute: '2-digit' },
    s: { second: 'numeric' },
    ss: { second: '2-digit' },
    SSS: { second: 'numeric', fractionalSecondDigits: 3 },
    Z: { timeZoneName: 'short' },
    ZZ: { timeZoneName: 'long' },
  }
  const tokenOptions = Object.keys(matches).reduce(
    (acc: Intl.DateTimeFormatOptions, val) => {
      // Match parts of matches object from string
      // If there's a match, append its formatter options
      if (tokenStr.includes(val)) {
        return { ...acc, ...matches[val] }
      }
      return acc
    },
    {}
  )

  // Create a format by merging user's options with token string's options
  const parts = Intl.DateTimeFormat(locale, {
    timeZone: 'UTC', // TODO Shouldn't forcefully set the timeZone
    ...tokenOptions,
    ...options,
  })
    .formatToParts(ms)
    .reduce((acc: Record<string, string>, { type, value }) => {
      // Convert from an array of objects to an object with keys for year/month/day/etc.
      return {
        ...acc,
        [type]: value,
      }
    }, {})

  // TODO There's probably a better way to do this
  return tokenStr
    .replace(/Y{2,4}/, parts.year)
    .replace(/M{1,4}/, parts.month)
    .replace(/D{1,2}/, parts.day)
    .replace(/d{2,4}/, parts.weekday)
    .replace(/[Hh]{1,2}/, parts.hour)
    .replace(/m{1,2}/, parts.minute)
    .replace(/s{1,2}|SSS/, parts.second)
    .replace(/Z{1,2}/, parts.timeZoneName)
}
