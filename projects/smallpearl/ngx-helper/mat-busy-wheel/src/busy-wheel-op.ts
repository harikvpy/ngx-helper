import { finalize, Observable, tap } from 'rxjs';
import { hideBusyWheel, showBusyWheel } from './busy-wheel.service';

/**
 * Returns an rxjs operator that would track an http request status
 * and would use the request status to hide the global busy wheel. The wheel
 * would be hidden when the request completes or errors.
 *
 * Use it like below:
 *
 *  this.http.get<User>('https://google.com/..').pipe(
 *    trackBusyWheelStatus(),
 *    tap(user => this.user = user)
 *  ).subscribe();
 *
 * Note that the function internally uses a timer to delay showing the busy
 * wheel. This helps avoid needless screen flicker that can occur when quickly
 * showing & hiding the wheel when the network connection and server response
 * are so good that it can exceed natural user reaction time. We set this
 * delay to 150 milliseconds for now.
 *
 * @param id A string value that uniquely identities the the busy wheel host
 * container within the page. This allows multiple busy wheels to be hosted
 * within a page, each for a distinct network (or time-consuming) operation.
 * This is optional and if not specified, will create a busy wheel that
 * covers the entire app viewport.
 * @param show A boolean value that says whether to show the wheel as
 * part of the operator setup. If set to false, the caller is expected
 * to have displayed the busy wheel explicitly.
 * @param showImmediate A boolean value that decides whether to show the
 * busy wheel immediately. If set to false (default), the busy wheel will
 * only be shown when the HTTP request has not completed within 200ms.
 * @param hideOnNthEmit Number of emits upon which the busy wheel is to
 * be hidden. A value of 0 for this means the wheel is hidden only when
 * the observable completes (errorneously or otherwise).
 * @returns An rxjs op that can be added to the pipe() arg list.
 */
export function trackBusyWheelStatus(id?: string, show = true, showImmediate = false, hideOnNthEmit = 0) {
  let timeout: any = null;
  let wheelShown = false;
  if (show) {
    timeout = setTimeout(
      () => {
        showBusyWheel(id);
        wheelShown = true;
      },
      showImmediate ? 0 : 150
    );
  }

  return function <T>(source: Observable<T>): Observable<T> {
    let emits = 0;
    const hideFn = () => {
      // console.log('busywheel.hideFn');
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (!show || wheelShown) {
        hideBusyWheel(id);
      }
    };
    return source.pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tap((val) => {
        if (hideOnNthEmit > 0 && ++emits == hideOnNthEmit) {
          // console.log(`trackBusyWheelStatus - obs emitted ${hideOnNthEmit} values, hiding`);
          hideFn();
        }
      }),
      finalize(() => {
        // finalize() arg will be invoked upon completion or error
        hideFn();
      })
    );
  };
}

/**
 * Show a busy wheel until the observable is complete. Busy wheel is shown is either viewport global
 * or localized to the element with the the given id.
 *
 * An example use case for this operator are HTTP requests which will complete no matter
 * what. Either successfully or with an error. Either case will mark the observer as completed.
 *
 * See trackBusyWheelStatus() for explanations on arguments
 *
 * @param id
 * @param showImmediate
 * @returns
 */
export function showBusyWheelUntilComplete(id?: string, showImmediate = false) {
  return trackBusyWheelStatus(id, true, showImmediate, 0);
}

/**
 * Show a busy wheel until the observable emits n number of values. Busy wheel is shown is
 * either viewport global or localized to the element with the the given id.
 *
 * An example use case for this operator are observables that emit but which do not necessarily
 * complete.
 *
 * See trackBusyWheelStatus() for explanations on arguments
 *
 * @param numEmits
 * @param id
 * @param showImmediate
 * @returns
 */
export function showBusyWheelUntilEmits(numEmits: number, id?: string, showImmediate = false) {
  return trackBusyWheelStatus(id, true, showImmediate, numEmits);
}
