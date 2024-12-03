# Contributing

## Requesting a feature

If you have an idea for an improvement to the code or the docs, then we encourage you to open an issue as a first step to discuss your proposed changes with the maintainers before proceeding. The maintainers will review requests on a regular basis.

If the maintainers agree that the feature is something that should be included in the project and they want to implement it themselves, then they will mark the issue as "maintainers only".

If the maintainers agree that the feature should be included in the project, and they want the community to implement the feature, then it could be marked in two ways: "ready to take" or "ready for technical design"

If a feature is marked "ready for technical design", then the scope of the issue is probably large, and the maintainers want to ensure that the technical design fits with the project. After an issue is marked in this way a member of the community can comment on the issue to claim the technical design. The [technical design template](./technicalDesignTemplate.md) may be used. After a draft of technical design is complete, then a review can be requested from the maintainers. If the technical design is accepted, then the maintainers will either mark it as "ready to take"(anyone can pick it up) or "maintainers only" if they want to implement it.

If a feature is marked "ready to take", then anyone from the community can comment on the issue to claim it and start implementation.

It's possible that a feature request will be denied if it doesn't match the vision of the project, or postponed if it's not the right time. If a requested feature is denied, then you're welcome to fork the repo to make whatever changes you want.

## Versioning

We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Every pull request needs to include an incremental version update following the semantic versioning guidelines:

Given a version number MAJOR.MINOR.PATCH, increment the:

1. MAJOR version when you make incompatible changes
2. MINOR version when you add functionality in a backward compatible manner
3. PATCH version when you make backward compatible bug fixes

In addition to updating the version, an update to the [Changelog](CHANGELOG.md) is required. Instructions for updating the changelog are documented in the [CHANGELOG.md](CHANGELOG.md) file.

## Standard of quality

We strive to maintain a high standard of quality. We want users of our software to have a good and reliable experience. We want people contributing to our code to have a good and reliable experience. You should expect to receive feedback on your pull requests and not blind approvals.

We use [architecture decision records](https://adr.github.io/) to make, document, and enforce our decisions. You'll need to read our ADRs before contributing. We maintain [Organization-level ADRs](https://github.com/Universal-Connect-Project/ucw-app/tree/main/architectureDecisionRecords), and [Repository-level ADRs](./architectureDecisionRecords).

For a PR to be considered ready to merge it must adhere to the ADRs.

## Aggregator Adapter Packages

If you are an aggregator, and would like to create your own adapter package that can be used with the UCW, See [ADAPTERS.md](ADAPTERS.md) for more info.
