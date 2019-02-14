import { Cast, removeUndefined } from '@schemafire/core';
import admin from 'firebase-admin';
import { AnyProps } from 'io-ts';
import { pipe } from 'lodash/fp';
import { baseProps } from './base';
import {
  AnyModel,
  BaseDefinitionKeys,
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

/**
 * Checks the action type and returns the corresponding ModelAction interface.
 */
type FindActionType<
  GData,
  GModel extends AnyModel,
  GAction extends ModelActionType
> = GAction extends ModelActionType.Callback
  ? CallbackModelAction<GModel>
  : GAction extends ModelActionType.Create
  ? CreateModelAction<GData>
  : GAction extends ModelActionType.FindOrCreate
  ? FindOrCreateModelAction<GData>
  : GAction extends ModelActionType.Update
  ? UpdateModelAction<GData>
  : GAction extends ModelActionType.DeleteField
  ? DeleteFieldModelAction<GData>
  : GAction extends ModelActionType.Delete
  ? DeleteModelAction
  : GAction extends ModelActionType.Find
  ? FindModelAction
  : GAction extends ModelActionType.Query
  ? QueryModelAction
  : never;

/**
 * A curried function for obtaining the action type of a model action
 * @param type
 */
export const isActionOfType = <GAction extends ModelActionType>(type: GAction) => <
  GModel extends AnyModel,
  GData = any
>(
  action: ModelAction<GData, GModel>,
): action is FindActionType<GData, GModel, GAction> => {
  return action.type === type;
};

export const isUpdateAction = isActionOfType(ModelActionType.Update);
export const isFindAction = isActionOfType(ModelActionType.Find);
export const isQueryAction = isActionOfType(ModelActionType.Query);
export const isCallbackAction = isActionOfType(ModelActionType.Callback);
export const isCreateAction = isActionOfType(ModelActionType.Create);
export const isDeleteFieldAction = isActionOfType(ModelActionType.DeleteField);
export const isFindOrCreateAction = isActionOfType(ModelActionType.FindOrCreate);
export const isDeleteAction = isActionOfType(ModelActionType.Delete);

/**
 * Checks if a key (string) is a base property
 *
 * @param prop
 */
export const isBaseProp = (prop: any): prop is BaseDefinitionKeys => {
  return baseProps.includes(Cast<BaseDefinitionKeys>(prop));
};

type IsActionPredicate<GAction extends ModelActionType> = <GModel extends AnyModel, GData = any>(
  action: ModelAction<GData, GModel>,
) => action is FindActionType<GData, GModel, GAction>;

/**
 * Provide a predicate to determine the actions to check for in the array of actions.
 * @param predicate
 */
const actionsContain = <GAction extends ModelActionType>(predicate: IsActionPredicate<GAction>) => <
  GModel extends AnyModel,
  GData = any
>(
  actions: Array<ModelAction<GData, GModel>>,
) => actions.some(predicate);

export const actionsContainDelete = actionsContain(isDeleteAction);
export const actionsContainFindOrCreate = actionsContain(isFindOrCreateAction);
export const actionsContainCreate = actionsContain(isCreateAction);
export const actionsContainFind = actionsContain(isFindAction);
export const actionsContainCallback = actionsContain(isCallbackAction);
export const actionsContainUpdate = actionsContain(isUpdateAction);
export const actionsContainDeleteField = actionsContain(isDeleteFieldAction);

/**
 * Finds the query action within the actions array
 *
 * @param actions
 */
export const findQueryAction = <T, M extends AnyModel>(actions: Array<ModelAction<T, M>>) => {
  return actions.find(isQueryAction);
};

/**
 * Builds a query which can be used to obtain data
 */
export const buildQuery = <GProps extends AnyProps>(
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

/**
 * A method for creating a Firestore Record
 *
 * @param doc
 */
export const getRecord = async <T extends {}>(
  doc: FirebaseFirestore.DocumentReference,
): Promise<FirestoreRecord<T>> => {
  const snap = await doc.get();
  const data = snap.exists ? (snap.data() as T) : undefined;

  return { doc, snap, data };
};

/**
 * Adds a `createdAt` timestamp to the passed in object.
 * It's currently not used directly except in combination for newly created data.
 *
 * @param data The object to extend
 */
export const serverCreateTimestamp = <T extends object>(data: T) => ({
  ...data,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

/**
 * Adds an `updatedAt` at timestamp to the passed in object.
 *
 * @param data The object to extend
 */
export const serverUpdateTimestamp = <T extends object>(data: T) => ({
  ...data,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

/**
 * Adds both `createdAt` and `updatedAt` timestamps to the passed in object.
 * Useful when creating data for the first time.
 *
 * @param data The object to extend
 */
export const serverCreateUpdateTimestamp: (
  data: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  serverUpdateTimestamp,
  serverCreateTimestamp,
);

/**
 * Removes undefined and adds both `createdAt` and `updatedAt` timestamps to the passed in object.
 *
 * @param data The object to extend
 */
export const safeFirestoreCreateUpdate: (
  data: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverCreateUpdateTimestamp,
);

/**
 * Removes undefined and adds both `createdAt` timestamp to the passed in object.
 *
 * @param data The object to extend
 */
export const safeFirestoreCreate: (
  data: object,
) => object & {
  createdAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverCreateTimestamp,
);

/**
 * Removes undefined and adds `updatedAt` timestamp to the passed in object.
 *
 * @param data The object to extend
 */
export const safeFirestoreUpdate: (
  data: object,
) => object & {
  updatedAt: FirebaseFirestore.FieldValue;
} = pipe(
  removeUndefined,
  serverUpdateTimestamp,
);

export const hasData = <GType extends {}>(params: GType): params is GType & { data: any } => {
  return Boolean(params && Cast(params).data);
};
