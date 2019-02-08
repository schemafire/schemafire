import * as t from 'io-ts';

/**
 * Plain dictionary type with little typechecking.
 */
export class DictionaryType extends t.Type<{ [key: string]: any }> {
  public readonly _tag: 'DictionaryType' = 'DictionaryType';

  constructor() {
    super(
      'Dictionary',
      (u): u is { [key: string]: any } => u !== null && typeof u === 'object',
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity,
    );
  }
}

/**
 * Allows the creation of a generic dictionary type which can be validated according to requirements and present a custom
 * type to the TypeScript compiler.
 */
export class GenericDictionaryType<T, U extends string> extends t.Type<T> {
  public readonly _tag: 'DictionaryType' = 'DictionaryType';

  constructor(name: U, validation = (_: unknown) => true) {
    super(
      name as U,
      (u): u is T => u !== null && typeof u === 'object' && validation(u),
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity,
    );
  }
}
