# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
