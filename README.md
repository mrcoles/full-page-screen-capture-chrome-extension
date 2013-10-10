Full Page Screen Capture
========================

A simple Google Chrome extension that takes a screen capture of a full web page. Every extension I tried couldn’t do this on Chrome 22 on Mac OSX Lion. So, I built this one to reliably do it. (Not tested, yet, on any other configurations.)

### To Install

From the webstore:

Find the [Full Page Screen Capture App](https://chrome.google.com/webstore/detail/full-page-screen-capture/fdpohaocaechififmbbbbbknoalclacl) in the Chrome Webstore and click install.

Or, for development:

1. Clone this repo
2. Open up Chrome and go to the extensions page (Window → Extensions)
3. Enable developer mode (if it’s not already)
4. Click on “Load unpacked extension…”
5. Select the folder for this app

### Extra notes:

*   For best results, select `View -> Actual Size` in Chrome.
*   Please report any bugs that you find.

### Adding screen captures to your extension

It's simple to extract the capture code to use in your own extension.

* You'll need `api.js` and `page.js`
* Load `api.js` into your extension HTML (see `popup.html` for an example).
* Call `pageCaptureAPI()`, which will give you back a Javascript object
  with 2 functions on it: `captureToBlob` and `captureToFile`, described
  below.

#### captureToBlob

The call signature of `captureToBlob` is

```javascript
captureToBlob(tab, callback, errback, progress);
```

* `tab` is a Chrome
  [Tab](http://developer.chrome.com/extensions/tabs.html#type-Tab)
  object. You'll typically get this from a call to a function like
  [chrome.tabs.getCurrent](http://developer.chrome.com/extensions/tabs.html#method-getCurrent).

* `callback(blob)` (optional): pass a function that will be called with a
  [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) instance
  containing the PNG data of the screen capture.

* `errback(reason)` (optional): pass a function that will be called if an
  error occurs. The `reason` argument can be a string or a
  [FileError](https://developer.mozilla.org/en-US/docs/Web/API/FileError)
  instance. The possible string values are

    * `execute timeout`: the call to inject the `page.js` file into the tab
      timed out.
    * `internal error`: the screen capture logic did something unexpected
      (please report this!).
    * `invalid url`: the URL of the tab is not legal for screen capture
      (due to Chrome restrictions).

* `progress(amount)` (optional): pass a function that will be called to
  indicate progress of the screen capture. The function will be called with
  `0` when screen capture is initiated, which will allow you to do any
  required UI initialization (see `popup.js` for an example). Thereafter,
  `progress` will be called with values that increase to `1.0`.

#### captureToFile

The call signature of `captureToFile` is

```javascript
captureToBlob(tab, filename, callback, errback, progress);
```

* `filename` is the base name of a temporary file to create in the
  browser's file system (see the
  [File API documentation](https://developer.mozilla.org/en-US/docs/Web/API/File)
  for more information).

* `callback` (optional): pass a function that will be called with the full
  pathname of the created file. This will look something like
  `filesystem:chrome-extension:///temporary/fdpohaocaechififmbbbbbknoalclacl/name`
  where the `name` part is the `filename` you passed to `captureToFile`. The
  returned filename is suitable for opening with `window.open` (see
  `popup.js` for an example).
