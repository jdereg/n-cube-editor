package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.Axis
import com.cedarsoftware.ncube.Column
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic


/**
 * Provides information about the scope used to visualize an n-cube.
 */

@CompileStatic
class VisualizerScopeInfo
{
	Map<String, Object> scope

	Map<String, Set<Object>> optionalScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> optionalScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> optionalScopeCubeNames = new CaseInsensitiveMap()
	Set<String> optionalScopeKeySet = new CaseInsensitiveSet()

	Map<String, Set<Object>> requiredScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> requiredScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> requiredScopeCubeNames = new CaseInsensitiveMap()
	Set<String>  requiredScopeKeySet = new CaseInsensitiveSet()

	Map<String, Set<String>> requiredScopeKeysByCube = [:]
	Map<String, Set<String>> allOptionalScopeKeysByCube = [:]

	StringBuilder requiredScopeMessage = new StringBuilder()
	StringBuilder optionalScopeMessage = new StringBuilder()


	void addOptionalScope(ApplicationID appId, String cubeName, String scopeKey, Object providedValue)
	{
		addOptionalScopeValues(appId, cubeName, scopeKey, optionalScopeAvailableValues)
		addValue(scopeKey, optionalScopeCubeNames, cubeName)
		addValue(scopeKey, optionalScopeProvidedValues, providedValue)
	}

	void addRequiredScope(ApplicationID appId, String scopeKey, String cubeName,  Object providedValue)
	{
		addRequiredScopeValues(appId, cubeName, scopeKey, requiredScopeAvailableValues)
		addValue(scopeKey, requiredScopeCubeNames, cubeName)
		addValue(scopeKey, requiredScopeProvidedValues, providedValue)
	}

	private static void addOptionalScopeValues(ApplicationID appId, String cubeName, String scopeKey, Map scopeInfoMap)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		scopeValues.addAll(getInScopeColumnValues(appId, cubeName, scopeKey))
		scopeInfoMap[scopeKey] = scopeValues
	}

	private static void addRequiredScopeValues(ApplicationID appId, String cubeName, String scopeKey, Map scopeInfoMap)
	{
		Set scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		Set scopeValuesThisCube = getInScopeColumnValues(appId, cubeName, scopeKey)
		scopeInfoMap[scopeKey] = scopeValues.intersect(scopeValuesThisCube) as Set
	}

	private static void addValue(String scopeKey, Map scopeInfoMap, Object valueToAdd)
	{
		Set<Object> values = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		values << valueToAdd
		scopeInfoMap[scopeKey] = values
	}

	private static Set<Object> getInScopeColumnValues(ApplicationID applicationID, String cubeName, String axisName)
	{
		//TODO: Rework this to get only "in scope" column values
		NCube cube = NCubeManager.getCube(applicationID, cubeName)
		Set values = new LinkedHashSet()
		Axis axis = cube?.getAxis(axisName)
		if (axis)
		{
			for (Column column : axis.columnsWithoutDefault)
			{
				values.add(column.value)
			}
		}
		return values
	}


}