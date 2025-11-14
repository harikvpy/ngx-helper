import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpParams,
} from '@angular/common/http';
import { computed } from '@angular/core';
import { createStore, setProps, withProps } from '@ngneat/elf';
import { getAllEntities, getEntitiesCount, getEntity, upsertEntities, withEntities } from '@ngneat/elf-entities';
import { getPaginationData, setPage, skipWhilePageExists, updatePaginationData, withPagination } from '@ngneat/elf-pagination';
import { SPMatEntityListPaginator } from '@smallpearl/ngx-helper/mat-entity-list';
import { plural } from 'pluralize';
import {
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
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

/**
 * A class to load entities from a remote endpoint in a paged manner. Entities
 * can be loaded in one of two ways:
 * 1. By providing an entityLoaderFn that takes an endpoint and HttpParams
 *    and returns a Promise of entities.
 * 2. Or by providing a URL and using the default loader that uses HttpClient
 *    to load entities.
 * This class uses RxJS to manage the loading of entities and provides
 * signals to track the loading state, entity count, page index, page size,
 * and whether more entities are available to load.
 *
 * How to use this class:
 *
 * 1. Create an instance of PagedEntityLoader providing the URL or entity
 *    loader function as argument. You may also provide a paginator to manage
 *    page parameters.
 * 2. After your component is initialized, call the start() method to start
 *    listening for load requests.
 * 3. Call loadMoreEntities() method to load the next page of entities.
 *    Typically, you would want to call this from `ngAfterViewInit()`. Make sure
 *    to call this method after you call `start()`.
 * 4. Whenever your component needs to load more entities, call the
 *    loadMoreEntities() method. You can optionally provide a boolean argument
 *    to force refresh the data.
 * 5. Entities are stored in an internal entities store. You can access the
 *    entities using the entityCount, pageIndex, pageSize, loading, and hasMore
 *    signals.
 * 6. When your component is destroyed, call the stop() method to clean up
 *    subscriptions.
 */
export class SPPagedEntityLoader<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> {
  searchParamValue: string | undefined;

  // Mechanism to default pageSize to last entities length.
  protected loadRequest$ = new Subject<LoadRequest>();
  protected sub$: Subscription | undefined;
  protected _pageSize = computed<number>(() =>
    this.pageSize ? this.pageSize : 50
  );
  protected _entityNamePlural = computed(() =>
    this.entityNamePlural ? this.entityNamePlural : plural(this.entityName)
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

  // We create it here so that store member variable will have the correct
  // type. Unfortunately elf doesn't have a simple generic type that we can
  // use to declare the type of the store and then initialize it later.
  // We will recreate it in the constructor to have the correct idKey.
  readonly store = createStore(
    { name: Math.random().toString(36).slice(2) },
    withEntities<TEntity, IdKey>({ idKey: 'id' as IdKey }),
    withProps<StateProps>(DEFAULT_STATE_PROPS),
    withPagination({
      initialPage: 0,
    })
  );

  constructor(
    protected entityName: string,
    protected endpointOrLoaderFn: string | SPEntityLoaderFn,
    protected http: HttpClient,
    protected pageSize: number,
    protected paginator: SPMatEntityListPaginator,
    protected searchParamName: string = 'search',
    protected idKey = 'id',
    protected entityNamePlural?: string, // defaults to pluralized entityName
    protected httpReqContext?: // defaults to empty context
    [[HttpContextToken<any>, any]] | [HttpContextToken<any>, any],
    protected httpParams?: HttpParams // defaults to empty params
  ) {
    // Recreate store with the correct idKey. We have to do this after
    // the idKey is available from the constructor argument.
    this.store = createStore(
      { name: Math.random().toString(36).slice(2) },
      withEntities<TEntity, IdKey>({ idKey: this.idKey as IdKey }),
      withProps<StateProps>(DEFAULT_STATE_PROPS),
      withPagination({
        initialPage: 0,
      })
    );
  }

  /**
   * Starts listening for load requests and processes them. Call this from your
   * component's ngOnInit() or ngAfterViewInit() method.
   */
  start() {
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
  stop() {
    if (this.sub$) {
      this.sub$.unsubscribe();
      this.sub$ = undefined;
    }
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
    return this.endpointOrLoaderFn instanceof Function
      ? ''
      : (this.endpointOrLoaderFn as string);
  }

  /**
   * Loads the specified page number of entities from the remote.
   * @param pageNumber
   */
  loadPage(pageNumber: number) {
    this.loadRequest$.next(
      new LoadRequest(
        this.endpointOrLoaderFn,
        pageNumber,
        this.searchParamValue,
        false
      )
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
        this.endpointOrLoaderFn,
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
      typeof this.endpointOrLoaderFn === 'function'
        ? this.endpointOrLoaderFn
        : undefined;
    let obs: Observable<any>;
    let paramsObj: any = {};
    const pageSize = this._pageSize();
    if (loaderFn) {
      obs = loaderFn(lr.pageNumber, pageSize, lr.searchStr);
      paramsObj = {
        page: lr.pageNumber,
        pageSize,
      };
      if (lr.searchStr) {
        paramsObj[this.searchParamName] = lr.searchStr || '';
      }
    } else {
      // Form the HttpParams which consists of pagination params and any
      // embedded params in the URL which doesn't conflict with the page
      // params.
      const urlParts = (this.endpointOrLoaderFn as string).split('?');
      const pageParams = this.paginator.getRequestPageParams(
        urlParts[0],
        lr.pageNumber,
        pageSize
      );
      if (lr.searchStr) {
        pageParams[this.searchParamName] = lr.searchStr || '';
      }
      let httpParams = new HttpParams({ fromObject: pageParams });
      if (this.httpParams) {
        this.httpParams.keys().forEach((key) => {
          const value = this.httpParams!.getAll(key);
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
      obs = this.http.get<any>(urlParts[0], {
        context: this._httpReqContext(),
        params: httpParams,
      });

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
          const result = this.paginator.parseRequestResponse(
            this.entityName,
            this._entityNamePlural()!,
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
            perPage: this.pageSize,
            lastPage: lr.pageNumber,
            currentPage: lr.pageNumber,
          }),
          setPage(
            lr.pageNumber,
            entities.map((e) => (e as any)[this.idKey])
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
}
