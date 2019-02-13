import { Observable, Observer, SchedulerLike } from 'rxjs';
import { Env } from './environment';
import { HTTPError, safeJsonStringify } from './helpers';

export const request = async <T>(url: string, payload?: object, options: RequestInit = {}): Promise<T> => {
  // const method: string = options.method ? options.method.toLowerCase() : undefined;
  const headers = new Headers({ 'content-type': 'application/json' });
  if (url.startsWith('/')) {
    headers.set('csrf-token', Env.csrfToken);
  }
  const body = safeJsonStringify(payload);

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    throw new HTTPError(response);
  }

  return response.clone().json();
};

/**
 * Wrap the post request in an observable with automatic cancellation of requests.
 */
export const requestStream: RequestStream = <T>(
  url: string,
  payload?: object,
  options: RequestInit = {},
): Observable<T> => {
  return Observable.create((observer: Observer<T>) => {
    const controller = new AbortController();
    request<T>(url, payload, { ...options, signal: controller.signal })
      .then(data => {
        observer.next(data);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
      });

    return () => {
      controller.abort();
    };
  });
};

type RequestStreamMethod = <T>(url: string, payload?: object, options?: RequestInit) => Observable<T>;

interface RequestStream {
  (url: string, payload?: object, options?: RequestInit): Observable<any>;
  scheduler?: SchedulerLike;
  get: RequestStreamMethod;
  post: RequestStreamMethod;
  delete: RequestStreamMethod;
  put: RequestStreamMethod;
  patch: RequestStreamMethod;
  head: RequestStreamMethod;
}

type MethodType = keyof RequestStream;
const methods: MethodType[] = ['get', 'post', 'delete', 'put', 'patch', 'head'];

const m = methods.reduce<{ [key: string]: RequestStreamMethod }>((prev, method) => {
  const fn: RequestStreamMethod = (...args) => {
    args[2] = { ...(args[2] || {}), method };
    return requestStream(...args);
  };
  return { ...prev, [method]: fn };
}, {});

requestStream.get = m.get;
requestStream.post = m.post;
requestStream.delete = m.delete;
requestStream.put = m.put;
requestStream.patch = m.patch;
requestStream.head = m.head;

export const postStream: RequestStreamMethod = (...args) => {
  args[2] = { ...(args[2] || {}), method: 'post' };
  return requestStream(...args);
};

export const getStream: RequestStreamMethod = (...args) => {
  args[2] = { ...(args[2] || {}), method: 'get' };
  return requestStream(...args);
};
