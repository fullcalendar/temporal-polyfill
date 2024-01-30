const chunkRe = // groups:
  //12-----------3----------------------------45-------------6------------7------------------
  /^((export\s+)?(const|let|var)\s+\w+\s*=\s*)(([\w\.]+\()|\[([^\]]+)\]|\{([^\}]+)\}|new\s+)/gms

const openingRe = /\{|\[|\(/
const pureComment = '/*@__PURE__*/ '

export function pureTopLevel() {
  return {
    name: 'pure-top-level',
    renderChunk(code) {
      return code.replace(chunkRe, (g0, g1, _g2, _g3, g4, g5, g6, g7) => {
        if (g5) {
          // function call
          return g1 + pureComment + g5
        }
        if (g6) {
          // array literal
          if (g6.includes('...')) {
            if (openingRe.test(g6)) {
              // console.warn('Complicated spread', g6)
            } else {
              return g1 + transformArraySpread(g6)
            }
          }
        } else if (g7) {
          // object literal
          if (g7.includes('...')) {
            if (openingRe.test(g7)) {
              // console.warn('Complicated spread', g7)
            } else {
              return g1 + transformObjectSpread(g7)
            }
          }
        } else {
          // `new` operator (no specific capture)
          return g1 + pureComment + g4
        }
        // no replacement, return whole match
        return g0
      })
    },
  }
}

// Transform
// -----------------------------------------------------------------------------

function transformArraySpread(s) {
  const [tokens, isMultiline] = parseTokens(s)
  const formatTokenAsArray = formatToken.bind(undefined, '[', ']', isMultiline)

  if (tokens.length === 1) {
    return formatTokenAsArray(tokens[0])
  }

  return (
    pureComment +
    formatTokenAsArray(tokens.shift()) +
    '.concat(' +
    tokens.map(formatTokenAsArray).join(', ') +
    ')'
  )
}

function transformObjectSpread(s) {
  const [tokens, isMultiline] = parseTokens(s)
  const formatTokenAsObject = formatToken.bind(undefined, '{', '}', isMultiline)

  if (tokens.length === 1) {
    return formatTokenAsObject(tokens[0])
  }

  return (
    pureComment +
    'Object.assign(' +
    (Array.isArray(tokens[0]) ? '' : '{}, ') +
    tokens.map(formatTokenAsObject).join(', ') +
    ')'
  )
}

// Token Parsing
// -----------------------------------------------------------------------------

function parseTokens(s) {
  const tokens = consolidateTokens(parseIndividualTokens(s))
  const isMultiline = Boolean(s.match(/[\n\r]/))
  return [tokens, isMultiline]
}

function parseIndividualTokens(s) {
  const parts = s
    .split(',')
    .map((part) => part.trim())
    .filter((part) => Boolean(part))

  const tokens = parts.map((part) => {
    const m = part.match(/^\.\.\.(.*)$/)
    return m
      ? m[1] // spreading. get variable name
      : [part] // individual item
  })

  return tokens
}

function consolidateTokens(tokens) {
  const consolidated = []
  let currentGroup

  function depositCurrentGroup() {
    if (currentGroup) {
      consolidated.push(currentGroup)
      currentGroup = undefined
    }
  }

  for (const token of tokens) {
    if (Array.isArray(token)) {
      if (currentGroup) {
        currentGroup.push(...token)
      } else {
        currentGroup = token
      }
    } else {
      depositCurrentGroup()
      consolidated.push(token)
    }
  }

  depositCurrentGroup()
  return consolidated
}

// Formatting
// -----------------------------------------------------------------------------

function formatToken(open, close, isMultiline, token) {
  if (!Array.isArray(token)) {
    return token
  }
  return open + formatStrings(token, isMultiline) + close
}

function formatStrings(strings, isMultiline) {
  const pre = isMultiline ? '  ' : ''
  const pad = isMultiline ? '\n' : ' '
  return pad + pre + strings.join(',' + pad + pre) + pad
}
