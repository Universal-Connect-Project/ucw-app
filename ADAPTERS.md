# Adapters

## Aggregator adapter packages

There are aggregator adapter packages for each UCP supported aggregator in this repository. These adapters allow communication between the widget and an aggregator.

## Creating an adapter

Any of the existing adapters in the packages/ folder can be used an example of what needs to be done to create an adapter.

When your adapter package is ready for production use, then you'll need to gain access to the UCP institution list to update the list of institutions you support (This functionality is in progress by the UCP team)

An example adapter lives [here](./apps/server/src/test-adapter/index.ts). Each adapter needs to export an adapterMapObject. These adapterMapObjects are setup in [adapterSetup.ts](./apps/server/src/adapterSetup.ts). If the test adapterMapObject doesn't support a property you need to use for your adapter, then you'll need to add it to the test example adapter to ensure it continues to get support.

This repo accesses adapter-specific logic in [adapterIndex.ts](./apps/server/src/adapterIndex.ts)

## Test institutions

Adding a test institution to the [default institution list](./apps/server/cachedDefaults/ucwInstitutionsMapping.json) allows you to test your adapter locally, but these changes should not be committed.

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
