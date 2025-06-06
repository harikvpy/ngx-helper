import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, ComponentRef, OnInit, signal, viewChild } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  FIELD_VALUE_FN,
  SP_ENTITY_FIELD_CONFIG,
  SPEntityFieldConfig,
  SPEntityFieldSpec,
} from '@smallpearl/ngx-helper/entity-field';
import { of } from 'rxjs';
import { SPMatEntityListConfig, SPMatEntityListPaginator } from './mat-entity-list-types';
import { SPMatEntityListComponent } from './mat-entity-list.component';
import { SP_MAT_ENTITY_LIST_CONFIG } from './providers';
import { getTranslocoModule } from '@smallpearl/ngx-helper/src/transloco-testing.module';

interface User {
  name: { title: string, first: string, last: string },
  gender: string;
  cell: string;
}

const USER_DATA: User[] = [
  { name: { title: 'Ms', first: 'Mariam', last: 'Trevarthen' }, cell: '12323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lanny', last: 'Nathanson' }, cell: '22323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Jaye', last: 'Nevin' }, cell: '32121234', gender: 'M' },
  { name: { title: 'Ms', first: 'Cordelia', last: 'Blauser' }, cell: '42323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Talisha', last: 'Houk' }, cell: '52323234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kirsten', last: 'Jerkins' }, cell: '63333234', gender: 'F' },
  { name: { title: 'Ms', first: 'Kandace', last: 'Oleary' }, cell: '72525234', gender: 'F' },
  { name: { title: 'Ms', first: 'Tammara', last: 'Michell' }, cell: '82929234', gender: 'F' },
  { name: { title: 'Ms', first: 'Lily', last: 'Rainwater' }, cell: '92121234', gender: 'F' },
  { name: { title: 'Ms', first: 'Izola', last: 'Silversmith' }, cell: '99343234', gender: 'F' },
];

type UserEntityListComponent = SPMatEntityListComponent<User, 'cell'>;

/**
 * A client component that we'll host the SPMatEntityListComponent. We can use
 * this to test SPMatEntityListComponent
 */
@Component({
    imports: [
        CommonModule,
        MatTableModule,
        SPMatEntityListComponent
    ],
    template: `
    <div>
    <sp-mat-entity-list
      entityName="user"
      [endpoint]="endpoint"
      [columns]="spEntityListColumns"
      idKey="cell">

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">
          {{element.name.title}}. {{element.name.first}} {{element.name.last}}
        </td>
      </ng-container>

      </sp-mat-entity-list>

    </div>
  `
})
class SPMatEntityListTestComponent implements OnInit {

  displayedColumns = signal<string[]>([]);
  endpoint = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  columns: SPEntityFieldSpec<User, 'cell'>[] = [
    { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
    { name: 'gender' },
    { name: 'cell' },
  ];

  spEntityListComponent = viewChild(SPMatEntityListComponent<User, 'cell'>);

  ngOnInit(): void {

  }
}

/**
 * Paginator handles DRF's default pagination class response of the format:
      total: number
      next: string,
      previous: string,
      results: TEntity[]
 */
class DRFPaginator implements SPMatEntityListPaginator {
  lastRequestParams: any;
  getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number) {
    return {
      page: pageIndex+1,  // account for 0-based index
      results: pageSize
    }
  }
  parseRequestResponse(
    entityName: string,
    entityNamePlural: string,
    endpoint: string,
    params: any,
    resp: any
  ) {
    // console.log(`parseRequestResponse - params: ${JSON.stringify(params)}`);
    this.lastRequestParams = params;
    return {
      total: resp['total'],
      entities: resp['results']
    }
  }
}

