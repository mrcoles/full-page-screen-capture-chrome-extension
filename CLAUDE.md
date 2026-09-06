# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full Page Screen Capture is a Chrome extension (Manifest V2) that captures an entire
web page — not just the visible viewport — by scrolling through the page in tiles,
screenshotting each tile, and stitching the results into one or more full-page PNGs
opened in new tabs.

There is no build step, package manager, bundler, or test suite. This is plain,
unbundled JavaScript loaded directly by the manifest — edit the files in place and
reload the unpacked extension in Chrome to see changes.

## Running / testing changes

There is no CLI build or test command. To manually verify changes:

1. Open `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked extension…" and select this repo's root directory (or click
   the reload icon on the extension if already loaded, after making changes).
3. Click the extension's toolbar icon (or press Alt+Shift+P) on a real web page to
   trigger a capture, and check the new tab(s) that open with the resulting image(s).
4. Use `chrome://extensions` → "background page"/inspect popup, and the page's own
   DevTools console, to see logs from `popup.js`/`api.js` and `page.js` respectively.

To produce a distributable zip of the repo (as tracked by git, respecting
`.gitattributes` export-ignore rules): `./archiver.sh`.

## Architecture

The extension has three cooperating contexts, all connected via
`chrome.runtime`/`chrome.tabs` messaging (no shared module system — everything is
attached to `window`/global scope and loaded via `<script>` tags or
`chrome.tabs.executeScript`):

- **`popup.js`** (runs in the extension popup, loaded via `popup.html`): entry point
  when the user clicks the toolbar icon. Queries the active tab, computes an output
  filename from the tab's URL, and calls into `CaptureAPI.captureToFiles`. Also owns
  UI state transitions in `popup.html` (loading bar, split-image warning, error
  states) and opens the resulting image(s) in new tab(s) — handling the incognito
  case specially, since the filesystem API used for saving images isn't available in
  incognito windows.

- **`api.js`** (`window.CaptureAPI`, loaded in the popup context): the orchestrator.
  - Validates the tab's URL is capturable (`isValidUrl` — rejects chrome:// pages
    etc., since content scripts can't run there).
  - Injects `page.js` into the target tab via `chrome.tabs.executeScript`, then sends
    it a `scrollPage` message to kick off capture.
  - Listens for repeated `capture` messages from `page.js` (one per scroll position),
    and on each one calls `chrome.tabs.captureVisibleTab` to grab that viewport as a
    PNG, then draws it onto the correct in-memory `<canvas>`(s) at the correct offset.
  - Because Chrome has a maximum canvas size, `_initScreenshots`/`_filterScreenshots`
    split the full page into multiple canvases ("tiles") when the total page
    dimensions exceed `MAX_PRIMARY_DIMENSION`/`MAX_AREA`, and a screenshot segment can
    land on more than one tile.
  - Once all tiles are filled, converts each canvas to a `Blob` and writes it to the
    extension's temporary filesystem (`captureToFiles`/`saveBlob`), returning
    `filesystem:` URLs for the popup to open.

- **`page.js`** (content script, injected into the page being captured): computes the
  full scrollable width/height of the page (`getPositions`, trying several DOM
  properties since pages disagree on which reports the true size), builds a list of
  scroll `arrangements` (x/y positions) needed to tile the whole page given the
  viewport size, then scrolls to each position in turn, sending a `capture` message
  back to `api.js` after each scroll and waiting for its response before moving to
  the next position. Temporarily disables scrollbars/overflow during capture and
  restores the original scroll position and styles afterward (`cleanUp`), including a
  timeout-based fallback cleanup in case a response never arrives.

Key cross-file contract: the `capture` message payload built in `page.js`
(`getPositions`) — `x`, `y`, `windowWidth`, `totalWidth`, `totalHeight`,
`devicePixelRatio` — is exactly what `api.js`'s `capture()` handler expects, including
the on-the-fly scale correction it applies when the actual captured image size doesn't
match `windowWidth` (e.g. due to browser zoom or device-emulation mode).

## Notes

- Manifest V2 — permissions are deliberately minimal (`activeTab`, `storage`,
  `unlimitedStorage`); avoid adding broader permissions without a clear need, per the
  project's history of using minimal/restrictive permissions (see `CHANGES.md`).
- Icon/asset filenames ending in `-999` (e.g. `icon-999.png`) are the currently active
  icon set referenced by `manifest.json`; the non-`-999` counterparts are alternates
  kept in the repo.
- `CHANGES.md` is the user-facing changelog shown in the Chrome Web Store listing —
  update it (and `manifest.json`'s `version`) when making a release-worthy change.
