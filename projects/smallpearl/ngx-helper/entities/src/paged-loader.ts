import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpParams,
} from '@angular/common/http';
import { computed, Directive, inject, input } from '@angular/core';
import { createStore, setProps, withProps } from '@ngneat/elf';
import { getAllEntities, getEntitiesCount, getEntity, upsertEntities, withEntities } from '@ngneat/elf-entities';
import { getPaginationData, setPage, skipWhilePageExists, updatePaginationData, withPagination } from '@ngneat/elf-pagination';
import { SPMatEntityListPaginator, SPPageParams } from '@smallpearl/ngx-helper/mat-entity-list';
import { getEntityListConfig } from '@smallpearl/ngx-helper/mat-entity-list/src/config';
import { capitalize } from 'lodash';
import { plural } from 'pluralize';
import {
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  tap
} from 'rxjs';

/**
 * A type representing an entity loader function that takes page number,
 * page size, and an optional search value and returns an Observable of
 * the response. This is similar the http.get() method of HttpClient but
 * with pagination parameters. The return value is deliberately kept generic
 * (Observable<any>) to allow flexibility in the response type. This reponse
 * will be parsed by the provided paginator's parseRequestResponse() method.
 * So as long as the function return type and paginator are compatible,
 * any response type can be handled.
 *
 * Ideally the response should contain the total number of entities available
 * at the remote and the array of entities for the requested page.
 */
export type SPEntityLoaderFn = (
  page: number,
  pageSize: number,
  searchValue: string | undefined
) => Observable<any>;

/**
 * Represents a request to load entities from the remote. This is used to
 * compare two requests to determine if they are equal. This is useful to
 * prevent duplicate requests being sent to the remote.
 */
class LoadRequest {
  constructor(
    public endpoint: string | SPEntityLoaderFn,
    public pageNumber: number,
    public searchStr: string | undefined,
    public force = false
  ) {}

  // Returns true if two LoadRequest objects are equal and this object's
  // 'force' is not set to true.
  isEqualToAndNotForced(prev: LoadRequest): boolean {
    // console.log(
    //   `isEqualToAndNotForced - ${this.endpoint}, ${this.params.toString()} ${
    //     this.force
    //   }, other: ${prev.endpoint}, ${prev.params.toString()}, ${prev.force}`
    // );
    return this.force
      ? false
      : (typeof this.endpoint === 'function' ||
          this.endpoint.localeCompare(prev.endpoint as string) === 0) &&
          this.pageNumber === prev.pageNumber &&
          this.searchStr === prev.searchStr;
  }
}

type StateProps = {
  allEntitiesLoaded: boolean;
  loading: boolean;
};

const DEFAULT_STATE_PROPS: StateProps = {
  allEntitiesLoaded: false,
  loading: false,
}

// Default paginator implementation. This can handle dynamic-rest and DRF
// native pagination schemes. It also has a fallback to handle response conists
// of an array of entities.
class DefaultPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(
    endpoint: string,
    page: number,
    pageSize: number
  ): SPPageParams {
    return {
      page: page + 1,
      pageSize,
    };
  }

  parseRequestResponse<
    TEntity extends { [P in IdKey]: PropertyKey },
    IdKey extends string = 'id'
  >(
    entityName: string,
    entityNamePlural: string,
    endpoint: string,
    params: SPPageParams,
    resp: any
  ) {
    if (Array.isArray(resp)) {
      return {
        total: resp.length,
        entities: resp,
      };
    }

    if (typeof resp === 'object') {
      const keys = Object.keys(resp);
      // Handle dynamic-rest sideloaded response
      // Rudimentary sideloaded response support. This should work for most
      // of the sideloaded responses where the main entities are stored
      // under the plural entity name key and resp['meta'] object contains
      // the total count.
      if (
        keys.includes(entityNamePlural) &&
        Array.isArray(resp[entityNamePlural])
      ) {
        let total = resp[entityNamePlural].length;
        if (
          keys.includes('meta') &&
          typeof resp['meta'] === 'object' &&
          typeof resp['meta']['total'] === 'number'
        ) {
          total = resp['meta']['total'];
        }
        return {
          total,
          entities: resp[entityNamePlural],
        };
      }

      // Handle django-rest-framework style response
      if (keys.includes('results') && Array.isArray(resp['results'])) {
        let total = resp['results'].length;
        if (keys.includes('count') && typeof resp['count'] === 'number') {
          total = resp['count'];
        }
        return {
          total,
          entities: resp['results'],
        };
      }

      // Finally, look for "items" key
      if (keys.includes('items') && Array.isArray(resp['items'])) {
        return {
          total: resp['items'].length,
          entities: resp['items'],
        };
      }
    }

    return {
      total: 0,
      entities: [],
    };
  }
}

