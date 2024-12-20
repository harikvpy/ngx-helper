import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { FORM_ERRORS, provideErrorTailorConfig } from '@ngneat/error-tailor';
import {
  QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
  QQMatTelephoneInputConfig,
} from '@smallpearl/ngx-helper/mat-tel-input';
import { Observable, of } from 'rxjs';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatErrorTailorControlErrorComponent } from './components/mat-error-tailor-control-error/mat-error-tailor-control-error.component';
import { SP_NGX_HELPER_CONFIG } from '@smallpearl/ngx-helper/core';
import { SP_MAT_ENTITY_CRUD_CONFIG } from '@smallpearl/ngx-helper/mat-entity-crud';
import { SP_ENTITY_FIELD_CONFIG, SPEntityFieldSpec } from '@smallpearl/ngx-helper/entity-field';

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
    MatErrorTailorControlErrorComponent
  ],
  providers: [
    {
      provide: QQMAT_TELEPHONE_INPUT_CONFIG_PROVIDER,
      useValue: WebTelInputConfig,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    provideErrorTailorConfig({
      blurPredicate(element: Element) {
        return (
          element.tagName === 'INPUT' ||
          element.tagName === 'SELECT' ||
          element.tagName === 'TEXTAREA' ||
          element.tagName === 'MAT-SELECT' ||
          element.tagName === 'MAT-DATE-RANGE-INPUT'
        );
      },
      controlErrorComponent: MatErrorTailorControlErrorComponent,
    }),
    {
      provide: FORM_ERRORS,
      useFactory: () => {
        const errorsMap = {
          required: 'Required',
          invalidPhoneNumber: 'Not a valid phone number.',
          invalidMobileNumber: 'Not a valid mobile number.',
          invalidEmail: 'Not a valid email address.',
          invalidValue: 'Invalid value',
          email: 'Not a valid email address.',
          passwordMismatchError: "The two passwords don't match.",
          incorrectOldPassword:
            'Incorrect old password. Please enter it again.',
          invalidPassword:
            'Password should be at least 8 charactes long and consist of alphanumeric characters.',
          invalidNewPassword:
            'Password should be at least 8 charactes long and consist of alphanumeric characters.',
        };
        // console.log(`ErrorTailor messages: ${JSON.stringify(errorsMap)}`);
        return {
          ...errorsMap,
          serverMessage: (msgArgs: any) => {
            // console.log(`serverMessage - args: ${JSON.stringify(msgArgs)}`);
            return msgArgs.message;
          },
        };
      },
      deps: [],
    },
    {
      provide: SP_NGX_HELPER_CONFIG,
      useValue: {
        i18nTranslate: (label: string, context?: any) => label.toUpperCase()
      }
    },
    {
      provide: SP_MAT_ENTITY_CRUD_CONFIG,
      useValue: {
        listPaneWrapperClass: 'sp-mat-crud-list-pane-wrapper-class',
        previewPaneWrapperClass: 'sp-mat-crud-preview-pane-wrapper-class',
      }
    },
    {
      provide: SP_ENTITY_FIELD_CONFIG,
      useValue: {
        fieldValueOptions: new Map<string, SPEntityFieldSpec<any>['valueOptions']>([
          ['gender', { alignment: 'end' }]
        ])
      }
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
