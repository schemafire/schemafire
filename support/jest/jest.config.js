const { supportDir, isLiveTest, baseDir } = require('../utils');

const testRegex = isLiveTest()
  ? '/__tests__/.*\\.(spec|test)\\.tsx?$'
  : '/__tests__/.*\\.spec\\.tsx?$';

module.exports = {
  globals: {
    __DEV__: true,
    __TEST__: true,
    __DB_PREFIX__: global.__DB_PREFIX__,
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dtslint/',
    '\\.d.ts',
    '/__mocks__/',
    '/__tests__/',
    '/__fixtures__/',
    'jest\\.*\\.ts',
    'live-test-helpers\\.ts',
    'unit-test-helpers\\.ts',
  ],
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules'],
  testPathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/node_modules/'],
  testRegex,
  setupFilesAfterEnv: [supportDir('jest/jest.framework.ts')],
  cacheDirectory: baseDir('.jest/cache'),
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': supportDir('jest/jest.transformer.js'),
  },
  moduleNameMapper: {
    '@skeema/core$': baseDir('@skeema', 'core', 'src'),
    '@unit-test-helpers$': baseDir('@skeema', 'core', 'src', '__tests__', 'unit-test-helpers.ts'),
    '@live-test-helpers$': baseDir(
      '@skeema',
      'firestore',
      'src',
      '__tests__',
      'live-test-helpers.ts',
    ),
  },
};
