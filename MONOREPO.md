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


## Aggregator adapter package and Turborepo

See [the ADAPTERS readme](ADAPTERS.md) for more details on what aggregator adapter packages are.

There are two ways to create a shared package within a Turborepo monorepo. You can create Just-in-Time (JIT) packages or compiled packages. Please see [Turborepo's Documentation](https://turbo.build/repo/docs/core-concepts/internal-packages#compiled-packages) for more detailed information.

Adapter Packages are considered compiled packages, and even though end-users will install your adapter package using NPM, the preferred way what we've chosen to create and test an adapter package is to use it as a compiled package. 

Below you'll find some tips on how to successfully run the UCW with a compiled package.

We will use [the MX Adapter](https://github.com/Universal-Connect-Project/ucw-adapter-mx/tree/main/packages/mx-adapter) as a reference.

### Development tips

When you create an adapter package, you'll need to install it in your monorepo workspace using the following command:

```bash
npm install <your_package_name> --workspace apps/server
```
_Package name is the `name` property in your adapter package's `package.json`_

Here's an example from the [MX Adapter Package Fork](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/apps/server/package.json)

```shell
"@ucp-npm/mx-adapter": "*",
```

In this example, `@ucp-npm/mx-adapter` is installed as a dependency in the `apps/server` workspace, but it will use the local files in the adapter package, which also lives in the monorepo, under the "packages" folder.

Next, it is important that you build your package, which creates a `dist` folder, which is where the `apps/server` project will actually be able to pull the package from. If you don't do this, your code will not run properly. 
