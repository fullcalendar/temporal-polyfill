import jscodeshift, {
  type API,
  type FileInfo,
  type JSCodeshift,
} from 'jscodeshift'

export type DiagnosticKind = 'warning' | 'error'

export interface Diagnostic {
  kind: DiagnosticKind
  message: string
  line?: number
  column?: number
}

export interface TransformResult {
  code: string
  diagnostics: Diagnostic[]
  changed: boolean
  needsTemporalUtils: boolean
  touchedTypeScript: boolean
}

export interface TransformOptions {
  path?: string
}

interface FnBinding {
  typeName: string
  importPath: string
  namespaceName?: string
  namedImports: Map<string, string>
  typeImports: Map<string, string>
}

interface TransformState {
  j: JSCodeshift
  diagnostics: Diagnostic[]
  bindings: Map<string, FnBinding>
  importedLocalToFn: Map<string, { binding: FnBinding; exportName: string }>
  importedTypeToTemporal: Map<string, string>
  importDecls: Set<any>
  usedTemporalUtils: Map<string, string>
  usedTemporalUtilsTypes: Set<string>
  touchedTypeScript: boolean
  root?: ReturnType<JSCodeshift>
}

const fnsRootPath = 'temporal-polyfill/fns'
const fnsPathPrefix = `${fnsRootPath}/`

const rootTypeMap: Record<string, string> = {
  DisambiguationOptions: 'Temporal.DisambiguationOptions',
  OverflowOptions: 'Temporal.OverflowOptions',
  RoundingMode: 'RoundingMode',
  RoundingMathOptions: 'RoundingMathOptions',
}

