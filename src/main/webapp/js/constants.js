var NCE_PREFIX = 'NCE_';
var SELECTED_APP = NCE_PREFIX + 'SELECTED_APP';
var SELECTED_VERSION = NCE_PREFIX + 'SELECTED_VERSION';
var SELECTED_STATUS = NCE_PREFIX + 'SELECTED_STATUS';
var SELECTED_CUBE = NCE_PREFIX + 'SELECTED_CUBE';
var SELECTED_BRANCH = NCE_PREFIX + 'SELECTED_BRANCH';
var SELECTED_CUBE_INFO = NCE_PREFIX + 'SELECTED_CUBE_INFO';
var ACTIVE_TAB_VIEW_TYPE = NCE_PREFIX + 'ACTIVE_TAB_VIEW_TYPE';
var OPEN_CUBES = NCE_PREFIX + 'OPEN_CUBES';
var HIDDEN_COLUMNS = NCE_PREFIX + 'HIDDEN_COLUMNS';
var GHOST_AXES = NCE_PREFIX + 'GHOST_AXES';
var AXIS_ORDER = NCE_PREFIX + 'AXIS_ORDER';
var COLUMN_WIDTHS = NCE_PREFIX + 'COLUMN_WIDTHS';
var ROW_HEIGHTS = NCE_PREFIX + 'ROW_HEIGHTS';
var TEST_RESULTS = NCE_PREFIX + 'TEST_RESULTS';
var FILTERS = NCE_PREFIX + 'FILTERS';
var SCOPE_INFO = NCE_PREFIX + 'SCOPE_INFO';
var SELECTED_LEVEL = NCE_PREFIX + 'SELECTED_LEVEL';
var SELECTED_GROUPS = NCE_PREFIX + 'SELECTED_GROUPS';
var NETWORK_OPTIONS_DISPLAY = NCE_PREFIX + 'NETWORK_OPTIONS_DISPLAY'; 
var HIERARCHICAL = NCE_PREFIX + 'HIERARCHICAL';
var VISITED_BRANCHES = NCE_PREFIX + 'VISITED_BRANCHES';
var CUBE_SEARCH_OPTIONS_SHOWN = NCE_PREFIX + 'CUBE_SEARCH_OPTIONS_SHOWN';
var CUBE_SEARCH_OPTIONS = NCE_PREFIX + 'CUBE_SEARCH_OPTIONS';
var MOD_CUBES_WINDOW = NCE_PREFIX + 'MOD_CUBES_WINDOW';

var PROGRESS_DELAY = 300;
var ONE_SECOND_TIMEOUT = 1000;
var TWO_SECOND_TIMEOUT = 2000;
var TEN_SECOND_TIMEOUT = 10000;
var MINUTE_TIMEOUT = 60000;
var CUBE_SEARCH_TIMEOUT = ONE_SECOND_TIMEOUT;
//noinspection MagicNumberJS
var MODAL_TOO_FAR_LEFT = -250;
//noinspection MagicNumberJS
var MAIN_SPLITTER_DEFAULTS = {
    TOGGLER_LENGTH_OPEN: 60,
    WEST_SIZE: 250,
    WEST_MIN_SIZE: 200,
    WEST_MAX_SIZE: 700,
    TOGGLER_SIZE_WITH_HEADER: 20,
    SOUTH_DEFAULT_SIZE: 250,
    SOUTH_MIN_SIZE: 50,
    SOUTH_MAX_SIZE: 400
};
var TAB_TRIM_TEXT = 30;
var CUBE_OPTIONS_OFFSET = 90;

var CLIP_NCE = '~NCE~';
var CLIP_EXCEL = 'EXCEL';
var TAB_SEPARATOR = '~';

