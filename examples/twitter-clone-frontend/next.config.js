require('dotenv').config();

const path = require('path');
const Dotenv = require('dotenv-webpack');
const { compose } = require('lodash/fp');

const withTypescript = require('@zeit/next-typescript');
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer');
const withCSS = require('@zeit/next-css');
const withOffline = require('next-offline');

const { BUNDLE_ANALYZE } = process.env;

module.exports = compose(
  withTypescript,
  withBundleAnalyzer,
  withOffline,
  withCSS,
)({
  dontAutoRegisterSw: true,
  // workboxOpts: {
  //   importScripts: [path.join(__dirname, 'dist', 'workers', 'sw.js')],
  // },
  analyzeServer: ['server', 'both'].includes(BUNDLE_ANALYZE),
  analyzeBrowser: ['browser', 'both'].includes(BUNDLE_ANALYZE),
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'static',
      reportFilename: '../../bundles/server.html',
    },
    browser: {
      analyzerMode: 'server',
      analyzerPort: 9888,
      reportFilename: '../bundles/client.html',
    },
  },
  distDir: process.env.NEXT_BUILD_DIR || 'dist/next',
  webpack(config) {
    config.resolve.extensions.unshift('.mjs'); // https://github.com/react-icons/react-icons/issues/154#issuecomment-412774515

    config.plugins = config.plugins || [];

    // Read the .env file
    config.plugins.push(
      new Dotenv({
        path: path.join(__dirname, '.env'),
        systemvars: true,
      }),
    );

    config.module.rules.push({
      test: /\.(png|svg|eot|otf|ttf|woff|woff2)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 8192,
          publicPath: '/_next/static/',
          outputPath: 'static/',
          name: '[name].[ext]',
        },
      },
    });

    return config;
  },
});
