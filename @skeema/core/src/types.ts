/**
 * Make an interface nullable
 */
export type Nullable<GType> = { [P in keyof GType]: GType[P] | null };

/**
 * Remove keys from an interface
 */
export type Omit<GType, GKeys extends keyof GType> = Pick<GType, Exclude<keyof GType, GKeys>>;

/**
 * Makes specified keys of an interface Optional.
 */
export type MakeOptional<GType, GKeys extends keyof GType> = Omit<GType, GKeys> &
  { [P in GKeys]+?: GType[P] };

/**
 * Makes specified keys of an interface nullable.
 */
export type MakeNullable<GType, GKeys extends keyof GType> = Omit<GType, GKeys> &
  { [P in GKeys]: GType[P] | null };

/**
 * Makes specified keys of an interface Required.
 */
export type MakeRequired<GType, GKeys extends keyof GType> = Omit<GType, GKeys> &
  { [P in GKeys]-?: GType[P] };

/**
 * Makes specified keys of an interface readonly.
 */
export type MakeReadonly<GType, GKeys extends keyof GType> = Omit<GType, GKeys> &
  { +readonly [P in GKeys]: GType[P] };

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

/**
 * Pick the values from a type
 */
export type ValueOf<GType> = GType[keyof GType];

/**
 * Alias of @see ValueOf
 */
export type Value<GType> = ValueOf<GType>;
export type Key<GType> = keyof GType;

/**
 * Removes all types from a union that don't extend from the extender type
 */
export type Include<GType, GExtender> = GType extends GExtender ? GType : never;

export type ValueOfStringArray<GType> = Include<GType[Key<GType>], string>;

/**
 * A union of all the type primitives (including the empty object)
 */
export type Literal = string | number | boolean | undefined | null | void | {};

/**
 * Pick the Nth Param for any function with the first param marked by 0.
 * Zero-indexed.
 */
export type NthParam<GFunction extends AnyFunction, GIndex extends number> = GFunction extends (
  ...args: infer GArgs
) => any
  ? GArgs[GIndex]
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
export const tuple = <GType extends Literal[]>(...args: GType) => args;

/**
 * A useful helper for conditional types
 */
export type FilterFlags<GBase, GCondition> = {
  [P in keyof GBase]: GBase[P] extends GCondition ? P : never
};

export type AnyFunction = (...args: any[]) => any;

/**
 * Useful for removing the empty interface `{}` from a list of types
 */
export type NonEmptyInterface<GType> = keyof GType extends never ? never : GType;

export type AnyKey = string | number | symbol;
