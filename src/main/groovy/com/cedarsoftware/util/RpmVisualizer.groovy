package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.RpmVisualizerConstants.*

/**
 * Processes an rpm class and all its referenced rpm classes and provides information to
 * visualize the classes and their relationships.
 */

// TODO: This code needs to be moved out of NCE and pulled-in via Grapes.
@CompileStatic
class RpmVisualizer extends Visualizer
{
	protected RpmVisualizerHelper helper
	protected String defaultScopeEffectiveVersion
	protected String defaultScopeDate

	/**
	 * Loads all cell values available for a given rpm class.
	 *
	 * @param applicationID
	 * @param options - a map containing:
	 *            Map node, representing a class and its scope
	 *            VisualizerInfo visInfo, information about the visualization
	 * @return a map containing:
	 *           String status, status of the visualization
	 *           VisualizerInfo visInfo, information about the visualization
	 */

	@Override
	Map getCellValues(ApplicationID applicationID, Map options)
	{
		appId = applicationID
		RpmVisualizerRelInfo relInfo = new RpmVisualizerRelInfo(appId, options.node as Map)
		return getCellValues(relInfo, options)
	}

	@Override
	protected VisualizerInfo getVisualizerInfo(Map options)
	{
		RpmVisualizerInfo visInfo
		Object optionsVisInfo = options.visInfo
		if (optionsVisInfo && optionsVisInfo instanceof RpmVisualizerInfo)
		{
			visInfo = optionsVisInfo as RpmVisualizerInfo
		}
		else
		{
			visInfo = new RpmVisualizerInfo(appId, options)
		}
		visInfo.init(options.scope as Map)
		return visInfo
	}

	@Override
	protected void loadFirstVisualizerRelInfo(VisualizerInfo visInfo, VisualizerRelInfo relInfo, String startCubeName)
	{
		super.loadFirstVisualizerRelInfo(visInfo, relInfo, startCubeName)
		relInfo.showCellValuesLink = false
	}

	@Override
	protected void processCube(VisualizerInfo visInfo, VisualizerRelInfo relInfo)
	{
		if (relInfo.targetCube.name.startsWith(RPM_CLASS))
		{
			processClassCube((RpmVisualizerInfo) visInfo, (RpmVisualizerRelInfo) relInfo)
		}
		else
		{
			processEnumCube((RpmVisualizerInfo) visInfo, (RpmVisualizerRelInfo) relInfo)
		}
	}

	private void processClassCube(RpmVisualizerInfo visInfo, RpmVisualizerRelInfo relInfo)
	{
		boolean cellValuesLoaded
		String targetCubeName = relInfo.targetCube.name

		if (canLoadTraitsForTarget(relInfo))
		{
			cellValuesLoaded = relInfo.loadCellValues(visInfo)
		}

		if (relInfo.sourceCube)
		{
			visInfo.edges << relInfo.createEdge(visInfo.edges.size())
		}

		if (!visited.add(targetCubeName + relInfo.availableTargetScope.toString()))
		{
			return
		}

		visInfo.nodes << relInfo.createNode(visInfo)

		if (cellValuesLoaded)
		{
			relInfo.targetTraits.each { String targetFieldName, Map targetTraits ->
				if (CLASS_TRAITS != targetFieldName)
				{
					String targetFieldRpmType = targetTraits[R_RPM_TYPE]
					if (!visualizerHelper.isPrimitive(targetFieldRpmType))
					{
						String nextTargetCubeName = ""
						if (targetTraits.containsKey(V_ENUM))
						{
							nextTargetCubeName = RPM_ENUM_DOT + targetTraits[V_ENUM]
						}
						else if (targetFieldRpmType)
						{
							nextTargetCubeName = RPM_CLASS_DOT + targetFieldRpmType
						}
						addToStack(visInfo, relInfo, nextTargetCubeName, targetFieldRpmType, targetFieldName)
					}
				}
			}
		}
	}

