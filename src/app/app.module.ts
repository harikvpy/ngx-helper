import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatSelectModule } from '@angular/material/select';
import {
  QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
  QQMatTelephoneInputConfig,
} from 'projects/smallpearl/mat-tel-input/src/lib';

const WebTelInputConfig: QQMatTelephoneInputConfig = {
  // To cache last value from our API request so that we don't have to
  // repeatedly call the geoip API during the same session.
  getCountryCode: (
    http: HttpClient
  ): Observable<{
    ip: string;
    countryCode: string;
    regionCode: string;
    city: string;
  }> => {
    return of({
      ip: '127.0.0.1',
      countryCode: 'TW',
      regionCode: '',
      city: 'Taipei',
    });
  },
  // List of countries displayed in the telephone input control
  // countries: 'TW|SG|MY|IN|US|GB',
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSelectModule,
  ],
  providers: [
    {
      provide: QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
      useValue: WebTelInputConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
