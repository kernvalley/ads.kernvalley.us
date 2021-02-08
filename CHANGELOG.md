<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add Play Store link in footer
- Redirect for `/contact` -> `https://contact.kernvalley.us`

### Changed
- Update footer layout
- Use Imgur uploads instead of `data:` URIs for uploading images

## [v1.2.2] - 2020-12-26

### Added
- Add FAQ and help button
- Add button to share ad files
- Implement `accesskey` on `<nav>`/toolbar buttons
- Implement state management for form and ad previews
- Add notice for WFD vendors via `<dialog>`, controlled by `cookieStore`
- `<button is="app-list">` to show KernValley.US apps

### Changed
- Update screenshots
- Update mobile layout to ![screenshot](https://i.imgur.com/97KQRTg.png)
- Update to use uuid-v6 instead of 4
- Update Pexels gallery grid layout
- Make Pexels images responsive images using `srcset`

### Fixed
- Correctly set UUID/identifier/id of ad files
- Remove debugging `console.*` calls
- Fix setting `.selected-image` class on selected Pexels image

### Removed
- Delete unused analytics script
- Remove unused constants in script
- Remove unused / unnecessary entries in SW cache list
- Remove unused icons for `svg-sprite-generator`

## [v1.2.1] - 2020-10-24

### Added
- Add support for dropping ad files into form
- Add support for Native Filesystem API
- Create, Open, Save, and Save as Buttons

### Changed
- Add buttons and icons to `<nav>`
- Re-style `<nav>` to be useful as a toolbar
- Add proper `role` and accessibility attributes to `<svg>` icons
- Use Adwaita inspired theme for `<nav>` and buttons
- Hide `<header>`
- Move `<button is="pwa-install">` to `<nav>` for better visibility

### Removed
- Submit and Reset buttons for ad form

## [v1.2.0] - 2020-10-23

### Added
- Include ad identifier / UUID
- Implement experimental file handler API
- `fileInfo` constant for file extension and type 

### Changed
- Download/share as custom JSON format(`application/krv-ad+json`) with ext: `".krvad"`
- Allow `cookieStore` as a global via eslint

### Fixed
- Do not set advanced options unless toggled/enabled

## [v1.1.8] - 2020-10-08

### Added
- Selection of stock images from Pexels

### Changed
- Improve `maxlength` and `pattern`s to match expected values
- Make sidebar ad previews `position: sticky`
- Update screenshot

## [v1.1.7] - 2020-10-13

### Added
- Implement handling of ad custom colors, etc.

## [v1.1.6] - 2020-10-10

### Added
- Jumplist / shortcuts with to create ads of specified layout

### Fixed
- Correctly set active button background color
- Remove duplicate images

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
