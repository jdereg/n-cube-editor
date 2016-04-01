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
var AXIS_ORDER = NCE_PREFIX + 'AXIS_ORDER';
var COLUMN_WIDTHS = NCE_PREFIX + 'COLUMN_WIDTHS';
var ROW_HEIGHTS = NCE_PREFIX + 'ROW_HEIGHTS';
var TEST_RESULTS = NCE_PREFIX + 'TEST_RESULTS';
var FILTERS = NCE_PREFIX + 'FILTERS';
var SCOPE_MAP = NCE_PREFIX + 'SCOPE_MAP';

var PROGRESS_DELAY = 300;
var DIFF_SIDE_BY_SIDE = 0;
var DIFF_INLINE = 1;
var DIFF_DESCRIPTIVE = 2;
var DIFF_VISUAL = 3;
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
var CALC_WIDTH_AXIS_BUTTON_MOD = 45;
var CALC_WIDTH_REF_AX_BUTTON_MOD = 55;
var CALC_WIDTH_BASE_MOD = 30;
var CALC_WIDTH_TAB_OVERFLOW_MOD = 45;

var CONFIG_TITLE = '~Title';
var CONFIG_DEFAULT_TAB = '~DefaultTab';
var PAGE_ID = 'PageId';

var AXIS_DEFAULT = '002147483647';
var DEFAULT_TEXT = 'Default';

var BACKGROUND_CUBE_NAME = '#6495ED';
var BACKGROUND_AXIS_INFO = '#4D4D4D';
var COLOR_WHITE = '#FFFFFF';

var CLASS_HANDSON_TABLE_HEADER = ' handsonTableHeader';
var CLASS_HANDSON_CURRENT_ROW = 'handsonCurrentRow';

var CLASS_HANDSON_CELL_BASIC = ' cell';
var CLASS_HANDSON_CELL_CODE = ' code';
var CLASS_HANDSON_CELL_CUBE_NAME = ' cube-name';
var CLASS_HANDSON_CELL_DEFAULT = ' tableDefault';
var CLASS_HANDSON_CELL_ODD_ROW = ' oddRow';
var CLASS_HANDSON_CELL_URL = ' url';
var CLASS_HANDSON_SEARCH_RESULT = ' searchResult';

var CLASS_CONFLICT = 'conflict';
var CLASS_OUT_OF_SYNC = 'out-of-sync';
var CLASS_ACTIVE_VIEW = 'active-view';

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

var STATUS = {
    RELEASE: 'RELEASE',
    SNAPSHOT: 'SNAPSHOT'
};

var URL_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CACHE_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CODE_CELL_TYPE_LIST = ['exp', 'method'];
var FILTER_COMPARATOR_LIST = ['=','!=','>','<','contains','excludes'];
var METAPROPERTIES = {
    COLUMN_BLACKLIST: ['value','url','type','id','name'],
    OBJECT_TYPES: {
        CUBE: 'cube',
        AXIS: 'axis',
        COLUMN: 'column'
    }
};

var POPULATE_SELECT_FROM_CUBE = {
    AXIS: 'axis',
    METHOD: 'method'
};

var CONTROLLER_METHOD = {
    GET_APP_NAMES: 'getAppNames',
    GET_APP_VERSIONS: 'getAppVersions',
    SEARCH: 'search',
    GET_CUBE_METAPROPERTIES: 'getCubeMetaProperties',
    GET_AXIS_METAPROPERTIES: 'getAxisMetaProperties',
    GET_COLUMN_METAPROPERTIES: 'getColumnMetaProperties',
    UPDATE_CUBE_METAPROPERTIES: 'updateCubeMetaProperties',
    UPDATE_AXIS_METAPROPERTIES: 'updateAxisMetaProperties',
    UPDATE_COLUMN_METAPROPERTIES: 'updateColumnMetaProperties',
};

var DEFAULT_SCOPE = [
    {
        isApplied: 'true',
        key: 'context',
        value: 'Edit'
    },
    {
        isApplied: 'true',
        key: 'action',
        value: 'Edit'
    }
];

var PERMISSION_ACTION = {
    RELEASE: 'release',
    COMMIT: 'commit'
};

var KEY_CODES = {
    MOUSE_LEFT: 1,
    MOUSE_RIGHT: 3,
    MOUSE_MIDDLE: 2,
    BACKSPACE: 8,
    COMMA: 188,
    INSERT: 45,
    DELETE: 46,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    CONTROL_LEFT: 91,
    COMMAND_LEFT: 17,
    COMMAND_RIGHT: 93,
    ALT: 18,
    HOME: 36,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    SPACE: 32,
    SHIFT: 16,
    CAPS_LOCK: 20,
    TAB: 9,
    ARROW_RIGHT: 39,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
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
    A: 65,
    F: 70,
    X: 88,
    C: 67,
    K: 75,
    V: 86
};