
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
        originalOverflowStyle = document.documentElement.style.overflow,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - yDelta + 1,
        xPos,
        numArrangements,
        canvas = document.createElement('canvas'),
        ctx;
    canvas.width = fullWidth;
    canvas.height = fullHeight;
    ctx = canvas.getContext('2d');
    // Disable all scrollbars. We'll restore the scrollbar state when we're done
    // taking the screenshots.
    document.documentElement.style.overflow = 'hidden';

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
            document.documentElement.style.overflow = originalOverflowStyle;
            window.scrollTo(0, 0);
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

        // wait for the page to settle after scrolling before asking the
        // background page to take a snapshot.
        window.setTimeout(function() {
            chrome.extension.sendRequest(data, function(response) {
                // when there's an error in popup.js, the
                // response is `undefined`. this can happen
                // if you click the page to close the popup
                if (typeof(response) != 'undefined') {
                    scrollTo();
                }
            });
        }, 100);
    })();
}
