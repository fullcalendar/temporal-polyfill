import {
  isoDateTimeToEpochMilli,
  isoDateToEpochMilli,
} from '../internal/epochMath'
import * as errorMessages from '../internal/errorMessages'
import {
  DateTimeFormatRangeArgs,
  DateTimeFormatShellInternals,
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
import { memoize } from '../internal/utils'

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
  const ShimDateTimeFormat = createDateTimeFormatShell<Formattable>({
    createArgsProvider(internals) {
      // One Intl.DateTimeFormat per Temporal type branding; each type needs
      // distinct option filtering (e.g. dates drop time fields, times drop date
      // fields) so they can't share a single formatter.
      const getTemporalFormat = memoize(
        (branding: string): Intl.DateTimeFormat =>
          createUncachedTemporalDateTimeFormat(internals, branding),
      )

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
            throw new TypeError(errorMessages.mismatchingFormatTypes)
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
            throw new TypeError(errorMessages.mismatchingFormatTypes)
          }

          const [startBranding, startSlots] = startBrandingAndSlots
          const [endBranding, endSlots] = endBrandingAndSlots

          if (startBranding !== endBranding) {
            throw new TypeError(errorMessages.mismatchingFormatTypes)
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
  })

  return ShimDateTimeFormat as unknown as typeof Intl.DateTimeFormat
}

function createUncachedTemporalDateTimeFormat(
  internals: DateTimeFormatShellInternals,
  branding: string,
): Intl.DateTimeFormat {
  // Permit fields for other Temporal types if this type still has overlap with
  // the formatter's copied options.
  const allowPartialOverlap = true
  let options: Intl.DateTimeFormatOptions

  switch (branding) {
    case 'Instant':
      options = transformInstantOptions(
        internals.copiedOptions,
        /* allowPartialOverlap = */ allowPartialOverlap,
      )
      break
    case 'PlainDateTime':
      options = applyPlainFormatTimeZone(
        transformDateTimeOptions(
          internals.copiedOptions,
          /* allowPartialOverlap = */ allowPartialOverlap,
        ),
      )
      break
    case 'PlainDate':
      options = applyPlainFormatTimeZone(
        transformDateOptions(
          internals.copiedOptions,
          /* allowPartialOverlap = */ allowPartialOverlap,
        ),
      )
      break
    case 'PlainTime':
      options = applyPlainFormatTimeZone(
        transformTimeOptions(
          internals.copiedOptions,
          /* allowPartialOverlap = */ allowPartialOverlap,
        ),
      )
      break
    case 'PlainYearMonth':
      options = applyPlainFormatTimeZone(
        transformYearMonthOptions(
          internals.copiedOptions,
          /* allowPartialOverlap = */ allowPartialOverlap,
        ),
      )
      break
    case 'PlainMonthDay':
      options = applyPlainFormatTimeZone(
        transformMonthDayOptions(
          internals.copiedOptions,
          /* allowPartialOverlap = */ allowPartialOverlap,
        ),
      )
      break
    default:
      // Direct Intl.DateTimeFormat formatting deliberately rejects
      // ZonedDateTime; ZonedDateTime.prototype.toLocaleString formats through
      // an Instant instead.
      throw new TypeError(errorMessages.invalidFormatType(branding))
  }

  return new RawDateTimeFormat(internals.resolvedLocale, options)
}

function checkTemporalDateTimeFormatCompatible(
  format: Intl.DateTimeFormat,
  branding: string,
  slots: object,
): void {
  switch (branding) {
    case 'Instant':
    case 'PlainTime':
      return
    case 'PlainDateTime':
    case 'PlainDate':
      checkResolvedCalendarCompatible(format, slots as any)
      return
    case 'PlainYearMonth':
    case 'PlainMonthDay':
      checkResolvedCalendarCompatible(format, slots as any, true)
      return
    default:
      throw new TypeError(errorMessages.invalidFormatType(branding))
  }
}

function temporalDateTimeToEpochMilli(branding: string, slots: object): number {
  switch (branding) {
    case 'Instant':
      return getEpochMilli(slots as any)
    case 'PlainDateTime':
      return isoDateTimeToEpochMilli(slots as any)
    case 'PlainDate':
    case 'PlainYearMonth':
    case 'PlainMonthDay':
      return isoDateToEpochMilli(slots as any)
    case 'PlainTime':
      return timeFieldsToMilli(slots as any)
    default:
      throw new TypeError(errorMessages.invalidFormatType(branding))
  }
}
