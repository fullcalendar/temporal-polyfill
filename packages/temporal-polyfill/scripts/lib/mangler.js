const terserPackageJsonUrl = import.meta.resolve('terser/package.json')
const { domprops } = await import(
  new URL('./tools/domprops.js', terserPackageJsonUrl)
)

// The `etrn` prefix is a deliberately simple trial-and-error size win: common
// output chars tend to gzip better when assigned to the shortest prop names.
const identifierStartChars =
  'etrnabcdfghijklmopqsuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
const identifierChars = identifierStartChars + '0123456789'

const reservedIdentifiers = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
])

const extraBuiltinProps = [
  // Intl.DateTimeFormat options and result keys were easy to miss in older
  // DOM-property lists. Keep them here even when current Terser already knows
  // some of them; duplicated reserved words are harmless.
  'calendar',
  'dateStyle',
  'day',
  'dayPeriod',
  'era',
  'fractionalSecondDigits',
  'full',
  'hour',
  'hour12',
  'hourCycle',
  'localeMatcher',
  'long',
  'medium',
  'minute',
  'month',
  'name',
  'numberingSystem',
  'relatedYear',
  'resolvedOptions',
  'second',
  'short',
  'supportedLocalesOf',
  'timeStyle',
  'timeZone',
  'timeZoneName',
  'useGrouping',
  'weekday',
  'year',
]

const staticBlockType = 'StaticBlock'
const propertyLikeTypes = new Set([
  'AccessorProperty',
  'FieldDefinition',
  'MethodDefinition',
  'Property',
  'PropertyDefinition',
])

export function mangler({
  additionalReserved = [],
  builtinReservedExceptions = [],
  keepQuoted = false,
} = {}) {
  return {
    name: 'temporal-property-mangler',
    generateBundle(_outputOptions, bundle) {
      const chunks = Object.entries(bundle).flatMap(([fileName, item]) => {
        return item.type === 'chunk' ? [{ fileName, chunk: item }] : []
      })

      if (!chunks.length) {
        return
      }

      const reservedNames = buildReservedNames({
        additionalReserved,
        builtinReservedExceptions,
      })
      const chunkContexts = chunks.map(({ fileName, chunk }) => {
        const ast = this.parse(chunk.code)
        const namespaceImports = collectNamespaceImports(ast)

        assertSupportedNamespaceImportUsage(
          ast,
          namespaceImports,
          fileName,
          chunk.code,
        )

        return {
          ast,
          fileName,
          chunk,
          namespaceImports,
          reservedPropNames: collectReservedPropNames(ast, { keepQuoted }),
          propRefs: collectPropRefs(ast, namespaceImports),
        }
      })

      for (const { reservedPropNames } of chunkContexts) {
        for (const propName of reservedPropNames) {
          reservedNames.add(propName)
        }
      }

      const propCounts = countPropRefs(chunkContexts, reservedNames)
      const propMap = buildPropMap(propCounts, reservedNames)

      for (const { chunk, propRefs } of chunkContexts) {
        chunk.code = applyPropMap(chunk.code, propRefs, propMap)
      }
    },
  }
}

function buildReservedNames({ additionalReserved, builtinReservedExceptions }) {
  const reservedNames = new Set()
  findTerserBuiltinProps(reservedNames)
  for (const prop of extraBuiltinProps) {
    reservedNames.add(prop)
  }

  for (const prop of builtinReservedExceptions) {
    reservedNames.delete(prop)
  }
  for (const prop of additionalReserved) {
    reservedNames.add(prop)
  }

  return reservedNames
}

