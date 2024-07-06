# Preferences

The preferences file (`./apps/server/cachedDefaults/preferences.json`) handles the institution search feature.

_See [testPreferences.json](./apps/server/cachedDefaults/testData/testPreferences.json) for an example with values filled in._

## Table of Contents

- [Provider Credentials](#provider-credentials)
- [Preference Settings](#preference-settings)

## Provider Credentials

As mentioned above, it is important to understand, that for any providers listed in the section labeled `defaultProvider` or `supportedProviders`, you must provide your own credentials for each of these providers in the `./apps/server/.env` file.

Follow these links to sign-up for credentials for each provider:

- MX - [Register for a developer account](https://dashboard.mx.com/sign_up)
  - Once you have created an account, go to [https://dashboard.mx.com/home](https://dashboard.mx.com/home), and look for your `API Key` and `Client ID`, and put those values in `./apps/server/.env`
- Sophtron - [Register for a developer account](https://sophtron.com/Account/Register)
  - Once you have created an account, go to [https://sophtron.com/Manage](https://sophtron.com/Manage), and look for your `UserId` and `AccessKey`, and put those values in `./apps/server/.env`

## Preference Settings

Below are details regarding what each setting means.

`defaultProvider` (`string`) - This allows you to set the default aggregator for all connections. 

```
"defaultProvider": "mx"
```

`supportedProviders` (`string[]`) - This allows you to set which providers you want to use for connections.

```
"supportedProviders": [
  "mx",
  "sophtron"
]
```

_Note: For all the providers that you list in `supportedProviders`, you need to provide your own API credentials for the provider in the `./apps/server/.env` file_

`defaultProviderVolume` (`{ [key: string]: number }`) - This is an object of providers, with a number representing a percent of volume. The combined volume across all providers must equal 100.

```
"defaultProviderVolume": {
  "mx": 50,
  "sophtron": 50
}
```
_The total for all providers need to add up to 100_

`institutionProviderVolumeMap` (`{ [key: string]: { [key:string]: number } }`) - This is an object of institutions, with a related object of providers. The number associated with each provider represents a percent of volume. The combined volume for each individual institution must equal 100.

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

`hiddenInstitutions` (`string[]`) - This is an array of institutions that should not be shown in the institution search results.

```
"hiddenInstitutions": ["UCP-2e2b825bd378172"]
```

`recommendedInstitutions` (`string[]`) - This is an array of institutions that should be shown on the institution search page by default, prior to the user entering any search criteria.

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
