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
	static String getOkScopeMessage(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, Set<String> okScopeKeys)
	{
		StringBuilder sb = new StringBuilder()
		okScopeKeys.each{ String scopeKey ->
			String messagesSuffix = visInfo.allRequiredScopeKeys.contains(scopeKey) ? 'Required' : 'Optional'
			sb.append(BREAK + getOkScopeMessage(scopeKey, scopeInfo, messagesSuffix))
		}
		return sb.toString()
	}

	static String getOkScopeMessage(String scopeKey, VisualizerScopeInfo scopeInfo, String messagesSuffix)
	{
		Object scopeValue = scopeInfo.scope[scopeKey]
		String title = "${messagesSuffix} scope key ${scopeKey} with value ${scopeValue}"
		StringBuilder sb = new StringBuilder()
		sb.append("""<div title="${title}" class="input-group input-group-sm">""")
		sb.append("${messagesSuffix} scope key ${scopeKey}:${BREAK}")
		sb.append("""<input class="${DETAILS_CLASS_MISSING_SCOPE_INPUT}" id="${scopeKey}" style="color: black;" type="text" value="${scopeValue}" />""")
		sb.append('</div>')
		return sb.toString()
	}

	static String getUnboundScopeMessage(VisualizerScopeInfo scopeInfo)
	{
		StringBuilder sb = new StringBuilder()
		scopeInfo.unboundScopeAvailableValues.keySet().each{ String axisName ->
			sb.append(BREAK + getUnboundScopeMessage(axisName, scopeInfo))
		}
		return sb.toString()
	}

	static String getRequiredScopeMessage(VisualizerScopeInfo scopeInfo)
	{
		StringBuilder sb = new StringBuilder()
		scopeInfo.missingRequiredScopeAvailableValues.keySet().each{ String axisName ->
			sb.append(BREAK + getRequiredScopeMessage(axisName, scopeInfo))
		}
		return sb.toString()
	}

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
			sb.append("A default was used for scope key ${axisName} on ${cubeNames.join(COMMA_SPACE)} since ")
			providedValues ? sb.append("the following values were provided, but not found: ${providedValues.join(COMMA_SPACE)}.") : sb.append('"no values were provided.')
			sb.append(BREAK)
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

	static String getRequiredScopeMessage(String scopeKey, VisualizerScopeInfo scopeInfo)
	{
		Set<Object> scopeValues = scopeInfo.missingRequiredScopeAvailableValues[scopeKey]
		Set<Object> providedValues = scopeInfo.missingRequiredScopeProvidedValues[scopeKey]
		Set<String> cubeNames = scopeInfo.missingRequiredScopeCubeNames[scopeKey]
		providedValues.remove(null)
		cubeNames.remove(null)

		String messageSuffix = providedValues ? " (${providedValues.join(COMMA_SPACE)} provided, but not found)" : ''
		String title = cubeNames ? "The scope for ${scopeKey} is required on ${cubeNames.join(COMMA_SPACE)}" : "The scope for ${scopeKey} is required."

		StringBuilder sb = new StringBuilder()
		sb.append("""<div title="${title}" class="input-group input-group-sm">""")
		if (scopeValues)
		{
			String selectTag = """<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_MISSING_SCOPE_SELECT}">"""
			sb.append("A scope value is required for ${scopeKey}${messageSuffix}:${BREAK}")
			sb.append(selectTag)
			sb.append('<option>Select...</option>')
			scopeValues.each {
				String value = it.toString()
				sb.append("""<option id="${scopeKey}: ${value}">${value}</option>""")
			}
			sb.append('</select>')
		}
		else
		{
			sb.append("A scope value must be entered for ${scopeKey}${messageSuffix}:${BREAK}")
			sb.append("""<input class="${DETAILS_CLASS_MISSING_SCOPE_INPUT}" id="${scopeKey}" style="color: black;" type="text" placeholder="Enter value..." >""")
		}
		sb.append('</div>')
		return sb.toString()
	}

	static String getUnboundScopeMessage(String scopeKey, VisualizerScopeInfo scopeInfo)
	{
		Set<Object> scopeValues = scopeInfo.unboundScopeAvailableValues[scopeKey]
		Set<Object> providedValues = scopeInfo.unboundScopeProvidedValues[scopeKey]
		Set<String> cubeNames = scopeInfo.unboundScopeCubeNames[scopeKey]
		providedValues.remove(null)
		cubeNames.remove(null)

		String messageSuffix = providedValues ? " (${providedValues.join(COMMA_SPACE)} provided, but not found)" : ''
		String title = cubeNames ? "The default for ${scopeKey} was utilized on ${cubeNames.join(COMMA_SPACE)}." : "The default for ${scopeKey} was utilized"

		StringBuilder sb = new StringBuilder()
		sb.append("""<div title="${title}" class="input-group input-group-sm">""")
		String selectTag = """<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_MISSING_SCOPE_SELECT}">"""
		if (scopeValues)
		{
			sb.append("A different scope value may be supplied for ${scopeKey}${messageSuffix}:${BREAK}")
			sb.append(selectTag)
			sb.append("<option>Default</option>")

			scopeValues.each {
				String value = it.toString()
				sb.append("""<option id="${scopeKey}: ${value}">${value}</option>""")
			}
		}
		else
		{
			sb.append("Default is the only option for ${scopeKey}${messageSuffix}:${BREAK}")
			sb.append(selectTag)
			sb.append("<option>Default</option>")
		}
		sb.append('</select>')
		sb.append('</div>')
		return sb.toString()
	}


	private static Set<String> findMissingScope(Map<String, Object> scope, Set<String> requiredKeys, Set mandatoryScopeKeys)
	{
		return requiredKeys.findAll { String scopeKey ->
			!mandatoryScopeKeys.contains(scopeKey) && (scope == null || !scope.containsKey(scopeKey))
		}
	}

	protected static String getMissingMinimumScopeMessage(Map<String, Object> scope, String messageScopeValues)
	{
		"""\
The scope for the following scope keys was added since required. The default scope values may be changed as desired. \
${DOUBLE_BREAK}${INDENT}${scope.keySet().join(COMMA_SPACE)}\
${BREAK} \
${messageScopeValues}"""
	}

	static String getExceptionMessage(Throwable t, Throwable e, String targetMsg)
	{
		"""\
An exception was thrown while loading ${targetMsg}. \
${DOUBLE_BREAK}<b>Message:</b> ${DOUBLE_BREAK}${e.message}${DOUBLE_BREAK}<b>Root cause: </b>\
${DOUBLE_BREAK}${t.toString()}${DOUBLE_BREAK}<b>Stack trace: </b>${DOUBLE_BREAK}${NCubeController.getTestCauses(t)}"""
	}
}