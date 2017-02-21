package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.RuleInfo
import com.cedarsoftware.ncube.exception.CoordinateNotFoundException
import com.cedarsoftware.ncube.exception.InvalidCoordinateException
import com.google.common.base.Splitter
import static com.cedarsoftware.util.RpmVisualizerConstants.*
import groovy.transform.CompileStatic

/**
 * Provides information to visualize a source rpm class, a target rpm class
 * and their relationship.
 */

@CompileStatic
class RpmVisualizerRelInfo extends VisualizerRelInfo
{
	protected RpmVisualizerHelper helper = new RpmVisualizerHelper()
	protected String sourceFieldRpmType
	protected Map<String, Map<String, Object>> sourceTraits
	protected Map<String, Map<String, Object>> targetTraits

	protected RpmVisualizerRelInfo(){}

	protected RpmVisualizerRelInfo(ApplicationID appId)
	{
		super(appId)
	}

	protected RpmVisualizerRelInfo(ApplicationID appId, Map node)
	{
		super(appId, node)
	}

	@Override
	protected Set<String> getRequiredScope()
	{
		Set<String> requiredScope = super.requiredScope
		requiredScope.remove(AXIS_FIELD)
		requiredScope.remove(AXIS_NAME)
		requiredScope.remove(AXIS_TRAIT)
		return requiredScope
	}

	@Override
	protected String getDetails(VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		StringBuilder sb = new StringBuilder()

		if (!cellValuesLoaded)
		{
			sb.append("<b>Unable to load fields and traits for ${getLabel(targetCube.name)}</b>${DOUBLE_BREAK}")
		}

		//Notes
		if (notes)
		{
			notes.each { String note ->
				sb.append("${note}")
			}
		}

		//Scope
		if (cellValuesLoaded)
		{
			String title = showCellValues ? 'Utilized scope' : 'Utilized scope to load class without all traits'
			getDetailsMap(sb, title, targetScope)
		}
		getDetailsMap(sb, 'Available scope', availableTargetScope)

		//Fields
		if (cellValuesLoaded)
		{
			if (showCellValues)
			{
				addClassTraits(sb)
			}
			addFieldDetails(sb)
		}
		return sb.toString()
	}

	private void addFieldDetails(StringBuilder sb)
	{
		if (showCellValues)
		{
			sb.append("<b>Fields and traits</b>")
		}
		else
		{
			sb.append("<b>Fields</b>")
		}
		sb.append("<pre><ul>")
		targetTraits.each { String fieldName, v ->
			if (CLASS_TRAITS != fieldName)
			{
				if (showCellValues)
				{
					sb.append("<li><b>${fieldName}</b></li>")
					addTraits(sb, fieldName)
				}
				else
				{
					sb.append("<li>${fieldName}</li>")
				}
			}
		}
		sb.append("</ul></pre>")
	}

	private void addTraits(StringBuilder sb, String fieldName)
	{
		Map<String, Object> traits = targetTraits[fieldName].sort() as Map
		sb.append("<pre><ul>")
		traits.each { String traitName, Object traitValue ->
			if (traitValue != null)
			{
				String traitString = traitValue.toString()
				if (traitString.startsWith(HTTP) || traitString.startsWith(HTTPS) || traitString.startsWith(FILE))
				{
					sb.append("""<li>${traitName}: <a href="#" onclick='window.open("${traitString}");return false;'>${traitString}</a></li>""")
				}
				else
				{
					sb.append("<li>${traitName}: ${traitValue}</li>")
				}
			}
		}
		sb.append("</ul></pre>")
	}

	private void addClassTraits(StringBuilder sb)
	{
		sb.append("<b>Class traits</b>")
		addTraits(sb, CLASS_TRAITS)
		sb.append("${BREAK}")
	}

	@Override
	protected String getGroupName(VisualizerInfo visInfo, String cubeName = targetCube.name)
	{
		Iterable<String> splits = Splitter.on('.').split(cubeName)
		String group = splits[2].toUpperCase()
		return visInfo.allGroupsKeys.contains(group) ? group : UNSPECIFIED
	}

	private String getTargetScopedName()
	{
		Map<String, Object> classTraitsTraitMap = targetTraits ? targetTraits[CLASS_TRAITS] as Map : null
		return classTraitsTraitMap ? classTraitsTraitMap[R_SCOPED_NAME] : null
	}