const perTypeTypeMap: Record<string, Record<string, string>> = {
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

const recordGetterCalendarIds: Record<string, string> = {
  getISO: 'iso8601',
  getGregory: 'gregory',
  getBuddhist: 'buddhist',
  getChinese: 'chinese',
  getCoptic: 'coptic',
  getDangi: 'dangi',
  getEthiopic: 'ethiopic',
  getEthiopicAmeteAlem: 'ethioaa',
  getHebrew: 'hebrew',
  getIndian: 'indian',
  getJapanese: 'japanese',
  getIslamicCivil: 'islamic-civil',
  getIslamicTabular: 'islamic-tbla',
  getIslamicUmmAlQura: 'islamic-umalqura',
  getPersian: 'persian',
  getROC: 'roc',
}

interface RecordTypeConfig {
  temporalName: string
  create?: {
    minArgs: number
    maxArgs: number
    calendarArgIndex?: number
  }
  staticMethods?: Record<string, string>
  propertyGetters?: Set<string>
  firstArgMethods?: Record<string, string>
  calendarFirstArgMethods?: Set<string>
  unitMethods?: boolean
}

// These maps are intentionally declarative. Every entry represents a shape that
// is safe to rewrite without knowing the user's runtime values.
const calendarPropertyGetters = new Set([
  'dayOfWeek',
  'daysInWeek',
  'weekOfYear',
  'yearOfWeek',
  'dayOfYear',
  'daysInMonth',
  'daysInYear',
  'monthsInYear',
  'inLeapYear',
])

const temporalFieldPropertyGetters = new Set([
  'calendarId',
  'era',
  'eraYear',
  'year',
  'month',
  'monthCode',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
])

const durationPropertyGetters = new Set(['sign', 'blank'])

const unitMethodMap: Record<
  string,
  { temporalMethod: 'add' | 'subtract'; field: string }
> = {
  addYears: { temporalMethod: 'add', field: 'years' },
  addMonths: { temporalMethod: 'add', field: 'months' },
  addWeeks: { temporalMethod: 'add', field: 'weeks' },
  addDays: { temporalMethod: 'add', field: 'days' },
  addHours: { temporalMethod: 'add', field: 'hours' },
  addMinutes: { temporalMethod: 'add', field: 'minutes' },
  addSeconds: { temporalMethod: 'add', field: 'seconds' },
  addMilliseconds: { temporalMethod: 'add', field: 'milliseconds' },
  addMicroseconds: { temporalMethod: 'add', field: 'microseconds' },
  addNanoseconds: { temporalMethod: 'add', field: 'nanoseconds' },
  subtractYears: { temporalMethod: 'subtract', field: 'years' },
  subtractMonths: { temporalMethod: 'subtract', field: 'months' },
  subtractWeeks: { temporalMethod: 'subtract', field: 'weeks' },
  subtractDays: { temporalMethod: 'subtract', field: 'days' },
  subtractHours: { temporalMethod: 'subtract', field: 'hours' },
  subtractMinutes: { temporalMethod: 'subtract', field: 'minutes' },
  subtractSeconds: { temporalMethod: 'subtract', field: 'seconds' },
  subtractMilliseconds: { temporalMethod: 'subtract', field: 'milliseconds' },
  subtractMicroseconds: { temporalMethod: 'subtract', field: 'microseconds' },
  subtractNanoseconds: { temporalMethod: 'subtract', field: 'nanoseconds' },
}

const temporalUtilsHelpers = new Set([
  'diffYears',
  'diffMonths',
  'diffWeeks',
  'diffDays',
  'diffHours',
  'diffMinutes',
  'diffSeconds',
  'diffMilliseconds',
  'diffMicroseconds',
  'diffNanoseconds',
  'roundToYear',
  'roundToMonth',
  'roundToWeek',
  'roundToDay',
  'roundToHour',
  'roundToMinute',
  'roundToSecond',
  'roundToMillisecond',
  'roundToMicrosecond',
  'startOfYear',
  'startOfMonth',
  'startOfWeek',
  'startOfDay',
  'startOfHour',
  'startOfMinute',
  'startOfSecond',
  'startOfMillisecond',
  'startOfMicrosecond',
  'endOfYear',
  'endOfMonth',
  'endOfWeek',
  'endOfDay',
  'endOfHour',
  'endOfMinute',
  'endOfSecond',
  'endOfMillisecond',
  'endOfMicrosecond',
  'withDayOfYear',
  'withDayOfMonth',
  'withDayOfWeek',
  'withWeekOfYear',
])

const nativeRoundUnitsByType: Record<string, Set<string>> = {
  Instant: new Set(['hour', 'minute', 'second', 'millisecond', 'microsecond']),
  ZonedDateTime: new Set([
    'day',
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
  ]),
  PlainDateTime: new Set([
    'day',
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
  ]),
  PlainTime: new Set([
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
  ]),
}

const commonFirstArgMethodMap: Record<string, string> = {
  add: 'add',
  subtract: 'subtract',
  diff: 'until',
  withFields: 'with',
  withCalendar: 'withCalendar',
  withPlainTime: 'withPlainTime',
  withTimeZone: 'withTimeZone',
  negated: 'negated',
  abs: 'abs',
  round: 'round',
  total: 'total',
  getTimeZoneTransition: 'getTimeZoneTransition',
  toInstant: 'toInstant',
  toPlainDate: 'toPlainDate',
  toPlainDateTime: 'toPlainDateTime',
  toPlainTime: 'toPlainTime',
  toPlainYearMonth: 'toPlainYearMonth',
  toPlainMonthDay: 'toPlainMonthDay',
  toZonedDateTime: 'toZonedDateTime',
  toZonedDateTimeISO: 'toZonedDateTimeISO',
  toString: 'toString',
  toLocaleString: 'toLocaleString',
}

const recordTypeConfigs: Record<string, RecordTypeConfig> = {
  Instant: {
    temporalName: 'Instant',
    create: { minArgs: 1, maxArgs: 1 },
    staticMethods: {
      fromEpochMilliseconds: 'fromEpochMilliseconds',
      fromEpochNanoseconds: 'fromEpochNanoseconds',
    },
    propertyGetters: new Set(['epochMilliseconds', 'epochNanoseconds']),
    firstArgMethods: commonFirstArgMethodMap,
    unitMethods: true,
  },
  ZonedDateTime: {
    temporalName: 'ZonedDateTime',
    create: { minArgs: 2, maxArgs: 3, calendarArgIndex: 2 },
    propertyGetters: new Set([
      ...calendarPropertyGetters,
      'offsetNanoseconds',
      'offset',
      'hoursInDay',
    ]),
    firstArgMethods: commonFirstArgMethodMap,
    calendarFirstArgMethods: new Set(['withCalendar']),
    unitMethods: true,
  },
  PlainDateTime: {
    temporalName: 'PlainDateTime',
    create: { minArgs: 3, maxArgs: 10, calendarArgIndex: 9 },
    propertyGetters: calendarPropertyGetters,
    firstArgMethods: commonFirstArgMethodMap,
    calendarFirstArgMethods: new Set(['withCalendar']),
    unitMethods: true,
  },
  PlainDate: {
    temporalName: 'PlainDate',
    create: { minArgs: 3, maxArgs: 4, calendarArgIndex: 3 },
    propertyGetters: new Set([
      ...temporalFieldPropertyGetters,
      ...calendarPropertyGetters,
    ]),
    firstArgMethods: commonFirstArgMethodMap,
    calendarFirstArgMethods: new Set(['withCalendar']),
    unitMethods: true,
  },
  PlainTime: {
    temporalName: 'PlainTime',
    create: { minArgs: 0, maxArgs: 6 },
    firstArgMethods: commonFirstArgMethodMap,
    unitMethods: true,
  },
  PlainYearMonth: {
    temporalName: 'PlainYearMonth',
    create: { minArgs: 2, maxArgs: 4, calendarArgIndex: 2 },
    propertyGetters: new Set([
      'daysInMonth',
      'daysInYear',
      'monthsInYear',
      'inLeapYear',
    ]),
    firstArgMethods: commonFirstArgMethodMap,
    unitMethods: true,
  },
  PlainMonthDay: {
    temporalName: 'PlainMonthDay',
    create: { minArgs: 2, maxArgs: 4, calendarArgIndex: 2 },
    firstArgMethods: commonFirstArgMethodMap,
  },
  Duration: {
    temporalName: 'Duration',
    create: { minArgs: 0, maxArgs: 10 },
    propertyGetters: durationPropertyGetters,
    firstArgMethods: commonFirstArgMethodMap,
    staticMethods: {
      compare: 'compare',
    },
  },
}

export function transformSource(
  source: string,
  options: TransformOptions = {},
): TransformResult {
  const j = jscodeshift.withParser(parserForPath(options.path))
  const root = j(source)
  const state: TransformState = {
    j,
    diagnostics: [],
    bindings: new Map(),
    importedLocalToFn: new Map(),
    importedTypeToTemporal: new Map(),
    importDecls: new Set(),
    usedTemporalUtils: new Map(),
    usedTemporalUtilsTypes: new Set(),
    touchedTypeScript: isTypeScriptPath(options.path),
  }
  state.root = root

  collectImports(root, state)
  rewriteTypeReferences(root, state)
  rewriteCallExpressions(root, state)
  addTemporalUtilsImports(root, state)
  cleanupImports(root, state)
  reportUnsupportedLeftovers(root, state)

  const code = root.toSource({
    quote: 'single',
    reuseWhitespace: true,
  })

  return {
    code,
    diagnostics: state.diagnostics,
    changed: code !== source,
    needsTemporalUtils:
      state.usedTemporalUtils.size > 0 || state.usedTemporalUtilsTypes.size > 0,
    touchedTypeScript: state.touchedTypeScript,
  }
}

// jscodeshift calls this default export. The CLI uses transformSource directly
// so it can control aggregate diagnostics and exit codes across all files.
export default function transform(file: FileInfo, api: API): string {
  const result = transformSource(file.source, { path: file.path })

  for (const diagnostic of result.diagnostics) {
    const location =
      diagnostic.line == null
        ? ''
        : `:${diagnostic.line}:${diagnostic.column ?? 0}`
    api.report(
      `${file.path}${location} ${diagnostic.kind}: ${diagnostic.message}`,
    )
  }

  return result.code
}

function parserForPath(path: string | undefined): 'tsx' | 'ts' | 'babel' {
  if (path?.endsWith('.tsx') || path?.endsWith('.jsx')) {
    return 'tsx'
  }
  if (isTypeScriptPath(path)) {
    return 'ts'
  }
  return 'babel'
}

function isTypeScriptPath(path: string | undefined): boolean {
  return path != null && /\.(ts|tsx|mts|cts)$/.test(path)
}

// The functional API is only exported from exact package paths. Near misses are
// reported instead of guessed because leaving fns records behind is unsafe.
function collectImports(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  for (const path of root.find(state.j.ImportDeclaration).paths()) {
    const importPath = stringLiteralValue(path.node.source)
    if (!importPath?.startsWith(fnsRootPath)) {
      continue
    }

    state.importDecls.add(path.node)

    if (importPath === fnsRootPath) {
      collectRootTypeImports(path.node, state)
      continue
    }

    if (!importPath.startsWith(fnsPathPrefix)) {
      warn(
        state,
        path.node,
        `Unsupported temporal-polyfill/fns import path: ${importPath}`,
      )
      continue
    }

    const typeName = importPath.slice(fnsPathPrefix.length)
    const binding: FnBinding = {
      typeName,
      importPath,
      namedImports: new Map(),
      typeImports: new Map(),
    }
    state.bindings.set(importPath, binding)

    for (const specifier of path.node.specifiers ?? []) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        binding.namespaceName = specifier.local?.name
      } else if (specifier.type === 'ImportSpecifier') {
        const importedNode = specifier.imported as any
        const imported =
          importedNode.type === 'Identifier'
            ? importedNode.name
            : importedNode.value
        const local = specifier.local?.name ?? imported
        if (
          path.node.importKind === 'type' ||
          (specifier as any).importKind === 'type'
        ) {
          binding.typeImports.set(local, imported)
          collectPerTypeTypeImport(state, binding, local, imported)
        } else {
          binding.namedImports.set(local, imported)
          state.importedLocalToFn.set(local, { binding, exportName: imported })
        }
      } else {
        warn(
          state,
          specifier,
          `Unsupported fns import specifier in ${importPath}`,
        )
      }
    }
  }
}

