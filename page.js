
chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (request.msg == 'scrollPage') {
        getPositions(callback);
    }
});


function getPositions(cb) {
    var body = document.body,
        fullWidth = document.width,
        fullHeight = document.height,
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        cols = Math.ceil(fullWidth / windowWidth),
        rows = Math.ceil(fullHeight / windowHeight),
        arrangements = [],
        numArrangements,
        canvas = document.createElement('canvas'),
        ctx;
    canvas.width = fullWidth;
    canvas.height = fullHeight;
    ctx = canvas.getContext('2d');

    /*
    console.log('doc', doc, 'body', body);
    console.log('fullWidth', fullWidth, 'fullHeight', fullHeight);
    console.log('windowWidth', windowWidth, 'windowHeight', windowHeight);
    console.log('rows', rows, 'cols', cols);
    */
    for (var r=rows-1; r>=0; r--) {
        for (var c=cols-1; c>=0; c--) {
            arrangements.push([r,c]);
        }
    }

    numArrangements = arrangements.length;

    (function scrollTo() {
        if (!arrangements.length) {
            window.scrollTo(0, 0);
            chrome.extension.sendRequest({msg: 'openPage'}, function(response) {
            });
            return cb && cb();
        }

        var next = arrangements.shift(),
            r = next[0] * windowHeight, c = next[1] * windowWidth;

        window.scrollTo(c, r);

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

        return window.setTimeout(function() {
            chrome.extension.sendRequest(data, function(response) {
                scrollTo();
            });
        }, 1000);
    })();
}
