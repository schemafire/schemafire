import { PathReporter } from 'io-ts/lib/PathReporter';
import { Reporter } from 'io-ts/lib/Reporter';
export const ThrowReporter: Reporter<void> = {
  report: validation => {
    if (validation.isLeft()) {
      throw PathReporter.report(validation).join('\n');
    }
  },
};
