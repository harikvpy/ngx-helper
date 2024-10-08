export type IntlDateFormat = 'short'|'medium'|'long'|'full'|'shortDate'|'mediumDate'|'longDate'|'fullDate'|'shortTime'|'mediumTime'|'longTime'|'fullTime';

export interface SPNgxI18nConfig {
  locale: string;
  currency: string;
  timezone: string;
  datetimeFormat: IntlDateFormat;
}

/**
 * Default mini library config.
 */
const DEFAULT_SP_NGX_I18N_CONFIG: SPNgxI18nConfig = {
  locale: 'en-US',
  currency: 'USD',
  timezone: 'UTC',
  datetimeFormat: 'mediumDate'
};

/**
 * The object that will hold the mini library config.
 */
export let _config: SPNgxI18nConfig = DEFAULT_SP_NGX_I18N_CONFIG;

/**
 * Call this function update the _config dynamically as the need arises.
 * @param config
 */
export function setSPI18nConfig(config: Partial<SPNgxI18nConfig>) {
  _config = {..._config, ...config };
}

/**
 * @returns Current config object.
 */
export function getSPI18nConfig() {
  return _config;
}
