import { ThrowReporter } from '../io-reporters';
import { numbers, regexMap, strings, validateUnionType } from '../io-types';

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
    expect(() => ThrowReporter.report(strings.username.decode('should fail'))).toThrow();
    expect(() => ThrowReporter.report(strings.username.decode('123'))).toThrow();
    expect(() => ThrowReporter.report(strings.username.decode('_'))).toThrow();
    expect(() => ThrowReporter.report(strings.username.decode('_abc'))).toThrow();
    expect(() => ThrowReporter.report(strings.username.decode('abcdef1234567890'))).toThrow();
    expect(() => ThrowReporter.report(strings.username.decode('abcd'))).not.toThrow();
  });
});

test('#validateUnionType', () => {
  expect(validateUnionType(strings.username, 'valid')).toEqual([]);
  const errors = validateUnionType(strings.username, '_invalid');
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('start.with.letter');
});