describe('SPMatEntityListComponent', () => {
  let testComponent!: SPMatEntityListTestComponent;
  let testComponentFixture!: ComponentFixture<SPMatEntityListTestComponent>;
  let testComponentRef!: ComponentRef<SPMatEntityListTestComponent>;
  let fixture!: ComponentFixture<UserEntityListComponent>;
  let component!: UserEntityListComponent;
  let componentRef!: ComponentRef<UserEntityListComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityListComponent,
        SPMatEntityListTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityListComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('entityName', 'user');
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      { name: 'gender' },
      { name: 'cell' },
    ]);
  });

  it('should create and load data without paginator', fakeAsync(() => {
    componentRef.setInput('columns', [
      {
        name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last
      },
      'gender',
      {
        name: 'cell',
        // To verify that async cell values are properly evaluated
        valueFn: (user: User) => of(user.cell)
      }
    ]);
    const reqParams = new HttpParams().set('results', '100').set('nat', 'us,dk,fr,gb').set('include[]', 'name').
      append('include[]', 'cell').append('include[]', 'phone');
    componentRef.setInput('endpoint', `https://randomuser.me/api/?${reqParams.toString()}`);
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('httpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpReqContextReceived = false;
    let includeValues: string[]|null;
    const httpGetSpy = spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      httpReqContextReceived = options.context.get('cache') === true;
      const params = options.params as HttpParams;
      includeValues = params.getAll('include[]');
      return of(USER_DATA);
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    fixture.detectChanges();
    tick();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);
    expect(includeValues!).toEqual(['name', 'cell', 'phone']);
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
    // cell nos column data
    const cellNos = fixture.debugElement.nativeElement.querySelectorAll('td:nth-child(3)');
    for (let index = 0; index < cellNos.length; index++) {
      const cellNo = cellNos[index].innerText;
      expect(cellNo).toEqual(USER_DATA[index].cell);
    }
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    expect(httpReqContextReceived).toBeTrue();
  }));

  it('should reload data when endpoint changes', fakeAsync(() => {
    componentRef.setInput('columns', [
      { name: 'name', valueFn: (user: User) => user.name.first + ' ' + user.name.last },
      'gender', 'cell'
    ]);
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('httpReqContext', ['cache', true]);
    const http = TestBed.inject(HttpClient);
    let httpReqContextReceived = false;
    const httpGetSpy = spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      httpReqContextReceived = options.context.get('cache') === true;
      return of(USER_DATA);
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    fixture.detectChanges();
    tick();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
    expect(httpReqContextReceived).toBeTrue();
    httpGetSpy.calls.reset();
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=10&nat=us,dk,fr,gb');
    fixture.detectChanges();
    tick();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);
  }));

  it('should accept hybrid column definitions', fakeAsync(() => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    fixture.autoDetectChanges();
    tick();
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length+1);
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  }));

  it('should show pagination control for pagination="discrete"', fakeAsync(() => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const myPaginator = new DRFPaginator()
    componentRef.setInput('paginator', myPaginator);
    componentRef.setInput('pagination', 'discrete')
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    tick();
    expect(component).toBeTruthy();
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
    // console.log('(paginator.lastRequestParams: ', paginator.lastRequestParams);
  }));

  it('should *NOT* show pagination control for pagination="infinite"', fakeAsync(() => {
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    const myPaginator = new DRFPaginator()
    componentRef.setInput('paginator', myPaginator);
    componentRef.setInput('pagination', 'infinite')
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    tick();
    expect(component).toBeTruthy();
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeFalsy();
  }));

  it('should call paginator methods for pagination args', fakeAsync(() => {
    const endpoint = 'https://randomuser.me/api/?nat=us';
    componentRef.setInput('endpoint', endpoint);
    componentRef.setInput('idKey', 'cell');
    const pageSize = 10;
    const myPaginator = new DRFPaginator()
    componentRef.setInput('paginator', myPaginator);
    componentRef.setInput('pagination', 'discrete')
    componentRef.setInput('pageSize', pageSize)
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    let getRequestPageParams: any = undefined;
    const getRequestPageParamsSpy = spyOn(myPaginator, 'getRequestPageParams').and.callFake((endpoint, pageIndex, pageSize) => {
      getRequestPageParams = {
        endpoint,
        pageIndex,
        pageSize
      }
      return {
        page: pageIndex,
        results: pageSize,
      }
    })
    const parseRequestResponseSpy = spyOn(myPaginator, 'parseRequestResponse').and.returnValue({
      total: USER_DATA.length,
      entities: USER_DATA
    })
    fixture.autoDetectChanges();
    tick();
    expect(component).toBeTruthy();
    const paginator = fixture.debugElement.nativeElement.querySelector('mat-paginator');
    expect(paginator).toBeTruthy();
    expect(getRequestPageParams).toBeTruthy();
    expect(getRequestPageParams.endpoint).toEqual(endpoint.split('?')[0]);
    expect(getRequestPageParams.pageSize).toEqual(pageSize);
    expect(parseRequestResponseSpy).toHaveBeenCalled();
  }));

  /**
   * Test that the global config object is used. These include the following
   * config properties:-
   *
   *    urlResolver
   *    paginator
   *    i18nTranslate
   *    columnValueFns
   */
  it('should use global config object', fakeAsync(() => {
    TestBed.resetTestingModule();
    const myPaginator = new DRFPaginator()

    let globalFieldValueFnsCalled = false;
    const entityFieldConfig: SPEntityFieldConfig = {
      fieldValueFns: new Map<string, FIELD_VALUE_FN>([
        [
          'gender',
          (entity: User, column: string) => {
            globalFieldValueFnsCalled = true;
            return entity.gender === 'F' ? 'പെണ്ണ്' : 'ആണ്';
          },
        ],
      ]),
    };

    class EntityListConfig implements SPMatEntityListConfig {
      urlResolver = (endpoint: string) => endpoint;
      paginator = myPaginator
      i18nTranslate = (label: string, context?: any) => {
        return label;
      };

      constructor() {}
    };

    let globalPaginatorGetEntitiesFromResponseCalled = false;
    spyOn(myPaginator, 'parseRequestResponse').and.callFake(
      (
        entityName: string,
        entityNamePlural: string,
        endpoint: string,
        params: any,
        resp: any
      ) => {
        globalPaginatorGetEntitiesFromResponseCalled = true;
        return {
          total: 100,
          entities: resp['results'],
        };
      }
    );
    const entityListConfig = new EntityListConfig();
    let globalUrlResolverCalled = false;
    spyOn(entityListConfig, 'urlResolver').and.callFake((endpoint: string) => {
      globalUrlResolverCalled = true;
      return endpoint;
    });

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatEntityListComponent,
        SPMatEntityListTestComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SP_MAT_ENTITY_LIST_CONFIG, useValue: entityListConfig },
        { provide: SP_ENTITY_FIELD_CONFIG, useValue: entityFieldConfig },
      ],
    });
    fixture = TestBed.createComponent(SPMatEntityListComponent<User, 'cell'>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('entityName', 'user');
    componentRef.setInput('columns', [
      {
        name: 'name',
        valueFn: (user: User) => {
          return user.name.first + ' ' + user.name.last;
        },
      },
      { name: 'gender' },
      { name: 'cell' },
    ]);
    componentRef.setInput('endpoint', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    componentRef.setInput('idKey', 'cell');
    componentRef.setInput('pagination', 'discrete')
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(
      {
        total: USER_DATA.length,
        next: null,
        previous: null,
        results: USER_DATA
      }
    ));
    fixture.autoDetectChanges();
    tick();
    expect(component).toBeTruthy();
    const rows = fixture.debugElement.nativeElement.querySelectorAll('tbody tr');
    // +1 for the <tr> in <thead>
    expect(rows.length).toEqual(USER_DATA.length);
    // Verify that global paginator's 'getEntitiesFromResponse' was called.
    expect(globalPaginatorGetEntitiesFromResponseCalled).toBeTrue();
    expect(globalUrlResolverCalled).toBeTrue();

    // Verify that global value function specified via SPMatEntityListConfig
    // is used for matching columns without any explicit value function or
    // client projected ng-template.
    const columns = fixture.debugElement.nativeElement.querySelectorAll('tbody td:nth-child(2)');
    for (let index = 0; index < columns.length; index++) {
      const colValue = columns[index].innerText;
      expect(colValue).toEqual(USER_DATA[index].gender === 'F' ? 'പെണ്ണ്' : 'ആണ്');
    }
    // global fieldValue function for 'gender' should've been called.
    expect(globalFieldValueFnsCalled).toBeTrue();
  }));
});
