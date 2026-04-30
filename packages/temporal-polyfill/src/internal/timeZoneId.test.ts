import { describe, expect, it } from 'vitest'
import { numberToBigNano } from './bigNano'
import {
  getTimeZoneAtomic,
  resolveTimeZoneId,
  resolveTimeZoneRecord,
} from './timeZoneId'
import { queryTimeZone } from './timeZoneImpl'

describe('resolveTimeZoneRecord', () => {
  it('keeps fixed-offset zones numeric for comparison and native math', () => {
    const record = resolveTimeZoneRecord('+05:30')
    const timeZoneImpl = queryTimeZone(record.id)

    expect(record).toMatchObject({
      kind: 'fixed',
      id: '+05:30',
      offsetNano: 19_800_000_000_000,
      compareKey: 19_800_000_000_000,
    })
    expect(timeZoneImpl.getOffsetNanosecondsFor(numberToBigNano(0))).toBe(
      19_800_000_000_000,
    )
  })

  it('keeps UTC distinct from an equivalent zero-offset zone', () => {
    expect(resolveTimeZoneId('utc')).toBe('UTC')
    expect(resolveTimeZoneId('+00:00')).toBe('+00:00')
    expect(getTimeZoneAtomic('UTC')).toBe('UTC')
    expect(getTimeZoneAtomic('+00:00')).toBe(0)
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
})
