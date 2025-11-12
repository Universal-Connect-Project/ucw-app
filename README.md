# Universal Connect Widget

This repository is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application, which anyone can clone and self-host as a way to serve the connect widget via a URL, which can then be loaded
into an iframe.

## Table of Contents

- [Documentation](#documentation)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Universal Connect Project Services and API Keys](#universal-connect-project-services-and-api-keys)
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

The API documentation for this service lives in [./openApi/1.json](./openApi/1.json) and uses the [OpenAPI spec](https://swagger.io/specification/). You can open it in your preferred tool. You may copy the file into [swagger editor](https://editor.swagger.io/) and edit the local file with updates when complete.

## Getting Started

1. Clone the `ucw-app` repo
1. From the root directory, run:
   1. `npm ci`
   1. `cp ./.env.example ./.env`
   1. `npm run copyServerEnv`
      1. See [ENVIRONMENT.md](ENVIRONMENT.md) for details on what values you must provide in the `./apps/server/env/(staging|production).env` file
   1. `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json`
      1. Make sure you then set up your preferences (see [PREFERENCES.md](PREFERENCES.md) for details)
1. Make sure you have Docker installed (or another compatible container runtime), which is a required dependency for the institution search feature to function, even when running via Node.js (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or simply run from the cli, via node.
   1. For docker: `docker compose up`
   1. For node: `npm run dev` or `npm run prod`

It can take a minute or so for the server to initialize and set up elasticsearch.

Once the server is running and you see `"Message":"App initialized successfully"`, create a widget URL by making a POST request to the `/widgetUrl` endpoint:

```bash
curl -X POST http://localhost:8080/widgetUrl \
  -H "Content-Type: application/json" \
  -d '{
    "jobTypes": "transactions",
    "userId": "test-user-id",
    "targetOrigin": "http://localhost:8080"
  }'
```

The response contains a `widgetUrl` that you can open in your browser to see the Universal Connect Widget UI. This URL includes a secure token that expires in 5 minutes.

## Universal Connect Project Services and API Keys

The Universal Connect Project hosts some services that improve the experience of hosting and maintaining a widget.

1. The [UCP App](https://app.universalconnectproject.org/)
   1. Aggregators can keep their institutions up to date here
   1. All users can view available institutions and performance data
   1. Widget hosters can generate API Keys to allow their widget to stay up to date with the institution list and provide and receive performance data
1. Institution service
   1. Widgets with API keys can retrieve the most up to date institution list
1. Performance service
   1. Widgets with API keys provide aggregator performance data

Access to generate API keys can be requested [here](https://app.universalconnectproject.org/widget-management).

The required API Key setup can be found [here](ENVIRONMENT.md#suggested-variables).

## Preferences and Aggregator Credentials

For any aggregator you are planning on using, you will need to create your own developer account, and then provide your credentials.

See [PREFERENCES.md](PREFERENCES.md) and [ENVIRONMENT.md](ENVIRONMENT.md) for details.

## Environment variables

There are several required environment variables and some optional environment variables that are described in [ENVIRONMENT.md](ENVIRONMENT.md)

## Authentication

We have an optional [authentication](./apps/server/src/authentication.ts) system built-in and enabled by .env variables. If `AUTHENTICATION_ENABLE=true` and the [other required variables are provided](ENVIRONMENT.md#authentication-variables), then all express endpoints defined after the `useAuthentication` call will require a `Bearer` token and optionally a set of scopes. This system assumes that you have an authorization system, such as auth0, to point to. If you need more control over your authentication, then you may fork the repository and implement your own.

When authentication is enabled, the `/widget` endpoint will require authorization.

Use the `/widgetUrl` endpoint to create secure widget URLs. POST your widget parameters (jobTypes, userId, targetOrigin, etc.) with an optional Bearer token in the Authorization header. The response contains a `widgetUrl` with a secure token that:

- Stores all widget parameters in Redis with a 5-minute expiration
- Extracts and stores your authorization JWT (if provided) as a cookie when the widget loads
- Can only be used once for authentication, then the JWT is removed from storage

Variables for our optional authentication are found [here](ENVIRONMENT.md#authentication-variables)

---

The following sections describe the UCW Server endpoints that are not associated with a connection, and should be authenticated separately from the connection endpoints.

## Data Endpoints and Authentication

We have an optional set of data endpoints that can be used to retrieve data from the aggregators. They are turned off by default. These endpoints need to be well-protected. Using these endpoints gets you access to the data for any user that has made a connection. We recommend that users don't have direct access to these endpoints. They should be machine-to-machine authenticated, and they should have a layer of authentication around them that ensures they are called with user ids that the user should have access to.

Information about the environment variables related to the data endpoints can be found [here](ENVIRONMENT.md#data-endpoint-variables).

## "Delete User" Endpoint and Authentication

There is an endpoint for deleting a user associated with a connection. Just as with the data endpoints, mentioned above, the delete user endpoint is turned off by default. This endpoint should be well-protected. This should be machine-to-machine authenticated, and should have a layer of authentication around it that ensure that it is called with user ids that the user should have access to.

Information about the environment variables related to the delete user endpoint on can be found [here](ENVIRONMENT.md#delete-user-endpoint-variables).
