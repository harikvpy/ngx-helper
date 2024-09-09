import { HttpClient, HttpParams, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatOptgroup, MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, tap } from 'rxjs';
import { SPMatSelectEntityComponent } from './mat-select-entity.component';
import { SP_MAT_SELECT_ENTITY_CONFIG, SPMatSelectEntityConfig } from './providers';

/**
 */
interface User {
  id: number;
  name: string;
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

async function toggleSelectOpen(fixture: ComponentFixture<SelectEntityComponent>, waitForDebounce=true) {
  // Open the mat-select. To open the mat-select, get it's mat-select-trigger child
  // and click on it. mat-select-trigger is <div class='mat-mdc-select-trigger'>
  const triggerElem = fixture.debugElement.query(
    By.css('.mat-mdc-select-trigger')
  );
  (triggerElem.nativeElement as HTMLElement).click();
  if (waitForDebounce) {
    // Wait 400 milliseconds, which is the debounceTimeout
    // for the ngx-mat-select-search filter string
    await new Promise((r) => setTimeout(r, DEBOUNCE_TIMEOUT));
  }
}

describe('MatSelectEntityComponent (single selection)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;
  let control = new FormControl();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SPMatSelectEntityComponent<User>);
    component = fixture.componentInstance;
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
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await toggleSelectOpen(fixture);
    // There should be USER_DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    expect((component as any).loaded).toBeTrue();
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
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture, false);
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
    let injectorArgReceived = false;
    const loadDataFromRemote = (injector: Injector) => {
      injectorArgReceived = !!injector;
      return of(DATA);
    };
    component.loadFromRemoteFn = loadDataFromRemote;
    await toggleSelectOpen(fixture);
    // There should be DATA.length+1 <mat-option /> elements
    // The +1 is the <mat-option /> for ngx-mat-select-search.
    expect(injectorArgReceived).toBeTrue();
    expect(matSel.options.length).toEqual(1 + DATA.length);
    expect((component as any).loaded).toBeTrue();
  });

  it("should emit 'entitySelected' event", async () => {
    // Trap HttpClient.get() and return our custom data
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
    const optionsCountBefore = matSel.options.length;
    component.addEntity({id: 100000, name: "Moosa Marikkar"});
    expect(matSel.options.length).toEqual(optionsCountBefore+1);
  });

  it("should set the current selection to an entity", async () => {
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
    expect(matSel.options.length).toEqual(2 + USER_DATA.length);
    expect(matSel.options.last._getHostElement().innerText.includes('New Item')).toBeTrue();

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
    const http = TestBed.inject(HttpClient);
    spyOn(http, 'get').and.returnValue(of(USER_DATA));
    await toggleSelectOpen(fixture);
    expect(matSel.options.length).toEqual(2 + USER_DATA.length);
    expect(matSel.options.last._getHostElement().innerText.includes('New Item')).toBeTrue();
    // first select first item
    const firstOption = matSel.options.get(1);
    firstOption?.select(true);
    const currentSel = matSel.value;
    // close the select
    await toggleSelectOpen(fixture);
    fixture.detectChanges();
    // open again, which will update lastSelectValue
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
    expect(matSel.options.length).toEqual(1 + USER_DATA.length);
  });
});

describe('MatSelectEntityComponent (config object)', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  const SelectEntityConfig: SPMatSelectEntityConfig = {
    i18n: {
      search: "Look",
      notFound: "Nothing",
      addItem: "Create New"
    }
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SP_MAT_SELECT_ENTITY_CONFIG,
          useValue: SelectEntityConfig
        }
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
    expect(component.searchText).toEqual(SelectEntityConfig.i18n.search);
    expect(component.notFoundText).toEqual(SelectEntityConfig.i18n.notFound);
    expect(component.addItemText).toEqual(SelectEntityConfig.i18n.addItem);
    // One mat-option for ngx-select-search and another for 'Create New'
    expect(matSel.options.length).toEqual(2);
    const lastOption = matSel.options.last;
    expect(lastOption.value).toEqual('0');
    expect(lastOption._text?.nativeElement.innerText.includes(SelectEntityConfig.i18n.addItem)).toBeTrue();
  });
});

describe('MatEntitySelectComponent (grouped entities', () => {
  let component!: SelectEntityComponent;
  let fixture!: ComponentFixture<SelectEntityComponent>;
  let matSel!: MatSelect;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SPMatSelectEntityComponent,
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
    await toggleSelectOpen(fixture);
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
    await toggleSelectOpen(fixture);
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