/**
 * An abstract class that you can use wherever you would like to load entities
 * from a remote endpoint in a paged manner. Entities can be loaded in one of
 * two ways:
 *
 * 1. By providing an entityLoaderFn that takes an endpoint and HttpParams
 *    and returns a Observable of entities.
 * 2. Or by providing a URL and using the default loader that uses HttpClient
 *    to load entities.
 * This class uses RxJS to manage the loading of entities and provides
 * signals to track the loading state, entity count, page index, page size,
 * and whether more entities are available to load.
 *
 * How to use this class:
 *
 * 1. Dervice your component from SPPagedEntityLoader.
 * 2. After your component is initialized, call the startLoader() method to
 *    get the component going. This sets up the necessary subscriptions to
 *    listen for load requests. Load requests are triggered by calling the
 *    loadPage() or loadNextPage() methods.
 * 3. If your component supports infinite scrolling, call loadMoreEntities()
 *    method to load the next page of entities when it detects a scroll event.
 * 4. If you component needs to load a specific page (via a pagination control),
 *    call the loadPage(pageNumber) method to load the specified page.
 * 5. Entities are stored in an internal entities store which is an @ngneat/elf
 *    store. You can subscribe to the store's query to get the list of entities.
 * 6. When your component is destroyed, call the stopLoader() method to clean up
 *    internal subscriptions.
 *
 * The class is decorated with Angular's @Directive decorator so that we can
 * use signals for the input properties and dependency injection for HttpClient.
 * There are no abstract methods as such, but the class is meant to be extended
 * by your component to provide the necessary configuration via input properties.
 * This is why it is declared as abstract.
 */
@Directive({
  selector: '**spPagedEntityLoader**',
})
export abstract class SPPagedEntityLoader<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> {
  // We cache the entities that we fetch from remote here. Cache is indexed
  // by the endpoint. Each endpoint also keeps a refCount, which is incremented
  // for each instance of the component using the same endpoint. When this
  // refcount reaches 0, the endpoint is removed from the cache.
  //
  // This mechanism is to suppress multiple fetches from the remote from the
  // same endpoint as that can occur if a form has multiple instances of
  // this component with the same url.
  static _entitiesCache = new Map<string, { refCount: number; resp: any }>();
  // cache keys for this instance
  cacheKeys = new Set<string>();

  // Current search parameter value. This is used to load entities
  // matching the search string.
  searchParamValue: string | undefined;

  //** REQUIRED ATTRIBUTES **//
  /**
   * Entity name, that is used to form the "New { item }" menu item if
   * inlineNew=true. This is also used as the key of the object in GET response
   * if the reponse JSON is an object (sideloaded response), where the values
   * are stored indexed by the server model name. For eg:-
   *
   * {
   *    'customers': [
   *      {...},
   *      {...},
   *      {...},
   *    ]
   * }
   */
  entityName = input.required<string>();
  url = input.required<string | SPEntityLoaderFn>();

  //** OPTIONAL ATTRIBUTES **//
  // Number of entities to be loaded per page from the server. This will be
  // passed to PagedEntityLoader to load entities in pages. Defaults to 50.
  // Adjust this accordingly based on the average size of your entities to
  // optimize server round-trips and memory usage.
  pageSize = input<number>(50);

  // Paginator for the remote entity list. This is used to determine the
  // pagination parameters for the API request. If not specified, the global
  // paginator specified in SPMatEntityListConfig will be used. If that too is
  // not specified, a default paginator will be used. Default paginator can
  // handle DRF native PageNumberPagination and dynamic-rest style pagination.
  paginator = input<SPMatEntityListPaginator>();

  // Search parameter name to be used in the HTTP request.
  // Defaults to 'search'. That is when a search string is specified and
  // the entire entity list has not been fetched, a fresh HTTP request is made
  // to the remote server with `?<searchParamName>=<search string>` parameter.
  searchParamName = input<string>('search');

