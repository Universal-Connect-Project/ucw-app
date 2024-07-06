# Universal Connect Widget

This repository is a monorepo, which contains the pieces that make up the Universal Connect Application. It is a full-stack
application, which anyone can clone and self-host as a way to serve the connect widget via a URL, which can then be loaded
into an iframe. Due to the nature of the architecture, it is language-agnostic.

## Table of Contents
- [Documentation](#documentation)
- [Getting Started](#getting-started)
- [Preferences and Aggregator Credentials](#preferences-and-aggregator-credentials)
- [Authentication](#authentication)

## Other Resources
- [Additional Info](MISC.md)
- [Contributing](CONTRIBUTING.md)
- [Docker](DOCKER.md)
- [Monorepo](MONOREPO.md)
- [Preference Details](PREFERENCES.md)

## Documentation

Please refer to the [UCP documentation](https://docs.universalconnect.org) (Coming soon) for additional information on how to use the widget.

## Getting Started

1. Clone the `ucw-app` repo
1. From the root directory, run:
   1. `npm ci`
   1. `cp ./.env.example ./.env`
   1. `cp ./apps/server/.env.example ./apps/server/.env`
      1. See [PREFERENCES.md](PREFERENCES.md) for details on what values that you must provide in the `./apps/server/.env` file
   1. `cp ./apps/server/cachedDefaults/preferences.example.json ./apps/server/cachedDefaults/preferences.json`
      1. Make sure you then set up your preferences (see [PREFERENCES.md](PREFERENCES.md) for details on what the preferences)
1. Make sure you have Docker installed (or another compatible container runtime), which is a required dependency for the institution search feature to function (more info in [DOCKER.md](DOCKER.md))
1. Finally, you can run the docker containers, or just run via node.
    1. For docker: `docker compose up`
    1. For node: `npm run dev`

## Preferences and Aggregator Credentials

For any aggregator/provider you are planning on using, you will need to create your own developer account, and then provide your credentials.

See [PREFERENCES.md](PREFERENCES.md) for details.

## Authentication

The expressjs endpoints that are exposed in these repositories do not provide any authentication. You will need to fork the repo if you want to add your own authentication.
