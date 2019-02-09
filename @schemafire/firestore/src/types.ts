import { Key, Omit } from '@schemafire/core';
import * as t from 'io-ts';
import { BaseDefinition } from './base';
import { SchemaFireValidationError } from './validation';

/**
 * Determines where data should be copied to when an update happens in the model.
 */
export interface SchemaCacheRules<GKeys> {
  name: string;
  /** */
  collection: string;
  /**
   * The fields to copy over to the mirrored document
   */
  fields?: GKeys[];
  /**
   * By default mirroring assumes the id's are shared between both models. This allows for overriding the id field.
   */
  idField?: GKeys;
}

/**
 * The definition keys attached to every model (not validated and readonly).
 */
export type BaseDefinitionKeys = 'createdAt' | 'updatedAt' | 'schemaVersion';

export type JSONRepresentationType = 'timestamp' | 'geo' | 'doc' | 'coll';
export interface JSONRepresentation<GData> {
  type: JSONRepresentationType;
  data: GData;
}

/**
 * The date in JSON format
 * The same as calling `(new Date()).toJSON()`
 */
export interface JSONTimestamp extends JSONRepresentation<string> {
  type: 'timestamp';
}

export interface JSONGeoPoint extends JSONRepresentation<{ longitude: number; latitude: number }> {
  type: 'geo';
}

/**
 * The data is the full path of the document reference
 */
export interface JSONDocumentReference extends JSONRepresentation<string> {
  type: 'doc';
}

/**
 * The data is a full path of the collection reference
 */
export interface JSONCollectionReference extends JSONRepresentation<string> {
  type: 'coll';
}

export type PrimitiveKeys<GType extends {}> = {
  [P in Key<GType>]: GType[P] extends FirebaseFirestore.Timestamp
    ? JSONTimestamp
    : GType[P] extends FirebaseFirestore.GeoPoint
    ? JSONGeoPoint
    : GType[P] extends FirebaseFirestore.DocumentReference
    ? JSONDocumentReference
    : GType[P] extends FirebaseFirestore.CollectionReference
    ? JSONCollectionReference
    : GType[P]
};

/**
 * Reconstruct the original TypeC passed in from the prop object type.
 */
export type FieldsOfProps<GProps extends t.AnyProps> = t.TypeC<GProps>;
export type TypeOfProps<GProps extends t.AnyProps> = t.TypeOf<FieldsOfProps<GProps>>;
export type TypeOfPropsWithBase<GProps extends t.AnyProps> = t.TypeOfProps<GProps> & BaseDefinition;
export type JSONifyProps<GProps extends t.AnyProps> = PrimitiveKeys<TypeOfPropsWithBase<GProps>> & {
  id: string;
};

export interface ModelParams<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> {
  schema: ISchema<GProps, GInstanceMethods, GDependencies>;
  methods: GInstanceMethods;
  id?: string;
  data?: Partial<TypeOfPropsWithBase<GProps>>;
  snap?: FirebaseFirestore.DocumentSnapshot;
  doc?: FirebaseFirestore.DocumentReference;
  type?:
    | ModelActionType.FindOrCreate
    | ModelActionType.Create
    | ModelActionType.Delete
    | ModelActionType.Find
    | ModelActionType.Query;
  callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>;
  clauses?: QueryTuples<GProps>;
}

export interface QueryParams<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> {
  schema: ISchema<GProps, GInstanceMethods, GDependencies>;
  snap?: FirebaseFirestore.QuerySnapshot;
  clauses: QueryTuples<GProps>;
  limit?: number;
  attach?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>;
}

export interface BaseInjectedDeps {
  initialized: boolean;
}

export interface SchemaParams<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies> = {},
  GDependencies extends BaseInjectedDeps = BaseInjectedDeps,
  GStaticMethods extends StaticMethodConfig<
    ISchema<GProps, GInstanceMethods, GDependencies, GStaticMethods>
  > = any
> {
  codec: FieldsOfProps<GProps>;
  collection: string;
  defaultData: TypeOfProps<GProps>;
  mirror?: SchemaCacheRules<keyof GProps>;
  instanceMethods?: GInstanceMethods;
  staticMethods?: GStaticMethods;
  dependencies?: GDependencies;
  config?: SchemaConfig;
}

