# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.1]

### Fixed

- Security vulerabilities in package dependencies are patched and updated.
- axios proxy for mx-adapter

## [1.12.0]

### Changed

- Improved performance measurement.
- Performance session ids are now created when loading an institution.
- Only performance sessions that have been marked with shouldRecordResult will be stored in the performance service.
- Sessions are marked with shouldRecordResult on fetch institution failure, fetch institution credentials failure, fetch OAuth link failure, credentials submission, and clicking on an OAuth link.

## [1.11.2]

### Changed

- Performance resilience to only poll when there are active sessions. Reducing load on Redis by not polling continuously every 5 seconds.

## [1.11.1]

### Fixed

- Sophtron performance resilience bug where it wasn't getting the status properly

## [1.11.0]

### Added

- Connection Cleanup Feature see [ENVIRONMENT.md](ENVIRONMENT.md#automatic-connection-cleanup-variables-optional-defaults-to-disabled) for details on environment variables related to connection cleanup.

### Fixed

- Unneccessary error catching was not preventing the performance polling from starting.
- More user friendly error message to help understand why performance is not syncing.

## [1.10.2]

### Added

- Added methods for auto connection cleanup to prepare for new feature implementation.

## [1.10.1]

### Updated

- DeleteConnection methods on aggregator adapters in preparation for auto connection cleanup feature.

## [1.10.0]

### Added

- Basic Plaid Integration: make a connection.
- No performance tracking for Plaid.

## [1.9.2]

### Added

- more information on UCP API Keys and updating institutions to the readme.

## [1.9.1]

### Removed

- performance event tracking calls when a connection is being refreshed.

## [1.9.0]

### Added

- added connection status polling on the backend to accurately get performance even if a user leaves the widget before the UI says a connection is complete.

## [1.8.6]

### Added

- more E2E tests for aggregatorOverride.

### Fixed

- Issue with not being able to use aggregatorOverride for test institutions.

### Updated

- Code and E2E improvements for aggregatorOverride.

## [1.8.5]

### Added

- `aggregatorOverride` query parameter to the widget endpoint to enforce that a specific aggregator is used. This is for internal use only and will not be documented in the public API.

## [1.8.4]

### Fixed

- Fixed a potential issue when targetOrigin isn't specified.

### Added

- Documentation for the targetOrigin parameter

## [1.8.3]

### Fixed

- Issue #248 postMessage doesn't have proper target parameter

## [1.8.2]

### Added

- Local performance events to connect flow.

## [1.8.1]

### Updated

- Recommended demo institutions

## [1.8.0]

### Added

- Transaction history support for Finicity.

## [1.7.6]

### Added

- Added height style to html, body, and root elements to ensure the widget is always full height.

## [1.7.5]

### Added

- Methods for resilient performance tracking.

## [1.7.4]

### Added

- Added an environment variable to customize the SameSite attribute of the authorization token cookie

## [1.7.3]

### Fixed

- Moved style files for the widget before the authentication happens so that the widget is able to load.

## [1.7.2]

### Removed

- Dependence on two environment variables which indicate that an environment is production: `ENV=prod` and `PRODUCTION=true`. Now just `ENV=prod` is all that's required for the production environment.

## [1.7.1]

### Fixed

- Fixed node version to 22.x so that it wont attempt to use v24.x on new deployments which fails.

## [1.7.0]

### Added

- Added performance tracking events to track aggregator performance

## [1.6.4]

### Added

- Added more status info in sophtron adapter events

## [1.6.3]

### Added

- Added the UCP api keys to the environment readme.

## [1.6.2]

### Changed

- Updated the institution and performance service urls to the new domains.

## [1.6.1]

### Fixed

- Fixed bug where sophtron adapter was unable to handle multiple security question challenge.

### Changed

- Updated the auth token urls to use the new domains.

## [1.6.0]

### Added

- Added the ability to pass in a date range in transaction requests from the data endpoints.

## [1.5.1]

### Fixed

- Fixed bug where oauth landing page said "Something went wrong" after everything went right.
- Fixed bug where memberConnected postMessage wasn't returning correct member_guid after successful connection with Finicity.

## [1.5.0]

### Removed

- Removed the test adapters and replaced the tests with other aggregators

## [1.4.1]

### Fixed

- Fixed "refresh connection" for Finicity connections
- Fixed "refresh connection" for MX OAuth connections
- Fixed create new connection logic for MX users attempting to make multiple connections to the same institution

## [1.4.0]

### Changed

- Downloaded an updated institution list from production that doesn't include test banks. Now loading test banks from a file in ucw-app

## [1.3.1]

### Changed

- Downloaded updated institution list from production

## [1.3.0]

### Added

- Added Finicity Aggregator support

## [1.2.1]

### Added

- Now failing data requests if the userId isn't valid

## [1.2.0]

### Added

- Refreshing a connection now requires the ucp institution id.

### Changed

- No longer using names, urls, or logo urls from aggregators when refreshing a connection.

## [1.1.0]

### Added

- Added Akoya adapter partial support

## [1.0.10]

### Changed

- Now passing custom events to the connect widget for member status update and member connected events. Added some sophtron specific values for member status update.

## [1.0.9]

### Fixed

- Fixed playwright test happening before the server was ready

## [1.0.8]

### Changed

- Changed the structure of the institution endpoints to move away from the connectApi pattern

## [1.0.7]

### Changed

- Imported the Sophtron adapter as an internal package

## [1.0.6]

### Changed

- Imported the MX adapter as an internal package

## [1.0.5]

### Changed

- Setting HOST_URL is automatic when deployed to Herkou

## [1.0.4]

### Changed

- Using new version of the mx adapter
- Oauth endpoints are no longer using the default authentication

### Removed

- Endpoints that are no longer relevant including analytics endpoints

## [1.0.3]

### Changed

- Stripped the handle oauth endpoints to only what's necessary. Fixed the test example oauth flow and tests.

## [1.0.2]

### Changed

- Updating package versions from the alpha versions.

## [1.0.1]

### Changed

- Changing generateDataTests to expect data depending on the job type.

## [1.0.0]

### Changed

- Changing from a set list of 5 job types to a combo jobs format. There are 4 standardized job types that can be used in any combination. These job types are translated in each adapter to work with each aggregator.
- All parameters in the open api spec are now camel case.
- Using a vastly updated [connect widget npm package](https://www.npmjs.com/package/@mxenabled/connect-widget)
- The member connected event post message is changed to `connect/memberConnected`
- Using new adapters that work with all the new changes

## [0.0.1]

### Added

- workflow to check that version and changelog get updated on every pull request.

## [Unreleased]

### Added

- Changelog
- Semantic Versioning to root package.json
- Documentation for changelog and versioning in CONTRIBUTING.md

[unreleased]: https://github.com/Universal-Connect-Project/ucw-app/compare/v0.0.0...HEAD
