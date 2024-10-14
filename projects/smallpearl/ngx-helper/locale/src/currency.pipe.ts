import { Pipe, PipeTransform } from '@angular/core';
import { isEmpty } from './is-empty';
import { getSPLocaleConfig } from './providers';

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
    if (isEmpty(value)) {
      return '';
    }

    const number =
      typeof value === 'string' ? parseFloat(value) : (value as number);

    if (isNaN(number)) {
      return "****.**";
      // throw new Error(`"${value}" is not a number.`);
    }

    const config = getSPLocaleConfig();
    // TODO: change to community locale read from this.currentCommunity.locale
    const currencyFormatter = new Intl.NumberFormat(config.locale, {
      currency: currency ?? config.currency,
      style: 'currency',
    });

    return currencyFormatter.format(number);
  }
}
