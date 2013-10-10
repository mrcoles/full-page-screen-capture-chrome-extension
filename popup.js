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

function getName(url) {
    // come up with a filename to store the image into.
    var name = url.split('?')[0].split('#')[0];
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
    return 'screencapture' + name + '.png';
}

function displayCapture(filename) {
    window.open(filename);
}

function errorHandler(reason) {
    console.error('error: ', reason);
    hide('loading');
    if (reason === 'invalid url') {
        show('invalid');
    }
    else {
        show('uh-oh');
    }
}

function progress(complete) {
    if (complete === 0) {
        // Page capture has just been initiated.
        show('loading');
    }
    else {
        $('bar').style.width = parseInt(complete * 100, 10) + '%';
    }
}

// start doing stuff immediately!
chrome.tabs.getSelected(null, function(tab) {
    var filename = getName(tab.url);
    pageCaptureAPI().captureToFile(tab, filename, displayCapture, errorHandler, progress);
});
