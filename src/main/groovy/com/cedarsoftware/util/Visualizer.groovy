package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import com.google.common.base.Joiner
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.*

/**
 * Provides information to visualize n-cubes.
 */

@CompileStatic
class Visualizer
{
	protected ApplicationID appId
	protected Set<String> visited = []
	protected Deque<VisualizerRelInfo> stack = new ArrayDeque<>()
	protected Joiner.MapJoiner mapJoiner = Joiner.on(", ").withKeyValueSeparator(": ")
	protected VisualizerHelper helper

	/**
	 * Processes an n-cube and all its referenced n-cubes and provides information to
	 * visualize the cubes and their relationships.
	 *
	 * @param applicationID
	 * @param options - a map containing:
	 *           String startCubeName, name of the starting cube
	 *           Map scope, the context for which the visualizer is loaded
	 *           VisualizerInfo visInfo, information about the visualization
	 *           Map scope, the scope used in the visualization
	 * @return a map containing:
	 *           String status, status of the visualization
	 *           VisualizerInfo visInfo, information about the visualization
	 *           VisualizerScopeInfo scopeInfo, information about the scope used in the visualization
	 */
	Map<String, Object> buildGraph(ApplicationID applicationID, Map options)
	{
		appId = applicationID
		String startCubeName = options.startCubeName as String
		VisualizerInfo visInfo = getVisualizerInfo(options)
		VisualizerScopeInfo scopeInfo = getVisualizerScopeInfo(options)

		if (!isValidStartCube(visInfo, startCubeName))
		{
			return [status: STATUS_INVALID_START_CUBE, visInfo: visInfo, scopeInfo: scopeInfo]
		}

		scopeInfo.populateScopeDefaults(startCubeName)
		getVisualization(visInfo, scopeInfo, startCubeName)
		scopeInfo.createGraphScopePrompt()
		visInfo.convertToSingleMessage()
		return [status: STATUS_SUCCESS, visInfo: visInfo, scopeInfo: scopeInfo]
	}

	/**
	 * Loads all cell values for a cube given the scope provided.
	 *
	 * @param applicationID
	 * @param options - a map containing:
	 *            Map node, representing a cube and its scope
	 *            VisualizerInfo visInfo, information about the visualization
	 *            Map scope, the scope used in the visualization
	 * @return a map containing:
	 *           String status, status of the visualization
	 *           VisualizerInfo visInfo, information about the visualization
	 *           VisualizerScopeInfo scopeInfo, information about the scope used in the visualization
	 */
	Map getCellValues(ApplicationID applicationID, Map options)
	{
		appId = applicationID
		VisualizerInfo visInfo = options.visInfo as VisualizerInfo
		visInfo.appId = applicationID
		VisualizerScopeInfo scopeInfo = options.scopeInfo as VisualizerScopeInfo
		VisualizerRelInfo relInfo = new VisualizerRelInfo(appId, options.node as Map, scopeInfo)
		scopeInfo.init(applicationID, options, false)
		return getCellValues(visInfo, scopeInfo, relInfo, options)
	}

	protected static Map getCellValues(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, Map options)
	{
		visInfo.messages = new LinkedHashSet()
		relInfo.loadCellValues(visInfo, scopeInfo)

		Map node = options.node as Map
		node.details = relInfo.getDetails(scopeInfo)
		node.showCellValuesLink = relInfo.showCellValuesLink
		node.cellValuesLoaded = relInfo.cellValuesLoaded
		boolean showCellValues = relInfo.showCellValues
		node.showCellValues = showCellValues
		node.scope = relInfo.targetScope
		node.availableTargetScope = relInfo.availableTargetScope
		visInfo.nodes = [node]
		scopeInfo.topNodeName = relInfo.getLabel(options.startCubeName as String)
		scopeInfo.createGraphScopePrompt()
		visInfo.convertToSingleMessage()
		return [status: STATUS_SUCCESS, visInfo: visInfo, scopeInfo: scopeInfo]
	}

	protected VisualizerInfo getVisualizerInfo(Map options)
	{
		VisualizerInfo visInfo = options.visInfo as VisualizerInfo
		if (!visInfo || visInfo.class.name != this.class.name)
		{
			visInfo = new VisualizerInfo(appId)
		}
		visInfo.init()
		return visInfo
	}

