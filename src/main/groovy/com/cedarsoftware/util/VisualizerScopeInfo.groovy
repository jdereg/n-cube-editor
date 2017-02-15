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
	Map<String, Object> scope  = new CaseInsensitiveMap()

	Map<String, Set<Object>> requiredStartScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> requiredStartScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> requiredStartScopeCubeNames = new CaseInsensitiveMap()

	Map<String, Set<Object>> optionalGraphScopeAvailableValues = new CaseInsensitiveMap()
	Map<String, Set<Object>> optionalGraphScopeProvidedValues = new CaseInsensitiveMap()
	Map<String, Set<String>> optionalGraphScopeCubeNames = new CaseInsensitiveMap()

	String scopeMessage

	VisualizerScopeInfo(){}

	VisualizerScopeInfo(ApplicationID applicationID)
	{
		appId = applicationID
	}

	Set<Object> addRequiredStartScope(String cubeName, String scopeKey, Object providedValue, boolean skipAvailableScopeValues = false)
	{
		addRequiredStartScopeValues(cubeName, scopeKey, requiredStartScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, requiredStartScopeCubeNames, cubeName)
		addValue(scopeKey, requiredStartScopeProvidedValues, providedValue)
		return requiredStartScopeAvailableValues[scopeKey]
	}

	Set<Object> addOptionalGraphScope(String cubeName, String scopeKey, Object providedValue, boolean skipAvailableScopeValues = false)
	{
		addScopeValues(cubeName, scopeKey, optionalGraphScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, optionalGraphScopeCubeNames, cubeName)
		addValue(scopeKey, optionalGraphScopeProvidedValues, providedValue)
		return optionalGraphScopeAvailableValues[scopeKey]
	}

	private void addRequiredStartScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
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

	private void addScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (!skipAvailableScopeValues)
		{
			scopeValues.addAll(getInScopeColumnValues(cubeName, scopeKey))
		}
		scopeInfoMap[scopeKey] = scopeValues
	}

	protected static void addValue(String scopeKey, Map scopeInfoMap, Object valueToAdd)
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
			for (Column column : axis.columns)
			{
				values.add(column.value)
			}
		}
		return values
	}

	void createScopePrompt()
	{
		StringBuilder sb = new StringBuilder("${BREAK}")
		if (requiredStartScopeAvailableValues)
		{
			sb.append("<b>Required scope to load graph</b>")
			sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			sb.append(requiredStartScopeMessage)
			sb.append("${DOUBLE_BREAK}")
		}
		if (optionalGraphScopeAvailableValues)
		{
			sb.append("<b>Optional scope in graph</b>")
			sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			sb.append(optionalGraphScopeMessage)
			sb.append("${DOUBLE_BREAK}")
		}
		sb.append("""<a href="#" class="scopeReset">Reset scope</a>""")
		scopeMessage = sb.toString()
	}

	private StringBuilder getOptionalGraphScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		optionalGraphScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames = optionalGraphScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			String providedValue = scope[scopeKey] as String
			StringBuilder title = new StringBuilder("${scopeKey} is optional to load the graph, but may be required for some nodes.")
			sb.append(getScopeMessage(scopeKey, optionalGraphScopeAvailableValues[scopeKey], title, providedValue))
		}
		return sb
	}

	private StringBuilder getRequiredStartScopeMessage()
	{
		StringBuilder sb = new StringBuilder()
		requiredStartScopeAvailableValues.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames =  requiredStartScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			String providedValue = scope[scopeKey] as String
			StringBuilder title = new StringBuilder("${scopeKey} is required to load the graph.")
			sb.append(getScopeMessage(scopeKey, requiredStartScopeAvailableValues[scopeKey], title, providedValue))
		}
		return sb
	}

	protected static StringBuilder getOptionalNodeScopeMessage(Map<String, Set<Object>> nodeAvailableValues, Map<String, Set<Object>> nodeProvidedValues,  Map<String, Set<String>> nodeCubeNames )
	{
		StringBuilder sb = new StringBuilder("<b>Optional scope may be provided: </b> ${DOUBLE_BREAK}")
		nodeAvailableValues.keySet().each { String axisName ->
			Set<Object> providedValues = nodeProvidedValues[axisName]
			providedValues.remove(null)
			String providedValue = providedValues ? providedValues.join(COMMA_SPACE) : null
			Set<String> cubeNames = nodeCubeNames[axisName]
			StringBuilder title = new StringBuilder("${axisName} is optional to load this node.")
			title.append(addCubeNamesList('Used on:', cubeNames))
			sb.append(getScopeMessage(axisName, nodeAvailableValues[axisName], title, providedValue))
		}
		return sb
	}

	static StringBuilder getScopeMessage(String scopeKey, Set<Object> scopeValues, StringBuilder title, String providedValue)
	{
		StringBuilder sb = new StringBuilder()
		boolean optionalScope = scopeValues.contains(null)
		String nullValueOptionLabel = optionalScope ? 'Default' : null
		boolean noMatch = true
		String value = providedValue ?: ''

		if (scopeValues || optionalScope)
		{
			sb.append("""<div class="input-group">""")
			sb.append("""<div class="input-group-btn">""")
			sb.append("""<button type="button" class="btn btn-default dropdown-toggle" title="${title}" data-toggle="dropdown">${scopeKey} <span class="caret"></span></button>""")
			sb.append("""<ul class="dropdown-menu ${DETAILS_CLASS_SCOPE_SELECT}">""")
			scopeValues.each {
				if (it)
				{
					String scopeValue = it as String
					if (scopeValue == providedValue){
						noMatch = false
					}
					sb.append("""<li id="${scopeKey}: ${scopeValue}" style="color: black;">${scopeValue}</li>""")
				}
			}
			sb.append("""</ul>""")
			sb.append("""</div>""")
			sb.append("""<input id="${scopeKey}" style="color: black;" type="text" placeholder="Select or enter value..." value="${value}" class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_SCOPE_INPUT}">""")
			sb.append("""</div>""")
		}

		/*if (providedValue && noMatch)
		{
			title.append("\n\n(${providedValue} provided, but not found)")
		}*/

		return sb
	}

	static StringBuilder addCubeNamesList(String prefix, Set<String> cubeNames)
	{
		StringBuilder sb = new StringBuilder()
		if (cubeNames)
		{
			sb.append(" ${prefix}\n")
			cubeNames.each { String cubeName ->
				sb.append("${cubeName}\n")
			}
		}
		return sb
	}
}