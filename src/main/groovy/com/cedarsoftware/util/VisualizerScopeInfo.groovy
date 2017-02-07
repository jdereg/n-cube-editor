package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.Axis
import com.cedarsoftware.ncube.Column
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.BREAK
import static com.cedarsoftware.util.VisualizerConstants.COMMA_SPACE
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_FORM_CONTROL
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_SCOPE_INPUT
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_SCOPE_SELECT

import static com.cedarsoftware.util.VisualizerConstants.SPACE


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

	Set<String> allRequiredScopeKeys = new CaseInsensitiveSet()

	String scopeMessage

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

	void createScopePrompt()
	{
		Set<String> okScopeKeys = new CaseInsensitiveSet(scope.keySet())
		okScopeKeys.removeAll(missingRequiredScopeAvailableValues.keySet())
		okScopeKeys.removeAll(unboundScopeAvailableValues.keySet())
		Set<String> okRequiredScopeKeys = okScopeKeys.intersect(allRequiredScopeKeys)
		okScopeKeys.removeAll(okRequiredScopeKeys)

		StringBuilder sb = new StringBuilder()
		if (missingRequiredScopeAvailableValues || okRequiredScopeKeys)
		{
			sb.append("${BREAK}<b>Required scope</b>")
			sb.append(getOkScopeMessages(okRequiredScopeKeys))
			sb.append(requiredScopeMessage)
			sb.append('<hr style="border-top: 1px solid #aaa;margin:8px">')
		}
		if (unboundScopeAvailableValues || okScopeKeys)
		{
			sb.append("${BREAK}<b>Optional scope</b>")
			sb.append(getOkScopeMessages(okScopeKeys ))
			sb.append(unboundScopeMessage)
			sb.append('<hr style="border-top: 1px solid #aaa;margin:8px">')
		}
		sb.append('<hr style="border-top: 1px solid #aaa;margin:8px">')
		sb.append("""${BREAK}<a href="#" class="scopeReset">Reset scope</a>""")
		scopeMessage = sb.toString()
	}

	private StringBuilder getUnboundScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		unboundScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(getScopeMessage(scopeKey, false))
		}
		return sb
	}

	private StringBuilder getRequiredScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		missingRequiredScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(getScopeMessage(scopeKey, true))
		}
		return sb
	}

	private StringBuilder getOkScopeMessages(Set<String> okScopeKeys)
	{
		StringBuilder sb = new StringBuilder()
		okScopeKeys.each{ String scopeKey ->
			sb.append(getOkScopeMessage(scopeKey))
		}
		return sb
	}

	private StringBuilder getOkScopeMessage(String scopeKey)
	{
		StringBuilder sb = new StringBuilder(BREAK)
		Object scopeValue = scope[scopeKey]
		String title = "Scope key ${scopeKey} with value ${scopeValue}"
		sb.append("""<div title="${title}" class="input-group input-group-sm">""")
		sb.append("<b>${scopeKey}</b>:${SPACE}")
		sb.append("""<input class="${DETAILS_CLASS_SCOPE_INPUT}" id="${scopeKey}" style="color: black;" type="text" value="${scopeValue}" />""")
		sb.append('</div>')
		return sb
	}

	StringBuilder getScopeMessage(String scopeKey, boolean requiredScope)
	{
		StringBuilder sb = new StringBuilder(BREAK)
		Set<Object> scopeValues
		Set<Object> providedValues
		Set<String> cubeNames
		String divTitle
		String inputTitle
		String inputValue
		boolean inputDisabled

		if (requiredScope)
		{
			scopeValues = missingRequiredScopeAvailableValues[scopeKey]
			providedValues = missingRequiredScopeProvidedValues[scopeKey]
			cubeNames =  missingRequiredScopeCubeNames[scopeKey]
			divTitle = cubeNames ? "The scope for ${scopeKey} is required on ${cubeNames.join(COMMA_SPACE)}" : "The scope for ${scopeKey} is required."
			inputTitle = '"A scope value must be provided.'
			inputValue = null
			inputDisabled = false
		}
		else
		{
			scopeValues = unboundScopeAvailableValues[scopeKey]
			providedValues = unboundScopeProvidedValues[scopeKey]
			cubeNames = unboundScopeCubeNames[scopeKey]
			divTitle = cubeNames ? "The default for ${scopeKey} was utilized on ${cubeNames.join(COMMA_SPACE)}." : "The default for ${scopeKey} was utilized."
			inputTitle = '"Default is the only value available.'
			inputValue = 'Default'
			inputDisabled = true
		}

		providedValues.remove(null)
		cubeNames.remove(null)
		String messageSuffix = providedValues ? " ${providedValues.join(COMMA_SPACE)} provided, but not found." : ''
		sb.append("""<div title="${divTitle}" class="input-group input-group-sm">""")
		if (scopeValues)
		{
			sb.append("""<b>${scopeKey}</b>:${SPACE}")<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_SCOPE_SELECT}">${messageSuffix}""")
			sb.append('<option>Select...</option>')
			scopeValues.each {
				String value = it.toString()
				sb.append("""<option id="${scopeKey}: ${value}">${value}</option>""")
			}
			sb.append('</select>')
		}
		else
		{
			String disabled = inputDisabled ? 'disabled' : ''
			String value = inputValue ? 'value="${inputValue}"' : ''
			sb.append("""<b>${scopeKey}</b>:${SPACE}")<input class="${DETAILS_CLASS_SCOPE_INPUT}" title="${inputTitle}" id="${scopeKey}" style="color: black;" type="text" placeholder="Enter value..." ${disabled} ${value}>${messageSuffix}""")
		}
		sb.append('</div>')
		return sb
	}
}