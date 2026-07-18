import {
  InstantBranding,
  PlainDateBranding,
  PlainDateTimeBranding,
  PlainMonthDayBranding,
  PlainTimeBranding,
  PlainYearMonthBranding,
} from '../apiHelpers/branding'
import {
  isoDateTimeToEpochMilli,
  isoDateToEpochMilli,
} from '../internal/epochMath'
import * as errorMessages from '../internal/errorMessages'
import {
  DateTimeFormatRangeArgs,
  createDateTimeFormatShell,
} from '../internal/intlDateTimeFormatShell'
import {
  applyPlainFormatTimeZone,
  checkResolvedCalendarCompatible,
} from '../internal/intlFormatArgs'
import {
  transformDateOptions,
  transformDateTimeOptions,
  transformInstantOptions,
  transformMonthDayOptions,
  transformTimeOptions,
  transformYearMonthOptions,
} from '../internal/intlFormatOptions'
import { RawDateTimeFormat, RawFormattable } from '../internal/intlFormatUtils'
import { getEpochMilli } from '../internal/slots'
import { timeFieldsToMilli } from '../internal/timeFieldMath'
import { memoize, throwTypeError } from '../internal/utils'

// Temporal values are detected by internal slot branding at runtime, so this
// shared Intl wrapper doesn't need to import branch-local public classes.
export type TemporalFormattable = object

export type Formattable = TemporalFormattable | RawFormattable
export type TemporalBrandingAndSlots<S = object> = [branding: string, slots: S]

export function createDateTimeFormatClass(
  getTemporalBrandingAndSlots: (
    obj: unknown,
  ) => TemporalBrandingAndSlots | undefined,
): typeof Intl.DateTimeFormat {
  const ShimDateTimeFormat = createDateTimeFormatShell<Formattable>(
    (internals) => {
      // One Intl.DateTimeFormat per Temporal type branding; each type needs
      // distinct option filtering (e.g. dates drop time fields, times drop date
      // fields) so they can't share a single formatter.
      const getTemporalFormat = memoize((branding: string) => {
        // Permit fields for other Temporal types if this type still has overlap
        // with the formatter's copied options.
        const allowPartialOverlap = true
        let options: Intl.DateTimeFormatOptions

        switch (branding) {
          case InstantBranding:
            options = transformInstantOptions(
              internals.copiedOptions,
              /* allowPartialOverlap = */ allowPartialOverlap,
            )
            break
          case PlainDateTimeBranding:
            options = applyPlainFormatTimeZone(
              transformDateTimeOptions(
                internals.copiedOptions,
                /* allowPartialOverlap = */ allowPartialOverlap,
              ),
            )
            break
          case PlainDateBranding:
            options = applyPlainFormatTimeZone(
              transformDateOptions(
                internals.copiedOptions,
                /* allowPartialOverlap = */ allowPartialOverlap,
              ),
            )
            break
          case PlainTimeBranding:
            options = applyPlainFormatTimeZone(
              transformTimeOptions(
                internals.copiedOptions,
                /* allowPartialOverlap = */ allowPartialOverlap,
              ),
            )
            break
          case PlainYearMonthBranding:
            options = applyPlainFormatTimeZone(
              transformYearMonthOptions(
                internals.copiedOptions,
                /* allowPartialOverlap = */ allowPartialOverlap,
              ),
            )
            break
          case PlainMonthDayBranding:
            options = applyPlainFormatTimeZone(
              transformMonthDayOptions(
                internals.copiedOptions,
                /* allowPartialOverlap = */ allowPartialOverlap,
              ),
            )
            break
          default:
            // Direct Intl.DateTimeFormat formatting deliberately rejects
            // ZonedDateTime; ZonedDateTime.prototype.toLocaleString formats
            // through an Instant instead.
            throwTypeError(errorMessages.invalidFormatType(branding))
        }

        return new RawDateTimeFormat(internals.resolvedLocale, options)
      })

      return {
        getArgsForSingle(formattable) {
          if (formattable === undefined) {
            // .format(undefined) and .formatToParts(undefined) match native Intl
            // and format the current time.
            return [internals.baseFormat]
          }

          const brandingAndSlots = getTemporalBrandingAndSlots(formattable)
          if (!brandingAndSlots) {
            return [internals.baseFormat, Number(formattable)]
          }

          const [branding, slots] = brandingAndSlots
          const format = getTemporalFormat(branding)
          checkTemporalDateTimeFormatCompatible(format, branding, slots)
          return [format, temporalDateTimeToEpochMilli(branding, slots)]
        },
        getArgsForRange(start, end): DateTimeFormatRangeArgs {
          if (start === undefined || end === undefined) {
            // ECMA-402 requires both range endpoints before it can check type
            // compatibility. Use the same error as mixed Temporal/non-Temporal input.
            throwTypeError(errorMessages.mismatchingFormatTypes)
          }

          const startBrandingAndSlots = getTemporalBrandingAndSlots(start)
          const startEpochMilli = startBrandingAndSlots
            ? undefined
            : Number(start)
          const endBrandingAndSlots = getTemporalBrandingAndSlots(end)
          const endEpochMilli = endBrandingAndSlots ? undefined : Number(end)

          if (!startBrandingAndSlots && !endBrandingAndSlots) {
            return [internals.baseFormat, startEpochMilli!, endEpochMilli!]
          }

          if (!startBrandingAndSlots || !endBrandingAndSlots) {
            // ToDateTimeFormattable first converts all non-Temporal values.
            // Only after that can range formatting reject mixed
            // Temporal/non-Temporal input.
            throwTypeError(errorMessages.mismatchingFormatTypes)
          }

          const [startBranding, startSlots] = startBrandingAndSlots
          const [endBranding, endSlots] = endBrandingAndSlots

          if (startBranding !== endBranding) {
            throwTypeError(errorMessages.mismatchingFormatTypes)
          }

          const format = getTemporalFormat(startBranding)
          checkTemporalDateTimeFormatCompatible(
            format,
            startBranding,
            startSlots,
          )
          checkTemporalDateTimeFormatCompatible(format, startBranding, endSlots)
          return [
            format,
            temporalDateTimeToEpochMilli(startBranding, startSlots),
            temporalDateTimeToEpochMilli(startBranding, endSlots),
          ]
        },
      }
    },
  )

  return ShimDateTimeFormat as unknown as typeof Intl.DateTimeFormat
}

function checkTemporalDateTimeFormatCompatible(
  format: Intl.DateTimeFormat,
  branding: string,
  slots: object,
): void {
  switch (branding) {
    case InstantBranding:
    case PlainTimeBranding:
      return
    case PlainDateTimeBranding:
    case PlainDateBranding:
      checkResolvedCalendarCompatible(format, slots as any)
      return
    case PlainYearMonthBranding:
    case PlainMonthDayBranding:
      checkResolvedCalendarCompatible(format, slots as any, true)
      return
    default:
      throwTypeError(errorMessages.invalidFormatType(branding))
  }
}

function temporalDateTimeToEpochMilli(branding: string, slots: object): number {
  switch (branding) {
    case InstantBranding:
      return getEpochMilli(slots as any)
    case PlainDateTimeBranding:
      return isoDateTimeToEpochMilli(slots as any)
    case PlainDateBranding:
    case PlainYearMonthBranding:
    case PlainMonthDayBranding:
      return isoDateToEpochMilli(slots as any)
    case PlainTimeBranding:
      return timeFieldsToMilli(slots as any)
    default:
      throwTypeError(errorMessages.invalidFormatType(branding))
  }
}
