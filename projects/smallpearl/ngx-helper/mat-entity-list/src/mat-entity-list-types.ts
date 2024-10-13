import { IntlDateFormat } from "@smallpearl/ngx-helper/i18n";

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
    dateTimeFormat?: IntlDateFormat;
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (t: TEntity) => string|number|Date|boolean;
}

export interface SPMatEntityListPaginator {
  // Total count of entities
  total: number;
  currentPage: number;
  // Number of entities per page
  pageSize: number;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  nextPageEndpoint: (endpoint: string, currentPageNumber: number) => string;
  previousPageEndpoint: (endpoint: string, currentPageNumber: number) => string;
}
