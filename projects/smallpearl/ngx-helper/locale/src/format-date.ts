import { isEmpty } from "./is-empty";
import { getSPLocaleConfig, SPIntlDateFormat } from "./providers";

const formatOptions: Record<SPIntlDateFormat, Intl.DateTimeFormatOptions> = {
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

export function spFormatDate(value: Date | number | string, format?: SPIntlDateFormat, timeZone?: string) {
  if (isEmpty(value)) {
    return '';
  }

  const date = new Date(value);

  if (isNaN(date.valueOf())) {
    return '******';
    // throw new Error(`Unable to convert "${value}" into a date.`);
  }
  const config = getSPLocaleConfig();
  format = format ?? config.datetimeFormat;
  const validFormatStrings = Object.keys(formatOptions);
  if (!validFormatStrings.find(formatStr => formatStr === format)) {
    format = 'mediumDate';
  }
  timeZone = timeZone ?? config.timezone;
  const dateTimeFormatter = new Intl.DateTimeFormat(config.locale, {
    ...formatOptions[format],
    timeZone,
  });

  return dateTimeFormatter.format(date);
}
