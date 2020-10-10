<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.1.6] - 2020-10-10

### Added
- Jumplist / shortcuts to create ads of specified layout

### Fixed
- Correctly set active button background color

## [v1.1.5] - 2020-10-10

### Changed
- Update layout selection to show SVG previews and use `<input type="radio">`
- Update description `maxlength`

## [v1.1.4] - 2020-10-07

### Added
- `<input type="file">` for handling images by file instead of URL
- Handle resetting for ad form
- Form validation and UX improvements
- `.status-box.alert` warnings for invalid fields

### Changed
- Update app screenshot
- Handle form values on reload (not anything valid for ShareTargetAPI though)
- File downloads + shares now include ad label and datetime

## [v1.1.3] - 2020-10-04

### Added
- `/reset` page for clearing all data

### Changed
- Misc. updates to work with `<ad-block>` updates

## [v1.1.2] - 2020-10-02

### Added
- Handle theme and layout options

### Changed
- Update image fit & position propertry handling

## [v1.1.1] - 2020-10-01

### Added
- Handle fitting and positioning of `<ad-block>` images
- Add option to share (with file where supported) on form submission

## [v1.1.0]

### Changed
- Update to use new `<ad-block>` component
- Set ad image by URL
- Update CSP and preloading

## [v1.0.5]

### Added
- Make submission form a `<form is="share-target">`

### Changed
- Use newer `<ad-block>` component

### Fixed
- Use updated rules for `eslint` (fixes `switch` indentation)

## [v1.0.4]

### Added
- Basic site setup
- Dependabot
- Super Linter
- `<button is="pwa-install">`
- `<github-user>`
- `.nvmrc` for Node versioning
- Implement as `share_target`
- Google Anaytics
- `htmlhint`
- Enable preloading of assets

### Changed
- Dynamically load polyfill and Google Analytics scripts
- Update linting to lint all resources

### Fixed
- Fix CSS for dark mode in build scripts

### Fixed
<!-- markdownlint-restore -->
