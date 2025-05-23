import { HttpClient, HttpParams, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement, Injector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptgroup, MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, tap } from 'rxjs';
import { SP_MAT_SELECT_ENTITY_HTTP_CONTEXT, SPMatSelectEntityComponent, SPMatSelectEntityHttpContext } from './mat-select-entity.component';

/**
 */
interface User {
  id: number;
  name: string;
}

const eni18n = {
  search: "Search",
  notFound: "Not found",
  addItem: "New {{ item }}"
}

const USER_DATA = [
  { id: 1, name: 'Mariam Trevarthen' },
  { id: 2, name: 'Lanny Nathanson' },
  { id: 3, name: 'Jaye Nevin' },
  { id: 4, name: 'Cordelia Blauser' },
  { id: 5, name: 'Talisha Houk' },
  { id: 6, name: 'Kirsten Jerkins' },
  { id: 7, name: 'Kandace Oleary' },
  { id: 8, name: 'Tammara Michell' },
  { id: 9, name: 'Lily Rainwater' },
  { id: 10, name: 'Izola Silversmith' },
];


interface Group {
  id: number;
  name: string;
  users: User[];
}

// Grouped entities objects - Unit grouped by Block
const GROUPED_USERS: Group[] = [
  {
    id: 1000,
    name: 'Staff',
    users: [
      { id: 1, name: 'Mariam Trevarthen' },
      { id: 2, name: 'Lanny Nathanson' },
      { id: 3, name: 'Jaye Nevin' },
      { id: 4, name: 'Cordelia Blauser' },
      { id: 5, name: 'Talisha Houk' },
      { id: 6, name: 'Kirsten Jerkins' },
      { id: 7, name: 'Kandace Oleary' },
    ],
  },
  {
    id: 1001,
    name: 'Managers',
    users: [
      { id: 8, name: 'Tammara Michell' },
      { id: 9, name: 'Lily Rainwater' },
      { id: 10, name: 'Izola Silversmith' },
    ],
  },
];

// This is hardcoded as 400 milliseconds in the component code.
// If the time is increased in the component code, this also has
// to be updated.
const DEBOUNCE_TIMEOUT = 400;

type SelectEntityComponent = SPMatSelectEntityComponent<User>;

async function openMatSelect(fixture: ComponentFixture<SelectEntityComponent>|DebugElement, waitForDebounce=true) {
  // Open the mat-select. To open the mat-select, get it's mat-select-trigger child
  // and click on it. mat-select-trigger is <div class='mat-mdc-select-trigger'>
  let debugElement: DebugElement;
  if (fixture instanceof ComponentFixture) {
    debugElement = fixture.debugElement;
  } else {
    debugElement = fixture;
  }
  const triggerElem = debugElement.query(
    By.css('.mat-mdc-select-trigger')
  );
  if (triggerElem) {
    (triggerElem.nativeElement as HTMLElement).click();
    if (waitForDebounce) {
      // Wait 400 milliseconds, which is the debounceTimeout
      // for the ngx-mat-select-search filter string
      await new Promise((r) => setTimeout(r, DEBOUNCE_TIMEOUT));
    }
  } else {
    console.error('mat-select open/close trigger element not found!');
  }
}

