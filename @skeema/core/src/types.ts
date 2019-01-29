export type Nullable<T> = { [P in keyof T]: T[P] | null };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Adds an id to the interface
 */
export type WithId<T> = T & { id: string };

/**
 * Creates a list of ID'd interfaces.
 * @see WithId
 */
export type MultiWithId<T> = Array<WithId<T>>;

/**
 * Makes specified keys of an interface Optional.
 */
export type MakeOptional<T1, T2 extends keyof T1> = Omit<T1, T2> & { [P in T2]+?: T1[P] };

/**
 * Makes specified keys of an interface nullable.
 */
export type MakeNullable<T1, T2 extends keyof T1> = Omit<T1, T2> & { [P in T2]: T1[P] | null };

/**
 * Makes specified keys of an interface Required.
 */
export type MakeRequired<T1, T2 extends keyof T1> = Omit<T1, T2> & { [P in T2]-?: T1[P] };

/**
 * Makes specified keys of an interface readonly.
 */
export type MakeReadonly<T1, T2 extends keyof T1> = Omit<T1, T2> & { +readonly [P in T2]: T1[P] };

export type PickReadonly<T1, T2 extends keyof T1> = { +readonly [P in T2]: T1[P] };

/* Helper Types */

/**
 * Get all property names from an interface which are functions.
 */
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends AnyFunction ? K : never
}[keyof T];

/**
 * Pick an interface composed entirely of the function properties.
 */
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

/**
 * Get all property names from an interface which are not functions.
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends AnyFunction ? never : K
}[keyof T];

/**
 * Pick an interface composed entirely of the non function properties.
 */
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type ValueOf<T> = T[keyof T];
export type Value<T> = ValueOf<T>;
export type Key<T> = keyof T;

export type Include<T, U> = T extends U ? T : never;

export type ValueOfStringArray<T> = Include<T[keyof T], string>;

export type Literal = string | number | boolean | undefined | null | void | {};

/**
 * Picks the first param from a function
 */
export type FirstParam<T extends (arg1: any, ...args: any[]) => any> = T extends (
  arg1: infer P,
  ...args: any
) => any
  ? P
  : never;

/**
 * Pick the Nth Param for any function with the first param marked by 0.
 * Zero-indexed.
 */
export type NthParam<T extends AnyFunction, N extends number> = T extends (...args: infer P) => any
  ? P[N]
  : never;

/**
 * Use this to create a Tuple with args that can be used as a type
 *
 * @example
 * ```
 * const ALL_SUITS = tuple('hearts', 'diamonds', 'spades', 'clubs');
 * type SuitTuple = typeof ALL_SUITS;
 * type Suit = SuitTuple[number]; // union type
 * ```
 * @param args
 */
export const tuple = <T extends Literal[]>(...args: T) => args;

/**
 * A useful helper for conditional types
 */
export type FilterFlags<Base, Condition> = {
  [P in keyof Base]: Base[P] extends Condition ? P : never
};

export type AnyFunction = (...args: any[]) => any;

/**
 * Useful for removing the empty interface `{}` from a list of types
 */
export type NonEmptyInterface<T> = keyof T extends never ? never : T;

export type AnyKey = string | number | symbol;
