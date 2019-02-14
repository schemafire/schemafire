import { Env } from '@utils/environment';
import { RequestHandler } from 'express';
import { createCustomError, respondWithError } from './errors';

export const asyncMiddleware = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.log('A fatal error has occurred', error);
    const err = createCustomError({
      status: 'unknown',
      message: 'an unknown error has occurred',
      ...(Env.isDev ? { details: { error } } : {}),
    });
    respondWithError(err, res);
  });
};
