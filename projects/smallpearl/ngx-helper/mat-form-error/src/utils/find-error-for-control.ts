import type { AbstractControl } from '@angular/forms';
import type { INgxMatErrorDef } from '../ngx-mat-error-def.directive';
import { ErrorMessages } from '../types';

/**
 * Finds the error key or custom error for a control. The original function
 * has been modified
 * @returns INgxMatErrorDef | undefined
 */
export function findErrorsForControl(
  control: AbstractControl,
  messages: ErrorMessages,
  customErrorMessages: readonly INgxMatErrorDef[]
): string[] | INgxMatErrorDef {
  const errorKeys = Object.keys(control.errors!);
  return (
    customErrorMessages.find((customErrorMessage) =>
      errorKeys.some((error) => {
        if (error !== customErrorMessage.ngxMatErrorDefFor) {
          return false;
        }
        return (
          !customErrorMessage.control || customErrorMessage.control === control
        );
      })
    ) ?? errorKeys.filter((key) => key in messages)
  );
}
