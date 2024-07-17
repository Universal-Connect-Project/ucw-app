# Miscellaneous Info - Universal Connect Widget

## Table of Contents

- [Sensitive information](#sensitive-information)
- [Deploying a Production Instance](#deploying-a-production-instance)
- [Cached Data](#cached-data)
- [Troubleshooting](#troubleshooting)

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
