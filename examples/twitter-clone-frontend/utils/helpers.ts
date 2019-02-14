import { FirebaseUser, FirebaseUserProperty } from '@typings/firebase.types';
import { Context } from '@typings/next.types';
import { Request } from 'express';
import { get, getOr, pick, pipe } from 'lodash/fp';
import { AUTH_SESSION } from './constants';

export class HTTPError extends Error {
  public response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.name = 'HTTPError';
    this.response = response;
  }
}

export const safeJsonStringify = (obj?: object) => {
  try {
    return JSON.stringify(obj) || undefined;
  } catch (e) {
    console.info('web:helpers', 'Invalid JSON', e);
    return undefined;
  }
};

/**
 * Obtain a session from the server request cookie
 */
export const getSession: (req: Request) => string | undefined = get(['signedCookies', AUTH_SESSION]);

/** Retrieve the FirebaseUserProperty from a user */
export const getFirebaseUserProperty: (user: FirebaseUser) => FirebaseUserProperty = pick([
  'emailVerified',
  'isAnonymous',
  'metadata',
  'phoneNumber',
  'providerData',
  'refreshToken',
  'displayName',
  'email',
  'photoURL',
  'providerId',
  'uid',
]);

/**
 * Retrieve user's id from the app context (if it exists).
 */
export const getUid: (ctx: Context) => string | undefined = get(['ctx', 'req', 'uid']);

/**
 * Retrieve the CSRF token from the app context
 */
export const getCsrfToken: (ctx: Context) => string = pipe<any, () => string, string>(
  getOr(() => '', ['ctx', 'req', 'csrfToken']),
  method => method(),
);
