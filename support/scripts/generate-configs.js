const { join, relative } = require('path');
const {
  getAllDependencies,
  getDependencyPackageMap,
  formatFiles,
  baseDir,
  getRelativePathFromJson,
  mangleScopedPackageName,
} = require('./helpers');
const writeJSON = require('write-json-file');

const AUTO_GENERATED_FLAG = {
  __AUTO_GENERATED__: 'To update run: `yarn generate:json`',
};

const EXCLUDE_PROD = [
  'lib',
  '**/*.test.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/__mocks__/**',
  '**/__tests__/**',
  '**/__stories__/**',
];

const configs = {
  tsconfig: 'support/tsconfig.paths.json',
};

const filesToPrettify = [];

const generateTSConfig = async () => {
  const packages = await getAllDependencies();
  const tsPaths = packages
    .filter(pkg => pkg.types)
    .reduce((acc, json) => {
      const packagePath = getRelativePathFromJson(json);
      return {
        ...acc,
        [json.name]: [`${packagePath}/src/index.ts`],
        [`${json.name}/lib/*`]: [`${packagePath}/src/*`],
      };
    }, {});
  const path = baseDir(configs.tsconfig);

  await writeJSON(path, {
    ...AUTO_GENERATED_FLAG,
    compilerOptions: {
      baseUrl: '../',
      paths: { ...tsPaths },
    },
  });
  console.log('written to path', tsPaths, path);
  filesToPrettify.push(path);
};

const API_EXTRACTOR_FILENAME = 'api-extractor.json';
const API_EXTRACTOR_CONFIG = {
  $schema:
    'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
  extends: join('../../support', API_EXTRACTOR_FILENAME),
  mainEntryPointFilePath: '<projectFolder>/lib/index.d.ts',
};

const TSCONFIG_PROD_FILENAME = 'tsconfig.prod.json';
const TSCONFIG_PROD = {
  ...AUTO_GENERATED_FLAG,
  extends: './tsconfig.json',
  compilerOptions: {
    baseUrl: 'src',
    paths: {},
  },
  exclude: EXCLUDE_PROD,
};

const generateApiExtractorConfigs = async () => {
  const packages = await getAllDependencies();

  const paths = packages
    .filter(pkg => !pkg.private && pkg.types && !(pkg.meta && pkg.meta.skipApi))
    .map(json => ({
      path: getRelativePathFromJson(json),
      name: mangleScopedPackageName(json.name),
    }));

  const fn = async ({ path, name }) => {
    const apiExtractorConfig = {
      ...API_EXTRACTOR_CONFIG,
      apiReport: {
        enabled: true,
        reportFolder: '../../support/api/',
        reportFileName: `${name}.api.md`,
      },
    };
    const apiExtractorPath = baseDir(path, API_EXTRACTOR_FILENAME);

    await writeJSON(apiExtractorPath, apiExtractorConfig);

    filesToPrettify.push(apiExtractorPath);
  };

  await Promise.all(paths.map(fn));
};

const MAIN_TSCONFIG_PROD_PATH = baseDir(TSCONFIG_PROD_FILENAME);

const generateMainTsConfig = async () => {
  const packages = await getAllDependencies();

  const config = packages
    .filter(pkg => pkg.types && !pkg.private)
    .map(json => ({
      path: join(getRelativePathFromJson(json), TSCONFIG_PROD_FILENAME),
    }))
    .reduce((acc, path) => ({ ...acc, references: [...acc.references, path] }), {
      ...AUTO_GENERATED_FLAG,
      files: [],
      references: [],
      exclude: EXCLUDE_PROD,
    });

  filesToPrettify.push(MAIN_TSCONFIG_PROD_PATH);
  await writeJSON(MAIN_TSCONFIG_PROD_PATH, config);
};

const generatePackageTsConfigs = async () => {
  const [packages, dependencies] = await Promise.all([
    getAllDependencies(),
    getDependencyPackageMap(),
  ]);

  const fn = async json => {
    const references = Object.keys(json.dependencies || {})
      .filter(dependency => !!dependencies[dependency])
      .map(dependency => {
        const path = join(
          relative(json.location, dependencies[dependency]),
          TSCONFIG_PROD_FILENAME,
        );
        return {
          path,
        };
      });

    const tsConfigProdPath = join(json.location, TSCONFIG_PROD_FILENAME);
    const options = json.types
      ? {
          composite: true,
          emitDeclarationOnly: true,
          declaration: true,
          declarationMap: true,
          rootDir: 'src',
        }
      : { noEmit: true };
    await writeJSON(tsConfigProdPath, {
      ...TSCONFIG_PROD,
      compilerOptions: {
        ...TSCONFIG_PROD.compilerOptions,
        ...options,
      },
      references,
    });

    filesToPrettify.push(tsConfigProdPath);
  };

  await Promise.all(packages.filter(json => json.types).map(fn));
};

const run = async () => {
  await Promise.all([
    generateTSConfig(),
    generateApiExtractorConfigs(),
    generateMainTsConfig(),
    generatePackageTsConfigs(),
  ]);

  await formatFiles(filesToPrettify.join(' '), true);
};

run();