function collectRootTypeImports(importDecl: any, state: TransformState): void {
  for (const specifier of importDecl.specifiers ?? []) {
    if (specifier.type !== 'ImportSpecifier') {
      warn(
        state,
        specifier,
        'Only named type imports are supported from temporal-polyfill/fns',
      )
      continue
    }

    const imported =
      specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value
    const local = specifier.local?.name ?? imported
    const temporalType = rootTypeMap[imported]

    if (temporalType == null) {
      warn(state, specifier, `No type rewrite is known for ${imported}`)
    } else {
      state.importedTypeToTemporal.set(local, temporalType)
    }
  }
}

function collectPerTypeTypeImport(
  state: TransformState,
  binding: FnBinding,
  local: string,
  imported: string,
): void {
  const typeSource = perTypeTypeMap[binding.typeName]?.[imported]
  if (typeSource != null) {
    state.importedTypeToTemporal.set(local, typeSource)
  } else {
    warn(
      state,
      null,
      `No type rewrite is known for ${binding.importPath} export ${imported}`,
    )
  }
}

function rewriteTypeReferences(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  for (const path of root.find(state.j.TSTypeReference).paths()) {
    const typeName = path.node.typeName

    if (typeName.type === 'Identifier') {
      const typeSource = state.importedTypeToTemporal.get(typeName.name)
      if (typeSource != null) {
        replaceWithTypeSource(path, state, typeSource)
      }
      continue
    }

    if (
      typeName.type === 'TSQualifiedName' &&
      typeName.left.type === 'Identifier' &&
      typeName.right.type === 'Identifier'
    ) {
      const binding = namespaceBindingForLocal(state, typeName.left.name)
      if (binding == null) {
        return
      }

      const typeSource = perTypeTypeMap[binding.typeName]?.[typeName.right.name]
      if (typeSource != null) {
        replaceWithTypeSource(path, state, typeSource)
      }
    }
  }
}