var MIN_COL_WIDTH = 50;
var MAX_COL_WIDTH = 600;
var FONT_HEIGHT = 22;
var MIN_ROW_HEIGHT = FONT_HEIGHT + 1;
var FONT_SIZE = '14px';
var FONT_CELL = FONT_SIZE + ' Helvetica Neue';
var FONT_CODE = FONT_SIZE + ' Lucida Console';
var CALC_WIDTH_AXIS_BUTTON_MOD = 50;
var CALC_WIDTH_REF_AX_BUTTON_MOD = 60;
var CALC_WIDTH_BASE_MOD = 40;
var CALC_WIDTH_TAB_OVERFLOW_MOD = 45;

var CONFIG_DEFAULT_TAB = 'default-tab';
var CONFIG_NAV_MENU = 'nav-menu';
var CONFIG_TAB_MENU = 'tab-menu';
var CONFIG_TITLE = 'title';
var PAGE_ID = 'PageId';
var TAB_VIEW_TYPE_NCUBE = 'n-cube';
var TAB_VIEW_TYPE_VISUALIZER = 'Visualizer';
var DEFAULT_ACTIVE_TAB_VIEW_TYPE = TAB_VIEW_TYPE_NCUBE + PAGE_ID;
var HAS_EVENT = 'hasEvent';

var DEFAULT_COLUMN_DISPLAY_ORDER = 2147483647;
var AXIS_DEFAULT = '00' + DEFAULT_COLUMN_DISPLAY_ORDER;
var DEFAULT_TEXT = 'Default';
var DEFAULT_COLUMN_COUNT = 12;

var BACKGROUND_CUBE_NAME = '#6495ED';
var BACKGROUND_AXIS_INFO = '#4D4D4D';
var COLOR_WHITE = '#FFFFFF';

var CLASS_HANDSON_TABLE_HEADER = ' handsonTableHeader';
var CLASS_HANDSON_CURRENT_ROW = 'handsonCurrentRow';

var CLASS_HANDSON_CELL_BASIC = ' cell';
var CLASS_HANDSON_CELL_CODE = ' code';
var CLASS_HANDSON_CELL_CUBE_NAME = ' cube-name';
var CLASS_HANDSON_CELL_DEFAULT = ' tableDefault';
var CLASS_HANDSON_CELL_NULL = ' null-cell';
var CLASS_HANDSON_CELL_ODD_ROW = ' oddRow';
var CLASS_HANDSON_CELL_URL = ' url';
var CLASS_HANDSON_COLUMN_DEFAULT = ' columnDefault';
var CLASS_HANDSON_SEARCH_RESULT = ' searchResult';

var CLASS_CONFLICT = 'conflict';
var CLASS_OUT_OF_SYNC = 'out-of-sync';
var CLASS_ACTIVE_VIEW = 'active-view';

var CLASS_NCUBE_NOT_SELECTED = 'ncube-notselected';
var CLASS_NCUBE_SELECTED = 'ncube-selected';
var CLASS_SECTION_ALL = 'section-all';
var CLASS_SECTION_NONE = 'section-none';

var OBJECT = 'object';
var BOOLEAN = 'boolean';
var NUMBER = 'number';
var STRING = 'string';
var FUNCTION = 'function';
var BIG_DECIMAL = 'java.math.BigDecimal';
var ARRAY_LIST = 'java.util.ArrayList';

var GLYPHICONS = {
    OPTION_HORIZONTAL: 'glyphicon-option-horizontal',
    OPTION_VERTICAL: 'glyphicon-option-vertical'
};

var CUBE_IMAGE = {src: './img/cube-logo.png', width: '32px', height: '32px'};

var TAB_OVERFLOW_TEXT_PADDING = 70;
var TAB_WIDTH = 217;
var COORDINATE_BAR_SCROLL_AMOUNT = 40;
var NONE = 'none';
var NBSP = '&nbsp;';
var CUBE_INFO = {
    APP: 0,
    VERSION: 1,
    STATUS: 2,
    BRANCH: 3,
    NAME: 4,
    TAB_VIEW: 5
};

var MAX_VISIBLE_ROWS = 150000;
var MAX_TEMP = 10000000;
var REGEX_ANY_TAG = /(<([^>]+)>)/ig;
var REGEX_HR_TAG = /(<hr([^>]+)>)/ig;

