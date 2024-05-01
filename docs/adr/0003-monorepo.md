# Title

Monorepo

## Context

In its current state setting up a local development environment for UCP is difficult and confusing with so many repositories. To develop locally we currently have to run multiple different projects, and configure them to work together.

There isn't a standard folder structure between repositories. This repository has a confusing folder structure where the root package.json file relates to the server, and the ui folder has its own package.json.

## Decision

We will convert this repository into a monorepo, and merge all repositories that are necessary to run UCP into this repository.

We will use [Turborepo](https://turbo.build/repo/docs) for our monorepo tooling.

All packages will be installed with a single npm install command from root.

All services will start with a single command from root.

Each service will have its own .env file.

## Consequences

Contributors will need to have a basic working knowledge of turborepo to contribute.

Making changes will be easier, because you won't need to put PRs up for multiple repositories when they need changes to be able to work together.

Shared packages will be easy to create, and they won't require publishing to npm.

Understanding the UCP should be easier, because everything that's necessary to run the UCP will live here.