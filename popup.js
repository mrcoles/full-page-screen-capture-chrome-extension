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
// utility methods
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
var screenshot, contentURL = '';
var numOfCanvas = 0, maxCanvasHeight = 30000, maxCanvasWidth = 30000, numOfRows = 0, numOfCols = 0;
function sendScrollMessage(tab) {
    contentURL = tab.url;
    screenshot = {};
    chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function() {
        // We're done taking snapshots of all parts of the window. Display
        // the resulting full screenshot image in a new browser tab.
        openPage(0);
    });
}

function sendLogMessage(data) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, {msg: 'logMessage', data: data}, function() {});
    });
}

chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (request.msg === 'capturePage') {
        capturePage(request, sender, callback);
    } else {
        console.error('Unknown message received from content script: ' + request.msg);
    }
});


function capturePage(data, sender, callback) {
    var canvas;

    $('bar').style.width = parseInt(data.complete * 100, 10) + '%';

    // Get window.devicePixelRatio from the page, not the popup
    var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ?
        1 / data.devicePixelRatio : 1;

    // if the canvas is scaled, then x- and y-positions have to make
    // up for it
    if (scale !== 1) {
        data.x = data.x / scale;
        data.y = data.y / scale;
        data.totalWidth = data.totalWidth / scale;
        data.totalHeight = data.totalHeight / scale;
    }


    if (!screenshot.canvas) {
        numOfCols = Math.ceil(data.totalWidth/ maxCanvasWidth);
        numOfRows = Math.ceil(data.totalHeight/ maxCanvasHeight);
        numOfCanvas = numOfCols * numOfRows;

        screenshot.canvas = [];
        screenshot.ctx = [];
        for (var j = 0 ; j < numOfRows ; j++){
            for (var i = 0 ; i < numOfCols; i++){
                canvas = document.createElement('canvas');
                if (i == numOfCols-1){
                    canvas.width = data.totalWidth % maxCanvasWidth;
                } else {
                    canvas.width = maxCanvasWidth;
                }
                if (j == numOfRows-1){
                    canvas.height = data.totalHeight % maxCanvasHeight;
                } else {
                    canvas.height = maxCanvasHeight;
                }
                screenshot.canvas.push(canvas);
                screenshot.ctx.push(canvas.getContext('2d'));
            }
        }
            
        // sendLogMessage('TOTALDIMENSIONS: ' + data.totalWidth + ', ' + data.totalHeight);

        // // Scale to account for device pixel ratios greater than one. (On a
        // // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
        // if (scale !== 1) {
        //     // TODO - create option to not scale? It's not clear if it's
        //     // better to scale down the image or to just draw it twice
        //     // as large.
        //     screenshot.ctx.scale(scale, scale);
        // }
    }

    // sendLogMessage(data);

    chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    // sendLogMessage('img dims: ' + image.width + ', ' + image.height);
                    var col, row, 
                        startx, starty, 
                        remainWidth, remainHeight, 
                        isWidthOverflow, isHeightOverflow,
                        clipx, clipy,
                        swidth, sheight;

                    col = Math.floor(data.x / maxCanvasWidth);
                    row = Math.floor(data.y / maxCanvasHeight);

                    startx = data.x % maxCanvasWidth;
                    starty = data.y % maxCanvasHeight;

                    remainHeight = image.height;
                    remainWidth = image.width;

                    isWidthOverflow = startx + image.width > maxCanvasWidth;
                    isHeightOverflow = starty + image.height > maxCanvasHeight;

                    clipx = 0;
                    clipy = 0;

                    if (isHeightOverflow){
                        sheight = maxCanvasHeight - starty;
                    } else {
                        sheight = image.height;
                    }

                    while (remainHeight > 0){
                        //settings for 1st col
                        col = Math.floor(data.x / maxCanvasWidth);
                        startx = data.x % maxCanvasWidth;
                        remainWidth = image.width;
                        clipx = 0;

                        if (isWidthOverflow){
                            swidth = maxCanvasWidth - startx;
                        } else {
                            swidth = image.width;
                        }
                        while (remainWidth > 0){
                            screenshot.ctx[numOfCols*row + col].drawImage(image, clipx, clipy, swidth, sheight, startx, starty, swidth, sheight);

                            col = col + 1;
                            startx = 0;
                            remainWidth = remainWidth - swidth;
                            clipx = clipx + swidth;

                            if (remainWidth >= maxCanvasWidth){
                                swidth = maxCanvasWidth;
                            } else {
                                swidth = remainWidth;
                            }
                        }

                        //set next row
                        row = row + 1;
                        starty = 0;
                        remainHeight = remainHeight - sheight;
                        clipy = clipy + sheight;

                        if (remainHeight >= maxCanvasHeight){
                            sheight = maxCanvasHeight;
                        } else {
                            sheight = remainHeight;
                        }
                    }

                    callback(true);
                };
                image.src = dataURI;
            }
        });
}

function openPage(canvasIndex) {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    var dataURI = screenshot.canvas[canvasIndex].toDataURL();

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
    if (numOfCanvas == 1){
        name = 'screencapture' + name + '-' + Date.now() + '.png';
    } else {
        name = 'screencapture' + name + '-' + Date.now() + '-' + canvasIndex + '.png';
    }

    function onwriteend() {
        // open the file that now contains the blob
        //window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name);
        var urlName = 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name;

        if (canvasIndex < numOfCanvas-1){
            chrome.tabs.create({ url: urlName, active: false });
            openPage(canvasIndex+1);
        } else {
            chrome.tabs.create({ url: urlName, active: true });
        }
    }

    function errorHandler() {
        show('uh-oh');
    }

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    // create a blob for writing to a file
    window.requestFileSystem(window.TEMPORARY, size, function(fs){
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

chrome.tabs.getSelected(null, function(tab) {

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