var SAVED_INFO = {
    FILTER_OUT_BLANK_ROWS: 'filterOutBlankRows',
    INFO_DTO: 'infoDto',
    NUMBER_OF_FROZEN_COLUMNS: 'numFrozenCols',
    SEARCH_QUERY: 'searchQuery',
    SHOULD_LOAD_ALL_FOR_SEARCH: 'shouldLoadAllForSearch',
    VIEW_POSITION: 'position',
    HAS_BEEN_WARNED_ABOUT_UPDATING_IF_UNABLE_TO_COMMIT_CUBE: 'hasBeenWarnedAboutUpdatingIfUnableToCommitCube'
};

var STATUS = {
    RELEASE: 'RELEASE',
    SNAPSHOT: 'SNAPSHOT'
};

var VERSION = {
    MAJOR: 0,
    MINOR: 1,
    PATCH: 2
};

var AXIS_SUBTYPES = {
    EXPRESSION: 'EXPRESSION',
    STRING: 'STRING'
};
var AXIS_TYPE_LIST = {
    GENERAL_SUBTYPE: ['STRING', 'LONG', 'BIG_DECIMAL', 'DOUBLE', 'DATE', 'COMPARABLE'],
    RULE_SUBTYPE: ['EXPRESSION'],
    TYPE: ['DISCRETE', 'RANGE', 'SET', 'NEAREST', 'RULE']
};
var URL_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CACHE_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CODE_CELL_TYPE_LIST = ['exp', 'method'];
var FILTER_COMPARATOR_LIST = ['=','!=','>','<','contains','excludes'];
var DELTA_IGNORE_LIST = ['@id', '@type', 'cache', 'hasBeenCached', 'hash'];
var METAPROPERTIES = {
    COLUMN_BLACKLIST: ['value','url','type','id','name'],
    DEFAULT_COLUMN_DEFAULT_VALUE: 'd3fault_c0lumn_default_value',
    DEFAULT_VALUE: 'default_value',
    DEFAULT_VIEW: {
        AXIS_ORDER: 'default_view_axis_order',
        HIDDEN_AXES: 'default_view_hidden_axes',
        HIDDEN_COLUMNS: 'default_view_hidden_columns'
    },
    OBJECT_TYPES: {
        CUBE: 'cube',
        AXIS: 'axis',
        COLUMN: 'column'
    },
    DATA_TYPE_LIST: [
        {key: 'string', value: 'String'},
        {key: 'long', value: 'Integer'},
        {key: 'date', value: 'Date'},
        {key: 'boolean', value: 'Boolean'},
        {key: 'bigdec', value: 'Decimal Financial'},
        {key: 'double', value: 'Decimal Engineering'},
        {key: 'exp', value: 'Expression'},
        {key: 'template', value: 'Template'},
        {key: 'binary', value: 'Binary'},
        {key: 'latlon', value: 'Lat/Lon'},
        {key: 'point2d', value: '2-D Point'},
        {key: 'point3d', value: '3-D Point'}
    ]
};

var DELTA = {
    LOC: {
        AXIS: 'AXIS',
        AXIS_META: 'AXIS_META',
        CELL: 'CELL',
        CELL_META: 'CELL_META',
        COLUMN: 'COLUMN',
        COLUMN_META: 'COLUMN_META',
        NCUBE: 'NCUBE',
        NCUBE_META: 'NCUBE_META'
    },
    TYPE: {
        ADD: 'ADD',
        DELETE: 'DELETE',
        UPDATE: 'UPDATE'
    }
};

