# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.3.1]

### Changed

- Update sophtron institutions with correct flags in cached list 


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
