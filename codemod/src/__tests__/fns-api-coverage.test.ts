import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fnsApiCoverage } from '../fns-api-coverage.js'

const docsDir = join('..', 'docs', 'fns')
const docFileByType: Record<string, string> = {
  Calendar: 'calendar.md',
  Instant: 'instant.md',
  ZonedDateTime: 'zoneddatetime.md',
  PlainDateTime: 'plaindatetime.md',
  PlainDate: 'plaindate.md',
  PlainTime: 'plaintime.md',
  PlainYearMonth: 'plainyearmonth.md',
  PlainMonthDay: 'plainmonthday.md',
  Duration: 'duration.md',
  Now: 'now.md',
}

describe('fns API coverage table', () => {
  it('classifies every documented runtime fns helper', () => {
    for (const [typeName, docFile] of Object.entries(docFileByType)) {
      const documentedHelpers = readDocumentedHelpers(docFile)
      const classifiedHelpers = Object.keys(fnsApiCoverage[typeName] ?? {})

      expect(classifiedHelpers.sort(), typeName).toEqual(
        documentedHelpers.sort(),
      )
    }
  })
})

function readDocumentedHelpers(docFile: string): string[] {
  const markdown = readFileSync(join(docsDir, docFile), 'utf8')
  const helpers: string[] = []
  const headingPattern = /^### `([^`]+)`$/gm
  let match: RegExpExecArray | null

  while ((match = headingPattern.exec(markdown)) != null) {
    helpers.push(match[1])
  }

  return helpers
}