  // Entity idKey, if idKey is different from the default 'id'.
  idKey = input<string>('id');

  // Plural entity name, used when grouping options. If not specified, it is
  // derived by pluralizing the entityName.
  pluralEntityName = input<string | undefined>(undefined); // defaults to pluralized entityName

  httpReqContext = input<
    [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any] | undefined
  >(undefined); // defaults to empty context

  // Parameters to be added to the HTTP request to retrieve data from
  // remote. This won't be used if `loadFromRemoteFn` is specified.
  httpParams = input<HttpParams | undefined>(undefined); // defaults to empty params

  // Mechanism to default pageSize to last entities length.
  protected loadRequest$ = new Subject<LoadRequest>();
  protected sub$: Subscription | undefined;
  protected _pageSize = computed<number>(() =>
    this.pageSize() ? this.pageSize() : 50
  );

  protected _pluralEntityName = computed<string>(() => {
    const pluralEntityName = this.pluralEntityName();
    return pluralEntityName ? pluralEntityName : plural(this.entityName());
  });

  protected _capitalizedEntityName = computed<string>(() =>
    capitalize(this.entityName())
  );

  protected _httpReqContext = computed(() => {
    let reqContext = this.httpReqContext;
    const context = new HttpContext();
    if (reqContext && Array.isArray(reqContext)) {
      if (reqContext.length == 2 && !Array.isArray(reqContext[0])) {
        // one dimensional array of a key, value pair.
        context.set(reqContext[0], reqContext[1]);
      } else {
        reqContext.forEach(([k, v]) => context.set(k, v));
      }
    }
    return context;
  });

  entityListConfig = getEntityListConfig();
  protected _paginator = computed<SPMatEntityListPaginator>(() => {
    const paginator = this.paginator();
    const entityListConfigPaginator = this.entityListConfig
      ?.paginator as SPMatEntityListPaginator;
    return paginator
      ? paginator
      : entityListConfigPaginator ?? new DefaultPaginator();
  });

  // We create it here so that store member variable will have the correct
  // type. Unfortunately elf doesn't have a simple generic type that we can
  // use to declare the type of the store and then initialize it later.
  // We will recreate it in the constructor to have the correct idKey.
  protected store = createStore(
    { name: Math.random().toString(36).slice(2) },
    withEntities<TEntity, IdKey>({ idKey: 'id' as IdKey }),
    withProps<StateProps>(DEFAULT_STATE_PROPS),
    withPagination({
      initialPage: 0,
    })
  );

  protected http = inject(HttpClient);

  constructor() {}

  /**
   * Starts listening for load requests and processes them. Call this from your
   * component's ngOnInit() or ngAfterViewInit() method.
   */
  startLoader() {
    // Recreate store with the correct idKey. We have to do this after
    // the idKey is available from the constructor argument.
    this.store = createStore(
      { name: Math.random().toString(36).slice(2) },
      withEntities<TEntity, IdKey>({ idKey: this.idKey() as IdKey }),
      withProps<StateProps>(DEFAULT_STATE_PROPS),
      withPagination({
        initialPage: 0,
      })
    );

    this.sub$ = this.loadRequest$
      .pipe(
        filter((lr) => lr.endpoint !== '' || lr.force === true),
        distinctUntilChanged((prev, current) =>
          current.isEqualToAndNotForced(prev)
        ),
        switchMap((lr: LoadRequest) => this.doActualLoad(lr))
      )
      .subscribe();
  }

  /**
   * Stops listening for load requests and cleans up subscriptions.
   */
  stopLoader() {
    if (this.sub$) {
      this.sub$.unsubscribe();
      this.sub$ = undefined;
    }
    // Remove references to this component's pages from the cache. If this
    // is the only component using those cached pages, they will be cleared
    // from the cache.
    this.removeFromCache();
  }

  /**
   * Returns a boolean indicating whether all entities at the remote have been
   * loaded. All entities are considered loaded when there are no more entities
   * to load from the remote (that is all pages have been loaded without
   * a search filter).
   * @returns
   */
  allEntitiesLoaded(): boolean {
    return this.store.query((state) => state.allEntitiesLoaded);
  }

