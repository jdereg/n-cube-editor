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
	protected ApplicationID appId

	protected Set<String> notes = []
	protected Map<String, Object> availableTargetScope

	protected long targetId
	protected NCube targetCube
	protected Map<String, Object> targetScope
	protected long targetLevel
	protected String nodeLabelPrefix = ''

	protected long sourceId
	protected NCube sourceCube
	protected Map<String, Object> sourceScope
	protected String sourceFieldName

	protected boolean cellValuesLoaded
	protected boolean showCellValuesLink
	protected boolean showCellValues

	protected List<VisualizerCellInfo> cellInfo

	protected List<String> typesToAdd

	protected VisualizerHelper helper = new VisualizerHelper()

	VisualizerRelInfo() {}

	protected VisualizerRelInfo(ApplicationID applicationId)
	{
		appId = applicationId
	}

	protected VisualizerRelInfo(ApplicationID applicationId, Map node)
	{
		appId  = applicationId
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

	protected boolean loadCellValues(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo)
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

	protected Set<String> getRequiredScope()
	{
		return targetCube.getRequiredScope(availableTargetScope, new CaseInsensitiveMap())
	}

	protected String getDetails(VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		StringBuilder sb = new StringBuilder()

		getDetailsMap(sb, 'Scope', targetScope)
		getDetailsMap(sb, 'Available scope', availableTargetScope)
		getDetailsSet(sb, 'Axes', targetCube.axisNames)

		//Cell values
		if (cellValuesLoaded && showCellValues)
		{
			addCellValueSection(scopeInfo, nodeCount, sb)
		}
		return sb.toString()
	}

	private void addCellValueSection(VisualizerScopeInfo scopeInfo, long nodeCount, StringBuilder sb)
	{
		StringBuilder cellValuesBuilder = new StringBuilder()
		StringBuilder linkBuilder = new StringBuilder()
		sb.append("<b>Cell values</b>")
		getCellValues(scopeInfo, nodeCount, cellValuesBuilder, linkBuilder )
		sb.append(linkBuilder.toString())
		sb.append("""<pre><ul class="${DETAILS_CLASS_CELL_VALUES}">""")
		sb.append(cellValuesBuilder.toString())
		sb.append("</ul></pre>")
	}

	private void getCellValues(VisualizerScopeInfo scopeInfo, long nodeCount, StringBuilder cellValuesBuilder, StringBuilder linkBuilder)
	{
		Long id = 0l

		if (cellInfo)
		{
			cellInfo.each { VisualizerCellInfo visCellInfo ->
				visCellInfo.getCellValue(scopeInfo, nodeCount, this, id++, cellValuesBuilder)
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

	protected static void getDetailsMap(StringBuilder sb, String title, Map<String, Object> map)
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

	private static void getDetailsSet(StringBuilder sb, String title, Set<String> set)
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

	protected String getGroupName(VisualizerInfo visInfo = null, String cubeName = targetCube.name)
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
		if (!visInfo.requiredScopeKeysByCube.containsKey(cubeName))
		{
			visInfo.requiredScopeKeysByCube[cubeName] = requiredScope
			visInfo.allOptionalScopeKeysByCube[cubeName] = targetCube.getOptionalScope(availableTargetScope, new CaseInsensitiveMap())
		}
	}

	protected Map<String, Object> createEdge(int edgeCount)
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

	protected Map<String, Object> createNode(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, String group = null)
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
		node.details = getDetails(scopeInfo, visInfo.nodeCount )
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

	protected boolean includeUnboundScopeKey(VisualizerInfo visInfo, String scopeKey)
	{
		return true
	}

	protected String getLabel(String cubeName)
	{
		cubeName
	}

	protected String getCubeDisplayName(String cubeName)
	{
		return cubeName
	}

	protected String getSourceDescription()
	{
		return sourceCube.name
	}

	protected String getCubeDetailsTitle1()
	{
		return targetCube.name
	}

	protected String getCubeDetailsTitle2()
	{
		return null
	}
}