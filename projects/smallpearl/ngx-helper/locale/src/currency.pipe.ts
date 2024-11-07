import { Pipe, PipeTransform } from '@angular/core';
import { spFormatCurrency } from './format-currency';

/**
 * This is a replacement for Angular's native currency pipe. This uses
 * web standardized Intl.NumberFormat() API to format currency. The advantage
 * of this over Angular's version is that this pipe allows the locale and
 * currency parameters to be dynamically changed during runtime.
 */
@Pipe({
  name: 'spCurrency',
  standalone: true,
})
export class SPCurrencyPipe implements PipeTransform {
  constructor() {}

  transform(value: number | bigint | string, currency?: string): string | null {
    return spFormatCurrency(value, currency);
  }
}
