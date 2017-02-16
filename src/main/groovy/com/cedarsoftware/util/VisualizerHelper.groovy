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
	static StringBuilder handleUnboundScope(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, RuleInfo ruleInfo)
	{
		Map<String, Set<Object>> nodeAvailableValues = new CaseInsensitiveMap()
		Map<String, Set<Object>> nodeProvidedValues = new CaseInsensitiveMap()
		Map<String, Set<String>> nodeCubeNames = new CaseInsensitiveMap()
		List unboundAxesList = ruleInfo.getUnboundAxesList()
		if (unboundAxesList)
		{
			//Gather entries in unboundAxesList into maps both for the graph as a whole and for this cube.
			unboundAxesList.each { MapEntry unboundAxis ->
				String cubeName = unboundAxis.key as String
				MapEntry axisEntry = unboundAxis.value as MapEntry
				String axisName = axisEntry.key as String
				Object unBoundValue = axisEntry.value
				if (relInfo.includeUnboundScopeKey(visInfo, axisName))
				{
					Set<Object> availableValues = scopeInfo.addOptionalGraphScope(cubeName, axisName, unBoundValue)
					availableValues.each{Object availableValue ->
						scopeInfo.addValue(axisName, nodeAvailableValues, availableValue)
					}
					scopeInfo.addValue(axisName, nodeProvidedValues, unBoundValue)
					scopeInfo.addValue(axisName, nodeCubeNames, cubeName)
				}
			}

			if (nodeAvailableValues)
			{
				return scopeInfo.getOptionalNodeScopeMessage(nodeAvailableValues, nodeProvidedValues, nodeCubeNames)
			}
		}
		return null
	}

	static StringBuilder handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		String cubeName = e.cubeName
		String scopeKey = e.axisName
		if (cubeName && scopeKey)
		{
			return getAdditionalRequiredNodeScopeMessage(scopeInfo, nodeCount, scopeKey, e.value as String, cubeName)
		}
		else
		{
			StringBuilder sb = new StringBuilder("Unable to handle CoordinateNotFoundException ${DOUBLE_BREAK}")
			return sb.append(handleException(e as Exception))
		}
	}

	static StringBuilder handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerScopeInfo scopeInfo, long nodeCount, VisualizerRelInfo relInfo, Set mandatoryScopeKeys)
	{
		Set<String> missingScope = findMissingScope(relInfo.availableTargetScope, e.requiredKeys, mandatoryScopeKeys)
		if (missingScope)
		{
			StringBuilder sb = new StringBuilder()
			missingScope.each { String scopeKey ->
				sb.append(getAdditionalRequiredNodeScopeMessage(scopeInfo, nodeCount, scopeKey, null, e.cubeName))
			}
			return sb
		}
		else
		{
			StringBuilder sb = new StringBuilder("Unable to handle InvalidCoordinateException ${DOUBLE_BREAK}")
			return sb.append(handleException(e as Exception))
		}
	}

	protected static StringBuilder getAdditionalRequiredNodeScopeMessage(VisualizerScopeInfo scopeInfo, long nodeCount, String scopeKey, String providedValue, String cubeName)
	{
		StringBuilder sb = new StringBuilder()
		Set<Object> availableValues
		if (nodeCount == 1l)
		{
			availableValues = scopeInfo.addRequiredGraphScope(cubeName, scopeKey, providedValue)
		}
		else
		{
			availableValues = scopeInfo.addOptionalGraphScope(cubeName, scopeKey, providedValue)
		}
		StringBuilder title = new StringBuilder("${scopeKey} is required by ${cubeName} to load this node")
		sb.append(scopeInfo.getScopeMessage(scopeKey, availableValues, title, providedValue))
		return sb.append(BREAK)
	}

	static String handleException(Throwable e)
	{
		Throwable t = getDeepestException(e)
		return getExceptionMessage(t, e)
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

	static String getExceptionMessage(Throwable t, Throwable e)
	{
		"""\
<b>Message:</b> ${DOUBLE_BREAK}${e.message}${DOUBLE_BREAK}<b>Root cause: </b>\
${DOUBLE_BREAK}${t.toString()}${DOUBLE_BREAK}<b>Stack trace: </b>${DOUBLE_BREAK}${NCubeController.getTestCauses(t)}"""
	}
}