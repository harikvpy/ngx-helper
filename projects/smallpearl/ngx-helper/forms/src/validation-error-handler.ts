import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { catchError, Observable, of, throwError } from 'rxjs';

/**
 * Handle's form validation errors sent from the server by setting the returned
 * error code in the respective control. Errors not associated with any control
 * in the form are attached to the form itself.
 *
 * These errors can then be rendered using error-tailor. All that needs to be
 * done is to import errorTailorImports in the respective page's module and set
 * the 'errorTailor' directive on the <form..> element.
 *
 * @param form FormGroup instance
 * @param error error object
 */
export function handleValidationErrors(
  form: UntypedFormGroup,
  error: HttpErrorResponse,
  cdr?: ChangeDetectorRef
): Observable<any> {
  if (error.status == 400) {
    /**
     * A helper function that converts the server error codes to an error
     * object that can be set on the form control. If the error code is a
     * string with embedded spaces, it is treated as an actual error message
     * and is set as the 'serverMessage' error code. Otherwise, the error code
     * is returned as the object { errorCode: true }.
     * @param errorCode
     * @returns
     */
    const serverErrorsToErrorObject = (
      errorCode: string | string[]
    ): unknown => {
      if (!Array.isArray(errorCode)) {
        errorCode = [errorCode];
      }
      const errorsObj = {};
      errorCode.forEach((code) => {
        if (code.includes(' ')) {
          // errorCode is an actual error message that we forgot to represent
          // as a camelcase string. So represent the error as the error code
          // 'serverMessage', which will be treated differently by our ErrorTailor
          // error's config provider. (see ionic-error-tailor.module.ts)
          (errorsObj as any)['serverMessage'] = { message: code };
        } else {
          // Real error code
          (errorsObj as any)[code] = true;
        }
      });
      return errorsObj;
    };

    // server form validation errors
    let pendingDetechChanges = false;
    for (const controlName in error.error) {
      const errorsObj = serverErrorsToErrorObject(error.error[controlName]);
      if (form.contains(controlName)) {
        const control = form.controls[controlName];
        control.setErrors(errorsObj as any);
        pendingDetechChanges = true;
      } else {
        form.setErrors(errorsObj as any);
        pendingDetechChanges = true;
      }
    }
    if (pendingDetechChanges && cdr) {
      cdr.detectChanges();
    }
    return of(null);
  }
  return throwError(() => error);
}

/**
 * Returns an rxjs operator that would track an http request's error
 * state and if the return code is 400, would enumerate the error codes
 * set in the response body and set the error state of corresponding
 * form controls.
 *
 * Use it like below:
 *
 *  this.http.get<User>('https://google.com/..').pipe(
 *    setServerErrorsAsFormErrors(form),
 *    tap(user => {
 *      if (user) { // if user = null, it means there was a server validation
 *                  // error.
 *        this.user = user;
 *      }
 *    })
 *  ).subscribe();
 *
 * Note that setServerErrorsAsFormErrors() is the last operator in
 * the operators list. This is important because if a server validation
 * error is encountered, setServerErrorsAsFormErrors(), would place
 * the error on the respective form control and in the end would
 * return Observable<null>. Any subsequent opeators that are added
 * to the list after this should check for this null value in its
 * handler.
 *
 * @param form The FormGroup instance where the controls corresponding
 * to the errors are looked up and its control.error is set to the
 * returned error code.
 * @param cdr ChangeDetectorRef instance. If provided, it would be
 * used to detect changes after the error codes are set on the form
 * controls.
 * @returns An rxjs op that can be added to the pipe() arg list.
 */
export function setServerErrorsAsFormErrors(
  form: UntypedFormGroup,
  cdr?: ChangeDetectorRef
) {
  return function <T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((error) => handleValidationErrors(form, error, cdr))
    );
  };
}
