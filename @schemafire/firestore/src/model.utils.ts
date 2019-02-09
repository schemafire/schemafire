import { Cast } from '@schemafire/core';
import admin from 'firebase-admin';
import { AnyProps } from 'io-ts';
import { get, pick } from 'lodash/fp';
import { createDataProxy } from './proxy';
import {
  AnyModel,
  AnyModelAction,
  AnySchema,
  BaseInjectedDeps,
  CallbackModelAction,
  IModel,
  InstanceMethodConfig,
  JSONRepresentation,
  JSONRepresentationType,
  MappedInstanceMethods,
  ModelActionType,
  ModelCallbackParams,
  SchemaCacheRules,
  StringKeys,
  TransactionState,
  TypeOfProps,
  TypeOfPropsWithBase,
} from './types';
import {
  actionsContainCreate,
  actionsContainFindOrCreate,
  isBaseProp,
  isCallbackAction,
  isDeleteFieldAction,
  isUpdateAction,
  safeFirestoreCreateUpdate,
  safeFirestoreUpdate,
} from './utils';

export const getIdFieldFromSchema: (schema: AnySchema) => string = get(['mirror', 'idField']);

/**
 * Checks if this is a create action without data.
 *
 * @param type
 * @param data
 */

export function createTypeHasData(type: ModelActionType, data: any): boolean {
  return [ModelActionType.FindOrCreate, ModelActionType.Create].includes(type) ? Boolean(data) : true;
}

/**
 * Creates a JSON Representation of a complex type
 *
 * @param type
 * @param data
 */

export const createJSONRepresentation = <GData>(
  type: JSONRepresentationType,
  data: GData,
): JSONRepresentation<GData> => {
  return {
    type,
    data,
  };
};

/**
 * Calls the instance methods defined on the provided context constructor and prepares
 * them to be used on the instance.
 *
 * @param methods
 */

export const createMethods = <
  GProps extends AnyProps,
  GMethods extends InstanceMethodConfig<GProps, GDeps>,
  GDeps extends BaseInjectedDeps
>(
  methods: GMethods,
  context: IModel<GProps, GMethods, GDeps>,
): MappedInstanceMethods<GProps, GMethods, GDeps> => {
  const defaultMethods = Cast<MappedInstanceMethods<GProps, GMethods, GDeps>>({});
  if (!methods) {
    return defaultMethods;
  }
  return Object.entries(methods).reduce((p, [key, method]) => {
    return Cast<MappedInstanceMethods<GProps, GMethods, GDeps>>({
      ...p,
      [key]: method(context, context.schema.dependencies),
    });
  }, defaultMethods);
};

/**
 * Determine which data is copied over to the document that is being mirrored to.
 *
 * @param data The data on the current model
 * @param fields The fields to copy over when mirroring
 */

export const buildMirrorData = <GProps>(data: any, fields?: SchemaCacheRules<keyof GProps>['fields']) => {
  if (!fields) {
    return data;
  }

  return fields.reduce((prev, curr) => {
    const updatedFieldData = data[curr];
    return updatedFieldData ? { ...prev, [curr]: updatedFieldData } : prev;
  }, {});
};

/**
 * A utility for creating the default transaction parameters.
 */
export const createTransactionState = <GProps extends AnyProps, GModel extends AnyModel>(
  state: Partial<TransactionState<GProps, GModel>> & { rawData: any },
): TransactionState<GProps, GModel> => {
  return updateTransactionState({ actionsRun: {}, errors: [], rawData: {}, actions: [] }, state);
};

/**
 * Updates a transaction to the new state
 */
export const updateTransactionState = <GProps extends AnyProps, GModel extends AnyModel>(
  prevState: TransactionState<GProps, GModel>,
  newState: Partial<TransactionState<GProps, GModel>>,
): TransactionState<GProps, GModel> => {
  return {
    ...prevState,
    ...newState,
    actionsRun: { ...prevState.actionsRun, ...(newState.actionsRun || {}) },
    errors: [...prevState.errors, ...(newState.errors || [])],
  };
};

/**
 * The base transaction parameter shape.
 */
interface TransactionParams<GProps extends AnyProps, GModel extends AnyModel> {
  /**
   * The state object which although a regular object should **never** be mutated.
   * Used to manage passing data around within a transaction without affecting the model so that transactions don't affect anything unless the succeed.
   */
  state: TransactionState<GProps, GModel>;

  /**
   * A firestore transaction. Only available within the context of a transaction.
   */
  transaction: FirebaseFirestore.Transaction;
}

interface QueryTransactionParams<GProps extends AnyProps, GModel extends AnyModel>
  extends TransactionParams<GProps, GModel> {
  /**
   * A firestore query.
   */
  query: FirebaseFirestore.Query;
}

