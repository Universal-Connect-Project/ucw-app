# Title

Automated testing

## Context

We can't have confidence that our product will continue to work when we change things without tests.

## Decision

We will use the following technologies to test:
1. [Cypress](https://www.cypress.io/) for end to end tests and api tests
1. [Jest](https://jestjs.io/) for unit/integration tests
1. [MSW](https://mswjs.io/docs/getting-started/) for api mocking in unit/integration tests

We will mock as little as possible in our tests and [prefer integration tests over unit tests](https://kentcdodds.com/blog/write-tests). The bulk of our tests will be integration tests, because they provide the best performance to confidence ratio.

The purpose of our end to end tests will be to validate that the frontend is working with the backend properly, and that apis are working together properly. We don't need to test every edge case in our end to end tests, because using MSW allows us to test those edge cases in our integration tests.

The purpose of our tests is to give us confidence to make changes without breaking things. We will write enough tests that we can be confident in deploying changes without manual testing.

## Consequences

Contributors will need some time to learn the prescribed testing technologies. It will take more time to contribute to the repository.

We will be able to make changes without the fear of breaking things, and our code will be more reliable.