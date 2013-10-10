var pageCaptureAPI = function() {

    var injectedCaptureFilename = 'page.js',
        matches = [/^https?:\/\/.*\//, /^ftp:\/\/.*\//, /^file:\/\/.*\//],
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

        inject = function(tab, callback) {
            // Inject the capture script into the given tab. Call the
            // callback with a Boolean to indicate success or failure.
            var loaded = false,
                timeout = 1000,
                timedOut = false;

            // Inject the capture content script into the tab.
            chrome.tabs.executeScript(tab.id, {file: injectedCaptureFilename}, function() {
                if (!timedOut) {
                    loaded = true;
                    callback(true);
                }
            });

            // Return a false value if the injection doesn't complete quickly enough.
            window.setTimeout(
                function() {
                    if (!loaded) {
                        console.error('Timed out too early while waiting for ' +
                                      'chrome.tabs.executeScript. Try increasing the timeout.');
                        timedOut = true;
                        callback(false);
                    }
                },
                timeout);
        },

        requestArrangement = function(port) {
            port.postMessage('send arrangement');
        },

        capture = function(data, screenshot, port) {
            if (!screenshot.canvas) {
                screenshot.canvas = document.createElement('canvas');
                screenshot.canvas.width = data.totalWidth;
                screenshot.canvas.height = data.totalHeight;
                screenshot.ctx = screenshot.canvas.getContext('2d');
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
                            // Ask the injected code to send us another arrangement.
                            requestArrangement(port);
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

            var dataURI = screenshot.canvas.toDataURL(),
                // convert base64 to raw binary data held in a string
                // doesn't handle URLEncoded DataURIs
                byteString = atob(dataURI.split(',')[1]),
                // separate out the mime component
                mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
                // write the bytes of the string to an ArrayBuffer
                ab = new ArrayBuffer(byteString.length),
                ia = new Uint8Array(ab),
                i;

            for (i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ab], {type: mimeString});
        },

        saveBlob = function(blob, filename, callback, errback) {
            var onWriteEnd = function() {
                // Return the name of the file that now contains the blob.
                callback('filesystem:chrome-extension://' + chrome.runtime.id + '/temporary/' + filename);
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
            var screenshot = {};

            callback = callback || function(){};
            errback = errback || function(){};
            progress = progress || function(){};

            if (!validURL(tab.url)) {
                errback('invalid url');
                return;
            }

            // Set up to receive and process messages from the content
            // script we'll inject into the tab.
            chrome.runtime.onConnect.addListener(function(port) {
                // Check details of the port to ensure we don't react to
                // anything we should ignore.  A chrome.runtime.connect
                // call not meant for us *must* be ignored. Do not close
                // the port, do not call the errback.
                if (port.name === 'page capture' && port.sender.id === chrome.runtime.id && port.sender.url === tab.url) {
                    port.onMessage.addListener(function(request) {
                        if (request.msg === 'capture') {
                            progress(request.complete);
                            capture(request, screenshot, port);
                        }
                        else if (request.msg === 'done') {
                            callback(getBlob(screenshot));
                        }
                        else {
                            console.error('Received unknown request from ' + injectedCaptureFilename + ': ', request);
                            port.disconnect();
                            errback('internal error');
                        }
                    });

                    // Ask for the first arrangement.
                    requestArrangement(port);
                }
            });

            // Inject capture code into the tab.
            inject(tab, function(injected) {
                if (injected) {
                    // Let our caller know that the capture is about to begin.
                    progress(0);
                }
                else {
                    errback('execute timeout');
                }
            });
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
