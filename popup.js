// Copyright (c) 2012 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE

button = document.getElementById('capture');
button.addEventListener('click', function() {
    $('main').style.display = 'none';
    $('loading').style.display = 'block';
    sendScrollMessage();
    return false;
});

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
                    callback();
                };
                image.src = dataURI;
            }
        });
}

function openPage() {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    //take apart data URL
    var parts = screenshot.canvas.toDataURL().match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);

    // //assume base64 encoding
    var binStr = atob(parts[3]);

    //convert to binary in ArrayBuffer
    var buf = new ArrayBuffer(binStr.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < view.length; i++) {
        view[i] = binStr.charCodeAt(i);
    }

    var builder = new WebKitBlobBuilder();
    builder.append(buf);

    //create blob with mime type, create URL for it
    var URL = webkitURL.createObjectURL(builder.getBlob(parts[1]));

    window.open(URL);
}
