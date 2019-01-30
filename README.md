# Skeema

[![Build Status](https://travis-ci.org/ifiokjr/skeema.svg?branch=master)](https://travis-ci.org/ifiokjr/skeema) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/) [![Maintainability](https://api.codeclimate.com/v1/badges/bde2fc9e3dec543a875a/maintainability)](https://codeclimate.com/github/ifiokjr/skeema/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/bde2fc9e3dec543a875a/test_coverage)](https://codeclimate.com/github/ifiokjr/skeema/test_coverage)

Manage your firebase data with pre-defined schema and built in type checking.

## Getting started

Navigate to the [`@skeema/firestore`](./@skeema/firestore/README.md) to learn how to use this library in your project.

## Contributing

The following are some pointers to getting started with contributing to the codebase.

### Initial Setup

Run the following commands from the command line to get your local environment set up:

```bash
git clone https://github.com/ifiokjr/skeema
cd skeema  # go to the firebase-admin-node directory
yarn # Yarn is preferred for its `workspace` support
```

In order to run the tests, you also need to
[download the `gcloud` CLI](https://cloud.google.com/sdk/downloads), run the following command, and
follow the prompts:

```bash
gcloud beta auth application-default login
yarn global add firebase-tools # npm install --global firebase-tools
```

### Running Tests

There are two test suites: unit and live. The unit test suite is intended to be run during
development, and the live test suite is intended to be run on the CI and before packaging up release
candidates.

To run the unit test suite:

```bash
yarn checks  # Run lints, type-checks and tests the codebase
```

If you wish to skip the linter and type-checking, and only run the unit tests:

```bash
yarn test
```

The live test suite requires a service account JSON key file for a Firebase
project. Create a new project in the [Firebase console](https://console.firebase.google.com) if
you do not already have one. Use a separate, dedicated project for integration tests since the
test suite makes a large number of writes to the Firebase realtime database. Download the service
account key file from the "Settings > Service Accounts" page of the project, and copy it to
`config/test/key.json`.

After this run

```bash
yarn setup
```

Some Auth integration tests require that you enable the IAM API for your Firebase/GCP project,
and grant your service account ID the "Service Account Token Creator" role. These must be done
via the Google Cloud Console. Refer to the
[troubleshooting instructions](https://firebase.google.com/docs/auth/admin/create-custom-tokens#troubleshooting)
in the official documentation for more details on how to achieve this.

Finally, to run the integration test suite:

```bash
$ yarn test:live   # Build and run integration test suite
```