  /**
   * Returns the total number of entities at the remote as reported by the
   * server (or load fn) during each load.
   * @returns
   */
  totalEntitiesAtRemote(): number {
    return this.store.query(getPaginationData()).total;
  }

  /**
   * Returns number of entities currently stored in the internal store.
   * @returns
   */
  totalEntitiesCount(): number {
    return this.store.query(getEntitiesCount());
  }

  /**
   * Returns true if there are more entities to load from the remote.
   * This is computed based on the total entities count and the number of
   * entities loaded so far. For this method to work correctly, an initial
   * load must have been performed to get the total count from the remote.
   * @returns
   */
  hasMore(): boolean {
    const paginationData = this.store.query(getPaginationData());
    return (
      Object.keys(paginationData.pages).length * paginationData.perPage <
      paginationData.total
    );
    // return this.store.query((state) => state.hasMore);
  }

  /**
   * Returns true if a load operation is in progress. The load async operation
   * method turns the loading state to true when a load operation starts and
   * turns it to false when the operation completes.
   * @returns
   */
  loading(): boolean {
    return this.store.query((state) => state.loading);
  }

  /**
   * Returns the endpoint URL if the loader was created with an endpoint.
   * If the loader was created with a loader function, an empty string is
   * returned.
   * @returns
   */
  endpoint(): string {
    return this.url() instanceof Function ? '' : (this.url() as string);
  }

  /**
   * Loads the specified page number of entities from the remote.
   * @param pageNumber
   */
  loadPage(pageNumber: number) {
    this.loadRequest$.next(
      new LoadRequest(this.url(), pageNumber, this.searchParamValue, false)
    );
  }

  /**
   * Returns the next page number to be loaded. This is based on the current
   * page number stored in the internal pagination state. Note that this method
   * only makes sense when pages are loaded sequentially as in an infinite
   * scroll UI.
   * @returns
   */
  nextPageNumber(): number {
    const paginationData = this.store.query(getPaginationData());
    return paginationData.currentPage + 1;
  }

  /**
   * Returns the total number of pages available at the remote.
   * @returns
   */
  totalPages(): number {
    const paginationData = this.store.query(getPaginationData());
    return Math.ceil(paginationData.total / paginationData.perPage);
  }

  /**
   * Loads the next page of entities from the remote. If forceRefresh is true,
   * the internal store is reset before loading the next page. Use this for
   * infinite scroll scenarios where you want to load the pages sequentially.
   * @param forceRefresh
   */
  loadNextPage(forceRefresh = false) {
    if (forceRefresh) {
      this.store.reset();
    } else if (this.nextPageNumber() > this.totalPages()) {
      return;
    }

    const paginationData = this.store.query(getPaginationData());
    this.loadRequest$.next(
      new LoadRequest(
        this.url(),
        paginationData.currentPage + 1,
        this.searchParamValue,
        false
      )
    );
  }

  setSearchParamValue(searchStr: string) {
    this.searchParamValue = searchStr;
  }

  setEntities(entities: TEntity[]) {
    this.store.update(upsertEntities(entities as any));
  }

  getEntities(): TEntity[] {
    return this.store.query(getAllEntities());
  }

  getEntity(id: TEntity[IdKey]): TEntity | undefined {
    return this.store.query(getEntity(id));
  }

