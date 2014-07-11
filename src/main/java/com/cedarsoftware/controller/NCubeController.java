package com.cedarsoftware.controller;

import com.cedarsoftware.ncube.Axis;
import com.cedarsoftware.ncube.AxisType;
import com.cedarsoftware.ncube.AxisValueType;
import com.cedarsoftware.ncube.BinaryUrlCmd;
import com.cedarsoftware.ncube.GroovyExpression;
import com.cedarsoftware.ncube.GroovyMethod;
import com.cedarsoftware.ncube.GroovyTemplate;
import com.cedarsoftware.ncube.NCube;
import com.cedarsoftware.ncube.NCubeInfoDto;
import com.cedarsoftware.ncube.StringUrlCmd;
import com.cedarsoftware.service.ncube.NCubeService;
import com.cedarsoftware.servlet.JsonCommandServlet;
import com.cedarsoftware.util.CaseInsensitiveSet;
import com.cedarsoftware.util.DateUtilities;
import com.cedarsoftware.util.io.JsonObject;
import com.cedarsoftware.util.io.JsonReader;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * NCubeController API.
 *
 * @author John DeRegnaucourt (jdereg@gmail.com)
 *         <br/>
 *         Copyright (c) Cedar Software LLC
 *         <br/><br/>
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *         <br/><br/>
 *         http://www.apache.org/licenses/LICENSE-2.0
 *         <br/><br/>
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */
public class NCubeController extends BaseController implements INCubeController
{
    private static final Pattern castPattern = Pattern.compile("^(exp:|method:|temp:|b:|\\[b:|s:|\\[s:|i:|\\[i:|L:|\\[L:|f:|\\[f:|d:|\\[d:|c:|\\[c:|z:|\\[z:|bd:|\\[bd:|bi:|\\[bi:|str-url:|bin-url:|exp-url:|method-url:|temp-url:|null:|date:)(.*)", Pattern.CASE_INSENSITIVE);
    private NCubeService nCubeService;

    public NCubeController(NCubeService service)
    {
        nCubeService = service;
    }

    private boolean isAllowed(String app, String version)
    {
        return isAllowed(app, version, "SNAPSHOT");
    }
//new comment
    private static boolean isAllowed(String app, String version, String status)
    {
        return "UD.REF.APP".equals(app) && "0.0.1".equals(version) && "SNAPSHOT".equals(status) || !"UD.REF.APP".equals(app);
    }

