package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.Axis
import com.cedarsoftware.ncube.Column
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.BREAK
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_FORM_CONTROL
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_SCOPE_INPUT
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_SCOPE_CLICK
import static com.cedarsoftware.util.VisualizerConstants.DOUBLE_BREAK

/**
 * Provides information about the scope used to visualize an n-cube.
 */

@CompileStatic
class VisualizerScopeInfo
{
	protected ApplicationID appId
	protected Map<String, Object> scope  = new CaseInsensitiveMap()
	protected Set<String> derivedScopeKeys  = new CaseInsensitiveSet()

	protected Map<String, Set<Object>> requiredGraphScopeAvailableValues = new CaseInsensitiveMap()
	protected Map<String, Set<String>> requiredGraphScopeCubeNames = new CaseInsensitiveMap()

	protected Map<String, Set<Object>> optionalGraphScopeAvailableValues = new CaseInsensitiveMap()
	protected Map<String, Set<String>> optionalGraphScopeCubeNames = new CaseInsensitiveMap()

	String scopeMessage
	boolean displayScopeMessage

	VisualizerScopeInfo(){}

	protected VisualizerScopeInfo(ApplicationID applicationId){
		appId = applicationId
	}

	protected void populateScopeDefaults(String startCubeName){}

	protected Set<Object> addRequiredGraphScope(String cubeName, String scopeKey, boolean skipAvailableScopeValues = false)
	{
		addRequiredGraphScopeValues(cubeName, scopeKey, requiredGraphScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, requiredGraphScopeCubeNames, cubeName)
		return requiredGraphScopeAvailableValues[scopeKey]
	}

	protected Set<Object> addOptionalGraphScope(String cubeName, String scopeKey, boolean skipAvailableScopeValues = false)
	{
		Set<Object> inScopeAvailableValues = addScopeValues(cubeName, scopeKey, optionalGraphScopeAvailableValues, skipAvailableScopeValues)
		addValue(scopeKey, optionalGraphScopeCubeNames, cubeName)
		return inScopeAvailableValues
	}

	private void addRequiredGraphScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
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

	private Set<Object> addScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues)
	{
		Set<Object> inScopeColumnValues = new LinkedHashSet()
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (!skipAvailableScopeValues)
		{
			inScopeColumnValues = getInScopeColumnValues(cubeName, scopeKey)
			scopeValues.addAll(inScopeColumnValues)
		}
		scopeInfoMap[scopeKey] = scopeValues
		return inScopeColumnValues
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

	protected void createGraphScopePrompt()
	{
		StringBuilder sb = new StringBuilder("${BREAK}")

		if (requiredGraphScopeAvailableValues || optionalGraphScopeAvailableValues)
		{
			if (requiredGraphScopeAvailableValues)
			{
				Map<String, Set<Object>> sorted = requiredGraphScopeAvailableValues.sort()
				sb.append("<b>Required scope to load graph</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
				sb.append(getRequiredGraphScopeMessage(sorted))
			}
			else
			{
				sb.append("<b>No required scope to load the graph</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			}
			sb.append("${DOUBLE_BREAK}")

			if (optionalGraphScopeAvailableValues)
			{
				Map<String, Set<Object>> sorted = optionalGraphScopeAvailableValues.sort()
				sb.append("<b>Optional scope in graph</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
				sb.append(getOptionalGraphScopeMessage(sorted))
			}
			else
			{
				sb.append("<b>No optional scope in the graph</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			}
			sb.append("${DOUBLE_BREAK}")

			sb.append("""<a href="#" title="Reset scope to original defaults" class="scopeReset">Reset scope</a>""")
			displayScopeMessage = true
		}
		else{
			sb.append("No required or optional scope in the graph.")
			displayScopeMessage = false
		}
		scopeMessage = sb.toString()
	}

	private StringBuilder getOptionalGraphScopeMessage(Map<String, Set<Object>> availableValues)
	{
		StringBuilder sb = new StringBuilder()
		availableValues.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames = optionalGraphScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			StringBuilder title = new StringBuilder("${scopeKey} is optional to load the graph, but may be required for some nodes")
			sb.append(getScopeMessage(scopeKey, availableValues[scopeKey], title, scope[scopeKey]))
		}
		return sb
	}

	private StringBuilder getRequiredGraphScopeMessage(Map<String, Set<Object>> availableValues)
	{
		StringBuilder sb = new StringBuilder()
		availableValues.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames =  requiredGraphScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			StringBuilder title = new StringBuilder("${scopeKey} is required to load the graph")
			sb.append(getScopeMessage(scopeKey, availableValues[scopeKey], title, scope[scopeKey]))
		}
		return sb
	}

	protected StringBuilder getOptionalNodeScopeMessage(Map<String, Set<Object>> nodeAvailableValues, Map<String, Set<String>> nodeCubeNames )
	{
		StringBuilder sb = new StringBuilder("<b>Defaults were used for the following scope keys. Different values may be provided:${DOUBLE_BREAK}")
		nodeAvailableValues.keySet().each { String scopeKey ->
			Set<String> cubeNames = nodeCubeNames[scopeKey]
			StringBuilder title = new StringBuilder("${scopeKey} is optional to load this node")
			title.append(addCubeNamesList('. Used on:', cubeNames))
			Set<Object> availableValues = nodeAvailableValues[scopeKey]
			sb.append(getScopeMessage(scopeKey, availableValues, title, scope[scopeKey]))
			sb.append(BREAK)
		}
		return sb
	}

	protected static StringBuilder getScopeMessage(String scopeKey, Set<Object> availableScopeValues, StringBuilder title, Object providedScopeValue)
	{
		String value
		StringBuilder sb = new StringBuilder()
		String caret = availableScopeValues ? """<span class="caret"></span>""" : ''
		String placeHolder = availableScopeValues ? 'Select or enter value...' : 'Enter value...'
		if (availableScopeValues.contains(null))
		{
			value = providedScopeValue ?: 'Default'
		}
		else
		{
			value = providedScopeValue ?: ''
		}

		sb.append("""<div class="input-group" title="${title}">""")
		sb.append("""<div class="input-group-btn">""")
		sb.append("""<button type="button" class="btn btn-default dropdown-toggle"  data-toggle="dropdown">${scopeKey} ${caret}</button>""")
		if (availableScopeValues)
		{
			sb.append("""<ul class="dropdown-menu">""")
			availableScopeValues.each {Object scopeValue ->
				if (scopeValue)
				{
					sb.append("""<li id="${scopeKey}: ${scopeValue}" class="${DETAILS_CLASS_SCOPE_CLICK}" style="color: black;">${scopeValue}</li>""")
				}
				else
				{
					sb.append("""<li id="${scopeKey}: Default" class="${DETAILS_CLASS_SCOPE_CLICK}" style="color: black;">Default</li>""")
				}
			}
			sb.append("""</ul>""")
		}
		sb.append("""</div>""")
		sb.append("""<input id="${scopeKey}" style="color: black;" type="text" placeholder="${placeHolder}" value="${value}" class="${DETAILS_CLASS_FORM_CONTROL} ${DETAILS_CLASS_SCOPE_INPUT}">""")
		sb.append("""</div>""")
		return sb
	}

	private static StringBuilder addCubeNamesList(String prefix, Set<String> cubeNames)
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