describe('MatSelectEntityComponent (single selection)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        getTranslocoModule(),
        SPMatSelectEntityComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    });
    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('url', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    fixture.componentRef.setInput('entityLabelFn', (user: User) => user.name);
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the initial values as options', async () => {
    const DATA: User[] = JSON.parse(JSON.stringify(USER_DATA)).splice(0, USER_DATA.length/2);
    component.url = '';
    component.entities = DATA;
    // Wait 400 milliseconds, which is the debounceTimeout
    // for the ngx-mat-select-search filter string
    await new Promise((r) => setTimeout(r, DEBOUNCE_TIMEOUT));
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + DATA.length);
    component.disabled = true;
    fixture.detectChanges();
    expect(matSel.disabled).toBeTrue();
    component.disabled = false;
    fixture.detectChanges();
    expect(matSel.disabled).toBeFalse();
  });

  it('should display current value as the selection', async () => {
    const DATA: User[] = JSON.parse(JSON.stringify(USER_DATA)).splice(0, USER_DATA.length/2);
    component.url = '';
    component.entities = DATA;
    component.writeValue(DATA[0].id);
    fixture.detectChanges();
    // Wait 400 milliseconds, which is the debounceTimeout
    // for the ngx-mat-select-search filter string
    await new Promise((r) => setTimeout(r, DEBOUNCE_TIMEOUT));
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + DATA.length);
    expect((matSel.selected as MatOption).value).toEqual(DATA[0].id);
  });

  it('should load data from remote', async () => {
    // Trap HttpClient.get() and return our custom data
    const http = TestBed.inject(HttpClient);
    // spyOn(http, 'get').and.returnValue(of(USER_DATA));
    let context!: any;
    spyOn(http, 'get').and.callFake(((url: string, options: any) => {
      context = options.context;
      return of(USER_DATA);
    }) as any); // 'as any' to suppress TSC function prototype mismatch
    await openMatSelect(fixture);
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    expect((component as any).loaded).toBeTrue();
    // verify that HttpRequest context has SP_MAT_SELECT_ENTITY_HTTP_CONTEXT
    expect(context).toBeTruthy();
    const selectEntityContext: SPMatSelectEntityHttpContext = context.get(SP_MAT_SELECT_ENTITY_HTTP_CONTEXT);
    expect(selectEntityContext).toBeTruthy();
    expect(selectEntityContext.endpoint).toEqual('https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
  });

  it('should use the specified HttpParams to load remote data', async () => {
    // Trap HttpClient.get() to save the HttpParams to a local variable
    // and return our custom data. We'll examine this HttpParams to check
    // if the parameters that we gave to the component were indeed used
    // to retrieve the remote data.
    const http = TestBed.inject(HttpClient);
    let componentsHttpParams!: string;
    spyOn(http, 'get').and.callFake((url: string, p1: any): Observable<any> => {
      componentsHttpParams = p1.params.toString();
      return of(USER_DATA);
    });
    let params = new HttpParams();
    params = params.set('Authorization', 'abcdefg');
    component.httpParams = params;
    await openMatSelect(fixture);
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    expect((component as any).loaded).toBeTrue();
    expect(componentsHttpParams).toBeTruthy();
    const receivedParams = new HttpParams({fromString: componentsHttpParams});
    expect(receivedParams.get('Authorization')).toEqual('abcdefg');
  });

  it('should filter names based on user input', async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture, false);
    const SEARCH_STRING = USER_DATA[0].name.split(' ')[0];
    // First mat-option element is the ngx-mat-select-search.
    // Simulate user entering into ngx-mat-select-search by setting
    // the value of the [(ngModel)] variable bound to this component.
    fixture.componentInstance.filterStr = SEARCH_STRING; // case sensitive entry!

    // Wait 400 milliseconds, the debounce timeout for the ngx-mat-select-search
    // filter string to be processed.
    await new Promise((r) => setTimeout(r, DEBOUNCE_TIMEOUT));
    // Verify that the number of mat-options matches the filtered mat-options
    // count.
    expect(matSel.options.length).toEqual(
      USER_DATA.filter((u) =>
        u.name.toLocaleLowerCase().includes(SEARCH_STRING.toLocaleLowerCase())
      ).length + 1
    );
  });

  it('should load data using the user provided loadRemoteFn', async () => {
    // Make the length of the user provided select options's length
    // different from USER_DATA so that code logic errors can be easily
    // identified.
    const DATA: User[] = JSON.parse(JSON.stringify(USER_DATA)).splice(
      0,
      USER_DATA.length / 2
    );
    const loadDataFromRemote = () => {
      return of(DATA);
    };
    component.loadFromRemoteFn = loadDataFromRemote;
    await openMatSelect(fixture);
    // There should be DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + DATA.length);
    expect((component as any).loaded).toBeTrue();
  });

  it("should emit 'entitySelected' event", async () => {
    // Trap HttpClient.get() and return our custom data
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    expect((component as any).loaded).toBeTrue();

    let selectedEntityId!: User['id'];
    const sub$ = component.selectionChange
      .pipe(
        tap((entity) => {
          selectedEntityId = (entity as User).id;
        })
      )
      .subscribe();
    // Select a random entity
    const lastOption = matSel.options.last;
    lastOption.select(true);
    expect(selectedEntityId).toEqual(lastOption.value);
    sub$.unsubscribe();
  });

  it("should allow adding a new entity", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const optionsCountBefore = matSel.options.length;
    component.addEntity({id: 100000, name: "Moosa Marikkar"});
    expect(matSel.options.length).toEqual(optionsCountBefore+1);
  });

  it("should set the current selection to an entity", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const optionsCountBefore = matSel.options.length;
    const DET_MOOSA = {id: 100000, name: "Moosa Marikkar"};
    component.addEntity(DET_MOOSA);
    expect(matSel.options.length).toEqual(optionsCountBefore+1);
    component.writeValue(DET_MOOSA.id);
    expect(component.value).toEqual(DET_MOOSA.id);
  });

  it('should have New Item option when inlineNew=true', async () => {
    component.inlineNew = true;
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(2 + USER_DATA.length);
    expect(matSel.options.last._getHostElement().innerText.includes('add')).toBeTrue();

    // select the New Item option
    let createNewItemSelected = false;
    const sub$ = component.createNewItemSelected
      .pipe(
        tap((entity) => {
          createNewItemSelected = true
        })
      )
      .subscribe();
    matSel.options.last.select(true);
    expect(createNewItemSelected).toBeTrue();
  });

  it("should maintain current value even when New Item is selected", async () => {
    component.inlineNew = true;
    component.entityName = 'Item';
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(2 + USER_DATA.length);
    console.log(`matSel.options.last._getHostElement().innerText: ${matSel.options.last._getHostElement().innerText}`);
    expect(matSel.options.last._getHostElement().innerText.includes('spMatSelectEntity.addItem')).toBeTrue();
    // first select first item
    const firstOption = matSel.options.get(1);
    firstOption?.select(true);
    const currentSel = matSel.value;

    const matOptions = fixture.debugElement.queryAll(
      By.directive(MatOption)
    );
    // close the select
    const firstMatOption = matOptions[1];
    firstMatOption.children[0].nativeElement.click();
    // await openMatSelect(fixture);
    fixture.detectChanges();
    // open again, which will update lastSelectValue
    await openMatSelect(fixture);
    fixture.detectChanges();
    expect(component.lastSelectValue).toEqual(firstOption?.value);

    // select the New Item option
    let createNewItemSelected = false;
    const sub$ = component.createNewItemSelected
      .pipe(
        tap((entity) => {
          createNewItemSelected = true
        })
      )
      .subscribe();
    matSel.options.last.select(true);
    expect(createNewItemSelected).toBeTrue();
    fixture.detectChanges();
    await new Promise(r => setTimeout(r, 200));
    expect(matSel.value).toEqual(currentSel);
  });

});

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getTranslocoModule } from '@smallpearl/ngx-helper/src/transloco-testing.module';

