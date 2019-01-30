import { PathReporter } from 'io-ts/lib/PathReporter';
import { Reporter } from 'io-ts/lib/Reporter';

/**
 * Throws an error when validation fails
 */
export const ThrowReporter: Reporter<void> = {
  report: validation => {
    if (validation.isLeft()) {
      throw Error(PathReporter.report(validation).join('\n'));
    }
  },
};
