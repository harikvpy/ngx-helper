import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Injector,
  input,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { SP_MAT_SELECT_ENTITY_CONFIG, SPMatSelectEntityConfig } from './providers';
import { getNgxHelperConfig } from '@smallpearl/ngx-helper/core';
import { plural } from 'pluralize';
import { camelCase } from 'lodash';

export interface SPMatSelectEntityHttpContext {
  entityName: string;
  entityNamePlural: string;
  endpoint: string;
}

export const SP_MAT_SELECT_ENTITY_HTTP_CONTEXT =
  new HttpContextToken<SPMatSelectEntityHttpContext>(() => ({
    entityName: '',
    entityNamePlural: '',
    endpoint: '',
  }));

const DEFAULT_SP_MAT_SELECT_ENTITY_CONFIG: SPMatSelectEntityConfig =
  {
    i18n: {
      search: 'Search',
      notFound: 'Not found',
      addItem: 'New Item',
    },
  };

type EntityGroup<T> = {
  id?: PropertyKey;
  name?: string;
  label?: string;
  description?: string;
  items?: T[];
  __items__?: T[];  // for internal use
};

export type SPMatSelectEntityResponseParser = <
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
>(
  response: any
) => Array<TEntity>;

/**
 * This is a generic component to display a <mat-select> for a FK field
 * where the select's options are dynamically loaded from the server using
 * the given url (or URL). The objects thus retrieved should have a
 * unique 'id' field that will be used as the value of each `option` element.
 * Therefore upon selection of an `option` element, the `select` value will
 * be set to the object's `id` property. By default 'id' is used as its id,
 * but this can be customized by specifying the `idKey' property value.
 */
