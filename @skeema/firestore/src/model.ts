import {
  BaseDefinition,
  Cast,
  logError,
  removeUndefined,
  safeFirestoreCreateUpdate,
  safeFirestoreUpdate,
  serverUpdateTimestamp,
  simpleError,
} from '@skeema/core';
import admin from 'firebase-admin';
import * as t from 'io-ts';
import { get, isEmpty } from 'lodash/fp';
import {
  AnyModel,
  AnySchema,
  BaseInjectedDeps,
  CallbackModelAction,
  FirestoreRecord,
  IModel,
  InstanceMethodConfig,
  ISchema,
  MappedInstanceMethods,
  ModelAction,
  ModelActions,
  ModelActionType,
  ModelCallback,
  ModelParams,
  QueryTuples,
  RunConfig,
  SchemaCacheRules,
  SchemaConfig,
  TypeOfPropsWithBase,
} from './types';
import {
  actionsContainCallback,
  actionsContainCreate,
  actionsContainDelete,
  actionsContainFind,
  actionsContainFindOrCreate,
  buildQuery,
  findQueryAction,
  getRecord,
  isBaseProp,
  isCallbackAction,
  isDeleteFieldAction,
  isUpdateAction,
} from './utils';

const getIdField: (schema: AnySchema) => string = get(['mirror', 'idField']);

