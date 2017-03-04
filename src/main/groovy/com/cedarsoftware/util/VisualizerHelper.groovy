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
	protected static void handleUnboundScope(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, List<MapEntry> unboundAxesList)
	{
		if (unboundAxesList)
		{
			unboundAxesList.each { MapEntry unboundAxis ->
				String cubeName = unboundAxis.key as String
				MapEntry axisEntry = unboundAxis.value as MapEntry
				String scopeKey = axisEntry.key as String
				if (relInfo.includeUnboundScopeKey(visInfo, scopeKey))
				{
					relInfo.loadAgain = scopeInfo.loadAgain(relInfo, scopeKey) ?: relInfo.loadAgain
					scopeInfo.addScope(relInfo, cubeName, scopeKey)
				}
			}
		}
	}

	protected static StringBuilder handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo)
	{
		StringBuilder sb = new StringBuilder()
		String cubeName = e.cubeName
		String scopeKey = e.axisName
		if (cubeName && scopeKey)
		{
			relInfo.loadAgain = scopeInfo.loadAgain(relInfo, scopeKey)
			scopeInfo.addScope(relInfo, cubeName, scopeKey)
			return sb
		}
		else
		{
			sb.append("Unable to handle CoordinateNotFoundException ${DOUBLE_BREAK}")
			return sb.append(handleException(e as Exception))
		}
	}

	protected static StringBuilder handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, Set mandatoryScopeKeys)
	{
		StringBuilder sb = new StringBuilder()
		Set<String> missingScopeKeys = findMissingScope(relInfo.availableTargetScope, e.requiredKeys, mandatoryScopeKeys)
		if (missingScopeKeys)
		{
			missingScopeKeys.each { String scopeKey ->
				relInfo.loadAgain = scopeInfo.loadAgain(relInfo, scopeKey) ?: relInfo.loadAgain
				scopeInfo.addScope(relInfo, e.cubeName, scopeKey)
			}
			return sb
		}
		else
		{
			sb = new StringBuilder("Unable to handle InvalidCoordinateException ${DOUBLE_BREAK}")
			return sb.append(handleException(e as Exception))
		}
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