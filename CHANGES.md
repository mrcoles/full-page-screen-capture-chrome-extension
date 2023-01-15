Screen capture your current page in entirety and reliably!

The simplest way to take a full page screenshot of your current browser window. Click on the extension in your browser bar (or press Alt+Shift+P), watch the extension capture each part of the page, and be transported to a new tab of your image that you can right-click to save-as or just drag to your desktop. No bloat, just a simple way to turn a full web page into an image.

The only way to screenshot the entire page is to scroll to each visible part, so please be patient as it quickly assembles all the pieces. For the rare scenario where your page is too large for Chrome to store it in one image, it will let you know and split it up into just enough images in separate tabs.

This is an open source project. Visit the Full Page Screen Capture Github page for more information, bug reports, or to contribute:

https://github.com/mrcoles/full-page-screen-capture-chrome-extension


Change Log:

```
1.0.1 — 2016-05-14 — fix incognito mode "File not found" bug and better tab handling
1.0.0 — 2016-05-09 — this is a major release: introduces keyboard shortcut, splitting of images for pages that are too long, better handling of zoomed/emulator pages, more subtle gray icon, SVG support, and stability fixes (thank you @bluememory14, @BSierakowski, @denilsonsa, and all submitters of bug reports)
0.0.15 — 2015-04-05 — add timestamp to images so they are unique paths (via @HetIsNiels) and popup display fix
0.0.14 — 2015-02-14 — more “retina” fixes
0.0.13 — 2015-01-02 — remove scale feature to hopefully fix bugs experienced on “retina” displays
0.0.12 — 2014-08-24 — change permissions to more restrictive “activeTab”
0.0.11 — 2014-04-19 — backwards compatible permissions update
0.0.10 — 2014-04-17 — fixed permissions issue that prevents screen capture in Chrome 34
0.0.9 — 2013-12-08 — fixed bugs when the image is pieced together on retina screens
0.0.8 — 2013-11-17 — improved calculation of page width and height on non-standard pages
0.0.7 — 2013-10-10 — 10x speed improvement in capture time and restore to original scroll positions after capture (via @terrycojones)
0.0.6 — 2013-01-26 — Fixed scenario when captured image can load as a broken icon (caused by loading image before it has been written to the file system)
0.0.5 — 2013–01–21 — Fixed small bug in 0.0.4
0.0.4 — 2013–01–21 — Replaced deprecated BlobBuilder with Blob (via @gleitz)
0.0.3 — 2012-11-25 — Removed need to reload pages that were open before the extension is installed.
0.0.2 — 2012-11-21 — Better messaging for pages that can't be screen captured (e.g., content scripts cannot run on the chrome webstore), and the generated image now incorporates the URL into its name.
0.0.1 — 2012-11-06 — Initial release.
```
