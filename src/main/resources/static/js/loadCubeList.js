/**
 * Web Worker thread
 *
 *     This Javascript background thread is used to filter the list of cubes
 * based on the passed in filter string.  The data passed into onmessage(),
 * which comes from a postMessage(), is an array [] of three (3) elements:
 * [0] = cube name filter list (cube names will be reduce to only those that 'contain' these characters, case-ins)
 * [1] = content filter string (cubes will further be reduced to those that have JSON content that 'contain' these characters, case-ins)
 * [2] = ApplicationID { 'app': 'foo', 'version':'1.0.0', 'status':'SNAPSHOT', 'branch':'joe'}
 *
 * @return a stable list of cubes, filtered by the passed in string.
 * @author John DeRegnaucourt
 */

onmessage = function(e) {
    var searchResults, cubes, results, i ,len, infoDto, array, optsString;
    var args = e.data;
    var nameFilter = args[0];
    var searchOptions = args[1];
    var appIdString = JSON.stringify(args[2]);
    var regex = args[3];
    var hasFilter = nameFilter && nameFilter.length;
    var req = new XMLHttpRequest();
    var opts = {
        activeRecordsOnly: true,
        includeTags: searchOptions.tagsInclude,
        excludeTags: searchOptions.tagsExclude
    };
    optsString = JSON.stringify(opts);

    req.open("POST", getSearchUrl(), false);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send('[' + appIdString + ',"' + nameFilter + '","' + searchOptions.contains + '",' + optsString + ']');

    if (req.response) {
        searchResults = JSON.parse(req.response);
        if (searchResults.status) {
            cubes = {};
            results = searchResults.data;
            for (i = 0, len = results.length; i < len; ++i) {
                infoDto = results[i];
                cubes[infoDto.name.toLowerCase()] = infoDto;
                if (hasFilter && regex) {
                    array = regex.exec(infoDto.name);
                    if (array) {
                        infoDto.pos = array.index;
                        infoDto.endPos = array.index + array[0].length;
                    }
                }
            }
            postMessage(cubes);
        }
    }

    function getSearchUrl() {
        var regexp = /\/([^\/]+)\//g;
        var match = regexp.exec(location.pathname);
        var url = location.protocol + '//' + location.hostname + ":" + location.port;

        if (null !== match && 2 === match.length) {
            if ("js" !== match[1])
            {   // Checking for "js" because if that is returned, the app is running without a context.
                url += "/" + match[1];
            }
        }
        url += '/cmd/ncubeController/search';
        return url;
    }
};
