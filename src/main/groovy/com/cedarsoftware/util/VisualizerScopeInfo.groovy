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
import static com.cedarsoftware.util.VisualizerConstants.DETAILS_CLASS_SHOW_CELL_VALUES
import static com.cedarsoftware.util.VisualizerConstants.DOUBLE_BREAK

/**
 * Provides information about the scope used to visualize an n-cube.
 */

@CompileStatic
class VisualizerScopeInfo
{
	protected ApplicationID appId
	protected boolean loadingCellValues
	protected Map<String, Object> inputScope
	protected Map<String, Object> scope  = new CaseInsensitiveMap()

	protected Map<String, Set<Object>> topNodeGraphScopeAvailableValues = new CaseInsensitiveMap()
	protected Map<String, Set<String>> topNodeGraphScopeCubeNames = new CaseInsensitiveMap()

	protected Map<String, Set<Object>> optionalGraphScopeAvailableValues = new CaseInsensitiveMap()
	protected Map<String, Set<String>> optionalGraphScopeCubeNames = new CaseInsensitiveMap()

	protected Map<String, Set<Object>> showCellValuesScopeAvailableValues = new CaseInsensitiveMap()
	protected Map<String, Set<String>> showCellValuesScopeCubeNames = new CaseInsensitiveMap()

	String topNodeName
	String scopeMessage

	VisualizerScopeInfo(){}

	protected void init(ApplicationID applicationId, Map options, boolean loadCellValues = false){
		appId = applicationId
		inputScope = options.scope as CaseInsensitiveMap ?: new CaseInsensitiveMap()
		loadingCellValues = loadCellValues
		if (!loadingCellValues)
		{
			scope  = new CaseInsensitiveMap()
			topNodeGraphScopeAvailableValues = new CaseInsensitiveMap()
			topNodeGraphScopeCubeNames = new CaseInsensitiveMap()
			optionalGraphScopeAvailableValues = new CaseInsensitiveMap()
			optionalGraphScopeCubeNames = new CaseInsensitiveMap()
		}
	}

	protected void populateScopeDefaults(String startCubeName){}

	protected Set<Object> handleMissingScope(VisualizerRelInfo relInfo, String cubeName, String scopeKey, Map coordinate = null)
	{
		Set<Object> availableValues
		if (loadingCellValues)
		{
			availableValues = addShowCellValuesScope(cubeName, scopeKey, false, coordinate)
		}
		else if (relInfo.targetId == 1l)
		{
			availableValues = addTopNodeGraphScope(cubeName, scopeKey, false, coordinate)
		}
		else
		{
			availableValues = addOptionalGraphScope(cubeName, scopeKey, false, coordinate)
		}
		return availableValues
	}

	protected Set<Object> addTopNodeGraphScope(String cubeName, String scopeKey, boolean skipAvailableScopeValues = false, Map coordinate)
	{
		addTopNodeGraphScopeValues(cubeName, scopeKey, topNodeGraphScopeAvailableValues, skipAvailableScopeValues, coordinate)
		addValue(scopeKey, topNodeGraphScopeCubeNames, cubeName)
		return topNodeGraphScopeAvailableValues[scopeKey]
	}

	protected Set<Object> addOptionalGraphScope(String cubeName, String scopeKey, boolean skipAvailableScopeValues = false, Map coordinate)
	{
		Set<Object> availableValues = addScopeValues(cubeName, scopeKey, optionalGraphScopeAvailableValues, skipAvailableScopeValues, coordinate)
		addValue(scopeKey, optionalGraphScopeCubeNames, cubeName)
		return availableValues
	}

	protected Set<Object> addShowCellValuesScope(String cubeName, String scopeKey, boolean skipAvailableScopeValues = false, Map coordinate)
	{
		Set<Object> availableValues = addScopeValues(cubeName, scopeKey, showCellValuesScopeAvailableValues, skipAvailableScopeValues, coordinate)
		addValue(scopeKey, showCellValuesScopeCubeNames, cubeName)
		return availableValues
	}

