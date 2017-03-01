/**

 * Replace @ref fields and array elements with referenced object.  Recursively
 * traverse JSON object tree in two passes, once to record @id's of objects, and
 * a second pass to replace @ref fields with objects identified by @id fields.
 *
 * @author John DeRegnaucourt
 */

var _impersonation = '';
var _impAppId = '';

function resolveRefs(jObj)
{
    if (!jObj)
        return;

    var idsToObjs = [];

    // First pass, store all objects that have an @id field, mapped to their instance (self)
    walk(jObj, idsToObjs);

    // Replace all @ref objects with the object from the association above.
    substitute(null, null, jObj, idsToObjs);

    idsToObjs = null;
}

function walk(jObj, idsToObjs)
{
    if (!jObj)
        return;

    var keys = Object.keys(jObj); // will return an array of own properties

    for (var i = 0, len = keys.length; i < len; i++)
    {
        var field = keys[i];
        var value = jObj[field];

        if (!value)
            continue;

        if (field === "@id")
        {
            idsToObjs[value] = jObj;
        }
        else if (typeof(value) === "object")
        {
            walk(value, idsToObjs);
        }
    }
}

function substitute(parent, fieldName, jObj, idsToObjs)
{
    if (!jObj)
        return;

    var keys = Object.keys(jObj); // will return an array of own properties

    for (var i = 0, len = keys.length; i < len; i++)
    {
        var field = keys[i];
        var value = jObj[field];

        if (!value)
            continue;

        if (field === "@ref")
        {
            if (parent && fieldName)
            {
                parent[fieldName] = idsToObjs[jObj["@ref"]];
            }
        }
        else if (typeof(value) === "object")
        {
            substitute(jObj, field, value, idsToObjs);
        }
    }
}

/**
 * Get an HTTP GET command URL for use when the Ajax (JSON) command
 * to be sent to the command servlet has a streaming return type.
 * @param target String in the form of 'controller.method'
 * @param args Array of arguments to be passed to the method.
 */
function stream(target, args)
{
	return buildJsonCmdUrl(target) + '?json=' + buildJsonArgs(args);
}

function buildJsonCmdUrl(target)
{
    var pieces = target.split('.');
    if (pieces == null || pieces.length != 2)
    {
        throw "Error: Use 'Controller.method'";
    }
    var controller = pieces[0];
    var method = pieces[1];

    var regexp = /\/([^\/]+)\//g;
    var match = regexp.exec(location.pathname);
    if (match == null || match.length != 2)
    {
        return location.protocol + '//' + location.hostname + ":" + location.port + "/cmd/" + controller + "/" + method;
    }
    var ctx = match[1];
    return location.protocol + '//' + location.hostname + ":" + location.port + "/" + ctx + "/cmd/" + controller + "/" + method;
}

function buildJsonArgs(args)
{
    if (args == null)
    {
        args = [];  // empty args
    }

    return JSON.stringify(args);
}

function exec(target, args, params)
{
    args.push(target);
    return call("ncubeController.execute", args, params);
}

/**
 * Use this to make a RESTful server call.
 * 'target' identifies the server as a Controller and
 * a method (action).
 * 'args' is an array [] of arguments for the given method.
 * 'params' is an option object that allows you to specify the
 * timeout value and a callback function (for asynchronous calls).
 *
 * Example 1:
 *   call("searchController.findSubmission", [1234567]);
 * In this example, an Ajax call is made to the 'searchController', which
 * is the Spring bean name of the destination object.  The method
 * 'findSubmission()' is called, with the parameter '1234567'.
 *
 * Example 2:
 *   call("searchController.findSubmission", [1234567], {timeout: 60000, callback:
 *       function(result)
 *       {
 *       // This function is called when the asynchronous call to the server returns
 *       });
 *
 * The call is made asynchronously when the params object is included *and* the
 * 'callback' field is supplied.
 */
function call(target, args, params) {
    var async, url, json, result;
    if (!params)
    {   // Create an empty params object
        params = {};
    }
    if (!params.hasOwnProperty('timeout'))
    {
        params.timeout = 60000;
    }
    if (!params.hasOwnProperty('noResolveRefs'))
    {
        params.noResolveRefs = false;
    }
    if (params.hasOwnProperty('fakeuser')) {
        _impersonation = params.fakeuser;
    }
    if (params.hasOwnProperty('appid')) {
        _impAppId = params.appid;
    }
    async = params.hasOwnProperty('callback');
    url = buildJsonCmdUrl(target);
    
    try
    {
        json = buildJsonArgs(args);
    }
    catch (ignored)
    {
        return {status:null,data:"Arguments could not be converted to JSON string."};
    }

    $.ajax({
        type : "POST",
        url : url,
        headers: {
            'fakeuser': _impersonation,
            'appid': _impAppId
        },
        async : async,
        cache : false,
        data : json,
        dataType : "json",
        contentType: "application/json",
        timeout : params.timeout,
        success : function(data, textStatus)
        {
            result = data;
            if (async)
            {
                if (result == null || typeof result == 'undefined' ||
                    result.status == null || typeof result.status == 'undefined')
                {
                    params.callback({status:null,data:'Communications error.  Check your network connection.'});
                }
                else
                {
                    if (params.noResolveRefs == false)
                    {
                        resolveRefs(result.data);
                    }
                    params.callback(result);
                }
            }
        },
        error : function(XMLHttpRequest, textStatus, errorThrown)
        {
            if (async)
            {
                params.callback({status:null,data:textStatus}, errorThrown);
            }
            else
            {
                result = {status:null, data:textStatus};
            }
        }
    });

    if (async)
    {
        return {status:true,data:null};
    }
    else
    {
        if (result == null || typeof result == 'undefined' ||
            result.status == null || typeof result.status == 'undefined')
        {
            return {status:null,data:'Communications error.  Check your network connection.'};
        }

        if (params.noResolveRefs == false)
        {
            resolveRefs(result.data);
        }
        return result;
    }
}
