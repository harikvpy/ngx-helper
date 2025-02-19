import { HttpContextToken } from "@angular/common/http";
import { Observable } from "rxjs";

export interface SPMatEntityListHttpContext {
  entityName: string;
  entityNamePlural: string;
  endpoint: string;
}

export const SP_MAT_ENTITY_LIST_HTTP_CONTEXT =
  new HttpContextToken<SPMatEntityListHttpContext>(() => ({
    entityName: '',
    entityNamePlural: '',
    endpoint: '',
  }));

/**
 * Pagination HTTP request params. Actually copied from Angular's HttpParams
 * declaration. The ReadonlyArray<string|number|boolean> is a bit of an
 * overkill for pagination params, but what the heck. When you copy-paste,
 * do it in full!
 */
export type SPPageParams = { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>; }

/**
 * An interface that the clients should provide, either via a global config
 * (see above), that handles parsing the GET response and returns the entities
 * stored therein. This class will allow the entity-list component to be
 * used across different pagination response types as long as the appropriate
 * SPMatEntityListPaginator class is provided to the component.
 */
export interface SPMatEntityListPaginator {
  getRequestPageParams: (endpoint: string, pageIndex: number, pageSize: number) => SPPageParams;
  parseRequestResponse: <
    TEntity extends { [P in IdKey]: PropertyKey },
    IdKey extends string = 'id'
  >(
    entityName: string,
    entityNamePlural: string,
    endpoint: string,
    params: SPPageParams,
    resp: any
  ) => { total: number; entities: TEntity[] };
}

/**
 * 'entity' is really TEntity arg of SPMatEntityListComponent<TEntity>.
 * 'column' is the column name. This allows the same value function to support
 * multiple columns further enabing DRY.
 */
export type COLUMN_VALUE_FN = (entity: any, column: string) => string|number|Date|boolean;

/**
 * Global config for SPMatEntityList component.
 */
export interface SPMatEntityListConfig {
  urlResolver?: (endpoint: string) => string;
  paginator?: SPMatEntityListPaginator;
  defaultPageSize?: number;
  pageSizes?: Array<number>;
  /**
   * These are global column value functions.
   *
   * If a value function for a column is not explicitly specified, this map is
   * looked up with the column name. If an entry exists in this table, it will
   * be used to render the column's value.
   *
   * This is useful for formatting certain column types which tends to have the
   * same name across the app. For instance columns such as 'amount', 'total'
   * or 'balance'. Or 'date', 'timestamp', etc. The return value from the
   * column value functions are deemed safe and therefore
   */
  // columnValueFns?: Map<string, COLUMN_VALUE_FN>;
}

/**
 * Type for custom entities loader function, which if provided will be called
 * instead of HttpClient.get.
 */
export type SPMatEntityListEntityLoaderFn = (params: any) => Observable<any>;
