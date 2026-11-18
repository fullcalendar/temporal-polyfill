import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const RealDateTimeFormat = Intl.DateTimeFormat

// Zone identifiers this fake host rejects, emulating the case-sensitive
// lookups Hermes on iOS performs for a few IANA links (meta/hermes#2323).
let rejectedZones: Set<string>

// Records the identifiers the polyfill passes to the host so a test can
// assert which spelling was tried.
let seenZones: string[]

class PickyDateTimeFormat extends RealDateTimeFormat {
  constructor(...args: ConstructorParameters<typeof RealDateTimeFormat>) {
    const timeZone = args[1]?.timeZone as string | undefined
    if (typeof timeZone === 'string') {
      seenZones.push(timeZone)
      if (rejectedZones.has(timeZone)) {
        throw new RangeError(
          `Incorrect timeZone information provided: ${timeZone}`,
        )
      }
    }

    super(...args)
  }
}

function stubHostIntl(): void {
  const fakeIntl = Object.create(Intl) as typeof Intl
  Object.defineProperty(fakeIntl, 'DateTimeFormat', {
    value: PickyDateTimeFormat,
    writable: true,
    configurable: true,
  })
  vi.stubGlobal('Intl', fakeIntl)
}

describe('time zone identifiers on a case-sensitive host', () => {
  beforeEach(() => {
    rejectedZones = new Set()
    seenZones = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('tries the normalized identifier first', async () => {
    // Hermes rejects the upper-cased spelling of this IANA link.
    rejectedZones.add('US/MOUNTAIN')
    stubHostIntl()
    vi.resetModules()

    const { resolveTimeZoneId } = await import('./timeZoneId')
    expect(resolveTimeZoneId('US/Mountain')).toBe('US/Mountain')
    expect(seenZones).toContain('US/Mountain')
  })

  it('falls back to the upper-cased identifier when the host rejects the normalized one', async () => {
    rejectedZones.add('America/New_York')
    stubHostIntl()
    vi.resetModules()

    const { resolveTimeZoneId } = await import('./timeZoneId')
    expect(resolveTimeZoneId('America/New_York')).toBe('America/New_York')
    expect(seenZones).toEqual(['America/New_York', 'AMERICA/NEW_YORK'])
  })

  it('still rejects an unknown identifier', async () => {
    stubHostIntl()
    vi.resetModules()

    const { resolveTimeZoneId } = await import('./timeZoneId')
    expect(() => resolveTimeZoneId('Not/AZone')).toThrow(RangeError)
  })
})
