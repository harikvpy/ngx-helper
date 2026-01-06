import { HttpContext, HttpContextToken } from '@angular/common/http';

export type HttpContextInput =
  | [[HttpContextToken<any>, any]]
  | [HttpContextToken<any>, any]
  | HttpContext;

/**
 * Converts array of HttpContextToken key, value pairs to HttpContext
 * object in argument 'context'.
 * @param context HTTP context to which the key, value pairs are added
 * @param reqContext HttpContextToken key, value pairs array
 * @returns HttpContext object, with the key, value pairs added. This is
 * the same object as the 'context' argument.
 */
export function convertHttpContextInputToHttpContext(
  context: HttpContext,
  reqContext: HttpContextInput
): HttpContext {
  if (reqContext instanceof HttpContext) {
    // reqContext is already an HttpContext object.
    for (const k of reqContext.keys()) {
      context.set(k, reqContext.get(k));
    }
  } else if (Array.isArray(reqContext) && reqContext.length == 2 && !Array.isArray(reqContext[0])) {
    // one dimensional array of a key, value pair.
    context.set(reqContext[0], reqContext[1]);
  } else {
    reqContext.forEach(([k, v]) => context.set(k, v));
  }
  return context;
}