	private void addTopNodeGraphScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues, Map coordinate)
	{
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (skipAvailableScopeValues)
		{
			scopeInfoMap[scopeKey] = scopeValues
		}
		else
		{
			Set scopeValuesThisCube = getColumnValues(cubeName, scopeKey, coordinate)
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

	private Set<Object> addScopeValues(String cubeName, String scopeKey, Map scopeInfoMap, boolean skipAvailableScopeValues, Map coordinate)
	{
		Set<Object> columnValues = new LinkedHashSet()
		Set<Object> scopeValues = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		if (!skipAvailableScopeValues)
		{
			columnValues = getColumnValues(cubeName, scopeKey, coordinate)
			scopeValues.addAll(columnValues)
		}
		scopeInfoMap[scopeKey] = scopeValues
		return columnValues
	}

	protected static void addValue(String scopeKey, Map scopeInfoMap, Object valueToAdd)
	{
		Set<Object> values = scopeInfoMap[scopeKey] as Set ?: new LinkedHashSet()
		values << valueToAdd
		scopeInfoMap[scopeKey] = values
	}

	protected Set<Object> getColumnValues(String cubeName, String axisName, Map coordinate)
	{
		NCube cube = NCubeManager.getCube(appId, cubeName)
		return getAllColumnValues(cube, axisName)
	}

	protected static Set<Object> getAllColumnValues(NCube cube, String axisName)
	{
		Set values = new LinkedHashSet()
		Axis axis = cube.getAxis(axisName)
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
		if (topNodeGraphScopeAvailableValues || optionalGraphScopeAvailableValues)
		{
			if (topNodeGraphScopeAvailableValues)
			{
				Map<String, Set<Object>> sorted = topNodeGraphScopeAvailableValues.sort()
				sb.append("<b>${topNodeName} scope</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
				sb.append(getTopNodeGraphScopeMessage(sorted))
			}
			else
			{
				sb.append("<b>No ${topNodeName} scope</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
			}
			sb.append("${DOUBLE_BREAK}")

			if (optionalGraphScopeAvailableValues)
			{
				Map<String, Set<Object>> sorted = optionalGraphScopeAvailableValues.sort()
				sb.append("<b>Additional scope in visualization</b>")
				sb.append('<hr style="border-top: 1px solid #aaa;margin:2px">')
				sb.append(getOptionalGraphScopeMessage(sorted))
				sb.append("${DOUBLE_BREAK}")
			}

			sb.append("""<a href="#" title="Reset scope to original defaults" class="scopeReset">Reset scope</a>""")
		}
		else{
			sb.append("No scope in the visualization.")
		}
		scopeMessage = sb.toString()
	}

	private StringBuilder getOptionalGraphScopeMessage(Map<String, Set<Object>> availableValuesMap)
	{
		StringBuilder sb = new StringBuilder()
		availableValuesMap.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames = optionalGraphScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			StringBuilder title = new StringBuilder("Scope key ${scopeKey} is used in the in the visualization. It may be optional for some ${nodesLabel} and required by others.")
			title.append(addCubeNamesList('\nFirst encountered on the following cubes, but may also be present on others:', cubeNames))
			sb.append(getScopeMessage(scopeKey, availableValuesMap[scopeKey], title, scope[scopeKey]))
		}
		return sb
	}

	private StringBuilder getTopNodeGraphScopeMessage(Map<String, Set<Object>> availableValuesMap)
	{
		StringBuilder sb = new StringBuilder()
		availableValuesMap.keySet().each{ String scopeKey ->
			sb.append(BREAK)
			Set<String> cubeNames =  topNodeGraphScopeCubeNames[scopeKey]
			cubeNames.remove(null)
			Set<Object> availableValues = availableValuesMap[scopeKey]
			String requiredOrOptional = availableValues.contains(null) ? 'optional' : 'required'
			StringBuilder title = new StringBuilder("Scope key ${scopeKey} is ${requiredOrOptional} to load ${topNodeName}")
			title.append(addCubeNamesList('.\nFirst encountered on the following cubes, but may also be present on others:', cubeNames))
			sb.append(getScopeMessage(scopeKey, availableValues, title, scope[scopeKey]))
		}
		return sb
	}

	protected StringBuilder getOptionalNodeScopeMessage(VisualizerRelInfo relInfo, Map<String, Set<Object>> nodeAvailableValues, Map<String, Set<String>> nodeCubeNames )
	{
		if (nodeAvailableValues.keySet().find {String scopeKey -> loadAgain(relInfo, scopeKey) })
		{
			return null
		}

		StringBuilder sb = new StringBuilder("<b>Defaults were used for the following scope keys. Different values may be provided:${DOUBLE_BREAK}")
		nodeAvailableValues.keySet().each { String scopeKey ->
			Set<String> cubeNames = nodeCubeNames[scopeKey]
			StringBuilder title = new StringBuilder("Scope key ${scopeKey} is optional to load this ${nodeLabel}")
			title.append(addCubeNamesList('. Used on:', cubeNames))
			Set<Object> availableValues = nodeAvailableValues[scopeKey]
			sb.append(getScopeMessage(scopeKey, availableValues, title, scope[scopeKey], relInfo.showCellValues))
			sb.append(BREAK)
		}
		return sb
	}

	protected static StringBuilder getScopeMessage(String scopeKey, Set<Object> availableScopeValues, StringBuilder title, Object providedScopeValue, boolean showCellValues = false)
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
		String showCellValuesClass = showCellValues ? DETAILS_CLASS_SHOW_CELL_VALUES : ''

		sb.append("""<div class="input-group" title="${title}">""")
		sb.append("""<div class="input-group-btn">""")
		sb.append("""<button type="button" class="btn btn-default dropdown-toggle"  data-toggle="dropdown">${scopeKey} ${caret}</button>""")
		if (availableScopeValues)
		{
			sb.append("""<ul class="dropdown-menu">""")
			availableScopeValues.each {Object scopeValue ->
				if (scopeValue)
				{
					sb.append("""<li id="${scopeKey}: ${scopeValue}" class="${DETAILS_CLASS_SCOPE_CLICK} ${showCellValuesClass}" style="color: black;">${scopeValue}</li>""")
				}
				else
				{
					sb.append("""<li id="${scopeKey}: Default" class="${DETAILS_CLASS_SCOPE_CLICK} ${showCellValuesClass}" style="color: black;">Default</li>""")
				}
			}
			sb.append("""</ul>""")
		}
		sb.append("""</div>""")
		sb.append("""<input id="${scopeKey}" value="${value}" placeholder="${placeHolder}" class="${DETAILS_CLASS_SCOPE_INPUT} ${DETAILS_CLASS_FORM_CONTROL} ${showCellValuesClass}" style="color: black;" type="text">""")
		sb.append("""</div>""")
		return sb
	}

	protected boolean loadAgain(VisualizerRelInfo relInfo, String scopeKey)
	{
		return false
	}

	private static StringBuilder addCubeNamesList(String prefix, Set<String> cubeNames)
	{
		StringBuilder sb = new StringBuilder()
		if (cubeNames)
		{
			sb.append("${prefix}\n")
			cubeNames.each { String cubeName ->
				sb.append("${cubeName}\n")
			}
		}
		return sb
	}

	protected String getNodesLabel()
	{
		return 'cubes'
	}

	protected String getNodeLabel()
	{
		return 'cube'
	}
}