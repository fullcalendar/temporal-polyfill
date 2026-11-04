import { describe, expect, it, vi } from 'vitest'
import { getCurrentTimeZoneId } from './current'
import { RawDateTimeFormat } from './intlFormatUtils'

describe('getCurrentTimeZoneId', () => {
  it('falls back to UTC when Intl reports no system time zone', () => {
    const { resolvedOptions } = RawDateTimeFormat.prototype
    const spy = vi
      .spyOn(RawDateTimeFormat.prototype, 'resolvedOptions')
      .mockImplementation(function (this: Intl.DateTimeFormat) {
        return {
          ...resolvedOptions.call(this),
          timeZone: undefined as unknown as string,
        }
      })

    try {
      expect(getCurrentTimeZoneId()).toBe('UTC')
    } finally {
      spy.mockRestore()
    }
  })
})
