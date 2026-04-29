# Calendar Intl Data Notes

## Problem 1: Hebrew Year-Start / Year-Length Around 5806/5807

### Affected Years

Hebrew years:

- 5806
- 5807

ISO range:

- around 2045-09-12 through 2047-09-20

Concrete boundary:

- test262 expects Hebrew 5807-M01-01 = ISO 2046-10-01
- ICU/polyfill treats Hebrew 5807-M01-01 = ISO 2046-10-02

### Broken Direction

Both directions are affected.

ISO -> Hebrew Y/M/D:

- ISO 2046-10-30 should be Hebrew 5807-M01-30
- ICU/polyfill reports Hebrew 5807-M01-29

Hebrew Y/M/D -> ISO:

- Hebrew 5807-M01-01 should construct ISO 2046-10-01
- ICU-scraped year data constructs around ISO 2046-10-02

### Current Hack

`daysInYearOverridesByCalendarIdBase.hebrew` has:

- `5806: 384`
- `5807: 355`

### Fixes

This fixes `daysInYear` accessors only.

### Does Not Fix

This does not fix ISO <-> Hebrew Y/M/D roundtrips around ISO 2046.

## Problem 2: Old Hebrew Internal Year-Shape / Holiday Placement

### Affected Years

Hebrew years:

- 3705
- 3952
- 4050
- 4297
- 4544
- 4642
- 4889
- 4967
- 5136
- 5214
- 5461
- 5559

ISO ranges:

- newest case is Hebrew 5559, with the affected internal-month span from 1798-11-09 through 1799-09-29
- the full table ranges from roughly 57/56 BCE through 1798/1799 CE

Concrete issue:

- ICU reports these as 385-day complete leap years with impossible kevi'ah 3C1
- the expected rule shape is a 384-day regular leap year, 3R7

### Broken Direction

Primarily Hebrew Y/M/D -> ISO and derived month/year math.

The current patch rewrites `queryYearData().monthEpochMillis`. That table is
used for constructing ISO dates from Hebrew fields and for month/year length
math.

### Current Hacks

`correctIntlYearData()`:

- moves M03/Kislev and later month starts one day earlier
- this shortens Cheshvan/M02 by one day

`daysInYearOverridesByCalendarIdBase.hebrew`:

- returns 384 for those years

### Fixes

This fixes:

- Hebrew Y/M/D -> ISO for later months in those old years
- `daysInMonth` / month-boundary math derived from the corrected table
- `daysInYear` accessors, via the paired override

### Does Not Fully Fix

This does not fully fix ISO -> Hebrew Y/M/D, because `queryFields()` still starts
from raw Intl fields unless there is a separate `correctIntlDateFields()` patch.

## Problem 3: Chinese Year-Boundary / Year-Length Accessor Mismatch

### Affected Years

Chinese years:

- 2026
- 2027
- 2029
- 2030

ISO ranges:

- around ISO 2026-02-17 through 2028-01-25
- around ISO 2029-02-13 through 2031-01-22

Concrete issue:

ICU-derived year lengths:

- 2026: 355
- 2027: 353
- 2029: 354
- 2030: 355

test262 expects:

- 2026: 354
- 2027: 354
- 2029: 355
- 2030: 354

Likely boundary mismatches:

- Chinese 2027 new year:
  - ICU/polyfill treats Chinese 2027-M01-01 = ISO 2027-02-07
  - test262 year lengths imply it may need to be ISO 2027-02-06
- Chinese 2030 new year:
  - ICU/polyfill treats Chinese 2030-M01-01 = ISO 2030-02-02
  - test262 year lengths imply it may need to be ISO 2030-02-03

### Broken Direction

Both directions are affected if test262's year lengths are treated as
authoritative calendar data.

ISO -> Chinese Y/M/D:

- around 2027-02-06 / 2027-02-07, raw ICU says:
  - ISO 2027-02-06 = Chinese 2026-M12-30
  - ISO 2027-02-07 = Chinese 2027-M01-01
- around 2030-02-01 / 2030-02-02, raw ICU says:
  - ISO 2030-02-01 = Chinese 2029-M12-29
  - ISO 2030-02-02 = Chinese 2030-M01-01

Chinese Y/M/D -> ISO:

- uses ICU-scraped month boundaries from `queryYearData()`
- those boundaries still reflect ICU's year starts, not the year lengths implied by test262

### Current Hack

`daysInYearOverridesByCalendarIdBase.chinese` has:

- `2026: 354`
- `2027: 354`
- `2029: 355`
- `2030: 354`

### Fixes

This fixes `daysInYear` accessors only.

### Does Not Fix

This does not fix:

- ISO <-> Chinese Y/M/D roundtrips around the affected new-year boundaries
- month-boundary coherence
- date construction/arithmetic that depends on `queryYearData()`

### Why Not `correctIntlYearData()` Yet

A temporary boundary-shift experiment made `daysInYear` fall out naturally, but
created inconsistent roundtrips and `Invalid protocol results` near ISO
2030-02-02. A coherent fix would need matching corrections for both scraped year
data and raw ISO -> Chinese fields, with stronger evidence about the intended
Chinese/ICU4X data.
