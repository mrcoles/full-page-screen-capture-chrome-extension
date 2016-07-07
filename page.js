
var CAPTURE_DELAY = 150;

function onMessage(data, sender, callback) {
    if (data.msg === 'scrollPage') {
        getPositions(callback);
        return true;
    } else if (data.msg == 'logMessage') {
        console.log('[POPUP LOG]', data.data);
    } else {
        console.error('Unknown message received from background: ' + data.msg);
    }
}

if (!window.hasScreenCapturePage) {
    window.hasScreenCapturePage = true;
    chrome.runtime.onMessage.addListener(onMessage);
}

function max(nums) {
    return Math.max.apply(Math, nums.filter(function(x) { return x; }));
}

function getPositions(callback) {

    var body = document.body,
        originalBodyOverflowYStyle = body ? body.style.overflowY : '',
        originalX = window.scrollX,
        originalY = window.scrollY,
        originalOverflowStyle = document.documentElement.style.overflow;

    // try to make pages with bad scrolling work, e.g., ones with
    // `body { overflow-y: scroll; }` can break `window.scrollTo`
    if (body) {
        body.style.overflowY = 'visible';
    }

    var widths = [
            document.documentElement.clientWidth,
            body ? body.scrollWidth : 0,
            document.documentElement.scrollWidth,
            body ? body.offsetWidth : 0,
            document.documentElement.offsetWidth
        ],
        heights = [
            document.documentElement.clientHeight,
            body ? body.scrollHeight : 0,
            document.documentElement.scrollHeight,
            body ? body.offsetHeight : 0,
            document.documentElement.offsetHeight
            // (Array.prototype.slice.call(document.getElementsByTagName('*'), 0)
            //  .reduce(function(val, elt) {
            //      var h = elt.offsetHeight; return h > val ? h : val;
            //  }, 0))
        ],
        fullWidth = max(widths),
        fullHeight = max(heights),
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - windowHeight,
        xPos,
        numArrangements,
        fixedElements = Array.prototype.filter.call(document.querySelectorAll("body *"), function (el) {
			if (el.style.position === "fixed") {
				el.style.position = "absolute";
				return true;
			}
			return false;
		});

    // During zooming, there can be weird off-by-1 types of things...
    if (fullWidth <= xDelta + 1) {
        fullWidth = xDelta;
    }

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

    /** */
    console.log('fullHeight', fullHeight, 'fullWidth', fullWidth);
    console.log('windowWidth', windowWidth, 'windowHeight', windowHeight);
    console.log('xDelta', xDelta, 'yDelta', yDelta);
    var arText = [];
    arrangements.forEach(function(x) { arText.push('['+x.join(',')+']'); });
    console.log('arrangements', arText.join(', '));
    /**/

    numArrangements = arrangements.length;

    function cleanUp() {
        fixedElements.forEach(function (el) {
			el.style.position = "fixed";
		});
        document.documentElement.style.overflow = originalOverflowStyle;
        if (body) {
            body.style.overflowY = originalBodyOverflowYStyle;
        }
        window.scrollTo(originalX, originalY);
    }

    (function processArrangements() {
        if (!arrangements.length) {
            cleanUp();
            if (callback) {
                callback();
            }
            return;
        }

        var next = arrangements.shift(),
            x = next[0], y = next[1];

        window.scrollTo(x, y);

        var data = {
            msg: 'capture',
            x: window.scrollX,
            y: window.scrollY,
            complete: (numArrangements-arrangements.length)/numArrangements,
            windowWidth: windowWidth,
            totalWidth: fullWidth,
            totalHeight: fullHeight,
            devicePixelRatio: window.devicePixelRatio
        };

        // console.log('>> DATA', JSON.stringify(data, null, 4));

        // Need to wait for things to settle
        window.setTimeout(function() {
            // In case the below callback never returns, cleanup
            var cleanUpTimeout = window.setTimeout(cleanUp, 1250);

            chrome.runtime.sendMessage(data, function(captured) {
                window.clearTimeout(cleanUpTimeout);

                if (captured) {
                    // Move on to capture next arrangement.
                    processArrangements();
                } else {
                    // If there's an error in popup.js, the response value can be
                    // undefined, so cleanup
                    cleanUp();
                }
            });

        }, CAPTURE_DELAY);
    })();
}
