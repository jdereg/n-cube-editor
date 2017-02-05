package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import com.cedarsoftware.ncube.util.LongHashSet
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.*

/**
 * Provides information to visualize a source cube, a target cube
 * and their relationship.
 */

@CompileStatic
class VisualizerRelInfo
{
	ApplicationID appId

	Set<String> notes = []
	Map<String, Object> availableTargetScope

	long targetId
	NCube targetCube
	Map<String, Object> targetScope
	long targetLevel
	String nodeLabelPrefix = ''

	long sourceId
	NCube sourceCube
	Map<String, Object> sourceScope
	String sourceFieldName

	boolean cellValuesLoaded
	boolean showCellValuesLink
	boolean showCellValues

	List<VisualizerCellInfo> cellInfo
	VisualizerScopeInfo scopeInfo

	List<String> typesToAdd

	protected VisualizerHelper helper = new VisualizerHelper()

	VisualizerRelInfo() {}

	VisualizerRelInfo(ApplicationID applicationId)
	{
		appId = applicationId
		scopeInfo = new VisualizerScopeInfo(appId)
	}

	VisualizerRelInfo(ApplicationID applicationId, Map node)
	{
		appId  = applicationId
		scopeInfo = new VisualizerScopeInfo(appId)
		targetCube = NCubeManager.getCube(appId, node.cubeName as String)
		String sourceCubeName = node.sourceCubeName as String
		sourceCube = sourceCubeName ? NCubeManager.getCube(appId, sourceCubeName) : null
		sourceFieldName = node.fromFieldName
		targetId = Long.valueOf(node.id as String)
		targetLevel = Long.valueOf(node.level as String)
		targetScope = node.scope as CaseInsensitiveMap
		availableTargetScope = node.availableScope as CaseInsensitiveMap
		showCellValuesLink = node.showCellValuesLink as boolean
		showCellValues = node.showCellValues as boolean
		cellValuesLoaded = node.cellValuesLoaded as boolean
		typesToAdd = node.typesToAdd as List
	}

	boolean loadCellValues(VisualizerInfo visInfo)
	{
		cellInfo = []
		cellValuesLoaded = true
		if (showCellValues)
		{
			Map<LongHashSet, Object> cellMap = targetCube.cellMap
			cellMap.each { LongHashSet ids, Object noExecuteCell ->
				Map<String, Object> coordinate = availableTargetScope as CaseInsensitiveMap ?: new CaseInsensitiveMap()
				coordinate.putAll(targetCube.getCoordinateFromIds(ids))
				VisualizerCellInfo visCellInfo = new VisualizerCellInfo(String.valueOf(targetId), coordinate)
				try
				{
					visCellInfo.cell = targetCube.getCell(coordinate)
				}
				catch (Exception e)
				{
					visCellInfo.exception = e
				}
				visCellInfo.noExecuteCell = noExecuteCell
				cellInfo << visCellInfo
			}
			cellInfo.sort { VisualizerCellInfo cellInfo ->
				cellInfo.coordinate.toString()
			}
		}
		return true
	}

	Set<String> getRequiredScope()
	{
		return targetCube.getRequiredScope(availableTargetScope, new CaseInsensitiveMap())
	}

	String getDetails(VisualizerInfo visInfo)
	{
		StringBuilder sb = new StringBuilder()

		getDetailsMap(sb, 'Scope', targetScope)
		getDetailsMap(sb, 'Available scope', availableTargetScope)
		getDetailsSet(sb, 'Axes', targetCube.axisNames)

		//Cell values
		if (cellValuesLoaded && showCellValues)
		{
			addCellValueSection(visInfo, sb)
		}
		return sb.toString()
	}

	private void addCellValueSection(VisualizerInfo visInfo, StringBuilder sb)
	{
		StringBuilder cellValuesBuilder = new StringBuilder()
		StringBuilder linkBuilder = new StringBuilder()
		sb.append("<b>Cell values</b>")
		getCellValues(visInfo, cellValuesBuilder, linkBuilder )
		sb.append(linkBuilder.toString())
		sb.append("""<pre><ul class="${DETAILS_CLASS_CELL_VALUES}">""")
		sb.append(cellValuesBuilder.toString())
		sb.append("</ul></pre>")
	}

	private void getCellValues(VisualizerInfo visInfo, StringBuilder cellValuesBuilder, StringBuilder linkBuilder)
	{
		Long id = 0l

		if (cellInfo)
		{
			cellInfo.each { VisualizerCellInfo visCellInfo ->
				visCellInfo.getCellValue(visInfo, this, id++, cellValuesBuilder)
			}

			linkBuilder.append(DOUBLE_BREAK)
			linkBuilder.append("""<a href="#" title="Expand all cell details" class="${DETAILS_CLASS_EXPAND_ALL}"">Expand all</a>""")
			linkBuilder.append("${SPACE}${SPACE}")
			linkBuilder.append("""<a href="#" title="Collapse all cell details" class="${DETAILS_CLASS_COLLAPSE_ALL}"">Collapse all</a>""")
			linkBuilder.append(BREAK)
		}
		else
		{
			cellValuesBuilder.append('none')
		}
	}

