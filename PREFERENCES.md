# Preferences

The preferences file (`./apps/server/cachedDefaults/preferences.json`) contains configuration settings for the institution search feature.

_See [testPreferences.json](./apps/server/cachedDefaults/testData/testPreferences.json) as a guide. This file has real values filled in._

## Table of Contents

- [Provider Credentials](#provider-credentials)
- [Preference Settings](#preference-settings)

## Provider Credentials

__NOTE:__ For any providers listed in the section labeled `supportedProviders`, you must provide your own credentials for each of these providers in the `./apps/server/.env` file. You need to have credentials for a minimum of one provider in order for the UCW to function correctly.

Follow these links to sign-up for credentials for each provider that the UCW currently supports:

- MX - [Register for a developer account](https://dashboard.mx.com/sign_up)
  - Once you have created an account, go to [https://dashboard.mx.com/home](https://dashboard.mx.com/home), and look for your `API Key` and `Client ID`. Put those values in `./apps/server/.env`
  - Note that MX requires that your IP address(es) be approved and added to their allow-list, prior to being able to connect. This can be done in their dashboard.
- Sophtron - [Register for a developer account](https://sophtron.com/Account/Register)
  - Once you have created an account, go to [https://sophtron.com/Manage](https://sophtron.com/Manage), and look for your `UserId` and `AccessKey`. Put those values in `./apps/server/.env`

_Note: Providers require a contract to access their production APIs._

## Preference Settings

Here are details for what each setting means.

`defaultProvider` (`string`) - Set the default aggregator for all connections. This value is used as a fall-back in cases where other providers you also support are not available.

```
"defaultProvider": "mx"
```

`supportedProviders` (`string[]`) - Set which providers you want to use for connections.

```
"supportedProviders": [
  "mx",
  "sophtron"
]
```

`defaultProviderVolume` (`{ [key: string]: number }`) - An object of providers, with a number representing a percent of volume. The combined volume across all providers must equal 100.

```
"defaultProviderVolume": {
  "mx": 50,
  "sophtron": 50
}
```

`institutionProviderVolumeMap` (`{ [key: string]: { [key:string]: number } }`) - An object of institutions, with a related object of providers. The number associated with each provider represents a percent of volume. The combined volume for each individual institution must equal 100.

```
"institutionProviderVolumeMap": {
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
