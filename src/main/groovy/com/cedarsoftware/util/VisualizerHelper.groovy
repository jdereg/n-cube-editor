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
	protected static StringBuilder handleUnboundScope(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, RuleInfo ruleInfo)
	{
		Map<String, Set<Object>> nodeAvailableValues = new CaseInsensitiveMap()
		Map<String, Set<String>> nodeCubeNames = new CaseInsensitiveMap()
		List unboundAxesList = ruleInfo.getUnboundAxesList()
		if (unboundAxesList)
		{
			//Gather entries in unboundAxesList into maps both for the graph as a whole and for this cube.
			unboundAxesList.each { MapEntry unboundAxis ->
				String cubeName = unboundAxis.key as String
				MapEntry axisEntry = unboundAxis.value as MapEntry
				String scopeKey = axisEntry.key as String
				if (relInfo.includeUnboundScopeKey(visInfo, scopeKey))
				{
					Set<Object> availableValues
					if (visInfo.nodeCount == 1l)
					{
						//TODO: Add coordinate info to unboundAxesList in NCube so that it can be passed in below.
						availableValues = scopeInfo.addTopNodeScope(cubeName, scopeKey)
					}
					else
					{
						//TODO: Add coordinate info to unboundAxesList in NCube so that it can be passed in below.
						availableValues = scopeInfo.addOptionalGraphScope(cubeName, scopeKey)
					}
					availableValues.each{Object availableValue ->
						scopeInfo.addValue(scopeKey, nodeAvailableValues, availableValue)
					}
					scopeInfo.addValue(scopeKey, nodeCubeNames, cubeName)
				}
			}

			if (nodeAvailableValues)
			{
				return scopeInfo.getOptionalNodeScopeMessage(nodeAvailableValues, nodeCubeNames)
			}
		}
		return null
	}

	protected static StringBuilder handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		String cubeName = e.cubeName
		String scopeKey = e.axisName
		if (cubeName && scopeKey)
		{
			return getAdditionalRequiredNodeScopeMessage(scopeInfo, nodeCount, scopeKey, null, cubeName, e.coordinate)
		}
		else
		{
			StringBuilder sb = new StringBuilder("Unable to handle CoordinateNotFoundException ${DOUBLE_BREAK}")
			return sb.append(handleException(e as Exception))
		}
	}

	protected static StringBuilder handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerScopeInfo scopeInfo, long nodeCount, VisualizerRelInfo relInfo, Set mandatoryScopeKeys)
	{
		Set<String> missingScope = findMissingScope(relInfo.availableTargetScope, e.requiredKeys, mandatoryScopeKeys)
		if (missingScope)
		{
			StringBuilder sb = new StringBuilder()
			missingScope.each { String scopeKey ->
				//TODO: Add coordinate info to InvalidCoordinateException in NCube so that it can be passed in below.
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

	private static StringBuilder getAdditionalRequiredNodeScopeMessage(VisualizerScopeInfo scopeInfo, long nodeCount, String scopeKey, Object providedScopeValue, String cubeName, Map coordinate = null)
	{
		StringBuilder sb = new StringBuilder()
		Set<Object> availableValues
		if (nodeCount == 1l)
		{
			availableValues = scopeInfo.addTopNodeScope(cubeName, scopeKey, false, coordinate)
		}
		else
		{
			availableValues = scopeInfo.addOptionalGraphScope(cubeName, scopeKey, false, coordinate)
		}
		StringBuilder title = new StringBuilder("Scope key ${scopeKey} is required by ${cubeName} to load this ${scopeInfo.nodeLabel}")
		sb.append(scopeInfo.getScopeMessage(scopeKey, availableValues, title, providedScopeValue))
		return sb.append(BREAK)
	}

	protected static String handleException(Throwable e)
	{
		Throwable t = getDeepestException(e)
		return getExceptionMessage(t, e)
	}

	protected static Throwable getDeepestException(Throwable e)
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

	protected static String getExceptionMessage(Throwable t, Throwable e)
	{
		"""\
<b>Message:</b> ${DOUBLE_BREAK}${e.message}${DOUBLE_BREAK}<b>Root cause: </b>\
${DOUBLE_BREAK}${t.toString()}${DOUBLE_BREAK}<b>Stack trace: </b>${DOUBLE_BREAK}${NCubeController.getTestCauses(t)}"""
	}
}