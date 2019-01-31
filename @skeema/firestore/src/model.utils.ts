import { simpleError } from '@skeema/core';
import { AnyProps } from 'io-ts';
import { ModelActionType, QueryTuples } from './types';

export function throwIfCreateTypeWithNoData(type: ModelActionType, data: any) {
  if ([ModelActionType.FindOrCreate, ModelActionType.Create].includes(type) && !data) {
    throw simpleError(`Type '${type}' can only be defined with data`);
  }
}

export function throwIfNoClauses<GProps extends AnyProps>(clauses?: QueryTuples<GProps>) {
  if (!clauses) {
    throw simpleError(`Type '${ModelActionType.Query}' can only be defined with clauses`);
  }
  return true;
}
