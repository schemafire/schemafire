import { Struct, StructType, assert, object, number, string, array, validate } from 'superstruct';

type AnyStruct = Struct<any>;

export abstract class Collection {
  abstract readonly path: string;
  abstract readonly model: AnyStruct;

  createRef(): StructType<this['model']> {
    return {} as any;
  }

  constructor() {}
}

export interface Collection extends Function {
  constructor: Collection;
}

const articleModel = object({
  id: number(),
  title: string(),
  tags: array(string()),
  author: object({
    id: number(),
  }),
});

const [error, value] = validate({}, articleModel);

type ArticleModel = StructType<typeof articleModel>;

class ArticleCollection extends Collection {
  path = 'article' as const;
  model = articleModel;
}

type A = ReturnType<ArticleCollection['createRef']>;

interface SchemaSettings {}

class Schema<CollectionUnion extends Collection> {
  static create<CollectionUnion extends Collection>(
    collections: CollectionUnion[],
    settings: SchemaSettings,
  ) {
    return new Schema<CollectionUnion>(collections, settings);
  }

  get collections() {
    return this.#collections;
  }

  #collections: CollectionUnion[];
  #settings: SchemaSettings;

  private constructor(collections: CollectionUnion[], settings: SchemaSettings) {
    this.#collections = collections;
    this.#settings = settings;
  }
}
