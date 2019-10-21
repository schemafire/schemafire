import { PathReporter } from 'io-ts/lib/PathReporter';
import { Reporter } from 'io-ts/lib/Reporter';
import { isLeft } from 'fp-ts/lib/Either';

/**
 * Throws an error when validation fails
 */
export const ThrowReporter: Reporter<void> = {
  report: validation => {
    if (isLeft(validation)) {
      throw Error(PathReporter.report(validation).join('\n'));
    }
  },
};
