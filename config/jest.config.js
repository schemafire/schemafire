const { configDir, isLiveTest, baseDir } = require('./utils');

const testRegex = isLiveTest()
  ? '/__tests__/.*\\.(spec|test)\\.tsx?$'
  : '/__tests__/.*\\.spec\\.tsx?$';

module.exports = {
  globals: {
    __DEV__: true,
    __TEST__: true,
    __DB_PREFIX__: global.__DB_PREFIX__,
  },
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules'],
  testPathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/node_modules/'],
  testRegex,
  setupFilesAfterEnv: [configDir('jest.framework.ts')],
  cacheDirectory: baseDir('.jest/cache'),
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': configDir('jest.transformer.js'),
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
