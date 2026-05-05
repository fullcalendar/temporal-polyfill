const islamicCalendarFallbackIds = [
  'islamic-civil',
  'islamic-tbla',
  'islamic-umalqura',
] as const
const islamicFallbackProbeEpochMillis = [
  Date.UTC(2024, 0, 1),
  Date.UTC(2024, 5, 15),
  Date.UTC(2025, 2, 30),
]
const resolvedCalendarFallbackCache = new Map<string, string>()

export function resolveDateTimeFormatCalendarId(
  locale: string,
  calendarId: string,
  rawDateTimeFormat: typeof Intl.DateTimeFormat,
): string | undefined {
  if (calendarId !== 'islamic' && calendarId !== 'islamic-rgsa') {
    return undefined
  }

  const cacheKey = `${locale}\u0000${calendarId}`
  let fallbackCalendar = resolvedCalendarFallbackCache.get(cacheKey)

  if (!fallbackCalendar) {
    fallbackCalendar = detectIslamicCalendarFallback(
      locale,
      calendarId,
      rawDateTimeFormat,
    )
    resolvedCalendarFallbackCache.set(cacheKey, fallbackCalendar)
  }

  return fallbackCalendar
}

function detectIslamicCalendarFallback(
  locale: string,
  calendarId: string,
  rawDateTimeFormat: typeof Intl.DateTimeFormat,
): string {
  const expectedOutputs = computeCalendarProbeOutputs(
    locale,
    calendarId,
    rawDateTimeFormat,
  )

  for (let i = 0; i < islamicCalendarFallbackIds.length; i++) {
    const candidateCalendar = islamicCalendarFallbackIds[i]
    const candidateOutputs = computeCalendarProbeOutputs(
      locale,
      candidateCalendar,
      rawDateTimeFormat,
    )

    // Intl exposes broad aliases like `islamic` and `islamic-rgsa`, but
    // Temporal calendar IDs need a concrete algorithm. Compare several stable
    // dates so the addon can report the concrete calendar the host is using.
    let matches = true
    for (let j = 0; j < expectedOutputs.length; j++) {
      if (candidateOutputs[j] !== expectedOutputs[j]) {
        matches = false
        break
      }
    }

    if (matches) {
      return candidateCalendar
    }
  }

  return islamicCalendarFallbackIds[0]
}

function computeCalendarProbeOutputs(
  locale: string,
  calendarId: string,
  rawDateTimeFormat: typeof Intl.DateTimeFormat,
): string[] {
  const format = new rawDateTimeFormat(locale, {
    calendar: calendarId,
    timeZone: 'UTC',
    era: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const outputs: string[] = []

  for (let i = 0; i < islamicFallbackProbeEpochMillis.length; i++) {
    outputs[i] = format.format(islamicFallbackProbeEpochMillis[i])
  }

  return outputs
}
