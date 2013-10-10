(function() {
    var fullWidth = document.width,
        fullHeight = document.height,
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        originalX = window.scrollX,
        originalY = window.scrollY,
        originalOverflowStyle = document.documentElement.style.overflow,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 200 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - yDelta + 1,
        xPos,
        numArrangements,
        cleanUpTimeout,
        port = chrome.runtime.connect({name: 'page capture'}),
        message = {
            msg: 'capture',
            totalWidth: fullWidth,
            totalHeight: fullHeight
        };

    // Disable all scrollbars. We'll restore the scrollbar state when we're done
    // taking the screenshots.
    document.documentElement.style.overflow = 'hidden';

    // Compute all arrangements (scroll locations) that we'll move to so
    // the extension can screenshot the entire page.
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

    function cleanUp() {
        document.documentElement.style.overflow = originalOverflowStyle;
        window.scrollTo(originalX, originalY);
        if (port !== null) {
            port.disconnect();
        }
    }

    function sendArrangement() {
        // Send the next arrangement to the extension.
        window.clearTimeout(cleanUpTimeout);

        if (port === null) {
            // Extension closed the port.
            cleanUp();
            return;
        }

        if (!arrangements.length) {
            port.postMessage({msg: 'done'});
            cleanUp();
            return;
        }

        var next = arrangements.shift(),
            x = next[0], y = next[1];

        window.scrollTo(x, y);
        message.x = window.scrollX;
        message.y = window.scrollY;
        message.complete = (numArrangements-arrangements.length)/numArrangements;

        // Need to wait for things to settle after we scroll.
        window.setTimeout(
            function() {
                // In case we never hear back from the extension, cleanup.
                cleanUpTimeout = window.setTimeout(cleanUp, 750);
                port.postMessage(message);
            },
            100
        );
    }

    port.onDisconnect.addListener(function() {
        // The extension closed the port. This could be due to the user
        // navigating away, closing the tab, etc.
        port = null;
    });

    port.onMessage.addListener(function(message) {
        console.log('received message', message);
        if (message === 'send arrangement') {
            sendArrangement();
        }
        else {
            console.error('Unknown message received from background: ' + message);
        }
    });

})();
