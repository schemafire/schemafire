declare module 'validator/lib/isEmail' {
  import validator from 'validator';

  const isEmail: typeof validator.isEmail;
  export = isEmail;
}
