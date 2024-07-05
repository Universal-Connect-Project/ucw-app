# Additional Info - Universal Connect Widget

## Table of Contents

- [Preferences and Aggregator Credentials](#preferences-and-aggregator-credentials)
- [Sensitive information](#sensitive-information)
- [Deploying a Production Instance](#deploying-a-production-instance)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Cached Data](#cached-data)
- [Troubleshooting](#troubleshooting)
- [Redis](#redis)
- [Architecture Decision Records](#architecture-decision-records)

## Preferences and Aggregator Credentials

The preferences file (`./apps/server/cachedDefaults/preferences.json`) handles the institution search feature. For any providers listed in the section labeled `supportedProviders`, you must provide your own credentials for each of these providers in the `./.env` file.

## Sensitive Information

Please remember that secrets are passed through environment variables instead of hardcoded in the code files.
Do not put any credentials in any of the code files. If you do so, it could get committed and leaked to the public.
**Use the provided `.env` files.**

## Deploying a Production Instance

For a production instance, it is easiest to use Docker. We provide docker files for both the server and the UI, along with a docker-compose file that runs all necessary containers, included Redis and ElasticSearch.

The simplest way to deploy this widget is via docker-compose, as shown below, however you can also use the dockerfiles directly.

Take a look at the [docker-compose.yml](./docker-compose.yml) file for more details on how it is set up.

```
docker compose up
```

That's it! If you have questions, please reach out to us.

## Authentication

The express endpoints exposed in these repositories don't provide any authentication. You will need to fork the repo if you want to add your own authentication.

## API Documentation

The API documentation for this service lives in openApiDocumentation.json and uses the (OpenAPI spec)[https://swagger.io/specification/]. You can open it in your preferred tool. You may copy the file into [swagger editor](https://editor.swagger.io/) and edit the local file with updates when complete.

## Cached Data

This widget runs off of cached data, which is included in this repo, so that it doesn't rely on any UCP-hosted services in order to function.

In `./apps/server/cachedDefaults` you will find files that are loaded into a redis cache. In the future these files will be used as a backup in case UCP-hosted services are down.

The following files need to be there for the widget service to function

1. Preferences
1. Institutions

## Troubleshooting

### Docker Login

If you get an error stating anything like `failed to authorize`, or `failed to fetch oauth token`, or a `401 Unauthorized`,
you may have logged-in previously with a docker login (via cli), and your auth has expired.

You do not need a docker login to pull the UCW docker images, but if you have stale tokens, docker will try to use them, thus
resulting in the error. To fix this, you will need to run `docker logout` from your terminal, prior to running `docker compose up`

## Redis

You might see an error about failure to connect redis. The widget doesn't rely on redis to start, but some providers logic
require a redis instance. To fix this error you can either:

- Start a local redis instance. This way it will be available at localhost:6379 and the widget will be able to use it
- Or in `./apps/server/.env`, set `Env=dev`. When this is done, the redis client will use a local in-memory object to handle
  the cache, and avoid the error. However, this should only be used for testing. The cached values won't expire and also
  will be cleared on server restart.

## Architecture decision records

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. They live
in the [architectureDecisionRecords](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords) folder.
