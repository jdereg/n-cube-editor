package com.cedarsoftware.util

import groovy.transform.CompileStatic

/**
 * Provides constants for the visualizer
 */

@CompileStatic
class VisualizerTestConstants
{
	static final String SCOPE_UTILIZED_BY_TOP_NODE = ' scope'
	static final String OPTIONAL_SCOPE_IN_VISUALIZATION = 'Additional scope in visualization'
	static final String ADDITIONAL_SCOPE_REQUIRED_FOR = 'Additional scope required for '
	static final String REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR = 'Required scope value not found for '
	static final String UNABLE_TO_LOAD = 'Unable to load '
	static final String ADDITIONAL_SCOPE_REQUIRED = 'Additional scope is required.'
	static final String IS_NOT_VALID_FOR = 'is not valid for'
	static final String DEFAULTS_WERE_USED = 'Defaults were used for some scope keys. Different values may be provided.'
	static final String ADDITIONAL_SCOPE_USED_TO_LOAD_CELL_VALUES = 'Additional scope used to load cell values for this cube'
	static final String SELECT_OR_ENTER_VALUE = 'Select or enter value...'
	static final String ENTER_VALUE = 'Enter value...'
	static final String DEFAULT = 'Default'
	static final String NONE = 'none'
	static final String DETAILS_LABEL_SCOPE = 'Scope'
	static final String DETAILS_LABEL_AVAILABLE_SCOPE = 'Available scope'
	static final String DETAILS_LABEL_AXES = 'Axes'
	static final String DETAILS_LABEL_CELL_VALUES = 'Cell values'
	static final String DETAILS_LABEL_EXPAND_ALL = 'Expand all'
	static final String DETAILS_LABEL_COLLAPSE_ALL = 'Collapse all'
	static final String DETAILS_LABEL_NON_EXECUTED_VALUE = 'Non-executed value:'
	static final String DETAILS_LABEL_EXECUTED_VALUE = 'Executed value:'
	static final String DETAILS_LABEL_EXCEPTION = 'Exception:'
	static final String DETAILS_LABEL_MESSAGE = 'Message:'
	static final String DETAILS_LABEL_ROOT_CAUSE = 'Root cause:'
	static final String DETAILS_LABEL_STACK_TRACE = 'Stack trace:'
	static final String DETAILS_TITLE_EXPAND_ALL = 'Expand all cell details'
	static final String DETAILS_TITLE_COLLAPSE_ALL = 'Collapse all cell details'
	static final String DETAILS_TITLE_EXECUTED_CELL = 'Executed cell'
	static final String DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE = 'The cell was executed with a missing or invalid coordinate'
	static final String DETAILS_TITLE_ERROR_DURING_EXECUTION = 'An error occurred during the execution of the cell'
}