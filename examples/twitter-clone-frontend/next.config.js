/* eslint-disable import/no-extraneous-dependencies */

require('dotenv').config();

const path = require('path');
const withTypescript = require('@zeit/next-typescript');
const Dotenv = require('dotenv-webpack');
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer');
const { compose } = require('ramda');
const nextOffline = require('next-offline');

const { BUNDLE_ANALYZE } = process.env;

module.exports = compose(
  withTypescript,
  withBundleAnalyzer,
  nextOffline,
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
    return config;
  },
});
