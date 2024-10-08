import { Pipe, PipeTransform } from '@angular/core';

import { isEmpty } from './is-empty';
import { getSPI18nConfig, IntlDateFormat } from './providers';

/**
 * An alternative to the Angular built-in `DatePipe` based on the native `Intl.DateTimeFormat` API.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 * https://angular.io/api/common/DatePipe
 */
@Pipe({
  standalone: true,
  name: 'spDate',
})
export class SPDatePipe implements PipeTransform {
  readonly #formatOptions: Record<IntlDateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    },
    full: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'longOffset'
    },
    shortDate: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    },
    mediumDate: { // Equal to the "mediumDate" format in Angular.
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    longDate: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    fullDate: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    shortTime: {
      hour: 'numeric',
      minute: 'numeric',
    },
    mediumTime: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    },
    longTime: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    },
    fullTime: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'longOffset'
    },
  };

  transform(
    value: Date | number | string,
    format?: IntlDateFormat,
    timeZone?: string
  ): string | null {

    if (isEmpty(value)) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.valueOf())) {
      return '******';
      // throw new Error(`Unable to convert "${value}" into a date.`);
    }
    const config = getSPI18nConfig();
    format = format ?? config.datetimeFormat;
    timeZone = timeZone ?? config.timezone;
    const dateTimeFormatter = new Intl.DateTimeFormat(config.locale, {
      ...this.#formatOptions[format],
      timeZone,
    });

    return dateTimeFormatter.format(date);
  }
}
