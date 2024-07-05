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
- [Additional Info](MORE-INFO.md)
- [Contributing](CONTRIBUTING.md)
- [Docker](DOCKER.md)
- [Monorepo](MONOREPO.md)

## Documentation

Please refer to the [UCP documentation](https://docs.universalconnect.org) (Coming soon) for additional information on how to use the widget.

## Getting Started

1. Clone the `ucw-app` repo
1. Run `npm ci` from the root directory
1. Run `cp ./.env.example ./.env`
1. Run `cp ./apps/server/.env.example ./apps/server/.env` (see [below](#preferences-and-aggregator-credentials) for details on necessary values that you must provide)
1. Run `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json` and modify the preferences
1. Install Docker, a dependency for the institution search feature to work (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or just run via node.
    1. For docker: `docker compose up`
    1. For node: `npm run dev`

## Preferences and Aggregator Credentials

The preferences file (`./apps/server/cachedDefaults/preferences.json`) handles the institution search feature. For any providers listed in the section labeled `supportedProviders`, you must provide your own credentials for each of these providers in the `./.env` file.

## Authentication

The express endpoints exposed in these repositories don't provide any authentication. You will need to fork the repo if you want to add your own authentication.
