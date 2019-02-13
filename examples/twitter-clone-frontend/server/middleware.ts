import { createCustomError, respondWithError } from '@kj/plejio-server-core';
import { Env } from '@utils/environment';
import { namespace } from '@utils/logger';
import debug from 'debug';
import { RequestHandler } from 'express';

const log = debug(namespace('middleware'));

export const asyncMiddleware = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    log('A fatal error has occurred', error);
    const err = createCustomError({
      status: 'unknown',
      message: 'an unknown error has occurred',
      ...(Env.isDev ? { details: { error } } : {}),
    });
    respondWithError(err, res);
  });
};
