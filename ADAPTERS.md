# Adapters

## Aggregator adapter packages

Each aggregator that wants to participate in the UCP needs to create their own adapter package. This allows the UCW to interact with the aggregator.

> [!NOTE]  
> This repository only contains test adapters to allow the UCP to have test paths for aggregator adapters. Real aggregator adapters should be created in a fork of the [adapter template repository](https://github.com/Universal-Connect-Project/ucw-adapter-template). See [the MX Adapter Package Fork](https://github.com/Universal-Connect-Project/ucw-adapter-mx) is an example of an adapter built from the template.

### Supported Adapters

- [MX Adapter for UCW](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/packages/mx-adapter/README.md)
- [Sophtron Adapter for UCW](https://github.com/Universal-Connect-Project/ucw-adapter-sophtron/blob/main/packages/sophtron-adapter/README.md)

## Creating an adapter package

In order to make it easier for aggregators to develop their own UCW adapters we are moving to a package architecture. We will be moving all aggregator-specific code to their own packages.

The only adapter packages in this repo should be the test adapters. In order to be able to support aggregator-specific features these adapters must support all the features of all the aggregators' adapters. We should have enough tests on the test adapters that we have confidence that the aggregator adapters will continue to function. If you need to modify code in this repository for your adapter package to function, then you'll need to make sure you test that functionality with the test adapter, and add the necessary unit/integration/e2e tests to ensure the new functionality is tested sufficiently.

In our opinion the easiest way to create an adapter package is as follows:

1. Fork the [adapter template repository](https://github.com/Universal-Connect-Project/ucw-adapter-template)
1. Duplicate the [adapter-template folder](https://github.com/Universal-Connect-Project/ucw-adapter-template/tree/main/packages/template-adapter) for your adapter into the packages folder
1. Rename all the adapter-template strings in your duplicated folder to your adapter name
1. Add a test institution to the [default institution list](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) with aggregator support defined for your institution (See [below](#test-institutions))
1. Build your adapter
1. Import your adapter in [adapterSetup.ts](./apps/server/src/adapterSetup.ts) on your adapter fork
1. Write unit, integration, and e2e tests
1. Bundle and publish your adapter to npm (There are workflows setup to do this in the template adapter)
1. When your adapter package is ready for production use, then you'll need to gain access to the UCP institution list to update the list of institutions you support (This functionality is in progress by the UCP team)

An example adapter lives [here](./apps/server/src/test-adapter/index.ts). Each adapter needs to export an adapterMapObject. These adapterMapObjects are setup in [adapterSetup.ts](./apps/server/src/adapterSetup.ts). If the test adapterMapObject doesn't support a property you need to use for your adapter, then you'll need to add it to the test example adapter to ensure it continues to get support.

This repo accesses adapter-specific logic in [adapterIndex.ts](./apps/server/src/adapterIndex.ts)

## Publishing to NPM

Your adapter package should be published to NPM in order for end-users to use it with the UCW. See [NPM.md](./NPM.md) for more information.

## Test institutions

Adding a test institution to the [default institution list](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) allows you to test your adapter.

Here is an example of what a test institution should look like:

```json
{
  "name": "My Test Bank",
  "id": "00000000-0000-0000-0000-000000000000",
  "keywords": ["test bank", "text bank", "test bakn"],
  "logo": "https://universalconnectproject.org/images/ucp-logo-icon.svg",
  "url": "https://my-test-bank.com",
  "is_test_bank": true,
  "routing_numbers": [],
  "myAggregatorName": {
    "id": "myAggregatorId",
    "supports_aggregation": true,
    "supports_history": true,
    "supports_identification": true,
    "supports_oauth": true,
    "supports_verification": true
  }
}
```

For now, you should add this manually to the [ucwInstitutionsMapping.json](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) file. In the future, UCP will have a way to manage and sync your aggregator and aggregator/institution mappings via an online service.

## Monorepo

Because this repo is a monorepo, here are some caveats to consider with regard to adapter creation.

### Aggregator adapter package and Turborepo

There are two ways to create a shared package within a Turborepo monorepo. You can create Just-in-Time (JIT) packages or compiled packages. Please see [Turborepo's Documentation](https://turbo.build/repo/docs/core-concepts/internal-packages#compiled-packages) for more detailed information.

Adapter Packages are considered compiled packages, and even though end-users will install your adapter package using NPM, the preferred way that we've chosen to create and test an adapter package is to use it as a compiled package.

Below you'll find some tips on how to successfully run the UCW with a compiled package.

We will use [the MX Adapter](https://github.com/Universal-Connect-Project/ucw-adapter-mx/tree/main/packages/mx-adapter) as a reference.

#### Development tips

When developing an adapter package, you'll need to install it in your monorepo workspace in order to test it. You can do this using the following command:

```bash
npm install <your_package_name> --workspace apps/server
```

_Package name is the `name` property in your adapter package's `package.json`_

Once you run the above command, change the version of the package to a star (`"*"`). In the context of npm, this tells npm to install the latest version of the package. This is also a convention of Turborepo, and is what is recommended when developing packages locally.

After changing the version to `*`, run `npm i` again to update your lock file.

#### Example

Here's an example from the [MX Adapter Package Fork](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/apps/server/package.json)

```
{
  ...

  "dependencies": {
    "@ucp-npm/mx-adapter": "*"
  }
  ...
}
```

In this example, `@ucp-npm/mx-adapter` is installed as a dependency in the `apps/server` workspace, but it will use the local files in the adapter package, which also lives in the monorepo, under the [packages](./packages) folder.

Next, it is important that you build your package, which creates a `dist` folder, which is where the `apps/server` project will actually be able to pull the package from. If you don't do this, your code will not run properly.

Do this by running the following command:

```bash
npm run build --workspace packages/<your_package_folder>
```
