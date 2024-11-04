# Publishing to NPM

## What is NPM?

NPM is a package manager for JavaScript and TypeScript packages. It is used to publish packages to the npm registry. It is the default package manager for Node.js projects.

See [NPM's About page](https://www.npmjs.com/about) for more information.

## Why do we need to publish to NPM?

In order for end-users to use your adapter with the UCW, you need to publish it to NPM. End-users can then install your adapter from NPM, and then set it up with their own instance of the UCW.

## How to publish to NPM?

We've tried to make this process as simple as possible. 

Publishing your adapter package to NPM is a mostly automated process that happens as part of the GitHub Actions workflows that run during the PR process. The workflow for publishing to NPM happens when a PR is merged to `main`.

In order to publish your adapter package to NPM as part of the workflow, you'll need to do the following.

### Setup NPMJS.com account and generate Access Token

1. [Create an NPM account](https://docs.npmjs.com/creating-a-new-npm-user-account). If you already have one, you can skip this step. If you want to create an organization, you can do this by following the [instructions here](https://docs.npmjs.com/creating-an-organization).
1. Generate an Access Token for your account. You can do this by following the [instructions here](https://docs.npmjs.com/about-access-tokens). You can decide which type of token you want to use. We recommend using a legacy token of the "Automation" type. We have not tested the new Granular Access Token, but it should work as well.
1. Add this new secret to your project's GitHub repository secrets. Name this new secret `NPM_TOKEN`, and enter the access token in the "Secret" field. 

### Setup Version Check workflow

1. Create a new workflow file in your project folder `./.github/workflows/` and name it `npm-version-check.yml`.
1. Copy the contents from the MX Adapter project's `npm-version-check.yml` file, which can be found [here](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/.github/workflows/npm-version-check.yml).
1. Open the file that you just created. Update the `PACKAGE_DIR` variable with the path of the directory where your adapter package lives. You will also need to update the `NPM_PACKAGE_NAME` variable to match the name of your adapter package `name` (from `package.json`). This will also be the name of your package as it will appear on NPMJS.com after it is published.

### Setup Publish workflow

1. Create a new workflow file in your project folder `./.github/workflows/` and name it `npm-publish.yml`.
1. Copy the contents from the MX Adapter project's `npm-publish.yml` file, which can be found [here](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/.github/workflows/npm-publish.yml).
1. Open the new file that you just created. Update the `PACKAGE_DIR` variable with the path of the directory where your adapter package lives.

## Versioning

We recommend using semantic versioning. For more information, see the [semantic versioning](https://semver.org/) specification.

The version that will be published as part of the CI pipeline is taken from the `package.json` file for your adapter package. If the version in the `package.json` file already exists on NPMJS.com, then your package will not be published, so be sure to update the version your adapter's `package.json` file.

The `npm-version-check.yml` workflow runs for each commit to a PR. It will check if the version in the `package.json` file already exists on NPMJS.com. If it does, the workflow will fail.

## Scoped packages

You may want to scope your npm package. For more information, see [npm scopes](https://docs.npmjs.com/cli/using-npm/scope).
