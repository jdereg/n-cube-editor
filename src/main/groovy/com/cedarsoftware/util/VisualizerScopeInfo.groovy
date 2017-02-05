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
	ApplicationID appId
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

	VisualizerScopeInfo(){}

	VisualizerScopeInfo(ApplicationID applicationID, Map<String, Object> scopeMap = null)
	{
		appId = applicationID
		scope = scopeMap as CaseInsensitiveMap ?: new CaseInsensitiveMap()
	}

	Set<Object> addOptionalScope(String cubeName, String scopeKey, Object providedValue)
	{
		addOptionalScopeValues(cubeName, scopeKey, optionalScopeAvailableValues)
		addValue(scopeKey, optionalScopeCubeNames, cubeName)
		addValue(scopeKey, optionalScopeProvidedValues, providedValue)
		return optionalScopeAvailableValues[scopeKey]
	}

	Set<Object> addRequiredScope(String scopeKey, String cubeName,  Object providedValue)
	{
		addRequiredScopeValues(cubeName, scopeKey, requiredScopeAvailableValues)
		addValue(scopeKey, requiredScopeCubeNames, cubeName)
		addValue(scopeKey, requiredScopeProvidedValues, providedValue)
		return requiredScopeAvailableValues[scopeKey]
	}

	private void addOptionalScopeValues(String cubeName, String scopeKey, Map scopeInfoMap)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		scopeValues.addAll(getInScopeColumnValues(cubeName, scopeKey))
		scopeInfoMap[scopeKey] = scopeValues
	}

	private void addRequiredScopeValues(String cubeName, String scopeKey, Map scopeInfoMap)
	{
		Set scopeValuesThisCube = getInScopeColumnValues(cubeName, scopeKey)
		if (scopeInfoMap.containsKey(scopeKey))
		{
			Set scopeValues = scopeInfoMap[scopeKey] as Set
			scopeInfoMap[scopeKey] = scopeValues.intersect(scopeValuesThisCube) as Set
		}
		else
		{
			scopeInfoMap[scopeKey] = scopeValuesThisCube
		}
	}

	private static void addValue(String scopeKey, Map scopeInfoMap, Object valueToAdd)
	{
		Set<Object> values = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		values << valueToAdd
		scopeInfoMap[scopeKey] = values
	}

	private Set<Object> getInScopeColumnValues(String cubeName, String axisName)
	{
		//TODO: Rework this to get only "in scope" column values
		NCube cube = NCubeManager.getCube(appId, cubeName)
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