export type LocaleId = 'en-us' | string
export type Instant = number

export type AssignmentOptions = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLike = Partial<AssignmentOptions>

export type CompareReturn = -1 | 0 | 1

/** Constructs a type with specified properties set to required and the rest as optional */
export type Part<A, B extends keyof A> = Required<Pick<A, B>> & Partial<A>
