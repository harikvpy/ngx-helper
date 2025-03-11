import { InjectionToken } from '@angular/core';
import { SPEntityFieldSpec } from './entity-field';


export type FIELD_VALUE_FN = (entity: any, fieldName: string) => string|number|Date|boolean;

/**
 * Global config for SPEntityField component.
 */
export interface SPEntityFieldConfig {
  /**
   * These are global field value functions.
   *
   * If a value function for a field is not explicitly specified, this map is
   * looked up with the field name. If an entry exists in this table, it will
   * be used to render the field's value.
   *
   * This is useful for formatting certain fields which tend to have the
   * same name across the app. For instance fields such as 'amount', 'total'
   * or 'balance'. Or 'date', 'timestamp', etc.
   */
  fieldValueFns?: Map<string, FIELD_VALUE_FN>;
  /**
   * Similar to above, but allows setting the options for certain fields
   * globally. As in the case of `fieldValueFns`, the per field specification,
   * if one exists, takes precedence over the global setting.
   */
  fieldValueOptions?: Map<string, SPEntityFieldSpec<any>['valueOptions']>;
}

export const SP_ENTITY_FIELD_CONFIG = new InjectionToken<SPEntityFieldConfig>(
  'SPEntityFieldConfig'
);
