// Copyright (c) 2012 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE

//
// console object for debugging
//
var console = (function() {
    var par = document.getElementById('wrap'),
        log = document.createElement('div');
    par.appendChild(log);

    return {
        log: function() {
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
            log.appendChild(p);
        }
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
var content_scripts = chrome.app.getDetails().content_scripts;
if (content_scripts.length > 1) {
    throw new Error('Number of content scripts has changed! Update!');
}
var matches = content_scripts[0].matches;
var noMatches = [
    /^https?:\/\/chrome.google.com\/.*$/
    ];
function testURLMatches(url) {
    var r, i, success = false;
    for (i=noMatches.length-1; i>=0; i--) {
        if (noMatches[i].test(url)) {
            return false;
        }
    }
    for (i=matches.length-1; i>=0; i--) {
        r = new RegExp("^" + matches[i].replace(/\*/g, '.*') + '$');
        if (r.test(url)) {
            success = true;
        }
    }
    return success;
}


//
// Events
//
var screenshot, contentURL = '';

function sendScrollMessage() {
    chrome.tabs.getSelected(null, function(tab) {
        contentURL = tab.url;
        if (testURLMatches(tab.url)) {
            show('loading');
            screenshot = {};
            chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function(response) {});
        } else {
            show('invalid');
        }
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
    name = 'screencapture' + name + '.png';

    // create a blob for writing to a file
    var blob = bb.getBlob(mimeString);
    window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
        fs.root.getFile(name, {create:true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.write(blob);
            }, function() {});
        }, function() {});
    }, function() {});

    // open the file that now contains the blob
    window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/' + name);
}

// start doing stuff immediately!
sendScrollMessage();
