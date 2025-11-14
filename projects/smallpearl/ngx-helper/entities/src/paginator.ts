/**
 * Pagination HTTP request params. Actually copied from Angular's HttpParams
 * declaration. The ReadonlyArray<string|number|boolean> is a bit of an
 * overkill for pagination params, but what the heck. When you copy-paste,
 * do it in full!
 */
export type SPPageParams = {
  [param: string]:
    | string
    | number
    | boolean
    | ReadonlyArray<string | number | boolean>;
};

/**
 * An interface that the clients should provide, either via a global config
 * (see above), that handles parsing the GET response and returns the entities
 * stored therein. This class will allow the entity-list component to be
 * used across different pagination response types as long as the appropriate
 * SPEntityListPaginator class is provided to the component.
 */
export interface SPEntityListPaginator {
  /**
   * Return the HTTP request params for the given page index and page size as
   * an object. For example, for a REST API that supports 'skip' and 'top' params,
   * the implementation would be:
   *
   * ```typescript
   * getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number): SPPageParams {
   *   return {
   *     skip: pageIndex * pageSize,
   *     top: pageSize
   *   };
   * }
   * ```
   * @param endpoint
   * @param pageIndex
   * @param pageSize
   * @returns
   */
  getRequestPageParams: (
    endpoint: string,
    pageIndex: number,
    pageSize: number
  ) => SPPageParams;

  /**
   * Parse the HTTP response received from the GET request and return an object
   * containing the total number of entities available and the array of entities
   * for the current page. For example, for the pure DRF paginated response
   * like below:
   * ```json
   * {
   *  "count": 102,
   *  "next": "http://api.example.org/entities/?page=3",
   *  "previous": "http://api.example.org/entities/?page=1",
   *  "results": [
   *    {
   *      "id": 1,
   *      "name": "Entity 1"
   *    },
   *    {
   *      "id": 2,
   *      "name": "Entity 2"
   *    }
   *  ]
   * }
   * ```
   * The implementation would be:
   * ```typescript
   * parseRequestResponse<TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'>(
   *   entityName: string,
   *   entityNamePlural: string,
   *   endpoint: string,
   *   params: SPPageParams,
   *   resp: any
   * ): { total: number; entities: TEntity[] } {
   *   return {
   *     total: resp.count,
   *     entities: resp.results
   *   };
   * }
   * ```
   * @param entityName
   * @param entityNamePlural
   * @param endpoint
   * @param params
   * @param resp
   * @returns
   */
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
