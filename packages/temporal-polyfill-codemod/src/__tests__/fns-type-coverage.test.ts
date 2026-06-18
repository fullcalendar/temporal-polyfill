import { describe, expect, it } from 'vitest'
import { transformSource } from '../index.js'

const rootTypes = {
  DisambiguationOptions: 'Temporal.DisambiguationOptions',
  OverflowOptions: 'Temporal.OverflowOptions',
  RoundingMathOptions: 'RoundingMathOptions',
  RoundingMode: 'RoundingMode',
}

const perPathTypes: Record<string, Record<string, string>> = {
  Calendar: {
    Record: 'string',
  },
  Instant: {
    Record: 'Temporal.Instant',
    Format: 'Intl.DateTimeFormat',
    DiffOptions: 'Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>',
    ToStringOptions: 'Temporal.InstantToStringOptions',
  },
  ZonedDateTime: {
    Record: 'Temporal.ZonedDateTime',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.ZonedDateTimeLikeObject',
    FromOptions: 'Temporal.ZonedDateTimeFromOptions',
    WithOptions: 'Temporal.ZonedDateTimeFromOptions',
    WithFields:
      'Temporal.PartialTemporalLike<Temporal.ZonedDateTimeLikeObject>',
    DiffOptions:
      'Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit | Temporal.TimeUnit>',
    ToStringOptions: 'Temporal.ZonedDateTimeToStringOptions',
    TransitionOptions: 'Temporal.TransitionOptions',
    TransitionDirection: "Temporal.TransitionOptions['direction']",
  },
  PlainDateTime: {
    Record: 'Temporal.PlainDateTime',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.DateTimeLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.DateTimeLikeObject>',
    DiffOptions:
      'Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit | Temporal.TimeUnit>',
    ToStringOptions: 'Temporal.PlainDateTimeToStringOptions',
  },
  PlainDate: {
    Record: 'Temporal.PlainDate',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.DateLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.DateLikeObject>',
    DiffOptions: 'Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>',
    ToZonedDateTimeOptions: 'Temporal.PlainDateToZonedDateTimeOptions',
    ToStringOptions: 'Temporal.PlainDateToStringOptions',
  },
  PlainTime: {
    Record: 'Temporal.PlainTime',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.TimeLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.TimeLikeObject>',
    DiffOptions: 'Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>',
    ToStringOptions: 'Temporal.PlainTimeToStringOptions',
  },
  PlainYearMonth: {
    Record: 'Temporal.PlainYearMonth',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.YearMonthLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.YearMonthLikeObject>',
    DiffOptions: "Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>",
    ToStringOptions: 'Temporal.PlainDateToStringOptions',
  },
  PlainMonthDay: {
    Record: 'Temporal.PlainMonthDay',
    Format: 'Intl.DateTimeFormat',
    FromFields: 'Temporal.DateLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.DateLikeObject>',
    ToStringOptions: 'Temporal.PlainDateToStringOptions',
  },
  Duration: {
    Record: 'Temporal.Duration',
    FromFields: 'Temporal.DurationLikeObject',
    WithFields: 'Temporal.PartialTemporalLike<Temporal.DurationLikeObject>',
    ToStringOptions: 'Temporal.DurationToStringOptions',
    RoundingUnit: "Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>",
    RoundingOptions: 'Temporal.DurationRoundingOptions',
    TotalUnit: 'Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>',
    DurationTotalOptions: 'Temporal.DurationTotalOptions',
    RelativeToOptions: 'Temporal.DurationRelativeToOptions',
  },
}

describe('fns type export mappings', () => {
  it('rewrites every documented type-only export', () => {
    const source = buildTypeSource()

    const result = transformSource(source, { path: 'input.ts' })
    const normalizedCode = normalizeWhitespace(result.code)

    expect(result.diagnostics).toEqual([])
    expect(result.needsTemporalUtils).toBe(true)
    expect(result.code).not.toContain('temporal-polyfill/fns')
    expect(result.code).toContain(
      "import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'",
    )

    for (const [typeName, target] of Object.entries(rootTypes)) {
      expect(normalizedCode).toContain(
        normalizeWhitespace(`type Root_${typeName} = ${target}`),
      )
    }

    for (const [pathName, mappings] of Object.entries(perPathTypes)) {
      for (const [typeName, target] of Object.entries(mappings)) {
        expect(normalizedCode).toContain(
          normalizeWhitespace(`type ${pathName}_${typeName}_Alias = ${target}`),
        )
      }
    }
  })

  it('rewrites ZonedDateTime FromOptions and WithOptions namespace references', () => {
    const result = transformSource(
      [
        "import type * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'",
        '',
        'type From = ZonedDateTimeFns.FromOptions',
        'type With = ZonedDateTimeFns.WithOptions',
      ].join('\n'),
      { path: 'input.ts' },
    )
    const normalizedCode = normalizeWhitespace(result.code)

    expect(result.diagnostics).toEqual([])
    expect(result.code).not.toContain('temporal-polyfill/fns')
    expect(normalizedCode).toContain(
      normalizeWhitespace('type From = Temporal.ZonedDateTimeFromOptions'),
    )
    expect(normalizedCode).toContain(
      normalizeWhitespace('type With = Temporal.ZonedDateTimeFromOptions'),
    )
  })
})

function buildTypeSource(): string {
  const rootImport = `import type { ${Object.keys(rootTypes).join(
    ', ',
  )} } from 'temporal-polyfill/fns'`
  const perPathImports = Object.entries(perPathTypes).map(
    ([pathName, mappings]) => {
      const imports = Object.keys(mappings)
        .map((typeName) => `${typeName} as ${pathName}_${typeName}`)
        .join(', ')
      return `import type { ${imports} } from 'temporal-polyfill/fns/${pathName}'`
    },
  )
  const rootAliases = Object.keys(rootTypes).map(
    (typeName) => `type Root_${typeName} = ${typeName}`,
  )
  const perPathAliases = Object.entries(perPathTypes).flatMap(
    ([pathName, mappings]) =>
      Object.keys(mappings).map(
        (typeName) =>
          `type ${pathName}_${typeName}_Alias = ${pathName}_${typeName}`,
      ),
  )

  return [
    rootImport,
    ...perPathImports,
    '',
    ...rootAliases,
    ...perPathAliases,
  ].join('\n')
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
