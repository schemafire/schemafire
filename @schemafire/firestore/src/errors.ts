import { Context, Errors, getFunctionName, ValidationError as IOValidationError } from 'io-ts';

export class SchemaFireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }

    // This is a workaround for a bug in TypeScript when extending Error:
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, SchemaFireError.prototype);
  }
}

export class ValidationError extends SchemaFireError {
  /**
   * A utility static method for quickly creating errors without `new`
   */
  public static create(errors?: Errors) {
    return new ValidationError(errors);
  }

  /**
   * An array of the error messages
   */
  public readonly messages: string[];

  /**
   * The keys with their provided error messages
   */
  public readonly errors: Record<string, string>;

  /**
   * All the fields affected by this error
   */
  public readonly keys: string[];

  constructor(errors?: Errors) {
    if (!errors) {
      super(
        "Your validation was called with invalid data was that isn't an object. Check that you are passing through either an object or a valid model instance",
      );
      this.errors = {};
      this.keys = [];
      this.messages = [];
    } else {
      const messages = createMessage(errors);
      super(messages.join('\n'));
      this.name = 'ValidationError';
      this.messages = messages;
      this.errors = createErrorMap(errors);
      this.keys = Object.keys(this.errors);
    }

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * An error that holds a group of TransactionErrors together.
 */
export class RunTransactionErrors extends SchemaFireError {
  /**
   * A utility static method for quickly creating errors without `new`
   */
  public static create(errors: Error[]) {
    return new RunTransactionErrors(errors);
  }

  /**
   * An array of the error messages
   */
  public readonly messages: string[];

  /**
   * The keys with their provided error messages
   */
  public readonly errors: Error[];

  public readonly name = 'RunTransactionErrors';

  constructor(errors: Error[]) {
    super(getStringMessages(errors).join('\n'));
    this.messages = getStringMessages(errors);
    this.errors = errors;
    Object.setPrototypeOf(this, RunTransactionErrors.prototype);
  }
}

export enum TransactionType {
  Query = 'Query',
  Get = 'Get',
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

/** */
export class TransactionError extends SchemaFireError {
  public static readonly Type = TransactionType;
  public readonly type: TransactionType;
  public readonly name = 'TransactionError';
  public readonly original?: Error;
  public readonly newStack?: string;

  constructor(type: TransactionType, message: string, error?: Error) {
    super(`${type}: ${message}${error ? '\n' + error.message : ''}`);
    this.type = type;

    if (error && this.stack) {
      this.original = error;
      this.newStack = this.stack;
      const messageLine = (this.message.match(/\n/g) || []).length + 1;
      this.stack =
        this.stack
          .split('\n')
          .slice(0, messageLine + 1)
          .join('\n') +
        '\n' +
        error.stack;
    }
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

export const isTransactionError = (uu: unknown): uu is TransactionError => {
  return uu instanceof TransactionError;
};

export const isValidationError = (uu: unknown): uu is ValidationError => {
  return uu instanceof ValidationError;
};

const getStringMessages = (errors: Error[]) =>
  errors.map((error: Error) => {
    if (isTransactionError(error)) {
      return error.message;
    }
    return `GeneralError: ${error.message}`;
  });

function stringify(v: any): string {
  return typeof v === 'function' ? getFunctionName(v) : JSON.stringify(v);
}

function getContextPath(context: Context, withType = true): string {
  return context
    .filter(({ key }) => Boolean(key))
    .map(({ key, type }) => (withType ? `${key}: \`${type.name}\`` : key))
    .join('.');
}

function mapMessage(e: IOValidationError): string {
  return e.message !== undefined
    ? e.message
    : `Invalid value ${stringify(e.value)} supplied to ${getContextPath(e.context)}`;
}

export function createMessage(errors: Errors) {
  return errors.map(mapMessage);
}

export function createErrorMap(errors: Errors) {
  return errors.reduce((prev, { message, context, value }) => {
    const path = getContextPath(context, false);
    return path
      ? {
          ...prev,
          [path.split('.')[0]]: message || `Invalid value ${stringify(value)}`,
        }
      : prev;
  }, {});
}
