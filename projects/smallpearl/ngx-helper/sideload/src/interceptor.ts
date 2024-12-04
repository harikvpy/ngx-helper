import {
  HttpContextToken,
  HttpEvent,
  HttpEventType,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { filter, map, Observable, tap } from 'rxjs';
import { sideloadToComposite } from './sideload';
import { Injectable } from '@angular/core';

// export const SIDELOAD_TO_COMPOSITE_KEY = new HttpContextToken<string>(() => '');

export interface SideloadToCompositeParams {
  compositeObjectKey: string;
  preserveResponse?: boolean; // defaults to false
  idKey?: string; // defaults to 'id'
  mergeStrategy?: 'inplace' | 'append'; // defaults 'append'
  appendObjSuffix?: string; // defaults to 'Detail'
  sideloadDataMap?: Array<[string, string, string?]>;
}

export const SIDELOAD_TO_COMPOSITE_PARAMS = new HttpContextToken<
  string | SideloadToCompositeParams
>(() => '');

function transformReqBody(event: HttpResponse<unknown>, sideloadParams: string|SideloadToCompositeParams) {
  const sideloadToCompositeParams = (
    typeof sideloadParams === 'string'
      ? {
          compositeKey: sideloadParams,
        }
      : sideloadParams
  ) as SideloadToCompositeParams;
  const body = event.body;
  // Merge the sideload content into the targetObject(s). Note that
  // we still return the original request making the sideloaded data
  // available to the initiator of the request.
  const targetObjects = sideloadToComposite(
    body,
    sideloadToCompositeParams.compositeObjectKey,
    sideloadToCompositeParams.idKey ?? 'id',
    sideloadToCompositeParams.mergeStrategy ?? 'append',
    sideloadToCompositeParams.appendObjSuffix ?? 'Detail',
    sideloadToCompositeParams.sideloadDataMap
  );

  const preserveResponse =
    sideloadToCompositeParams.preserveResponse ?? false;
  if (!preserveResponse) {
    return event.clone({ body: targetObjects });
  }
  return event;
}

/**
 * Interceptor to merge sideloaded content into the main entities in a
 * request's response. This interceptor is enabled by the presence of
 * SIDELOAD_TO_COMPOSITE_PARAMS token in the request context. Use it like:
 *
 *  ```
 *  const data$ = http.get('/sensitive/data', {
 *     context: new HttpContext().set(SIDELOAD_TO_COMPOSITE_PARAMS, 'invoices'),
 *  });
 *  ```
 *
 * Though value of this context token can be either
 *  - `SideloadToCompositeParams`: specify the key of the composite data object
 *    along with other custom sideload data map. See `sideloadToComposite`
 *    function doc for details on this argument.
 *  - `string`: the key of the composite data object into which the sideloaded
 *    content is to be merged
 */
export function sideloadToCompositeInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // console.log(req.url);
  // const sideloadParams = req.context.get(SIDELOAD_TO_COMPOSITE_PARAMS);
  // const compositeKey = req.context.get(SIDELOAD_TO_COMPOSITE_KEY);
  return next(req).pipe(
    filter((event) => event.type === HttpEventType.Response),
    map((event) => {
      const sideloadParams = req.context.get(SIDELOAD_TO_COMPOSITE_PARAMS);
      return sideloadParams ? transformReqBody(event as HttpResponse<unknown>, sideloadParams) : event;
      // const body = event.body;
      // // Merge the sideload content into the targetObject(s). Note that
      // // we still return the original request making the sideloaded data
      // // available to the initiator of the request.
      // const targetObjects = sideloadToComposite(
      //   body,
      //   sideloadToCompositeParams.compositeObjectKey,
      //   sideloadToCompositeParams.idKey ?? 'id',
      //   sideloadToCompositeParams.mergeStrategy ?? 'append',
      //   sideloadToCompositeParams.appendObjSuffix ?? 'Detail',
      //   sideloadToCompositeParams.sideloadDataMap
      // );

      // const preserveResponse =
      //   sideloadToCompositeParams.preserveResponse ?? false;
      // if (!preserveResponse) {
      //   return event.clone({ body: targetObjects });
      // }
      // return event;
    })
  );
  // // caching has been disabled for this request
  // return next(req);
}

@Injectable()
export class SideloadToCompositeInterceptor implements HttpInterceptor {

  public intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // const sideloadParams = req.context.get(SIDELOAD_TO_COMPOSITE_PARAMS);
    // const compositeKey = req.context.get(SIDELOAD_TO_COMPOSITE_KEY);
    return next.handle(req).pipe(
      filter((event) => event.type === HttpEventType.Response),
      map((event) => {
        const sideloadParams = req.context.get(SIDELOAD_TO_COMPOSITE_PARAMS);
        return sideloadParams ? transformReqBody(event as HttpResponse<unknown>, sideloadParams) : event;
        // if (sideloadParams) {
        //   // TODO: perform sideloadToComposite apply caching logic
        //   const sideloadToCompositeParams = (
        //     typeof sideloadParams === 'string'
        //       ? {
        //           compositeKey: sideloadParams,
        //         }
        //       : sideloadParams
        //   ) as SideloadToCompositeParams;
        //   const body = event.body;
        //   // Merge the sideload content into the targetObject(s). Note that
        //   // we still return the original request making the sideloaded data
        //   // available to the initiator of the request.
        //   const targetObjects = sideloadToComposite(
        //     body,
        //     sideloadToCompositeParams.compositeObjectKey,
        //     sideloadToCompositeParams.idKey ?? 'id',
        //     sideloadToCompositeParams.mergeStrategy ?? 'append',
        //     sideloadToCompositeParams.appendObjSuffix ?? 'Detail',
        //     sideloadToCompositeParams.sideloadDataMap
        //   );

        //   const preserveResponse =
        //     sideloadToCompositeParams.preserveResponse ?? false;
        //   if (!preserveResponse) {
        //     return event.clone({ body: targetObjects });
        //   }
        // }
        // return event;
      })
    );
  }
}
