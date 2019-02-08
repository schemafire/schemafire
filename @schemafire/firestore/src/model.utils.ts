import { Cast } from '@schemafire/core';
import { AnyProps } from 'io-ts';
import { get, pick } from 'lodash/fp';
import {
  AnyModel,
  AnySchema,
  BaseInjectedDeps,
  IModel,
  InstanceMethodConfig,
  JSONRepresentation,
  JSONRepresentationType,
  MappedInstanceMethods,
  ModelActionType,
  SchemaCacheRules,
  TransactionState,
  TypeOfProps,
} from './types';
import { safeFirestoreCreateUpdate, safeFirestoreUpdate } from './utils';

export const getIdFieldFromSchema: (schema: AnySchema) => string = get(['mirror', 'idField']);

/**
 * Checks if this is a create action without data.
 *
 * @export
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
export const createTransactionState = <GProps extends AnyProps>(rawData: any): TransactionState<GProps> => {
  return { actionsRun: {}, errors: [], rawData };
};

/**
 * Updates a transaction to the new state
 */
export const updateTransactionState = <GProps extends AnyProps>(
  prevState: TransactionState<GProps>,
  newState: Partial<TransactionState<GProps>>,
): TransactionState<GProps> => {
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
interface TransactionParams<GProps extends AnyProps> {
  /**
   * The state object which although a regular object should **never** be mutated.
   * Used to manage passing data around within a transaction without affecting the model so that transactions don't affect anything unless the succeed.
   */
  state: TransactionState<GProps>;
  /**
   * A firestore transaction. Only available within the context of a transaction.
   */
  transaction: FirebaseFirestore.Transaction;
}

interface QueryTransactionParams<GProps extends AnyProps> extends TransactionParams<GProps> {
  /**
   * A firestore query.
   */
  query: FirebaseFirestore.Query;
}

/**
 * The parameters for a delete transaction operation
 */
interface DeleteTransactionParams<GProps extends AnyProps> extends TransactionParams<GProps> {
  /**
   * A firestore document reference used for updates / deletes / creates.
   */
  doc: FirebaseFirestore.DocumentReference;
}

/**
 * The parameters for a get transaction operation
 */
interface GetTransactionParams<GProps extends AnyProps> extends DeleteTransactionParams<GProps> {
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
interface UpdateTransactionParams<GProps extends AnyProps> extends DeleteTransactionParams<GProps> {
  /**
   * The data to be passed into the update / create transaction.
   */
  data: any;
}

/**
 * The parameters for a create transaction operation
 */
interface CreateTransactionParams<GProps extends AnyProps> extends UpdateTransactionParams<GProps> {
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
export const createTransaction = <GProps extends AnyProps>({
  transaction,
  data,
  force = false,
  state,
  doc,
}: CreateTransactionParams<GProps>): TransactionState<GProps> => {
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
export const updateTransaction = <GProps extends AnyProps>({
  transaction,
  data,
  state,
  doc,
}: UpdateTransactionParams<GProps>): TransactionState<GProps> => {
  transaction.set(doc, safeFirestoreUpdate(data), { merge: true });
  return updateTransactionState(state, { lastRunStatus: 'updated', actionsRun: { update: true } });
};

/**
 * Runs a delete transaction passing back the transformed state.
 * This can only be used within a transaction.
 */
export const deleteTransaction = <GProps extends AnyProps>({
  transaction,
  state,
  doc,
}: DeleteTransactionParams<GProps>): TransactionState<GProps> => {
  transaction.delete(doc);

  return updateTransactionState(state, { lastRunStatus: 'deleted', actionsRun: { delete: true } });
};

/**
 * Run a get within a transaction for the current model.
 */
export const getTransaction = async <GProps extends AnyProps>({
  transaction,
  noData = false,
  state,
  doc,
}: GetTransactionParams<GProps>): Promise<TransactionState<GProps>> => {
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
export const queryTransaction = async <GProps extends AnyProps>({
  transaction,
  query,
  state,
}: QueryTransactionParams<GProps>): Promise<TransactionState<GProps>> => {
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
 * Picks the properties from a model
 */
export const pickModelProperties = <GModel extends AnyModel>(model: GModel) => {
  return pick(['data', 'doc', 'id', 'snap', 'delete', 'update', 'create'], model);
};

/**
 * Checks whether a snapshot contains data. Can be overridden with the override parameter
 *
 * @param snap
 * @param override
 */
export const snapshotExists = (snap?: FirebaseFirestore.DocumentSnapshot, override = false) =>
  (snap && snap.exists) || override;