var CHANGETYPE = {
    CREATED: {CODE: 'C', DISPLAY_ORDER: 0, CSS_CLASS: 'cube-added', LABEL: 'Added Cubes'},
    RESTORED: {CODE: 'R', DISPLAY_ORDER: 1, CSS_CLASS: 'cube-restored', LABEL: 'Restored Cubes'},
    UPDATED: {CODE: 'U', DISPLAY_ORDER: 2, CSS_CLASS: 'cube-modified', LABEL: 'Updated Cubes'},
    DELETED: {CODE: 'D', DISPLAY_ORDER: 3, CSS_CLASS: 'cube-deleted', LABEL: 'Deleted Cubes'},
    FASTFORWARD: {CODE: 'F', DISPLAY_ORDER: 4, CSS_CLASS: 'cube-fastforward', LABEL: 'No Change - Fast Forward'},
    CONFLICT: {CODE: 'X', DISPLAY_ORDER: 5, CSS_CLASS: 'cube-conflict', LABEL: 'Cubes in Conflict'}
};

var GROOVY_CLASS = {
    CELL_INFO: 'com.cedarsoftware.ncube.CellInfo'
};

var POPULATE_SELECT_FROM_CUBE = {
    AXIS: 'axis',
    METHOD: 'method'
};

var CONTROLLER = 'ncubeController.';
var CONTROLLER_METHOD = {
    ACCEPT_MINE: 'acceptMine',
    ACCEPT_THEIRS: 'acceptTheirs',
    ADD_AXIS: 'addAxis',
    BREAK_AXIS_REFERENCE: 'breakAxisReference',
    CHANGE_VERSION_VALUE: 'changeVersionValue',
    CHECK_PERMISSIONS: 'checkPermissions',
    CLEAR_CACHE: 'clearCache',
    COMMIT_BRANCH: 'commitBranch',
    COMMIT_CUBE: 'commitCube',
    COPY_BRANCH: 'copyBranch',
    COPY_CELLS: 'copyCells',
    CREATE_BRANCH: 'createBranch',
    DELETE_AXIS: 'deleteAxis',
    DELETE_BRANCH: 'deleteBranch',
    DELETE_CUBES: 'deleteCubes',
    DUPLICATE_CUBE: 'duplicateCube',
    FETCH_JSON_BRANCH_DIFFS: 'fetchJsonBranchDiffs',
    FETCH_JSON_REV_DIFFS: 'fetchJsonRevDiffs',
    GET_APP_LOCKED_BY: 'getAppLockedBy',
    GET_APP_NAMES: 'getAppNames',
    GET_APP_VERSIONS: 'getAppVersions',
    GET_AXIS: 'getAxis',
    GET_AXIS_METAPROPERTIES: 'getAxisMetaProperties',
    GET_BRANCH_CHANGES_FOR_HEAD: 'getBranchChangesForHead',
    GET_BRANCH_CHANGES_FOR_MY_BRANCH: 'getBranchChangesForMyBranch',
    GET_HEAD_CHANGES_FOR_BRANCH: 'getHeadChangesForBranch',
    GET_BRANCHES: 'getBranches',
    GET_CELL_NO_EXECUTE: 'getCellNoExecute',
    GET_CELLS_NO_EXECUTE: 'getCellsNoExecute',
    GET_CUBE_METAPROPERTIES: 'getCubeMetaProperties',
    GET_COLUMN_METAPROPERTIES: 'getColumnMetaProperties',
    GET_HEADERS: 'getHeaders',
    GET_JSON: 'getJson',
    GET_MENU: 'getMenu',
    GET_REFERENCE_AXES: 'getReferenceAxes',
    GET_REFERENCES_FROM: 'getReferencesFrom',
    GET_REQUIRED_SCOPE: 'getRequiredScope',
    GET_REVISION_HISTORY: 'getRevisionHistory',
    GET_VERSIONS: 'getVersions',
    HEARTBEAT: 'heartBeat',
    IS_APP_ADMIN: 'isAppAdmin',
    IS_APP_LOCKED: 'isAppLocked',
    IS_CUBE_CURRENT: 'isCubeUpToDate',
    LOAD_CUBE_BY_ID: 'loadCubeById',
    LOCK_APP: 'lockApp',
    MERGE_DELTAS: 'mergeDeltas',
    MOVE_BRANCH: 'moveBranch',
    PASTE_CELLS: 'pasteCells',
    PASTE_CELLS_NCE: 'pasteCellsNce',
    PROMOTE_REVISION: 'promoteRevision',
    RELEASE_VERSION: 'releaseVersion',
    RESOLVE_RELATIVE_URL: 'resolveRelativeUrl',
    RESTORE_CUBES: 'restoreCubes',
    ROLLBACK_BRANCH: 'rollbackBranch',
    SAVE_JSON: 'saveJson',
    SEARCH: 'search',
    UPDATE_AXIS: 'updateAxis',
    UPDATE_AXIS_COLUMNS: 'updateAxisColumns',
    UPDATE_AXIS_METAPROPERTIES: 'updateAxisMetaProperties',
    UPDATE_BRANCH: 'updateBranch',
    UPDATE_CELL: 'updateCell',
    UPDATE_CUBE_FROM_HEAD: 'updateCubeFromHead',
    UPDATE_CUBE_METAPROPERTIES: 'updateCubeMetaProperties',
    UPDATE_COLUMN_METAPROPERTIES: 'updateColumnMetaProperties',
    UPDATE_REFERENCE_AXES: 'updateReferenceAxes'
};

