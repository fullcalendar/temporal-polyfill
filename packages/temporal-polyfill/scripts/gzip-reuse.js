#!/usr/bin/env node

import { gzipSync } from 'zlib'
import { readFile } from 'fs/promises'

const defaultOptions = {
  candidates: 128,
  maxLen: 258,
  minLen: 8,
  tokenBytes: 3,
  top: 40,
  window: 32768,
}

const { filePath, json, options } = parseArgs(process.argv.slice(2))

displayGzipReuse(filePath, options, json)

async function displayGzipReuse(filePath, options, json) {
  const bytes = await readFile(filePath)
  const gzipBytes = gzipSync(bytes)
  const matches = findApproxLz77Matches(bytes, options)
  const rows = buildPhraseRows(bytes, matches, options)
  const matchedBytes = matches.reduce((sum, match) => sum + match.len, 0)
  const estimatedSaved = matches.reduce(
    (sum, match) => sum + estimateMatchSavedBytes(match.len, options),
    0,
  )
  const summary = {
    file: filePath,
    rawBytes: bytes.length,
    gzipBytes: gzipBytes.length,
    gzipRatio: gzipBytes.length / bytes.length,
    lzMatches: matches.length,
    matchedBytes,
    matchedPct: matchedBytes / bytes.length,
    estimatedSaved,
    tokenBytes: options.tokenBytes,
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          summary,
          rows: rows.slice(0, options.top).map(formatJsonRow),
        },
        null,
        2,
      ),
    )
    return
  }

  console.log(`File: ${summary.file}`)
  console.log(`Raw bytes: ${summary.rawBytes}`)
  console.log(`Gzip bytes: ${summary.gzipBytes}`)
  console.log(`Gzip ratio: ${formatPct(summary.gzipRatio)}`)
  console.log(`Approx LZ matches: ${summary.lzMatches}`)
  console.log(
    `Approx matched bytes: ${summary.matchedBytes} (${formatPct(
      summary.matchedPct,
    )})`,
  )
  console.log(
    `Estimated saved bytes: ${summary.estimatedSaved} (match length - ${options.tokenBytes} byte token estimate)`,
  )
  console.log()
  console.log(
    [
      padLeft('estSave', 8),
      padLeft('matchB', 7),
      padLeft('lzUses', 6),
      padLeft('occurs', 6),
      padLeft('maxLen', 6),
      'phrase',
    ].join('  '),
  )

  for (const row of rows.slice(0, options.top)) {
    console.log(
      [
        padLeft(row.estimatedSaved, 8),
        padLeft(row.matchedBytes, 7),
        padLeft(row.lzUses, 6),
        padLeft(row.sourceOccurrences, 6),
        padLeft(row.maxLen, 6),
        formatBytes(row.phraseBytes),
      ].join('  '),
    )
  }
}

function findApproxLz77Matches(bytes, options) {
  const table = new Map()
  const matches = []

  let pos = 0
  while (pos < bytes.length) {
    const match = findBestMatch(bytes, pos, table, options)

    if (match.len >= 3) {
      matches.push(match)
      addRangeToTable(bytes, table, pos, match.len, options)
      pos += match.len
    } else {
      addRangeToTable(bytes, table, pos, 1, options)
      pos += 1
    }
  }

  return matches
}

function findBestMatch(bytes, pos, table, options) {
  let bestLen = 0
  let bestDist = 0

  if (pos + 3 > bytes.length) {
    return { pos, len: 0, dist: 0 }
  }

  const prevPositions = table.get(readTripletKey(bytes, pos)) || []
  let checked = 0

  for (
    let i = prevPositions.length - 1;
    i >= 0 && checked < options.candidates;
    i -= 1
  ) {
    checked += 1

    const prevPos = prevPositions[i]
    const dist = pos - prevPos
    if (dist <= 0 || dist > options.window) {
      continue
    }

    const len = countMatchingBytes(bytes, prevPos, pos, options.maxLen)
    if (len > bestLen) {
      bestLen = len
      bestDist = dist
    }
  }

  return { pos, len: bestLen, dist: bestDist }
}

function countMatchingBytes(bytes, prevPos, pos, maxLen) {
  const limit = Math.min(maxLen, bytes.length - pos)
  let len = 0

  while (len < limit && bytes[prevPos + len] === bytes[pos + len]) {
    len += 1
  }

  return len
}

function addRangeToTable(bytes, table, pos, len, options) {
  for (let i = 0; i < len; i += 1) {
    const entryPos = pos + i
    if (entryPos + 3 > bytes.length) {
      continue
    }

    const key = readTripletKey(bytes, entryPos)
    let positions = table.get(key)
    if (!positions) {
      positions = []
      table.set(key, positions)
    }

    positions.push(entryPos)

    while (positions.length && entryPos - positions[0] > options.window) {
      positions.shift()
    }
  }
}

