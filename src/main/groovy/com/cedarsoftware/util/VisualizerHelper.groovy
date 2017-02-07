package com.cedarsoftware.util

import com.cedarsoftware.controller.NCubeController
import com.cedarsoftware.ncube.RuleInfo
import com.cedarsoftware.ncube.exception.CoordinateNotFoundException
import com.cedarsoftware.ncube.exception.InvalidCoordinateException
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.*

/**
 * Provides helper methods to handle exceptions occurring during the execution
 * of n-cube cells for the purpose of producing a visualization.
 */

@CompileStatic
class VisualizerHelper
{
	static String handleUnboundScope(VisualizerInfo visInfo, VisualizerRelInfo relInfo, RuleInfo ruleInfo)
	{
		StringBuilder sb = new StringBuilder()
		Map<String, Set<Object>> thisUnboundScopeAvailableValues = new CaseInsensitiveMap()
		Map<String, Set<Object>> thisUnboundScopeProvidedValues = new CaseInsensitiveMap()
		Map<String, Set<String>> thisUnboundScopeCubeNames = new CaseInsensitiveMap()
		List unboundAxesList = ruleInfo.getUnboundAxesList()
		if (unboundAxesList)
		{
			//Gather entries in unboundAxesList into maps both for the graph as a whole and for this cube.
			VisualizerScopeInfo scopeInfo = visInfo.scopeInfo

			unboundAxesList.each { MapEntry unboundAxis ->
				String cubeName = unboundAxis.key as String
				MapEntry axisEntry = unboundAxis.value as MapEntry
				String axisName = axisEntry.key as String
				Object unBoundValue = axisEntry.value
				if (relInfo.includeUnboundScopeKey(visInfo, axisName))
				{
					Set<Object> availableValues = scopeInfo.addUnboundScope(cubeName, axisName, unBoundValue)
					scopeInfo.addValue(axisName, thisUnboundScopeAvailableValues, availableValues)
					scopeInfo.addValue(axisName, thisUnboundScopeProvidedValues, unBoundValue)
					scopeInfo.addValue(axisName, thisUnboundScopeCubeNames, cubeName)
				}
			}
		}

		thisUnboundScopeAvailableValues.keySet().each{ String axisName ->
			Set<Object> providedValues = thisUnboundScopeProvidedValues[axisName]
			Set<String> cubeNames = thisUnboundScopeCubeNames[axisName]
			sb.append("A default was used for scope key ${axisName} since ")
			providedValues ? sb.append("the following values were provided, but not found: ${providedValues.join(COMMA_SPACE)}.") : sb.append('"no values were provided.')
			cubeNames ? sb.append("${BREAK}Cubes where the default was utilized for this key: ${cubeNames.join(COMMA_SPACE)}.") : sb.append('')
		}
		return sb.toString()
	}

	static String handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerInfo visInfo, String targetMsg )
	{
		String cubeName = e.cubeName
		String axisName = e.axisName
		Object providedValue = e.value
		if (cubeName && axisName)
		{
			visInfo.scopeInfo.addMissingRequiredScope(axisName, cubeName, providedValue)
			return ''
		}
		else
		{
			return BREAK + handleException(e as Exception, targetMsg)
		}
	}

	static String handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerInfo visInfo, VisualizerRelInfo relInfo, Set mandatoryScopeKeys)
	{
		Set<String> missingScope = findMissingScope(relInfo.availableTargetScope, e.requiredKeys, mandatoryScopeKeys)
		missingScope.each{String scopeKey ->
			visInfo.scopeInfo.addMissingRequiredScope(scopeKey, e.cubeName, null)
		}
		if (missingScope)
		{
			return missingScope.join(COMMA_SPACE)
		}
		else
		{
			throw new IllegalStateException("InvalidCoordinateException thrown, but no missing scope keys found for ${relInfo.targetCube.name} and scope ${visInfo.scopeInfo.scope.toString()}.", e)

		}
	}

	static String handleException(Throwable e, String targetMsg)
	{
		Throwable t = getDeepestException(e)
		return getExceptionMessage(t, e, targetMsg)
	}

	static protected Throwable getDeepestException(Throwable e)
	{
		while (e.cause != null)
		{
			e = e.cause
		}
		return e
	}

	private static Set<String> findMissingScope(Map<String, Object> scope, Set<String> requiredKeys, Set mandatoryScopeKeys)
	{
		return requiredKeys.findAll { String scopeKey ->
			!mandatoryScopeKeys.contains(scopeKey) && (scope == null || !scope.containsKey(scopeKey))
		}
	}

	static String getExceptionMessage(Throwable t, Throwable e, String targetMsg)
	{
		"""\
An exception was thrown while loading ${targetMsg}. \
${DOUBLE_BREAK}<b>Message:</b> ${DOUBLE_BREAK}${e.message}${DOUBLE_BREAK}<b>Root cause: </b>\
${DOUBLE_BREAK}${t.toString()}${DOUBLE_BREAK}<b>Stack trace: </b>${DOUBLE_BREAK}${NCubeController.getTestCauses(t)}"""
	}
}