function replaceWithTypeSource(
  path: any,
  state: TransformState,
  typeSource: string,
): void {
  if (typeSource === 'RoundingMode' || typeSource === 'RoundingMathOptions') {
    state.usedTemporalUtilsTypes.add(typeSource)
  }

  const alias = state
    .j(`type __CodemodType = ${typeSource}`)
    .find(state.j.TSTypeAliasDeclaration)
    .nodes()[0]
  path.replace(alias.typeAnnotation)
}

function rewriteCallExpressions(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  for (const path of root.find(state.j.CallExpression).paths()) {
    const calleeInfo = getFnsCallee(state, path.node.callee)
    if (calleeInfo == null) {
      continue
    }

    const { binding, exportName } = calleeInfo
    const replacement =
      binding.typeName === 'Now'
        ? rewriteNowCall(state, path.node, exportName)
        : rewriteRecordTypeCall(state, path.node, binding.typeName, exportName)

    if (replacement != null) {
      path.replace(replacement)
    }
  }
}

function rewriteRecordTypeCall(
  state: TransformState,
  call: any,
  typeName: string,
  exportName: string,
): any | null {
  const config = recordTypeConfigs[typeName]
  if (config == null) {
    return null
  }

  const args = call.arguments

  if (exportName === 'create') {
    if (config.create == null) {
      warn(
        state,
        call,
        `${typeName} create is not implemented by the codemod yet`,
      )
      return null
    }
    if (
      args.length < config.create.minArgs ||
      args.length > config.create.maxArgs
    ) {
      warn(
        state,
        call,
        `${typeName} create call has an unexpected argument count`,
      )
      return null
    }

    const newArgs = args.slice()
    const calendarArgIndex = config.create.calendarArgIndex
    if (calendarArgIndex != null && newArgs[calendarArgIndex] != null) {
      const calendar = calendarIdExpressionForKnownContext(
        state,
        newArgs[calendarArgIndex],
      )
      if (calendar == null) {
        return null
      }
      newArgs[calendarArgIndex] = calendar
    }
    return state.j.newExpression(
      temporalMember(state, config.temporalName),
      newArgs,
    )
  }

  if (exportName === 'fromString') {
    if (args.length < 1) {
      warn(state, call, `${typeName} fromString call has no string argument`)
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(
        temporalMember(state, config.temporalName),
        state.j.identifier('from'),
      ),
      [args[0]],
    )
  }

  if (exportName === 'fromFields') {
    if (args.length < 1 || args.length > 2) {
      warn(
        state,
        call,
        `${typeName} fromFields call has an unexpected argument count`,
      )
      return null
    }
    const fields = rewriteCalendarPropertyInObject(state, args[0])
    return state.j.callExpression(
      state.j.memberExpression(
        temporalMember(state, config.temporalName),
        state.j.identifier('from'),
      ),
      [fields, ...args.slice(1)],
    )
  }

  if (exportName === 'isRecord') {
    if (args.length !== 1) {
      warn(
        state,
        call,
        `${typeName} isRecord call has an unexpected argument count`,
      )
      return null
    }
    return state.j.binaryExpression(
      'instanceof',
      args[0],
      temporalMember(state, config.temporalName),
    )
  }

  if (config.propertyGetters?.has(exportName)) {
    if (args.length !== 1) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has an unexpected argument count`,
      )
      return null
    }
    return state.j.memberExpression(args[0], state.j.identifier(exportName))
  }

  if (exportName === 'toTemporal') {
    if (args.length !== 1) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has an unexpected argument count`,
      )
      return null
    }
    // Migrated functional records are already real Temporal instances.
    return args[0]
  }

  if (exportName === 'toBasicString') {
    if (args.length !== 1) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has an unexpected argument count`,
      )
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(args[0], state.j.identifier('toString')),
      [],
    )
  }

  if (typeName === 'ZonedDateTime' && exportName === 'startOfDay') {
    if (args.length !== 1) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has an unexpected argument count`,
      )
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(args[0], state.j.identifier('startOfDay')),
      [],
    )
  }

  const unitMethod = ownMapValue(unitMethodMap, exportName)
  if (config.unitMethods && unitMethod != null) {
    if (args.length < 2 || args.length > 3) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has an unexpected argument count`,
      )
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(
        args[0],
        state.j.identifier(unitMethod.temporalMethod),
      ),
      [
        state.j.objectExpression([
          propertyFromValueWithComments(
            state,
            state.j.identifier(unitMethod.field),
            args[1],
          ),
        ]),
        ...args.slice(2),
      ],
    )
  }

  const temporalMethod =
    config.firstArgMethods == null
      ? undefined
      : ownMapValue(config.firstArgMethods, exportName)
  if (temporalMethod != null) {
    if (args.length < 1) {
      warn(
        state,
        call,
        `${typeName} ${exportName} call has no receiver argument`,
      )
      return null
    }
    const methodArgs = args.slice(1)
    if (
      config.calendarFirstArgMethods?.has(exportName) &&
      methodArgs[0] != null
    ) {
      const calendar = calendarIdExpressionForKnownContext(state, methodArgs[0])
      if (calendar == null) {
        return null
      }
      methodArgs[0] = calendar
    }
    return state.j.callExpression(
      state.j.memberExpression(args[0], state.j.identifier(temporalMethod)),
      methodArgs,
    )
  }

  if (exportName === 'equals') {
    if (args.length !== 2) {
      warn(
        state,
        call,
        `${typeName} equals call has an unexpected argument count`,
      )
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(args[0], state.j.identifier('equals')),
      [args[1]],
    )
  }

  if (exportName === 'compare') {
    if (args.length !== 2) {
      warn(
        state,
        call,
        `${typeName} compare call has an unexpected argument count`,
      )
      return null
    }
    return state.j.callExpression(
      state.j.memberExpression(
        temporalMember(state, config.temporalName),
        state.j.identifier('compare'),
      ),
      args,
    )
  }

  if (temporalUtilsHelpers.has(exportName)) {
    const nativeRound = rewriteNativeRoundCall(
      state,
      call,
      typeName,
      exportName,
    )
    if (nativeRound !== undefined) {
      return nativeRound
    }
    return rewriteTemporalUtilsCall(state, call, exportName)
  }

  const staticMethod =
    config.staticMethods == null
      ? undefined
      : ownMapValue(config.staticMethods, exportName)
  if (staticMethod != null) {
    return state.j.callExpression(
      state.j.memberExpression(
        temporalMember(state, config.temporalName),
        state.j.identifier(staticMethod),
      ),
      args,
    )
  }

  warn(
    state,
    call,
    `${typeName} ${exportName} is not implemented by the codemod yet`,
  )
  return null
}

function rewriteNativeRoundCall(
  state: TransformState,
  call: any,
  typeName: string,
  exportName: string,
): any | null | undefined {
  const unit = unitFromRoundHelperName(exportName)
  if (unit == null || !nativeRoundUnitsByType[typeName]?.has(unit)) {
    return undefined
  }

  const args = call.arguments
  if (args.length < 1 || args.length > 2) {
    warn(
      state,
      call,
      `${typeName} ${exportName} call has an unexpected argument count`,
    )
    return null
  }

  const options = args[1]
  if (options == null) {
    return roundReceiverWithOptions(state, args[0], [
      smallestUnitProperty(state, unit),
    ])
  }

  if (isStringLiteral(options)) {
    return roundReceiverWithOptions(state, args[0], [
      state.j.property('init', state.j.identifier('roundingMode'), options),
      smallestUnitProperty(state, unit),
    ])
  }

  if (options.type === 'ObjectExpression') {
    if (objectHasProperty(options, 'smallestUnit')) {
      warn(
        state,
        call,
        `${typeName} ${exportName} options object already has smallestUnit; manual review needed`,
      )
      return null
    }
    options.properties.push(smallestUnitProperty(state, unit))
    return roundReceiverWithOptions(state, args[0], options.properties)
  }

  return undefined
}

function rewriteTemporalUtilsCall(
  state: TransformState,
  call: any,
  exportName: string,
): any | null {
  const localName = temporalUtilsLocalName(state, exportName)
  return state.j.callExpression(state.j.identifier(localName), call.arguments)
}

function temporalUtilsLocalName(
  state: TransformState,
  exportName: string,
): string {
  const existing = state.usedTemporalUtils.get(exportName)
  if (existing != null) {
    return existing
  }

  const imported = existingTemporalUtilsImportLocalName(state, exportName)
  if (imported != null) {
    state.usedTemporalUtils.set(exportName, imported)
    return imported
  }

  const localName = allocateTemporalUtilsLocalName(state, exportName)
  state.usedTemporalUtils.set(exportName, localName)
  return localName
}

function existingTemporalUtilsImportLocalName(
  state: TransformState,
  exportName: string,
): string | null {
  const root = state.root
  if (root == null) {
    return null
  }

  for (const path of root.find(state.j.ImportDeclaration).paths()) {
    if (stringLiteralValue(path.node.source) !== 'temporal-utils') {
      continue
    }
    if (path.node.importKind === 'type') {
      continue
    }
    for (const specifier of path.node.specifiers ?? []) {
      if (specifier.type !== 'ImportSpecifier') {
        continue
      }
      const importedNode = specifier.imported as any
      const imported =
        importedNode.type === 'Identifier'
          ? importedNode.name
          : importedNode.value
      if (imported !== exportName) {
        continue
      }
      return specifier.local?.name ?? exportName
    }
  }

  return null
}

function allocateTemporalUtilsLocalName(
  state: TransformState,
  exportName: string,
): string {
  const occupiedNames = collectOccupiedNames(state)
  const usedLocals = new Set(state.usedTemporalUtils.values())

  if (!occupiedNames.has(exportName) && !usedLocals.has(exportName)) {
    return exportName
  }

  const baseName = `${exportName}TemporalUtils`
  if (!occupiedNames.has(baseName) && !usedLocals.has(baseName)) {
    return baseName
  }

  for (let index = 2; ; index += 1) {
    const localName = `${baseName}${index}`
    if (!occupiedNames.has(localName) && !usedLocals.has(localName)) {
      return localName
    }
  }
}

function unitFromRoundHelperName(exportName: string): string | null {
  if (!exportName.startsWith('roundTo')) {
    return null
  }
  const unit = exportName.slice('roundTo'.length)
  return unit.length === 0 ? null : unit[0].toLowerCase() + unit.slice(1)
}

function roundReceiverWithOptions(
  state: TransformState,
  receiver: any,
  properties: any[],
): any {
  return state.j.callExpression(
    state.j.memberExpression(receiver, state.j.identifier('round')),
    [state.j.objectExpression(properties)],
  )
}

function smallestUnitProperty(state: TransformState, unit: string): any {
  return state.j.property(
    'init',
    state.j.identifier('smallestUnit'),
    state.j.literal(unit),
  )
}

function objectHasProperty(
  objectExpression: any,
  propertyName: string,
): boolean {
  return objectExpression.properties.some((property: any) => {
    if (property.type !== 'Property' && property.type !== 'ObjectProperty') {
      return false
    }
    if (property.computed) {
      return false
    }
    return (
      (property.key.type === 'Identifier' &&
        property.key.name === propertyName) ||
      (isStringLiteral(property.key) && property.key.value === propertyName)
    )
  })
}

function isStringLiteral(node: any): boolean {
  return (
    (node.type === 'Literal' || node.type === 'StringLiteral') &&
    typeof node.value === 'string'
  )
}

function rewriteNowCall(
  state: TransformState,
  call: any,
  exportName: string,
): any | null {
  const nowMethods = new Set([
    'timeZoneId',
    'instant',
    'zonedDateTimeISO',
    'plainDateTimeISO',
    'plainDateISO',
    'plainTimeISO',
  ])
  if (!nowMethods.has(exportName)) {
    warn(state, call, `Now ${exportName} is not implemented by the codemod yet`)
    return null
  }

  return state.j.callExpression(
    state.j.memberExpression(
      temporalMember(state, 'Now'),
      state.j.identifier(exportName),
    ),
    call.arguments,
  )
}

function temporalMember(state: TransformState, property: string): any {
  return state.j.memberExpression(
    state.j.identifier('Temporal'),
    state.j.identifier(property),
  )
}

function propertyFromValueWithComments(
  state: TransformState,
  key: any,
  value: any,
): any {
  const property = state.j.property('init', key, value)
  if (value.comments != null) {
    property.comments = value.comments
    value.comments = null
  }
  return property
}

function ownMapValue<T>(map: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined
}

// CalendarRecord normally becomes the narrow calendar ID string accepted by the
// fns API. This helper is only called from Temporal-consuming argument slots;
// standalone CalendarFns calls stay in place and become diagnostics.
function calendarIdExpressionForKnownContext(
  state: TransformState,
  expression: any,
): any | null {
  if (expression.type !== 'CallExpression') {
    return expression
  }

  const calleeInfo = getFnsCallee(state, expression.callee)
  if (calleeInfo == null || calleeInfo.binding.typeName !== 'Calendar') {
    return expression
  }

  const literalId = recordGetterCalendarIds[calleeInfo.exportName]
  if (literalId != null) {
    return state.j.literal(literalId)
  }

  if (
    calleeInfo.exportName === 'getAny' ||
    calleeInfo.exportName === 'getExotic' ||
    calleeInfo.exportName === 'getBasic'
  ) {
    if (expression.arguments.length !== 1) {
      warn(
        state,
        expression,
        `Calendar ${calleeInfo.exportName} call has an unexpected argument count`,
      )
      return null
    }
    return expression.arguments[0]
  }

  warn(
    state,
    expression,
    `Calendar ${calleeInfo.exportName} is not safe to rewrite as a calendar ID`,
  )
  return null
}

function rewriteCalendarPropertyInObject(
  state: TransformState,
  expression: any,
): any {
  if (expression.type !== 'ObjectExpression') {
    return expression
  }

  for (const property of expression.properties) {
    if (property.type !== 'Property' && property.type !== 'ObjectProperty') {
      continue
    }
    if (
      property.computed ||
      property.key.type !== 'Identifier' ||
      property.key.name !== 'calendar'
    ) {
      continue
    }
    const calendar = calendarIdExpressionForKnownContext(state, property.value)
    if (calendar != null) {
      property.value = calendar
    }
  }

  return expression
}

function addTemporalUtilsImports(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  if (
    state.usedTemporalUtils.size === 0 &&
    state.usedTemporalUtilsTypes.size === 0
  ) {
    return
  }

  const specifiers = [
    ...[...state.usedTemporalUtils]
      .sort()
      .map(([exportName, localName]) =>
        state.j.importSpecifier(
          state.j.identifier(exportName),
          localName === exportName ? null : state.j.identifier(localName),
        ),
      ),
    ...[...state.usedTemporalUtilsTypes].sort().map((name) => {
      const specifier = state.j.importSpecifier(state.j.identifier(name))
      ;(specifier as any).importKind = 'type'
      return specifier
    }),
  ]

  if (specifiers.length > 0) {
    const importDecl = state.j.importDeclaration(
      specifiers,
      state.j.literal('temporal-utils'),
    )
    if (state.usedTemporalUtils.size === 0) {
      importDecl.importKind = 'type'
      for (const specifier of specifiers) {
        ;(specifier as any).importKind = null
      }
    }
    root.get().node.program.body.unshift(importDecl)
  }
}

function collectOccupiedNames(state: TransformState): Set<string> {
  const root = state.root
  const names = new Set<string>()
  if (root == null) {
    return names
  }

  for (const path of root.find(state.j.Identifier).paths()) {
    if (isFnsImportSpecifierIdentifier(path, state)) {
      const localName = fnsImportSpecifierLocalName(path.parent.node)
      if (localName != null && !fnsLocalHasUnsafeUse(state, localName)) {
        continue
      }
    }
    if (isBindingIdentifier(path)) {
      names.add(path.node.name)
    }
  }

  return names
}

function isFnsImportSpecifierIdentifier(
  path: any,
  state: TransformState,
): boolean {
  const parent = path.parent?.node
  if (parent?.type !== 'ImportSpecifier') {
    return false
  }
  for (const importDecl of state.importDecls) {
    if ((importDecl.specifiers ?? []).includes(parent)) {
      return true
    }
  }
  return false
}

function fnsImportSpecifierLocalName(importSpecifier: any): string | null {
  if (importSpecifier.type !== 'ImportSpecifier') {
    return null
  }
  if (importSpecifier.local?.name != null) {
    return importSpecifier.local.name
  }
  const imported = importSpecifier.imported as any
  return imported.type === 'Identifier' ? imported.name : imported.value
}

function fnsLocalHasUnsafeUse(
  state: TransformState,
  localName: string,
): boolean {
  const root = state.root
  if (root == null) {
    return false
  }

  for (const path of root
    .find(state.j.Identifier, { name: localName })
    .paths()) {
    const parent = path.parent?.node
    if (parent?.type === 'ImportSpecifier') {
      continue
    }
    if (parent?.type === 'CallExpression' && parent.callee === path.node) {
      continue
    }
    return true
  }

  return false
}

function isBindingIdentifier(path: any): boolean {
  const parent = path.parent?.node
  if (parent == null) {
    return false
  }

  if (parent.type === 'ImportSpecifier') {
    return parent.local == null
      ? parent.imported === path.node
      : parent.local === path.node
  }
  if (
    parent.type === 'ImportDefaultSpecifier' ||
    parent.type === 'ImportNamespaceSpecifier'
  ) {
    return parent.local === path.node
  }
  if (
    parent.type === 'VariableDeclarator' ||
    parent.type === 'FunctionDeclaration' ||
    parent.type === 'FunctionExpression' ||
    parent.type === 'ClassDeclaration' ||
    parent.type === 'ClassExpression' ||
    parent.type === 'CatchClause'
  ) {
    return parent.id === path.node || parent.param === path.node
  }
  if (
    parent.type === 'FunctionDeclaration' ||
    parent.type === 'FunctionExpression' ||
    parent.type === 'ArrowFunctionExpression'
  ) {
    return parent.params.includes(path.node)
  }
  if (parent.type === 'RestElement' || parent.type === 'AssignmentPattern') {
    return parent.argument === path.node || parent.left === path.node
  }
  if (parent.type === 'Property' || parent.type === 'ObjectProperty') {
    return parent.value === path.node && !parent.computed
  }
  if (parent.type === 'ArrayPattern') {
    return parent.elements.includes(path.node)
  }

  return false
}

function cleanupImports(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  for (const path of root.find(state.j.ImportDeclaration).paths()) {
    if (!state.importDecls.has(path.node)) {
      continue
    }

    path.node.specifiers = (path.node.specifiers ?? []).filter(
      (specifier: any) => {
        if (specifier.type === 'ImportNamespaceSpecifier') {
          return namespaceStillUsed(root, specifier.local?.name)
        }
        if (specifier.type === 'ImportSpecifier') {
          const local =
            specifier.local?.name ??
            (specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value)
          if (
            (path.node.importKind === 'type' ||
              (specifier as any).importKind === 'type') &&
            state.importedTypeToTemporal.has(local)
          ) {
            return false
          }
          return localIdentifierStillUsed(root, state, local, specifier)
        }
        return true
      },
    )

    if ((path.node.specifiers ?? []).length === 0) {
      path.prune()
    }
  }
}

function namespaceStillUsed(
  root: ReturnType<JSCodeshift>,
  localName: string | undefined,
): boolean {
  if (localName == null) {
    return false
  }
  let used = false
  if (
    root
      .find(jscodeshift.MemberExpression, {
        object: { type: 'Identifier', name: localName },
      } as any)
      .size() > 0
  ) {
    used = true
  }
  if (
    root
      .find(jscodeshift.TSQualifiedName, {
        left: { type: 'Identifier', name: localName },
      } as any)
      .size() > 0
  ) {
    used = true
  }
  return used
}

function localIdentifierStillUsed(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
  localName: string,
  specifier: any,
): boolean {
  const temporalUtilsLocals = new Set(state.usedTemporalUtils.values())
  let used = false
  for (const path of root
    .find(jscodeshift.Identifier, { name: localName })
    .paths()) {
    if (path.node === specifier.local || path.node === specifier.imported) {
      continue
    }
    const parent = path.parent?.node
    if (parent?.type === 'ImportSpecifier') {
      continue
    }
    if (temporalUtilsLocals.has(localName)) {
      continue
    }
    if (
      parent?.type === 'MemberExpression' &&
      parent.property === path.node &&
      !parent.computed
    ) {
      continue
    }
    used = true
  }
  return used
}

// After safe rewrites are done, remaining fns references make the migration
// incomplete. They are warnings in the report, but the CLI fails by default.
function reportUnsupportedLeftovers(
  root: ReturnType<JSCodeshift>,
  state: TransformState,
): void {
  for (const path of root.find(state.j.MemberExpression).paths()) {
    const object = path.node.object
    const property = path.node.property
    if (object.type !== 'Identifier') {
      continue
    }
    const binding = namespaceBindingForLocal(state, object.name)
    if (binding != null) {
      if (path.node.computed || property.type !== 'Identifier') {
        warn(
          state,
          path.node,
          `Untransformed dynamic ${binding.typeName}Fns usage`,
        )
        continue
      }
      warn(
        state,
        path.node,
        `Untransformed ${binding.typeName}Fns.${property.name} usage`,
      )
    }
  }

  for (const path of root.find(state.j.VariableDeclarator).paths()) {
    const id = path.node.id
    const init = path.node.init
    if (id.type !== 'ObjectPattern' || init?.type !== 'Identifier') {
      continue
    }
    const binding = namespaceBindingForLocal(state, init.name)
    if (binding != null) {
      warn(
        state,
        path.node,
        `Untransformed ${binding.typeName}Fns destructuring`,
      )
    }
  }

  for (const path of root.find(state.j.Identifier).paths()) {
    const parent = path.parent?.node
    if (
      parent?.type === 'MemberExpression' &&
      parent.property === path.node &&
      !parent.computed
    ) {
      continue
    }

    const local = path.node.name
    if ([...state.usedTemporalUtils.values()].includes(local)) {
      continue
    }
    const calleeInfo = state.importedLocalToFn.get(local)
    if (calleeInfo == null) {
      continue
    }
    if (parent?.type === 'ImportSpecifier') {
      continue
    }
    warn(
      state,
      path.node,
      `Untransformed ${calleeInfo.binding.typeName} ${calleeInfo.exportName} usage`,
    )
  }
}

function getFnsCallee(
  state: TransformState,
  callee: any,
): { binding: FnBinding; exportName: string } | null {
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    callee.property.type === 'Identifier'
  ) {
    const binding = namespaceBindingForLocal(state, callee.object.name)
    if (binding != null) {
      return { binding, exportName: callee.property.name }
    }
  }

  if (callee.type === 'Identifier') {
    return state.importedLocalToFn.get(callee.name) ?? null
  }

  return null
}

function namespaceBindingForLocal(
  state: TransformState,
  localName: string,
): FnBinding | null {
  for (const binding of state.bindings.values()) {
    if (binding.namespaceName === localName) {
      return binding
    }
  }
  return null
}

function warn(state: TransformState, node: any | null, message: string): void {
  state.diagnostics.push({
    kind: 'warning',
    message,
    line: node?.loc?.start?.line,
    column: node?.loc?.start?.column,
  })
}

function stringLiteralValue(node: any): string | null {
  return typeof node.value === 'string' ? node.value : null
}
