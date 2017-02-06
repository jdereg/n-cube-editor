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

	Map<String, Set<Object>> missingRequiredScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> missingRequiredScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> missingRequiredScopeCubeNames = new CaseInsensitiveMap()

	Map<String, Set<Object>> unboundScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> unboundScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> unboundScopeCubeNames = new CaseInsensitiveMap()

	Map<String, Set<Object>> optionalScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> optionalScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> optionalScopeCubeNames = new CaseInsensitiveMap()

	String scopeMessage

	VisualizerScopeInfo(){}

	VisualizerScopeInfo(ApplicationID applicationID, Map<String, Object> scopeMap = null)
	{
		appId = applicationID
		scope = scopeMap as CaseInsensitiveMap ?: new CaseInsensitiveMap()
	}

	Set<Object> addMissingRequiredScope(String scopeKey, String cubeName, Object providedValue, boolean skipAvailableScopeValues = false)
	{
		addRequiredScopeValues(cubeName, scopeKey, missingRequiredScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, missingRequiredScopeCubeNames, cubeName)
		addValue(scopeKey, missingRequiredScopeProvidedValues, providedValue)
		return missingRequiredScopeAvailableValues[scopeKey]
	}

	Set<Object> addUnboundScope(String cubeName, String scopeKey, Object providedValue, boolean skipAvailableScopeValues = false)
	{
		addOptionalScopeValues(cubeName, scopeKey, unboundScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, unboundScopeCubeNames, cubeName)
		addValue(scopeKey, unboundScopeProvidedValues, providedValue)
		return unboundScopeAvailableValues[scopeKey]
	}

	Set<Object> addOptionalScope(String cubeName, String scopeKey, Object providedValue, boolean skipAvailableScopeValues = false)
	{
		addOptionalScopeValues(cubeName, scopeKey, optionalScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, optionalScopeCubeNames, cubeName)
		addValue(scopeKey, optionalScopeProvidedValues, providedValue)
		return optionalScopeAvailableValues[scopeKey]
	}

	private void addRequiredScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (skipAvailableScopeValues)
		{
			scopeInfoMap[scopeKey] = scopeValues
		}
		else
		{
			Set scopeValuesThisCube = getInScopeColumnValues(cubeName, scopeKey)
			if (scopeInfoMap.containsKey(scopeKey))
			{
				scopeInfoMap[scopeKey] = scopeValues.intersect(scopeValuesThisCube) as Set
			}
			else
			{
				scopeInfoMap[scopeKey] = scopeValuesThisCube
			}
		}
	}

	private void addOptionalScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (!skipAvailableScopeValues)
		{
			scopeValues.addAll(getInScopeColumnValues(cubeName, scopeKey))
		}
		scopeInfoMap[scopeKey] = scopeValues
	}



	static void addValue(String scopeKey, Map scopeInfoMap, Object valueToAdd)
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