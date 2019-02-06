import { Context, Errors, getFunctionName, ValidationError } from 'io-ts';

export class SchemaFireValidationError extends Error {
  /**
   * A utility static method for quickly creating errors without `new`
   */
  public static create(errors?: Errors) {
    return new SchemaFireValidationError(errors);
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
      this.messages = messages;
      this.errors = createErrorMap(errors);
      this.keys = Object.keys(this.errors);
    }

    // This is a workaround for a bug in TypeScript when extending Error:
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, SchemaFireValidationError.prototype);
  }
}

function stringify(v: any): string {
  return typeof v === 'function' ? getFunctionName(v) : JSON.stringify(v);
}

function getContextPath(context: Context, withType = true): string {
  return context
    .filter(({ key }) => Boolean(key))
    .map(({ key, type }) => (withType ? `${key}: \`${type.name}\`` : key))
    .join('.');
}

function mapMessage(e: ValidationError): string {
  return e.message !== undefined
    ? e.message
    : `Invalid value ${stringify(e.value)} supplied to ${getContextPath(e.context)}`;
}

function createMessage(errors: Errors) {
  return errors.map(mapMessage);
}

function createErrorMap(errors: Errors) {
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
