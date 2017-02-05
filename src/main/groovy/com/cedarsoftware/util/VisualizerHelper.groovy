package com.cedarsoftware.util

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
	static String handleUnboundAxes(VisualizerScopeInfo scopeInfo)
	{
		StringBuilder sb = new StringBuilder()
		scopeInfo.optionalScopeAvailableValues.keySet().each{ String axisName ->
			sb.append(BREAK + getOptionalScopeValueMessage(axisName, scopeInfo))
		}
		return sb.toString()
	}

	static String handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerInfo visInfo, String targetMsg )
	{
		String cubeName = e.cubeName
		String axisName = e.axisName
		if (cubeName && axisName)
		{
			return getRequiredScopeValuesMessage(visInfo, [axisName] as Set, cubeName)
		}
		else
		{
			return handleException(e as Exception, targetMsg)
		}
	}

	static String handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerInfo visInfo, VisualizerRelInfo relInfo, Set mandatoryScopeKeys)
	{
		Set<String> missingScope = findMissingScope(relInfo.availableTargetScope, e.requiredKeys, mandatoryScopeKeys)
		if (missingScope)
		{
			return getRequiredScopeValuesMessage(visInfo, missingScope, e.cubeName) //TODO: add provided value
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

	private static String getRequiredScopeValuesMessage(VisualizerInfo visInfo, Set<String> missingScope, String cubeName)
	{
		StringBuilder message = new StringBuilder()
		missingScope.each{ String scopeKey ->
			Set<Object> requiredScopeValues = visInfo.scopeInfo.addRequiredScope(scopeKey, cubeName,  null)  //TODO: add provided value
			message.append(BREAK + getRequiredScopeValueMessage(scopeKey, requiredScopeValues))
		}
		return message.toString()
	}

	static String getOptionalScopeValueMessage(String scopeKey, VisualizerScopeInfo scopeInfo)
	{
		Set<Object> scopeValues = scopeInfo.optionalScopeAvailableValues[scopeKey]
		Set<Object> providedValues = scopeInfo.optionalScopeProvidedValues[scopeKey]
		String defaultValueSuffix
		if (providedValues)
		{
			providedValues.remove(null)
		}
		defaultValueSuffix = providedValues ? " (${providedValues.join(COMMA_SPACE)} provided, but not found)" : ' (no value provided)'

		String cubeNames = scopeInfo.optionalScopeCubeNames[scopeKey].join(COMMA_SPACE)
		String title = "The default for ${scopeKey} was utilized on ${cubeNames}"

		StringBuilder sb = new StringBuilder()
		sb.append("""<div id="${scopeKey}" title="${title}" class="input-group input-group-sm">""")
		String selectTag = """<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_MISSING_SCOPE_SELECT}">"""
		if (scopeValues)
		{
			sb.append("A different scope value may be supplied for ${scopeKey}:${BREAK}")
			sb.append(selectTag)
			sb.append("<option>Default${defaultValueSuffix}</option>")

			scopeValues.each {
				String value = it.toString()
				sb.append("""<option title="${scopeKey}: ${value}">${value}</option>""")
			}
		}
		else
		{
			sb.append("Default is the only option for ${scopeKey}:${BREAK}")
			sb.append(selectTag)
			sb.append("<option>Default${defaultValueSuffix}</option>")
		}
		sb.append('</select>')
		sb.append('</div>')
		return sb.toString()
	}

	static String getRequiredScopeValueMessage(String scopeKey, Set<Object> scopeValues)
	{
		StringBuilder sb = new StringBuilder()
		if (scopeValues)
		{
			String selectTag = """<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_MISSING_SCOPE_SELECT}">"""
			sb.append("A scope value must be supplied for ${scopeKey}:")
			sb.append(selectTag)
			sb.append('<option>Select...</option>')
			scopeValues.each {
				String value = it.toString()
				sb.append("""<option title="${scopeKey}: ${value}">${value}</option>""")
			}
			sb.append('</select>')

		}
		else
		{
			sb.append("""<div id="${scopeKey}" class="input-group input-group-sm">""")
			sb.append("A scope value must be entered manually for ${scopeKey} since there are no values to choose from: ")
			sb.append("""<input class="${DETAILS_CLASS_MISSING_SCOPE_INPUT}" title="${scopeKey}" style="color: black;" type="text" placeholder="Enter value..." >""")
		}
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
${DOUBLE_BREAK}${t.toString()}${DOUBLE_BREAK}<b>Stack trace: </b>${DOUBLE_BREAK}${t.stackTrace.toString()}"""
	}
}