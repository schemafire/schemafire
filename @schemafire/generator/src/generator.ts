import { AnyModel, AnySchema, Schema } from '@schemafire/firestore';
import faker from 'faker';
import * as t from 'io-ts';
import { times } from 'lodash';

type FakerJS = typeof faker;
export type ConfigMethod<GValue = unknown> = (faker: FakerJS, rawValue: GValue) => GValue;
export type ConfigMethodObject<GProps extends t.AnyProps> = { [P in keyof GProps]: ConfigMethod<GProps[P]> };

/**
 * This is the configuration object which can be passed into a generate data method
 */
export type GenerateDataConfig = AnySchema | [AnySchema, number];
// | { schema: GSchema; count?: number; config?: PropsOfSchema<AnySchema> };

type ModelCreator = (id: string, data: any) => AnyModel;
interface CollectionFakerParams {
  createModel: ModelCreator;
  codec: t.TypeC<t.AnyProps>;
  count: number;
}

/**
 * Takes a configuration of schema, counts and overrides and generates a set of fake models.
 */
export const generateModels = (config: GenerateDataConfig[], count = 3) => {
  const initialModels: Record<string, CollectionFakerParams> = {};
  const normalizedGenerator = config.reduce((prev, current) => {
    let val: CollectionFakerParams;
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

  const initialData: Record<string, Record<string, any>> = {};
  Object.entries(normalizedGenerator).reduce((prev, [collection, { codec, count, createModel }]) => {
    const data = times(count, () => null)
      .map(() => {
        const id = faker.random.alphaNumeric(10);
        // const createdAt = faker.date.past();
        // const updatedAt = faker.date.between(createdAt, new Date());
        // const schemaVersion = 0;
        const modelData = Object.entries(codec.props).reduce((prev, [key, prop]) => {
          let value: unknown;
          if (prop === t.string) {
            value = faker.internet.userName;
          } else {
            value = faker.internet.userName;
          }

          return { ...prev, [key]: value };
        }, {});
        return createModel(id, modelData).toJSON();
      })
      .reduce();
    return { ...prev, [collection]: data };
  }, initialData);
};

export const isSchema = (val: unknown): val is AnySchema => val instanceof Schema;
