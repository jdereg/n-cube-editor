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
	RpmVisualizerHelper helper = new RpmVisualizerHelper()
	String sourceFieldRpmType
	Map<String, Map<String, Object>> sourceTraits
	Map<String, Map<String, Object>> targetTraits

	RpmVisualizerRelInfo() {}

	RpmVisualizerRelInfo(ApplicationID appId, Map node)
	{
		super(appId, node)
	}

	@Override
	Set<String> getRequiredScope()
	{
		Set<String> requiredScope = super.requiredScope
		requiredScope.remove(AXIS_FIELD)
		requiredScope.remove(AXIS_NAME)
		requiredScope.remove(AXIS_TRAIT)
		return requiredScope
	}

	@Override
	String getDetails(VisualizerInfo visInfo)
	{
		StringBuilder sb = new StringBuilder()
		String notesLabel = "<b>Note: </b>"

		if (!cellValuesLoaded)
		{
			sb.append("<b>*** Unable to load fields and traits for ${getLabel(targetCube.name)}</b>${DOUBLE_BREAK}")
			notesLabel = "<b>Reason: </b>"
		}

		//Notes
		if (notes)
		{
			sb.append(notesLabel)
			notes.each { String note ->
				sb.append("${note} ")
			}
			sb.append("${DOUBLE_BREAK}")
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
	String getGroupName(VisualizerInfo visInfo, String cubeName = targetCube.name)
	{
		Iterable<String> splits = Splitter.on('.').split(cubeName)
		String group = splits[2].toUpperCase()
		return visInfo.allGroupsKeys.contains(group) ? group : UNSPECIFIED
	}

	String getSourceScopedName()
	{
		Map<String, Object> classTraitsTraitMap = sourceTraits[CLASS_TRAITS] as Map
		return classTraitsTraitMap ? classTraitsTraitMap[R_SCOPED_NAME] : null
	}

	String getTargetScopedName()
	{
		Map<String, Object> classTraitsTraitMap = targetTraits[CLASS_TRAITS] as Map
		return classTraitsTraitMap ? classTraitsTraitMap[R_SCOPED_NAME] : null
	}

	String getNextTargetCubeName(String targetFieldName)
	{
		if (sourceCube.getAxis(AXIS_TRAIT).findColumn(R_SCOPED_NAME))
		{
			String scopedName = sourceTraits[CLASS_TRAITS][R_SCOPED_NAME]
			return !scopedName ?: RPM_CLASS_DOT + sourceFieldRpmType
		}
		return RPM_CLASS_DOT + targetFieldName
	}

	String getSourceMessage()
	{
		if (sourceTraits)
		{
			return sourceScopedName ? ", the target of ${sourceScopedName} on ${getCubeDisplayName(sourceCube.name)}" : ", the target of ${getCubeDisplayName(sourceCube.name)}"
		}
		return ''
	}

	void retainUsedScope(VisualizerInfo visInfo, Map output)
	{
		Set<String> scopeCollector = new CaseInsensitiveSet<>()
		scopeCollector.addAll(visInfo.scopeInfo.requiredScopeKeysByCube[targetCube.name])
		scopeCollector.addAll(visInfo.scopeInfo.allOptionalScopeKeysByCube[targetCube.name])
		scopeCollector << EFFECTIVE_VERSION_SCOPE_KEY

		RuleInfo ruleInfo = NCube.getRuleInfo(output)
		Set keysUsed = ruleInfo.getInputKeysUsed()
		scopeCollector.addAll(keysUsed)

		targetScope = new CaseInsensitiveMap(availableTargetScope)
		cullScope(targetScope.keySet(), scopeCollector)
	}

	void removeNotExistsFields()
	{
		targetTraits.keySet().removeAll { String fieldName -> !targetTraits[fieldName][R_EXISTS] }
	}

	static void cullScope(Set<String> scopeKeys, Set scopeCollector)
	{
		scopeKeys.removeAll { String item -> !(scopeCollector.contains(item) || item.startsWith(SYSTEM_SCOPE_KEY_PREFIX)) }
	}

	@Override
	Map<String, Object> createEdge(int edgeCount)
	{
		Map<String, Object> edge = super.createEdge(edgeCount)
		Map<String, Map<String, Object>> sourceTraits = sourceTraits

		Map<String, Map<String, Object>> sourceFieldTraitMap = sourceTraits[sourceFieldName] as Map
		String vMin = sourceFieldTraitMap[V_MIN] as String ?: V_MIN_CARDINALITY
		String vMax = sourceFieldTraitMap[V_MAX] as String ?: V_MAX_CARDINALITY

		if (targetCube.name.startsWith(RPM_ENUM_DOT))
		{
			edge.label = sourceFieldName
			edge.title = "Field ${sourceFieldName} cardinality ${vMin}:${vMax}".toString()
		}
		else
		{
			edge.title = "Valid value ${sourceFieldName} cardinality ${vMin}:${vMax}".toString()
		}

		return edge
	}

	@Override
	Map<String, Object> createNode(VisualizerInfo visInfo, String group = null)
	{
		Map<String, Object> node = super.createNode(visInfo, group)
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
	protected String getLabel(String cubeName)
	{
		String scopeKey = getDotSuffix(cubeName)
		return availableTargetScope[scopeKey] ?: getCubeDisplayName(cubeName)
	}

	@Override
	String getCubeDisplayName(String cubeName)
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
	String getSourceDescription()
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
	String getCubeDetailsTitle1()
	{
		String targetCubeName = targetCube.name
		if (targetCubeName.startsWith(RPM_CLASS_DOT))
		{
			return getCubeDisplayName(targetCubeName)
		}
		else if (targetCubeName.startsWith(RPM_ENUM_DOT))
		{
			return "Valid values for field ${sourceFieldName} on ${getLabel(sourceCube.name)}".toString()
		}
		return null
	}

	@Override
	String getCubeDetailsTitle2()
	{
		String cubeName = targetCube.name
		if (cubeName.startsWith(RPM_CLASS_DOT) && targetScopedName)
		{
			return getLabel(cubeName)
		}
		return null
	}

	@Override
	boolean loadCellValues(VisualizerInfo visInfo)
	{
		try
		{
			targetTraits = [:]
			Map output = [:]
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
			handleUnboundAxes(visInfo, targetCube.getRuleInfo(output))
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
				handleInvalidCoordinateException(t as InvalidCoordinateException, visInfo)
			}
			else if (t instanceof CoordinateNotFoundException)
			{
				handleCoordinateNotFoundException(t as CoordinateNotFoundException, visInfo)
			}
			else
			{
				handleException(t, visInfo)
			}
		}
		return true
	}

	private void handleUnboundAxes(VisualizerInfo visInfo, RuleInfo ruleInfo)
	{
		if (addUnboundAxisToScopeInfo(visInfo, ruleInfo))
		{
			String cubeName = targetCube.name
			String nodeLabel = getLabel(cubeName)
			StringBuilder sb = new StringBuilder('Since not all optional scope was provided or found, one or more defaults were used to load ')
			if (cubeName.startsWith(RPM_CLASS_DOT))
			{
				String cubeDisplayName = getCubeDisplayName(cubeName)
				sb.append("${nodeLabel} of type ${cubeDisplayName}${sourceMessage}.")
			}
			else if (cubeName.startsWith(RPM_ENUM_DOT))
			{
				String cubeTitle = cubeDetailsTitle1.replace('Valid', 'valid')
				sb.append("${cubeTitle}.")
			}
			else
			{
				sb.append("${cubeName} for ${nodeLabel}${sourceMessage}.")
			}
			sb.append("${BREAK}")
			sb.append(helper.handleUnboundAxes(scopeInfo))
			notes << sb.toString()
		}
	}

	private boolean addUnboundAxisToScopeInfo(VisualizerInfo visInfo, RuleInfo ruleInfo)
	{
		boolean hasUnboundAxisToInclude
		List unboundAxesList = ruleInfo.getUnboundAxesList()
		if (unboundAxesList)
		{
			//Gather entries in unboundAxesList into maps held in scopeInfo for
			//graph as a whole and for this class.
			unboundAxesList.each { MapEntry unboundAxis ->
				String cubeName = unboundAxis.key as String
				MapEntry axisEntry = unboundAxis.value as MapEntry
				String axisName = axisEntry.key as String
				Object unBoundValue = axisEntry.value
				if (includeScopeKey(visInfo, axisName))
				{
					visInfo.scopeInfo.addOptionalScope(appId, cubeName, axisName, unBoundValue)
					scopeInfo.addOptionalScope(appId, cubeName, axisName, unBoundValue)
					hasUnboundAxisToInclude = true
				}
			}
		}
		return hasUnboundAxisToInclude
	}

	private boolean includeScopeKey(VisualizerInfo visInfo, String scopeKey)
	{
		//For the starting class of the graph (top node) keep all unbound axis keys. For all other
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

	private void handleCoordinateNotFoundException(CoordinateNotFoundException e, VisualizerInfo visInfo)
	{
		StringBuilder mb = new StringBuilder()
		String scopeKey = e.axisName
		Object value = e.value ?: 'null'
		String targetMsg = ''
		mb.append("The scope value ${value} for scope key ${scopeKey} cannot be found on axis ${scopeKey} in ${getCubeDisplayName(e.cubeName)} for ${getLabel(targetCube.name)}${sourceMessage}.")
		mb.append(BREAK + helper.handleCoordinateNotFoundException(e, visInfo, targetMsg))
		String msg = mb.toString()
		notes << msg
		visInfo.messages << msg
		nodeLabelPrefix = 'Scope value not found for '
		targetTraits = new CaseInsensitiveMap()
	}

	private void handleInvalidCoordinateException(InvalidCoordinateException e, VisualizerInfo visInfo)
	{
		String cubeName = e.cubeName
		String nodeLabel = getLabel(targetCube.name)
		StringBuilder sb = new StringBuilder('Additional scope is required to load ')
		if (cubeName.startsWith(RPM_CLASS_DOT))
		{
			sb.append("${nodeLabel}${sourceMessage}. ")
		}
		else if (cubeName.startsWith(RPM_ENUM_DOT))
		{
			sb.append("${cubeDetailsTitle1}. ")
		}
		else
		{
			sb.append("${cubeName} for ${nodeLabel}${sourceMessage}. ")
		}
		sb.append(BREAK + helper.handleInvalidCoordinateException(e, visInfo, this, MANDATORY_SCOPE_KEYS))
		String msg = sb.toString()
		notes << msg
		visInfo.messages << msg
		nodeLabelPrefix = 'Additional scope required for '
		targetTraits = new CaseInsensitiveMap()
	}

	private void handleException(Throwable e, VisualizerInfo visInfo)
	{
		String targetMsg = "${getLabel(targetCube.name)}${sourceMessage}"
		String reason = helper.handleException(e, targetMsg)
		notes << reason
		visInfo.messages << reason
		nodeLabelPrefix = "Unable to load "
		targetTraits = new CaseInsensitiveMap()
	}
}