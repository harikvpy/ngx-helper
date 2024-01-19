import { HttpClient } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface QQMatTelephoneInputConfig {
  /**
   * Provider function to detect geographi location and return it
   * to the control. If implemented, the control would call this
   * function during initialization and auto-select the
   * country returned.
   * @param http 
   * @returns 
   */
  getCountryCode?: (http: HttpClient) => Observable<{
    ip: string;
    countryCode: string;
    regionCode: string;
    city: string;
  }>,

  /**
   * When user explicitly selects a country from the country
   * drop down, this function will be called giving the client a chance
   * to save it either to a persistent storage or a session variable.
   */
  saveCountrySelection?: (countryInfo: { code: string, name: string, callingCode: number}) => Promise<void>;

  /**
   * Countries supported by the telephone control. The string is a
   * regex pattern that will be used to filter supported countries.
   * So if you specify ".*", it'll list all countries of the world.
   * "TW|SG|MY" restricts the coutries list to Taiwan, Singapore &
   * Malaysia.
   */
  countries?: string;
}


export const QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER = new InjectionToken<QQMatTelephoneInputConfig>(
  'QQMatTelephoneInputConfigProvider'
);