	protected VisualizerScopeInfo getVisualizerScopeInfo(Map options)
	{
		VisualizerScopeInfo scopeInfo =  new VisualizerScopeInfo()
		scopeInfo.init(appId, options)
		return scopeInfo
	}

	private void getVisualization(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, String startCubeName)
	{
		VisualizerRelInfo relInfo = visualizerRelInfo
		loadFirstVisualizerRelInfo(visInfo, scopeInfo, relInfo, startCubeName)
		stack.push(relInfo)

		while (!stack.empty)
		{
			processCube(visInfo, scopeInfo, stack.pop())
		}
	}

	protected void loadFirstVisualizerRelInfo(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo, String startCubeName)
	{
		relInfo.targetCube = NCubeManager.getCube(appId, startCubeName)
		relInfo.availableTargetScope = new CaseInsensitiveMap(scopeInfo.scope)
		relInfo.targetLevel = 1
		relInfo.targetId = 1
		relInfo.addRequiredAndOptionalScopeKeys(visInfo)
		relInfo.targetScope = new CaseInsensitiveMap()
		relInfo.showCellValuesLink = true
	}

	protected void processCube(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, VisualizerRelInfo relInfo)
	{
		NCube targetCube = relInfo.targetCube
		String targetCubeName = targetCube.name

		if (relInfo.sourceCube)
		{
			visInfo.edges << relInfo.createEdge(visInfo.edges.size())
		}

		if (!visited.add(targetCubeName + relInfo.availableTargetScope.toString()))
		{
			return
		}

		visInfo.nodes << relInfo.createNode(visInfo, scopeInfo)

		Map<Map, Set<String>> refs = targetCube.referencedCubeNames

		refs.each {Map coordinates, Set<String> cubeNames ->
			cubeNames.each { String cubeName ->
				addToStack(visInfo, relInfo, new VisualizerRelInfo(), cubeName, coordinates)
			}
		}
	}

	protected void addToStack(VisualizerInfo visInfo, VisualizerRelInfo relInfo, VisualizerRelInfo nextRelInfo, String nextTargetCubeName, Map coordinates = [:])
	{
		NCube nextTargetCube = NCubeManager.getCube(appId, nextTargetCubeName)
		if (nextTargetCube)
		{
				nextRelInfo.appId = appId
				long nextTargetLevel = relInfo.targetLevel + 1
				nextRelInfo.targetLevel = nextTargetLevel
				visInfo.relInfoCount += 1
				nextRelInfo.targetId = visInfo.relInfoCount
				nextRelInfo.targetCube = nextTargetCube
				nextRelInfo.sourceCube = relInfo.targetCube
				nextRelInfo.sourceScope = new CaseInsensitiveMap(relInfo.targetScope)
				nextRelInfo.sourceId = relInfo.targetId
				nextRelInfo.sourceFieldName = mapJoiner.join(coordinates)
				nextRelInfo.targetScope = new CaseInsensitiveMap(coordinates)
				nextRelInfo.availableTargetScope = new CaseInsensitiveMap(relInfo.availableTargetScope)
				nextRelInfo.availableTargetScope.putAll(coordinates)
				nextRelInfo.addRequiredAndOptionalScopeKeys(visInfo)
				nextRelInfo.showCellValuesLink = true
				stack.push(nextRelInfo)
		}
		else
		{
			visInfo.messages << "No cube exists with name of ${nextTargetCubeName}. Cube not included in the visualization.".toString()
		}
	}

	protected VisualizerRelInfo getVisualizerRelInfo()
	{
		return new VisualizerRelInfo(appId)
	}

	protected VisualizerHelper getVisualizerHelper()
	{
		helper =  new VisualizerHelper()
	}

	protected boolean isValidStartCube(VisualizerInfo visInfo, String cubeName)
	{
		NCube cube = NCubeManager.getCube(appId, cubeName)
		if (!cube)
		{
			visInfo.messages << "No cube exists with name of ${cubeName} for application id ${appId.toString()}".toString()
			return false
		}
		return true
	}
}