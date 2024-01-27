
export const pureTopLevelCommentFakeRe = /__PURE__/
const pureTopLevelCommentFake = '/* __PURE__ */'
const pureTopLevelCommentReal = '/* @__PURE__ */'

// groups: -------12-----------3----------------------------45-------------6------------7-----------
const chunkRe = /^((export\s+)?(const|var|let)\s+\w+\s*=\s*)(([\w\.]+\()|\[([^\]]+)\]|\{([^\}]+)\})/smg

export function pureTopLevelPre() {
  return {
    name: 'pure-top-level-pre',
    renderChunk(code) {
      return code.replace(chunkRe, (g0, g1, g2, g3, g4, g5, g6, g7) => {
        // function call
        if (g5) {
          return g1 + pureTopLevelCommentFake + g5
        }

        // array literal
        if (g6) {
          if (g6.includes('...') && !g6.includes('[')) { // no nested brackets
            return g1 + transformArraySpread(g6)
          }
        }

        // object literal
        if (g7) {
          if (g7.includes('...') && !g7.includes('{')) { // no nested brackets
            return g1 + transformObjectSpread(g7)
          }
        }

        // no replacement, return whole match
        return g0
      })
    }
  }
}

export function pureTopLevelPost() {
  return {
    name: 'pure-top-level-post',
    renderChunk(code) {
      return code.replaceAll(pureTopLevelCommentFake, pureTopLevelCommentReal)
    }
  }
}

// Transform
// -------------------------------------------------------------------------------------------------

function transformArraySpread(s) {
  const [tokens, isMultiline] = parseTokens(s)
  const formatTokenAsArray = formatToken.bind(undefined, '[', ']', isMultiline)

  if (tokens.length === 1) {
    return formatTokenAsArray(tokens[0])
  }

  return pureTopLevelCommentFake + ' ' +
    formatTokenAsArray(tokens.shift()) +
    '.concat(' +
    tokens.map(formatTokenAsArray).join(', ') +
    ')'
}

function transformObjectSpread(s) {
  const [tokens, isMultiline] = parseTokens(s)
  const formatTokenAsObject = formatToken.bind(undefined, '{', '}', isMultiline)

  if (tokens.length === 1) {
    return formatTokenAsObject(tokens[0])
  }

  return pureTopLevelCommentFake + ' ' +
    'Object.assign(' +
    (Array.isArray(tokens[0]) ? '' : '{}, ') +
    tokens.map(formatTokenAsObject).join(', ') +
    ')'
}

// Token Parsing
// -------------------------------------------------------------------------------------------------

function parseTokens(s) {
  let [tokens, isMultiline] = parseIndividualTokens(s)
  tokens = consolidateTokens(tokens)
  return [tokens, isMultiline]
}

function parseIndividualTokens(s) {
  const isMultiline = Boolean(s.match(/[\n\r]/))
  const parts = s.split(
    isMultiline
      ? /,\s*$/m
      : ','
  ).map((part) => part.trim())
  .filter((part) => Boolean(part))

  const tokens = parts.map((part) => {
    const m = part.match(/^\.\.\.(.*)$/)
    return m
      ? m[1] // spreading. get variable name
      : [part] // individual item
  })

  return [tokens, isMultiline]
}

function consolidateTokens(tokens) {
  const consolidated = []
  let currentGroup

  for (let token of tokens) {
    if (Array.isArray(token)) {
      // add to current group
      if (currentGroup) {
        currentGroup.push(...token)
      } else {
        currentGroup = token
      }
    } else {
      // deposit prior group
      if (currentGroup) {
        consolidated.push(currentGroup)
        currentGroup = undefined
      }

      consolidated.push(token)
    }
  }

  // deposit dangling group
  if (currentGroup) {
    consolidated.push(currentGroup)
  }

  return consolidated
}

// Formatting
// -------------------------------------------------------------------------------------------------

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