var SEARCH_OPTIONS = {
    SEARCH_INCLUDE_CUBE_DATA: 'includeCubeData',
    SEARCH_INCLUDE_TEST_DATA: 'includeTestData',
    SEARCH_INCLUDE_NOTES: 'includeNotes',
    SEARCH_DELETED_RECORDS_ONLY: 'deletedRecordsOnly',
    SEARCH_ACTIVE_RECORDS_ONLY: 'activeRecordsOnly',
    SEARCH_CHANGED_RECORDS_ONLY: 'changedRecordsOnly',
    SEARCH_EXACT_MATCH_NAME: 'exactMatchName',
    SEARCH_FILTER_INCLUDE: 'includeTags',
    SEARCH_FILTER_EXCLUDE: 'excludeTags'
};

var JSON_MODE = {
    HTML: 'html',
    INDEX: 'json-index',
    INDEX_NOCELLS: 'json-index-nocells',
    JSON: 'json',
    PRETTY: 'json-pretty'
};

var DISPLAY_MAP_TITLE = {
    HTTP_HEADERS: 'HTTP Headers',
    SERVER_STATS: 'Server Statistics'
};

var PERMISSION_ACTION = {
    COMMIT: 'commit',
    READ: 'read',
    RELEASE: 'release',
    UPDATE: 'update'
};

var NOTE_CLASS = {
    PROCESS_DURATION: 'process-duration',
    SYS_META: 'sysmeta'
};

//noinspection MagicNumberJS
var KEY_CODES = {
    MOUSE_LEFT: 1,
    MOUSE_MIDDLE: 2,
    MOUSE_RIGHT: 3,
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    COMMAND_LEFT: 17,
    ALT: 18,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    NUM_0: 48,
    NUM_1: 49,
    NUM_2: 50,
    NUM_3: 51,
    NUM_4: 52,
    NUM_5: 53,
    NUM_6: 54,
    NUM_7: 55,
    NUM_8: 56,
    NUM_9: 57,
    A: 65,
    C: 67,
    D: 68,
    F: 70,
    K: 75,
    S: 83,
    V: 86,
    W: 87,
    X: 88,
    Z: 90,
    NUMPAD_0: 96,
    NUMPAD_1: 97,
    NUMPAD_2: 98,
    NUMPAD_3: 99,
    NUMPAD_4: 100,
    NUMPAD_5: 101,
    NUMPAD_6: 102,
    NUMPAD_7: 103,
    NUMPAD_8: 104,
    NUMPAD_9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DECIMAL: 110,
    DIVIDE: 111,
    CONTROL_LEFT: 91,
    COMMAND_RIGHT: 93,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    SEMICOLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    F_SLASH: 191,
    ACCENT: 192,
    OPEN_BRACKET: 219,
    B_SLASH: 220,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222
};
