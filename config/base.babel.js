module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '8',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    'lodash',
    'date-fns',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-arrow-functions',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
  env: {
    test: {
      ignore: [],
    },
    production: {
      ignore: [
        '**/__tests__',
        '**/__fixtures__',
        '**/__mocks__',
        '**/__stories__',
        '*.{test,spec,stories}.{ts,tsx}',
        '**/*.d.ts',
        '*.d.ts',
      ],
    },
    development: {
      ignore: [
        '**/__tests__',
        '**/__fixtures__',
        '**/__mocks__',
        '**/__stories__',
        '*.{test,spec,stories}.{ts,tsx}',
        '**/*.d.ts',
        '*.d.ts',
      ],
    },
  },
};
