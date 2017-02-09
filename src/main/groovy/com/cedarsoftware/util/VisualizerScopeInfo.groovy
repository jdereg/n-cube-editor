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
import static com.cedarsoftware.util.VisualizerConstants.DOUBLE_BREAK
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

	Map<String, Set<Object>> scopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> optionalScopeAvailableValues = new CaseInsensitiveMap()


	String scopeMessage

	VisualizerScopeInfo(){}

	VisualizerScopeInfo(ApplicationID applicationID, Map<String, Object> scopeMap = null)
	{
		appId = applicationID
		scope = scopeMap as CaseInsensitiveMap ?: new CaseInsensitiveMap()
	}

	void finish()
	{
		scopeAvailableValues.putAll(unboundScopeAvailableValues)
		unboundScopeAvailableValues = new CaseInsensitiveMap()
		unboundScopeProvidedValues = new CaseInsensitiveMap()
		unboundScopeCubeNames = new CaseInsensitiveMap()

		scopeAvailableValues.putAll(missingRequiredScopeAvailableValues)
		missingRequiredScopeAvailableValues = new CaseInsensitiveMap()
		missingRequiredScopeProvidedValues = new CaseInsensitiveMap()
		missingRequiredScopeCubeNames = new CaseInsensitiveMap()
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

		StringBuilder sb = new StringBuilder("${BREAK}")
		if (missingRequiredScopeAvailableValues || okRequiredScopeKeys)
		{
			sb.append("<b>Required scope</b>")
			sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			sb.append(getOkScopeMessages(okRequiredScopeKeys))
			sb.append(requiredScopeMessage)
			sb.append("${DOUBLE_BREAK}")
		}
		if (unboundScopeAvailableValues || okScopeKeys)
		{
			sb.append("<b>Optional scope</b>")
			sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			//sb.append("<pre>")
			sb.append(getOkScopeMessages(okScopeKeys ))
			sb.append(unboundScopeMessage)
			sb.append("${DOUBLE_BREAK}")
		}
		sb.append("""<a href="#" class="scopeReset">Reset scope</a>""")
		scopeMessage = sb.toString()
	}

	private StringBuilder getUnboundScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		unboundScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(getScopeMessage(scopeKey, true))
		}
		return sb
	}

	private StringBuilder getRequiredScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		missingRequiredScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(getScopeMessage(scopeKey, false))
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
		sb.append("""<div class="row" >""")
		sb.append("""<div class="col-md-4" align="right"><b>${scopeKey}:</b></div>""")
		sb.append("""<div class="col-md-8">""")
		sb.append("""<div class="input-group input-group-sm" title="${title}">""")
		sb.append("""<input class="${DETAILS_CLASS_SCOPE_INPUT}" id="${scopeKey}" style="color: black;" type="text" value="${scopeValue}" />""")
		sb.append("""</div>""")
		sb.append("""</div>""")
		sb.append("""</div>""")
		return sb
	}

	StringBuilder getScopeMessage(String scopeKey, boolean optionalScope)
	{
		StringBuilder sb = new StringBuilder(BREAK)
		Set<Object> scopeValues
		Set<Object> providedValues
		Set<String> cubeNames
		String divTitle
		String selectValue

		if (optionalScope)
		{
			scopeValues = unboundScopeAvailableValues[scopeKey]
			providedValues = unboundScopeProvidedValues[scopeKey]
			cubeNames = unboundScopeCubeNames[scopeKey]
			divTitle = cubeNames ? "The default for ${scopeKey} was utilized on ${cubeNames.join(COMMA_SPACE)}." : "The default for ${scopeKey} was utilized."
			selectValue = 'Default'
		}
		else
		{
			scopeValues = missingRequiredScopeAvailableValues[scopeKey]
			providedValues = missingRequiredScopeProvidedValues[scopeKey]
			cubeNames =  missingRequiredScopeCubeNames[scopeKey]
			divTitle = cubeNames ? "The scope for ${scopeKey} is required on ${cubeNames.join(COMMA_SPACE)}" : "The scope for ${scopeKey} is required."
			selectValue = 'Select...'
		}

		providedValues.remove(null)
		cubeNames.remove(null)
		String messageSuffix = providedValues ? " ${providedValues.join(COMMA_SPACE)} provided, but not found." : ''
		sb.append("""<div class="row" >""")
		sb.append("""<div class="col-md-4" align="right"><b>${scopeKey}:</b></div>""")
		sb.append("""<div class="col-md-8">""")
		sb.append("""<div class="input-group input-group-sm" title="${divTitle}">""")
		if (scopeValues || optionalScope)
		{
			sb.append("""<select class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_SCOPE_SELECT}">""")
			sb.append("""<option>${selectValue}</option>""")
			scopeValues.each {
				String value = it.toString()
				sb.append("""<option id="${scopeKey}: ${value}">${value}</option>""")
			}
			sb.append('</select>')
		}
		else
		{
            sb.append("""<input class="${DETAILS_CLASS_SCOPE_INPUT}" title="'A scope value must be provided." id="${scopeKey}" style="color: black;" type="text" placeholder="Enter value...">""")
		}
		sb.append("""</div>""")
		sb.append("""</div>""")
		sb.append("""</div>""")

		if (messageSuffix)
		{
			sb.append("""<div class="row" >""")
			sb.append("""<div class="col-md-4">${SPACE}</div>""")
			sb.append("""<div class="col-md-8">${messageSuffix}</div>""")
			sb.append("""</div>""")
		}
		return sb
	}
}