	private void processEnumCube(RpmVisualizerInfo visInfo, RpmVisualizerRelInfo relInfo)
	{
		String group = UNSPECIFIED_ENUM
		String targetCubeName = relInfo.targetCube.name

		boolean cellValuesLoaded = relInfo.loadCellValues(visInfo)
		if (cellValuesLoaded)
		{
			relInfo.targetTraits.each { String targetFieldName, Map targetTraits ->
				if (CLASS_TRAITS != targetFieldName)
				{
					String nextTargetCubeName = relInfo.getNextTargetCubeName(targetFieldName)
					if (nextTargetCubeName)
					{
						RpmVisualizerRelInfo nextRelInfo = addToStack(visInfo, relInfo, nextTargetCubeName, relInfo.sourceFieldRpmType, targetFieldName)
						if (nextRelInfo && group == UNSPECIFIED_ENUM)
						{
							group = relInfo.getGroupName(visInfo, nextTargetCubeName) + visInfo.groupSuffix
						}
					}
				}
			}
		}

		visInfo.edges << relInfo.createEdge(visInfo.edges.size())

		if (!visited.add(targetCubeName + relInfo.availableTargetScope.toString()))
		{
			return
		}

		visInfo.nodes << relInfo.createNode(visInfo, group)
	}

	private RpmVisualizerRelInfo addToStack(RpmVisualizerInfo visInfo, RpmVisualizerRelInfo relInfo, String nextTargetCubeName, String rpmType, String targetFieldName)
	{
		RpmVisualizerRelInfo nextRelInfo = new RpmVisualizerRelInfo(appId)
		super.addToStack(visInfo, relInfo, nextRelInfo, nextTargetCubeName)
		NCube nextTargetCube = nextRelInfo.targetCube
		if (nextTargetCube)
		{
			nextRelInfo.availableTargetScope = getScopeRelativeToSource(nextTargetCube, rpmType, targetFieldName, relInfo.availableTargetScope)
			nextRelInfo.sourceFieldName = targetFieldName
			nextRelInfo.sourceFieldRpmType = rpmType
			nextRelInfo.sourceTraits = relInfo.targetTraits
			nextRelInfo.showCellValuesLink = false
		}
		return nextRelInfo
	}

	@Override
	protected VisualizerRelInfo getVisualizerRelInfo()
	{
		return new RpmVisualizerRelInfo(appId)
	}

	private boolean canLoadTraitsForTarget(RpmVisualizerRelInfo relInfo)
	{
		//When the source cube points directly to the target cube (source cube and target cube are both rpm.class),
		//check if the source field name matches up with the scoped name of the target. If not, traits cannot
		//be loaded for the target in the visualization.
		NCube sourceCube = relInfo.sourceCube
		NCube targetCube = relInfo.targetCube

		if (sourceCube && sourceCube.name.startsWith(RPM_CLASS_DOT) && targetCube.name.startsWith(RPM_CLASS_DOT) &&
				targetCube.getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String type = relInfo.sourceFieldRpmType
			NCube classTraitsCube = NCubeManager.getCube(appId, RPM_SCOPE_CLASS_DOT + type + DOT_CLASS_TRAITS)
			String sourceFieldName = relInfo.sourceFieldName
			if (!classTraitsCube.getAxis(type).findColumn(sourceFieldName))
			{
				relInfo.nodeLabelPrefix = 'Unable to load '
				relInfo.targetTraits = new CaseInsensitiveMap()
				String msg = getLoadTraitsForTargetMessage(relInfo, type)
				relInfo.notes << msg
				relInfo.cellValuesLoaded = false
				relInfo.showCellValuesLink = false
				return false
			}
		}
		return true
	}

	/**
	 * Sets the basic scope required to load a target class based on scoped source class,
	 * source field name, target class name, and current scope.
	 * Retains all other scope.
	 * If the source class is not a scoped class, returns the scope unchanged.
	 *
	 * @param targetCube String target cube
	 * @param sourceFieldRpmType String source field type
	 * @param sourceFieldName String source field name
	 * @param scope Map<String, Object> scope
	 *
	 * @return Map new scope
	 *
	 */
	private static Map<String, Object> getScopeRelativeToSource(NCube targetCube, String sourceFieldRpmType, String targetFieldName, Map scope)
	{
		Map<String, Object> newScope = new CaseInsensitiveMap<>(scope)

		if (targetCube.name.startsWith(RPM_ENUM))
		{
			newScope[SOURCE_FIELD_NAME] = targetFieldName
		}
		else if (targetCube.getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String newScopeKey = sourceFieldRpmType
			String oldValue = scope[newScopeKey]
			if (oldValue)
			{
				newScope[SOURCE_SCOPE_KEY_PREFIX + sourceFieldRpmType] = oldValue
			}
			newScope[newScopeKey] = targetFieldName
		}
		return newScope
	}

