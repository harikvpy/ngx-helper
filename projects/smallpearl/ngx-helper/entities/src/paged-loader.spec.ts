import { HttpClient, provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { getTranslocoModule } from "@smallpearl/ngx-helper/src/transloco-testing.module";
import { of } from "rxjs";
import { SPEntityLoaderFn, SPPagedEntityLoader } from "./paged-loader";
import { SPEntityListPaginator, SPPageParams } from "./paginator";

interface User {
  id: number;
  name: {
    title: string;
    first: string;
    last: string;
  };
  phone: string
}

export const USER_DATA: User[] = [
  {
    id: 1,
    name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' },
    phone: '+886934587678',
  },
  {
    id: 2,
    name: { title: 'Mr', first: 'Lanny', last: 'Nathanson' },
    phone: '+886912345678',
  },
  {
    id: 3,
    name: { title: 'Mr', first: 'Jaye', last: 'Nevin' },
    phone: '+886923456789',
  },
  {
    id: 4,
    name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' },
    phone: '+886934567890',
  },
  {
    id: 5,
    name: { title: 'Ms', first: 'Talisha', last: 'Houk' },
    phone: '+886910000005',
  },
  {
    id: 6,
    name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' },
    phone: '+886910000006',
  },
  {
    id: 7,
    name: { title: 'Ms', first: 'Kandace', last: 'Oleary' },
    phone: '+886910000007',
  },
  {
    id: 8,
    name: { title: 'Ms', first: 'Tammara', last: 'Michell' },
    phone: '+886910000008',
  },
  {
    id: 9,
    name: { title: 'Ms', first: 'Lily', last: 'Rainwater' },
    phone: '+886910000009',
  },
  {
    id: 10,
    name: { title: 'Ms', first: 'Izola', last: 'Silversmith' },
    phone: '+886910000010',
  },
  {
    id: 11,
    name: { title: 'Ms', first: 'Adele', last: 'Forsberg' },
    phone: '+886910000011',
  },
  {
    id: 12,
    name: { title: 'Ms', first: 'Brennan', last: 'Kline' },
    phone: '+886910000012',
  },
  {
    id: 13,
    name: { title: 'Ms', first: 'Cecilia', last: 'Harrow' },
    phone: '+886910000013',
  },
  {
    id: 14,
    name: { title: 'Mr', first: 'Dante', last: 'Voss' },
    phone: '+886910000014',
  },
  {
    id: 15,
    name: { title: 'Ms', first: 'Evelyn', last: 'Carver' },
    phone: '+886910000015',
  },
  {
    id: 16,
    name: { title: 'Mr', first: 'Fabian', last: 'Royce' },
    phone: '+886910000016',
  },
  {
    id: 17,
    name: { title: 'Ms', first: 'Giselle', last: 'Beaumont' },
    phone: '+886910000017',
  },
  {
    id: 18,
    name: { title: 'Mr', first: 'Holden', last: 'Prieto' },
    phone: '+886910000018',
  },
  {
    id: 19,
    name: { title: 'Ms', first: 'Ivy', last: 'Lockwood' },
    phone: '+886910000019',
  },
  {
    id: 20,
    name: { title: 'Mr', first: 'Jonas', last: 'Riddle' },
    phone: '+886910000020',
  },
  {
    id: 21,
    name: { title: 'Ms', first: 'Kara', last: 'Winslow' },
    phone: '+886910000021',
  },
  {
    id: 22,
    name: { title: 'Mr', first: 'Leonard', last: 'Garrison' },
    phone: '+886910000022',
  },
  {
    id: 23,
    name: { title: 'Ms', first: 'Maya', last: 'Ellison' },
    phone: '+886910000023',
  },
  {
    id: 24,
    name: { title: 'Mr', first: 'Nolan', last: 'Bishop' },
    phone: '+886910000024',
  },
  {
    id: 25,
    name: { title: 'Ms', first: 'Odette', last: 'Mercer' },
    phone: '+886910000025',
  },
];

function loaderFn(
  page: number,
  pageSize: number,
  searchValue: string | undefined
) {
  page = page - 1;
  let filteredData = USER_DATA;
  if (searchValue && searchValue.length > 0) {
    const svLower = searchValue.toLowerCase();
    filteredData = USER_DATA.filter(
      (u) =>
        u.name.first.toLowerCase().indexOf(svLower) >= 0 ||
        u.name.last.toLowerCase().indexOf(svLower) >= 0
    );
  }
  const startIndex = page * pageSize;
  return of([...filteredData.slice(startIndex, startIndex + pageSize)]);
};

const REMOTE_USERS_URL = 'https://randomuser.me/api/?nat=us,dk,fr,gb';

class MyPaginator implements SPEntityListPaginator {
  getRequestPageParams(
    endpoint: string,
    pageIndex: number,
    pageSize: number
  ): SPPageParams {
    return {
      page: pageIndex + 1,
      results: pageSize,
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
    resp: any // TEntity[]
  ) {
    const searchStr = params?.['search'] as string;
    let totalUsers = USER_DATA.length;
    // If search string is provided, calculate totalUsers accordingly
    if (searchStr && searchStr.length > 0) {
      const svLower = searchStr.toLowerCase();
      const allUsers = USER_DATA.filter(
        (u) =>
          u.name.title.toLowerCase().indexOf(svLower) >= 0 ||
          u.name.first.toLowerCase().indexOf(svLower) >= 0 ||
          u.name.last.toLowerCase().indexOf(svLower) >= 0
      );
      totalUsers = allUsers.length;
    }
    return {
      total: totalUsers,
      entities: resp,
    };
  }
}

describe('SPPagedEntityLoader', () => {
  let http: HttpClient;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {});

  it('should create an instance with URL', () => {
    const pagedLoader = new SPPagedEntityLoader<User>(
      'user',
      REMOTE_USERS_URL,
      http,
      50,
      new MyPaginator()
    );
    expect(pagedLoader).toBeTruthy();
    expect(pagedLoader.endpoint()).toBe(REMOTE_USERS_URL);
    expect(pagedLoader.loading()).toBeFalse();
    expect(pagedLoader.allEntitiesLoaded()).toBeFalse();
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(0);

    // load entities
    pagedLoader.start()

    let searchStr = '';
    const httpSpy = spyOn(http, 'get').and.callFake((url: string, options: any) => {
      const params = options?.params;
      console.log(`HTTP GET called with URL: ${url} and params:`, params.toString());
      searchStr = params?.get('search') as string;
      return loaderFn(
        parseInt(params?.get('page') || '1', 10) - 1,
        parseInt(params?.get('results') || '50', 10),
        searchStr
      ) as any;
    });

    expect((pagedLoader as any).sub$).toBeDefined();
    pagedLoader.loadNextPage();
    expect(httpSpy).toHaveBeenCalledTimes(1);
    expect(pagedLoader.loading()).toBeFalse();
    expect(pagedLoader.allEntitiesLoaded()).toBeTrue();
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(USER_DATA.length);
    httpSpy.calls.reset();

    // Test loading with search string
    pagedLoader.setSearchParamValue('Ma');
    pagedLoader.loadNextPage(true);
    expect(httpSpy).toHaveBeenCalledTimes(1);
    expect(pagedLoader.loading()).toBeFalse();
    // Will be set only if there are no more entities to load AND no search
    // string is set.
    expect(pagedLoader.allEntitiesLoaded()).toBeFalse();
    const filteredUsers = USER_DATA.filter(u =>
      u.name.title.toLowerCase().indexOf('ma') >= 0 ||
      u.name.first.toLowerCase().indexOf('ma') >= 0 ||
      u.name.last.toLowerCase().indexOf('ma') >= 0
    );
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(filteredUsers.length);
    expect(searchStr).toBe('Ma');

    pagedLoader.stop();
    expect((pagedLoader as any).sub$).toBeUndefined();
  })

  it('should create an instance with a loader function', () => {
    let searchStr: string | undefined;
    const loader: SPEntityLoaderFn = (
      page: number,
      pageSize: number,
      searchValue: string | undefined
    ) => {
      searchStr = searchValue;
      return loaderFn(page, pageSize, searchValue);
    };

    const pagedLoader = new SPPagedEntityLoader<User>(
      'user',
      loader,
      http,
      50,
      new MyPaginator()
    );

    expect(pagedLoader).toBeTruthy();
    // Since we used a loader function, endpoint should be an empty string
    expect(pagedLoader.endpoint()).toBe('');
    expect(pagedLoader.loading()).toBeFalse();
    expect(pagedLoader.allEntitiesLoaded()).toBeFalse();
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(0);

    // load entities
    pagedLoader.start();
    expect((pagedLoader as any).sub$).toBeDefined();
    pagedLoader.loadNextPage();
    expect(pagedLoader.loading()).toBeFalse();
    expect(pagedLoader.allEntitiesLoaded()).toBeTrue();
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(USER_DATA.length);

    // Test loading with search string
    pagedLoader.setSearchParamValue('MA');
    pagedLoader.loadNextPage(true);
    expect(pagedLoader.loading()).toBeFalse();
    // Will be set only if there are no more entities to load AND no search
    // string is set.
    expect(pagedLoader.allEntitiesLoaded()).toBeFalse();
    const filteredUsers = USER_DATA.filter(
      (u) =>
        u.name.title.toLowerCase().indexOf('ma') >= 0 ||
        u.name.first.toLowerCase().indexOf('ma') >= 0 ||
        u.name.last.toLowerCase().indexOf('ma') >= 0
    );
    expect(pagedLoader.totalEntitiesAtRemote()).toBe(filteredUsers.length);
    expect(searchStr).toBe('MA');

    pagedLoader.stop();
    expect((pagedLoader as any).sub$).toBeUndefined();
  });

});
