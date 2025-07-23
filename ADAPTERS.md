# Adapters

## Aggregator adapter packages

There are aggregator adapter packages for each UCP supported aggregator in this repository. These adapters allow communication between the widget and an aggregator.

## Creating an adapter

Any of the existing adapters in the packages/ folder can be used an example of what needs to be done to create an adapter.

Each adapter needs to export an adapterMapObject. These adapterMapObjects are setup in [adapterSetup.ts](./apps/server/src/adapterSetup.ts).

This repo accesses adapter-specific logic in [adapterIndex.ts](./apps/server/src/adapterIndex.ts)

## Updating the UCP institutions list with an aggregator's institutions

The UCP institution list is available for viewing and modifying [here](https://app.universalconnectproject.org/institutions).

Only aggregator admins have access to modify institutions, so you'll need to request access from the UCP team. You can do so via the "Contact Us" button of the [UCP App](https://app.universalconnectproject.org/)

When an institution is modified the changes are sent to all Universal Connect Widgets that are connected to it. In order for a widget to route to an aggregator it needs to have its properties attached to the various institutions.

Aggregator integrations should be added to the matching institution in the UCP institution list. New institutions should only be created if there isn't an existing institution that matches.

## Test institutions

Test institutions are pulled from the [test institution list](./apps/server/src/testInstitutions/testInstitutions.ts). Test institutions that are only applicable to a single aggregator should live in that aggregator's adapter package.

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
