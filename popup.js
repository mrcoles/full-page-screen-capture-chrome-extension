// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE


//
// console object for debugging
//

var log = (function() {
    var parElt = document.getElementById('wrap'),
        logElt = document.createElement('div');
    logElt.id = 'log';
    logElt.style.display = 'block';
    parElt.appendChild(logElt);

    return function() {
        var a, p, results = [];
        for (var i=0, len=arguments.length; i<len; i++) {
            a = arguments[i];
            try {
                a = JSON.stringify(a, null, 2);
            } catch(e) {}
            results.push(a);
        }
        p = document.createElement('p');
        p.innerText = results.join(' ');
        p.innerHTML = p.innerHTML.replace(/ /g, '&nbsp;');
        logElt.appendChild(p);
    };
})();


//
// Utility methods
//

function $(id) { return document.getElementById(id); }
function show(id) { $(id).style.display = 'block'; }
function hide(id) { $(id).style.display = 'none'; }


//
// URL Matching test - to verify we can talk to this URL
//

var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

function testURLMatches(url) {
    // couldn't find a better way to tell if executeScript
    // wouldn't work -- so just testing against known urls
    // for now...
    var r, i;
    for (i=noMatches.length-1; i>=0; i--) {
        if (noMatches[i].test(url)) {
            return false;
        }
    }
    for (i=matches.length-1; i>=0; i--) {
        r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
        if (r.test(url)) {
            return true;
        }
    }
    return false;
}


//
// Events
//

var screenshots,
    contentURL = '',
    // max dimensions based off testing limits of screen capture
    MAX_PRIMARY_DIMENSION = 30000 * 2,
    MAX_SECONDARY_DIMENSION = 4000 * 2,
    MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;


function sendScrollMessage(tab) {
    contentURL = tab.url;
    screenshots = null;
    chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, function() {
        // We're done taking snapshots of all parts of the window. Display
        // the resulting full screenshot images in a new browser tab.
        openPage();
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.msg === 'capturePage') {
        capturePage(request, sender, callback);
        return true;
    } else {
        console.error('Unknown message received from content script: ' + request.msg);
        return false;
    }
});

function capturePage(data, sender, callback) {
    $('bar').style.width = parseInt(data.complete * 100, 10) + '%';

    chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    data.image = {width: image.width, height: image.height};

                    // given device mode emulation or zooming, we may end up with
                    // a different sized image than expected, so let's adjust to
                    // match it!
                    if (data.windowWidth !== image.width) {
                        var scale = image.width / data.windowWidth;
                        data.x *= scale;
                        data.y *= scale;
                        data.totalWidth *= scale;
                        data.totalHeight *= scale;
                    }

                    // lazy initialization of screenshot canvases (since we need to wait
                    // for actual image size)
                    if (!screenshots) {
                        screenshots = _initScreenshots(data.totalWidth, data.totalHeight);
                    }

                    // draw it on matching screenshot canvases
                    _filterScreenshots(
                        data.x, data.y, image.width, image.height, screenshots
                    ).forEach(function(screenshot) {
                        screenshot.ctx.drawImage(
                            image,
                            data.x - screenshot.left,
                            data.y - screenshot.top
                        );
                    });

                    // send back log data for debugging (but keep it truthy to
                    // indicate success)
                    callback(JSON.stringify(data, null, 4) || true);
                };
                image.src = dataURI;
            }
        });
}

function _initScreenshots(totalWidth, totalHeight) {
    // Create and return an array of screenshot objects based
    // on the `totalWidth` and `totalHeight` of the final image.
    // We have to account for multiple canvases if too large,
    // because Chrome won't generate an image otherwise.
    //
    var badSize = ((totalHeight > MAX_PRIMARY_DIMENSION &&
                    totalWidth > MAX_SECONDARY_DIMENSION) ||
                   (totalWidth > MAX_PRIMARY_DIMENSION &&
                    totalHeight > MAX_SECONDARY_DIMENSION) ||
                   (totalHeight * totalWidth > MAX_AREA)),
        biggerWidth = totalWidth > totalHeight,
        maxWidth = (!badSize ? totalWidth :
                    (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION)),
        maxHeight = (!badSize ? totalHeight :
                     (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION)),
        numCols = Math.ceil(totalWidth / maxWidth),
        numRows = Math.ceil(totalHeight / maxHeight),
        row, col, canvas, left, top;

    var canvasIndex = 0;
    var result = [];

    for (row = 0; row < numRows; row++) {
        for (col = 0; col < numCols; col++) {
            canvas = document.createElement('canvas');
            canvas.width = (col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
            canvas.height = (row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);

            left = col * maxWidth;
            top = row * maxHeight;

            result.push({
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                index: canvasIndex,
                left: left,
                right: left + canvas.width,
                top: top,
                bottom: top + canvas.height
            });

            canvasIndex++;
        }
    }

    return result;
}

function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
    // Filter down the screenshots to ones that match the location
    // of the given image.
    //
    var imgRight = imgLeft + imgWidth,
        imgBottom = imgTop + imgHeight;
    return screenshots.filter(function(screenshot) {
        return (imgLeft < screenshot.right &&
                imgRight > screenshot.left &&
                imgTop < screenshot.bottom &&
                imgBottom > screenshot.top);
    });
}

function openPage(screenshotIndex) {
    // Create an image blob and open in a new tab.
    // If multiple screenshots, then loop through each,
    // opening the final one.
    //
    // Also, standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27
    //
    screenshotIndex = screenshotIndex || 0;

    var dataURI = screenshots[screenshotIndex].canvas.toDataURL();

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

    // create a blob for writing to a file
    var blob = new Blob([ab], {type: mimeString});

    // come up with file-system size with a little buffer
    var size = blob.size + (1024/2);

    // come up with a filename
    var name = contentURL.split('?')[0].split('#')[0];
    if (name) {
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    } else {
        name = '';
    }
    name = ('screencapture' + name +
            '-' + Date.now() +
            (screenshots.length > 1 ? '-' + screenshotIndex : '') +
            '.png');

    function onwriteend() {
        // open the file that now contains the blob - calling
        // `openPage` again if we had to split up the image
        var urlName = ('filesystem:chrome-extension://' +
                       chrome.i18n.getMessage('@@extension_id') +
                       '/temporary/' + name);
        var last = screenshotIndex === screenshots.length - 1;
        chrome.tabs.create({url: urlName, active: last});
        if (!last) {
            openPage(screenshotIndex + 1);
        }
    }

    function errorHandler() {
        show('uh-oh');
    }

    // create a blob for writing to a file
    var reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    reqFileSystem(window.TEMPORARY, size, function(fs){
        fs.root.getFile(name, {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = onwriteend;
                fileWriter.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}


//
// start doing stuff immediately! - including error cases
//

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    if (testURLMatches(tab.url)) {
        var loaded = false;

        chrome.tabs.executeScript(tab.id, {file: 'page.js'}, function() {
            loaded = true;
            show('loading');
            sendScrollMessage(tab);
        });

        window.setTimeout(function() {
            if (!loaded) {
                show('uh-oh');
            }
        }, 1000);
    } else {
        show('invalid');
    }
});
