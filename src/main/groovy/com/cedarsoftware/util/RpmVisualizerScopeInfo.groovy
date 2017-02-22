package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCubeManager
import com.cedarsoftware.ncube.ReleaseStatus
import com.cedarsoftware.ncube.util.VersionComparator
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.RpmVisualizerConstants.AXIS_TRAIT
import static com.cedarsoftware.util.RpmVisualizerConstants.EFFECTIVE_VERSION
import static com.cedarsoftware.util.RpmVisualizerConstants.POLICY_CONTROL_DATE
import static com.cedarsoftware.util.RpmVisualizerConstants.QUOTE_DATE
import static com.cedarsoftware.util.RpmVisualizerConstants.R_SCOPED_NAME
import static com.cedarsoftware.util.VisualizerConstants.DATE_TIME_FORMAT

/**
 * Provides information about the scope used to visualize an rpm class.
 */

@CompileStatic
class RpmVisualizerScopeInfo extends VisualizerScopeInfo
{
	RpmVisualizerScopeInfo(){}

	protected RpmVisualizerScopeInfo(ApplicationID applicationId){
		appId = applicationId
	}

	@Override
	protected void populateScopeDefaults(String startCubeName)
	{
		String defaultScopeEffectiveVersion = appId.version

		if (NCubeManager.getCube(appId, startCubeName).getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String defaultScopeDate = DATE_TIME_FORMAT.format(new Date())
			addScopeDefault(POLICY_CONTROL_DATE, defaultScopeDate)
			addScopeDefault(QUOTE_DATE, defaultScopeDate)
		}
		addScopeDefault(EFFECTIVE_VERSION, defaultScopeEffectiveVersion)
		loadAvailableScopeValuesEffectiveVersion()
	}

	private void addScopeDefault(String scopeKey, String defaultValue)
	{
		Object scopeValue = scope[scopeKey]
		scopeValue =  scopeValue ?: defaultValue
		addTopNodeScope(null, scopeKey, true)
		scope[scopeKey] = scopeValue
	}

	private void loadAvailableScopeValuesEffectiveVersion()
	{
		if (!topNodeScopeAvailableValues[EFFECTIVE_VERSION])
		{
			Map<String, List<String>> versionsMap = NCubeManager.getVersions(appId.tenant, appId.app)
			Set<Object>  values = new TreeSet<>(new VersionComparator())
			values.addAll(versionsMap[ReleaseStatus.RELEASE.name()])
			values.addAll(versionsMap[ReleaseStatus.SNAPSHOT.name()])
			topNodeScopeAvailableValues[EFFECTIVE_VERSION] = new LinkedHashSet(values)
		}
	}

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