export interface ISchema<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps = BaseInjectedDeps,
  GStaticMethods extends StaticMethodConfig<ISchema<GProps, any, GDependencies, any>> = any
> {
  readonly version: number;
  codec: FieldsOfProps<GProps>;
  collection: string;
  defaultData: TypeOfProps<GProps>;
  mirror?: SchemaCacheRules<keyof GProps>;
  methods: MappedStaticMethods<this, GStaticMethods>;
  dependencies: GDependencies;
  config: SchemaConfig;
  ref: FirebaseFirestore.CollectionReference;
  db: FirebaseFirestore.Firestore;

  /**
   * The top level field keys of this schema
   */
  keys: Array<StringKeys<GProps>>;

  /**
   * A utility method for creating the model with full control.
   * @param params
   */
  model(
    params?: Partial<ModelParams<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Create a query from the defined schema
   * @param params
   */
  query(
    params?: Partial<QueryParams<GProps, GInstanceMethods, GDependencies>>,
  ): IQuery<GProps, GInstanceMethods, GDependencies>;

  create(data: TypeOfProps<GProps>, id?: string): IModel<GProps, GInstanceMethods, GDependencies>;
  /**
   * This will find the firestore model if it exists, otherwise a new one is created with the passed data.
   *
   * @param id
   * @param data
   * @param [callback] called if the model doesn't exist in Firestore
   */
  findOrCreate(
    id: string,
    data: TypeOfProps<GProps>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Find data by ID.
   * The callback parameter is called with the data once it is received.
   * @param id
   * @param callback
   */
  findById(
    id: string,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Deletes te instance of the collection with the provided id.
   *
   * ```ts
   * UserSchema.deleteById('sally').run()
   *   .then(() => console.log('Deleted'))
   *   .catch(e => console.log(e));
   * ```
   * @param id
   */
  deleteById(id: string): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Creates a model from the provided snapshot.
   * @param snap
   */
  fromSnap(snap: FirebaseFirestore.DocumentSnapshot): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Creates a model from the provided `DocumentReference`
   * @param doc
   */
  fromDoc(doc: FirebaseFirestore.DocumentReference): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Finds an instance of the model with the provided clauses.
   *
   * @param clauses
   */
  findWhere(params: QueryTuples<GProps>): IQuery<GProps, GInstanceMethods, GDependencies>;

  /**
   * Finds the first occurrence of your specified clauses
   */
  find(
    params: QueryTuples<GProps>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies>;

  /**
   * Finds the first occurrence of your specified clauses
   * @alias this.find
   */
  findOne(
    params: QueryTuples<GProps>,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
  ): IModel<GProps, GInstanceMethods, GDependencies>;
}

/**
 * Configuration that is passed into the schema.
 */
export interface RunConfig {
  /**
   * Should data be mirrored for this run
   * @default true
   */
  mirror?: boolean;
  /**
   * Whether to run the actions inside a transaction
   * @default true
   */
  // useTransactions?: boolean;
  /**
   * Number of attempts the transaction should take before failing
   */
  maxAttempts?: number;
  /**
   * Whether we want to get the latest data after an Create or Update action.
   * This can be useful when creating data for the first time and we want to view the ServerTimestamp.
   */
  forceGet?: boolean;
  /**
   * Determines whether validation should happen on create and update.
   * @default true
   */
  autoValidate?: boolean;
}

export interface SchemaConfig extends RunConfig {}

export type FieldsOf<GModel extends AnyModel> = GModel extends IModel<infer GFields, any, any>
  ? GFields
  : never;

export interface IModel<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> {
  data: TypeOfPropsWithBase<GProps>;
  doc: FirebaseFirestore.DocumentReference;
  id: string;
  snap?: FirebaseFirestore.DocumentSnapshot;
  exists: boolean;
  schema: ISchema<GProps, GInstanceMethods, GDependencies>;
  methods: MappedInstanceMethods<GProps, GInstanceMethods, GDependencies>;
  /**
   * Async method that runs all pending actions.
   * The order of preference is as such, with one being the highest priority.
   *
   * Nothing happens until run is called on the model.
   *
   * 1. **Delete** overrides all other actions and leaves you with an empty model.
   * 2. **FindOrCreate** will always perform a read to see if data exists.
   *    If so the models data will be populated, if not then the new data will be added.
   *    It uses the softer create method internally so it would fail if a model of the
   *    same id is created in the time between checking and creation.
   * 3. **Create** will unconditionally create a new document and override anything in the process.
   * 4. **Find** will find data for usage
   */
  run(config?: RunConfig): Promise<this>;
  /**
   * Delete data from model
   */
  delete(keys?: Array<keyof TypeOfProps<GProps>>): this;
  /**
   * Update multiple params in one run.
   */
  update(data: Partial<t.TypeOfProps<GProps>>): this;
  /**
   * Update multiple params in one run.
   */
  attach(callback: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>): this;

  /**
   * Create data on the model. Usually this is done on an empty model, however it can also be used to
   * completely overwrite data on an existing model.
   *
   * ```ts
   * await model.create({ ...data }, false).run();
   * ```
   * @param data  Full data for the model
   * @param force if true will overwrite data if it exists defaults to `false`
   */
  create(data: TypeOfProps<GProps>, force?: boolean): this;

  validate(): undefined | SchemaFireValidationError;

  /**
   * Returns a valid JSON representation of this model
   */
  toJSON(): JSONifyProps<GProps>;
}

export interface IQuery<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> {
  query: FirebaseFirestore.Query;
  snap?: FirebaseFirestore.QuerySnapshot;
  schema: ISchema<GProps, GInstanceMethods, GDependencies>;

  /**
   * Async method that runs all pending actions.
   * The order of preference is as such.
   */
  run(config?: RunConfig): Promise<this>;

  /**
   * Delete data from model
   */
  deleteAll(keys?: Array<keyof TypeOfProps<GProps>>): this;

  /**
   * Update multiple params in once go
   */
  updateAll(data: Partial<TypeOfProps<GProps>>): this;

  /**
   * Update multiple params in once go
   */
  attachAll(callback: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>): this;

  overwriteAll(data: TypeOfProps<GProps>, force?: boolean): this;
}

export interface ModelCallbackParams<GModel extends AnyModel> {
  /**
   * Whether or not a snapshot exists for the model.
   */
  exists: boolean;
  /**
   * The data that can be edited directly.
   * `data.name = 'Simply Best';`
   * `delete data.subscriptionId`;
   */
  data: GModel['data'];
  doc: FirebaseFirestore.DocumentReference;
  /**
   * The id of this model
   */
  id: string;
  snap?: FirebaseFirestore.DocumentSnapshot;
  /**
   * Delete keys (can't delete the whole model though at this point)
   * @param keys
   */
  delete(keys: Array<keyof GModel['schema']['defaultData']>): void;

  /**
   * Updates data in the current run loop
   * @param data
   */
  update(data: Partial<GModel['schema']['defaultData']>): void;

  /**
   * Force creates data for the model
   * @param data
   */
  create(data: GModel['schema']['defaultData']): void;
}

/**
 * Receives the latest data and allows for a variety of synchronous actions.
 */
export type ModelCallback<GModel extends AnyModel> = (params: ModelCallbackParams<GModel>) => void;

export enum ModelActionType {
  FindOrCreate = 'FindOrCreate',
  Create = 'Create',
  Update = 'Update',
  DeleteField = 'DeleteField',
  Delete = 'Delete',
  Find = 'Find',
  Query = 'Query',
  Callback = 'Callback',
}

export interface CreateModelAction<GData> {
  type: ModelActionType.Create;
  data: GData;
}

export interface FindModelAction {
  type: ModelActionType.Find;
}

export interface QueryModelAction {
  type: ModelActionType.Query;
  data: Array<QueryTuple<string>>;
}

export interface CallbackModelAction<GModel extends AnyModel> {
  type: ModelActionType.Callback;
  callback: ModelCallback<GModel>;
}

export interface UpdateModelAction<GData> {
  type: ModelActionType.Update;
  data: Partial<GData>;
}

export interface DeleteFieldModelAction<GData> {
  type: ModelActionType.DeleteField;
  data: Exclude<keyof GData, keyof BaseDefinition>;
}

export interface DeleteModelAction {
  type: ModelActionType.Delete;
}

export interface FindOrCreateModelAction<GData> {
  type: ModelActionType.FindOrCreate;
  data: GData;
}

/**
 * Model actions are added to the model and determine the updates sent to the firestore database.
 */
export type ModelAction<GData, GModel extends AnyModel> =
  | CreateModelAction<GData>
  | UpdateModelAction<GData>
  | DeleteFieldModelAction<GData>
  | FindOrCreateModelAction<GData>
  | DeleteModelAction
  | FindModelAction
  | QueryModelAction
  | CallbackModelAction<GModel>;

export type AnyModelAction = ModelAction<any, any>;

export type AnySchema = ISchema<any, any, any>;
export type AnyModel = IModel<any, any, any>;

/**
 * Extract the type of a model from a given schema
 */
export type ModelTypeOfSchema<GSchema extends AnySchema> = ReturnType<GSchema['model']>;

/**
 * Extract the props from any schema
 */
export type PropsOfSchema<GSchema extends AnySchema> = GSchema['codec']['props'];

/**
 * Extract the field keys from any schema
 */
export type FieldKeysOfSchema<GSchema extends AnySchema> = Key<PropsOfSchema<GSchema>>;

/**
 * Extract the type of data including the BaseProps `createdAt` | `updatedAt` | `schemaVersion`.
 */
export type TypeOfData<GSchema extends AnySchema> = ModelTypeOfSchema<GSchema>['data'];

/**
 * Type of data without any of the base props.
 */
export type TypeOfCreateData<GSchema extends AnySchema> = Omit<TypeOfData<GSchema>, BaseDefinitionKeys>;

export type PickPropertiesFromModel<GModel extends AnyModel> = Pick<
  GModel,
  'data' | 'doc' | 'id' | 'snap' | 'delete' | 'update' | 'create'
>;

export type FieldTypes<GProps extends t.AnyProps> = { [P in keyof GProps]: P };
export type StringKeys<GProps extends t.AnyProps> = Extract<keyof GProps, string>;
export type QueryTuple<GKeys extends string> = [
  GKeys | [GKeys] | [GKeys, string] | [GKeys, string, string],
  FirebaseFirestore.WhereFilterOp,
  unknown
];
export type QueryTuples<GProps extends t.AnyProps> = Array<QueryTuple<StringKeys<GProps>>>;

export interface AsyncRunReturn<GModel extends AnyModel> {
  model: GModel;
  data: t.TypeOf<FieldsOf<GModel>>;
}

/* Static Methods */

export type StaticMethod<GSchema extends AnySchema> = (ctx: GSchema) => (...args: any[]) => any;

export interface StaticMethodConfig<GSchema extends AnySchema> {
  [method: string]: StaticMethod<GSchema>;
}

export type MappedStaticMethods<GSchema extends AnySchema, S extends StaticMethodConfig<GSchema> = any> = {
  [P in keyof S]: ReturnType<S[P]>
};

/* Instance Methods */

export type InstanceMethod<GModel extends AnyModel = any, D = any> = (
  model: GModel,
  deps: D,
) => (...args: any[]) => any;

export interface InstanceMethodConfig<GProps extends t.AnyProps, D extends BaseInjectedDeps> {
  [method: string]: InstanceMethod<IModel<GProps, any, D>, D>;
}

export type MappedInstanceMethods<
  GProps extends t.AnyProps,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> = { [P in keyof GInstanceMethods]: ReturnType<GInstanceMethods[P]> };

export interface ModelActions {
  forceCreate?: boolean;
  create?: boolean;
  get?: boolean;
  delete?: boolean;
  update?: boolean;
  query?: boolean;
}

/**
 * Holds the data of a firestore document.
 */
export interface FirestoreRecord<GData> {
  doc: FirebaseFirestore.DocumentReference;
  snap: FirebaseFirestore.DocumentSnapshot;
  data?: GData;
}

export type LastRunStatus = 'force-created' | 'created' | 'updated' | 'deleted';

export interface TransactionState<
  GProps extends t.AnyProps,
  GModel extends AnyModel,
  GActions = Array<ModelAction<TypeOfProps<GProps>, GModel>>,
  GRecord = FirestoreRecord<TypeOfProps<GProps>>
> {
  lastRunStatus?: LastRunStatus;
  actionsRun: ModelActions;
  syncData?: GRecord;
  errors: Error[];
  rawData: any;
  actions: GActions;
}