@Component({
    selector: 'sp-mat-select-entity',
    template: `
    <mat-select
      [placeholder]="placeholder"
      (opened)="onSelectOpened($event)"
      (selectionChange)="onSelectionChange($event)"
      [multiple]="multiple"
      [(ngModel)]="selectValue"
    >
      <mat-select-trigger>
        {{ selectTriggerValue }}
        @if (selectTriggerValueAsArray.length > 1) {
        <span class="addl-selection-count"> (+{{ selectTriggerValueAsArray.length - 1 }}) </span>
        }
      </mat-select-trigger>

      <mat-option>
        <ngx-mat-select-search
          [(ngModel)]="filterStr"
          (ngModelChange)="this.filter$.next($event)"
          [placeholderLabel]="searchText"
          [noEntriesFoundLabel]="notFoundText"
          [searching]="searching"
        >
        </ngx-mat-select-search>
      </mat-option>

      <ng-container *ngIf="!group; else groupedOptions">
        <span *ngIf="(filteredValues | async) as entities">
          <mat-option class="sel-entity-option" *ngFor="let entity of entities" [value]="entityId(entity)">
            {{ entityLabelFn(entity) }}
          </mat-option>
        </span>
      </ng-container>
      <ng-template #groupedOptions>
        <span *ngIf="(filteredGroupedValues | async) as groups">
          @for (group of groups; track groupLabel(group)) {
            <mat-optgroup [label]="groupLabel(group)">
              @for (entity of group.__items__; track entityId(entity)) {
                <mat-option class="sel-entity-option" [value]="entityId(entity)">
                  {{ entityLabelFn(entity) }}
                </mat-option>
              }
            </mat-optgroup>
          }
        </span>
      </ng-template>

      <mat-option *ngIf="!multiple && inlineNew" class="add-item-option" value="0" (click)="$event.stopPropagation()"
        >⊕ {{ addItemText }}</mat-option
      >
    </mat-select>
  `,
    styles: [
        `
      .add-item-option {
        padding-top: 2px;
        border-top: 1px solid gray;
      }
      .addl-selection-count {
        opacity: 0.75;
        font-size: 0.8em;
      }
    `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule, NgxMatSelectSearchModule],
    providers: [{ provide: MatFormFieldControl, useExisting: SPMatSelectEntityComponent }]
})
export class SPMatSelectEntityComponent<TEntity extends { [P in IdKey]: PropertyKey }, IdKey extends string = 'id'>
  implements
    OnInit,
    OnDestroy,
    AfterViewInit,
    ControlValueAccessor,
    MatFormFieldControl<string | number | string[] | number[]>
{
  // We cache the entities that we fetch from remote here. Cache is indexed
  // by the endpoint. Each endpoint also keeps a refCount, which is incremented
  // for each instance of the component using the same endpoint. When this
  // refcount reaches 0, the endpoint is removed from the cache.
  //
  // This mechanism is to suppress multiple fetches from the remote from the
  // same endpoint as that can occur if a form has multiple instances of
  // this component, with the same endpoint.
  static _entitiesCache = new Map<string, { refCount: number; entities: Array<any> }>();

  @ViewChild(MatSelect) matSel!: MatSelect;

  // REQUIRED PROPERTIES //
  /**
   * Entity label function. Given an entity return its natural label
   * to display to the user.
   */
  @Input({ required: true }) entityLabelFn!: (entity: TEntity) => string;

  // OPTIONAL PROPERTIES //
  /**
   * Entity filter function - return a boolean if the entity is to be included
   * in the filtered entities list.
   * @param entity: TEntity object to test for 'search' string.
   * @param search - search string
   */
  @Input({ required: false }) entityFilterFn!: (entity: TEntity, search: string) => boolean;
  /**
   * Entity idKey, if idKey is different from the default 'id'.
   */
  @Input({ required: false }) idKey = 'id';
  /**
   * URL of the remote from where entities are to be loaded.
   * This won't be used if `loadFromRemoteFn` is specified.
   */
  @Input({ required: false }) url!: string;
  /**
   * Parameters to be added to the HTTP request to retrieve data from
   * remote. This won't be used if `loadFromRemoteFn` is specified.
   */
  @Input({ required: false }) httpParams!: HttpParams;
  /**
   * Function to load entities from remote.
   */
  @Input({ required: false }) loadFromRemoteFn!: (injector: Injector) => Observable<TEntity[]>;

  @Input({ required: false }) inlineNew: boolean = false;
  /**
   * Entity name, that is used to form the "New { item }" menu item if
   * inlineNew=true. This is also used as the key of the object in GET response
   * if the reponse JSON is not an array and rather an object, where the values
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
  @Input({ required: false }) entityName!: string;
  // Set to true to allow multiple option selection. The returned value
  // would be an array of entity ids.
  @Input({ required: false }) multiple = false;
  /*
    Whether to group options using <mat-optgroup></mat-optgroup>.
    If set to true, the response from the server should be an array of
    groups of TEntity objects, where each object is of the form:
      [
        {
          id: <id>,
          name|label: <>,
          items|<plural_entityName>|<custom_key>: [
              TEntity,
              ...
          ]
        },
        ...
      ]
  */
  @Input({ required: false }) group = false;
  /**
   * The group object key name under which options are stored. Defaults to
   * 'items' or pluralized 'entityName'. Ideally the client class should
   * explicitly set this property value.
   */
  @Input({ required: false }) groupOptionsKey!: string;
  /**
   * If groupOptions = true, specify this to provide accurate label for each
   * group. If not specified, group label will be determined by looking up one
   * of the standard fields - name, label or description - whichever comes
   * first.
   */
  @Input({ required: false }) groupLabelFn!: (group: any) => string;
  /**
   * Sideload data key name.
   */
  sideloadDataKey = input<string>();
  /**
   * Parser function to return the list of entities from the GET response.
   */
  responseParserFn = input<SPMatSelectEntityResponseParser>();

  @Output() selectionChange = new EventEmitter<TEntity|TEntity[]>();
  @Output() createNewItemSelected = new EventEmitter<void>();

  // allow per component customization
  @Input() searchText!: string;
  @Input() notFoundText!: string;
  @Input() addItemText!: string;

  _sideloadDataKey = computed<string>(() => {
    if (this.sideloadDataKey()) {
      return this.sideloadDataKey() as string;
    }
    return this.entityName ? plural(camelCase(this.entityName)) : 'results';
  });

  private _entities = new Map<PropertyKey, TEntity>();
  private _groupedEntities = new Array<EntityGroup<TEntity>>();

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;

  selectValue!: string | number | string[] | number[];
  // For storing last select value, which we use to restore the select's value
  // to when New Item is selected. This ensures that when New Item is selected,
  // the select's value remains the same. If the newly created item is to be
  // set as the select's value, the corresponding TEntity has to be added
  // to _entities (via addEntity()) and then selected by setting the
  // corresponding formControl's value to the entity's id.
  lastSelectValue!: string | number | string[] | number[];
  searching = false;
  filterStr: string = '';

  filter$ = new BehaviorSubject<string>('');
  // ControlValueAccessor callback
  onChanged = (_: any) => {};
  onTouched = () => {};
  @ViewChild(MatSelect) matSelect!: MatSelect;

  filteredValues = new Subject<TEntity[]>();
  filteredGroupedValues = new Subject<EntityGroup<TEntity>[]>();

  destroy = new Subject<void>();
  private loaded = false;
  private load$ = new BehaviorSubject<boolean>(false);

  static nextId = 0;
  @HostBinding() id = `sp-select-entity-${SPMatSelectEntityComponent.nextId++}`;
  private _placeholder!: string;
  ngxHelperConfig = getNgxHelperConfig();

  constructor(
    protected http: HttpClient,
    protected cdr: ChangeDetectorRef,
    protected _elementRef: ElementRef<HTMLElement>,
    protected injector: Injector,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
    @Optional() @Inject(SP_MAT_SELECT_ENTITY_CONFIG) private config: SPMatSelectEntityConfig
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    this._initStrings();
    combineLatest([this.filter$.pipe(debounceTime(400)), this.load$])
      .pipe(
        takeUntil(this.destroy),
        switchMap(([str, load]) => {
          if (load && !this.loaded) {
            this.searching = true;
            this.cdr.detectChanges();
            return this.loadFromRemote();
          } else {
            return of(this.entities ?? []);
          }
        }),
        tap(() => {
          if (this.group) {
            this.filterGroupedValues(this.filterStr);
          } else {
            this.filterValues(this.filterStr);
          }
          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }
  ngOnDestroy(): void {
    this.destroy.next();
    this.removeFromCache();
    this.stateChanges.complete();
  }

  ngAfterViewInit(): void {
    // I'm not sure this is how this logic is right, but this seems to work.
    // if (this.ngControl && this.ngControl.control?.validator) {
    //   const validator = this.ngControl.control.validator;
    //   const res = validator(this.ngControl.control);
    //   if (res && res['required']) {
    //     this.required = true;
    //   }
    // }
  }

  private _initStrings() {
    const config: SPMatSelectEntityConfig = this.config ?? DEFAULT_SP_MAT_SELECT_ENTITY_CONFIG;
    if (!this.searchText) { this.searchText = config.i18n.search; }
    if (!this.notFoundText) { this.notFoundText = config.i18n.notFound; }
    if (!this.addItemText) { this.addItemText = config.i18n.addItem.replace(/\{\{\s*item\s*}}/, this.entityName ?? "**Item"); }
  }

  addEntity(entity: TEntity) {
    this._entities.set((entity as any)[this.idKey], entity);
    // So that the newly added entity will be added to the <mat-option> list.
    this.filterValues(this.filterStr);
    this.cdr.detectChanges();
  }

  get selectTriggerValue() {
    if (this.selectValue) {
      const firstSelected = Array.isArray(this.selectValue) ? this.selectValue[0] : this.selectValue;
      const selectedEntity = this._entities.get(firstSelected);
      return selectedEntity ? this.entityLabelFn(selectedEntity) : '';
    }
    return '';
  }

  get selectTriggerValueAsArray() {
    return Array.isArray(this.selectValue) ? (this.selectValue as Array<string | number>) : [];
  }

  entityId(entity: TEntity) {
    return (entity as any)[this.idKey];
  }

  writeValue(entityId: string | number | string[] | number[]): void {
    if (Array.isArray(entityId)) {
      if (this.multiple) {
        const selectedValues: any[] = [];
        entityId.forEach(id => {
          if (this._entities.has(id)) {
            selectedValues.push(id);
          }
        });
        this.selectValue = selectedValues;
        this.cdr.detectChanges();
      }
    } else {
      if (this._entities.has(entityId)) {
        this.selectValue = entityId;
        if (this.filterStr) {
          this.filterStr = '';
          this.filterValues(this.filterStr);
        }
        this.cdr.detectChanges();
      }
    }
  }
  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @Input()
  get entities(): TEntity[] {
    return Array.from(this._entities.values());
  }

  set entities(items: TEntity[]) {
    if (!this.group) {
      items.forEach(item => {
        this._entities.set((item as any)[this.idKey], item);
      });
    } else {
      this._groupedEntities = (items as any) as EntityGroup<TEntity>[];
      this._groupedEntities.forEach(group => {
        const key = this.groupEntitiesKey();
        const groupEntities = (group as any)[key] as TEntity[];
        (group as any)['__items__'] = groupEntities;
        groupEntities.forEach(item => {
          this._entities.set((item as any)[this.idKey], item);
        });
      });
    }
  }

  @Input()
  get value(): string | number | string[] | number[] {
    return this.selectValue;
  }
  set value(val: string | number | string[] | number[]) {
    this.selectValue = val;
    this.stateChanges.next();
  }
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input('aria-describedby') userAriaDescribedBy!: string;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return this._required ?? this.ngControl?.control?.hasValidator(Validators.required);
  }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  // Deliberately 'undefined' so that `get required()` will return the state
  // from ngControl's validators.
  private _required!: boolean;

  @Input()
  get disabled(): boolean {
    return this._disabled ?? this.ngControl?.control?.disabled;
  }
  set disabled(value: BooleanInput) {
    const disabled = coerceBooleanProperty(value);;
    if (disabled !== this._disabled) {
      this.setDisabledState(disabled);
      this.stateChanges.next();
    }
  }
  // Same as `_required`, deliberately `undefined` by default.
  private _disabled!: boolean;

  get empty() {
    // TODO
    return !this.value;
  }
  get errorState(): boolean {
    // TODO
    return false;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]) {}

  onContainerClick() {
    // this._focusMonitor.focusVia(this.countrySelect, 'program');
    // if (this.parts.controls.national.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else if (this.parts.controls.country.valid) {
    //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // // } else if (this.parts.controls.national.valid) {
    // //   this._focusMonitor.focusVia(this.nationalInput, 'program');
    // } else {
    //   this._focusMonitor.focusVia(this.countrySelect, 'program');
    // }
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
    if (this.matSelect) {
      this.matSelect.setDisabledState(isDisabled);
      this.cdr.detectChanges();
    }
  }
  onSelectOpened(ev: any) {
    // Store the current select value so that we can restore it if user
    // eventually selects 'New Item' option.
    this.lastSelectValue = this.selectValue;
    // If values have not been loaded from remote, trigger a load.
    if (!this.loaded) {
      this.load$.next(true); // this will trigger the loadFromRemote() call.
    }
  }
  onSelectionChange(ev: MatSelectChange) {
    // console.log('SelectionChange - sel:', ev);
    if (Array.isArray(ev.value)) {
      this.selectValue = ev.value;
      this.onTouched();
      this.onChanged(ev.value);
      const selectedEntities: TEntity[] = ev.value.map(id => this._entities.get(id)) as TEntity[];
      this.selectionChange.emit(selectedEntities);
    } else {
      if (ev.value !== '0') {
        this.selectValue = ev.value;
        this.onTouched();
        this.onChanged(ev.value);
        this.selectionChange.emit(this._entities.get(ev.value));
      } else {
        // New Item activated, return value to previous value. We track
        // previous value via 'lastSelectValue' member which is updated
        // whenever the select is opened.
        if (this.ngControl) {
          this.ngControl.control?.setValue(this.lastSelectValue)
        }
        ev.source.value = this.lastSelectValue;
        this.createNewItemSelected.emit();
        this.cdr.detectChanges();
      }
    }
  }

  filterValues(search: string) {
    const searchLwr = search.toLocaleLowerCase();
    const entities = this.entities;
    if (!entities) {
      return;
    }
    if (!search) {
      this.filteredValues.next(entities.slice());
    } else {
      this.filteredValues.next(
        entities.filter((member) => {
          if (this.entityFilterFn) {
            return this.entityFilterFn(member, search);
          }
          return this.entityLabelFn(member).toLocaleLowerCase().includes(searchLwr);
        })
      );
    }
  }

  /**
   * Filtering grouped entities logic works like this. If the search string
   * matches a group label, the entire group is to be included in the results.
   * However, if the search string only matches certain entities, only those
   * groups are to be included and within those groups, only entities whose
   * label matches the search string are to be included in the result set.
   * @param search
   * @returns
   */
  filterGroupedValues(search: string) {
    const searchLwr = search.toLocaleLowerCase();
    const groups = this._groupedEntities;
    if (!groups) {
      return;
    }
    if (!search) {
      const groupsCopy = groups.slice();
      this.filteredGroupedValues.next(groupsCopy);
    } else {
      const groupEntitiesKey = this.groupEntitiesKey();
      const groups = this._groupedEntities.map(ge => {
        const label = this.groupLabel(ge);
        if (label.toLocaleLowerCase().includes(searchLwr)) {
          return {...ge} as EntityGroup<TEntity>;
        } else {
          const groupEntities = ge.__items__?.filter(
            e => this.entityLabelFn(e).toLocaleLowerCase().includes(searchLwr)
          );
          const ret: any = {
            ...ge
          };
          ret['__items__'] = groupEntities ?? [];
          return ret as EntityGroup<TEntity>;
        }
      });
      // filter out groups with no entities
      // console.log(`Groups: ${JSON.stringify(groups)}`);
      this.filteredGroupedValues.next(groups.filter(
        (group) =>
          Array.isArray((group as any)[groupEntitiesKey]) &&
          (group as any)['__items__'].length > 0
      ));
    }
  }

  loadFromRemote() {
    if (!this.url && !this.loadFromRemoteFn) {
      // If user had initialized entities, they will be dispalyed
      // in the options list. If not, options would be empty.
      return of(this.group ? this.groupEntities : this.entities);
    }
    let cacheKey!: string;
    let obs: Observable<TEntity[]>;
    if (this.loadFromRemoteFn) {
      obs = this.loadFromRemoteFn(this.injector);
    } else {
      let params!: HttpParams;
      if (this.httpParams) {
        params = new HttpParams({
          fromString: this.httpParams.toString()
        })
      } else {
        params = new HttpParams();
      }
      params = params.set('paginate', false)
      cacheKey = this.getCacheKey();
      if (this.existsInCache()) {
        obs = of(this.getFromCache())
      } else {
        obs = this.http.get<any>(this.url, {
          context: this.getHttpReqContext(),
          params,
        });
      }
    }
    return obs.pipe(
      tap((entities) => {
        this.searching = false; // remote loading done, will hide the loading wheel
        // Handle DRF paginated response
        const responseParserFn = this.responseParserFn();
        if (responseParserFn) {
          entities = (responseParserFn(entities) as unknown) as TEntity[];
        } else {
          if (
            !Array.isArray(entities) &&
            entities['results'] &&
            Array.isArray(entities['results'])
          ) {
            entities = entities['results'];
          } else if ( // sideloaded response, where entities are usually provided in 'entityName'
            this._sideloadDataKey() &&
            !Array.isArray(entities) &&
            typeof entities === 'object' &&
            entities[this._sideloadDataKey()] &&
            Array.isArray(entities[this._sideloadDataKey()])
          ) {
            entities = entities[this._sideloadDataKey()];
          }
        }
        if (Array.isArray(entities)) {
          this.entities = entities;
          // if (this.group) {
          //   this._groupedEntities = entities as EntityGroup<TEntity>[];
          // } else {
          //   this.entities = entities;
          // }
        }
        this.loaded = true;
        this.addToCache(entities);
        this.cdr.detectChanges();
      })
    );
  }

  groupLabel(group: EntityGroup<TEntity>): string {
    if (this.groupLabelFn) {
      return this.groupLabelFn(group);
    }
    const standardLabelFields = ['name', 'label', 'desc', 'description'];
    for (let index = 0; index < standardLabelFields.length; index++) {
      const labelField = standardLabelFields[index];
      if ((group as any)[labelField]) {
        return (group as any)[labelField];
      }
    }
    return `Group ${String(group.id)}`;
  }

  groupEntities(group: EntityGroup<TEntity>): TEntity[] {
    const key = this.groupEntitiesKey();
    console.log(`groupEntities - group: ${JSON.stringify(group)}, key: ${key}`);
    return (group as any)[this.groupEntitiesKey()] ?? [];
  }

  groupEntitiesKey() {
    return this.groupOptionsKey ? this.groupOptionsKey
      : (this.entityName ? plural(this.entityName.toLocaleLowerCase()) : 'items');
  }

  private existsInCache() {
    const cacheKey = this.getCacheKey();
    if (cacheKey) {
      return SPMatSelectEntityComponent._entitiesCache.has(cacheKey);
    }
    return false;
  }

  private getCacheKey() {
    if (!this.loadFromRemoteFn) {
      let params!: HttpParams;
      if (this.httpParams) {
        params = new HttpParams({
          fromString: this.httpParams.toString()
        })
      } else {
        params = new HttpParams();
      }
      // params = params.set('paginate', false)
      return `${this.url}?${params.toString()}`;
    }
    return ''; // empty string evalutes to boolean(false)
  }
  private getFromCache() {
    const cacheKey = this.getCacheKey();
    if (cacheKey && SPMatSelectEntityComponent._entitiesCache.has(cacheKey)) {
      return SPMatSelectEntityComponent._entitiesCache.get(cacheKey)?.entities as TEntity[]
    }
    return [];
  }
  private addToCache(entities: TEntity[]) {
    const cacheKey = this.getCacheKey();
    if (cacheKey) {
      if (!SPMatSelectEntityComponent._entitiesCache.has(cacheKey)) {
        SPMatSelectEntityComponent._entitiesCache.set(cacheKey, {refCount: 0, entities});
      }
      const cacheEntry = SPMatSelectEntityComponent._entitiesCache.get(cacheKey);
      cacheEntry!.refCount += 1;
    }
  }
  private removeFromCache() {
    const cacheKey = this.getCacheKey();
    if (cacheKey) {
      const cacheEntry = SPMatSelectEntityComponent._entitiesCache.get(cacheKey);
      if (cacheEntry) {
        cacheEntry!.refCount -= 1;
        if (cacheEntry.refCount <= 0) {
          SPMatSelectEntityComponent._entitiesCache.delete(cacheKey);
        }
      }
    }
  }

  private getHttpReqContext() {
    const context = new HttpContext();
    const entityName = this.entityName;
    context.set(SP_MAT_SELECT_ENTITY_HTTP_CONTEXT, {
      entityName: this.entityName ?? '',
      entityNamePlural: this.entityName ? plural(this.entityName) : '',
      endpoint: this.url
    });
    return context;
  }
}
