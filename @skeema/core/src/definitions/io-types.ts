import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';
import { isEmail } from 'validator';
import { DictionaryType, GenericDictionaryType, TimestampType } from './class-types';

export const timestamp: TimestampType = new TimestampType();

const gte = (minimum: number) => t.refinement(t.number, val => val >= minimum, 'MinNumber');
const gt = (minimum: number) => t.refinement(t.number, val => val > minimum, 'MinNumber');
const lte = (maximum: number) => t.refinement(t.number, val => val <= maximum, 'MaxNumber');
const lt = (maximum: number) => t.refinement(t.number, val => val < maximum, 'MaxNumber');

export const numbers = {
  gte,
  lte,
  lt,
  gt,
};

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

const username = t.intersection([
  min(3),
  max(15),
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
const Dictionary: DictionaryType = new DictionaryType();
const genericDictionary = <T, U extends string = string>(name: U) =>
  new GenericDictionaryType<T, U>(name);

export const utils = {
  nullable,
  optional,
  Dictionary,
  genericDictionary,
};

export const validateUnionType = <RTS extends t.Any[], A = any, O = A, I = t.mixed>(
  types: t.IntersectionType<RTS, A, O, I> | t.UnionType<RTS, A, O, I>,
  value: t.mixed,
) => types.types.map(type => reporter(type.decode(value))[0]).filter(report => report);
