import { spFormatCurrency, spFormatDate } from '@smallpearl/ngx-helper/locale';
import { Observable, of } from 'rxjs';
import { SPEntityFieldSpec } from './entity-field-spec';
import { SPEntityFieldConfig } from './provider';

type FieldValueTypes = string | number | Date | boolean;

/**
 * A class that represents a SPEntityFieldSpec<>. This is typically used
 * by the library to evaluate a SPEntityFieldSpec<> object.
 */
export class SPEntityField<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id',
> {
  public _fieldSpec!: SPEntityFieldSpec<TEntity, IdKey>;

  constructor(
    spec: SPEntityFieldSpec<TEntity, IdKey> | string,
    public fieldConfig?: SPEntityFieldConfig,
  ) {
    if (typeof spec === 'string') {
      this._fieldSpec = {
        name: spec,
      };
    } else {
      this._fieldSpec = spec;
    }
  }

  get spec() {
    return this._fieldSpec;
  }

  /**
   * Returns the effective fieldValueOptions by merging the global field
   * options (if one has been spefified) with the local field value options.
   * @returns SPEntityFieldSpec<any>['valueOptions']
   */
  get options() {
    let globalFieldValueOptions: SPEntityFieldSpec<any>['valueOptions'] = {};
    if (
      this.fieldConfig &&
      this.fieldConfig?.fieldValueOptions &&
      this.fieldConfig.fieldValueOptions.has(this._fieldSpec.name)
    ) {
      globalFieldValueOptions = this.fieldConfig.fieldValueOptions.get(
        this._fieldSpec.name,
      );
    }
    return {
      ...globalFieldValueOptions,
      ...(this._fieldSpec?.valueOptions ?? {}),
    };
  }
  /**
   * @returns the label for the field.
   */
  label(): Observable<string> {
    const label = this._fieldSpec.label;
    if (label) {
      if (label instanceof Observable) {
        return label;
      } else {
        if (typeof label === 'string') {
          return of(label);
        }
      }
    }
    return of(this._fieldSpec.name);
  }

  /**
   * Given an entity, returns the value of the field matching the
   * SPEntityFieldSpec<> in fieldSpec.
   * @param entity TEntity instance which will be evaluated for
   * SPEntityFieldSpec<>.
   * @returns
   */
  value(entity: TEntity) {
    let val = undefined;
    if (!this._fieldSpec.valueFn) {
      if (
        this.fieldConfig &&
        this.fieldConfig?.fieldValueFns &&
        this.fieldConfig.fieldValueFns.has(this._fieldSpec.name)
      ) {
        val = this.fieldConfig.fieldValueFns.get(this._fieldSpec.name)!(
          entity,
          this._fieldSpec.name,
        );
      } else {
        val = (entity as any)[this._fieldSpec.name];
      }
    } else {
      val = this._fieldSpec.valueFn(entity);
    }
    const valueOptions = this.options;
    if (val instanceof Date) {
      val = spFormatDate(val);
    } else if (typeof val === 'number' && valueOptions?.isCurrency) {
      val = spFormatCurrency(val, this._fieldSpec?.valueOptions?.currency);
    } else if (typeof val === 'boolean') {
      val = val ? '✔' : '✖';
    }
    return val;
  }

  /**
   * If specified, will be added to the CSS classes of the field's wrapper
   * element.
   */
  get class() {
    return this._fieldSpec?.valueOptions?.class ?? '';
  }

  hasRouterLink(entity: TEntity) {
    return !!this._fieldSpec?.valueOptions?.routerLink;
  }

  getRouterLink(entity: TEntity) {
    const rl = this._fieldSpec?.valueOptions?.routerLink;
    if (rl) {
      if (typeof rl == 'function') {
        return rl(entity);
      }
      return rl;
    }
    return [];
  }
}
