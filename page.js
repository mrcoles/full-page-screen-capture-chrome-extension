
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
        numArrangements;

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

        var ___full_page_screen_capture_selfSetTimeout = function(func, ms, ...args){
            const UUIDGeneratorBrowser = () =>
            ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
            );
            var uuid = UUIDGeneratorBrowser();
            const start = new Date();
            start.setMilliseconds(start.getMilliseconds() + ms);
            var func2 = func;
            if (typeof(window.___full_page_screen_capture_selfSetTimeoutTable) === "undefined") {
                window.___full_page_screen_capture_selfSetTimeoutTable = {};
            }
            window.___full_page_screen_capture_selfSetTimeoutTable[uuid] = true;
            (function check() {
                if (window.___full_page_screen_capture_selfSetTimeoutTable[uuid]) {
                    var current_date = new Date();
                    var seconds_diff = (current_date - start) / 1000;
                    if (seconds_diff >= 0) {
                        delete window.___full_page_screen_capture_selfSetTimeoutTable[uuid];
                        func2(...args);
                    } else {
                        requestAnimationFrame(check);
                    }
                }
                else {
                    delete window.___full_page_screen_capture_selfSetTimeoutTable[uuid];
                }
                
            })()
            return uuid;
        }

        // Need to wait for things to settle
        ___full_page_screen_capture_selfSetTimeout(function() {
            // In case the below callback never returns, cleanup
            var ___full_page_screen_capture_selfSetTimeout = function(func, ms, ...args){
                const UUIDGeneratorBrowser = () =>
                ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
                );
                var uuid = UUIDGeneratorBrowser();
                const start = new Date();
                start.setMilliseconds(start.getMilliseconds() + ms);
                var func2 = func;
                if (typeof(window.___full_page_screen_capture_selfSetTimeoutTable) === "undefined") {
                    window.___full_page_screen_capture_selfSetTimeoutTable = {};
                }
                window.___full_page_screen_capture_selfSetTimeoutTable[uuid] = true;
                (function check() {
                    if (window.___full_page_screen_capture_selfSetTimeoutTable[uuid]) {
                        var current_date = new Date();
                        var seconds_diff = (current_date - start) / 1000;
                        if (seconds_diff >= 0) {
                            delete window.___full_page_screen_capture_selfSetTimeoutTable[uuid];
                            func2(...args);
                        } else {
                            requestAnimationFrame(check);
                        }
                    }
                    else {
                        delete window.___full_page_screen_capture_selfSetTimeoutTable[uuid];
                    }
                    
                })()
                return uuid;
            }
    
            var ___full_page_screen_capture_selfClearTimeout = function(uuid) {
                if (uuid in ___full_page_screen_capture_selfSetTimeoutTable) {
                    ___full_page_screen_capture_selfSetTimeoutTable[uuid] = false;
                }
            }
            var cleanUpTimeout = ___full_page_screen_capture_selfSetTimeout(cleanUp, 1250);

            chrome.runtime.sendMessage(data, function(captured) {
                ___full_page_screen_capture_selfClearTimeout(cleanUpTimeout);
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
