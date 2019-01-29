import { Timestamp } from '@google-cloud/firestore';
import * as t from 'io-ts';
import { omit } from 'lodash/fp';
import { Omit } from '../types';
import { timestamp, utils } from './io-types';

/**
 * The lowest level definition object
 */
export const baseDefinitionObject = {
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: t.Integer,
  testData: utils.optional(t.boolean),
};

export const baseDefinition = t.readonly(t.interface(baseDefinitionObject));

export type BaseDefinition = t.TypeOf<typeof baseDefinition>;
export type PropsWithBase<GProps extends t.Props> = GProps & typeof baseDefinitionObject;
export type TypeOfPropsWithBase<GProps extends t.AnyProps> = t.TypeOfProps<PropsWithBase<GProps>>;
export type WithBaseDefinition<GDefinition> = GDefinition & BaseDefinition;
export type WithoutBaseDefinition<GDefinition> = GDefinition &
  { [P in keyof BaseDefinition]: never };

export type OmitBaseDefinition<T extends BaseDefinition> = Omit<T, keyof BaseDefinition>;
export type OmitBaseKeys<T extends BaseDefinition> = Exclude<T, keyof typeof baseDefinitionObject>;
export const omitBaseFields: <T extends BaseDefinition>(obj: T) => OmitBaseDefinition<T> = omit([
  'createdAt',
  'updatedAt',
  'schemaVersion',
  'testData',
]);

export const createDefaultBase = (base: Partial<BaseDefinition> = {}): BaseDefinition => ({
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  schemaVersion: 0,
  testData: undefined,
  ...base,
});
