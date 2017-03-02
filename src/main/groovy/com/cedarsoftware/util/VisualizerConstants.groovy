package com.cedarsoftware.util

import groovy.transform.CompileStatic

/**
 * Provides constants for the visualizer
 */

@CompileStatic
class VisualizerConstants
{
	static final String SPACE = '&nbsp;'
	static final String BREAK = '<br>'
	static final String COMMA_SPACE = ', '
	static final String DOUBLE_BREAK = "${BREAK}${BREAK}"

	static final String UNSPECIFIED = 'UNSPECIFIED'
	static final String NCUBE = 'NCUBE'
	static final String RULE_NCUBE = 'RULE_NCUBE'
	static final String STATUS_SUCCESS = 'success'
	static final String STATUS_INVALID_START_CUBE = 'invalidStartCube'

	static final SafeSimpleDateFormat DATE_TIME_FORMAT = new SafeSimpleDateFormat('yyyy-MM-dd')
	static final String HTTP = 'http:'
	static final String HTTPS = 'https:'
	static final String FILE = 'file:'

	static final String JSON_FILE_PREFIX = 'config/'
	static final String JSON_FILE_SUFFIX = '.json'
	static final String VISUALIZER_CONFIG_CUBE_NAME = 'VisualizerConfig'
	static final String VISUALIZER_CONFIG_NETWORK_OVERRIDES_CUBE_NAME = 'VisualizerConfig.NetworkOverrides'
	static final String CONFIG_ITEM = 'configItem'
	static final String CONFIG_NETWORK_OVERRIDES_BASIC = 'networkOverridesBasic'
	static final String CONFIG_NETWORK_OVERRIDES_FULL = 'networkOverridesFull'
	static final String CONFIG_NETWORK_OVERRIDES_TOP_NODE = 'networkOverridesTopNode'
	static final String CONFIG_DEFAULT_LEVEL = 'defaultLevel'
	static final String CONFIG_ALL_GROUPS = 'allGroups'
	static final String CONFIG_ALL_TYPES = 'allTypes'
	static final String CONFIG_GROUP_SUFFIX = 'groupSuffix'
	static final String CUBE_TYPE = 'cubeType'
	static final String CUBE_TYPE_DEFAULT = null

	static final String DETAILS_CLASS_LOAD_CELL_VALUES = 'loadCellValuesAction'
	static final String DETAILS_CLASS_CELL_VALUES = 'cellValues'
	static final String DETAILS_CLASS_WORD_WRAP = 'wordwrap'
	static final String DETAILS_CLASS_SCOPE_CLICK = 'scopeClick'
	static final String DETAILS_CLASS_SCOPE_INPUT = 'scopeInput'
	static final String DETAILS_CLASS_EXCEPTION = 'Exception'
	static final String DETAILS_CLASS_EXPAND_ALL = 'expandAll'
	static final String DETAILS_CLASS_COLLAPSE_ALL = 'collapseAll'
	static final String DETAILS_CLASS_EXECUTED_CELL = 'executedCell'
	static final String DETAILS_CLASS_FORM_CONTROL = 'form-control'
	static final String DETAILS_CLASS_HIGHLIGHTED = 'highlighted'
}