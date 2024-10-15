import { SPIntlDateFormat } from "@smallpearl/ngx-helper/locale";
import { Observable } from "rxjs";

/**
 * Each column is represented by a column definition. An <ng-container matColumnDef=""></ng-container>
 * will be created for each column.
 */
export type SPMatEntityListColumn<TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'> = {
  // Column name. If valueFn is not specified, this will be used as the
  // key name to retrieve the value for the column from TEntity.
  name: string;
  // If omitted, 'name' will be used as column header.
  label?: string;
  // Column value specific formatting options. Currently, only used for
  // Date types.
  valueOptions?: {
    // Specify the same format string argument that is passed to DatePipe.
    dateTimeFormat?: SPIntlDateFormat;
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (t: TEntity) => string|number|Date|boolean;
}

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
  getEntityCount: () => number;
  getPageCount: () => number;
  getPageSize: () => number;
  getPageIndex: () => number;
  setPageIndex: (pageIndex: number) => void;
  getPageParams: () => SPPageParams;
  getEntitiesFromResponse: <TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'>(resp: any) => TEntity[];
}

/**
 * Global config for SPMatEntityList component.
 */
export interface SPMatEntityListConfig {
  urlResolver?: (endpoint: string) => string;
  paginator?: SPMatEntityListPaginator;
  i18nTranslate?: (label: string, context?: any) => string;
}

/**
 * Type for custom entities loader function, which if provided will be called
 * instead of HttpClient.get.
 */
export type SPMatEntityListEntityLoaderFn = (params: any) => Observable<any>;
