# Adapters

## Aggregator adapter packages

Each aggregator that wants to participate in the UCP needs to create their own adapter package. This allows the UCW to interact with the aggregator.

> ⚠️ This repository only contains test adapters to allow the UCP to have test paths for aggregator adapters. Real aggregator adapters should be created in a fork of this repository. See [the MX Adapter Package Fork](https://github.com/Universal-Connect-Project/ucw-adapter-mx) for an example of how an adapter package can be created. 

## Hosting your own UCW

If you are planning on hosting a UCW, then you'll need to import and configure aggregator adapter packages for each of the aggregators you plan to use. Our plan is to make this process as simple as possible. Examples of the integration process are in [adapterSetup.ts](./apps/server/src/adapterSetup.ts).

You can also look at the [adapterSetup.ts](https://github.com/Universal-Connect-Project/ucw-adapter-mx/blob/main/apps/server/src/adapterSetup.ts) file in [the MX Adapter Package Fork](https://github.com/Universal-Connect-Project/ucw-adapter-mx) to see how the MX Adapter is set up.

## Creating an adapter package

In order to make it easier for aggregators to develop their own UCW adapters we are moving to a package architecture. We will be moving all aggregator-specific code to their own packages.

The only adapter packages in this repo should be test adapters. In order to be able to support aggregator-specific features these adapters must support all the features of all the aggregators' adapters. We should have enough tests on the test adapters that we have confidence that the aggregator adapters will continue to function. If you need to modify code in this repository for your adapter package to function, then you'll need to make sure you test that functionality with the test adapter, and add the necessary unit/integration/e2e tests to ensure the new functionality is tested sufficiently.

In our opinion the easiest way to create an adapter package is as follows:

1. Fork this repository
1. Create a folder in the [packages](./packages) folder for your adapter
1. Add a test institution to the [default institution list](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) with aggregator support defined for your institution
1. Build your adapter
1. Import your adapter in [adapterSetup.ts](./apps/server/src/adapterSetup.ts) on your forked version of this repo
1. Write unit, integration, and e2e tests
1. Bundle and publish your adapter to npm
1. When your adapter package is ready for production use, then you'll need to gain access to the UCP institution list to update the list of institutions you support (This functionality is in progress by the UCP team)

We are open to contributions to make this process easier.

An example adapter lives [here](./apps/server/src/test-adapter/index.ts). Each adapter needs to export an adapterMapObject. These adapterMapObjects are imported and setup by someone hosting the UCW in [adapterSetup.ts](./apps/server/src/adapterSetup.ts). If the test adapterMapObject doesn't support a property you need to use for your adapter, then you'll need to add it to the test example adapter to ensure it continues to get support.

This repo accesses adapter-specific logic in [adapterIndex.ts](./apps/server/src/adapterIndex.ts)

## Monorepo 

Because this repo is a monorepo, there are some caveats to consider with regard to adapter creation. See [the MONOREPO readme](MONOREPO.md#creating-an-aggregator-adapter-package-within-a-monorepo) for more details.