function findTerserBuiltinProps(reservedNames) {
  for (const prop of domprops) {
    reservedNames.add(prop)
  }

  const fallbackConstructors = [
    'Map',
    'Promise',
    'Proxy',
    'Reflect',
    'Set',
    'Symbol',
    'WeakMap',
    'WeakSet',
  ]
  const fallbackObjects = Object.fromEntries(
    fallbackConstructors.map((name) => {
      return [name, globalThis[name] || (() => {})]
    }),
  )
  const builtinObjects = [
    Object,
    Array,
    Function,
    Number,
    String,
    Boolean,
    Error,
    Math,
    Date,
    RegExp,
    fallbackObjects.Symbol,
    ArrayBuffer,
    DataView,
    decodeURI,
    decodeURIComponent,
    encodeURI,
    encodeURIComponent,
    eval,
    EvalError,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    JSON,
    fallbackObjects.Map,
    parseFloat,
    parseInt,
    fallbackObjects.Promise,
    fallbackObjects.Proxy,
    RangeError,
    ReferenceError,
    fallbackObjects.Reflect,
    fallbackObjects.Set,
    SyntaxError,
    TypeError,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    URIError,
    fallbackObjects.WeakMap,
    fallbackObjects.WeakSet,
  ]

  for (const prop of [
    'null',
    'true',
    'false',
    'NaN',
    'Infinity',
    '-Infinity',
    'undefined',
  ]) {
    reservedNames.add(prop)
  }

  for (const builtinObject of builtinObjects) {
    for (const prop of Object.getOwnPropertyNames(builtinObject)) {
      reservedNames.add(prop)
    }
    if (builtinObject.prototype) {
      for (const prop of Object.getOwnPropertyNames(builtinObject.prototype)) {
        reservedNames.add(prop)
      }
    }
  }
}

function collectNamespaceImports(ast) {
  const namespaceImports = new Set()

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportNamespaceSpecifier') {
          namespaceImports.add(specifier.local.name)
        }
      }
    }
  }

  return namespaceImports
}

function assertSupportedNamespaceImportUsage(
  ast,
  namespaceImports,
  fileName,
  code,
) {
  if (!namespaceImports.size) {
    return
  }

  walkAst(ast, (node, parent, key) => {
    if (
      node.type === 'Identifier' &&
      namespaceImports.has(node.name) &&
      isNamespaceImportRead(node, parent, key)
    ) {
      throw new Error(
        [
          `Unsupported namespace import usage in ${fileName}:`,
          formatCodePoint(code, node.start),
          'Namespace imports may only be used as static member-read objects',
          'so property mangling can distinguish module members from properties.',
        ].join(' '),
      )
    }
  })
}

function isNamespaceImportRead(node, parent, key) {
  if (!parent) {
    return true
  }

  if (parent.type === 'ImportNamespaceSpecifier' && key === 'local') {
    return false
  }

  if (parent.type === 'MemberExpression' && key === 'object') {
    return readMemberPropName(parent) == null
  }

  if (isNonComputedPropertyName(node, parent, key)) {
    return false
  }

  return true
}

function collectPropRefs(ast, namespaceImports) {
  const propRefs = []

  walkAst(ast, (node, parent) => {
    if (node.type === 'MemberExpression') {
      collectMemberPropRef(node, namespaceImports, propRefs)
    } else if (isPropertyLike(node, parent)) {
      collectPropertyLikePropRef(node, propRefs)
    }
  })

  return propRefs
}

function collectReservedPropNames(ast, { keepQuoted }) {
  const dynamicLookupObjects = new Set()
  const propNames = new Set()

  if (keepQuoted) {
    collectQuotedPropNames(ast, propNames)
  }

  walkAst(ast, (node) => {
    if (
      node.type === 'MemberExpression' &&
      node.computed &&
      node.object.type === 'Identifier' &&
      readMemberPropName(node) == null
    ) {
      dynamicLookupObjects.add(node.object.name)
    }
  })

  walkAst(ast, (node) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.init?.type === 'ObjectExpression' &&
      dynamicLookupObjects.has(node.id.name)
    ) {
      collectStaticObjectKeys(node.init, propNames)
    }
  })

  return propNames
}

function collectQuotedPropNames(ast, propNames) {
  walkAst(ast, (node, parent) => {
    if (node.type === 'MemberExpression') {
      const propName = readMemberPropName(node)

      if (propName && node.computed) {
        propNames.add(propName)
      }
    } else if (isPropertyLike(node, parent) && node.key?.type === 'Literal') {
      const propName = readStaticPropName(node.key)

      if (propName) {
        propNames.add(propName)
      }
    }
  })
}

function collectStaticObjectKeys(objectExpression, propNames) {
  for (const prop of objectExpression.properties) {
    if (prop.type !== 'Property' || prop.computed) {
      continue
    }

    const propName = readStaticPropName(prop.key)

    if (propName) {
      propNames.add(propName)
    }
  }
}

function collectMemberPropRef(node, namespaceImports, propRefs) {
  if (
    node.object.type === 'Identifier' &&
    namespaceImports.has(node.object.name)
  ) {
    return
  }

  const propName = readMemberPropName(node)
  if (propName) {
    propRefs.push(buildPropRef(node.property, propName, false))
  }
}