/**
 * The parameters for a delete transaction operation
 */
interface DeleteTransactionParams<GProps extends AnyProps, GModel extends AnyModel>
  extends TransactionParams<GProps, GModel> {
  /**
   * A firestore document reference used for updates / deletes / creates.
   */
  doc: FirebaseFirestore.DocumentReference;
}

/**
 * The parameters for a get transaction operation
 */
interface GetTransactionParams<GProps extends AnyProps, GModel extends AnyModel>
  extends DeleteTransactionParams<GProps, GModel> {
  /**
   * Determines whether to capture the snapshot data. This is used when a forceGet is passed without this the data
   * would always be overwritten by what's received from the server. This way, if data is empty then we don't mind using the server data
   * but when data has been added already we'd prefer not to overwrite it.
   * ? Why did I add this parameter? Test what happens when removed.
   * @default false
   */
  noData?: boolean;
}

/**
 * The parameters for an update transaction operation
 */
interface UpdateTransactionParams<GProps extends AnyProps, GModel extends AnyModel>
  extends DeleteTransactionParams<GProps, GModel> {
  /**
   * The data to be passed into the update / create transaction.
   */
  data: any;
}

/**
 * The parameters for a create transaction operation
 */
interface CreateTransactionParams<GProps extends AnyProps, GModel extends AnyModel>
  extends UpdateTransactionParams<GProps, GModel> {
  /**
   * Determines whether or not to force an overwrite if a document with the same ID already exists.
   * True means it will be overwritten whilst false means no.
   * @default false
   */
  force?: boolean;
}

/**
 * Runs the create transaction and passes a new state.
 */
export const createTransaction = <GProps extends AnyProps, GModel extends AnyModel>({
  transaction,
  data,
  force = false,
  state,
  doc,
}: CreateTransactionParams<GProps, GModel>): TransactionState<GProps, GModel> => {
  if (force) {
    transaction.set(doc, safeFirestoreCreateUpdate(data));
  } else {
    transaction.create(doc, safeFirestoreCreateUpdate(data));
  }
  // ! Add mirroring manually after this function call
  //
  return updateTransactionState(state, { lastRunStatus: 'created', actionsRun: { create: true } });
};

/**
 * Runs the updated transaction and passes back the non-mutated and transformed state
 */
export const updateTransaction = <GProps extends AnyProps, GModel extends AnyModel>({
  transaction,
  data,
  state,
  doc,
}: UpdateTransactionParams<GProps, GModel>): TransactionState<GProps, GModel> => {
  transaction.set(doc, safeFirestoreUpdate(data), { merge: true });
  return updateTransactionState(state, { lastRunStatus: 'updated', actionsRun: { update: true } });
};

/**
 * Runs a delete transaction passing back the transformed state.
 * This can only be used within a transaction.
 */
export const deleteTransaction = <GProps extends AnyProps, GModel extends AnyModel>({
  transaction,
  state,
  doc,
}: DeleteTransactionParams<GProps, GModel>): TransactionState<GProps, GModel> => {
  transaction.delete(doc);

  return updateTransactionState(state, { lastRunStatus: 'deleted', actionsRun: { delete: true } });
};

/**
 * Run a get within a transaction for the current model.
 */
export const getTransaction = async <GProps extends AnyProps, GModel extends AnyModel>({
  transaction,
  noData = false,
  state,
  doc,
}: GetTransactionParams<GProps, GModel>): Promise<TransactionState<GProps, GModel>> => {
  if (state.actionsRun.get) {
    return state;
  }
  const actionsRun = { get: true };
  try {
    const snap = await transaction.get(doc);
    return updateTransactionState(state, {
      syncData: {
        data: noData ? undefined : Cast<TypeOfProps<GProps>>(snap.data()),
        snap,
        doc,
      },
      actionsRun,
    });
  } catch (error) {
    return updateTransactionState(state, { actionsRun, errors: [error] });
  }
};

/**
 * Run the selected query within a transaction to find data
 */
export const queryTransaction = async <GProps extends AnyProps, GModel extends AnyModel>({
  transaction,
  query,
  state,
}: QueryTransactionParams<GProps, GModel>): Promise<TransactionState<GProps, GModel>> => {
  const actionsRun = { query: true, get: true };
  try {
    const snaps = await transaction.get(query.limit(1));
    if (snaps.size === 0) {
      return state;
    }

    const snap = snaps.docs[0];
    return updateTransactionState(state, {
      actionsRun,
      syncData: { data: Cast<TypeOfProps<GProps>>(snap.data()), snap, doc: snap.ref },
    });
  } catch (error) {
    return updateTransactionState(state, { actionsRun, errors: [error] });
  }
};