	private Map<String, Object> getDefaultScope(String type)
	{
		Map<String, Object> scope = new CaseInsensitiveMap<>()
		if (type)
		{
			scope[POLICY_CONTROL_DATE] = defaultScopeDate
			scope[QUOTE_DATE] = defaultScopeDate
		}
		scope[EFFECTIVE_VERSION] = defaultScopeEffectiveVersion
		return scope
	}

	@Override
	protected boolean isValidStartCube(VisualizerInfo visInfo, String cubeName)
	{
		if (!cubeName.startsWith(RPM_CLASS_DOT))
		{
			visInfo.messages << "Starting cube for visualization must begin with 'rpm.class', n-cube ${cubeName} does not.".toString()
			return false
		}

		NCube cube = NCubeManager.getCube(appId, cubeName)
		if (!cube.getAxis(AXIS_FIELD) || !cube.getAxis(AXIS_TRAIT) )
		{
			visInfo.messages << "Cube ${cubeName} is not a valid rpm class since it does not have both a field axis and a traits axis.".toString()
			return false
		}
		return true
	}

	@Override
	protected RpmVisualizerHelper getVisualizerHelper()
	{
		helper =  new RpmVisualizerHelper()
	}

	@Override
	protected boolean hasMissingMinimumScope(VisualizerInfo visInfo, String startCubeName)
	{
		RpmVisualizerHelper helper = visualizerHelper
		RpmVisualizerInfo rpmVisInfo = (RpmVisualizerInfo) visInfo
		defaultScopeEffectiveVersion = appId.version
		defaultScopeDate = DATE_TIME_FORMAT.format(new Date())
		Set<String> messages = visInfo.messages

		boolean hasMissingScope = false
		Map<String, Object> scope = rpmVisInfo.scopeInfo.scope

		if (NCubeManager.getCube(appId, startCubeName).getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String type = getTypeFromCubeName(startCubeName)
			String providedTypeValue = scope ? scope.type : null
			String scopeCubeName = startCubeName.replace(RPM_CLASS_DOT, RPM_SCOPE_CLASS_DOT) + DOT_TRAITS
			Set<Object> requiredScopeValues =  visInfo.scopeInfo.addRequiredScope(type, scopeCubeName,  providedTypeValue)
			String messageScopeValues = BREAK + helper.getRequiredScopeValueMessage(type, requiredScopeValues)
			if (scope)
			{
				hasMissingScope = rpmVisInfo.addMissingMinimumScope(type, null, messageScopeValues, messages) ?: hasMissingScope
				hasMissingScope = rpmVisInfo.addMissingMinimumScope(POLICY_CONTROL_DATE, defaultScopeDate, null, messages) ?: hasMissingScope
				hasMissingScope = rpmVisInfo.addMissingMinimumScope(QUOTE_DATE, defaultScopeDate, null, messages) ?: hasMissingScope
				hasMissingScope = rpmVisInfo.addMissingMinimumScope(EFFECTIVE_VERSION, defaultScopeEffectiveVersion, null, messages) ?: hasMissingScope
			}
			else
			{
				hasMissingScope = true
				Map<String, Object> defaultScope = getDefaultScope(type)
				rpmVisInfo.scopeInfo.scope = defaultScope
				String msg = helper.getMissingMinimumScopeMessage(defaultScope, messageScopeValues)
				messages << msg
			}
		}
		else{
			if (scope)
			{
				hasMissingScope = visInfo.addMissingMinimumScope(EFFECTIVE_VERSION, defaultScopeEffectiveVersion, null, messages) ?: hasMissingScope
			}
			else
			{
				hasMissingScope = false
				visInfo.scopeInfo.scope = getDefaultScope(null)
			}
		}
		return hasMissingScope
	}

	private static String getTypeFromCubeName(String cubeName)
	{
		return (cubeName - RPM_CLASS_DOT)
	}

	private static String getLoadTraitsForTargetMessage(RpmVisualizerRelInfo relInfo, String type) {

		String sourceCubeDisplayName = relInfo.getCubeDisplayName(relInfo.sourceCube.name)
		String targetCubeDisplayName = relInfo.getCubeDisplayName(relInfo.targetCube.name)

		"""\
${sourceCubeDisplayName} points directly to ${targetCubeDisplayName} via field ${relInfo.sourceFieldName}, but \
there is no ${type.toLowerCase()} named ${relInfo.sourceFieldName} on ${type}.  ${DOUBLE_BREAK}Therefore \
it cannot be loaded in the visualization."""
	}
}