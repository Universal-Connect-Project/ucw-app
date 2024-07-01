# Universal Connect Widget (Application)

This repo is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application which anyone can clone and self-host as a way to serve the connect widget via a url which can then be loaded
into an iframe.

## Documentation

Please refer to the UCP documentation [here](https://docs.universalconnect.org) (Coming soon) for additional information on how to use the widget.

## Cached data

This widget runs off of cached data, which is included in this repo, so that it doesn't rely on any UCP-hosted services in order to be able to function.

In `./apps/server/cachedDefaults` you will find files that are loaded into a redis cache. In the future these files will be used as a backup in case UCP-hosted services are down.

The following files need to be there for the widget service to function

1. Preferences
1. Institutions

## Getting Started (production)

To get started: clone the repo, follow the steps in [Getting Started](#getting-started-in-development) and
[Initial Setup](#initial-setup) to set up your `.env` files, and then run the following command from the root of the 
project:

_This assumes you have [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/) already installed._

```
docker compose up
```

That's it! If you have questions, please reach out to us.

### Cloud deployment

We will be providing more information on basic deployment steps for Heroku in the future.

### Docker images

The images for this repo are available on [DockerHub](https://hub.docker.com/repositories/universalconnectfoundation). You can change the version of the images that you pull by setting
the `DOCKER_IMAGE_SERVER` and `DOCKER_IMAGE_UI` values in the `.env` file found in the project root.

### A note about `docker login`

If you get an error stating anything like `failed to authorize`, or `failed to fetch oauth token`, or a `401 Unauthorized`,
you may have logged-in previously with a docker login (via cli), and your auth has expired.

You do not need a docker login to pull the UCW docker images, but if you have stale tokens, docker will try to use them, thus
resulting in the error. To fix this, you will need to run `docker logout` from your terminal, prior to running `docker compose up`

## Getting Started (development)

1. Clone the `ucw-app` repo
1. Run `npm ci` from the root directory
1. Run `cp ./.env.example ./.env`
1. Run `cp ./apps/server/.env.example ./apps/server/.env`
1. Run `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json` and modify the preferences
1. Follow [Initial Setup](#initial-setup) (below) for setting-up some required environment variables
1. Install [Docker](#docker), a dependency for the institution search feature to work
1. Finally, run: `npm run dev`

## Initial setup

Please remember that secrets are passed through environment variables instead of hardcoded in the code files.
**DO NOT** put any credentials in any of the code files. If you do so, it could get committed and leaked to the public.
**Use the provided `.env` files.**

## Docker

If you want to run the provided docker containers, docker is required to be installed on your local development system.

Some compatible options are:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Rancher Desktop](https://rancherdesktop.io/)

Please note, you do not need a "desktop" version of docker to run this project. Any docker-compatible container client is all 
that is required. However, not all clients have been tested with this project.

## Redis

You might see an error about failure to connect redis. The widget doesn't rely on redis to start, but some providers logic
require a redis instance. To fix this error you can either:

- Start a local redis instance. This way it will be available at localhost:6379 and the widget will be able to use it
- Or in `./apps/server/.env`, set `Env=dev`. When this is done, the redis client will use a local in-memory object to handle
  the cache, and avoid the error. However, this should only be used for testing. The cached values won't expire and also
  will be cleared on server restart.

## Contributing

### Publish to Docker

**Publishing to Docker Hub is automatic, and will happen when code is merged to `main`.**

**IMPORTANT**: Prior to merging your PR to main, make sure the versions of `ui` and `ucw-app` are up-to-date. The `version` property in
their respective `package.json` files should be up-to-date. This is where the versions for the docker images is pulled from
for automated publishing.

### Publishing manually

It is strongly discouraged to publish to Docker Hub manually, however, if you need to publish manually, you can do so with
the following steps.

From the root of the project:

Login to docker hub:

    docker login

_NOTE: You must be a member of the UCP organization._

Run the following, which will set up a new multi-arch builder:

    docker buildx create --use --platform=linux/arm64,linux/amd64 --name multi-platform-builder
    docker buildx inspect --bootstrap

Run the following command, which will build and publish the new images:

    docker buildx bake --file ./docker-compose.yml --push

Note: To update the versions that are pulled/published, update the `./.env` file at the root of the project. Look at
the `DOCKER_IMAGE_{UI|SERVER}` values.
These variables are used in the `./docker-compose.yml` file when building/pulling/publishing the images.

## Additional Information

### Architecture decision records

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. They live
in the [architectureDecisionRecords](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords) folder.

### Monorepo

Please refer to the Monorepo [README](./MONOREPO.md) for more information.

### Testing Docker

Please refer to the Docker [README](./DOCKER.md) for more information.
