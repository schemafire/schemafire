import { baseDefinition, createDefaultBase } from '../';
import { ThrowReporter } from '../io-reporters';

test('#baseDefinition', () => {
  expect(() => ThrowReporter.report(baseDefinition.decode(createDefaultBase()))).not.toThrowError();
  expect(() => ThrowReporter.report(baseDefinition.decode({}))).toThrowErrorMatchingInlineSnapshot(
    `undefined`,
  );
});
