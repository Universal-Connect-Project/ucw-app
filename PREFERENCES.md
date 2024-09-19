# Preferences

The preferences file (`./apps/server/cachedDefaults/preferences.json`) contains configuration settings for the institution search feature.

_See [testPreferences.json](./apps/server/cachedDefaults/testData/testPreferences.json) as a guide. This file has real values filled in._

## Table of Contents

- [Aggregator Credentials](#provider-credentials)
- [Preference Settings](#preference-settings)

## Aggregator Credentials

__NOTE:__ For any aggregators listed in the section labeled `supportedAggregators`, you must provide your own credentials for each of these aggregators in the `./apps/server/.env` file. You need to have credentials for a minimum of one provider in order for the UCW to function correctly.

Follow these links to sign-up for credentials for each provider that the UCW currently supports:

- MX - [Register for a developer account](https://dashboard.mx.com/sign_up)
  - Once you have created an account, go to [https://dashboard.mx.com/home](https://dashboard.mx.com/home), and look for your `API Key` and `Client ID`. Put those values in `./apps/server/.env`
  - Note that MX requires that your IP address(es) be approved and added to their allow-list, prior to being able to connect. This can be done in their dashboard.
- Sophtron - [Register for a developer account](https://sophtron.com/Account/Register)
  - Once you have created an account, go to [https://sophtron.com/Manage](https://sophtron.com/Manage), and look for your `UserId` and `AccessKey`. Put those values in `./apps/server/.env`

_Note: Aggregators require a contract to access their production APIs._

## Preference Settings

Here are details for what each setting means.

`defaultAggregator` (`string`) - Set the default aggregator for all connections. This value is used as a fall-back in cases where other aggregators you also support are not available.

```
"defaultAggregator": "mx"
```

`supportedAggregators` (`string[]`) - Set which aggregators you want to use for connections.

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

`institutionAggregatorVolumeMap` (`{ [key: string]: { [key:string]: number } }`) - An object of institutions, with a related object of aggregators. The number associated with each provider represents the chance of being selected. The combined volume for each individual institution must equal 100.

```
"institutionAggregatorVolumeMap": {
  "UCP-8c4ca4c32dbd8de": {
    "mx": 70,
    "sophtron": 30
  },
  "UCP-ce8334bbb890163": {
    "sophtron": 100
  }
}
```

`hiddenInstitutions` (`string[]`) - An array of institutions that should not be shown in the institution search results.

```
"hiddenInstitutions": ["UCP-2e2b825bd378172"]
```

`recommendedInstitutions` (`string[]`) - An array of institutions that should be shown on the institution search page by default, prior to the user entering any search criteria.

```
"recommendedInstitutions": [
  "UCP-b087caf69b372c9",
  "UCP-ce8334bbb890163",
  "UCP-ebca9a2b2ae2cca",
  "UCP-b0a4307160ecb4c",
  "UCP-8c4ca4c32dbd8de",
  "UCP-412ded54698c47f"
]
```
