import { Timestamp } from '@google-cloud/firestore';
import * as t from 'io-ts';
import { omit } from 'lodash/fp';
import { Omit } from '../types';
import { timestamp } from './io-types';

/**
 * The lowest level definition object
 */
export const baseDefinitionObject = {
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: t.Integer,
};

export const baseDefinition = t.readonly(t.interface(baseDefinitionObject));

export type BaseDefinition = t.TypeOf<typeof baseDefinition>;
export type PropsWithBase<GProps extends t.Props> = GProps & typeof baseDefinitionObject;
export type TypeOfPropsWithBase<GProps extends t.AnyProps> = t.TypeOfProps<PropsWithBase<GProps>>;
export type WithBaseDefinition<GDefinition> = GDefinition & BaseDefinition;

export type BaseDefinitionKeys = 'createdAt' | 'updatedAt' | 'schemaVersion';
export const omitBaseFields: <T extends BaseDefinition>(
  obj: T,
) => Omit<T, BaseDefinitionKeys> = omit(['createdAt', 'updatedAt', 'schemaVersion']);

export const createDefaultBase = (base: Partial<BaseDefinition> = {}): BaseDefinition => ({
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  schemaVersion: 0,
  ...base,
});
