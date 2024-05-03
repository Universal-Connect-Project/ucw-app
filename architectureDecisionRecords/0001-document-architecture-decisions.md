# Title

Document architecture decisions

## Context

It is unclear to engineers what the expectations are for contributing to our repository. We need a system for making, documenting, and enforcing architecture decisions.

## Decision

We will document our decisions in our repository as architecture decision records. We will follow the template provided in 0000-example.md.

Decisions will be made by consensus. If an ADR is agreed upon by at least 2/3 of the engineers on the team, then it can be added to the repository.

Pull Requests with new code that doesn't adhere to the ADRs will not be approved. High-priority urgent production bugs are an exception to this rule. This exception should be immediately followed up with a PR to fix the code, so that it conforms with the ADRs.

When making changes to code that doesn't conform to the ADRs the following steps should be taken:
1. If feasible update the code to conform to the ADRs
1. If updating the code to conform to the ADRs is too large of a scope, then at minimum create a ticket to fix the issue later, and write tests the cover the new code

## Consequences

Engineers will be able to go to a single place to learn the following
1. What architecture decisions were made and why
1. What libraries should be used
1. What coding patterns and style should be used
1. What expectations will need to be met before a PR can be merged

Pull requests will need conform to the ADRs to be approved. 