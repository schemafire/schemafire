import { AnyModel, AnySchema, Schema } from '@schemafire/firestore';
import faker from 'faker';
import * as t from 'io-ts';
import { times } from 'lodash';

const DEFAULT_COUNT = 3;
type FakerJS = typeof faker;
export type ConfigMethod<GValue = unknown> = (faker: FakerJS, rawValue: GValue) => GValue;
export type ConfigMethodObject<GProps extends t.AnyProps> = { [P in keyof GProps]: ConfigMethod<GProps[P]> };

/**
 * This is the configuration object which can be passed into a generate data method
 */
export type GenerateDataConfig = AnySchema | [AnySchema, number];
// | { schema: GSchema; count?: number; config?: PropsOfSchema<AnySchema> };

type ModelCreator = (id: string, data: any) => AnyModel;
interface NormalizedModelParams {
  createModel: ModelCreator;
  codec: t.TypeC<t.AnyProps>;
  count: number;
}

const createModelData = (codec: t.TypeC<t.AnyProps>) => {
  const initialModelData: Record<string, any> = {};
  return Object.entries(codec.props).reduce((prev, [key, prop]) => {
    let value: unknown;
    value = prop === t.string ? faker.internet.userName() : 'unknown';
    return { ...prev, [key]: value };
  }, initialModelData);
};

/**
 * Normalize the models passed in.
 *
 * @param config
 * @param count
 */
const normalizeModels = (config: GenerateDataConfig[], count: number) => {
  const initialModels: Record<string, NormalizedModelParams> = {};
  return config.reduce((prev, current) => {
    let val: NormalizedModelParams;
    let key: string;
    if (Array.isArray(current)) {
      const [schema, num] = current;
      val = { createModel: (id, data) => schema.create(data, id), codec: schema.codec, count: num };
      key = schema.collection;
    } else {
      val = { createModel: (id, data) => current.create(data, id), codec: current.codec, count };
      key = current.collection;
    }
    return { ...prev, [key]: val };
  }, initialModels);
};

/**
 * Takes a configuration of schema, counts and overrides and generates a set of fake models.
 */
export const generateModels = (config: GenerateDataConfig[], count = DEFAULT_COUNT) => {
  const normalizedGenerator = normalizeModels(config, count);

  const initialData: Record<string, AnyModel[]> = {};
  return Object.entries(normalizedGenerator).reduce(
    (prev, [collection, { codec, count: num, createModel }]) => {
      const id = faker.random.alphaNumeric(10);
      const value = times(num, () => createModel(id, createModelData(codec)));
      return { ...prev, [collection]: value };
    },
    initialData,
  );
};

export const isSchema = (val: unknown): val is AnySchema => val instanceof Schema;
