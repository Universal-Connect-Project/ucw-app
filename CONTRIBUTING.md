# Contributing

## Architecture decision records

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. This repository's ADRs live [here](./architectureDecisionRecords).

We recommend that you read our ADRs before contributing. We maintain [Organization-leve ADRs](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords), and Repository-level ADRs, where necessary.

## Publish to Docker

**Publishing to Docker Hub is automatic, and will happen when code is merged to `main`.**

**IMPORTANT**: Prior to merging your PR to main, make sure the versions of `ui` and `ucw-app` are up-to-date. The `version` property in
their respective `package.json` files should be up-to-date. This is where the versions for the docker images is pulled from
for automated publishing.

## Publishing manually

It is strongly discouraged to publish to Docker Hub manually, however, if you need to publish manually, you can do so with
the following steps.

From the root of the project:

Login to docker hub:

    docker login

_NOTE: You must be a member of the UCP organization on DockerHub._

Run the following, which will set up a new multi-arch builder:

    docker buildx create --use --platform=linux/arm64,linux/amd64 --name multi-platform-builder
    docker buildx inspect --bootstrap

Run the following command, which will build and publish the new images:

    docker buildx bake --file ./docker-compose.yml --push

Note: To update the versions that are pulled/published, update the `./.env` file at the root of the project. Look at
the `DOCKER_IMAGE_{UI|SERVER}` values.

These variables are used in the `./docker-compose.yml` file when building/pulling/publishing the images.
