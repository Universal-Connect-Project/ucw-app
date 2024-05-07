# Universal Connect Widget (Application)

This repo is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application which anyone can clone and self-host as a way to serve the connect widget via a url which can then be loaded
into an iframe.

## Getting Started (in production)

To get started: clone the repo, follow the steps in [Getting Started](#getting-started-in-development) and
[Initial Setup](#initial-setup) (below) to set up your `.env` files, and then run the following command, from the root of the project:

_This assumes you have [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/) already installed._

```
docker compose up
```

That's it! If you have questions, please reach out to us.

### Docker images

The images for this repo are available on [DockerHub](https://hub.docker.com/repositories/universalconnectfoundation). You can change the version of the images that you pull by setting
the `DOCKER_IMAGE_SERVER` and `DOCKER_IMAGE_UI` values in the `.env` file found in the project root.

### A note about `docker login`

If you get an error stating anything like `failed to authorize`, or `failed to fetch oauth token`, or a `401 Unauthorized`,
you may have logged-in previously with a docker login (via cli), and your auth has expired.

You do not need a docker login to pull the UCW docker images, but if you have stale tokens, docker will try to use them, thus
resulting in the error. To fix this, you will need to run `docker logout` from your terminal, prior to running `docker compose up`

## Getting Started (in development)

1. Clone the `ucw-app` repo
1. Run `npm ci` from the root directory
1. Run `cp ./.env.example ./.env`
1. Run `cp ./apps/server/.env.example ./apps/server/.env`
1. Follow [Initial Setup](#initial-setup) (below) for setting-up some required environment variables
1. Finally, run: `npm run dev`

## Initial setup

1. Run `npm run keys --prefix ./apps/server`, which will generate a new set of `key` and `IV` values.
1. Fill in the `CryptoKey` and `CryptoIv` in your `./apps/server/.env` file with the generated `key` and `IV`.
1. Sign up for a UCP client account: [here](https://login.universalconnectproject.org/) (the `Click here to login` link navigates to the aws hosted login page
   where a sign-up option is available).
1. Once you are registered and logged in, generate and view your client secrets
1. Fill in the `UcpAuthClientId`, `UcpAuthClientSecret` and `UcpAuthEncryptionKey` in the `./apps/server/.env` file with
   the values provided by login page.

Please remember that secrets are passed through environment variables instead of hardcoded in the code files.
**DO NO** put any credentials in any of the code files. If you do so, it could accidentally get committed and leaked to the public.
**Use the provided `.env` files.**

_UCP credentials are required for authentication and secret exchange, storage (redis-like session cache) and analytics services._

_The `CryptoKey` and `CryptoIv` values are for encrypting the session token in order to not rely on cookies. They must be
shared across server instances if there are multiple instances._

## Redis

You might see an error about failure to connect redis. The widget doesn't rely on redis to start, but some providers logic
require a redis instance. To fix this error you can either:

- Start a local redis instance. This way it will be available at localhost:6379 and the widget will be able to use it
- Or in `./apps/server/.env`, set `Env=dev`. When this is done, the redis client will use a local in-memory object to handle
  the cache, and avoid the error. However, this should only be used for testing. The cached values won't expire and also
  will be cleared on server restart.

## Publish to Docker

**Publishing to Docker Hub is automatic, and will happen when code is merged to `main`.**

**IMPORTANT**: Prior to merging your PR to main, make sure the versions of `ui` and `ucw-app` are up-to-date. The `version` property in
their respective `package.json` files should be up-to-date. This is where the versions for the docker images is pulled from.

### Publishing manually

It is strongly discouraged to publish to Docker Hub manually, however, if you need to publish manually, you can do so with
the following steps.

From the root of the project:

Login to docker hub:

    docker login

_NOTE: You must be a member of the UCP organization._

Then run the following, which will build the new images:

    docker compose up --pull never

Then run:

    docker compose push

`<version>` must mach the respective versions in `./.env`, `DOCKER_IMAGE_{UI|SERVER}`. These env variables are used in
the `./docker-compose.yml` file when building the images.

## Additional Information

### Architecture decision records

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. They live
in the [architectureDecisionRecords](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords) folder.

### Monorepo

Please refer to the Monorepo [README](./MONOREPO.md) for more information.

### Testing Docker

Please refer to the Docker [README](./DOCKER.md) for more information.
