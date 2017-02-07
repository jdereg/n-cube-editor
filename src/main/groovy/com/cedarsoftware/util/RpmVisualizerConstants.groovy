package com.cedarsoftware.util

import groovy.transform.CompileStatic

/**
 * Provides constants for the visualizer
 */

@CompileStatic
final class RpmVisualizerConstants extends VisualizerConstants
{
	static final String RPM_CLASS = 'rpm.class'
	static final String RPM_ENUM = 'rpm.enum'
	static final String RPM_CLASS_DOT = 'rpm.class.'
	static final String RPM_SCOPE_CLASS_DOT = 'rpm.scope.class.'
	static final String RPM_ENUM_DOT = 'rpm.enum.'
	static final String CLASS_TRAITS = 'CLASS_TRAITS'
	static final String DOT_CLASS_TRAITS = '.classTraits'
	static final String DOT_TRAITS = '.traits'
	static final String R_RPM_TYPE = 'r:rpmType'
	static final String R_EXISTS = 'r:exists'
	static final String V_ENUM = 'v:enum'
	static final String R_SCOPED_NAME = 'r:scopedName'
	static final String V_MIN = 'v:min'
	static final String V_MAX = 'v:max'
	static final String SOURCE_FIELD_NAME = 'sourceFieldName'
	static final String AXIS_FIELD = 'field'
	static final String AXIS_NAME = 'name'
	static final String AXIS_TRAIT = 'trait'
	static final String V_MIN_CARDINALITY = '0'
	static final String V_MAX_CARDINALITY = '999999'

	static final String EFFECTIVE_VERSION = '_effectiveVersion'
	static final String POLICY_CONTROL_DATE = 'policyControlDate'
	static final String QUOTE_DATE = 'quoteDate'
	static final String SOURCE_SCOPE_KEY_PREFIX = 'source'
	static final String SYSTEM_SCOPE_KEY_PREFIX = "_"
	static final String EFFECTIVE_VERSION_SCOPE_KEY = SYSTEM_SCOPE_KEY_PREFIX + "effectiveVersion"
	static final Set<String> MANDATORY_SCOPE_KEYS = [AXIS_FIELD, AXIS_NAME, AXIS_TRAIT] as Set

	static final String CUBE_TYPE_RPM = 'rpm'
	static final String TYPES_TO_ADD_CUBE_NAME = 'VisualizerTypesToAdd'
	static final String SOURCE_TYPE = 'sourceType'
	static final String TARGET_TYPE = 'targetType'
	static final String UNSPECIFIED_ENUM = 'UNSPECIFIED_ENUM'
}