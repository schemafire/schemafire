import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';
import { isEmail } from 'validator';
import { DictionaryType, GenericDictionaryType } from './class-types';

/**
 * Ensures that a number is greater than or equal to the passed in value
 *
 * @param minimum
 */
const gte = (minimum: number) => t.refinement(t.number, val => val >= minimum, 'MinNumber');

/**
 * Ensures that a number is greater than the passed in value
 *
 * @param minimum
 */
const gt = (minimum: number) => t.refinement(t.number, val => val > minimum, 'MinNumber');

/**
 * Ensures that a number is less than or equal to the passed in value
 *
 * @param maximum
 */
const lte = (maximum: number) => t.refinement(t.number, val => val <= maximum, 'MaxNumber');

/**
 * Ensures that a number is less than the passed in value
 *
 * @param maximum
 */
const lt = (maximum: number) => t.refinement(t.number, val => val < maximum, 'MaxNumber');

/**
 * Number validation
 */
export const numbers = {
  gte,
  lte,
  lt,
  gt,
};

/**
 * Allows for regex validation
 */
interface RegexValidation {
  regex: RegExp;
  code: string;
}

export const regexMap = {
  startWithLetter: { regex: /^[a-zA-Z].+/, code: 'start.with.letter' },
  letterNumberUnderscore: { regex: /^[A-Z0-9_]+$/i, code: 'letters.numbers.underscores' },
};

const uppercase = t.refinement(t.string, val => val.toUpperCase() === val, 'UpperCase');
const lowercase = t.refinement(t.string, val => val.toLowerCase() === val, 'LowerCase');
const min = (minimum: number) =>
  t.refinement(t.string, val => val.length >= minimum, `min(${minimum})`);
const max = (maximum: number) =>
  t.refinement(t.string, val => val.length <= maximum, `max(${maximum})`);
const length = (len: number) => t.refinement(t.string, val => val.length === len, `len(${len})`);

const regex = (mapper: RegexValidation) =>
  t.refinement(t.string, val => mapper.regex.test(val), mapper.code);
const reverseRegex = (obj: RegexValidation) =>
  t.refinement(t.string, val => !obj.regex.test(val), obj.code);

interface UsernameParams {
  minimum?: number;
  maximum?: number;
}

/**
 * Allows for custom username validation creation.
 * @param params
 */
const username = ({ minimum = 3, maximum = 15 }: UsernameParams = {}) =>
  t.intersection([
    min(minimum),
    max(maximum),
    regex(regexMap.startWithLetter),
    regex(regexMap.letterNumberUnderscore),
  ]);

const email = t.refinement(t.string, val => isEmail(val), 'Email');

export const strings = {
  min,
  max,
  username,
  length,
  regex,
  reverseRegex,
  email,
  uppercase,
  lowercase,
};

const nullable = <T extends t.Mixed>(type: T) => t.union([type, t.null]);
const optional = <T extends t.Mixed>(type: T) => t.union([type, t.undefined]);
const genericDictionary = <T, U extends string = string>(
  name: U,
  validation?: (u: unknown) => boolean,
) => new GenericDictionaryType<T, U>(name, validation);
const dictionary: DictionaryType = genericDictionary<{ [key: string]: any }, 'Dictionary'>(
  'Dictionary',
);

export const utils = {
  nullable,
  optional,
  dictionary,
  genericDictionary,
};

export const validateUnionType = <RTS extends t.Any[], A = any, O = A, I = t.mixed>(
  types: t.IntersectionType<RTS, A, O, I> | t.UnionType<RTS, A, O, I>,
  value: t.mixed,
) => types.types.map(type => reporter(type.decode(value))[0]).filter(report => report);