function collectPropertyLikePropRef(node, propRefs) {
  if (node.computed || node.kind === 'constructor' || node.key == null) {
    return
  }

  const propName = readStaticPropName(node.key)
  if (propName) {
    propRefs.push(buildPropRef(node.key, propName, Boolean(node.shorthand)))
  }
}

function isPropertyLike(node, parent) {
  if (!propertyLikeTypes.has(node.type) || !parent) {
    return false
  }

  return (
    parent.type === 'ClassBody' ||
    parent.type === 'ObjectExpression' ||
    parent.type === 'ObjectPattern'
  )
}

function isNonComputedPropertyName(node, parent, key) {
  return (
    isPropertyLike(parent, parent?.parent) &&
    key === 'key' &&
    !parent.computed &&
    parent.key === node
  )
}

function readStaticPropName(node) {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }
}

function readMemberPropName(node) {
  if (node.computed) {
    return node.property.type === 'Literal' &&
      typeof node.property.value === 'string'
      ? node.property.value
      : void 0
  }

  return node.property.type === 'Identifier' ? node.property.name : void 0
}

function buildPropRef(node, name, shorthand) {
  return {
    name,
    shorthand,
    start: node.start,
    end: node.end,
    quoted: node.type === 'Literal',
  }
}

function countPropRefs(chunkContexts, reservedNames) {
  const propCounts = new Map()

  for (const { propRefs } of chunkContexts) {
    for (const propRef of propRefs) {
      if (!reservedNames.has(propRef.name)) {
        propCounts.set(propRef.name, (propCounts.get(propRef.name) || 0) + 1)
      }
    }
  }

  return propCounts
}

function buildPropMap(propCounts, reservedNames) {
  const propMap = new Map()
  const usedNames = new Set(reservedNames)
  const entries = Array.from(propCounts).sort((a, b) => {
    return b[1] - a[1] || a[0].localeCompare(b[0])
  })

  for (const [propName] of entries) {
    if (propName.length <= 1) {
      usedNames.add(propName)
    }
  }

  for (const [propName] of entries) {
    if (propName.length <= 1) {
      continue
    }

    const newName = nextMangledName(usedNames)

    if (newName.length >= propName.length) {
      usedNames.add(propName)
      continue
    }

    propMap.set(propName, newName)
    usedNames.add(newName)
  }

  return propMap
}

function nextMangledName(usedNames) {
  for (let index = 0; ; index += 1) {
    const name = buildMangledName(index)

    if (!usedNames.has(name) && !reservedIdentifiers.has(name)) {
      return name
    }
  }
}

function buildMangledName(index) {
  let name = identifierStartChars[index % identifierStartChars.length]
  let value = Math.floor(index / identifierStartChars.length)

  while (value) {
    value -= 1
    name += identifierChars[value % identifierChars.length]
    value = Math.floor(value / identifierChars.length)
  }

  return name
}

function applyPropMap(code, propRefs, propMap) {
  const edits = []

  for (const propRef of propRefs) {
    const newName = propMap.get(propRef.name)

    if (newName) {
      edits.push({
        start: propRef.start,
        end: propRef.end,
        replacement: propRef.quoted ? JSON.stringify(newName) : newName,
      })

      if (propRef.shorthand) {
        edits.push({
          start: propRef.end,
          end: propRef.end,
          replacement: `: ${propRef.name}`,
        })
      }
    }
  }

  edits.sort((a, b) => {
    return b.start - a.start || b.end - a.end
  })

  for (const edit of edits) {
    code = code.slice(0, edit.start) + edit.replacement + code.slice(edit.end)
  }

  return code
}

function walkAst(node, visit, parent = null, key = null) {
  if (!node || typeof node !== 'object') {
    return
  }

  if (parent) {
    node.parent = parent
  }

  visit(node, parent, key)

  for (const childKey in node) {
    if (
      childKey === 'parent' ||
      childKey === 'start' ||
      childKey === 'end' ||
      childKey === 'loc'
    ) {
      continue
    }

    const child = node[childKey]

    if (Array.isArray(child)) {
      for (const childNode of child) {
        if (childNode?.type && childNode.type !== staticBlockType) {
          walkAst(childNode, visit, node, childKey)
        }
      }
    } else if (child?.type && child.type !== staticBlockType) {
      walkAst(child, visit, node, childKey)
    }
  }
}

function formatCodePoint(code, index) {
  const lines = code.slice(0, index).split('\n')
  return `line ${lines.length}, column ${lines.at(-1).length + 1}.`
}
