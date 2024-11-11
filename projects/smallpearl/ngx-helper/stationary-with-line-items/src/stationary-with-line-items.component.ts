import { CommonModule, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, OnInit, TemplateRef } from '@angular/core';
import { getNgxHelperConfig } from '@smallpearl/ngx-helper/core';
import { SPEntityField, SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';


@Component({
  standalone: true,
  imports: [],
  selector: 'sp-string-or-object-renderer',
  template: `
    @if (isString()) {
      {{ value() }}
    } @else {
      <table>
        @for (row of objectAsArray(); track $index) {
          <tr>
            @for (col of row; track $index) {
              <td [style]="'text-align: ' + valueAlignment()">{{ col }}</td>
            }
          </tr>
        }
      </table>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StringOrObjectRendererComponent implements OnInit {
  value = input.required<any>();
  valueAlignment = input<string>()
  isString = computed(() => typeof this.value() === 'string');
  objectAsArray = computed(() => {
    const arrayValues = [];
    const value = this.value();
    if (typeof value !== 'string') {
      for (const key in this.value()) {
        const keyValue = this.value()[key];
        arrayValues.push([key, keyValue]);
      }
    }
    return arrayValues;
  });

  constructor() { }

  ngOnInit() { }
}

@Component({
  standalone: true,
  imports: [],
  selector: 'sp-fields-renderer',
  template: `
    @if (isString()) {
      {{ stringValue() }}
    } @else {
      <div class="">
        <table>
          <tbody>
            @for (field of fields(); track $index) {
            <tr>
              <td [class]="field.class">{{ field.label() }}&colon;</td>
              <td [class]="field.class">{{ field.value(entity()) }}</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
  .field-values {
    padding: 0.2em 0;
    text-align: end;
  }
  tr td:first-of-type {
    padding-right: 1em;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldsRendererComponent<TEntity> implements OnInit {
  entity = input.required<TEntity>();
  fields = input.required<SPEntityField<TEntity>[]>();

  isString = computed(() => typeof this.fields() === 'string');
  // If the field is a single string, looks up entity's properties
  // for matching field name as the string and if it doesn't exist returns
  // the string itself as the value.
  stringValue = computed(() => {
    const fields = this.fields();
    if (typeof fields === 'string') {
      return (this.entity() as any)[fields] ?? fields;
    }
    return '';
  });

  ngxHelperConfig = getNgxHelperConfig();

  constructor(public cdr: ChangeDetectorRef) {}

  ngOnInit() {}
}

/**
 * A component that renders a stationary with line items, such as invoice,
 * payment receipt, bill, bill payment record, journal entry, etc. All these
 * documents have a uniform format and this component abstracts out the
 * information displayed in this type of document as properties that the client
 * can provide while it takes care of the rendering.
 *
 * Ideally we would declare this as a wrapper class with the actual rendering
 * to be performed by an inner replaceable component. This way the app will be
 * able to support multiple stationary designs, which eventually can be
 * chosen by the user. Perhaps even providing them a feature to design the
 * stationary.
 *
 * This is the first towards that long path ahead.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    UpperCasePipe,
    FieldsRendererComponent
],
  selector: 'sp-stationary-with-line-items',
  template: `
  <div class="stationary-wrapper mat-body">
    <div class="title">{{ title() }}</div>
    @if (number()) {
      <div class="number">#{{ number() }}</div>
    }
    <div class="header">
      <div class="left-header">
        @if (leftHeaderTemplate()) {
          <ng-container *ngTemplateOutlet="leftHeaderTemplate() ?? null"></ng-container>
        } @else {
          @if (leftHeader()) {
            @if (isString(leftHeader())) {
              {{ leftHeader() }}
            } @else {
              <sp-fields-renderer
                [entity]="entity()"
                [fields]="_leftHeaderFields()"
              ></sp-fields-renderer>
            }
          }
        }
      </div>
      <div class="right-header">
        @if (rightHeaderTemplate()) {
          <ng-container *ngTemplateOutlet="rightHeaderTemplate() ?? null"></ng-container>
        } @else {
          @if (rightHeader()) {
            @if (isString(rightHeader())) {
              {{ rightHeader() }}
            } @else {
              <sp-fields-renderer
                [entity]="entity()"
                [fields]="_rightHeaderFields()"
              ></sp-fields-renderer>
            }
          }
        }
      </div>
    </div> <!-- end <div class="header"> -->

    <!-- items -->
    @if (itemColumnFields()) {
      <div class="items">
        <table>
          <thead>
            @for (field of _itemColumnFields(); track $index) {
              <th [class]="field.class">{{ field.label() | uppercase }}</th>
            }
          </thead>
          <tbody>
          <!-- enumerate each element of the 'items' array and render the
          specified columns for each. -->
            @for (row of _items(); track $index) {
              <tr>
              @for (field of _itemColumnFields(); track $index) {
                <td [class]="field.class" [innerHtml]="field.value(row)"></td>
              }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    <!-- end items -->

    <!-- footer -->
    <div class="footer">
      <div class="left-footer">
        @if (leftFooterTemplate()) {
          <ng-container *ngTemplateOutlet="leftFooterTemplate() ?? null"></ng-container>
        } @else {
          @if (leftFooter()) {
            @if (isString(leftFooter())) {
              {{ leftFooter() }}
            } @else {
              <sp-fields-renderer
                [entity]="entity()"
                [fields]="_leftFooterFields()"
              ></sp-fields-renderer>
            }
          }
        }
      </div>
      <div class="right-footer">
        @if (rightFooterTemplate()) {
          <ng-container *ngTemplateOutlet="rightFooterTemplate() ?? null"></ng-container>
        } @else {
          @if (rightFooter()) {
            @if (isString(rightFooter())) {
              {{ rightFooter() }}
            } @else {
              <sp-fields-renderer
                [entity]="entity()"
                [fields]="_rightFooterFields()"
              ></sp-fields-renderer>
            }
          }
        }
      </div>
    </div>
  </div>
  `,
  styles: `
  .stationary-wrapper {
    padding: 2em 1em;
  }
  .title {
    font-size: 1.6em;
    font-weight: 600;
    text-align: end;
    margin-bottom: 0.5em;
  }
  .number {
    font-size: 1.1em;
    font-weight: 500;
    text-align: end;
    margin-bottom: 0.5em;
  }
  .header, .footer {
    display: flex;
    flex-direction: row;
    margin-top: 1em;
  }
  .left-header, .left-footer {
    display: flex;
    align-items: bottom;
    text-align: start;
    padding-right: 1em;
    min-width: 50%;
    overflow-wrap: break-word;
    text-wrap: wrap;
  }
  .right-header, .right-footer {
    display: flex;
    justify-content: flex-end;
    min-width: 50%;
    overflow: clip;
  }
  .items {
    margin: 2em 0;
  }
  .items table {
    width: 100%;
    border: 0px solid lightgray;
  }
  .items table thead {
    background-color: black;
    color: white;
    & th {
      padding: 0.4em;
    }
  }
  .items table td {
    padding: 0.8em 0.4em;
    border-bottom: 1px solid lightgray;
    border-right: 0px solid lightgray
  }
  .footer {

  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StationaryWithLineItemsComponent<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id'
> implements OnInit {
  entity = input.required<TEntity>();
  title = input.required<string>();
  number = input<string|number>();

  leftHeader = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  _leftHeaderFields = computed(() => this.getSPEntityFields(this.leftHeader()));
  leftHeaderTemplate = input<TemplateRef<any>>();

  rightHeader = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  _rightHeaderFields = computed(() => this.getSPEntityFields(this.rightHeader()));
  rightHeaderTemplate = input<TemplateRef<any>>();

  items = input<{[key: string]: string}[]>();

  leftFooter = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  _leftFooterFields = computed(() => this.getSPEntityFields(this.leftFooter()));
  leftFooterTemplate = input<TemplateRef<any>>();

  rightFooter = input<Array<SPEntityFieldSpec<TEntity> | string>|string>();
  _rightFooterFields = computed(() => this.getSPEntityFields(this.rightFooter()));
  rightFooterTemplate = input<TemplateRef<any>>();

  itemFieldName = input<string>('items');
  itemColumnFields = input<Array<SPEntityFieldSpec<TEntity> | string>>();
  _itemColumnFields = computed(() => this.getSPEntityFields(this.itemColumnFields()));

  _items = computed(() => (this.entity() as any)[this.itemFieldName()]);

  ngxHelperConfig = getNgxHelperConfig();

  constructor() {}

  ngOnInit() {}

  isString(value: any) {
    return typeof value === 'string';
  }

  getSPEntityFields(fieldSpecs: Array<SPEntityFieldSpec<TEntity> | string>|string|undefined): Array<SPEntityField<TEntity>> {
    if (fieldSpecs && typeof fieldSpecs !== 'string') {
      return fieldSpecs.map(spec => new SPEntityField<TEntity>(spec, this.ngxHelperConfig));
    }
    return [];
  }
}