@Component({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        SPMatSelectEntityComponent
    ],
    selector: 'test-mat-select-entity-demo',
    template: `
  <form [formGroup]="form">
    <mat-form-field>
      <mat-label>Select User1 (Remote)</mat-label>
      <sp-mat-select-entity
        [url]="remoteUsersUrl1"
        [entityLabelFn]="remoteUserLabelFn"
        entityName="Remote User"
        formControlName="remoteUser1"
      ></sp-mat-select-entity>
    </mat-form-field>
    <mat-form-field>
      <mat-label>Select User2 (Remote)</mat-label>
      <sp-mat-select-entity
        [url]="remoteUsersUrl1"
        [entityLabelFn]="remoteUserLabelFn"
        entityName="Remote User"
        formControlName="remoteUser2"
      ></sp-mat-select-entity>
    </mat-form-field>

    <mat-form-field>
      <mat-label>Select User3 (Remote)</mat-label>
      <sp-mat-select-entity
        [url]="remoteUsersUrl2"
        [entityLabelFn]="remoteUserLabelFn"
        entityName="Remote User"
        formControlName="remoteUser3"
      ></sp-mat-select-entity>
    </mat-form-field>
  </form>
  `
})
export class SelectEntityDemoComponent implements OnInit {
  form = new FormGroup({
    remoteUser1: new FormControl<number>(0),
    remoteUser2: new FormControl<number>(0),
    remoteUser3: new FormControl<number>(0),
  })
  remoteUsersUrl1 = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
  remoteUserLabelFn = (user: any) => `${user.name}`;

  remoteUsersUrl2 = 'https://randomuser.me/api/?results=100&nat=us,dk,fr';

  constructor() { }

  ngOnInit() { }
}

