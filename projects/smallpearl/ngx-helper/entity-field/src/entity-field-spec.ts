import {
  SPIntlDateFormat
} from '@smallpearl/ngx-helper/locale';
import { Observable } from 'rxjs';

type FieldValueTypes = string | number | Date | boolean;

/**
 * This structure defines the data formatting details for a field of the
 * entity. All entity fields need not necessarily be actual entity object's
 * properties. Fields can also be computed fields, in which case the valueFn
 * should be initialized with a valid function to provide the field's value.
 */
export type SPEntityFieldSpec<
  TEntity extends { [P in IdKey]: PropertyKey },
  IdKey extends string = 'id',
> = {
  // Column name. If valueFn is not specified, this will be used as the
  // key name to retrieve the value for the column from TEntity.
  name: string;
  // If omitted, 'name' will be used as field label.
  label?: string | Observable<string>;
  // Column value specific formatting options. Currently, only used for
  // Date types.
  valueOptions?: {
    // Specify the same format string argument that is passed to DatePipe.
    dateTimeFormat?: SPIntlDateFormat;
    // If boolean, number field will be formatted using spFormatCurrency()
    // using the current currency or 'currency' value below.
    isCurrency?: boolean;
    // Currency code, if different from default locale.
    currency?: string;
    // CSS class name; if provided will be applied to field value's wrapper
    // element. This will be <td> & <th>.
    class?: string;
    // Alignment options. Field's value will be aligned based on this.
    alignment?: 'start' | 'center' | 'end';
    // A fixed string or a function that returns an array of strings
    // to be used as the routerlink for the column value.
    routerLink?: ((e: TEntity) => string[]) | [string];
  };
  // If the column value cannot be derived by simple TEntity[name] lookup,
  // use this function to return a custom computed or formatted value.
  valueFn?: (item: TEntity) => FieldValueTypes | Observable<FieldValueTypes>;
};