	protected String getNextTargetCubeName(String targetFieldName)
	{
		if (sourceCube.getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String scopedName = sourceTraits[CLASS_TRAITS][R_SCOPED_NAME]
			return !scopedName ?: RPM_CLASS_DOT + sourceFieldRpmType
		}
		return RPM_CLASS_DOT + targetFieldName
	}

	private void retainUsedScope(VisualizerInfo visInfo, Map output)
	{
		Set<String> scopeCollector = new CaseInsensitiveSet<>()
		scopeCollector.addAll(visInfo.requiredScopeKeysByCube[targetCube.name])
		scopeCollector.addAll(visInfo.allOptionalScopeKeysByCube[targetCube.name])
		scopeCollector << EFFECTIVE_VERSION

		RuleInfo ruleInfo = NCube.getRuleInfo(output)
		Set keysUsed = ruleInfo.getInputKeysUsed()
		scopeCollector.addAll(keysUsed)

		targetScope = new CaseInsensitiveMap(availableTargetScope)
		cullScope(targetScope.keySet(), scopeCollector)
	}

	private void removeNotExistsFields()
	{
		targetTraits.keySet().removeAll { String fieldName -> !targetTraits[fieldName][R_EXISTS] }
	}

	private static void cullScope(Set<String> scopeKeys, Set scopeCollector)
	{
		scopeKeys.removeAll { String item -> !(scopeCollector.contains(item) || item.startsWith(SYSTEM_SCOPE_KEY_PREFIX)) }
	}

	@Override
	protected Map<String, Object> createEdge(int edgeCount)
	{
		Map<String, Object> edge = super.createEdge(edgeCount)
		Map<String, Map<String, Object>> sourceTraits = sourceTraits

		Map<String, Map<String, Object>> sourceFieldTraitMap = sourceTraits[sourceFieldName] as Map
		String vMin = sourceFieldTraitMap[V_MIN] as String ?: V_MIN_CARDINALITY
		String vMax = sourceFieldTraitMap[V_MAX] as String ?: V_MAX_CARDINALITY

		if (targetCube.name.startsWith(RPM_ENUM_DOT))
		{
			edge.label = nodeLabelPrefix + sourceFieldName
			edge.title = "Field ${sourceFieldName} cardinality ${vMin}:${vMax}".toString()
		}
		else
		{
			edge.title = "Valid value ${sourceFieldName} cardinality ${vMin}:${vMax}".toString()
		}

		return edge
	}

	@Override
	protected Map<String, Object> createNode(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, String group = null)
	{
		Map<String, Object> node = super.createNode(visInfo, scopeInfo, group)
		if (targetCube.name.startsWith(RPM_ENUM_DOT))
		{
			node.label = null
			node.detailsTitle2 = null
			node.title = node.detailsTitle1
			node.typesToAdd = null
		}
		return node
	}

	@Override
	protected boolean includeUnboundScopeKey(VisualizerInfo visInfo, String scopeKey)
	{
		//For the starting cube of the graph (top node) keep all unbound axis keys. For all other
		//classes (which all have a sourceCube), remove any keys that are "derived" scope keys,
		//i.e. keys that the visualizer adds to the scope as it processes through the graph
		//(keys like product, risk, coverage, sourceProduct, sourceRisk, sourceCoverage, etc.).
		if (sourceCube)
		{
			String strippedKey = scopeKey.replaceFirst('source', '')
			if (visInfo.allGroupsKeys.contains(strippedKey))
			{
				return false
			}
		}
		return true
	}

	@Override
	protected String getLabel(String cubeName)
	{
		String scopeKey = getDotSuffix(cubeName)
		return availableTargetScope[scopeKey] ?: getCubeDisplayName(cubeName)
	}

	@Override
	protected String getCubeDisplayName(String cubeName)
	{
		if (cubeName.startsWith(RPM_CLASS_DOT))
		{
			return cubeName - RPM_CLASS_DOT
		}
		else if (cubeName.startsWith(RPM_ENUM_DOT))
		{
			return cubeName - RPM_ENUM_DOT
		}
		else{
			return cubeName
		}
	}

	@Override
	protected String getSourceDescription()
	{
		String sourceCubeName = sourceCube.name
		if (sourceCubeName.startsWith(RPM_CLASS_DOT))
		{
			return getDotSuffix(getLabel(sourceCubeName))
		}
		else if (sourceCubeName.startsWith(RPM_ENUM_DOT))
		{
			if (targetScopedName)
			{
				String sourceDisplayName = getCubeDisplayName(sourceCubeName)
				String scopeKeyForSourceOfSource = getDotPrefix(sourceDisplayName)
				String nameOfSourceOfSource = sourceScope[scopeKeyForSourceOfSource]
				String fieldNameSourceOfSource = sourceScope[SOURCE_FIELD_NAME]
				return "field ${fieldNameSourceOfSource} on ${nameOfSourceOfSource}".toString()
			}
			else{
				return getCubeDisplayName(sourceCubeName)
			}
		}
		return null
	}