export class Model<
  GProps extends t.Props,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> implements IModel<GProps, GInstanceMethods, GDependencies> {
  private actions: Array<
    ModelAction<t.TypeOfProps<GProps>, IModel<GProps, GInstanceMethods, GDependencies>>
  > = [];
  private rawData: t.TypeOf<any>;
  private currentRunConfig: SchemaConfig;
  private errors: Error[] = [];
  private lastRunStatus?: 'force-created' | 'created' | 'updated' | 'deleted';
  private existsViaCreation: boolean = false;
  private actionsRun: ModelActions = {};
  private baseData: BaseDefinition;
  // After any successful run this is set to true. At this point we no longer provide mock values for any of the base data
  private hasRunSuccessfully = false;

  public get data(): TypeOfPropsWithBase<GProps> {
    return this.dataProxy;
  }
  public dataProxy: TypeOfPropsWithBase<GProps>;
  public doc: FirebaseFirestore.DocumentReference;
  public id: string;
  public snap?: FirebaseFirestore.DocumentSnapshot;
  public schema: ISchema<GProps, GInstanceMethods, GDependencies>;
  public methods: MappedInstanceMethods<GProps, GInstanceMethods, GDependencies>;

  public get exists(): boolean {
    return this.existsViaCreation || (this.snap ? this.snap.exists : false);
  }

  constructor({
    schema,
    data,
    doc,
    id,
    snap,
    type,
    callback,
    clauses,
    methods,
  }: ModelParams<GProps, GInstanceMethods, GDependencies>) {
    this.schema = schema;
    this.rawData = Object.assign({}, schema.defaultData, data);
    this.dataProxy = this.createProxy(this.rawData);
    this.snap = snap;
    this.doc = this.getDoc(doc, id);
    this.id = id || this.doc.id;

    this.methods = this.createMethods(methods);
    this.setupInitialActions(type, data, callback, clauses);
    this.currentRunConfig = this.schema.config;

    // Set up the base data so that we have a fallback while the data has not yet been created
    this.baseData = {
      updatedAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      schemaVersion: this.schema.version,
    };
  }

  private setupInitialActions(
    type?: ModelActionType,
    data?: any,
    callback?: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>,
    clauses?: QueryTuples<GProps>,
  ) {
    if (type && [ModelActionType.FindOrCreate, ModelActionType.Create].includes(type) && !data) {
      throw simpleError(`Type '${type}' can only be defined with data`);
    } else if (type === ModelActionType.Create) {
      this.create(data);
    }

    if (type === ModelActionType.Delete) {
      this.delete();
    }

    if (callback) {
      this.attach(callback);
    }

    if (type === ModelActionType.FindOrCreate) {
      this.create(data, false);
    }
    if (type === ModelActionType.Find) {
      this.actions.push({ type: ModelActionType.Find });
    }
    if (type === ModelActionType.Query) {
      if (!clauses) {
        throw simpleError(`Type '${type}' can only be defined with clauses`);
      }
      this.actions.push({ type: ModelActionType.Query, data: clauses });
    }
  }

  private createMethods(
    methods: GInstanceMethods,
  ): MappedInstanceMethods<GProps, GInstanceMethods, GDependencies> {
    const defaultMethods = Cast<MappedInstanceMethods<GProps, GInstanceMethods, GDependencies>>({});
    if (!methods) {
      return defaultMethods;
    }
    return Object.entries(methods).reduce((p, [key, method]) => {
      return Cast<MappedInstanceMethods<GProps, GInstanceMethods, GDependencies>>(
        Object.assign({}, p, {
          [key]: method(this, this.schema.dependencies),
        }),
      );
    }, defaultMethods);
  }

  private getDoc(doc?: FirebaseFirestore.DocumentReference, id?: string) {
    if (doc) {
      return doc;
    }
    if (this.snap) {
      return this.snap.ref;
    }
    if (id) {
      return this.schema.ref.doc(id);
    }
    return this.schema.ref.doc();
  }

  private createProxy(data: t.TypeOfProps<GProps>) {
    return new Proxy(data, {
      get: (_, prop: string) => {
        return this.rawData[prop] !== undefined
          ? this.rawData[prop]
          : isBaseProp(prop) && !this.hasRunSuccessfully
          ? this.baseData[prop]
          : undefined;
      },
      set: (_, prop: keyof GProps, value) => {
        if (isBaseProp(prop)) {
          throw new TypeError(`The property ${prop} is readonly and cannot be set`);
        }
        if (prop in this.rawData) {
          this.actions.push({
            data: Cast<Partial<t.TypeOfProps<GProps>>>({ [prop]: value }),
            type: ModelActionType.Update,
          });
          this.rawData[prop] = value;
          return true;
        }
        throw new TypeError(`The property ${prop} does not exist on ${this.rawData}`);
      },
      deleteProperty: (_, prop: keyof GProps) => {
        if (isBaseProp(prop)) {
          throw new TypeError(`The property ${prop} cannot be deleted`);
        }
        if (prop in this.rawData) {
          this.actions.push({
            data: Cast(prop),
            type: ModelActionType.DeleteField,
          });
          this.rawData[prop] = Cast(undefined); // Set to undefined rather than delete so that we still dot access it later without throwing an error
          return true;
        }
        throw new TypeError(`The property ${prop} does not exist on this model`);
      },
    });
  }

  private buildUpdatedData(withoutDeletes: boolean = false) {
    const initialValue =
      actionsContainCreate(this.actions) || actionsContainFindOrCreate(this.actions)
        ? this.rawData
        : {};

    return this.actions.reduce((accumulated, current) => {
      if (isUpdateAction(current)) {
        return { ...accumulated, ...current.data };
      }
      if (withoutDeletes) {
        return accumulated;
      }
      if (isDeleteFieldAction(current)) {
        const del = { ...accumulated, [current.data]: admin.firestore.FieldValue.delete() };
        return del;
      }
      return accumulated;
    }, initialValue);
  }

  private buildMirrorData(data: any, fields?: SchemaCacheRules<keyof GProps>['fields']) {
    if (!fields) {
      return data;
    }

    return fields.reduce((prev, curr) => {
      const updatedFieldData = data[curr];
      return updatedFieldData ? { ...prev, [curr]: updatedFieldData } : prev;
    }, {});
  }

  private mirrorTransaction(
    transaction: FirebaseFirestore.Transaction,
    allUpdates: t.TypeOfProps<GProps> | 'delete',
  ) {
    if (!this.schema.mirror || !this.id || this.currentRunConfig.mirror === false) {
      return;
    }

    const db = this.schema.db;

    const { name: key, idField } = this.schema.mirror;
    const mirrorId: string = idField ? this.rawData[idField] : this.id;

    if (!mirrorId) {
      logError(
        `Mirroring failed due to no provided id ${JSON.stringify({
          id: this.id,
          rawData: this.rawData,
        })}`,
      );
      return;
    }

    const doc = db.collection(this.schema.mirror.collection).doc(mirrorId);
    if (allUpdates === 'delete') {
      transaction.set(doc, serverUpdateTimestamp({ [key]: admin.firestore.FieldValue.delete() }), {
        merge: true,
      });
      return;
    }

    const data = this.buildMirrorData(allUpdates, this.schema.mirror.fields);

    /* Firebase overwrites the key if an empty object is set, so we want to guard against this. */
    if (isEmpty(data)) {
      logError('No data passed into the model');
      return;
    }

    if (key.includes('.')) {
      transaction.update(doc, serverUpdateTimestamp({ [key]: removeUndefined(data) }));
    }

    transaction.set(doc, serverUpdateTimestamp({ [key]: removeUndefined(data) }), {
      merge: true,
    });
  }

  private createTransaction(transaction: FirebaseFirestore.Transaction, data: any) {
    transaction.create(this.doc, safeFirestoreCreateUpdate(data));
    this.mirrorTransaction(transaction, data);
    this.lastRunStatus = 'created';
    this.actionsRun.create = true;
  }

  private forceCreateTransaction(transaction: FirebaseFirestore.Transaction, data: any) {
    transaction.set(this.doc, safeFirestoreCreateUpdate(data));
    this.mirrorTransaction(transaction, data);
    this.lastRunStatus = 'force-created';
    this.actionsRun.forceCreate = true;
  }

  private updateTransaction(transaction: FirebaseFirestore.Transaction, data: any) {
    transaction.set(this.doc, safeFirestoreUpdate(data), { merge: true });
    this.mirrorTransaction(transaction, data);
    this.lastRunStatus = 'updated';
    this.actionsRun.update = true;
  }

  private deleteTransaction(transaction: FirebaseFirestore.Transaction) {
    transaction.delete(this.doc);
    this.mirrorTransaction(transaction, 'delete');
    this.lastRunStatus = 'deleted';
    this.actionsRun.delete = true;
  }

  /**
   * Run a get within a transaction for the current model.
   */
  private async getTransaction(
    transaction: FirebaseFirestore.Transaction,
    noData: boolean = false,
  ) {
    if (this.actionsRun.get) {
      return;
    }
    try {
      const snap = await transaction.get(this.doc);
      this.syncData({
        data: noData ? undefined : Cast<t.TypeOfProps<GProps>>(snap.data()),
        snap,
        doc: this.doc,
      });
      return true;
    } catch (e) {
      this.errors.push(e);
      return false;
    } finally {
      this.actionsRun.get = true; // Prevents us running get twice in the same run loop;
    }
  }

  private async queryTransaction(
    transaction: FirebaseFirestore.Transaction,
    query: FirebaseFirestore.Query,
  ) {
    try {
      const snaps = await transaction.get(query.limit(1));
      if (snaps.size === 0) {
        return;
      }
      const snap = snaps.docs[0];
      this.syncData({ data: Cast<t.TypeOfProps<GProps>>(snap.data()), snap, doc: snap.ref });
      this.actionsRun.get = true; // only set to true if the query succeeds and hence the model is updated to matche the retrieved document
      this.actionsRun.query = true;
      return true;
    } catch (e) {
      this.errors.push(e);
      return false;
    }
  }

  /**
   * Runs a transaction that handles all use cases for the update state of a model.
   */
  private async buildTransaction(maxAttempts?: number, alwaysGet?: boolean) {
    if (isEmpty(this.actions) && !alwaysGet) {
      logError('No data to process for this model');
      return;
    }

    return this.schema.db.runTransaction(
      async transaction => {
        if (actionsContainDelete(this.actions)) {
          const idField: string | undefined = getIdField(this.schema);
          if (idField && !this.rawData[idField]) {
            await this.getTransaction(transaction);
            this.resetRawData(this.removeAllDataExceptMirrorIdField());
          }
          this.deleteTransaction(transaction);
          this.resetRawData({});
          return;
        }

        const queryModelAction = findQueryAction(this.actions);
        if (queryModelAction) {
          const query = buildQuery(this.schema.ref, queryModelAction.data);
          await this.queryTransaction(transaction, query);
        }

        if (actionsContainCallback(this.actions)) {
          await this.getTransaction(transaction);
          this.runCallbacks(transaction);
        }

        const data = this.buildUpdatedData(); // Callbacks can add create actions so we need to check again.
        const dataWithoutDeletes = this.buildUpdatedData(true);

        if (actionsContainFind(this.actions)) {
          await this.getTransaction(transaction);
        }

        if (actionsContainFindOrCreate(this.actions)) {
          await this.getTransaction(transaction);
          if (!this.exists) {
            this.createTransaction(transaction, dataWithoutDeletes);
            return;
          }
        }

        if (actionsContainCreate(this.actions)) {
          this.forceCreateTransaction(transaction, dataWithoutDeletes);
          return;
        }

        const emptyData = isEmpty(data);

        if (alwaysGet) {
          await this.getTransaction(transaction, !emptyData);
        }

        if (emptyData) {
          return;
        }

        this.updateTransaction(transaction, data);
        return;
      },
      { maxAttempts },
    );
  }

  /**
   * TODO test the possibility of adding the get method from a transaction here so that perhaps other data can be retrieved from other models.
   */
  private runCallbacks(transaction: FirebaseFirestore.Transaction) {
    this.actions.filter<CallbackModelAction<AnyModel>>(isCallbackAction).forEach(value => {
      const data = this.rawData;
      const exists = this.exists;
      try {
        value.callback({ model: Cast(this), exists, data, get: transaction.get });
      } catch (e) {
        this.errors.push(e);
      }
    });
  }

  private async getSnap() {
    const record = await getRecord<t.TypeOfProps<GProps>>(this.doc);
    this.syncData(record);
  }

  private async buildUpdater(): Promise<void> {
    throw simpleError('Not yet implemented');
  }

  /**
   * Synchronize data after pulling down from FireStore.
   */
  private syncData(record: FirestoreRecord<t.TypeOfProps<GProps>>) {
    this.resetRawData(record.data ? record.data : this.rawData);
    this.doc = record.doc;
    this.snap = record.snap;
    this.id = this.doc.id;
  }

  private setCurrentConfig(config: RunConfig = {}) {
    this.currentRunConfig = { ...this.schema.config, ...config };
  }

  /**
   * When a model is created there is no snapshot but we want the user to have a way of knowing whether the model exists or not.
   * We pass a flag during the run to tell whether the model has been created or updated, or deleted.
   */
  private manageLastRunStatus() {
    if (!this.lastRunStatus) {
      return;
    }
    this.existsViaCreation = ['updated', 'created', 'force-created'].includes(this.lastRunStatus);
  }

  private async forceGetIfNeeded(config: RunConfig) {
    if (config.forceGet && (this.actionsRun.create || this.actionsRun.forceCreate)) {
      await this.getSnap();
    }
  }

  public run = async (config: RunConfig = {}): Promise<this> => {
    this.setCurrentConfig(config);
    try {
      if (config.useTransactions === false) {
        // TODO implement this
        await this.buildUpdater();
        this.manageLastRunStatus();
      } else {
        await this.buildTransaction(config.maxAttempts, config.forceGet);
        this.manageLastRunStatus();
      }
      if (this.errors.length) {
        // Manage the harder to catch errors and rethrow
        throw this.errors[0];
      }

      await this.forceGetIfNeeded(config);
      // Only reset if successful
      this.hasRunSuccessfully = true;
      this.actions = [];
    } catch (e) {
      logError('Something went wrong with the latest push', e);
      // Rethrow the error
      throw e;
    } finally {
      // Reset the config for this run
      this.setCurrentConfig();
      this.errors = [];
      this.lastRunStatus = undefined;
      this.actionsRun = {};
    }

    return this;
  };

  private removeAllDataExceptMirrorIdField() {
    const idField: string | undefined = getIdField(this.schema);
    if (idField) {
      return { [idField]: this.rawData[idField] };
    }
    return {};
  }

  public delete = (keys?: Array<keyof GProps>) => {
    if (keys) {
      keys.forEach(key => {
        if (isBaseProp(key)) {
          throw new Error(
            `An error occurred deleting the field '${key}': This is a protected field and should not be deleted`,
          );
        }
        delete this.data[key];
      });
    } else {
      this.actions.push({
        type: ModelActionType.Delete,
      });
      this.resetRawData(this.rawData);
      // this.rawData = this.removeAllDataExceptMirrorIdField();
    }
    return this;
  };

  private resetRawData(newData: any) {
    this.rawData = newData;
    this.dataProxy = this.createProxy(this.rawData);
  }

  public update = (data: t.TypeOfProps<GProps>) => {
    type Data = Partial<t.TypeOfProps<GProps>>;
    if (isEmpty(data)) {
      return this;
    }

    Object.entries(data).forEach(([key, val]) => {
      this.actions.push({
        data: Cast<Data>({ [key]: val }),
        type: ModelActionType.Update,
      });
    });
    this.resetRawData(Object.assign({}, this.rawData, data));
    // this.rawData = Object.assign({}, this.rawData, data);
    return this;
  };

  public create = (data: t.TypeOfProps<GProps>, force: boolean = true) => {
    this.actions.push({
      data,
      type: Cast<ModelActionType.Create>(
        force ? ModelActionType.Create : ModelActionType.FindOrCreate,
      ),
    });
    this.resetRawData(Object.assign({}, this.rawData, data));
    return this;
  };

  public attach = (callback: ModelCallback<IModel<GProps, GInstanceMethods, GDependencies>>) => {
    this.actions.push({
      type: ModelActionType.Callback,
      callback,
    });
    return this;
  };
}
