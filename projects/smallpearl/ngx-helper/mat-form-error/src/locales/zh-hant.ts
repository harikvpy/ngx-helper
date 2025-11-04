import { formatDate } from '@angular/common';
import { type FactoryProvider, LOCALE_ID } from '@angular/core';
import { NGX_MAT_ERROR_DEFAULT_OPTIONS } from '../ngx-mat-errors.component';
import type {
  EndDateError,
  ErrorMessages,
  LengthError,
  MaxError,
  MinError,
  ParseError,
  StartDateError,
} from '../types';

export function errorMessagesZhHantFactory(
  locale: string,
  dateFormat = 'shortDate',
  timeFormat = 'shortTime'
): ErrorMessages {
  return {
    min: (error: MinError) => `請輸入大於或等於 ${error.min} 的數值。`,
    max: (error: MaxError) => `請輸入小於或等於 ${error.max} 的數值。`,
    required: `此欄位為必填。`,
    email: `請輸入有效的電子郵件地址。`,
    minlength: (error: LengthError) =>
      `請至少輸入 ${error.requiredLength} 個字元。`,
    maxlength: (error: LengthError) =>
      `請勿輸入超過 ${error.requiredLength} 個字元。`,
    matDatepickerMin: (error: MinError<Date>) => {
      const formatted = formatDate(error.min, dateFormat, locale);
      return `請輸入大於或等於 ${formatted ?? error.min} 的日期。`;
    },
    matDatepickerMax: (error: MaxError<Date>) => {
      const formatted = formatDate(error.max, dateFormat, locale);
      return `請輸入小於或等於 ${formatted ?? error.max} 的日期。`;
    },
    matDatepickerParse: (error: ParseError) => `無效的日期格式。`,
    matStartDateInvalid: (error: StartDateError<Date>) =>
      `開始日期不可晚於結束日期。`,
    matEndDateInvalid: (error: EndDateError<Date>) =>
      `結束日期不可早於開始日期。`,
    matDatepickerFilter: '此日期不可選取。',
    matTimepickerParse: (error: ParseError) => `無效的時間格式。`,
    matTimepickerMin: (error: MinError<Date>) => {
      const formatted = formatDate(error.min, timeFormat, locale);
      return `請輸入大於或等於 ${formatted ?? error.min} 的時間。`;
    },
    matTimepickerMax: (error: MaxError<Date>) => {
      const formatted = formatDate(error.max, timeFormat, locale);
      return `請輸入小於或等於 ${formatted ?? error.max} 的時間。`;
    },
  };
}

export const NGX_MAT_ERROR_CONFIG_ZH_HANT: FactoryProvider = {
  provide: NGX_MAT_ERROR_DEFAULT_OPTIONS,
  useFactory: errorMessagesZhHantFactory,
  deps: [LOCALE_ID],
};
