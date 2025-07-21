# Preferences

The preferences file (`./apps/server/cachedDefaults/preferences.json`) contains configuration settings for the institution search feature.

_See [testPreferences.json](./apps/server/cachedDefaults/testData/testPreferences.json) as a guide. This file has real values filled in._

## Table of Contents

- [Aggregator Credentials](#aggregator-credentials)
- [Preference Settings](#preference-settings)

## Aggregator Credentials

**NOTE:** For any aggregators listed in the section labeled `supportedAggregators`, you must provide your own credentials for each of these aggregators in the `./apps/server/env/(staging|production).env` file. You need to have credentials for a minimum of one aggregator in order for the UCW to function correctly.

Follow these links to sign-up for credentials for each aggregator that the UCW currently supports:

- MX - [Register for a developer account](https://dashboard.mx.com/sign_up)
  - Once you have created an account, go to [https://dashboard.mx.com/home](https://dashboard.mx.com/home), and look for your `API Key` and `Client ID`. Put those values in ` ./apps/server/env/(staging|production).env`
  - Note that MX requires that your IP address(es) be approved and added to their allow-list, prior to being able to connect. This can be done in their dashboard.
- Sophtron - [Register for a developer account](https://sophtron.com/Account/Register)
  - Once you have created an account, go to [https://sophtron.com/Manage](https://sophtron.com/Manage), and look for your `UserId` and `AccessKey`. Put those values in `./apps/server/env/(staging|production).env`

<!-- TODO: Wait for complete integration before documenting
- Plaid - [Sign Up](https://dashboard.plaid.com/signup)
  - Once you have created an account, go to [https://dashboard.plaid.com/developers/keys](https://dashboard.plaid.com/developers/keys), and look for your `Client ID`, `Sandbox` and `Production`. Put those values in `./apps/server/env/(staging|production).env`
-->

_Note: Aggregators require a contract to access their production APIs._

## Preference Settings

Here are details for what each setting means.

`defaultAggregator` (`string`) - Set the default aggregator for all connections. This value is used as a fall-back in cases where other aggregators you also support are not available.

```
"defaultAggregator": "mx"
```

`supportedAggregators` (`string[]`) - Set which aggregators you want to use for connections. Options are: mx, sophtron, finicity, akoya, plaid

```
"supportedAggregators": [
  "mx",
  "sophtron"
]
```

`defaultAggregatorVolume` (`{ [key: string]: number }`) - An object of aggregators, with a number representing the chance of being selected. The combined volume across all aggregators must equal 100.

```
"defaultAggregatorVolume": {
  "mx": 50,
  "sophtron": 50
}
```

`institutionAggregatorVolumeMap` (`{ [key: string]: { [key:string]: number } }`) - An object of institutions, with a related object of aggregators. The number associated with each aggregator represents the chance of being selected. The combined volume for each individual institution must equal 100.

```
"institutionAggregatorVolumeMap": {
  "1e65df13-be46-46c1-9aab-b950ef6523dd": {
    "mx": 70,
    "sophtron": 30
  },
  "33232943-49ca-49ae-bea6-bc40acb9f207": {
    "sophtron": 100
  }
}
```

`hiddenInstitutions` (`string[]`) - An array of institutions that should not be shown in the institution search results.

```
"hiddenInstitutions": ["7a909e62-98b6-4a34-8725-b2a6a63e830a"]
```

`recommendedInstitutions` (`string[]`) - An array of institutions that should be shown on the institution search page by default, prior to the user entering any search criteria.

```
"recommendedInstitutions": [
  "9ea81818-c36d-41d6-93b8-f9d4c1398e3d",
  "33232943-49ca-49ae-bea6-bc40acb9f207",
  "e4996bf9-9540-456f-8287-30da92edf326",
  "956af43b-c894-4640-8594-f774ceee3ce6",
  "1e65df13-be46-46c1-9aab-b950ef6523dd",
  "10b0aa0d-ee76-4015-b065-d0db092a7423"
]
```
