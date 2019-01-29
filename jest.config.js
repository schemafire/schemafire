const { configDir, isLiveTest, createDBPrefix } = require('./config/utils');

const coverage = {
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
};

if (!process.env.FIREBASE_CONFIG) {
  process.env.FIREBASE_CONFIG = '{}';
}

global.__DB_PREFIX__ = createDBPrefix();

module.exports = {
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: isLiveTest(),
  coveragePathIgnorePatterns: [
    '**/dtslint/*.ts',
    '**/*.d.ts',
    'config/**',
    '**/__mocks__/**',
    '**/tmp/**',
    '**/__tests__/**',
    'jest.*.ts',
  ],
  projects: ['<rootDir>/@skeema/*/'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  ...(isLiveTest() ? coverage : {}),
  globalTeardown: configDir('jest.teardown.ts'),
  globalSetup: configDir('jest.setup.ts'),
};
