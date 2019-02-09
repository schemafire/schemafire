import { Cast } from '@schemafire/core';
import { AnyProps } from 'io-ts';
import { BaseDefinition } from './base';
import { AnyModel, ModelAction, ModelActionType, TypeOfProps, TypeOfPropsWithBase } from './types';
import { isBaseProp } from './utils';

export type ActionsArray<GProps extends AnyProps, GModel extends AnyModel> = Array<
  ModelAction<TypeOfProps<GProps>, GModel>
>;

interface CreateDataProxyParams<GProps extends AnyProps, GModel extends AnyModel> {
  target: TypeOfProps<GProps>;

  /**
   * Fallback to use for the base props in case they don't exist on the target.
   */
  baseData: BaseDefinition;

  /**
   * A mutable array of actions which will be pushed to (identifying that something has changed)
   */
  actions: ActionsArray<GProps, GModel>;

  /**
   * A function which determines whether the base data should be used as a fallback when getting data.
   */
  useBaseData?: () => boolean;
}

const defaultUseBaseData = () => true;

/**
 * Creates the proxy that is used when `model.data` is accessed, updated and deleted.
 *
 * Blocks writes to base properties.
 */
export const createDataProxy = <GProps extends AnyProps, GModel extends AnyModel>({
  target,
  baseData,
  actions,
  useBaseData = defaultUseBaseData,
}: CreateDataProxyParams<GProps, GModel>) => {
  type PropsWithBase = TypeOfPropsWithBase<GProps>;

  return new Proxy<PropsWithBase>(Cast<PropsWithBase>(target), {
    get: (_, prop: string) => {
      return target[prop] !== undefined
        ? target[prop]
        : isBaseProp(prop) && useBaseData()
        ? baseData[prop]
        : undefined;
    },
    set: (_, prop: keyof GProps, value) => {
      if (isBaseProp(prop)) {
        throw new TypeError(`The property ${prop} is readonly and cannot be set`);
      }
      if (prop in target) {
        actions.push({
          data: Cast({ [prop]: value }),
          type: ModelActionType.Update,
        });
        target[prop] = value;
        return true;
      }
      throw new TypeError(`The property ${prop} does not exist on ${target}`);
    },
    deleteProperty: (_, prop: keyof GProps) => {
      if (isBaseProp(prop)) {
        throw new TypeError(`The property ${prop} cannot be deleted`);
      }
      if (prop in target) {
        actions.push({
          data: Cast(prop),
          type: ModelActionType.DeleteField,
        });

        // Set to undefined rather than delete so that we can still dot access it later without throwing an error
        // Firebase doesn't support undefined so all undefined values are stripped before being saved.
        target[prop] = Cast(undefined);
        return true;
      }
      throw new TypeError(`The property ${prop} does not exist on this model`);
    },
  });
};
