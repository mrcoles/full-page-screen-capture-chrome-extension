
function onMessage(request, sender, callback) {
    if (request.msg == 'scrollPage') {
        getPositions(callback);
    }
}

if (!window.hasScreenCapturePage) {
    window.hasScreenCapturePage = true;
    chrome.extension.onRequest.addListener(onMessage);
}

function getPositions(cb) {
    var body = document.body,
        fullWidth = document.width,
        fullHeight = document.height,
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        originalX = window.scrollX,
        originalY = window.scrollY,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - yDelta + 1,
        xPos,
        numArrangements;

    while (yPos > -yDelta) {
        xPos = 0;
        while (xPos < fullWidth) {
            arrangements.push([xPos, yPos]);
            xPos += xDelta;
        }
        yPos -= yDelta;
    }

    /** * /
    console.log('fullHeight', fullHeight, 'fullWidth', fullWidth);
    console.log('windowWidth', windowWidth, 'windowHeight', windowHeight);
    console.log('xDelta', xDelta, 'yDelta', yDelta);
    var arText = [];
    arrangements.forEach(function(x) { arText.push('['+x.join(',')+']'); });
    console.log('arrangements', arText.join(', '));
    /**/

    numArrangements = arrangements.length;

    (function scrollTo() {
        if (!arrangements.length) {
            window.scrollTo(originalX, originalY);
            chrome.extension.sendRequest({msg: 'openPage'}, function(response) {
            });
            return cb && cb();
        }

        var next = arrangements.shift(),
            x = next[0], y = next[1];

        window.scrollTo(x, y);

        var data = {
            msg: 'capturePage',
            x: window.scrollX,
            y: window.scrollY,
            width: windowWidth,
            height: windowHeight,
            complete: (numArrangements-arrangements.length)/numArrangements,
            totalWidth: fullWidth,
            totalHeight: fullHeight
        };

        // need to wait for scrollbar to disappear
        window.setTimeout(function() {
            chrome.extension.sendRequest(data, function(captured) {
                if (captured) {
                    // Move on to capture next arrangement.
                    scrollTo();
                }
                else {
                    // If there's an error in popup.js, the response value is undefined.
                    // This happens if the user clicks the page to close the popup. Return
                    // the window to its original scroll position.
                    window.scrollTo(originalX, originalY);
                }
            });
        }, 1000);
    })();
}
