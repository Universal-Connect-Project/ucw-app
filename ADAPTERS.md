# Adapters

This repository only contains test adapters. Each aggregator that wants to participate in the UCP needs to create an adapter package. Those hosting a UCW will need to import aggregator packages to be able to use them.

## Hosting a Universal Connect Widget

## Creating an adapter package

In order to make it easier for aggregators to develop their own UCW adapters we are moving to a package architecture. We will be moving all aggregator specific code to their own packages.

The only adapter packages in this repo should be test adapters. In order to be able to support aggregator specific features these adapters must support all the features of all the aggregators' adapters. We should have enough tests on the test adapters that we have confidence that the aggregator adapters will continue to function. If you need to modify code in this repository for your adapter package to function, then you'll need to make sure you test that functionality with the test adapter.

In our opinion the easiest way to create an adapter package follows:

1. Fork this repository
1. Create a folder in the packages folder for your adapter
1. Add a test institution to the [default institution list](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) with aggregator support defined for your institution.
1. Build your adapter
1. Write unit, integration, and e2e tests
1. Bundle and publish your adapter to npm
1. When your adapter package is ready for production use, then you'll need to gain access to the UCP institution list to update the list of institutions you support(This functionality is in progress by the UCP team)

An example adapter lives [here](./apps/server/src/test-adapter/index.ts). Each adapter needs to export an adapterMapObject, and the testAdapter needs to support all properties of an adapterMapObject. These adapterMapObjects are imported and setup by hosters of the UCW in [adapterSetup.ts](./apps/server/src/adapterSetup.ts). This repo accesses adapter specific logic via [adapterIndex.ts](./apps/server/src/adapterIndex.ts)
