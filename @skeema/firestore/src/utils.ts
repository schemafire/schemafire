import admin from 'firebase-admin';
import * as t from 'io-ts';
import { overSome } from 'lodash/fp';
import {
  AnyModel,
  CallbackModelAction,
  CreateModelAction,
  DeleteFieldModelAction,
  DeleteModelAction,
  FindModelAction,
  FindOrCreateModelAction,
  FirestoreRecord,
  ModelAction,
  ModelActionType,
  QueryModelAction,
  QueryTuples,
  UpdateModelAction,
} from './types';

export const isUpdateAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is UpdateModelAction<T> => {
  return action.type === ModelActionType.Update;
};
export const isFindAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is FindModelAction => {
  return action.type === ModelActionType.Find;
};
export const isQueryAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is QueryModelAction => {
  return action.type === ModelActionType.Query;
};
export const isCallbackAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is CallbackModelAction<M> => {
  return action.type === ModelActionType.Callback;
};
export const isCreateAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is CreateModelAction<T> => {
  return action.type === ModelActionType.Create;
};
export const isDeleteFieldAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is DeleteFieldModelAction<T> => {
  return action.type === ModelActionType.DeleteField;
};
export const isFindOrCreateAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is FindOrCreateModelAction<T> => {
  return action.type === ModelActionType.FindOrCreate;
};

export const isDeleteAction = <T, M extends AnyModel>(
  action: ModelAction<T, M>,
): action is DeleteModelAction => {
  return action.type === ModelActionType.Delete;
};

export const isBaseProp = <T>(prop: keyof T) => {
  return ['createdAt', 'updatedAt', 'schemaVersion', 'testData'].includes(prop as string);
};

export const actionsContainDelete = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.some(isDeleteAction);
};

export const actionsContainFindOrCreate = <T, M extends AnyModel>(
  actions: Array<ModelAction<T, M>>,
) => {
  return actions.some(isFindOrCreateAction);
};

export const actionsContainCreate = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.some(isCreateAction);
};

export const actionsContainFind = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.some(isFindAction);
};

export const findQueryAction = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.find(isQueryAction);
};

export const actionsContainCallback = <T, M extends AnyModel>(
  actions: Array<ModelAction<T, M>>,
) => {
  return actions.some(isCallbackAction);
};

export const actionsContainUpdate = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.some(isUpdateAction);
};

export const actionsContainDeleteField = <T, M extends AnyModel>(
  actions: Array<ModelAction<T, M>>,
) => {
  return actions.some(isDeleteFieldAction);
};

export const hasUpdateActions = overSome<any>([
  actionsContainCreate,
  actionsContainDeleteField,
  actionsContainUpdate,
]);

export const buildQuery = <GProps extends t.Props>(
  ref: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query,
  clauses: QueryTuples<GProps>,
) => {
  const query: FirebaseFirestore.Query = ref;

  clauses.forEach(clause => {
    const [f, where, value] = clause;
    const field: string = Array.isArray(f) ? f.join('.') : f;
    query.where(field, where, value);
  });

  return query;
};

export const getRecord = async <T extends {}>(
  doc: FirebaseFirestore.DocumentReference,
): Promise<FirestoreRecord<T>> => {
  const snap = await doc.get();
  const data = snap.exists ? (snap.data() as T) : undefined;

  return { doc, snap, data };
};

/**
 * Retrieve any document from any firestore collection.
 *
 * @param documentId
 * @param coll
 */
export const getDocument = async <T extends {}>(
  documentId: string,
  coll: string,
): Promise<FirestoreRecord<T>> => {
  const doc = admin
    .firestore()
    .collection(coll)
    .doc(documentId);
  const snap = await doc.get();
  const data = snap.exists ? (snap.data() as T) : undefined;
  return { doc, snap, data };
};