  // Does the actual loading of entities from the remote or the loader
  // function. Once loaded, the entities are stored in the internal store and
  // pagination properties are updated.
  protected doActualLoad(lr: LoadRequest) {
    const loaderFn =
      typeof this.url() === 'function'
        ? (this.url() as SPEntityLoaderFn)
        : undefined;
    let obs: Observable<any>;
    let paramsObj: any = {};
    const pageSize = this._pageSize();
    if (loaderFn) {
      obs = (loaderFn as SPEntityLoaderFn)(
        lr.pageNumber,
        pageSize,
        lr.searchStr
      );
      paramsObj = {
        page: lr.pageNumber,
        pageSize,
      };
      if (lr.searchStr) {
        paramsObj[this.searchParamName()] = lr.searchStr || '';
      }
    } else {
      // Form the HttpParams which consists of pagination params and any
      // embedded params in the URL which doesn't conflict with the page
      // params.
      const urlParts = (this.url() as string).split('?');
      const pageParams = this._paginator().getRequestPageParams(
        urlParts[0],
        lr.pageNumber,
        pageSize
      );
      if (lr.searchStr) {
        pageParams[this.searchParamName()] = lr.searchStr || '';
      }
      let httpParams = new HttpParams({ fromObject: pageParams });
      if (this.httpParams()) {
        this.httpParams()!
          .keys()
          .forEach((key) => {
            const value = this.httpParams()!.getAll(key);
            (value || []).forEach((v) => {
              httpParams = httpParams.append(key, v);
            });
          });
      }
      if (urlParts.length > 1) {
        const embeddedParams = new HttpParams({ fromString: urlParts[1] });
        embeddedParams.keys().forEach((key) => {
          const value = embeddedParams.getAll(key);
          (value || []).forEach((v) => {
            if (!httpParams.has(key)) {
              httpParams = httpParams.append(key, v);
            }
          });
        });
      }
      const cacheKey = this.getCacheKey(urlParts[0], httpParams);
      if (this.existsInCache(cacheKey)) {
        obs = of(this.getFromCache(cacheKey));
      } else {
        obs = this.http
          .get<any>(urlParts[0], {
            context: this._httpReqContext(),
            params: httpParams,
          })
          .pipe(tap((resp) => this.addToCache(cacheKey, resp)));
      }

      // Convert HttpParams to JS object
      httpParams.keys().forEach((key) => {
        paramsObj[key] = httpParams.get(key);
      });
    }

    this.store.update(
      setProps((state) => ({
        ...state,
        loading: true,
      }))
    );
    return obs.pipe(
      // skipWhilePageExistsInCacheOrCache(cacheKey, resp),
      skipWhilePageExists(this.store, lr.pageNumber),
      tap((resp) => {
        let hasMore = false;

        let entities: TEntity[] = [];
        let total = 0;

        if (Array.isArray(resp)) {
          // If the response is an array, we assume it's the array of entities.
          // Obviously, in this case, there's no pagination and therefore
          // set the total number of entities to the length of the array.
          total = resp.length;
          entities = resp;
        } else {
          const result = this._paginator().parseRequestResponse(
            this.entityName(),
            this._pluralEntityName()!,
            this.endpoint(),
            paramsObj,
            resp
          );
          total = result.total;
          entities = result.entities as unknown as TEntity[];
        }

        this.store.update(
          upsertEntities(entities as any),
          setProps((state) => ({
            ...state,
            totalCount: total,
          })),
          updatePaginationData({
            total: total,
            perPage: this.pageSize(),
            lastPage: lr.pageNumber,
            currentPage: lr.pageNumber,
          }),
          setPage(
            lr.pageNumber,
            entities.map((e) => (e as any)[this.idKey()])
          )
        );
      }),
      finalize(() => {
        this.store.update(
          setProps((state) => ({
            ...state,
            allEntitiesLoaded: !this.hasMore() && !this.searchParamValue,
            loading: false,
          }))
        );
      })
    );
  }

  private existsInCache(cacheKey: string): boolean {
    return SPPagedEntityLoader._entitiesCache.has(cacheKey);
  }

  private getCacheKey(url: string, params?: HttpParams): string {
    if (params) {
      return `${url}?${params.toString()}`;
    }
    return url;
  }

  private getFromCache(cacheKey: string): any {
    if (cacheKey && SPPagedEntityLoader._entitiesCache.has(cacheKey)) {
      return SPPagedEntityLoader._entitiesCache.get(cacheKey)?.resp;
    }
    return [];
  }

  addToCache(cacheKey: string, resp: any) {
    if (!SPPagedEntityLoader._entitiesCache.has(cacheKey)) {
      SPPagedEntityLoader._entitiesCache.set(cacheKey, {
        refCount: 0,
        resp,
      });
    }
    const cacheEntry = SPPagedEntityLoader._entitiesCache.get(cacheKey);
    cacheEntry!.refCount += 1;
    this.cacheKeys.add(cacheKey);
  }

  private removeFromCache() {
    for (const cacheKey of this.cacheKeys) {
      const cacheEntry = SPPagedEntityLoader._entitiesCache.get(cacheKey);
      if (cacheEntry) {
        cacheEntry!.refCount -= 1;
        if (cacheEntry.refCount <= 0) {
          SPPagedEntityLoader._entitiesCache.delete(cacheKey);
        }
      }
    }
  }
}
