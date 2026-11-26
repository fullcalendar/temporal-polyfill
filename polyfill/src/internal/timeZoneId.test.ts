import { describe, expect, it, vi } from 'vitest'
import { queryTimeZone } from './timeZone'
import { resolveTimeZoneId, resolveTimeZoneRecord } from './timeZoneId'

describe('resolveTimeZoneRecord', () => {
  it('keeps fixed-offset zones numeric for comparison and native math', () => {
    const record = resolveTimeZoneRecord('+05:30')
    const timeZone = queryTimeZone(record.id)

    expect(record).toMatchObject({
      kind: 'fixed',
      id: '+05:30',
      offsetNano: 19_800_000_000_000,
      compareKey: 19_800_000_000_000,
    })
    expect(timeZone.getOffsetNanosecondsFor(0n)).toBe(19_800_000_000_000)
  })

  it('keeps UTC distinct from an equivalent zero-offset zone', () => {
    expect(resolveTimeZoneId('utc')).toBe('UTC')
    expect(resolveTimeZoneId('+00:00')).toBe('+00:00')
    expect(resolveTimeZoneRecord('UTC').compareKey).toBe('UTC')
    expect(resolveTimeZoneRecord('+00:00').compareKey).toBe(0)
  })

  it('preserves public IANA link IDs while comparing by host canonical ID', () => {
    const canberra = resolveTimeZoneRecord('australia/canberra')
    const sydney = resolveTimeZoneRecord('Australia/Sydney')

    expect(canberra.kind).toBe('named')
    expect(canberra.id).toBe('Australia/Canberra')
    expect(canberra.compareKey).toBe(sydney.compareKey)
  })

  it('resolves repeated named-zone queries to the same record object', () => {
    expect(resolveTimeZoneRecord('Etc/GMT')).toBe(
      resolveTimeZoneRecord('Etc/GMT'),
    )
  })

  it('resolves a repeated raw ID to the same record object, offsets included', () => {
    expect(resolveTimeZoneRecord('america/new_york')).toBe(
      resolveTimeZoneRecord('america/new_york'),
    )
    expect(resolveTimeZoneRecord('+05:30')).toBe(
      resolveTimeZoneRecord('+05:30'),
    )
  })

  it('normalizes named-zone cache keys before resolving records and impls', () => {
    expect(resolveTimeZoneRecord('etc/gmt')).toBe(
      resolveTimeZoneRecord('Etc/GMT'),
    )
    expect(queryTimeZone('etc/gmt')).toBe(queryTimeZone('Etc/GMT'))
  })

  it('passes the case-normalized IANA ID to Intl.DateTimeFormat', async () => {
    const OrigDateTimeFormat = Intl.DateTimeFormat
    const seenTimeZones: (string | undefined)[] = []

    // Mimic Hermes on iOS, which accepts exact IANA casing for link zones
    // like "US/Mountain" but throws RangeError for "US/MOUNTAIN".
    function StubDateTimeFormat(
      locales?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ) {
      seenTimeZones.push(options?.timeZone)
      if (options?.timeZone !== 'US/Mountain') {
        throw new RangeError(
          `Incorrect timeZone information provided: ${options?.timeZone}`,
        )
      }
      return new OrigDateTimeFormat(locales, options)
    }

    vi.resetModules()
    Intl.DateTimeFormat =
      StubDateTimeFormat as unknown as typeof Intl.DateTimeFormat

    try {
      const { resolveTimeZoneRecord: resolveFresh } = await import(
        './timeZoneId'
      )
      const record = resolveFresh('us/mountain')

      expect(record.kind).toBe('named')
      expect(record.id).toBe('US/Mountain')
      expect(seenTimeZones).toEqual(['US/Mountain'])
    } finally {
      Intl.DateTimeFormat = OrigDateTimeFormat
      vi.resetModules()
    }
  })
})
