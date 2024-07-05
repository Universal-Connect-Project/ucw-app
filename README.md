# Universal Connect Widget (Application)

This repo is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application which anyone can clone and self-host as a way to serve the connect widget via a url which can then be loaded
into an iframe.

## Table of Contents
- [Documentation](#documentation)
- [Getting Started](#getting-started)
- [Preferences and Aggregator Credentials](#preferences-and-aggregator-credentials)
- [Authentication](#authentication)

## Other Resources
- [Preference Details](PREFERENCES.md)
- [Additional Info](MISC)
- [Contributing](CONTRIBUTING.md)
- [Docker](DOCKER.md)
- [Monorepo](MONOREPO.md)

## Documentation

Please refer to the [UCP documentation](https://docs.universalconnect.org) (Coming soon) for additional information on how to use the widget.

## Getting Started

1. Clone the `ucw-app` repo
1. Run `npm ci` from the root directory
1. Run `cp ./.env.example ./.env`
1. Run `cp ./apps/server/.env.example ./apps/server/.env` (see [PREFERENCES.md](PREFERENCES.md) for details on what values that you must provide in the `./apps/server/.env` file)
1. Run `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json` and modify the preferences (see [PREFERENCES.md](PREFERENCES.md) for details on what the preferences)
1. Install Docker, a dependency for the institution search feature to work (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or just run via node.
    1. For docker: `docker compose up`
    1. For node: `npm run dev`

## Preferences and Aggregator Credentials

You will need to create your own developer account, and then provide your credentials for each provider (aggregator) you want to use. See [PREFERENCES.md](PREFERENCES.md) for details.

## Authentication

The express endpoints exposed in these repositories don't provide any authentication. You will need to fork the repo if you want to add your own authentication.
