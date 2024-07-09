# Monorepo

This repo uses Turborepo as a monorepo management tool

See [Turborepo documentation](https://turbo.build/repo) for more details.

For the most part, the way you interact with NPM and a monorepo is the same as with a normal repo. The following 
commands remain the same, but will execute the corresponding task for all monorepo apps/packages (ie: workspaces) that have a task 
with the same name.

Read more about workspaces [here](https://turbo.build/repo/docs/handbook/workspaces)

## Install

To install all apps and packages, run the following command from the root of the project:

```
npm ci
```

## Build

To build all apps and packages, run the following command from the root of the project:

```
npm run build
```

## Develop

To run in development mode for all apps and packages, run the following command from the root of the project:

```
npm run dev
```

## Test

To run tests for all apps and packages, run the following command from the root of the project:

```
npm run test
```

## Lint

To run linters for all apps and packages, run the following command from the root of the project:

```
npm run lint
```

## Isolate to a single app

To only run the task for one app/package, run the following command from the root of the project:

```
npm run dev --workspace <workspace>
```

_The same pattern (`--workspace <workspace>`) can be used for `build`, `test`, and `lint`._ 

## Add/Update dependencies

Dependencies are still managed in each app's package.json file. Within the context of a monorepo, you do need to make sure 
to target the appropriate workspace when you add/remove/update dependencies.

Use the following commands to add/remove/update dependencies within each app/package's context:

### Install a package in a workspace

    npm install <package> --workspace <workspace>

Example:

    npm install react --workspace apps/ui

### Remove a package from a workspace

    npm uninstall <package> --workspace <workspace>

Example:

    npm uninstall react --workspace apps/ui

### Upgrade a package in a workspace

    npm update <package> --workspace <workspace>

Example:

    npm update react --workspace apps/ui