function buildPhraseRows(bytes, matches, options) {
  const phraseMap = new Map()

  for (const match of matches) {
    if (match.len < options.minLen) {
      continue
    }

    const phraseBytes = bytes.subarray(match.pos, match.pos + match.len)
    const key = phraseBytes.toString('base64')
    let row = phraseMap.get(key)

    if (!row) {
      row = {
        phraseBytes,
        lzUses: 0,
        matchedBytes: 0,
        estimatedSaved: 0,
        maxLen: 0,
      }
      phraseMap.set(key, row)
    }

    row.lzUses += 1
    row.matchedBytes += match.len
    row.estimatedSaved += estimateMatchSavedBytes(match.len, options)
    row.maxLen = Math.max(row.maxLen, match.len)
  }

  return [...phraseMap.values()]
    .map((row) => ({
      ...row,
      sourceOccurrences: countOccurrences(bytes, row.phraseBytes),
    }))
    .sort((a, b) => {
      return (
        b.estimatedSaved - a.estimatedSaved ||
        b.matchedBytes - a.matchedBytes ||
        b.lzUses - a.lzUses
      )
    })
}

function estimateMatchSavedBytes(len, options) {
  return Math.max(0, len - options.tokenBytes)
}

function countOccurrences(bytes, phraseBytes) {
  let count = 0
  let pos = 0

  while (pos <= bytes.length - phraseBytes.length) {
    const foundPos = bytes.indexOf(phraseBytes, pos)
    if (foundPos === -1) {
      break
    }

    count += 1
    pos = foundPos + 1
  }

  return count
}

function readTripletKey(bytes, pos) {
  return (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2]
}

function parseArgs(argv) {
  const options = { ...defaultOptions }
  let filePath = 'dist/.global.min.js'
  let json = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    switch (arg) {
      case '--':
        break
      case '--candidates':
        options.candidates = readPositiveInt(argv, (i += 1), arg)
        break
      case '--json':
        json = true
        break
      case '--max-len':
        options.maxLen = readPositiveInt(argv, (i += 1), arg)
        break
      case '--min-len':
        options.minLen = readPositiveInt(argv, (i += 1), arg)
        break
      case '--token-bytes':
        options.tokenBytes = readPositiveInt(argv, (i += 1), arg)
        break
      case '--top':
        options.top = readPositiveInt(argv, (i += 1), arg)
        break
      case '--window':
        options.window = readPositiveInt(argv, (i += 1), arg)
        break
      case '-h':
        displayHelp()
        process.exit(0)
        break
      case '--help':
        displayHelp()
        process.exit(0)
        break
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`)
        }
        filePath = arg
    }
  }

  return { filePath, json, options }
}

function readPositiveInt(argv, index, optionName) {
  const raw = argv[index]
  const num = Number(raw)

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`Expected positive integer after ${optionName}`)
  }

  return num
}

function displayHelp() {
  console.log(`Usage: scripts/gzip-reuse.js [file] [options]

Approximates gzip/DEFLATE LZ77 reuse with a 32KB sliding window, then reports
matched byte phrases. This does not expose gzip's Huffman tables or exact bit
costs; estimated saved bytes are computed as sum(matchLen - tokenBytes).

Options:
  --top N            Rows to display. Default: ${defaultOptions.top}
  --min-len N        Minimum phrase length to report. Default: ${defaultOptions.minLen}
  --window N         Sliding window size. Default: ${defaultOptions.window}
  --max-len N        Maximum match length. Default: ${defaultOptions.maxLen}
  --candidates N     Prior positions checked per byte triplet. Default: ${defaultOptions.candidates}
  --token-bytes N    Estimated bytes per LZ77 match token. Default: ${defaultOptions.tokenBytes}
  --json             Print JSON.
`)
}

function formatPct(num) {
  return (num * 100).toFixed(1) + '%'
}

function padLeft(val, len) {
  return String(val).padStart(len)
}

function formatBytes(bytes) {
  const maxDisplayBytes = 100
  const truncated = bytes.length > maxDisplayBytes
  const displayBytes = truncated ? bytes.subarray(0, maxDisplayBytes) : bytes
  const text = displayBytes
    .toString('utf8')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[^\x20-\x7e]/g, '?')
  const suffix = truncated ? `... (+${bytes.length - maxDisplayBytes}b)` : ''

  return JSON.stringify(text + suffix)
}

function formatJsonRow(row) {
  return {
    phrase: JSON.parse(formatBytes(row.phraseBytes)),
    phraseBytes: row.phraseBytes.length,
    lzUses: row.lzUses,
    sourceOccurrences: row.sourceOccurrences,
    matchedBytes: row.matchedBytes,
    estimatedSaved: row.estimatedSaved,
    maxLen: row.maxLen,
  }
}