    public Object[] getCubeList(String filter, String app, String version, String status)
    {
        try
        {
            Object[] list = nCubeService.getNCubes(filter, app, version, status);
            Arrays.sort(list, new Comparator<Object>()
            {
                public int compare(Object o1, Object o2)
                {
                    NCubeInfoDto info1 = (NCubeInfoDto) o1;
                    NCubeInfoDto info2 = (NCubeInfoDto) o2;
                    return info1.name.compareToIgnoreCase(info2.name);
                }
            });
            return list;
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    public String getHtml(String name, String app, String version, String status)
    {
        try
        {
            return nCubeService.getHtml(name, app, version, status);
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    public String getJson(String name, String app, String version, String status)
    {
        try
        {
            InputStream in = JsonCommandServlet.servletRequest.get().getInputStream();
            OutputStream out = JsonCommandServlet.servletResponse.get().getOutputStream();
            return nCubeService.getJson(name, app, version, status);
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    public Object[] getAppNames()
    {
        try
        {
            return nCubeService.getAppNames();
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    public Object[] getAppVersions(String app, String status)
    {
        try
        {
            return nCubeService.getAppVersions(app, status);
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Create an n-cube (SNAPSHOT only).
     * @return boolean true if successful, otherwise a String error message.
     */
    public void createCube(String name, String app, String version)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }

            NCube ncube = new NCube(name);
            Axis axis = new Axis("Month", AxisType.DISCRETE, AxisValueType.STRING, false, Axis.DISPLAY);
            axis.addColumn("Jan");
            axis.addColumn("Feb");
            axis.addColumn("Mar");
            axis.addColumn("Apr");
            axis.addColumn("May");
            axis.addColumn("Jun");
            axis.addColumn("Jul");
            axis.addColumn("Aug");
            axis.addColumn("Sep");
            axis.addColumn("Oct");
            axis.addColumn("Nov");
            axis.addColumn("Dec");
            ncube.addAxis(axis);
            nCubeService.createCube(ncube, app, version);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Delete an n-cube (SNAPSHOT only).
     * @return boolean true if successful, otherwise a String error message.
     */
    public boolean deleteCube(String name, String app, String version)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited");
                return false;
            }

            if (!nCubeService.deleteCube(name, app, version))
            {
                markRquestFailed("Cannot delete RELEASE n-cube.");
            }
            return true;
        }
        catch (Exception e)
        {
            fail(e);
            return false;
        }
    }

    /**
     * Find all references to an n-cube.  This is an expensive method, as all cubes within the
     * app (version and status) must be checked.
     * @return Object[] of String cube names that reference the named cube, otherwise a String
     * error message.
     */
    public Object[] getReferencesTo(String name, String app, String version, String status)
    {
        try
        {
            Set<String> references = new CaseInsensitiveSet<String>();
            Object[] ncubes = nCubeService.getNCubes("%", app, version, status);

            for (Object ncube : ncubes)
            {
                NCubeInfoDto info = (NCubeInfoDto) ncube;
                Set<String> refs = nCubeService.getReferencedCubeNames(info.name, app, version, status);
                if (refs.contains(name))
                {
                    references.add(info.name);
                }
            }
            references.remove(name);    // do not include reference to self.
            return references.toArray();
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Find all references from (out going) an n-cube.
     * @return Object[] of String cube names that the passed in (named) cube references,
     * otherwise a String error message.
     */
    public Object[] getReferencesFrom(String name, String app, String version, String status)
    {
        try
        {
            Set<String> refs = nCubeService.getReferencedCubeNames(name, app, version, status);
            return refs.toArray();
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Find all referenced input variables for a given n-cube (and through any n-cubes it
     * references).
     * @return Object[] of String names of each scope variable, otherwise a String error message.
     */
    public Object[] getRequiredScope(String name, String app, String version, String status)
    {
        try
        {
            Set<String> refs = nCubeService.getRequiredScope(name, app, version, status);
            return refs.toArray();
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Duplicate the passed in cube, but change the name to newName AND the status of the new
     * n-cube will be SNAPSHOT.
     */
    public void duplicateCube(String newName, String name, String newApp, String app, String newVersion, String version, String status)
    {
        try
        {
            if (!isAllowed(newApp, newVersion))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.duplicateCube(newName, name, newApp, app, newVersion, version, status);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Release the passed in SNAPSHOT version (update their status_cd to RELEASE), and then
     * duplicate all the n-cubes in the release, creating new ones in SNAPSHOT status with
     * the version number set to the newSnapVer.
     */
    public void releaseCubes(String app, String version, String newSnapVer)
    {
        try
        {
            if (!isAllowed(app, "never"))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.releaseCubes(app, version, newSnapVer);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Change the SNAPSHOT version number of an n-cube.
     *
     * @return boolean true if successful, otherwise a String error message.
     */
    public void changeVersionValue(String app, String currVersion, String newSnapVer)
    {
        try
        {
            if (!isAllowed(app, "never"))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.changeVersionValue(app, currVersion, newSnapVer);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Add axis to an existing SNAPSHOT n-cube.
     * @return boolean true if successful, otherwise String error message.
     */
    public void addAxis(String name, String app, String version, String axisName, String type, String valueType)
    {
        try
        {
            nCubeService.addAxis(name, app, version, axisName, type, valueType);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * @return Object[] of JSON structure representing each axis or String error
     * message.  The Axis will look like this:
     * [ { "name":"axisName",
     *     "type":"DISCRETE",
     *     "valueType":"STRING",
     *     "defaultColumn":true | false,
     *     "preferredOrder":0 | 1,
     *     "multiMatch": true | false
     * }, ... ]
     */
    public Object[] getAxes(String name, String app, String version, String status)
    {
        try
        {
            List<Map> axes = nCubeService.getAxes(name, app, version, status);
            return axes.toArray();
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Return the requested axis.  The returned axis has some 'massaging' applied to it before
     * being returned.  First, it is being returned using the 'map-of-maps' format from json-io
     * so that the column IDs can be converted from Longs to Strings, because Javascript cannot
     * process a 64-bit long value (it stores numbers using a double, which means it can only
     * reliably process 53-bits of a long).  Converting the longs to Strings first, allows the
     * column ID to round-trip to the UI and back, and json-io will 'mash' the String column ID
     * into the Long column ID (within the JsonCommandServlet) as it receives the String.  It
     * sense the data-type mismatch (json-io does) and then attempts to convert the String to a
     * numeric value (which succeeds).  This allows the full 64-bit id to make it round trip.
     */
    public Map getAxis(String name, String app, String version, String status, String axisName)
    {
        try
        {
            return nCubeService.getAxis(name, app, version, status, axisName);
        }
        catch (Exception e)
        {
            fail(e);
            return null;
        }
    }

    /**
     * Delete the passed in axis.
     * @return boolean true if successful, otherwise String error message is returned.
     */
    public void deleteAxis(String name, String app, String version, String axisName)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.deleteAxis(name, app, version, axisName);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    public void updateAxis(String name, String app, String version, String origAxisName, String axisName, boolean hasDefault, boolean isSorted, boolean multiMatch)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.updateAxis(name, app, version, origAxisName, axisName, hasDefault, isSorted, multiMatch);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Update an entire set of columns on an axis at one time.  The updatedAxis is not a real axis,
     * but treated like an Axis-DTO where the list of columns within the axis are in display order.
     */
    public void updateAxisColumns(String name, String app, String version, Axis updatedAxis)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.updateAxisColumns(name, app, version, updatedAxis);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * Update column value in-place, with the passed in value.  The value will be a String that n-cube
     * must make inferences about to convert into a DISCRETE value, RANGE, SET, etc.
     */
    public void updateColumnCell(String name, String app, String version, String colId, String value)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.updateColumnCell(name, app, version, colId, value);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    /**
     * In-place update of a cell.  Requires heavy parsing to interpret what the user's intended
     * data type is for the cell (byte, short, int, long, float, double, boolean, character,
     * String, Date, Object[], BigDecimal, BigInteger, string url, binary url, groovy expression,
     * groovy method, groovy template, template url, expression url, method url, or null).
     */
    public Object updateCell(String name, String app, String version, Object[] colIds, String value)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return null;
            }
            return nCubeService.updateCell(name, app, version, colIds, parseCellValue(value));
        }
        catch(Exception e)
        {
            fail(e);
            return null;
        }
    }

    public void renameCube(String oldName, String newName, String app, String version)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.renameCube(oldName, newName, app, version);
        }
        catch(Exception e)
        {
            fail(e);
        }
    }

    public void saveJson(String name, String app, String version, String json)
    {
        try
        {
            if (!isAllowed(app, version))
            {
                markRquestFailed("This app and version CANNOT be edited.");
                return;
            }
            nCubeService.updateCube(name, app, version, json);
        }
        catch (Exception e)
        {
            fail(e);
        }
    }

    private static void markRquestFailed(Object data)
    {
        JsonCommandServlet.servletRequest.get().setAttribute(JsonCommandServlet.ATTRIBUTE_STATUS, false);
        JsonCommandServlet.servletRequest.get().setAttribute(JsonCommandServlet.ATTRIBUTE_FAIL_MESSAGE, data);
    }

    /**
     * Indicate to the Ajax servlet (JsonCommandServlet) that the 'status' field should
     * be set to 'false', and then set the 'data' field to the String of exception
     * text.
     * @param e Exception that occurred when calling the service.
     */
    private static void fail(Exception e)
    {
        markRquestFailed(getCauses(e));
    }

    private static String getCauses(Throwable t)
    {
        StringBuilder s = new StringBuilder();
        while (t != null)
        {
            s.append(t.getMessage());
            t = t.getCause();
            if (t != null)
            {
                s.append("<hr/>");
            }
        }

        return s.toString();
    }

    private static Object parseCellValue(final Object value)
    {
        if (value == null)
        {
            return null;
        }

        if (value instanceof Object[])
        {
            Object[] values = (Object[]) value;
            for (int i=0; i < values.length; i++)
            {
                values[i] = parseCellValue(values[i]);
            }
            return values;
        }

        if (!(value instanceof String))
        {
            throw new IllegalArgumentException("Unprocessable value passed in for cell: " + value.toString());
        }

        String v = (String) value;
        Matcher matcher = castPattern.matcher(v);

        if (!matcher.find())
        {
            if (v.startsWith("'"))
            {   // The ol' single-tick-mark-to-indicate-String trick from Excel
                return v.substring(1);
            }
            else if (v.startsWith("["))
            {
                try
                {
                    JsonObject array = (JsonObject) JsonReader.jsonToMaps(v);
                    Object[] values = (array).getArray();
                    for (int i=0; i < values.length; i++)
                    {
                        values[i] = parseCellValue(values[i]);
                    }
                    return values;
                }
                catch (IOException ignored) { }
            }

            if (v.startsWith("["))
            {   // handle Groovy's declarative Maps [ : ]  and [] with ' quoted strings
                return value;
            }

            if (v.startsWith("{"))
            {
                try
                {
                    return JsonReader.jsonToJava(v);
                }
                catch (IOException e)
                {
                    return value;
                }
            }

            try
            {
                return Long.parseLong(v);
            }
            catch (Exception ignored) { }

            try
            {
                return new BigDecimal(v);
            }
            catch (Exception ignored) { }

            try
            {
                return DateUtilities.parseDate(v);
            }
            catch (Exception ignored) { }

            return value;
        }

        String cmd = matcher.group(1).toLowerCase();
        String arg = matcher.group(2);
        if ("exp:".equals(cmd))
        {
            return new GroovyExpression(arg, null);
        }
        else if ("method:".equals(cmd))
        {
            return new GroovyMethod(arg, null);
        }
        else if ("temp:".equals(cmd))
        {
            return new GroovyTemplate(arg, null, true);
        }
        else if ("b:".equals(cmd))
        {
            try
            {
                return Byte.parseByte(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to byte: " + arg, e);
            }
        }
        else if ("[b:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                byte[] bytes = new byte[values.length];
                for (int i=0; i < values.length; i++)
                {
                    bytes[i] = ((Number)values[i]).byteValue();
                }
                return bytes;
            }
            catch (IOException ignored) { }
        }
        else if ("s:".equals(cmd))
        {
            try
            {
                return Short.parseShort(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to short: " + arg, e);
            }
        }
        else if ("[s:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                short[] shorts = new short[values.length];
                for (int i=0; i < values.length; i++)
                {
                    shorts[i] = ((Number)values[i]).shortValue();
                }
                return shorts;
            }
            catch (IOException ignored) { }
        }
        else if ("i:".equals(cmd))
        {
            try
            {
                return Integer.parseInt(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to an integer: " + arg, e);
            }
        }
        else if ("[i:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                int[] ints = new int[values.length];
                for (int i=0; i < values.length; i++)
                {
                    ints[i] = ((Number)values[i]).intValue();
                }
                return ints;
            }
            catch (IOException ignored) { }
        }
        else if ("l:".equals(cmd))
        {
            try
            {
                return Long.parseLong(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a long integer: " + arg, e);
            }
        }
        else if ("[l:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                long[] longs = new long[values.length];
                for (int i=0; i < values.length; i++)
                {
                    longs[i] = ((Number)values[i]).longValue();
                }
                return longs;
            }
            catch (IOException ignored) { }
        }
        else if ("f:".equals(cmd))
        {
            try
            {
                return Float.parseFloat(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a floating point number: " + arg, e);
            }
        }
        else if ("[f:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                float[] floats = new float[values.length];
                for (int i=0; i < values.length; i++)
                {
                    floats[i] = ((Number)values[i]).floatValue();
                }
                return floats;
            }
            catch (IOException ignored) { }
        }
        else if ("d:".equals(cmd))
        {
            try
            {
                return Double.parseDouble(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a double precision floating-point number: " + arg, e);
            }
        }
        else if ("[d:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                double[] doubles = new double[values.length];
                for (int i=0; i < values.length; i++)
                {
                    doubles[i] = ((Number)values[i]).doubleValue();
                }
                return doubles;
            }
            catch (IOException ignored) { }
        }
        else if ("c:".equals(cmd))
        {
            try
            {
                return arg.charAt(0);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a character: " + arg, e);
            }
        }
        else if ("[c:".equals(cmd))
        {
            try
            {
                return arg.toCharArray();
            }
            catch (Exception ignored) { }
        }
        else if ("z:".equals(cmd))
        {
            try
            {
                return Boolean.valueOf(arg) ? Boolean.TRUE : Boolean.FALSE;
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a boolean: " + arg, e);
            }
        }
        else if ("[z:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                boolean[] bools = new boolean[values.length];
                for (int i=0; i < values.length; i++)
                {
                    bools[i] = (Boolean)values[i] ? Boolean.TRUE : Boolean.FALSE;
                }
                return bools;
            }
            catch (IOException ignored) { }
        }
        else if ("bd:".equals(cmd))
        {
            try
            {
                return new BigDecimal(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a BigDecimal: " + arg, e);
            }
        }
        else if ("[bd:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                BigDecimal[] bigdecs = new BigDecimal[values.length];
                for (int i=0; i < values.length; i++)
                {
                    bigdecs[i] = new BigDecimal((String)values[i]);
                }
                return bigdecs;
            }
            catch (IOException ignored) { }
        }
        else if ("bi:".equals(cmd))
        {
            try
            {
                return new BigInteger(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be cast to a BigInteger: " + arg, e);
            }
        }
        else if ("[bi:".equals(cmd))
        {
            try
            {
                JsonObject array = (JsonObject) JsonReader.jsonToMaps(arg);
                Object[] values = (array).getArray();
                BigInteger[] bigints = new BigInteger[values.length];
                for (int i=0; i < values.length; i++)
                {
                    bigints[i] = new BigInteger((String)values[i]);
                }
                return bigints;
            }
            catch (IOException ignored) { }
        }
        else if ("str-url:".equals(cmd))
        {
            // TODO: allow for cache / no cache
            StringUrlCmd stringUrlCmd = new StringUrlCmd(arg, false);
            return stringUrlCmd;
        }
        else if ("bin-url:".equals(cmd))
        {
            // TODO: allow for cache / no cache
            BinaryUrlCmd binaryUrlCmd = new BinaryUrlCmd(arg, false);
            return binaryUrlCmd;
        }
        else if ("exp-url:".equals(cmd))
        {
            GroovyExpression exp = new GroovyExpression(null, arg, true);
            return exp;
        }
        else if ("method-url:".equals(cmd))
        {
            GroovyMethod method = new GroovyMethod(null, arg);
            return method;
        }
        else if ("temp-url:".equals(cmd))
        {
            GroovyTemplate template = new GroovyTemplate(null, arg, true);
            return template;
        }
        else if ("date:".equals(cmd))
        {
            try
            {
                return DateUtilities.parseDate(arg);
            }
            catch (Exception e)
            {
                throw new IllegalArgumentException("Value cannot be parsed as a date: " + arg, e);
            }
        }
        else if ("null:".equals(cmd))
        {
            return null;
        }
        throw new IllegalArgumentException("Unknown cast: " + cmd);
    }
}
