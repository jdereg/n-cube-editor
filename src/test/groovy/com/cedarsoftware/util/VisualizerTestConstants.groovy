package com.cedarsoftware.util

import groovy.transform.CompileStatic

/**
 * Provides constants for the visualizer
 */

@CompileStatic
class VisualizerTestConstants
{
	public static final String ADDITIONAL_SCOPE_REQUIRED_FOR = 'Additional scope required for '
	public static final String UNABLE_TO_LOAD = 'Unable to load '
	public static final String REQUIRED_SCOPE_VALUE_NOT_FOUND = 'Required scope value not found for '
	public static final String OPTIONAL_SCOPE_AVAILABLE_TO_LOAD = 'Since not all optional scope was provided or found, one or more defaults were used to load '
	public static final String ADDITIONAL_SCOPE_REQUIRED_TO_LOAD = 'Additional scope is required to load '
	public static final String SCOPE_VALUES_ADDED_FOR_REQUIRED_KEYS = 'The scope for the following scope keys was added since required. The default scope values may be changed as desired.'
	public static final String ADD_SCOPE_VALUE_FOR_REQUIRED_KEY = 'A scope value must be supplied for '
	public static final String ADD_SCOPE_VALUE_FOR_OPTIONAL_KEY = 'A different scope value may be supplied for '
	public static final String NONE = 'none'
	public static final String DETAILS_LABEL_NOTE = 'Notes'
	public static final String DETAILS_LABEL_REASON = 'Reason'
	public static final String DETAILS_LABEL_SCOPE = 'Scope'
	public static final String DETAILS_LABEL_AVAILABLE_SCOPE = 'Available scope'
	public static final String DETAILS_LABEL_REQUIRED_SCOPE_KEYS = 'Required scope keys'
	public static final String DETAILS_LABEL_OPTIONAL_SCOPE_KEYS = 'Optional scope keys'
	public static final String DETAILS_LABEL_AXES = 'Axes'
	public static final String DETAILS_LABEL_CELL_VALUES = 'Cell values'
	public static final String DETAILS_LABEL_EXPAND_ALL = 'Expand all'
	public static final String DETAILS_LABEL_COLLAPSE_ALL = 'Collapse all'
	public static final String DETAILS_LABEL_NON_EXECUTED_VALUE = 'Non-executed value:'
	public static final String DETAILS_LABEL_EXECUTED_VALUE = 'Executed value:'
	public static final String DETAILS_LABEL_EXCEPTION = 'Exception:'
	public static final String DETAILS_LABEL_MESSAGE = 'Message:'
	public static final String DETAILS_LABEL_ROOT_CAUSE = 'Root cause:'
	public static final String DETAILS_LABEL_STACK_TRACE = 'Stack trace:'
	public static final String DETAILS_TITLE_EXPAND_ALL = 'Expand all cell details'
	public static final String DETAILS_TITLE_COLLAPSE_ALL = 'Collapse all cell details'
	public static final String DETAILS_TITLE_EXECUTED_CELL = 'Executed cell'
	public static final String DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE = 'The cell was executed with a missing or invalid coordinate.'
	public static final String DETAILS_TITLE_ERROR_DURING_EXECUTION = 'An error occurred during the execution of the cell.'
}