describe('MatSelectEntityComponent Entities Cache', () => {
  let demoComponent!: SelectEntityDemoComponent;
  let demoFixture!: ComponentFixture<SelectEntityDemoComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        SelectEntityDemoComponent,
        getTranslocoModule(),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    demoFixture = TestBed.createComponent(SelectEntityDemoComponent);
    demoComponent = demoFixture.componentInstance;
  });

  it('should fetch data from the same endpoint only once', async () => {
    const http = TestBed.inject(HttpClient);
    const getUsersSpy = spyOn(http, 'get').and.returnValue(of(USER_DATA));
    demoFixture.autoDetectChanges();
    const spMatSelects = demoFixture.debugElement.queryAll(By.directive(SPMatSelectEntityComponent));
    const spMatSelect1 = spMatSelects[0];
    const spMatSelect2 = spMatSelects[1];
    const spMatSelect3 = spMatSelects[2];
    expect(spMatSelect1).toBeTruthy();
    expect(spMatSelect2).toBeTruthy();
    await openMatSelect(spMatSelect1);
    expect(getUsersSpy).toHaveBeenCalled();
    await openMatSelect(spMatSelect2);
    expect(getUsersSpy).toHaveBeenCalledTimes(1);
    // Now open 3rd sp-mat-select-entity. Since it has a different URL than the
    // first two, it should result in HtttpClient.get being called. Therefore
    // the get should've been called a total of 2 times - once for the first
    // two instances of sp-mat-select-entity and once for the third
    // sp-mat-select-entity.
    await openMatSelect(spMatSelect3);
    expect(getUsersSpy).toHaveBeenCalledTimes(2);
    // Destroy the DemoComponent, causing the two SPMatSelectEntityComponent
    // instances to be destroyed as well. Verify that the endpoint is removed
    // from the cache.
    demoFixture.destroy();
    expect(SPMatSelectEntityComponent._entitiesCache.size).toEqual(0);
  });
});

/**
 * Has to be a separate test suite as mat-select [multiple]="true"
 * has to specified during component creation. That is, this property
 * cannot be altered once the component has been created.
 */
describe('MatSelectEntityComponent (multiple selection)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
        getTranslocoModule(),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
    component.multiple = true;
    component.url = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
    component.entityLabelFn = (user: User) => user.name;
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  // MatSelectEntityComponent with multiple selection
  it('should allow multiple selection', async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);

    // Select first and last item. This is equivalent to checking
    // these two items. The consequence is that MatSelect's value
    // should be an array, consisting of the ids of the first
    // and last item.
    const sel1 = (matSel.options.get(1) as MatOption<any>);
    const sel2 = (matSel.options.last as MatOption<any>);
    sel1.select(true);
    sel2.select(true);
    await fixture.whenStable();
    expect(Array.isArray(matSel.value)).toBeTrue();
    const values: number[] = matSel.value;
    // Sort the array, before comparing them!
    expect(values.sort()).toEqual([sel1.value, sel2.value].sort());
  });

  it('should display selection count > 1 as +n', async () => {
    component.multiple = true;
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const sel1 = (matSel.options.get(1) as MatOption<any>);
    const sel2 = (matSel.options.get(2) as MatOption<any>);
    const sel3 = matSel.options.last;
    sel1.select(true);
    sel2.select(true);
    sel3.select(true);
    await fixture.whenStable();
    expect(Array.isArray(matSel.value)).toBeTrue();
    const values: number[] = matSel.value;
    // Sort the array, before comparing them!
    expect(values.sort()).toEqual([sel1.value, sel2.value, sel3.value].sort());
    const addlSelectionCount = fixture.debugElement.query(By.css('.addl-selection-count'));
    expect(addlSelectionCount).toBeTruthy();
    expect((addlSelectionCount.nativeElement as HTMLElement).innerText).toEqual('(+2)');
  });

  it("should emit 'entitySelected' event", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    expect((component as any).loaded).toBeTrue();

    let selectedEntities!: User[];
    const sub$ = component.selectionChange
      .pipe(
        tap((entity) => {
          selectedEntities = entity as User[];
        })
      )
      .subscribe();
    const lastOption = matSel.options.last;
    // MatOption at index 0 is the ngx-select-search. Option at index 1 is
    // the real selectable mat-option.
    const firstOption = matSel.options.get(1) as MatOption;
    lastOption.select(true);
    expect(selectedEntities.length).toEqual(1);
    expect(selectedEntities[0].id).toEqual(lastOption.value);
    firstOption.select(true);
    expect(selectedEntities.length).toEqual(2);
    // Selected entities are returned in the ascending order of their ids.
    // This is because we store the entities as a Map<> indexed by their id.
    expect(selectedEntities[0].id).toEqual(firstOption.value);
    expect(selectedEntities[1].id).toEqual(lastOption.value);
    sub$.unsubscribe();
  });

  it('should not have Add New option when multiple=true', async () => {
    component.inlineNew = true;
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
  });
});

describe('MatSelectEntityComponent (config object)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
        getTranslocoModule(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    });

    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
    component.url = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
    component.entityLabelFn = (user: User) => user.name;
    component.entityName = 'Customer';
    component.inlineNew = true;
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  it("should display 'Create New' option", () => {
    expect(matSel).toBeTruthy();
    // One mat-option for ngx-select-search and another for 'Create New'
    expect(matSel.options.length).toEqual(2);
    const lastOption = matSel.options.last;
    expect(lastOption.value).toEqual('0');
    expect(lastOption._text?.nativeElement.innerText.includes('spMatSelectEntity.addItem')).toBeTrue();
  });
});

