package com.cedarsoftware.controller;

import com.cedarsoftware.ncube.Axis;

/**
 * Handle NCube Editor requests.
 *  
 * @author John DeRegnaucourt
 */
public interface INCubeController extends IBaseController
{
    Object[] getCubeList(String filter, String app, String version, String status);
    String getHtml(String name, String app, String version, String status);
    String getJson(String name, String app, String version, String status);
    Object[] getAppNames();
    Object[] getAppVersions(String app, String status);
    Object createCube(String name, String app, String version);
    Object deleteCube(String name, String app, String version);
    Object getReferencesTo(String name, String app, String version, String status);
    Object getReferencesFrom(String name, String app, String version, String status);
    Object getRequiredScope(String name, String app, String version, String status);
    Object duplicateCube(String newName, String name, String newApp, String app, String newVersion, String version, String status);
    Object releaseCubes(String app, String version, String newSnapVer);
    Object changeVersionValue(String app, String currVersion, String newSnapVer);
    Object addAxis(String name, String app, String version, String axisName, String type, String valueType);
    Object getAxes(String name, String app, String version, String status);
    Object getAxis(String name, String app, String version, String status, String axisName);
    Object deleteAxis(String name, String app, String version, String axisName);
    Object updateAxis(String name, String app, String version, String origAxisName, String axisName, boolean hasDefault, boolean isSorted, boolean multiMatch);
    Object updateColumnCell(String name, String app, String version, String colId, String value);
    Object updateAxisColumns(String name, String app, String version, Axis updatedAxis);
    Object renameCube(String oldName, String newName, String app, String version);
    Object saveJson(String name, String app, String version, String json);
    Object updateCell(String name, String app, String version, Object[] colIds, String value);
}
