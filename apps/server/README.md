# Universal Connect Widget Server

This app is the back-end application for the Universal Connect Widget. It serves a handful of different purposes, including:

- API wrapper for the Universal Connect Widget UI
- Search API for institutions
- Resolver API for performance data
- Cache management for the institution list, performance data, and preference data

Before you begin, please follow the steps in the [README.md](../../README.md) at the root of the project.

If you need to debug this service, you can run

    turbo run dev --filter=server

from the root of the project.

You can also debug the docker container for this server. Please refer to the [DOCKER.md](../../DOCKER.md) readme at the root of the project

We have an [internal open api spec](./openApiInternal.json) that is not meant to be called directly by customers trying to make connections
