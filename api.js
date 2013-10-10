var pageCaptureAPI = function() {

    var matches = [/^https?:\/\/.*\//, /^ftp:\/\/.*\//, /^file:\/\/.*\//],
        noMatches = [/^https?:\/\/chrome.google.com\//],

        validURL = function (url) {
            // URL Matching test - to verify we can talk to this URL.
            // Couldn't find a better way to tell if executeScript would
            // fail -- so just testing against known urls for now.
            var i;
            for (i = 0; i < noMatches.length; i++) {
                if (noMatches[i].test(url)) {
                    return false;
                }
            }
            for (i = 0; i < matches.length; i++) {
                if (matches[i].test(url)) {
                    return true;
                }
            }
            return false;
        },

        initiateCapture = function(tab, callback) {
            // Send a message to the tab to start the capturing positioning
            // so we can take snapshots of the page.
            chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function() {
                callback(); // The capture has completed.
            });
        },

        capture = function(data, screenshot, sendResponse) {
            if (!screenshot.canvas) {
                canvas = document.createElement('canvas');
                canvas.width = data.totalWidth;
                canvas.height = data.totalHeight;
                screenshot.canvas = canvas;
                screenshot.ctx = canvas.getContext('2d');
            }

            // Capture the currently visible part of the tab and save it into
            // the full screenshot we're assembling.
            chrome.tabs.captureVisibleTab(
                null, {format: 'png', quality: 100},
                function(dataURI) {
                    if (dataURI) {
                        var image = new Image();
                        image.onload = function() {
                            screenshot.ctx.drawImage(image, data.x, data.y);
                            // Let the injected page.js code know we've taken
                            // the screenshot so it can move on to the next
                            // arrangement.
                            sendResponse(true);
                        };
                        image.src = dataURI;
                    }
                    else {
                        console.error('Oops! invalid dataURI from captureVisibleTab', dataURI);
                    }
                }
            );
        },

        getBlob = function(screenshot) {
            // standard dataURI can be too big, let's blob instead
            // http://code.google.com/p/chromium/issues/detail?id=69227#c27

            var dataURI = screenshot.canvas.toDataURL();

            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            var byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            var blob = new Blob([ab], {type: mimeString});
            return blob;
        },

        saveBlob = function(blob, filename, callback, errback) {
            var onWriteEnd = function() {
                // Return the name of the file that now contains the blob.
                callback('filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + filename);
            };

            window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
                fs.root.getFile(filename, {create:true}, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = onWriteEnd;
                        fileWriter.write(blob);
                    }, errback);
                }, errback);
            }, errback);
        },

        captureToBlob = function(tab, callback, errback, progress) {
            var loaded = false,
                screenshot = {},
                timeout = 1000,
                timedOut = false;

            callback = callback || function(){};
            errback = errback || function(){};
            progress = progress || function(){};

            if (!validURL(tab.url)) {
                errback('invalid url');
                return;
            }

            chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
                if (request.msg === 'capture') {
                    progress(request.complete);
                    capture(request, screenshot, sendResponse);
                }
                else {
                    console.error('Received unknown request from page.js: ', request);
                    errback('internal error');
                }
            });

            chrome.tabs.executeScript(tab.id, {file: 'page.js'}, function() {
                if (timedOut) {
                    console.error('Timed out too early while waiting for ' +
                                  'chrome.tabs.executeScript. Try increasing the timeout.');
                }
                else {
                    loaded = true;
                    // Let our caller know that the capture is about to begin.
                    progress(0);

                    initiateCapture(tab, function() {
                        // The full screenshot has been taken.
                        callback(getBlob(screenshot));
                    });
                }
            });

            // Call the error function if the execution of page.js doesn't
            // complete quickly enough.
            window.setTimeout(
                function() {
                    if (!loaded) {
                        timedOut = true;
                        errback('execute timeout');
                    }
                },
                timeout);
        },

        captureToFile = function(tab, filename, callback, errback, progress) {
            captureToBlob(tab,
                          function(blob) {
                              saveBlob(blob, filename, callback, errback);
                          },
                          errback, progress);
        };

    return {
        captureToBlob: captureToBlob,
        captureToFile: captureToFile
    };
};
