import { Request } from 'express';
import { get } from 'lodash/fp';
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
