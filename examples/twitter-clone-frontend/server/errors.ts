import { Response } from 'express';
import {} from 'firebase-functions';
import { FunctionsErrorCode, HttpsError as FuncError } from 'firebase-functions/lib/providers/https';

export interface ErrorDetails {
  [x: string]: string | object;
}

export interface ErrorParams {
  status: FunctionsErrorCode;
  message: string;
  details?: ErrorDetails;
}

const errorCodeMap: { [name: string]: string } = {
  ok: 'OK',
  cancelled: 'CANCELLED',
  unknown: 'UNKNOWN',
  'invalid-argument': 'INVALID_ARGUMENT',
  'deadline-exceeded': 'DEADLINE_EXCEEDED',
  'not-found': 'NOT_FOUND',
  'already-exists': 'ALREADY_EXISTS',
  'permission-denied': 'PERMISSION_DENIED',
  unauthenticated: 'UNAUTHENTICATED',
  'resource-exhausted': 'RESOURCE_EXHAUSTED',
  'failed-precondition': 'FAILED_PRECONDITION',
  aborted: 'ABORTED',
  'out-of-range': 'OUT_OF_RANGE',
  unimplemented: 'UNIMPLEMENTED',
  internal: 'INTERNAL',
  unavailable: 'UNAVAILABLE',
  'data-loss': 'DATA_LOSS',
};

/**
 * An explicit error that can be thrown from a handler to send an error to the
 * client that called the function.
 */
export class HttpsError extends FuncError {
  /**
   * Extra data to be converted to JSON and included in the error response.
   */
  public readonly details?: object;

  /**
   * @internal
   * A string representation of the Google error code for this error for HTTP.
   */
  get status() {
    return errorCodeMap[this.code];
  }

  /**
   * @internal
   * Returns the canonical http status code for the given error.
   */
  get httpStatus(): number {
    switch (this.code) {
      case 'ok':
        return 200;
      case 'cancelled':
        return 499;
      case 'unknown':
        return 500;
      case 'invalid-argument':
        return 400;
      case 'deadline-exceeded':
        return 504;
      case 'not-found':
        return 404;
      case 'already-exists':
        return 409;
      case 'permission-denied':
        return 403;
      case 'unauthenticated':
        return 401;
      case 'resource-exhausted':
        return 429;
      case 'failed-precondition':
        return 400;
      case 'aborted':
        return 409;
      case 'out-of-range':
        return 400;
      case 'unimplemented':
        return 501;
      case 'internal':
        return 500;
      case 'unavailable':
        return 503;
      case 'data-loss':
        return 500;
      // This should never happen as long as the type system is doing its job.
      default:
        throw new Error('Invalid error code: ' + this.code);
    }
  }

  public toJSON() {
    const json: ErrorDetails = {
      status: this.status,
      message: this.message,
    };
    if (this.details) {
      json.details = this.details;
    }
    return json;
  }
}

export const createCustomError = ({ status, message, details }: ErrorParams) => {
  return new HttpsError(status, message, details);
};

/**
 * Generates a response with data from the error
 * @param error
 * @param res
 */
export const respondWithError = (error: HttpsError, res: Response) => {
  res.status(error.httpStatus).json(error.toJSON());
};

export const createAndRespondWithError = (params: ErrorParams, res: Response) => {
  respondWithError(createCustomError(params), res);
};
