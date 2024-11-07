import { isEmpty } from "./is-empty";
import { getSPLocaleConfig } from "./providers";

export function spFormatCurrency(value: number | bigint | string, currency?: string): string | null {

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
