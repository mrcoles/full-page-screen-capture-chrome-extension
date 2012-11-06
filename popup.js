// Copyright (c) 2012 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE


function $(id) {
    return document.getElementById(id);
}


var screenshot;

function sendScrollMessage() {
    chrome.tabs.getSelected(null, function(tab) {
        screenshot = {};
        chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function(response) {});
    });
}

chrome.extension.onRequest.addListener(function(request, sender, callback) {
    var fn = {'capturePage': capturePage,
              'openPage': openPage}[request.msg];
    if (fn) {
        fn(request, sender, callback);
    }
});


function capturePage(data, sender, callback) {
    var canvas;

    $('bar').style.width = parseInt(data.complete * 100) + '%';

    if (!screenshot.canvas) {
        canvas = document.createElement('canvas');
        canvas.width = data.totalWidth;
        canvas.height = data.totalHeight;
        screenshot.canvas = canvas;
        screenshot.ctx = canvas.getContext('2d');
    }

    chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    screenshot.ctx.drawImage(image, data.x, data.y);
                    callback(true);
                };
                image.src = dataURI;
            }
        });
}

function openPage() {
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

    // write the ArrayBuffer to a blob, and you're done
    var bb = new window.WebKitBlobBuilder();
    bb.append(ab);

    // create a blob for writing to a file
    var blob = bb.getBlob(mimeString);
    window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
        console.log(fs);
        fs.root.getFile("screenshot.png", {create:true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.write(blob);
            }, function(e) {console.log(e);});
        }, function(e) {console.log(e);});
    }, function(e) {console.log(e);});

    // open the file that now contains the blob
    window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/screenshot.png');
}

// start doing stuff immediately!
sendScrollMessage();