/**
 * Checks whether a snapshot contains data. Can be overridden with the override parameter
 *
 * @param snap the firebase snapshot
 * @param override any truthy value
 */
export const snapshotExists = (snap?: FirebaseFirestore.DocumentSnapshot, override: unknown = false) =>
  (snap && snap.exists) || Boolean(override);

interface BuildUpdatedDataParams<GAction extends AnyModelAction> {
  /**
   * Whether or not to include deletions in the updates. This is useful when data has also been created and field deletions
   * need to be discarded
   */
  withoutDeletes?: boolean;

  /**
   * A list of unresolved actions.
   * This is usually a combination of the actions added to the model before the transaction started
   * concatenated with any actions added to the transaction state.
   */
  actions: GAction[];

  /**
   * The data to be passed in.
   */
  rawData: any;
}

/**
 * Builds the updated data object so that updates only include data that was touched.
 *
 * This is needed because all models are created with default data and we don't want default data
 * overwriting any actual data. This checks for the intended updates and returns a data object composed
 * entirely of these.
 */
export const buildUpdatedData = <GAction extends AnyModelAction>({
  withoutDeletes = false,
  actions,
  rawData,
}: BuildUpdatedDataParams<GAction>) => {
  const initialValue = actionsContainCreate(actions) || actionsContainFindOrCreate(actions) ? rawData : {};

  return actions.reduce((accumulated, current) => {
    if (isUpdateAction(current)) {
      return { ...accumulated, ...current.data };
    }
    if (!withoutDeletes && isDeleteFieldAction(current)) {
      const del = { ...accumulated, [current.data]: admin.firestore.FieldValue.delete() };
      return del;
    }
    return accumulated;
  }, initialValue);
};

/**
 * The parameter for running callback parameters
 */
interface RunCallbacksParams<GProps extends AnyProps, GModel extends AnyModel> {
  /**
   * A Firestore transaction object
   */
  // transaction: FirebaseFirestore.Transaction;
  state: TransactionState<GProps, GModel>;
  ctx: GModel;
}

/**
 * Runs all the queued callbacks
 * ! This is incredibly dangerous and needs to be refactored. Any update or create called in the callback ... will lead to side effects
 * ! If runTransaction ran multiple times there would be no way of knowing what happens
 */
export const runCallbacks = <GProps extends AnyProps, GModel extends AnyModel>({
  state,
  ctx,
}: RunCallbacksParams<GProps, GModel>) => {
  state.actions.filter<CallbackModelAction<GModel>>(isCallbackAction).forEach(value => {
    const data = createDataProxy<GProps, GModel>(state.rawData);
    const exists = ctx.exists;
    const update = updateMethodFactory<GProps, GModel>({ proxy: data, state });
    const create = createMethodFactory<GProps, GModel>({ proxy: data, state });
    const del = deleteMethodFactory<GProps, GModel>({ proxy: data, state });
    const params: ModelCallbackParams<GModel> = {
      data,
      doc: ctx.doc,
      id: ctx.id,
      snap: ctx.snap,
      exists,
      update,
      delete: del,
      create,
    };
    try {
      return value.callback(params);
    } catch (e) {
      state.errors.push(e);
    }
  });
};

interface MethodFactoryParams<GProps extends AnyProps, GModel extends AnyModel> {
  proxy: TypeOfPropsWithBase<GProps>;
  state: TransactionState<GProps, GModel>;
}

const updateMethodFactory = <GProps extends AnyProps, GModel extends AnyModel>({
  proxy,
}: MethodFactoryParams<GProps, GModel>) => (data: TypeOfProps<GProps>) => {
  Object.entries(data).forEach(([key, val]) => {
    proxy[key] = val;
  });
};

const deleteMethodFactory = <GProps extends AnyProps, GModel extends AnyModel>({
  proxy,
}: MethodFactoryParams<GProps, GModel>) => (keys: Array<keyof GProps>) => {
  keys.forEach(key => {
    if (isBaseProp(key)) {
      throw new Error(
        `An error occurred deleting the field '${key}': This is a protected field and should not be deleted`,
      );
    }
    delete proxy[key];
  });
};

const createMethodFactory = <GProps extends AnyProps, GModel extends AnyModel>({
  proxy,
  state,
}: MethodFactoryParams<GProps, GModel>) => (data: TypeOfProps<GProps>) => {
  Object.entries(data).forEach((key: unknown, val) => {
    proxy[Cast(key)] = val;
    state.actions.push({
      data,
      type: ModelActionType.Create,
    });
  });
};
