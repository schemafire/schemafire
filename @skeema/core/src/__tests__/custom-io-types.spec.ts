import * as t from 'io-ts';
import { isEqual } from 'lodash';
import { Cast } from '../helpers';
import { ThrowReporter } from '../io-reporters';
import { numbers, regexMap, strings, utils, validateUnionType } from '../io-types';

describe('numbers', () => {
  const value = 20;
  const larger = 21;
  const smaller = 19;
  test('#gte', () => {
    expect(() => ThrowReporter.report(numbers.gte(value).decode(smaller))).toThrow();
    expect(() => ThrowReporter.report(numbers.gte(value).decode(larger))).not.toThrow();
    expect(() => ThrowReporter.report(numbers.gte(value).decode(value))).not.toThrow();
  });

  test('#gt', () => {
    expect(() => ThrowReporter.report(numbers.gt(value).decode(smaller))).toThrow();
    expect(() => ThrowReporter.report(numbers.gt(value).decode(larger))).not.toThrow();
    expect(() => ThrowReporter.report(numbers.gt(value).decode(value))).toThrow();
  });

  test('#lte', () => {
    expect(() => ThrowReporter.report(numbers.lte(value).decode(smaller))).not.toThrow();
    expect(() => ThrowReporter.report(numbers.lte(value).decode(larger))).toThrow();
    expect(() => ThrowReporter.report(numbers.lte(value).decode(value))).not.toThrow();
  });

  test('#lt', () => {
    expect(() => ThrowReporter.report(numbers.lt(value).decode(smaller))).not.toThrow();
    expect(() => ThrowReporter.report(numbers.lt(value).decode(larger))).toThrow();
    expect(() => ThrowReporter.report(numbers.lt(value).decode(value))).toThrow();
  });
});

describe('strings', () => {
  test('#max', () => {
    expect(() => ThrowReporter.report(strings.max(9).decode('1234567890'))).toThrow();
    expect(() => ThrowReporter.report(strings.max(9).decode('123456789'))).not.toThrow();
  });

  test('#min', () => {
    expect(() => ThrowReporter.report(strings.min(9).decode('12345678'))).toThrow();
    expect(() => ThrowReporter.report(strings.min(9).decode('123456789'))).not.toThrow();
  });

  test('#length', () => {
    expect(() => ThrowReporter.report(strings.length(4).decode('12345'))).toThrow();
    expect(() => ThrowReporter.report(strings.length(4).decode('1234'))).not.toThrow();
  });

  test('#regex', () => {
    const ok = ['a1_', 'abc123_'];
    const failing = ['!', '-', ' ', 'abc 123'];
    ok.forEach(pass => {
      expect(() =>
        ThrowReporter.report(strings.regex(regexMap.letterNumberUnderscore).decode(pass)),
      ).not.toThrow();
    });
    failing.forEach(fail => {
      expect(() =>
        ThrowReporter.report(strings.regex(regexMap.letterNumberUnderscore).decode(fail)),
      ).toThrow();
    });
  });

  test('#reverseRegex', () => {
    const ok = ['a1_', 'abc123_'];
    const failing = ['!', '-', ' '];
    ok.forEach(pass => {
      expect(() =>
        ThrowReporter.report(strings.reverseRegex(regexMap.letterNumberUnderscore).decode(pass)),
      ).toThrow();
    });
    failing.forEach(fail => {
      expect(() =>
        ThrowReporter.report(strings.reverseRegex(regexMap.letterNumberUnderscore).decode(fail)),
      ).not.toThrow();
    });
  });

  test('#username', () => {
    expect(() =>
      ThrowReporter.report(strings.username().decode('should fail')),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value \\"should fail\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/3: letters.numbers.underscores"`,
    );
    expect(() =>
      ThrowReporter.report(strings.username().decode('123')),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value \\"123\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/2: start.with.letter"`,
    );
    expect(() => ThrowReporter.report(strings.username().decode('_')))
      .toThrowErrorMatchingInlineSnapshot(`
"Invalid value \\"_\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/0: min(3)
Invalid value \\"_\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/2: start.with.letter"
`);
    expect(() =>
      ThrowReporter.report(strings.username().decode('_abc')),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value \\"_abc\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/2: start.with.letter"`,
    );
    expect(() =>
      ThrowReporter.report(strings.username().decode('abcdef1234567890')),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value \\"abcdef1234567890\\" supplied to : (min(3) & max(15) & start.with.letter & letters.numbers.underscores)/1: max(15)"`,
    );
    expect(() => ThrowReporter.report(strings.username().decode('abcd'))).not.toThrow();
  });
});

test('#validateUnionType', () => {
  expect(validateUnionType(strings.username(), 'valid')).toEqual([]);
  const errors = validateUnionType(strings.username(), '_invalid');
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatchInlineSnapshot(
    `"Expecting start.with.letter but instead got: \\"_invalid\\"."`,
  );
});

describe('utils', () => {
  test('#nullable', () => {
    expect(() => ThrowReporter.report(utils.nullable(t.string).decode(null))).not.toThrow();
    expect(() => ThrowReporter.report(utils.nullable(t.string).decode(undefined)))
      .toThrowErrorMatchingInlineSnapshot(`
"Invalid value undefined supplied to : (string | null)/0: string
Invalid value undefined supplied to : (string | null)/1: null"
`);
  });
  test('#optional', () => {
    expect(() => ThrowReporter.report(utils.optional(t.string).decode(undefined))).not.toThrow();
    expect(() => ThrowReporter.report(utils.optional(t.string).decode(null)))
      .toThrowErrorMatchingInlineSnapshot(`
"Invalid value null supplied to : (string | undefined)/0: string
Invalid value null supplied to : (string | undefined)/1: undefined"
`);
  });

  test('#dictionary', () => {
    expect(() => ThrowReporter.report(utils.dictionary.decode({}))).not.toThrow();
    expect(() =>
      ThrowReporter.report(utils.dictionary.decode({ a: undefined, can: 'be', anything: NaN })),
    ).not.toThrow();
    expect(() =>
      ThrowReporter.report(utils.dictionary.decode(null)),
    ).toThrowErrorMatchingInlineSnapshot(`"Invalid value null supplied to : Dictionary"`);
  });

  test('#genericDictionary', () => {
    const guard = (u: unknown) =>
      typeof u === 'object' && isEqual(Object.keys(Cast(u)), ['always']) && Cast(u).always === true;
    const codec = utils.genericDictionary<{ always: true }, 'AlwaysTrue'>('AlwaysTrue', guard);
    expect(() =>
      ThrowReporter.report(codec.decode({ not: true })),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value {\\"not\\":true} supplied to : AlwaysTrue"`,
    );
    expect(() =>
      ThrowReporter.report(codec.decode({ always: false })),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid value {\\"always\\":false} supplied to : AlwaysTrue"`,
    );
    expect(() => ThrowReporter.report(codec.decode({ always: true }))).not.toThrow();
  });
});
