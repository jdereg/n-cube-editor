/**
 * Web Worker thread
 *
 *     This thread is used to call heartBeat on the nCubeController without tying up
 *     the browser during sync checks.  Accepts an object map, the keys being the
 *     tab's cubeinfo (app, version, status, branch, cube)
 *
 * @return map of cubeinfo with modifiers for out of sync or conflict
 * @author Tym Pollack
 */

onmessage = function(e) {
    var result, data, beforeKeys, statuses, status, i, len, key, afterResult, retObj;
    var obj = e.data.obj;
    var req = new XMLHttpRequest();

    req.open('POST', getHeartBeatUrl(), false);
    req.setRequestHeader('Content-Type','application/json');
    req.send(JSON.stringify([obj]));

    if (req.response) {
        result = JSON.parse(req.response);
        if (result.status) {
            data = result.data.compareResults;
            beforeKeys = Object.keys(obj);
            statuses = [];
            for (i = 0, len = beforeKeys.length; i < len; i++) {
                key = beforeKeys[i];
                afterResult = data[key];

                status = null;
                if (null === afterResult) {
                    status = 'conflict';
                }
                else if (false === afterResult) {
                    status = 'out-of-sync';
                }
                statuses.push({key:key, status:status});
            }
            retObj = {obj:statuses, aBuffer:new ArrayBuffer(1024 * 1024)};
            postMessage(retObj, [retObj.aBuffer]);
        }
    }

    function getHeartBeatUrl() {
        var regexp = /\/([^\/]+)\//g;
        var match = regexp.exec(location.pathname);
        var url = location.protocol + '//' + location.hostname + ":" + location.port;

        if (null !== match && 2 === match.length) {
            if ("js" !== match[1])
            {   // Checking for "js" because if that is returned, the app is running without a context (context would be before the "/js").
                url += "/" + match[1];
            }
        }
        url += '/cmd/ncubeController/heartBeat';
        return url;
    }
};
