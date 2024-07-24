# Contributing

## Requesting a feature

If you have an idea for an improvement to the code or the docs, then we encourage you to open an issue as a first step to discuss your proposed changes with the maintainers before proceeding. The maintainers will review requests on a regular basis.

If the maintainers agree that the feature is something that should be included in the project, and they want the community to implement the feature, then it will be marked as "ready for technical design". At this point a member of the community can comment on the issue that they are going to work on the technical design. After a draft of technical design is complete, then a review can be requested from the maintainers. If the technical design is accepted, then the maintainers will either mark it as "ready to take"(anyone can pick it up) or "maintainers only" if they want to implement it.

If the maintainers agree that the feature is something that should be included in the project and they want to implement it themselves, then they will mark the issue as "maintainers only".

It's possible that a feature request will be denied if it doesn't match the vision of the project, or postponed if it's not the right time. If a requested feature is denied, then you're welcome to fork the repo to make whatever changes you want.

## Standard of quality

We strive to maintain a high standard of quality. We want users of our software to have a good and reliable experience. We want people contributing to our code to have a good and reliable experience. You should expect to receive feedback on your pull requests and not blind approvals.

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. You'll need to read our ADRs before contributing. We maintain [Organization-level ADRs](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords), and [Repository-level ADRs](./architectureDecisionRecords).

For a PR to be considered ready to merge it must adhere to the ADRs.

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
