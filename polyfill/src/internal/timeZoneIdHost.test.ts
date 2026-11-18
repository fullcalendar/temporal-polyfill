import { afterEach, describe, expect, it, vi } from 'vitest'

const RealDateTimeFormat = Intl.DateTimeFormat

// Mimics Hermes on iOS: zone identifiers are only accepted in the case that
// Apple's list of known zone names uses, and any other spelling throws.
class CanonicalCaseOnlyDateTimeFormat extends RealDateTimeFormat {
  constructor(...args: ConstructorParameters<typeof RealDateTimeFormat>) {
    const timeZone = args[1]?.timeZone as string | undefined
    if (
      typeof timeZone === 'string' &&
      timeZone === timeZone.toUpperCase() &&
      timeZone !== timeZone.toLowerCase()
    ) {
      throw new RangeError(
        `Incorrect timeZone information provided: ${timeZone}`,
      )
    }

    super(...args)
  }
}

function stubHostIntl(): void {
  const fakeIntl = Object.create(Intl) as typeof Intl
  Object.defineProperty(fakeIntl, 'DateTimeFormat', {
    value: CanonicalCaseOnlyDateTimeFormat,
    writable: true,
    configurable: true,
  })
  vi.stubGlobal('Intl', fakeIntl)
}

describe('time zone identifiers on a host that rejects upper-cased IDs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('creates the Intl format with the normalized identifier', async () => {
    stubHostIntl()
    vi.resetModules()

    const { resolveTimeZoneId } = await import('./timeZoneId')
    expect(resolveTimeZoneId('US/Mountain')).toBe('US/Mountain')
  })

  it('still rejects an unknown identifier', async () => {
    stubHostIntl()
    vi.resetModules()

    const { resolveTimeZoneId } = await import('./timeZoneId')
    expect(() => resolveTimeZoneId('Not/AZone')).toThrow(RangeError)
  })
})
