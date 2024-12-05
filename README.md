# Universal Connect Widget

This repository is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application, which anyone can clone and self-host as a way to serve the connect widget via a URL, which can then be loaded
into an iframe.

## Table of Contents

- [Documentation](#documentation)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Preferences and Aggregator Credentials](#preferences-and-aggregator-credentials)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Data endpoints and their authentication](#data-endpoints-and-their-authentication)

## Other Resources

- [Adapters](ADAPTERS.md)
- [Contributing](CONTRIBUTING.md)
- [Docker](DOCKER.md)
- [Environment variables](ENVIRONMENT.md)
- [Monorepo](MONOREPO.md)
- [Preference Details](PREFERENCES.md)
- [Miscellaneous](MISC.md)

## Documentation

Please refer to the [UCP documentation](https://universalconnectproject.org/docs/introduction) for additional information on how to use the widget.

### API Documentation

The API documentation for this service lives in [./openApiDocumentation.json](./openApiDocumentation.json) and uses the [OpenAPI spec](https://swagger.io/specification/). You can open it in your preferred tool. You may copy the file into [swagger editor](https://editor.swagger.io/) and edit the local file with updates when complete.

## Getting Started

1. Clone the `ucw-app` repo
1. From the root directory, run:
   1. `npm ci`
   1. `cp ./.env.example ./.env`
   1. `cp ./apps/server/.env.example ./apps/server/.env`
      1. See [ENVIRONMENT.md](ENVIRONMENT.md) for details on what values you must provide in the `./apps/server/.env` file
   1. `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json`
      1. Make sure you then set up your preferences (see [PREFERENCES.md](PREFERENCES.md) for details)
1. If you are planning to host a UCW, then you'll need to import and configure your [aggregators' adapters](ADAPTERS.md)
1. Make sure you have Docker installed (or another compatible container runtime), which is a required dependency for the institution search feature to function, even when running via Node.js (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or simply run from the cli, via node.
   1. For docker: `docker compose up`
   1. For node: `npm run dev`

It can take a minute or so for the server to initialize and set up elasticsearch.

Once the server is running, and you see a message that says, `"Message":"App initialized successfully"`, you can then navigate to [http://localhost:8080/widget?job_type=aggregate&user_id=test-user-id](http://localhost:8080/widget?job_type=aggregate&user_id=test-user-id) in a browser, and you should see the Universal Connect Widget UI load.

## Preferences and Aggregator Credentials

For any aggregator you are planning on using, you will need to create your own developer account, and then provide your credentials.

See [PREFERENCES.md](PREFERENCES.md) and [ENVIRONMENT.md](ENVIRONMENT.md) for details.

## Environment variables

There are several required environment variables and some optional environment variables that are described in [ENVIRONMENT.md](ENVIRONMENT.md)

## Authentication

We have an optional [authentication](./apps/server/src/authentication.ts) system built in and enabled by .env variables. If AUTHENTICATION_ENABLE=true and the other required variables are provided, then all express endpoints defined after the useAuthentication call will require a Bearer token and optionally a set of scopes. This system assumes that you have an authorization system such as auth0 to point to. If you need more control over your authentication, then you may fork the repository and implement your own.

When authentication is enabled the widget endpoint will require authorization. There is a token endpoint that can be used to retrieve a one time use token that can be passed into the widget url for use in an iframe. When this is used the server will set an authorization cookie that the widget UI will pass to the server for all of its requests.

Variables for our optional authentication are found [here](ENVIRONMENT.md#authentication-variables)

## Data endpoints and their authentication

We have an optional set of data endpoints that can be used to retrieve data from the aggregators. They are turned off by default. These endpoints need to be well protected. Using these endpoints gets you access to the data for any user that has made a connection. We recommend that users don't have direct access to these endpoints. They should be machine to machine authenticated, and they should have a layer of authentication around them that ensures they are called with user ids that the user should have access to.

Variables for turning these endpoints on and using our optional authentication are found [here](ENVIRONMENT.md#data-endpoint-variables).
