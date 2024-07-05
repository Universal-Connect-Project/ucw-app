# Preferences

The preferences file (`./apps/server/cachedDefaults/preferences.json`) handles the institution search feature.

_See [testPreferences.json](./apps/server/cachedDefaults/testData/testPreferences.json) for an example with values filled in._

## Preference Settings

Below we will explain what some of the settings mean.

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

`defaultProviderVolume` (`{ [key: string]: number }`) - This is an object of providers, with a number representing a percent of volume. 

```
"defaultProviderVolume": {
  "mx": 50,
  "sophtron": 50
}
```
_The total for all providers need to add up to 100_

`institutionProviderVolumeMap` (`{ [key: string]: { [key:string]: number } }`) - This is an object of institutions, with an object of providers, with a number representing a percent of volume.

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

## Provider Credentials

As mentioned above, it is important to understand, that for any providers listed in the section labeled `defaultProvider` or `supportedProviders`, you must provide your own credentials for each of these providers in the `./apps/servver/.env` file.
