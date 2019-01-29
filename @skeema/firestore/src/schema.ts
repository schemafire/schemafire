/* tslint:disable:no-any no-object-literal-type-assertion */

import { Cast, simpleError } from '@skeema/core';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import { Model } from './model';
import { Query } from './query';
import {
  AnySchema,
  BaseInjectedDeps,
  FieldsOfProps,
  FieldTypes,
  IModel,
  InstanceMethodConfig,
  IQuery,
  ISchema,
  MappedStaticMethods,
  ModelActionType,
  ModelCallback,
  ModelParams,
  QueryParams,
  QueryTuples,
  SchemaCacheRules,
  SchemaConfig,
  SchemaParams,
  StaticMethodConfig,
  TypeOfPropsWithBase,
} from './types';

export class Schema<
  GProps extends t.Props,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps = BaseInjectedDeps,
  GStaticMethods extends StaticMethodConfig<ISchema<GProps, any, GDependencies, any>> = any
> implements ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods> {
  public static version: number = 0;
  private static defaultConfig: SchemaConfig = {
    mirror: true,
    useTransactions: true,
  };

  public static setDefaultConfig(config: SchemaConfig) {
    Schema.defaultConfig = { ...Schema.defaultConfig, ...config };
  }

  private static instances: AnySchema[] = [];

  private static registerSchema(schema: AnySchema) {
    if (Schema.instances.some(instance => instance.collection === schema.collection)) {
      throw simpleError(
        'An identical schema has already been registered with this collection reference',
      );
    }
    this.instances.push(schema);
  }

  public static getInstance<Sch = any>(collection: string): Sch {
    const schema = Schema.instances.find(instance => instance.collection === collection);
    if (!schema) {
      throw simpleError('This schema has not been defined');
    }
    return schema as any;
  }

  private instanceMethods: GInstanceMethods = Cast<GInstanceMethods>({});
  public fields: FieldsOfProps<GProps>;
  public field: FieldTypes<GProps>;
  public collection: string;
  public get ref(): FirebaseFirestore.CollectionReference {
    return admin.firestore().collection(this.collection);
  }
  public get db(): FirebaseFirestore.Firestore {
    return admin.firestore();
  }
  public Type: symbol;
  public defaultData: t.TypeOfProps<GProps>;
  public mirror?: SchemaCacheRules<keyof GProps>;
  public dependencies: GDependencies = { initialized: false } as GDependencies;
  public config: SchemaConfig;
  public methods: MappedStaticMethods<this, GStaticMethods> = Cast<
    MappedStaticMethods<this, GStaticMethods>
  >({});

  public readonly version: number;

  constructor({
    fields,
    collection,
    defaultData,
    mirror,
    instanceMethods,
    dependencies,
    config,
    staticMethods,
  }: SchemaParams<GProps, GInstanceMethods, GDependencies, GStaticMethods>) {
    this.fields = fields;
    this.defaultData = defaultData;
    this.collection = collection;
    this.Type = Symbol(collection);

    this.mirror = mirror;

    this.methods = this.createStaticMethods(staticMethods);

    if (instanceMethods) {
      this.instanceMethods = instanceMethods;
    }

    if (dependencies) {
      this.dependencies = dependencies;
    }
    this.version = Schema.version;
    this.config = { ...Schema.defaultConfig, ...(config ? config : {}) };
    Schema.registerSchema(Cast<AnySchema>(this));
    this.field = this.createFieldTypes();
  }

  private createFieldTypes() {
    return Object.keys(this.fields.props).reduce(
      (prev, current) => {
        return Object.assign({}, prev, { [current]: current });
      },
      {} as FieldTypes<GProps>,
    );
  }

  private createStaticMethods(methods?: GStaticMethods): MappedStaticMethods<this, GStaticMethods> {
    const defaultMethods = Cast<MappedStaticMethods<this, GStaticMethods>>({});
    if (!methods) {
      return defaultMethods;
    }
    return Object.entries(methods).reduce((p, [key, method]) => {
      const mappedStaticMethods = Object.assign({}, p, {
        [key]: method(this),
      });
      return Cast<MappedStaticMethods<this, GStaticMethods>>(mappedStaticMethods);
    }, defaultMethods);
  }

  public model(
    params?: Partial<ModelParams<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      ...params,
    });
  }

  public create(
    data: Partial<t.TypeOfProps<GProps>>,
    id?: string,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    /* Potential options for a custom ID */
    const mergedData = Object.assign({}, this.defaultData, data);
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      data: mergedData,
      id,
      type: ModelActionType.Create,
    });
  }

  public findById(
    id: string,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      id,
      callback,
      type: ModelActionType.Find,
    });
  }

  /**
   * Will find the firestore model if it exists, otherwise a new one is created with the passed data.
   *
   * @param id
   * @param data
   * @param [callback] called if the model doesn't exist in Firestore
   * @returns {IModel<GProps, GInstanceMethods, GDependencies>}
   */
  public findOrCreate(
    id: string,
    data: Partial<t.TypeOfProps<GProps>>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    /* Potential options for a custom ID */
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      data,
      id,
      callback,
      type: ModelActionType.FindOrCreate,
    });
  }

  /**
   * Creates a model from the provided snapshot.
   */
  public fromSnap(
    snap: FirebaseFirestore.DocumentSnapshot,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      data: snap.data() as TypeOfPropsWithBase<GProps>,
      snap,
      id: snap.id,
    });
  }

  public fromDoc(
    doc: FirebaseFirestore.DocumentReference,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      doc,
      id: doc.id,
    });
  }

  public deleteById(id: string): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      id,
      type: ModelActionType.Delete,
    });
  }

  public findWhere(clauses: QueryTuples<GProps>): IQuery<GProps, GInstanceMethods, GDependencies> {
    if (!clauses || !clauses.length) {
      throw simpleError('Must pass through query params');
    }

    return new Query({ schema: this, clauses });
  }

  public query(
    params: QueryParams<GProps, GInstanceMethods, GDependencies>,
  ): IQuery<GProps, GInstanceMethods, GDependencies> {
    return new Query(params);
  }

  /**
   * Finds the first occurrence of your specified clauses
   */
  public find(
    clauses: QueryTuples<GProps>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies> {
    return new Model({
      schema: this,
      methods: this.instanceMethods,
      callback,
      type: ModelActionType.Query,
      clauses,
    });
  }

  public findOne = this.find;
}
