# Universal Connect Widget

This repository is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application, which anyone can clone and self-host as a way to serve the connect widget via a URL, which can then be loaded
into an iframe.

## Table of Contents
- [Documentation](#documentation)
  - [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Preferences and Aggregator Credentials](#preferences-and-aggregator-credentials)
- [Authentication](#authentication)

## Other Resources
- [Contributing](CONTRIBUTING.md)
- [Docker](DOCKER.md)
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
      1. See [PREFERENCES.md](PREFERENCES.md) for details on what values you must provide in the `./apps/server/.env` file
   1. `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json`
      1. Make sure you then set up your preferences (see [PREFERENCES.md](PREFERENCES.md) for details)
1. Make sure you have Docker installed (or another compatible container runtime), which is a required dependency for the institution search feature to function, even when running via Node.js (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or simply run from the cli, via node.
    1. For docker: `docker compose up`
    1. For node: `npm run dev`

It can take a minute or so for the server to initialize and set up elasticsearch.

Once the server is running, and you see a message that says, `"Message":"App initialized successfully"`, you can then navigate to [http://localhost:8080/?job_type=aggregate&user_id=test-user-id](http://localhost:8080/?job_type=aggregate&user_id=test-user-id) in a browser, and you should see the Universal Connect Widget UI load.

## Preferences and Aggregator Credentials

For any aggregator/provider you are planning on using, you will need to create your own developer account, and then provide your credentials.

See [PREFERENCES.md](PREFERENCES.md) for details.

## Authentication

The Express.js endpoints that are exposed in these repositories do not provide any authentication. You will need to fork the repo if you want to add your own authentication.
