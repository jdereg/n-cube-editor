package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.Axis
import com.cedarsoftware.ncube.Column
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import com.cedarsoftware.ncube.ReleaseStatus
import com.cedarsoftware.ncube.exception.CoordinateNotFoundException
import com.cedarsoftware.ncube.exception.InvalidCoordinateException
import com.cedarsoftware.ncube.util.VersionComparator
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.RpmVisualizerConstants.AXIS_TRAIT
import static com.cedarsoftware.util.RpmVisualizerConstants.EFFECTIVE_VERSION
import static com.cedarsoftware.util.RpmVisualizerConstants.POLICY_CONTROL_DATE
import static com.cedarsoftware.util.RpmVisualizerConstants.QUOTE_DATE
import static com.cedarsoftware.util.RpmVisualizerConstants.R_EXISTS
import static com.cedarsoftware.util.RpmVisualizerConstants.R_SCOPED_NAME
import static com.cedarsoftware.util.VisualizerConstants.DATE_TIME_FORMAT

/**
 * Provides information about the scope used to visualize an rpm class.
 */

@CompileStatic
class RpmVisualizerScopeInfo extends VisualizerScopeInfo
{
	RpmVisualizerScopeInfo(){}

	@Override
	protected void populateScopeDefaults(String startCubeName)
	{
		String scopeValue
		if (NCubeManager.getCube(appId, startCubeName).getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String defaultScopeDate = DATE_TIME_FORMAT.format(new Date())
			scopeValue = inputScope[POLICY_CONTROL_DATE] ?: defaultScopeDate
			addScopeDefault(POLICY_CONTROL_DATE, scopeValue)
			scopeValue = inputScope[QUOTE_DATE] ?: defaultScopeDate
			addScopeDefault(QUOTE_DATE, scopeValue)
		}
		scopeValue = inputScope[EFFECTIVE_VERSION] ?: appId.version
		addScopeDefault(EFFECTIVE_VERSION, scopeValue)
		loadAvailableScopeValuesEffectiveVersion()
	}

	private void addScopeDefault(String scopeKey, String defaultValue)
	{
		Object scopeValue = scope[scopeKey]
		scopeValue =  scopeValue ?: defaultValue
		addTopNodeGraphScope(null, scopeKey, true, null)
		scope[scopeKey] = scopeValue
	}

	private void loadAvailableScopeValuesEffectiveVersion()
	{
		if (!topNodeGraphScopeAvailableValues[EFFECTIVE_VERSION])
		{
			Map<String, List<String>> versionsMap = NCubeManager.getVersions(appId.tenant, appId.app)
			Set<Object>  values = new TreeSet<>(new VersionComparator())
			values.addAll(versionsMap[ReleaseStatus.RELEASE.name()])
			values.addAll(versionsMap[ReleaseStatus.SNAPSHOT.name()])
			topNodeGraphScopeAvailableValues[EFFECTIVE_VERSION] = new LinkedHashSet(values)
		}
	}

	@Override
	protected boolean loadAgain(VisualizerRelInfo relInfo, String scopeKey)
	{
		Object scopeValue = inputScope[scopeKey]
		if (relInfo.availableTargetScope[scopeKey] != scopeValue)
		{
			scope[scopeKey] = scopeValue
			relInfo.availableTargetScope[scopeKey] = scopeValue
			return true
		}
		return false
	}

	/* TODO: Will revisit providing "in scope" available scope values for r:exists at a later time.
	@Override
	protected Set<Object> getColumnValues(String cubeName, String axisName, Map coordinate)
	{
		NCube cube = NCubeManager.getCube(appId, cubeName)
		if (coordinate && R_EXISTS == coordinate[AXIS_TRAIT])
		{
			try
			{
				return getInScopeColumnValues(cube, axisName, coordinate)
			}
			catch (CoordinateNotFoundException|InvalidCoordinateException e)
			{
				//There is more than one missing or invalid scope key so cannot determine "in scope" column values.
				//Get all column values instead.
				int debug = 0
			}
		}
		return getAllColumnValues(cube, axisName)
	}

	private static Set<Object> getInScopeColumnValues(NCube cube, String axisName, Map coordinate)
	{
		coordinate[axisName] = new LinkedHashSet()
		Map map = cube.getMap(coordinate)
		Map inScopeMapEntries = map.findAll{Object columnName, Object columnValue ->
			true == columnValue
		}
		return inScopeMapEntries.keySet()
	}*/

	@Override
	protected String getNodesLabel()
	{
		return 'classes'
	}

	@Override
	protected String getNodeLabel()
	{
		return 'class'
	}
}