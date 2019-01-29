import { Timestamp } from '@google-cloud/firestore';
import * as t from 'io-ts';

export class TimestampType extends t.Type<Timestamp> {
  public readonly _tag: 'TimestampType' = 'TimestampType';
  constructor() {
    super(
      'Timestamp',
      (m): m is Timestamp => m instanceof Timestamp,
      (m, c) => (this.is(m) ? t.success(m) : t.failure(m, c)),
      t.identity,
    );
  }
}

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
