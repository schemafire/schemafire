import { Cast, Omit, simpleError } from '@schemafire/core';
import { AnyProps, TypeOfProps } from 'io-ts';
import { isPlainObject } from 'lodash';
import { SCHEMA_CONFIG } from './constants';
import { ValidationError } from './errors';
import { Model } from './model/model';
import { Query } from './query';
import {
  AnySchema,
  BaseInjectedDeps,
  CreateArgs,
  FieldsOfProps,
  FindOrCreateArgs,
  IModel,
  InstanceMethodConfig,
  IQuery,
  ISchema,
  MappedStaticMethods,
  ModelActionType,
  ModelCallback,
  ModelParams,
  QueryOptions,
  QueryTuples,
  SchemaCacheRules,
  SchemaConfig,
  SchemaParams,
  StaticMethodConfig,
  StringKeys,
  TypeOfPropsWithBase,
} from './types';
import { hasData } from './utils';

/**
 * Create schema for your Firestore collections
 * ```ts
 * import { Schema } from '@schemafire/firestore';
 * const User = new Schema({ });
 */
export class Schema<
  GProps extends AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps = BaseInjectedDeps,
  GStaticMethods extends StaticMethodConfig<ISchema<GProps, any, GDependencies, any>> = any
> implements ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods> {
  /**
   * The default
   */
  private static defaultConfig: SchemaConfig = {
    ...SCHEMA_CONFIG,
  };

  private static instances: AnySchema[] = [];

  /**
   * Registers a schema to ensure collections are unique
   */
  private static registerSchema(schema: AnySchema) {
    if (Schema.instances.some(instance => instance.collection === schema.collection)) {
      throw simpleError('An identical schema has already been registered with this collection reference');
    }
    this.instances.push(schema);
  }

  /**
   * Readonly property which provides a version for the schema model currently being used.
   * TODO implement version checking and migrations.
   */
  public static get version(): number {
    return 0;
  }
  /**
   * Set the default configuration for all the schema created. Leave empty to reset
   * @param config
   */
  public static setDefaultConfig(config: Partial<Omit<SchemaConfig, 'emptyCollection'>> = {}) {
    Schema.defaultConfig = { ...Schema.defaultConfig, ...config, emptyCollection: false };
  }

  /**
   * Retrieve another collection by it's name.
   * Types are not automatically available to you can pass them in as a generic property.
   */
  public static getInstance<Sch = AnySchema>(collection: string): Sch {
    const schema = Schema.instances.find(instance => instance.collection === collection);
    if (!schema) {
      throw simpleError('This schema has not been defined');
    }
    return schema as any;
  }

  /**
   * Holds a private reference to the instance methods for all models that this schema will generate.
   */
  private instanceMethods: GInstanceMethods = Cast<GInstanceMethods>({});

  /**
   * This is the customConfig passed in at configuration.
   */
  private readonly customConfig: Partial<SchemaConfig>;

  /**
   * The codec used to validate all models and provide typings for the models.
   */
  public readonly codec: FieldsOfProps<GProps>;

  /**
   * The top level field keys of this schema
   */
  public readonly keys: Array<StringKeys<GProps>>;

  /**
   * A unique collection string identifier.
   */
  public readonly collection: string;

  /**
   * Gives easy access to the collectionReference for all instance models.
   */
  get ref(): FirebaseFirestore.CollectionReference {
    return this.db.collection(this.collection);
  }

  /**
   * Utility db reference.
   */
  get db(): FirebaseFirestore.Firestore {
    return Schema.defaultConfig.databaseGetter();
  }

  /**
   * The configuration for this schema
   *
   * @readonly
   */
  get config(): SchemaConfig {
    return { ...Schema.defaultConfig, ...this.customConfig };
  }

  /**
   * The default data for every model created with this schema.
   * Ideally default data should be valid data that is always overwritten at creation time.
   */
  public readonly defaultData: Partial<TypeOfProps<GProps>>;

  /**
   * Mirrors allow for data in one collection to automatically be copied over to another collection.
   *
   * This is useful if there is complex child data that has few writes but multiple reads. It can be mirrored to another collection where it
   * it can be made available with one read.
   *
   * For example a user has profile data.
   *
   * The profile data needs to be public available to the world on the client side, but you don't want to make the user data also public. (Firebse doesn't allow for partial reads of data in firestore rules).
   * To solve this problem we create a User collection and a Profile collection each one has the same ID (making lookups simpler).
   *
   * At instantiation the profile data would be copied over to the user. Any subsequent updates and deletes are copied over.
   * While on the client side one read of the user gives us all the user profile data.
   */
  public readonly mirror?: SchemaCacheRules<keyof GProps>;

  /**
   * The dependencies injected into the instance methods at runtime.
   */
  public dependencies: GDependencies = Cast<GDependencies>({ initialized: false });

  /**
   * Static methods for this schema which were defined at configuration
   */
  public methods: MappedStaticMethods<
    ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods>,
    GStaticMethods
  > = Cast<
    MappedStaticMethods<ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods>, GStaticMethods>
  >({});

  /**
   * The current version of data in this schema. This will be used more once data migrations are supported.
   */
  get version(): number {
    return Schema.version;
  }

  /**
   * This class sets the structure and template for a collection within your firestore database.
   * All models can be created from a schema with built in validation and typechecking.
   *
   * ```ts
   * const definition = t.interface({
   *   name: t.string,
   *   age: t.number,
   *   data: t.object,
   * });
   *
   * const defaultData = { name: '', data: {}, age: 20 };
   *
   * const User = new Schema({
   *   codec: fields,
   *   defaultData,
   *   collection: 'User',
   *   staticMethods: {
   *     simple: ctx => (...args) => { },
   *     withArgs: () => (custom: string) => {},
   *     withReturnValue: () => (ret: boolean) => {},
   *   },
   * });
   * ```
   *
   * Static methods can now be used as follows.
   * ```ts
   * await User.simple(...args); // Called with the args you expect
   * ```
   */
  constructor({
    codec,
    collection,
    defaultData,
    mirror,
    instanceMethods,
    dependencies,
    config,
    staticMethods,
  }: SchemaParams<GProps, GInstanceMethods, GDependencies, GStaticMethods>) {
    this.codec = codec;
    this.defaultData = defaultData || {};
    this.collection = collection;

    this.mirror = mirror;

    this.methods = this.createStaticMethods(staticMethods);

    if (instanceMethods) {
      this.instanceMethods = instanceMethods;
    }

    if (dependencies) {
      this.dependencies = dependencies;
    }
    this.customConfig = config || {};
    this.keys = Cast<Array<StringKeys<GProps>>>(Object.keys(this.codec.props));
    Schema.registerSchema(Cast<AnySchema>(this));
  }

  /**
   * Create the static methods which can be called directly from the Schema instance.
   */
  private createStaticMethods(
    methods?: GStaticMethods,
  ): MappedStaticMethods<ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods>, GStaticMethods> {
    const defaultMethods = Cast<
      MappedStaticMethods<ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods>, GStaticMethods>
    >({});
    if (!methods) {
      return defaultMethods;
    }
    return staticMethodTransformer(methods, this, defaultMethods);
  }

  /**
   * Create a model instance which doesn't call any actions.
   */
  public model(
    params?: Partial<ModelParams<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      ...params,
    });
  }

  /**
   * A model instance with the create action. When run is called this model will be created.
   */
  public create(params: CreateArgs<GProps>): IModel<GProps, GInstanceMethods, GDependencies> {
    /* Potential options for a custom ID */
    const data = hasData(params) ? params.data : {};
    const mergedData = { ...this.defaultData, ...data };
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      data: mergedData,
      id: params.id,
      type: ModelActionType.Create,
    });
  }

  /**
   * Create a model and find an existing document if one exists.
   */
  public findById(
    id: string,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      id,
      callback,
      type: ModelActionType.Find,
    });
  }

  /**
   * Tries to find a document but if not found one is created.
   */
  public findOrCreate(
    params: FindOrCreateArgs<GProps, GInstanceMethods, GDependencies>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    const { callback, id } = params;
    const data = hasData(params) ? params.data : {};
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      data,
      id,
      callback,
      type: ModelActionType.FindOrCreate,
    });
  }

  /**
   * Create a model from a document snapshot. This is useful when consuming code from other firestore libraries
   * and also receiving data in cloud functions.
   *
   * This method doesn't add any actions to the mode.
   */
  public fromSnap(snap: FirebaseFirestore.DocumentSnapshot): IModel<GProps, GInstanceMethods, GDependencies> {
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      data: snap.data() as TypeOfPropsWithBase<GProps>,
      snap,
      id: snap.id,
    });
  }

  /**
   * Similar to `fromSnap`. Create a model from a firestore document reference
   */
  public fromDoc(doc: FirebaseFirestore.DocumentReference): IModel<GProps, GInstanceMethods, GDependencies> {
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      doc,
      id: doc.id,
    });
  }

  /**
   * Find a model by ID and delete it.
   *
   * ```ts
   * await schema.deleteById(userId).run();
   * ```
   */
  public deleteById(id: string): IModel<GProps, GInstanceMethods, GDependencies> {
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      id,
      type: ModelActionType.Delete,
    });
  }

  /**
   * Find the first document matching the clauses passed.
   */
  public find(
    clauses: QueryTuples<GProps>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return this.model({
      schema: this,
      methods: this.instanceMethods,
      callback,
      type: ModelActionType.Query,
      clauses,
    });
  }

  /**
   * @alias this.find
   */
  public findOne = this.find;

  /**
   * Validate a model or a model's data object.
   */
  public validate(data: unknown) {
    if (data instanceof Model && data.schema === this) {
      return data.validate();
    }

    if (isPlainObject(data)) {
      return this.codec.decode(data).fold(ValidationError.create, () => undefined);
    }

    return ValidationError.create();
  }

  /**
   * Utility for creating plain queries.
   */
  public query(
    clauses: QueryTuples<GProps>,
    options?: QueryOptions<GProps, GInstanceMethods, GDependencies>,
  ): IQuery<GProps, GInstanceMethods, GDependencies> {
    return new Query({
      schema: this,
      clauses,
      ...options,
    });
  }

  /**
   * Creates a query object which can contain multiple models.
   */
  public findWhere(clauses: QueryTuples<GProps>): IQuery<GProps, GInstanceMethods, GDependencies> {
    if (!clauses || !clauses.length) {
      throw simpleError('Must pass through query params');
    }

    return this.query(clauses);
  }
}

/**
 * Converts static methods from configuration into callable functions that can exists on the
 * schema instance.
 */
function staticMethodTransformer<GSchema extends AnySchema, GStaticMethods extends StaticMethodConfig<any>>(
  methods: GStaticMethods,
  schema: GSchema,
  defaultMethods: MappedStaticMethods<GSchema, GStaticMethods>,
) {
  return Object.entries(methods).reduce((p, [key, method]) => {
    const mappedStaticMethods = { ...p, [key]: method(schema) };
    return Cast<MappedStaticMethods<GSchema, GStaticMethods>>(mappedStaticMethods);
  }, defaultMethods);
}
