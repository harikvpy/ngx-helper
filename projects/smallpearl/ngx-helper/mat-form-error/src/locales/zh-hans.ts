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

export function errorMessagesZhHansFactory(
  locale: string,
  dateFormat = 'shortDate',
  timeFormat = 'shortTime'
): ErrorMessages {
  return {
    min: (error: MinError) => `请输入大于或等于 ${error.min} 的数值。`,
    max: (error: MaxError) => `请输入小于或等于 ${error.max} 的数值。`,
    required: `此字段为必填。`,
    email: `请输入有效的电子邮件地址。`,
    minlength: (error: LengthError) =>
      `请至少输入 ${error.requiredLength} 个字符。`,
    maxlength: (error: LengthError) =>
      `请勿输入超过 ${error.requiredLength} 个字符。`,
    matDatepickerMin: (error: MinError<Date>) => {
      const formatted = formatDate(error.min, dateFormat, locale);
      return `请输入大于或等于 ${formatted ?? error.min} 的日期。`;
    },
    matDatepickerMax: (error: MaxError<Date>) => {
      const formatted = formatDate(error.max, dateFormat, locale);
      return `请输入小于或等于 ${formatted ?? error.max} 的日期。`;
    },
    matDatepickerParse: (error: ParseError) => `无效的日期格式。`,
    matStartDateInvalid: (error: StartDateError<Date>) =>
      `开始日期不可晚于结束日期。`,
    matEndDateInvalid: (error: EndDateError<Date>) =>
      `结束日期不可早于开始日期。`,
    matDatepickerFilter: '此日期不可选择。',
    matTimepickerParse: (error: ParseError) => `无效的时间格式。`,
    matTimepickerMin: (error: MinError<Date>) => {
      const formatted = formatDate(error.min, timeFormat, locale);
      return `请输入大于或等于 ${formatted ?? error.min} 的时间。`;
    },
    matTimepickerMax: (error: MaxError<Date>) => {
      const formatted = formatDate(error.max, timeFormat, locale);
      return `请输入小于或等于 ${formatted ?? error.max} 的时间。`;
    },
  };
}

export const NGX_MAT_ERROR_CONFIG_ZH_HANS: FactoryProvider = {
  provide: NGX_MAT_ERROR_DEFAULT_OPTIONS,
  useFactory: errorMessagesZhHansFactory,
  deps: [LOCALE_ID],
};