	static void getDetailsMap(StringBuilder sb, String title, Map<String, Object> map)
	{
		sb.append("<b>${title}</b>")
		sb.append("<pre><ul>")
		if (map)
		{
			map.each { String key, Object value ->
				sb.append("<li>${key}: ${value}</li>")
			}
		}
		else
		{
			sb.append("<li>none</li>")
		}
		sb.append("</ul></pre>${BREAK}")
	}

	static void getDetailsSet(StringBuilder sb, String title, Set<String> set)
	{
		sb.append("<b>${title}</b>")
		sb.append("<pre><ul>")
		if (set)
		{
			set.each { String value ->
				sb.append("<li>${value}</li>")
			}
		}
		else
		{
			sb.append("<li>none</li>")
		}
		sb.append("</ul></pre>${BREAK}")
	}

	String getGroupName(VisualizerInfo visInfo = null, String cubeName = targetCube.name)
	{
		return targetCube.hasRuleAxis() ? RULE_NCUBE : NCUBE
	}

	protected static String getDotSuffix(String value)
	{
		int lastIndexOfDot = value.lastIndexOf('.')
		return lastIndexOfDot == -1 ? value : value.substring(lastIndexOfDot + 1)
	}

	protected static String getDotPrefix(String value) {
		int indexOfDot = value.indexOf('.')
		return indexOfDot == -1 ? value : value.substring(0, value.indexOf('.'))
	}

	/**
	 *  If the required and optional scope keys have not already been loaded for this cube,
	 *  load them.
	 */
	protected void addRequiredAndOptionalScopeKeys(VisualizerInfo visInfo)
	{
		String cubeName = targetCube.name
		if (!visInfo.scopeInfo.requiredScopeKeysByCube.containsKey(cubeName))
		{
			visInfo.scopeInfo.requiredScopeKeysByCube[cubeName] = requiredScope
			visInfo.scopeInfo.allOptionalScopeKeysByCube[cubeName] = targetCube.getOptionalScope(availableTargetScope, new CaseInsensitiveMap())
		}
	}

	Map<String, Object> createEdge(int edgeCount)
	{
		String sourceFieldName = sourceFieldName
		Map<String, Object> edge = [:]
		edge.id = String.valueOf(edgeCount + 1)
		edge.from = String.valueOf(sourceId)
		edge.to = String.valueOf(targetId)
		edge.fromName = getLabel(sourceCube.name)
		edge.toName = getLabel(targetCube.name)
		edge.fromFieldName = sourceFieldName
		edge.level = String.valueOf(targetLevel)
		edge.title = sourceFieldName
		return edge
	}

	Map<String, Object> createNode(VisualizerInfo visInfo, String group = null)
	{
		NCube targetCube = targetCube
		String targetCubeName = targetCube.name
		String sourceCubeName = sourceCube ? sourceCube.name : null
		String sourceFieldName = sourceFieldName

		Map<String, Object> node = [:]
		node.id = String.valueOf(targetId)
		node.level = String.valueOf(targetLevel)
		node.cubeName = targetCubeName
		node.sourceCubeName = sourceCubeName
		node.scope = targetScope
		node.availableScope = availableTargetScope
		node.fromFieldName = sourceFieldName
		node.sourceDescription = sourceCubeName ? sourceDescription : null
		node.label = nodeLabelPrefix + getLabel(targetCubeName)
		node.detailsTitle1 = cubeDetailsTitle1
		node.detailsTitle2 = cubeDetailsTitle2
		node.title = getCubeDisplayName(targetCubeName)
		node.details = getDetails(visInfo)
		group = group ?: getGroupName(visInfo)
		node.group = group
		node.typesToAdd = visInfo.getTypesToAdd(group)
		node.showCellValuesLink = showCellValuesLink
		node.showCellValues = showCellValues
		node.cellValuesLoaded = cellValuesLoaded
		visInfo.availableGroupsAllLevels << group - visInfo.groupSuffix
		long maxLevel = visInfo.maxLevel
		visInfo.maxLevel = maxLevel < targetLevel ? targetLevel : maxLevel
		visInfo.nodeCount += 1
		return node
	}

	protected String getLabel(String cubeName)
	{
		cubeName
	}

	String getCubeDisplayName(String cubeName)
	{
		return cubeName
	}

	String getSourceDescription()
	{
		return sourceCube.name
	}

	String getCubeDetailsTitle1()
	{
		return targetCube.name
	}

	String getCubeDetailsTitle2()
	{
		return null
	}
}