	@Override
	protected String getCubeDetailsTitle1()
	{
		String targetCubeName = targetCube.name
		if (targetCubeName.startsWith(RPM_CLASS_DOT))
		{
			return getCubeDisplayName(targetCubeName)
		}
		else if (targetCubeName.startsWith(RPM_ENUM_DOT))
		{
			String prefix = nodeLabelPrefix ? "${nodeLabelPrefix}valid" : 'Valid'
			return "${prefix} values for field ${sourceFieldName} on ${getLabel(sourceCube.name)}".toString()
		}
		return null
	}

	@Override
	protected String getCubeDetailsTitle2()
	{
		String cubeName = targetCube.name
		if (cubeName.startsWith(RPM_CLASS_DOT) && targetScopedName)
		{
			return getLabel(cubeName)
		}
		return null
	}

	@Override
	protected boolean loadCellValues(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo)
	{
		try
		{
			targetTraits = new CaseInsensitiveMap()
			Map output = new CaseInsensitiveMap()
			if (targetCube.name.startsWith(RPM_ENUM))
			{
				helper.loadRpmClassFields(appId, RPM_ENUM, targetCube.name - RPM_ENUM_DOT, availableTargetScope, targetTraits, showCellValues, output)
			} else
			{
				helper.loadRpmClassFields(appId, RPM_CLASS, targetCube.name - RPM_CLASS_DOT, availableTargetScope, targetTraits, showCellValues, output)
			}
			removeNotExistsFields()
			addRequiredAndOptionalScopeKeys(visInfo)
			retainUsedScope(visInfo, output)
			handleUnboundScope(visInfo, scopeInfo, targetCube.getRuleInfo(output))
			cellValuesLoaded = true
			showCellValuesLink = true
		}
		catch (Exception e)
		{
			cellValuesLoaded = false
			showCellValuesLink = false
			Throwable t = helper.getDeepestException(e)
			if (t instanceof InvalidCoordinateException)
			{
				handleInvalidCoordinateException(t as InvalidCoordinateException, scopeInfo, visInfo.nodeCount)
			}
			else if (t instanceof CoordinateNotFoundException)
			{
				handleCoordinateNotFoundException(t as CoordinateNotFoundException, scopeInfo, visInfo.nodeCount)
			}
			else
			{
				handleException(t, scopeInfo)
			}
		}
		return true
	}

	private void handleUnboundScope(VisualizerInfo visInfo, VisualizerScopeInfo scopeInfo, RuleInfo ruleInfo)
	{
		StringBuilder sb = helper.handleUnboundScope(visInfo, scopeInfo, this, ruleInfo)
		if (sb)
		{
			notes << sb.toString()
		}
	}

	private void handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		StringBuilder sb = new StringBuilder("The value ${e.value} is not valid for ${e.axisName}. A different value must be provided:${DOUBLE_BREAK}")
		sb.append(helper.handleCoordinateNotFoundException(e, scopeInfo, nodeCount))
		notes << sb.toString()
		nodeLabelPrefix = 'Required scope value not found for '
		targetTraits = new CaseInsensitiveMap()
	}

	private void handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerScopeInfo scopeInfo, long nodeCount)
	{
		StringBuilder sb = new StringBuilder("<b>Additional scope is required: </b> ${DOUBLE_BREAK}")
		sb.append(helper.handleInvalidCoordinateException(e, scopeInfo, nodeCount, this, MANDATORY_SCOPE_KEYS))
		notes << sb.toString()
		nodeLabelPrefix = 'Additional scope required for '
		targetTraits = new CaseInsensitiveMap()
	}

	private void handleException(Throwable e, VisualizerScopeInfo scopeInfo)
	{
		StringBuilder sb = new StringBuilder("<b>An exception was thrown while loading this ${scopeInfo.nodeLabel}. </b>  ${DOUBLE_BREAK}")
		sb.append(helper.handleException(e))
		notes << sb.toString()
		nodeLabelPrefix = "Unable to load "
		targetTraits = new CaseInsensitiveMap()
	}
}