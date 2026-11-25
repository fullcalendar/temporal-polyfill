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
  const sections = markdown.split(/^### `([^`]+)`$/gm)

  for (let i = 1; i < sections.length; i += 2) {
    const name = sections[i]
    const body = sections[i + 1].trimStart()
    // Skip explicit "does not exist" notes (e.g. ZonedDateTime.createFormat).
    if (body.startsWith('❌')) {
      continue
    }
    helpers.push(name)
  }

  return helpers
}
