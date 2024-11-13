import { HttpErrorResponse } from "@angular/common/http";
import { UntypedFormGroup } from "@angular/forms";
import { catchError, NEVER, Observable, of, throwError } from "rxjs";

/**
 * Handle's form validation errors sent from the server by setting the returned
 * error code in the respective control. Errors not associated with any control
 * in the form are attached to the form itself.
 *
 * These errors can then be rendered using error-tailor. All that needs to be done
 * is to import errorTailorImports in the respective page's module and set the
 * 'errorTailor' directive on the <form..> element.
 *
 * @param form FormGroup instance
 * @param error error object
 */
export function handleValidationErrors(
  form: UntypedFormGroup,
  error: HttpErrorResponse,
  returnNull = false
): Observable<any> {
  if (error.status == 400) {
    const serverErrorsToErrorTailorObject = (
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
    for (const controlName in error.error) {
      const errorsObj = serverErrorsToErrorTailorObject(
        error.error[controlName]
      );
      if (form.contains(controlName)) {
        // error attached to FormGroup control
        // errorsObj = errorObjectFromCode(error.error[controlName] as string)
        // const errorCode = error.error[controlName] as string;
        // if (errorCode.includes(' ')) {
        //   // errorCode is an actual error message that we forgot to represent
        //   // as a camelcase string. So represent the error as the error code
        //   // 'serverMessage', which will be treated differently by our ErrorTailor
        //   // error's config provider. (see ionic-error-tailor.module.ts)
        //   errorsObj['serverMessage'] = { message: errorCode };
        // } else {
        //   errorsObj[error.error[controlName] as string] = true;
        // }
        form.controls[controlName].setErrors(errorsObj as any);
      } else {
        // error attached to the entire form
        // errorsObj[error.error[controlName] as string] = true;
        form.setErrors(errorsObj as any);
      }
    }
    return returnNull ? of(null) : NEVER;
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
 *    tap(user => this.user = user)
 *    showServerValidationErrors(form),
 *  ).subscribe();
 *
 * Note that showServerValidationErrors() is the last operator in
 * the operators list. This is important because if a server validation
 * error is encountered, showServerValidationErrors(), would place
 * the error on the respective form control and in the end would
 * return Observable<null>. Any subsequent opeators that are added
 * to the list after this should check for this null value in its
 * handler.
 *
 * This is the default behavior though it can be changedt o return
 * NEVER, by setting retNever argument to true. However, if NEVER
 * is returned, the subscribe() will never complete and therefore
 * the http.<req>.subscribe() would never be properly wound down
 * as is its normal behavior.
 *
 * @param form The FormGroup instance where the controls corresponding
 * to the errors are looked up and its control.error is set to the
 * returned error code.
 * @param retNever By default
 * @returns An rxjs op that can be added to the pipe() arg list.
 */
export function showServerValidationErrors(
  form: UntypedFormGroup,
  retNever = false
) {
  return function <T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((error) =>
        handleValidationErrors(form, error, !retNever)
      )
    );
  };
}
