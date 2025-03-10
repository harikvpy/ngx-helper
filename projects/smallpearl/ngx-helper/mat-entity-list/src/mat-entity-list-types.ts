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
   * Provide a method to return the labels for the columns. This is useful when
   * the columns are specified as the JSON object key names and the labels are
   * to be transformed into a uniform manner (uppercase) or when the labels
   * are to be dynamically localized. Note that the response can be an
   * Observable<string> if the label is to be fetched/changed asynchronously
   * (as that can happen in an app that supports dynamic changing of the UI
   * language).
   * @param entityName
   * @param columnName
   * @returns
   */
  columnLabelFn?: (entityName: string, columnName: string) => string | Observable<string>;
}

/**
 * Type for custom entities loader function, which if provided will be called
 * instead of HttpClient.get.
 */
export type SPMatEntityListEntityLoaderFn = (params: any) => Observable<any>;
