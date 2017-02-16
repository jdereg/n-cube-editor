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

    RpmVisualizerScopeInfo(ApplicationID applicationId){
		appId = applicationId
	}

	@Override
	protected void populateScopeDefaults(String startCubeName)
	{
		String defaultScopeEffectiveVersion = appId.version

		if (NCubeManager.getCube(appId, startCubeName).getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String defaultScopeDate = DATE_TIME_FORMAT.format(new Date())
			populateScopeDefaults(POLICY_CONTROL_DATE, defaultScopeDate)
			populateScopeDefaults(QUOTE_DATE, defaultScopeDate)
		}
		populateScopeDefaults(EFFECTIVE_VERSION, defaultScopeEffectiveVersion)
		loadAvailableScopeValuesEffectiveVersion()
	}

	protected void populateScopeDefaults(String scopeKey, String defaultValue)
	{
		Object scopeValue = scope[scopeKey]
		scopeValue =  scopeValue ?: defaultValue
		addRequiredGraphScope(null, scopeKey, scopeValue, true)
		scope[scopeKey] = scopeValue
	}

	protected void loadAvailableScopeValuesEffectiveVersion()
	{
		if (!requiredGraphScopeAvailableValues[EFFECTIVE_VERSION])
		{
			Map<String, List<String>> versionsMap = NCubeManager.getVersions(appId.tenant, appId.app)
			Set<Object>  values = new TreeSet<>(new VersionComparator())
			values.addAll(versionsMap[ReleaseStatus.RELEASE.name()])
			values.addAll(versionsMap[ReleaseStatus.SNAPSHOT.name()])
			requiredGraphScopeAvailableValues[EFFECTIVE_VERSION] = new LinkedHashSet(values)
		}
	}
}