describe('MatEntitySelectComponent (grouped entities)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
        getTranslocoModule(),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
    component.url = 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb';
    component.entityLabelFn = (user: User) => user.name;
    component.entityName = 'user';
    component.group = true;
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  it("should load options from pluralized 'entityName'", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(GROUPED_USERS));
    expect(true).toBeTruthy();
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const matOptGroup = fixture.debugElement.queryAll(
      By.directive(MatOptgroup)
    );
    expect(matOptGroup.length).toEqual(2);
    // verify that the mat-optgroup's label and the length of its child
    // 'mat-option' elements matches our GROUPED_USERS array.
    expect(matOptGroup[0].componentInstance.label).toEqual(GROUPED_USERS[0].name);
    expect(matOptGroup[0].nativeElement.querySelectorAll('mat-option').length).toEqual(GROUPED_USERS[0].users.length);
    expect(matOptGroup[1].componentInstance.label).toEqual(GROUPED_USERS[1].name);
    expect(matOptGroup[1].nativeElement.querySelectorAll('mat-option').length).toEqual(GROUPED_USERS[1].users.length);

    // select an entity and check that it emits the 'selectionChange' event.
    let selectedEntityId!: User['id'];
    const sub$ = component.selectionChange
      .pipe(
        tap((entity) => {
          selectedEntityId = (entity as User).id;
        })
      )
      .subscribe();
    // Select a random entity
    const lastOption = matSel.options.last;
    lastOption.select(true);
    expect(selectedEntityId).toEqual(lastOption.value);
    sub$.unsubscribe();
  });

  it("should load options when 'groupOptionsKey' is set", async () => {
    component.groupOptionsKey= 'users';
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(GROUPED_USERS));
    expect(true).toBeTruthy();
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const matOptGroup = fixture.debugElement.queryAll(
      By.directive(MatOptgroup)
    );
    expect(matOptGroup.length).toEqual(2);
    // verify that the mat-optgroup's label and the length of its child
    // 'mat-option' elements matches our GROUPED_USERS array.
    expect(matOptGroup[0].componentInstance.label).toEqual(GROUPED_USERS[0].name);
    expect(matOptGroup[0].nativeElement.querySelectorAll('mat-option').length).toEqual(GROUPED_USERS[0].users.length);
    expect(matOptGroup[1].componentInstance.label).toEqual(GROUPED_USERS[1].name);
    expect(matOptGroup[1].nativeElement.querySelectorAll('mat-option').length).toEqual(GROUPED_USERS[1].users.length);

    // select an entity and check that it emits the 'selectionChange' event.
    let selectedEntityId!: User['id'];
    const sub$ = component.selectionChange
      .pipe(
        tap((entity) => {
          selectedEntityId = (entity as User).id;
        })
      )
      .subscribe();
    // Select a random entity
    const lastOption = matSel.options.last;
    lastOption.select(true);
    expect(selectedEntityId).toEqual(lastOption.value);
    sub$.unsubscribe();
  });

});

describe('MatEntitySelectComponent (sideloaded response)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
        getTranslocoModule(),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('url', 'https://randomuser.me/api/?results=100&nat=us,dk,fr,gb');
    component.entityLabelFn = (user: User) => user.name;
    fixture.componentRef.setInput('entityName', 'user');
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  it("should load options from sideloaded response using 'sideloadDataKey'", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(
      of({
        users: USER_DATA,
      })
    );
    fixture.componentRef.setInput('sideloadDataKey', 'users');
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
    expect(component._sideloadDataKey()).toEqual('users');
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
  });

  it("should load options from sideloaded response using pluralized 'entityName' if 'sideloadDataKey' is not set", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(
      of({
        users: USER_DATA,
      })
    );
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
    expect(component._sideloadDataKey()).toEqual('users');
    await openMatSelect(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
  });

  it("should load options from response parsed using 'responseParserFn'", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(
      of({
        users: USER_DATA,
      })
    );
    let parserFnCalled = false;
    const parserFn = (response: any) => {
      parserFnCalled = true;
      return response['users'];
    }
    fixture.componentRef.setInput('responseParserFn', parserFn);
    fixture.autoDetectChanges();
    matSel = fixture.debugElement.query(
      By.directive(MatSelect)
    ).componentInstance;
    await openMatSelect(fixture);
    expect(parserFnCalled).toBeTrue();
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
  });
});
