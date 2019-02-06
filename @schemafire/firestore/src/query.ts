import * as t from 'io-ts';
import { BaseInjectedDeps, IModel, InstanceMethodConfig, IQuery, ISchema, QueryParams } from './types';
import { buildQuery } from './utils';

export class Query<
  GProps extends t.Props,
  GInstanceMethods extends InstanceMethodConfig<GProps, GDependencies>,
  GDependencies extends BaseInjectedDeps
> implements IQuery<GProps, GInstanceMethods, GDependencies> {
  public query: FirebaseFirestore.Query;
  public snap?: FirebaseFirestore.QuerySnapshot | undefined;
  public schema: ISchema<GProps, GInstanceMethods, GDependencies>;
  public models: Array<IModel<GProps, GInstanceMethods, GDependencies>> = [];

  constructor({ schema, snap, clauses }: QueryParams<GProps, GInstanceMethods, GDependencies>) {
    this.schema = schema;
    this.query = buildQuery(this.schema.ref, clauses);
    this.snap = snap;
  }

  public async run(): Promise<this> {
    const snaps = await this.query.get();
    this.models = snaps.docs.map(this.schema.fromSnap.bind(this));
    return this;
  }

  public deleteAll(): this {}

  public updateAll(): this {}
  public attachAll(): this {}
  public overwriteAll(): this {}
}
