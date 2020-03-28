var NCubeEditor2 = (function ($) {

    var headerAxisNames = ['trait','traits','businessDivisionCode','bu','month','months','col','column','cols','columns', 'attribute', 'attributes'];
    var _nce = null;
    var _hot = null;
    var CellEditor;
    var ColumnEditor;
    var CubeEditor;
    var _numColumns = 0;
    var _numRows = 0;
    var _cubeName = null;
    var _axes = null;
    var _axisIdsInOrder = null;
    var _colOffset = null;
    var _data = null;
    var _prefixes = null;
    var _cubeMap = null;
    var _cubeMapRegex = null;
    var _axisColumnMap = null;
    var _expressionLinks = {};
    var _textDims = {};
    var _columnWidths = null;
    var _rowHeights = null;
    var _cellId = null;
    var _tableCellId = null;
    var _columnList = null;
    var _hiddenColumns = {};
    var _ghostAxes = null;
    var _editCellModal = null;
    var _editCellValue = null;
    var _editCellCache = null;
    var _editCellCancel = null;
    var _editCellClear = null;
    var _editCellAnnotate = null;
    var _editCellRadioURL = null;
    var _editCellPopout = null;
    var _editColumnModal = null;
    var _editColInstTitle = null;
    var _editColInstructions = null;
    var _valueDropdown = null;
    var _urlDropdown = null;
    var _colIds = -1;   // Negative and gets smaller (to differentiate on server side what is new)
    var _clipboard = null;
    var _editColClipboard = null;
    var _clipFormat = CLIP_NCE;
    var _viewMode = VIEW_FORMULAS;
    var _searchField = null;
    var _searchInfo = null;
    var _searchCoords = null;
    var _currentSearchResultIndex = null;
    var _ncubeContent = null;
    var _ncubeHtmlError = null;
    var _bufferText = null;
    var _firstRenderedCol = null;
    var _defaultCellText = null;
    var _topAxisBtn = null;
    var _columnIdCombinationsToShow = [];
    var _searchText = null;
    var _hotContainer = null;
    var _moveAxesModal = null;
    var _moveAxesList = null;
    var _moveAxesLabel = null;
    var _moveAxesInstructions = null;
    var _permCache = null;
    var _isCellDirty = null;
    var _coordBarRightBtn = null;
    var _coordBarLeftBtn = null;
    var _coordBarText = null;
    var _utilContainerBar = null;
    var _cssRegEx = new RegExp('[\\#\\.\\w\\-\\,\\s\\n\\r\\t:]+(?=\\s*\\{)', 'gi');
    var _htmlRegEx = new RegExp('<(?:br|p)[^>{]*>|</\\w+\\s*>', 'gi');

    function init(info) {
        if (!_nce) {
            _nce = info;

            _columnList = $('#editColumnsList');
            _editCellModal = $('#editCellModal');
            _editCellValue = $('#editCellValue');
            _editCellCache = $('#editCellCache');
            _editCellCancel = $('#editCellCancel');
            _editCellClear = $('#editCellClear');
            _editCellAnnotate = $('#editCellAnnotate');
            _editCellRadioURL = $('#editCellRadioURL');
            _editCellPopout = $('#editCellPopout');
            _editColumnModal = $('#editColumnsModal');
            _editColInstTitle = $('#editColInstTitle');
            _editColInstructions = $('#editColInstructions');
            _valueDropdown = $('#datatypes-value');
            _urlDropdown = $('#datatypes-url');
            _clipboard = $('#cell-clipboard');
            _editColClipboard = $('#edit-columns-clipboard');
            _searchField = $('#search-field');
            _searchInfo = $('#search-info');
            _ncubeContent = $('#ncube-content');
            _ncubeHtmlError = $('#ncube-error');
            _topAxisBtn = $('#topAxisBtn');
            _hotContainer = $('#hot-container');
            _moveAxesModal = $('#moveAxesModal');
            _moveAxesList = $('#moveAxesList');
            _moveAxesLabel = $('#moveAxesLabel');
            _moveAxesInstructions = $('#moveAxesInstructions');
            _coordBarRightBtn = $('#coordinate-bar-move-right');
            _coordBarLeftBtn = $('#coordinate-bar-move-left');
            _coordBarText = $('#coordinate-bar-text');
            _utilContainerBar = $('#util-container-bar');

            initAllListeners();
            addModalFilters();
            modalsDraggable(true);

            $(document).on('keydown', onWindowKeyDown);

            $(document).on('shown.bs.modal', function() {
                _nce.freezePage(true);
            });

            $(document).on('hidden.bs.modal', function() {
                _nce.freezePage(false);
            });

            $(window).on('resize', function () {
                if (_nce.isPageFrozen()) {
                    _nce.freezePage(false);
                    _nce.freezePage(true);
                }
                delay(hotResize, PROGRESS_DELAY);
            });
        }

        setCoordinateBarListeners();
        buildCubeMap();
        setUtilityBarDisplay();
    }

    function initAllListeners() {
        $('#updateAxisMenu').on('click', updateAxis);
        addSelectAllNoneListeners();
        addColumnEditListeners();
        addMoveAxesListeners();
        addEditCellListeners();
        addSearchListeners();
    }
    
    function onWindowKeyDown(e) {
        var keyCode;
        var isModalDisplayed = $('body').hasClass('modal-open');
        var focus = $(':focus');

        if (!isModalDisplayed && focus && ['cube-search','cube-search-content','search-field'].indexOf(focus.attr('id')) < 0) {
            keyCode = e.keyCode;
            if (e.metaKey || e.ctrlKey) {
                // Control Key (command in the case of Mac)
                switch (keyCode) {
                    case KEY_CODES.F:
                        e.preventDefault();
                        destroyEditor();
                        _searchField[0].focus();
                        break;
                    case KEY_CODES.X:
                        if (CLIP_NCE === _clipFormat) {
                            editCutCopy(true);  // true = isCut
                        } else {
                            excelCutCopy(true);
                        }
                        break;
                    case KEY_CODES.C:
                        if (CLIP_NCE === _clipFormat) {
                            editCutCopy(false); // false = copy
                        } else {
                            excelCutCopy(false);
                        }
                        break;
                    case KEY_CODES.K:
                        toggleClipFormat(e);
                        break;
                    case KEY_CODES.V:
                        editPaste();
                        break;
                    case KEY_CODES.Q:
                        toggleViewMode(e);
                        break;
                }
            } else {
                if (keyCode === KEY_CODES.DELETE) {
                    nceCutCopyData(getSelectedCellRange(), true);
                    reload();
                }
            }
        }
    }

    function hotResize() {
        var winWidth = $(this).width();
        var winHeight = $(this).height();
        if (_hot) {
            destroyEditor();
            _hot.updateSettings({
                height: winHeight - _hotContainer.offset().top,
                width: winWidth
            });
        }
        
        render();
        setUtilityBarDisplay();
    }
    
    function getShouldLoadAllForSearch() {
        return _nce.getShouldLoadAllForSearch() || false;
    }
    
    function saveShouldLoadAllForSearch(shouldLoadAllForSearch) {
        _nce.saveShouldLoadAllForSearch(shouldLoadAllForSearch);
    }

    function getNumFrozenCols() {
        var savedNum = _nce.getNumFrozenCols();
        if (savedNum !== null) {
            return parseInt(savedNum);
        }
        return _colOffset || 1;
    }

    function saveNumFrozenCols(num) {
        _nce.saveNumFrozenCols(num);
    }

    function toggleClipFormat(event) {
        if (event) {
            event.preventDefault();
        }
        _clipFormat = CLIP_NCE === _clipFormat ? CLIP_EXCEL : CLIP_NCE;
        render();
    }

    function toggleViewMode(event) {
        if (event) {
            event.preventDefault();
        }
        _data.cells = null;
        _data.cells = {};
        _viewMode = _viewMode === VIEW_FORMULAS ? VIEW_VALUES : VIEW_FORMULAS;
        reload();
    }

    function setUtilityBarDisplay() {
        var btnWidth = _coordBarRightBtn.outerWidth();
        var windowWidth = $(this).width();
        var search = $('#search-container');
        var searchWidth = search.width();
        var coordWidth = windowWidth - searchWidth;
        _coordBarText.width(coordWidth - btnWidth * 2); // coord bar text
        _coordBarRightBtn.css({left: coordWidth - btnWidth}); // keep the right button to the end
        _utilContainerBar.width(coordWidth); // coord bar container for background
        search.css({left: windowWidth - searchWidth});
    }

    function buildCubeMap() {
        // Build cube list names string for pattern matching
        var cubeMapKeys, key, cmIdx, cmLen, i, len;
        var s = '';
        _prefixes = null;
        _prefixes = ['rpm.class.', 'rpm.enum.']; // TODO make this configurable
        _cubeMap = null;
        _cubeMap = _nce.getCubeMap();
        cubeMapKeys = Object.keys(_cubeMap);
        for (cmIdx = 0, cmLen = cubeMapKeys.length; cmIdx < cmLen; cmIdx++) {
            key = cubeMapKeys[cmIdx];
            if (key.length > 2)
            {   // 1. Only support n-cube names with 3 or more characters in them (too many false replaces will occur otherwise)
                // 2. Chop off accepted prefixes.
                for (i = 0, len = _prefixes.length; i < len; i++) {
                    if (!key.indexOf(_prefixes[i])) {
                        key = key.replace(_prefixes[i], '');
                        break;
                    }
                }
                // 3. Reverse the cube list order (comes from server alphabetically case-insensitively sorted) to match
                // longer strings before shorter strings.
                // 4. Replace '.' with '\.' so that they are only matched against dots (period), not any character.
                s = escapeRegExp(key) + '|' + s;
            }
        }

        if (s.length) {
            s = s.substring(0, s.length - 1);
        }
        s = '(?<![\\/])\\b(' + s + ')\\b(?![\\/])';
        _cubeMapRegex = null;
        _cubeMapRegex = new RegExp(s, 'gi');
    }
    
    function markCubeModified() {
        _nce.updateCubeLeftHandChangedStatus(_cubeName, CHANGETYPE.UPDATED);
    }

    function showHtmlError(text) {
        _ncubeContent.hide();
        _ncubeHtmlError.show();
        _ncubeHtmlError[0].innerHTML = text;
        buildTopAxisMenu();
    }

    function clearHtmlError() {
        _ncubeContent.show();
        _ncubeHtmlError.hide();
    }
    
    function killHotEditor() {
        var keys, i, len, key;
        var editor = _hot.getActiveEditor();
        if (editor) {
            keys = Object.keys(editor);
            for (i = 0, len = keys.length; i < len; i++) {
                key = keys[i];
                if (['eventManager', 'eventListeners'].indexOf(key) < 0) {
                    delete editor[key];
                }
            }
            editor = null;
        }
        removeClipFormatToggleListener();
        removeViewModeToggleListener();
        removeButtonDropdownLocationListeners();
        removeCellListeners();
        _hot.destroy();
        _hot = null;
    }
    
    function load(keepTable) {
        var result, mode;
        resetCoordinateBar();
        _permCache = null;
        _permCache = {};
        if (_hot && !keepTable) {
            killHotEditor();
        }

        mode = shouldLoadAllCells() ? JSON_MODE.INDEX : JSON_MODE.INDEX_NOCELLS;
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.GET_JSON, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), {mode:mode}], {noResolveRefs:true});
        if (!result.status) {
            showHtmlError('Failed to load JSON for cube, error: ' + result.data);
            return;
        }
        clearHtmlError();

        handleCubeData(JSON.parse(result.data));
        if (_numRows > MAX_VISIBLE_ROWS) {
            setUpHide();
            return;
        }

        setUpColumnWidths(true);
        if (!_hot) {
            _hot = new Handsontable(_hotContainer[0], getHotSettings());
        }
        if (!shouldLoadAllCells()) {
            loadCellRows();
        }
        selectSavedOrDefaultCell();
        setClipFormatToggleListener();
        setViewModeToggleListener();
        _searchField.val(_nce.getSearchQuery() || '');
        _searchText = '';
        runSearch();
        searchDown();
    }
    
    function shouldLoadAllCells() {
        return getShouldLoadAllForSearch();
    }

    function loadCellRows() {
        var r, c, cLen, curId, start, end, result, shouldLoadAll, ids;
        if (!_hot) {
            return;
        }

        ids = [];
        shouldLoadAll = shouldLoadAllCells();
        start = shouldLoadAll ? 2 : Math.max(2, _hot.rowOffset());
        cLen = _colOffset ? _axes[_colOffset].columnLength + _colOffset : 1; // special case for 1 axis
        end = shouldLoadAll ? _numRows : Math.min(start + _hot.countRenderedRows(), _numRows);

        for (r = start; r < end; r++) {
            for (c = _colOffset; c < cLen; c++) {
                curId = null;
                curId = getCellIdAsArray(r, c);
                if (!_data.cells.hasOwnProperty(curId.join('_'))) {
                    ids.push(curId);
                }
            }
        }

        if (ids.length) {
            callGetCells(ids, start, end);
        }
    }

    function callGetCells(ids, start, end) {
        var result, method, params, scope;
        if (!ids.length) return;

        method = _viewMode === VIEW_VALUES ? CONTROLLER_METHOD.GET_CELLS : CONTROLLER_METHOD.GET_CELLS_NO_EXECUTE;
        params = [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), ids];
        if (_viewMode === VIEW_VALUES) {
            scope = getSavedScope();
            params.push(scope);
        }

        result = _nce.call(CONTROLLER + method, params, {noResolveRefs:false});
        if (result.status) {
            addCellsToData(result.data);
            setUpColumnWidths(false, start, end);
            runSearch(true);
        } else {
            _nce.showNote('Error getting cells:' + result.data);
        }
    }

    function openScopeBuilder() {
        var opts, i, len, key;
        var scope = getSavedScope();
        var keys = Object.keys(scope);
        var rows = [];
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            rows.push({key: key, value: scope[key]});
        }

        opts = {
            cubeName: _cubeName,
            afterSave: function () {
                saveScopeData(rows);
            },
            onOpen: addHotBeforeKeyDown,
            onClose: function() {
                removeHotBeforeKeyDown();
                loadCellRows();
            },
            onPopOut: metaPropertiesPopOut
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.additionalScope(opts), rows);
    }

    function saveScopeData(data) {
        var row, i, len;
        var scope = {};
        for (i = 0, len = data.length; i < len; i++) {
            row = data[i];
            scope[row.key] = row.value;
        }
        saveScope(scope)
    }

    function getSavedScope() {
        var scope = localStorage[getStorageKey(_nce, SCOPE)];
        return scope ? JSON.parse(scope) : {};
    }

    function saveScope(scope) {
        saveOrDeleteValue(scope, getStorageKey(_nce, SCOPE));
    }
    
    function addCellsToData(cells) {
        var i, len, cell, cellId, cellObj;
        for (i = 0, len = cells.length; i < len; i++) {
            cell = null;
            cellId = null;
            cellObj = null;
            cell = cells[i]['@items'];
            cellId = cell[0]
                .sort(function(a, b) {
                    return getAxisIdFromString(a.toString()) - getAxisIdFromString(b.toString());
                })
                .join('_');
            cellObj = cell[1];

            delete cellObj['@type'];
            _data.cells[cellId] = cellObj;
        }
    }

    function setUpHide() {
        var i, axis, opts;
        var axisData = [];
        for (i = 0; i < _colOffset; i++) {
            axis = _axes[i];
            axisData.push({
                name: axis.name,
                buttonClass: 'btn-' + (_hiddenColumns.hasOwnProperty(axis.name.toLowerCase()) ? FormBuilder.BOOTSTRAP_TYPE.WARNING : FormBuilder.BOOTSTRAP_TYPE.PRIMARY),
                columnLength: axis.columnLength
            });
        }

        opts = {
            cubeName: _cubeName,
            numRows: _numRows,
            axisData: axisData,
            onAxisClick: hideColumns,
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.largeCubeHideColumns(opts));
    }

    function setSearchHelperText() {
        var len, idx, html;
        var query = _searchField.val();
        if (query !== null && query !== '') {
            len = _searchCoords.length;
            idx = _currentSearchResultIndex + 1;
            html = len ? idx + ' of ' + len : 'not found';
        }
        _searchInfo[0].innerHTML = html || '';
    }

    function addSearchListeners() {
        _searchField.on('focus', addHotBeforeKeyDown);

        _searchField.on('blur', removeHotBeforeKeyDown);

        _searchField.on('keyup', function (e) {
            var keyCode = e.keyCode;
            if (keyCode === KEY_CODES.ENTER) {
                runSearch();
                searchDown();
            } else if (keyCode === KEY_CODES.ARROW_DOWN) {
                searchDown();
            } else if (keyCode === KEY_CODES.ARROW_UP) {
                searchUp();
            } else {
                delay(function() {
                    runSearch();
                    searchDown();
                }, 500);
            }
        });

        $('#search-btn-options').on('click', function() {
            searchOptionsOpen();
            $(this).blur();
        });

        $('#search-btn-down').on('click', function() {
            searchDown();
            $(this).blur();
        });

        $('#search-btn-up').on('click', function() {
            searchUp();
            $(this).blur();
        });

        $('#search-btn-remove').on('click', function() {
            searchClear();
            $(this).blur();
        });

        _searchInfo.on('click', searchClick);
    }

    function addHotBeforeKeyDown() {
        if (_hot) {
            _hot.addHook('beforeKeyDown', onBeforeKeyDown);
        }
    }

    function removeHotBeforeKeyDown() {
        if (_hot) {
            _hot.removeHook('beforeKeyDown', onBeforeKeyDown);
        }
    }
    
    function searchOptionsOpen() {
        var opts = {
            loadAll: getShouldLoadAllForSearch(),
            afterSave: function(data) {
                saveShouldLoadAllForSearch(data.loadAll);
                reload();
            },
            onOpen: addHotBeforeKeyDown,
            onClose: function() {
                removeHotBeforeKeyDown();
                destroyEditor();
            }
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.cubeDataSearchOptions(opts));
    }

    function searchClear() {
        _searchField.val('');
        clearSearchMatches();
        setSearchHelperText();
        render();
    }

    function searchClick() {
        _searchField[0].focus();
    }

    function runSearch(forceSearch) {
        var query = _searchField.val();
        var isDiff = _searchText !== query;
        if (forceSearch || isDiff) {
            if (query && query.length) {
                searchCubeData(query, isDiff);
            } else {
                clearSearchMatches();
            }
            setSearchHelperText();
            render();
            _searchText = query;
            _nce.saveSearchQuery(query);
        }
    }

    function getSearchResult(idx) {
        var val = _searchCoords[idx].split('_');
        return {row:parseInt(val[0]), col:parseInt(val[1])};
    }

    function highlightSearchResult(idx) {
        var result = getSearchResult(idx);
        _hot.selectCell(result.row, result.col);
        destroyEditor();
        _searchField[0].focus();
        setSearchHelperText();
    }

    function searchDown() {
        var idx;
        var searchResultsLen = _searchCoords.length;
        if (searchResultsLen) {
            idx = _currentSearchResultIndex === searchResultsLen - 1 ? searchResultsLen - 1 : ++_currentSearchResultIndex;
            highlightSearchResult(idx);
        }
    }

    function searchUp() {
        var idx;
        if (_searchCoords.length) {
            idx = _currentSearchResultIndex ? --_currentSearchResultIndex : 0;
            highlightSearchResult(idx);
        }
    }

    function clearSearchMatches() {
        var axisNum, axisLen, axis, cols, colKeys, cells, cellKeys, i, len, colNum, colLen;
        for (axisNum = 0, axisLen = _axes.length; axisNum < axisLen; axisNum++) {
            axis = _axes[axisNum];
            cols = axis.columns;
            colKeys = Object.keys(cols);
            for (colNum = 0, colLen = colKeys.length; colNum < colLen; colNum++) {
                cols[colKeys[colNum]].isSearchResult = false;
            }
        }

        cells = _data.cells;
        cellKeys = Object.keys(cells);
        for (i = 0, len = cellKeys.length; i < len; i++) {
            cells[cellKeys[i]].isSearchResult = false;
        }

        _searchCoords = null;
        _searchCoords = [];
        _currentSearchResultIndex = -1;
        _nce.saveSearchQuery(null);
    }

    function getAxesOrderedId(numericallyOrderedString) {
        var arr = numericallyOrderedString.split('_');
        arr.sort(function(x, y) {
            var xId = getAxisIdFromString(x);
            var yId = getAxisIdFromString(y);
            return _axisIdsInOrder.indexOf(xId) - _axisIdsInOrder.indexOf(yId);
        });
        return arr.join('_');
    }

    function searchCubeData(query, shouldResetSearchResultIdx) {
        var queryLower, multiplier, rowSpacing, axisNum, colNum, axisLen, colLen, rowSpacingHelper,
            isHorizAxis, getColumnTableCoords, axis, cols, colKeys, col, colVal, curColId, curHelperObj, curColNum,
            cells, cellKeys, cellNum, len, cellId, cell, cellVal, colIds, r, c, colIdNum, colIdLen,
            topAxis, topAxisId, cellIdIdx, cellIdLen, topColId, colIdCombo;
        _searchCoords = null;
        _searchCoords = [];
        if (shouldResetSearchResultIdx) {
            _currentSearchResultIndex = -1;
        }

        queryLower = query.toLowerCase();
        multiplier = 1;
        rowSpacing = _numRows - ROW_OFFSET;
        rowSpacingHelper = [];

        isHorizAxis = function(axisNum) {
            return axisLen > 1 && axisNum === _colOffset;
        };

        getColumnTableCoords = function() {
            var rowIdx, m, cIdx, cLen, combo, colId, add, prevCombo, curStr, prevStr, curSubStr, prevSubStr;
            if (isHorizAxis(axisNum)) {
                addToSearchCoords(1, _colOffset + colNum);
                return;
            }
            if (!hasFilteredData()) {
                rowIdx = colNum * rowSpacing;
                for (m = 0; m < multiplier; m++) {
                    addToSearchCoords(rowIdx + ROW_OFFSET, axisNum);
                    rowIdx += rowSpacing * colLen;
                }
                return;
            }
            for (cIdx = 0, cLen = _columnIdCombinationsToShow.length; cIdx < cLen; cIdx++) {
                combo = _columnIdCombinationsToShow[cIdx];
                colId = _axisColumnMap[_axes[axisNum].name][colNum];
                if (combo.indexOf(colId) > -1) {
                    add = !cIdx;
                    if (!add) {
                        prevCombo = _columnIdCombinationsToShow[cIdx - 1];
                        if (prevCombo.indexOf(colId) === -1) {
                            add = true;
                        } else {
                            curStr = getAxesOrderedId(combo);
                            prevStr = getAxesOrderedId(prevCombo);
                            curSubStr = curStr.substring(0, curStr.indexOf(colId));
                            prevSubStr = prevStr.substring(0, prevStr.indexOf(colId));
                            add = curSubStr !== prevSubStr;
                        }
                    }
                    if (add) {
                        addToSearchCoords(cIdx + ROW_OFFSET, axisNum);
                    }
                }
            }
        };

        // search all axes
        for (axisNum = 0, axisLen = _axes.length; axisNum < axisLen; axisNum++) {
            axis = _axes[axisNum];
            cols = axis.columns;
            colKeys = Object.keys(cols);
            colLen = colKeys.length;
            rowSpacing /= colLen;

            rowSpacingHelper.push({
                axisName: axis.name,
                order: axis.id,
                rowSpacing: rowSpacing,
                horizAxis: isHorizAxis(axisNum)
            });
            // search all columns for an axis
            for (colNum = 0; colNum < colLen; colNum++)
            {
                col = cols[colKeys[colNum]];
                colVal = getRowHeaderPlainTextForWidth(axis, col);
                col.isSearchResult = false;
                if (colVal.toLowerCase().indexOf(queryLower) > -1) {
                    col.isSearchResult = true;
                    getColumnTableCoords();
                }
            }
            multiplier *= colLen;
        }
        rowSpacingHelper.sort(function(a, b) {
            return a.order - b.order;
        });

        // search cells
        cells = _data.cells;
        cellKeys = Object.keys(cells);
        for (cellNum = 0, len = cellKeys.length; cellNum < len; cellNum++)
        {
            cellId = cellKeys[cellNum];
            cell = cells[cellId];
            cellVal = getTextCellValue(cell);
            cell.isSearchResult = cellVal.toLowerCase().indexOf(queryLower) > -1;

            if (cell.isSearchResult) {
                colIds = cellId.split('_');
                r = 0;
                c = 0;
                if (!hasFilteredData()) {
                    for (colIdNum = 0, colIdLen = colIds.length; colIdNum < colIdLen; colIdNum++) {
                        curColId = colIds[colIdNum];
                        curHelperObj = rowSpacingHelper[colIdNum];
                        curColNum = _axisColumnMap[curHelperObj.axisName].indexOf(curColId);

                        if (curHelperObj.horizAxis) {
                            c = curColNum;
                        } else {
                            r += curColNum * curHelperObj.rowSpacing;
                        }
                    }
                    addToSearchCoords(r + ROW_OFFSET, c + (_colOffset || 1));
                } else {
                    topAxis = _axes[_colOffset];
                    topAxisId = topAxis.id;
                    for (cellIdIdx = 0, cellIdLen = colIds.length; cellIdIdx < cellIdLen; cellIdIdx++) {
                        if (getAxisIdFromString(colIds[cellIdIdx]) === topAxisId) {
                            topColId = colIds.splice(cellIdIdx, 1)[0];
                            c = _axisColumnMap[topAxis.name].indexOf(topColId);
                            colIdCombo = colIds.join('_');
                            r = _columnIdCombinationsToShow.indexOf(colIdCombo);
                            if (r > -1) {
                                addToSearchCoords(r + ROW_OFFSET, c + (_colOffset || 1));
                            }
                            break;
                        }
                    }
                }
            }
        }

        _searchCoords.sort(function(a, b) {
            var aa, ab, rowA, rowB, colA, colB;
            aa = a.split('_');
            ab = b.split('_');
            rowA = parseInt(aa[0]);
            rowB = parseInt(ab[0]);
            if (rowA === rowB) {
                colA = parseInt(aa[1]);
                colB = parseInt(ab[1]);
                return colA - colB;
            }
            return rowA - rowB;
        });
    }

    function colorAxisButtons() {
        $('button.axis-btn')
            .filter(function() {
                var buttonAxisName = $(this)[0].textContent.trim().toLowerCase();
                return _hiddenColumns.hasOwnProperty(buttonAxisName);
            })
            .removeClass('btn-primary')
            .addClass('btn-warning');
        
        if (hasGhostAxes()) {
            _topAxisBtn.find('button')
                .removeClass('btn-primary')
                .addClass('btn-info');
        }
    }

    function getColumnLength(axis) {
        var colLen;
        if (axis.hasOwnProperty('columnLength')) {
            return axis.columnLength;
        }

        colLen = Object.keys(axis.columns).length;
        if (axis.hasDefault) {
            colLen++;
        }
        axis.columnLength = colLen;
        return colLen;
    }

    function getAxisIdFromString(id) {
        return id.substring(0, id.length - AXIS_DEFAULT.length);
    }
    
    function getAxisById(id) {
        var axis, axisId, i, len;
        axisId = getAxisIdFromString(id);
        for (i = 0, len = _axes.length; i < len; i++) {
            axis = _axes[i];
            if (axis.id === axisId) {
                return axis;
            }
        }
    }

    function getAxisColumn(axis, colNum) {
        var key, obj;
        if (!axis.columnLength || colNum < 0) {
            return;
        }

        key = _axisColumnMap[axis.name][colNum];
        obj = axis.columns[key];
        if (obj) {
            obj.id = key;
        }

        return obj;
    }

    function getColumnHeader(col) {
        var column;
        var axis = _axes[_colOffset];
        var colNum = col - _colOffset;
        var columnsToReturn = getSavedFilterInfo().columnsToReturn;
        if (columnsToReturn.length) {
            column = getAxisColumnByValue(axis.name, columnsToReturn[colNum]);
        } else {
            column = getAxisColumn(axis, colNum);
        }
        return column || {id:'', value:''};
    }

    function getColumnHeaderValue(col) {
        return getRowHeaderValue(_axes[_colOffset], getColumnHeader(col));
    }

    function getColumnHeaderId(col) {
        return getColumnHeader(col).id;
    }

    function getAxisDefault(axis) {
        var defaultId = axis.id + AXIS_DEFAULT;
        return {id:defaultId, value:DEFAULT_TEXT};
    }

    function getRowHeader(row, col) {
        var rowNum = row - ROW_OFFSET;
        if (rowNum < 0 || col < 0 || col > _axes.length) {
            return;
        }
        return hasFilteredData() ? getFilteredRowHeader(col, rowNum) : getUnFilteredRowHeader(col, rowNum);
    }

    function getFilteredRowHeader(col, rowNum) {
        var idx, idLen, result, curId, column;
        var axis = _axes[col];
        var ids = _columnIdCombinationsToShow[rowNum];
        if (ids) {
            ids = ids.split('_');
            for (idx = 0, idLen = ids.length; idx < idLen; idx++) {
                curId = ids[idx];
                column = axis.columns[curId];
                if (column) {
                    result = column;
                    result.id = curId;
                    return result;
                }
            }
        }
    }

    function getUnFilteredRowHeader(col, rowNum) {
        var axisNum, tempAxis, colCount, columnNumberToGet;
        var axis = _axes[col];
        var colLen = getColumnLength(axis);
        var repeatRowCount = (_numRows - ROW_OFFSET) / colLen;

        for (axisNum = 0; axisNum < col; axisNum++) {
            tempAxis = _axes[axisNum];
            colCount = getColumnLength(tempAxis);
            repeatRowCount /= colCount;
        }
        columnNumberToGet = Math.floor(rowNum / repeatRowCount) % colLen;
        return getAxisColumn(axis, columnNumberToGet);
    }

    function getStringFromDate(date) {
        var idx = date.indexOf('T');
        if (idx > -1) {
            return date.substring(0, idx);
        }
        return date;
    }
    
    function getDateRangeString(range) {
        var v1 = getStringFromDate(range[0]);
        var v2 = getStringFromDate(range[1]);
        return '[' + v1 + ' - ' + v2 + ')';
    }

    function getRowHeaderValue(axis, rowHeader) {
        var temp, i, len, val;
        var rule = '';
        var type = axis.type.toLowerCase();
        var valueType = axis.valueType.toLowerCase();

        if (type === 'rule' && rowHeader.name !== undefined) {
            rule = '<span class="rule-name">' + rowHeader.name + '</span><hr class="hr-rule"/>';
        }

        val = rowHeader.value;
        if (valueType === 'date' && val !== DEFAULT_TEXT) {
            if (typeof val === OBJECT) {
                if (typeof val[0] === OBJECT) {
                    temp = '';
                    for (i = 0, len = val.length; i < len; i++) {
                        temp += getDateRangeString(val[i]) + ', ';
                    }
                    val = temp.slice(0, temp.lastIndexOf(', '));
                } else {
                    val = getDateRangeString(val);
                }
            } else {
                val = getStringFromDate(val);
            }
        }
        if (val === undefined) {
            val = '<a class="nce-anc-url">' + rowHeader.url + '</a>';
        }
        if (rule !== '') {
            val = rule + '<span class="code">' + val + '</span>';
        }
        return '' + val;
    }

    function getRowHeaderPlainTextForWidth(axis, rowHeader) {
        var val = getRowHeaderValue(axis, rowHeader);
        return val.replace(REGEX_HR_TAG, '\n').replace(REGEX_ANY_TAG, '');
    }

    function getRowHeaderPlainText(row, col) {
        var val = getRowHeaderValue(_axes[col], getRowHeader(row, col));
        return val.replace(REGEX_HR_TAG, ' - ').replace(REGEX_ANY_TAG, '');
    }
    
    function getAxisColumnPlainText(axis, column) {
        var val = getRowHeaderValue(axis, column);
        return val.replace(REGEX_HR_TAG, ' - ').replace(REGEX_ANY_TAG, '');
    }

    function getRowHeaderId(row, col) {
        var header = getRowHeader(row, col);
        if (header) {
            return header.id;
        }
    }

    function getCellId(row, col) {
        var i, ghostAxisColumns, headerInfo;
        var ghostKeys = Object.keys(_ghostAxes);
        var ghostLen = ghostKeys.length;

        if (_axes.length + ghostLen === 1) {
            return getRowHeaderId(row, 0);
        }

        headerInfo = [];
        for (i = 0; i < _colOffset; i++) {
            headerInfo.push(getRowHeaderId(row, i));
        }
        for (i = 0; i < ghostLen; i++) {
            ghostAxisColumns = _ghostAxes[ghostKeys[i]].columns;
            headerInfo.push(Object.keys(ghostAxisColumns)[0]);
        }
        headerInfo.push(getColumnHeaderId(col));
        headerInfo.sort(function (a, b) {
            return a - b;
        });
        return headerInfo.join('_');
    }

    function getCellIdAsArray(row, col) {
        var i, ghostAxisColumns, headerInfo;
        var ghostKeys = Object.keys(_ghostAxes);
        var ghostLen = ghostKeys.length;

        if (_axes.length + ghostLen === 1 ) {
            return [parseInt(getRowHeaderId(row, 0))];
        }

        headerInfo = [];
        for (i = 0; i < _colOffset; i++) {
            headerInfo.push(parseInt(getRowHeaderId(row, i)));
        }
        for (i = 0; i < ghostLen; i++) {
            ghostAxisColumns = _ghostAxes[ghostKeys[i]].columns;
            headerInfo.push(parseInt(Object.keys(ghostAxisColumns)[0]));
        }
        headerInfo.push(parseInt(getColumnHeaderId(col)));
        return headerInfo.sort();
    }

    function getCellData(row, col) {
        return _data.cells[getCellId(row, col)];
    }

    function hasCustomAxisOrder() {
        return localStorage.hasOwnProperty(getStorageKey(_nce, AXIS_ORDER));
    }

    function getCustomAxisOrder() {
        return hasCustomAxisOrder() ? JSON.parse(localStorage[getStorageKey(_nce, AXIS_ORDER)]) : getAxisOrderMetaProp();
    }

    function getAxisOrderMetaProp() {
        if (_data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER)) {
            return JSON.parse(_data[METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER]);
        }
    }

    function setAxisIds(cubeAxes) {
        var i, len, axis;
        var keys = Object.keys(cubeAxes);
        for (i = 0, len = keys.length; i < len; i++) {
            axis = cubeAxes[keys[i]];
            axis.id = axis.id.toString();
        }
    }

    function setUpAxisOrder(cubeAxes) {
        function removeNonExistingAxes(customOrder, actualAxes) {
            var i, axis, updateCache;
            for (i = customOrder.length - 1; 0 <= i; i--) {
                axis = actualAxes[customOrder[i]];
                if (axis) {
                    getColumnLength(axis);
                    _axes.unshift(axis);
                    _axisIdsInOrder.unshift(axis.id);
                } else {
                    customOrder.splice(i, 1);
                    updateCache = true;
                }
            }
            if (updateCache) {
                storeAxisOrder(customOrder);
            }
        }

        function hasPreviouslyNonExistingAxes(customOrder, actualAxes) {
            var i, len, axis;
            var keys = Object.keys(actualAxes);
            for (i = 0, len = keys.length; i < len; i++) {
                axis = actualAxes[keys[i]];
                if (customOrder.indexOf(axis.name.toLowerCase()) < 0) {
                    return true;
                }
            }
            return false;
        }

        var order = getCustomAxisOrder();
        _axes = null;
        _axes = [];
        _axisIdsInOrder = null;
        _axisIdsInOrder = [];
        if (order && !hasPreviouslyNonExistingAxes(order, cubeAxes)) {
            removeNonExistingAxes(order, cubeAxes);
        } else {
            delete localStorage[getStorageKey(_nce, AXIS_ORDER)];
            determineAxisOrder(cubeAxes);
        }
    }

    function determineAxisOrder(cubeAxes) {
        var i, len, axis, horizontal, delta, smallestDelta, colLen;
        var keys = Object.keys(cubeAxes);
        for (i = 0, len = keys.length; i < len; i++) {
            _axes.push(cubeAxes[keys[i]]);
        }

        _axes.sort(function (a, b) {
            return getColumnLength(b) - getColumnLength(a);
        });

        smallestDelta = Number.MAX_VALUE;
        for (i = 0, len = _axes.length; i < len; i++) {
            axis = _axes[i];
            colLen = getColumnLength(axis);
            if (headerAxisNames.indexOf(axis.name) > -1) {
                horizontal = i;
                break;
            }
            delta = Math.abs(colLen - DEFAULT_COLUMN_COUNT);
            if (delta < smallestDelta) {
                smallestDelta = delta;
                horizontal = i;
            }
        }
        horizontal = _axes.splice(horizontal, 1);
        _axes.push(horizontal[0]);

        for (i = 0, len = _axes.length; i < len; i++) {
            _axisIdsInOrder.push(_axes[i].id);
        }
    }

    function setUpHideColumns() {
        var i, axisLength, axis, lowerAxisName, keys, j, len;
        var storageKey = getStorageKey(_nce, HIDDEN_COLUMNS);
        _hiddenColumns = null;
        if (localStorage.hasOwnProperty(storageKey)) {
            _hiddenColumns = JSON.parse(localStorage[storageKey]);
        } else if (_data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS) && !localStorage[getStorageKey(_nce, HIDDEN_COLUMNS_OVERRIDE)]) {
            _hiddenColumns = JSON.parse(_data[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS]);
        }
        if (!_hiddenColumns) {
            _hiddenColumns = {};
            return;
        }

        for (i = 0, axisLength = _axes.length; i < axisLength; i++) {
            axis = _axes[i];
            lowerAxisName = axis.name.toLowerCase();
            if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
                keys = Object.keys(_hiddenColumns[lowerAxisName]);
                for (j = 0, len = keys.length; j < len; j++) {
                    axis.columnLength--;
                    delete axis.columns[keys[j]];
                }
            }
        }
    }

    function setUpGhostAxes() {
        var i;
        var storageKey = getStorageKey(_nce, GHOST_AXES);
        _ghostAxes = null;
        if (localStorage.hasOwnProperty(storageKey)) {
            _ghostAxes = JSON.parse(localStorage[storageKey]);
        } else if (_data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES)) {
            _ghostAxes = JSON.parse(_data[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES]);
        }
        if (!_ghostAxes) {
            _ghostAxes = {};
            return;
        }

        for (i = _axes.length; i--;) {
            if (_ghostAxes.hasOwnProperty(_axes[i].name)) {
                _axes.splice(i, 1);
            }
        }
    }

    function storeGhostAxes() {
        saveOrDeleteValue(_ghostAxes, getStorageKey(_nce, GHOST_AXES));
    }

    function hasGhostAxes() {
        return Object.keys(_ghostAxes).length;
    }

    function hasHiddenColumns() {
        return Object.keys(_hiddenColumns).length;
    }

    function setUpAxisColumnMap() {
        var axisNum, axisLen;
        _axisColumnMap = null;
        _axisColumnMap = {};
        for (axisNum = 0, axisLen = _axes.length; axisNum < axisLen; axisNum++) {
            addAxisToAxisColumnMap(_axes[axisNum]);
        }
    }

    function addAxisToAxisColumnMap(axis) {
        var defaultColumn, defId, colNum, colLen;
        var axisName = axis.name;
        var colKeys = Object.keys(axis.columns);
        var colArray = [];
        for (colNum = 0, colLen = colKeys.length; colNum < colLen; colNum++) {
            colArray.push(colKeys[colNum]);
        }

        if (axis.hasDefault) {
            defaultColumn = getAxisDefault(axis);
            defId = defaultColumn.id;
            colArray.push(defId);
            axis.columns[defId] = defaultColumn;
        }
        _axisColumnMap[axisName] = colArray;
    }

    function setUpDataTable() {
        var horizAxis, axisNum, axis;
        var totalRows = 1;
        var savedFilterInfo = getSavedFilterInfo();
        _cubeName = _data.ncube;
        _colOffset = _axes.length - 1;
        _columnIdCombinationsToShow = null;
        _columnIdCombinationsToShow = [];

        if (_axes.length === 1) {
            axis = _axes[0];
            _numColumns = 2;
            _numRows = getColumnLength(axis) + ROW_OFFSET;
            return;
        }

        horizAxis = _axes[_colOffset];
        _numColumns = _colOffset;
        _numColumns += savedFilterInfo.columnsToReturn.length || getColumnLength(horizAxis) || 1;

        if (savedFilterInfo.text) {
            setUpColumnCombinationsToShowFromFilter();
        }
        for (axisNum = 0; axisNum < _colOffset; axisNum++) {
            totalRows *= getColumnLength(_axes[axisNum]);
        }
        _numRows = Math.min(_columnIdCombinationsToShow.length || totalRows, totalRows) + ROW_OFFSET;
    }

    function setUpColumnCombinationsToShowFromFilter() {
        function getColumnIdCombinationFromRow(key, row) {
            var i, axis, axisName, column, columnValue, colId;
            var combo = [];
            for (i = 0; i < _colOffset; i++) {
                axis = _axes[i];
                axisName = _axes[i].name;
                if (!columnIdMap.hasOwnProperty(axisName)) {
                    columnIdMap[axisName] = {};
                }
                if (key.hasOwnProperty(axisName)) {
                    columnValue = key[axisName];
                } else if (getAxisColumnByValue(axisName, key)) {
                    columnValue = key;
                } else if (Array.isArray(key) && getAxisColumnByValue(axisName, key[0])) {
                    columnValue = key[0];
                } else if (row && row.hasOwnProperty(axisName)) {
                    columnValue = row[axisName];
                } else if (getAxisColumnByValue(axisName, row)) {
                    columnValue = row;
                } else {
                    columnValue = null;
                }
                if (columnValue !== null) {
                    if (columnIdMap[axisName].hasOwnProperty(columnValue)) {
                        colId = columnIdMap[axisName][columnValue];
                    } else {
                        column = getAxisColumnByValue(axisName, columnValue);
                        if (column) {
                            colId = column.id;
                            columnIdMap[axisName][columnValue] = colId;
                        } else {
                            return;
                        }
                    }
                } else {
                    colId = getAxisDefault(axis).id;
                }
                combo.push(colId);
            }
            return combo.join('_');
        }

        var i, len, mapReduceColumnCombos, rowKeys, row, curCombo, key;
        var columnIdMap = {};
        var mapReduceResult = callMapReduce();
        if (!mapReduceResult) {
            _nce.showNote('Filter did not return any results. Showing all data.', 'Note', TEN_SECOND_TIMEOUT);
            return;
        }

        mapReduceColumnCombos = mapReduceResult['@keys'] || mapReduceResult;
        delete mapReduceColumnCombos['@type'];
        rowKeys = Object.keys(mapReduceColumnCombos);
        for (i = 0, len = rowKeys.length; i < len; i++) {
            key = rowKeys[i];
            row = mapReduceColumnCombos[key];
            curCombo = getColumnIdCombinationFromRow(key, row);
            if (curCombo) {
                _columnIdCombinationsToShow.push(curCombo);
            }
        }
        _columnIdCombinationsToShow.sort();
    }

    function getAxisColumnByValue(axisName, columnValue) {
        var i, len, column, id;
        var axis = _data.axes[axisName.toLowerCase()];
        var columns = axis.columns;
        var columnIds = Object.keys(columns);
        for (i = 0, len = columnIds.length; i < len; i++) {
            id = columnIds[i];
            column = columns[id];
            if (column.value === columnValue) {
                column.id = id;
                return column;
            }
        }
    }

    function handleCubeData(cubeData) {
        if (Object.keys(_expressionLinks).length > MAX_TEMP) {
            _expressionLinks = null;
            _expressionLinks = {};
        }
        _searchCoords = null;
        _searchCoords = [];
        _currentSearchResultIndex = 0;
        _searchField.val('');
        setSearchHelperText();
        _defaultCellText = null;
        _data = null;
        _data = cubeData;
        setAxisIds(_data.axes);
        setUpAxisOrder(_data.axes);
        setUpGhostAxes();
        setUpHideColumns();
        setUpAxisColumnMap();
        setUpDataTable();
        setUpAxisColumnMap();
    }

    function buildTopAxisMenu() {
        var frozen, idx, offset;
        if (_ncubeHtmlError.is(':visible')) {
            _topAxisBtn.hide();
            return;
        }
        _topAxisBtn.show();
        if (_axes.length < 2) {
            _topAxisBtn.empty();
        } else {
            buildAxisMenu(_axes[_colOffset], _topAxisBtn);
            frozen = getNumFrozenCols();
            idx = _colOffset > frozen ? _colOffset : frozen;
            idx += 2;
            offset = _hotContainer.find('div.ht_clone_top.handsontable > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(' + idx + ')').offset();
            _topAxisBtn.css({top: offset.top + 1, left: offset.left + 1});
        }
    }

    ///////////////////////////////////////////   BEGIN WIDTH HEIGHT   /////////////////////////////////////////////////

    function setUpColumnWidths(shouldClearOld, start, end) {
        var heights = {};
        if (Object.keys(_textDims).length > MAX_TEMP) {
            _textDims = null;
            _textDims = {};
        }
        
        if (shouldClearOld) {
            _columnWidths = null;
            _columnWidths = [];
            _rowHeights = null;
            _rowHeights = [];
        }
        
        if (_axes.length === 1) {
            buildSingleAxisWidthArray(heights);
        } else {
            setupTopWidths(heights);
        }
        buildHeightArray(heights);
    }

    function setupTopWidths(heights) {
        var width, colIndex, colLength, colKey, column, idxOffset, firstColId, colPrefix, regex;
        var cells, cellKeys, topKeys, keyIndex, len, cellKey, colId, hotColIdx, cell, value, dims;
        var topWidths = {};
        var savedWidths = getSavedColumnWidths();
        var axis = _axes[_colOffset];
        var columns = axis.columns;
        var columnKeys = _axisColumnMap[axis.name];
        var horizAxisId = _axes[_colOffset].id;

        topWidths[columnKeys[0]] = savedWidths[_colOffset] || getAxisHeaderWidth(axis);
        for (colIndex = 1, colLength = columnKeys.length; colIndex < colLength; colIndex++) {
            colKey = columnKeys[colIndex];
            column = columns[colKey];
            idxOffset = colIndex + _colOffset;
            topWidths[colKey] = savedWidths[idxOffset] || getAxisColumnWidth(axis, column, topWidths[colKey]);
        }

        if (!columnKeys.length) {
            _columnWidths[0] = MIN_COL_WIDTH;
        } else {
            firstColId = columnKeys[0];
            colPrefix = firstColId.slice(0,-10);
            regex = new RegExp(colPrefix + "(?:\\d{10})");
            cells = _data.cells;
            cellKeys = Object.keys(cells);
            topKeys = Object.keys(topWidths);
            for (keyIndex = 0, len = cellKeys.length; keyIndex < len; keyIndex++) {
                cellKey = cellKeys[keyIndex];
                colId = regex.exec(cellKey)[0];
                hotColIdx = topKeys.indexOf(colId) + _colOffset;
                if (savedWidths.hasOwnProperty(hotColIdx)) {
                    width = savedWidths[hotColIdx];
                } else {
                    cell = cells[cellKey];
                    value = getTextCellValue(cell);
                    dims = calcDomDims(value, cell.type);
                    width = dims.width + CALC_WIDTH_BASE_MOD;
                    width = findWidth(topWidths[colId], width);
                    setHeightForCellRow(heights, horizAxisId, cellKey, width, dims);
                }

                topWidths[colId] = width;
            }
        }

        buildWidthArray(topWidths);
    }
    
    function getAxisHeaderWidth(axis) {
        var modifier = axis.isRef ? CALC_WIDTH_REF_AX_BUTTON_MOD : CALC_WIDTH_AXIS_BUTTON_MOD;
        var buttonWidth = calcDomDims(axis.name, null).width + modifier;
        return findWidth(0, buttonWidth);
    }
    
    function getAxisColumnWidth(axis, column, prevWidth) {
        var columnText = getRowHeaderPlainTextForWidth(axis, column);
        var firstWidth = calcDomDims(columnText, column.type).width + CALC_WIDTH_BASE_MOD;
        return findWidth(prevWidth, firstWidth);
    }

    function buildWidthArray(topWidths) {
        var hotCol, width, columnHeaderId, hasAlreadyCalculatedColumnWidth;
        var savedWidths = getSavedColumnWidths();
        for (hotCol = 0; hotCol < _numColumns; hotCol++) {
            hasAlreadyCalculatedColumnWidth = _columnWidths.hasOwnProperty(hotCol);
            if (hotCol < _colOffset) {
                if (hasAlreadyCalculatedColumnWidth) {
                    continue;
                }
                width = savedWidths[hotCol] || findWidestColumn(_axes[hotCol]);
            } else {
                columnHeaderId = getColumnHeaderId(hotCol);
                width = topWidths[columnHeaderId];
                if (hasAlreadyCalculatedColumnWidth) {
                    width = findWidth(_columnWidths[hotCol], width);
                }
            }
            _columnWidths[hotCol] = width;
        }
    }

    function buildSingleAxisWidthArray(heights, horizAxisId) {
        var correctWidth, oldWidth, cells, cellKeys, cellKey, keyIndex, len, cell, value, dims, width;
        var savedWidths = getSavedColumnWidths();

        // header width
        if (!_columnWidths.hasOwnProperty(0)) {
            _columnWidths[0] = savedWidths[0] || findWidestColumn(_axes[0]);
        }

        // cell width
        if (savedWidths.hasOwnProperty(1)) {
            _columnWidths[1] = savedWidths[1];
        } else {
            oldWidth = _columnWidths[1] || 0;
            cells = _data.cells;
            cellKeys = Object.keys(cells);
            for (keyIndex = 0, len = cellKeys.length; keyIndex < len; keyIndex++) {
                cellKey = cellKeys[keyIndex];
                cell = cells[cellKey];
                value = getTextCellValue(cell);
                dims = calcDomDims(value, cell.type);
                width = dims.width + CALC_WIDTH_BASE_MOD;
                correctWidth = findWidth(oldWidth, width);
                setHeightForCellRow(heights, horizAxisId, cellKey, correctWidth, dims);
                oldWidth = correctWidth;
            }
            _columnWidths[1] = correctWidth;
        }
    }

    function calcDomDims(value, type) {
        var font, width, lineWidths, idx, temp1, temp2, tempWidth, ret;
        if (_textDims.hasOwnProperty(value)) {
            return _textDims[value];
        }
        font = CODE_CELL_TYPE_LIST.indexOf(type) > -1 ? FONT_CODE : FONT_CELL;
        width = 0;
        lineWidths = [];
        idx = value.indexOf('\n');
        if (idx < 0) {
            width = getStringWidth(value, font);
            lineWidths.push(width);
            width = findWidth(0, width);
        } else {
            temp1 = value;
            while (idx > -1) {
                temp2 = value.substring(0, idx);
                tempWidth = getStringWidth(temp2, font);
                lineWidths.push(tempWidth);
                width = findWidth(width, tempWidth);
                temp1 = temp1.substring(idx + 1);
                idx = temp1.indexOf('\n');
            }
            tempWidth = getStringWidth(temp1, font);
            lineWidths.push(tempWidth);
            width = findWidth(width, tempWidth);
        }

        ret = {width:width, lineWidths:lineWidths};
        _textDims[value] = ret;
        return ret;
    }

    function findWidestColumn(axis) {
        var columnId, column, columnText, colWidth, axisCol;
        var findWidthFunc = findWidth;
        var axisName = axis.name;
        var modifier = axis.isRef ? CALC_WIDTH_REF_AX_BUTTON_MOD : CALC_WIDTH_AXIS_BUTTON_MOD;
        var buttonWidth = calcDomDims(axisName, null).width + modifier;
        var oldWidth = findWidthFunc(0, buttonWidth);
        var correctWidth = oldWidth;
        var axisColumns = _axisColumnMap[axisName];
        var axisColLength = axisColumns.length;
        if (axisColLength > 1) {
            for (axisCol = 0; axisCol < axisColLength; axisCol++) {
                columnId = axisColumns[axisCol];
                column = axis.columns[columnId];
                columnText = getRowHeaderPlainTextForWidth(axis, column);
                colWidth = calcDomDims(columnText, column.type).width + CALC_WIDTH_BASE_MOD;
                correctWidth = findWidthFunc(oldWidth, colWidth);
                oldWidth = correctWidth;
            }
        }
        return correctWidth;
    }

    function setHeightForCellRow(heights, horizAxisId, cellId, colWidth, dims) {
        var i, len, id, rowId, lineWidths, totalLines, lineIdx, numLines, newHeight, prevHeight;
        var cellIdArray = cellId.split('_');
        for (i = 0, len = cellIdArray.length; i < len; i++) {
            id = cellIdArray[i];
            if (getAxisIdFromString(id).indexOf(horizAxisId) > -1) {
                cellIdArray.splice(i, 1);
                break;
            }
        }
        rowId = cellIdArray.join('_');
        lineWidths = dims.lineWidths;
        totalLines = 0;
        for (lineIdx = 0, numLines = lineWidths.length; lineIdx < numLines; lineIdx++) {
            totalLines += Math.ceil(lineWidths[lineIdx] / colWidth);
        }

        newHeight = totalLines * FONT_HEIGHT + 1;
        prevHeight = heights[rowId] || MIN_ROW_HEIGHT;
        if (newHeight > prevHeight) {
            heights[rowId] = newHeight;
        }
    }

    function buildHeightArray(heights) {
        buildHeightArrayForRange(heights, 0, _numRows);
    }
    
    function buildHeightArrayForRange(heights, start, end) {
        function calcRowId(r) {
            var i;
            var headerInfo = [];
            for (i = 0; i < _colOffset; i++) {
                headerInfo.push(getRowHeaderId(r, i));
            }
            headerInfo.sort();
            return headerInfo.join('_');
        }
        var r, height;
        var savedHeights = getSavedRowHeights();
        for (r = start; r < end; r++) {
            if (r < ROW_OFFSET) {
                height = 33;
            } else if (savedHeights.hasOwnProperty(r)) {
                height = savedHeights[r];
            } else {
                height = heights[calcRowId(r)] || MIN_ROW_HEIGHT;
            }
            _rowHeights.push(height);
        }
    }

    function getStringWidth(str, font) {
        return $('<p>' + str + '</p>').canvasMeasureWidth(font);
    }

    function findWidth(oldWidth, newWidth) {
        var bigger = Math.max(oldWidth || 0, newWidth || 0);
        return bigger > MAX_COL_WIDTH ? MAX_COL_WIDTH : Math.max(bigger, MIN_COL_WIDTH);
    }

    function deleteSavedColumnWidths() {
        saveOrDeleteValue(null, COLUMN_WIDTHS);
        saveOrDeleteValue(null, ROW_HEIGHTS);
    }

    function getSavedColumnWidths() {
        return parseFromLocalStorage(COLUMN_WIDTHS) || {};
    }

    function getSavedRowHeights() {
        return parseFromLocalStorage(ROW_HEIGHTS) || {};
    }

    function parseFromLocalStorage(key) {
        var saved = localStorage[getStorageKey(_nce, key)];
        return saved ? JSON.parse(saved) : null;
    }

    function saveColumnWidth(col, newVal) {
        var saved = getSavedColumnWidths();
        saved[col] = newVal;
        saveOrDeleteValue(saved, getStorageKey(_nce, COLUMN_WIDTHS));
    }

    function saveRowHeight(row, newVal) {
        var saved = getSavedRowHeights();
        saved[row] = newVal;
        saveOrDeleteValue(saved, getStorageKey(_nce, ROW_HEIGHTS));
    }

    ///////////////////////////////////////////   END WIDTH HEIGHT   ///////////////////////////////////////////////////

    function calcColumnHeader(index) {
        var dividend, modulo, colName;
        if (_axes.length === 1) {
            return index ? 'A' : '';
        }

        if (index < _colOffset) {
            return '';
        }

        dividend = (index + 1) - _colOffset;
        colName = '';
        while (dividend) {
            modulo = (dividend - 1) % 26;
            colName = String.fromCharCode(65 + modulo) + colName;
            dividend = Math.floor((dividend - modulo) / 26);
        }
        return colName;
    }

    function calcRowHeader(index) {
        var text, glyph, isValuesMode;
        if (index > 1) {
            return index - 1;
        }
        if (index) {
            text = _clipFormat === CLIP_NCE ? NBSP + 'NCE' + NBSP : 'Excel';
            glyph = 'copy';
        } else {
            isValuesMode = _viewMode === VIEW_VALUES;
            text = isValuesMode ? 'Values' : 'Formulas';
            glyph = isValuesMode ? 'eye-open' : 'eye-close';
        }
        return '<span class="glyphicon glyphicon-' + glyph + '" style="font-size:13px"></span>' + NBSP + text;
    }

    function setFrozenColumns(numFixed) {
        saveNumFrozenCols(numFixed);
        _hot.updateSettings({fixedColumnsLeft:numFixed});
    }

    function getHotSettings() {
        return {
            copyPaste: false,
            fillHandle: {
                autoInsertRow: false
            },
            colWidths: _columnWidths,
            rowHeights: _rowHeights,
            autoColumnSize: false,
            autoRowSize: false,
            enterBeginsEditing: false,
            enterMoves: {row: 1, col: 0},
            tabMoves : {row: 0, col: 1},
            colHeaders: calcColumnHeader,
            rowHeaders: calcRowHeader,
            startCols: _numColumns,
            startRows: _numRows,
            maxCols: _numColumns,
            maxRows: _numRows,
            contextMenu: false,
            manualColumnResize: true,
            manualRowResize: true,
            fixedColumnsLeft: getNumFrozenCols(),
            fixedRowsTop: 2,
            currentRowClassName: CLASS_HANDSON_CURRENT_ROW,
            currentColClassName: CLASS_HANDSON_CURRENT_ROW,
            outsideClickDeselects: false,
            height: function() {
                return $(window).height() - _hotContainer.offset().top;
            },
            width: function() {
                return $(window).width();
            },
            cells: function (row, col, prop) {
                return {renderer:categoryRenderer};
            },
            beforeRender: function() {
                _firstRenderedCol = null;
                removeButtonDropdownLocationListeners();
                removeCellListeners();
            },
            afterRender: function() {
                buildTopAxisMenu();
                moveTopAxisMenu();
                setButtonDropdownLocations();
                colorAxisButtons();
            },
            afterColumnResize: function(currentColumn, newSize, isDoubleClick) {
                saveColumnWidth(currentColumn, newSize);
            },
            afterRowResize: function(currentRow, newSize, isDoubleClick) {
                saveRowHeight(currentRow, newSize);
            },
            afterSelection: function(r, c, r2, c2) {
                var axisName, axisVal, axisNum, axis, ghostLen, g, ghostKeys, ghostAxis, ghostAxisColumns;
                var display = '';
                if (c >= _colOffset) {
                    if (r > 1) {
                        display = '&nbsp;';
                        for (axisNum = 0; axisNum < _colOffset; axisNum++) {
                            axisName = _axes[axisNum].name;
                            axisVal = getRowHeaderPlainText(r, axisNum);
                            display += '<b>' + axisName + '</b>: ' + axisVal + ', ';
                        }
                        ghostKeys = Object.keys(_ghostAxes);
                        ghostLen = ghostKeys.length;
                        if (ghostLen) {
                            for (g = 0; g < ghostLen; g++) {
                                ghostAxis = null;
                                ghostAxis = _ghostAxes[ghostKeys[g]];
                                ghostAxisColumns = ghostAxis.columns;
                                display += '<b>' + ghostAxis.name + '</b>: '
                                    + getAxisColumnPlainText(ghostAxis, ghostAxisColumns[Object.keys(ghostAxisColumns)[0]]) + ', ';
                            }
                        }
                        if (_axes.length > 1) {
                            axis = _axes[_colOffset];
                            axisName = axis.name;
                            axisVal = getRowHeaderPlainTextForWidth(axis, getColumnHeader(c));
                        } else {
                            axisName = _axes[0].name;
                            axisVal = getRowHeaderPlainText(r, 0);
                        }
                        display += '<b>' + axisName + '</b>: ' + axisVal;
                    } else if (r) {
                        display = '<b>Axis</b>: ' + _axes[_colOffset].name + ', <b>Column</b>:' + getColumnHeaderValue(c);
                    }
                }
                else if (r > 1) {
                    display = '<b>Axis</b>: ' + _axes[c].name + ', <b>Column</b>:' + getRowHeaderPlainText(r, c);
                }
                
                resetCoordinateBar(display);
                delay(saveViewPosition(r, c), PROGRESS_DELAY);
            },
            afterScrollHorizontally: function() {
                moveTopAxisMenu();
            },
            afterScrollVertically: function() {
                delay(function() {
                    saveViewPosition();
                    loadCellRows();
                }, PROGRESS_DELAY);
            },
            beforeAutofill: function(start, end, data) {
                autoFillNce(start, end);
            }
        };
    }
    
    function saveViewPosition(row, col) {
        var r, c;
        var wth = $('.wtHolder');
        var saved = _nce.getViewPosition();
        if (row !== undefined && col !== undefined) {
            r = row;
            c = col;
        } else {
            r = saved.row;
            c = saved.col;
        }
        _nce.saveViewPosition({row:r, col:c, left:wth.scrollLeft(), top:wth.scrollTop()});
        wth = null;
    }

    function moveTopAxisMenu() {
        var i, newWidth, curWidth;
        var numFixed = getNumFrozenCols();
        var tr = _hotContainer.find('div.ht_clone_top.handsontable > div > div > div > table > tbody > tr:nth-child(1)');
        var scrollAmt = $('.ht_master .wtHolder').scrollLeft();
        var thWidth = tr.find('th').outerWidth();
        var frozenWidth = thWidth;
        var startingWidth = thWidth;

        if (!_firstRenderedCol) {
            for (i = 0; i < _colOffset; i++) {
                curWidth = tr.find('td').eq(i).outerWidth();
                startingWidth += curWidth;
                if (i < numFixed) {
                    frozenWidth += curWidth;
                }
            }
        } else if (numFixed) {
            newWidth = $('.ht_clone_left.handsontable').width();
        }
        
        if (!newWidth) {
            if (scrollAmt < (startingWidth - frozenWidth)) {
                newWidth = startingWidth - scrollAmt;
            } else {
                var afterSubtract = frozenWidth || (startingWidth - scrollAmt);
                newWidth = afterSubtract < thWidth ? thWidth : afterSubtract;
            }
        }
        _topAxisBtn.css({left: newWidth});
    }

    function findHotRowHeaderCell(rowNum) {
        var selectorText = 'div.ht_clone_top_left_corner.handsontable > div > div > div > table > tbody > tr:nth-child(' + rowNum + ') > th';
        return _hotContainer.find(selectorText);
    }

    function findViewModeToggleCell() {
        return findHotRowHeaderCell(1);
    }

    function findClipFormatToggleCell() {
        return findHotRowHeaderCell(2);
    }

    function setViewModeToggleListener() {
        findViewModeToggleCell().on('click', function(e) {
            toggleViewMode(e);
        });
    }

    function removeViewModeToggleListener() {
        findViewModeToggleCell().off('click');
    }

    function setClipFormatToggleListener() {
        findClipFormatToggleCell().on('click', function(e) {
            toggleClipFormat(e);
        });
    }
    
    function removeClipFormatToggleListener() {
        findClipFormatToggleCell().off('click');
    }

    function setButtonDropdownLocations() {
        $('.dropdown-toggle').on('click', function() {
            onDropdownClick($(this));
        });
    }

    function onDropdownClick(button) {
        var modalOffset;
        var offset = button.offset();
        var dropDownTop = offset.top + button.outerHeight();
        var dropDownLeft = offset.left;
        var modal = button.closest('.modal-content');
        if (modal.length) {
            modalOffset = modal.offset();
            dropDownTop -= modalOffset.top;
            dropDownLeft -= modalOffset.left;
        }

        button.parent().find('ul').css({top: dropDownTop, left: dropDownLeft});
    }

    function notNullOrUndefined(val) {
        return val !== undefined && val !== null;
    }

    function removeButtonDropdownLocationListeners() {
        $('.dropdown-toggle').off('click');
        $('.axis-menu').remove();
    }
    
    function removeCellListeners() {
        _hotContainer.find('a.nce-anc').parent().empty();
    }

    function categoryRenderer(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        cellProperties.editor = NcubeBaseEditor;
        td.className = '';
        if (_firstRenderedCol === null) {
            _firstRenderedCol = col;
        }

        // cube name
        if (!row && (col < _colOffset || !col)) {
            renderCubeName(td, col, cellProperties);
        } else if (!row) {
            renderHorizontalAxisMetadata(td, col, cellProperties);
        } else if (row === 1) {
            if (col < _colOffset || !col) {
                renderVerticalAxisMetadata(td, col, cellProperties);
            } else {
                renderColumnHeader(td, col, cellProperties);
            }
        } else if (!col || col < _colOffset) {
            renderRowHeader(td, row, col, cellProperties);
        } else {
            renderCell(td, row, col, cellProperties);
        }
    }
    
    function renderCubeName(td, col, cellProperties) {
        if (!col) {
            td.innerHTML = _cubeName;
        }
        td.className += CLASS_HANDSON_CELL_CUBE_NAME;
        td.style.background = BACKGROUND_CUBE_NAME;
        td.style.color = COLOR_WHITE;
        td.colSpan = 1;
        cellProperties.editor = CubeEditor;
        if (col < _axes.length - 2) {
            td.style.borderRight = NONE;
            td.style.overflow = 'visible';
        }
    }
    
    function renderHorizontalAxisMetadata(td, col, cellProperties) {
        if (_axes.length > 1 && (col === _colOffset || (_firstRenderedCol && col === _firstRenderedCol))) {
            td.style.overflow = 'visible';
            td.colSpan = _axes[_colOffset].columnLength - _firstRenderedCol;
        }
        setCommonAxisMetadataProps(td, cellProperties);
    }
    
    function renderVerticalAxisMetadata(td, col, cellProperties) {
        setCommonAxisMetadataProps(td, cellProperties);
        td.style.overflow = 'visible';
        buildAxisMenu(_axes[col], td);
    }
    
    function setCommonAxisMetadataProps(td, cellProperties) {
        td.style.background = BACKGROUND_AXIS_INFO;
        td.style.color = COLOR_WHITE;
        cellProperties.readOnly = true;
    }
    
    function renderColumnHeader(td, col, cellProperties) {
        var column, headerVal;
        var axis = _axes[_colOffset];
        if (_axes.length > 1) {
            column = getColumnHeader(col);
            headerVal = getRowHeaderValue(axis, column);
            td.innerHTML = addCubeLinksToString(headerVal);
            activateLinks(td);
            if (column.isSearchResult) {
                td.className += CLASS_HANDSON_SEARCH_RESULT;
            }
        }
        td.className += CLASS_HANDSON_TABLE_HEADER;
        cellProperties.editor = ColumnEditor;
    }

    function renderRowHeader(td, row, col, cellProperties) {
        var headerVal;
        var rowHeader = getRowHeader(row, col);
        var axis = _axes[col];
        if (row > ROW_OFFSET && getColumnLength(axis) > 1  && col < _colOffset - 1 && rowHeader.id === getRowHeader(row - 1, col).id && (!col || (col && getRowHeader(row, col - 1) === getRowHeader(row - 1, col - 1)))) {
            td.style.borderTop = NONE;
        } else {
            headerVal = getRowHeaderValue(axis, rowHeader);
            td.innerHTML = addCubeLinksToString(headerVal);
            activateLinks(td);
        }
        td.className += CLASS_HANDSON_TABLE_HEADER;
        if (getRowHeader(row, col).isSearchResult) {
            td.className += CLASS_HANDSON_SEARCH_RESULT;
        }

        cellProperties.editor = ColumnEditor;
    }
    
    function renderCell(td, row, col, cellProperties) {
        var cellData = getCellData(row, col);
        td.className += CLASS_HANDSON_CELL_BASIC;
        if (cellData && cellData.type) {
            renderCellWithData(td, cellData);
        } else {
            renderCellDefault(td, row, col);
        }

        if (row % 2 !== 0) {
            td.className += CLASS_HANDSON_CELL_ODD_ROW;
        }
        cellProperties.editor = CellEditor;
    }

    function renderCellWithData(td, cellData) {
        var val;
        if (notNullOrUndefined(cellData.value) || notNullOrUndefined(cellData.url)) {
            if (cellData.isSearchResult) {
                td.className += CLASS_HANDSON_SEARCH_RESULT;
            }

            if (cellData.url !== undefined) {
                td.className += CLASS_HANDSON_CELL_URL;
                td.innerHTML = '<a class="nce-anc-url">' + cellData.url + '</a>';
                activateLinks(td);
            } else if (cellData.value !== undefined && CODE_CELL_TYPE_LIST.indexOf(cellData.type) > -1) {
                td.className += CLASS_HANDSON_CELL_CODE;
                td.innerHTML = buildExpressionLink('' + cellData.value, 'groovy');
                activateLinks(td);
            } else if ('date' === cellData.type) {
                td.innerHTML = getStringFromDate(cellData.value);
            } else {
                val = createUrlAnchorsInString('' + cellData.value);
                td.innerHTML = buildExpressionLink(val);
                activateLinks(td);
            }
        } else {
            td.className += CLASS_HANDSON_CELL_NULL;
            td.innerHTML = 'null';
        }
    }

    function renderCellDefault(td, row, col) {
        var columnDefault = getCalculatedColumnDefault(row, col);
        if (columnDefault !== null) {
            td.className += CLASS_HANDSON_COLUMN_DEFAULT;
            if (columnDefault.type === 'date') {
                td.innerHTML = getStringFromDate(columnDefault.value);
            } else {
                if (columnDefault.url !== undefined) {
                    td.innerHTML = '<a class="nce-anc-url">' + columnDefault.url + '</a>';
                } else {
                    columnDefault = createUrlAnchorsInString('' + columnDefault.value);
                    columnDefault = buildExpressionLink(columnDefault, NONE);
                    td.innerHTML = columnDefault;
                }
                activateLinks(td);
            }
        } else if (_data.defaultCellValue !== null && _data.defaultCellValue !== undefined) {
            td.className += CLASS_HANDSON_CELL_DEFAULT;
            if (_defaultCellText === null) {
                _defaultCellText = buildExpressionLink('' + _data.defaultCellValue, NONE);
            }
            td.innerHTML = _defaultCellText;
            activateLinks(td);
        } else if (_data.defaultCellValueUrl !== null && _data.defaultCellValueUrl !== undefined) {
            td.className += CLASS_HANDSON_CELL_DEFAULT;
            td.innerHTML = '<a class="nce-anc-url">' + _data.defaultCellValueUrl + '</a>';
            activateLinks(td);
        }
    }

    function getCalculatedColumnDefault(row, col) {
        var tempColumnDefault, i;
        var column = getColumnHeader(_colOffset ? col : row - ROW_OFFSET);
        var columnDefault = getColumnDefault(column);

        for (i = 0; i < _colOffset; i++) {
            column = getRowHeader(row, i);
            tempColumnDefault = getColumnDefault(column);
            if (columnDefault === null) {
                columnDefault = tempColumnDefault;
            } else if (columnDefault && tempColumnDefault && (columnDefault.value !== tempColumnDefault.value || columnDefault.type !== tempColumnDefault.type)) {
                return null;
            }
        }
        return columnDefault;
    }

    function getColumnDefault(column) {
        var val, axis;
        if (column.hasOwnProperty(METAPROPERTIES.DEFAULT_VALUE)) {
            val = column[METAPROPERTIES.DEFAULT_VALUE];
        } else if (column.value === DEFAULT_TEXT) {
            axis = getAxisById(column.id);
            if (axis.hasOwnProperty(METAPROPERTIES.DEFAULT_COLUMN_DEFAULT_VALUE)) {
                val = axis[METAPROPERTIES.DEFAULT_COLUMN_DEFAULT_VALUE];
            }
        }
        if (val === undefined) {
            return null;
        }
        if (typeof val === OBJECT) {
            return val;
        }
        if (typeof val === 'boolean') {
            return {type: 'boolean', value: val}
        }
        return {type: 'string', value: val};
    }

    function addToSearchCoords (row, col) {
        var val = row + '_' + col;
        if (_searchCoords.indexOf(val) === -1) {
            _searchCoords.push(val);
        }
    }

    function getTableTextCellValue(row, col) {
        return getTextCellValue(getCellData(row, col));
    }

    function getTextCellValue(cellData) {
        var val = '';

        if (cellData) {
            if (cellData.url !== undefined) {
                val = cellData.url;
            } else if ('date' === cellData.type) {
                val = cellData.value;
                val = getStringFromDate(val);
            } else if (cellData.type) {
                val = cellData.value;
            }
        }
        else if (notNullOrUndefined(_data.defaultCellValue)) {
            val = _data.defaultCellValue;
        }
        return '' + val; // force string coercion
    }

    function createUrlAnchorsInString(val) {
        var ex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var regex = new RegExp(ex);
        return val.replace(regex, function (matched) {
            return '<a class="nce-anc-url">' + matched + '</a>';
        });
    }

    function addCubeLinksToString(str) {
        return str.replace(_cubeMapRegex, function (matched) {
            return '<a class="nce-anc-cube">' + matched + '</a>';
        });
    }
    
    function buildExpressionLink(url, highlightLanguage) {
        var highlighted, tempHighlight, top, ancIdx, text, endIdx;
        if (_expressionLinks.hasOwnProperty(url)) {
            return _expressionLinks[url];
        }
        if (!url || url.length <= 2) {
            return url;
        }

        url = addCubeLinksToString(url);
        if (highlightLanguage === NONE) {
            return url;
        }
        if (url.indexOf('<a class="nce-anc-') === -1) {
            highlighted = highlightLanguage ? hljs.highlight(highlightLanguage, url, true) : hljs.highlightAuto(url);
            return highlighted.value;
        }

        //highlight in between links
        highlighted = '';
        while ((ancIdx = url.indexOf('<a class="nce-anc-')) > -1) {
            text = url.substring(0, ancIdx);
            endIdx = url.indexOf('</a>') + 4;
            tempHighlight = highlightLanguage ? hljs.highlight(highlightLanguage, text, true, top) : hljs.highlightAuto(text);
            if (highlightLanguage) {
                top = hljs.highlight(highlightLanguage, url.substring(0, endIdx), true, top).top;
            }
            highlighted += tempHighlight.value;
            highlighted += url.substring(ancIdx, endIdx);
            url = url.substring(endIdx);
        }
        tempHighlight = highlightLanguage ? hljs.highlight(highlightLanguage, url, true, top) : hljs.highlightAuto(url);
        highlighted += tempHighlight.value;
        return highlighted;
    }

    function onCubeLinkClick(cubeName) {
        function selectCubeIfExists(name) {
            if (_cubeMap.hasOwnProperty(name)) {
                _nce.selectCubeByName(_nce.getProperCubeName(name));
                return true;
            }
        }
        var i, len;
        if (selectCubeIfExists(cubeName)) return;
        for (i = 0, len = _prefixes.length; i < len; i++) {
            if (selectCubeIfExists(_prefixes[i] + cubeName)) return;
        }
    }

    function onUrlLinkClick(link) {
        var result, msg;
        if (!link.indexOf('http:') || !link.indexOf('https:') || !link.indexOf('file:')) {
            window.open(link);
            return;
        }
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.GET_URL_CONTENT, [_nce.getSelectedTabAppId(), link], {noResolveRefs:true});
        if (result.status && result.data) {
            popoutAceEditor({
                value: result.data,
                readonly: true
            });
        } else {
            msg = result.data ? result.data : 'Unable to resolve relative URL against entries in sys.classpath';
            _nce.showNote('Unable to open ' + link + ':<hr class="hr-small"/>' + msg);
        }
    }

    function activateLinks(element) {
        $(element).find('a.nce-anc-cube').on('click', function (e) {
            e.preventDefault();
            onCubeLinkClick(this.textContent.toLowerCase());
        });
        $(element).find('a.nce-anc-url').on('click', function (e) {
            e.preventDefault();
            onUrlLinkClick(this.innerHTML);
        });
    }

    function closeAxisMenu() {
        $('.axis-menu.open').removeClass('open');
        $('div.dropdown-backdrop').hide();
        destroyEditor();
    }

    function buildAxisMenu(axis, element) {
        var el = $(element);
        var axisName = axis.name;
        var axisIndex = findIndexOfAxisName(axisName);
        var isRef = axis.isRef;
        var div = $('<div/>').addClass('btn-group axis-menu');

        el.empty();
        el.append(div);
        div.append(buildAxisMenuHtml(axis));
        div.find('a.anc-axis-source').on('click', function(e) {
            e.preventDefault();
            closeAxisMenu();
            onAxisSourceClick(axis);
        });
        div.find('a.anc-axis-transform').on('click', function(e) {
            e.preventDefault();
            closeAxisMenu();
            onAxisTransformClick(axis);
        });
        div.find('a.anc-break-reference').on('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            onBreakReferenceClick($(this));
        });
        div.find('a.anc-create-reference').on('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            onCreateReferenceClick(axisName);
        });
        div.find('a.anc-update-axis').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            updateAxis(axisName);
        });
        div.find('a.anc-add-axis').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            addAxis();
        });
        div.find('a.anc-delete-axis').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            deleteAxis(axisName);
        });
        div.find('a.anc-edit-axis-metadata').on('click', function(e) {
            e.preventDefault();
            closeAxisMenu();
            editAxisMetadata(axis);
        });
        div.find('a.anc-edit-columns').on('click', function (e) {
            e.preventDefault();
            if (isRef) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            editColumns(axisName);
        });
        div.find('a.anc-set-scope').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            openScopeBuilder();
        });
        div.find('a.anc-filter-data').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            filterOpen();
        });
        div.find('a.anc-clear-filters').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            saveFilterInfo();
            reload();
        });
        div.find('a.anc-set-view').on('click', function (e) {
            e.preventDefault();
            if (!hasModifiedView()) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            callUpdateMetaPropertiesForDefaultCubeView();
            reload();
        });
        div.find('a.anc-clear-view').on('click', function (e) {
            e.preventDefault();
            if (!hasDefaultCubeView()) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            callUpdateMetaPropertiesForDefaultCubeView(true);
            reload();
        });
        div.find('a.anc-hide-columns').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            hideColumns(axisName);
        });
        div.find('a.anc-show-all-columns').on('click', function (e) {
            var axisLower = axisName.toLowerCase();
            e.preventDefault();
            if (!_hiddenColumns.hasOwnProperty(axisLower)) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            delete _hiddenColumns[axisLower];
            storeHiddenColumns();
            reload();
        });
        div.find('a.anc-revert-sizing').on('click', function (e) {
            var columnWidthStorageKey = getStorageKey(_nce, COLUMN_WIDTHS);
            e.preventDefault();
            if (!localStorage[columnWidthStorageKey]) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            saveOrDeleteValue(null, columnWidthStorageKey);
            saveOrDeleteValue(null, getStorageKey(_nce, ROW_HEIGHTS));
            reload();
        });
        div.find('a.anc-frozen-cols').on('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        div.find('input.frozen-cols-input').on('click', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }).on('keyup', function(e) {
            if ([KEY_CODES.ENTER,KEY_CODES.TAB].indexOf(e.keyCode) > -1) {
                closeAxisMenu();
            }
        }).on('change', function() {
            var val = $(this).val();
            if (!isNaN(val)) {
                setFrozenColumns(parseInt(val));
            }
        });
        div.find('button.move-left').on('click', function (e) {
            e.preventDefault();
            if (!axisIndex) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            moveAxis(axisIndex, axisIndex - 1);
        });
        div.find('button.move-up').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            saveFilterInfo();
            moveAxis(axisIndex, _colOffset);
        });
        div.find('button.move-right').on('click', function (e) {
            e.preventDefault();
            if (axisIndex === _axes.length - 2) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            moveAxis(axisIndex, axisIndex + 1);
        });
        div.find('a.anc-revert-axis-order').on('click', function (e) {
            e.preventDefault();
            if (!hasCustomAxisOrder()) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            delete localStorage[getStorageKey(_nce, AXIS_ORDER)];
            reload();
        });
        div.find('a.anc-hide-axis').on('click', function (e) {
            e.preventDefault();
            if (axis.columnLength !== 1) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            _ghostAxes[axisName] = axis;
            storeGhostAxes();
            reload();
        });
        div.find('a.anc-show-all-axes').on('click', function (e) {
            e.preventDefault();
            if (!hasGhostAxes()) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            _ghostAxes = null;
            _ghostAxes = {};
            storeGhostAxes();
            reload();
        });
        div.find('a.anc-move-axis').on('click', function(e) {
            e.preventDefault();
            closeAxisMenu();
            moveAxes();
        });
        div.find('a.anc-frozen-columns').on('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
    }

    function hasModifiedView() {
        return hasCustomAxisOrder() || hasHiddenColumns() || hasGhostAxes();
    }

    function hasDefaultCubeView() {
        return _data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER)
            || _data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES)
            || _data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS);
    }

    function callUpdateMetaPropertiesForDefaultCubeView(shouldClear) {
        var updatedMetaProps = {};
        overrideDefaultViewHiddenColumns(false);
        _nce.showNote('Default view ' + (shouldClear ? 'cleared' : 'set') + '!', 'Note', TWO_SECOND_TIMEOUT);
        if (shouldClear) {
            updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER] = '';
            updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES] = '';
            updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS] = '';
        } else {
            if (hasCustomAxisOrder()) {
                updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER] = JSON.stringify(getCustomAxisOrder());
            }
            if (hasGhostAxes()) {
                updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES] = JSON.stringify(_ghostAxes);
            }
            if (hasHiddenColumns()) {
                updatedMetaProps[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS] = JSON.stringify(_hiddenColumns);
            }
        }
        callUpdateCubeMetaProperties(updatedMetaProps, shouldClear);
    }

    function callUpdateCubeMetaProperties(updatedMetaProps, shouldClear) {
        var i, len, propKey;
        var metaPropertyOptions = {
            objectType: METAPROPERTIES.OBJECT_TYPES.CUBE,
            objectName: _cubeName
        };
        var metaProperties = getMetaProperties(metaPropertyOptions);
        var propKeys = Object.keys(updatedMetaProps);
        for (i = 0, len = propKeys.length; i < len; i++) {
            propKey = propKeys[i];
            if (shouldClear) {
                delete metaProperties[propKey];
            } else {
                metaProperties[propKey] = updatedMetaProps[propKey];
            }
        }
        updateMetaProperties(metaPropertyOptions, metaProperties);
    }

    function updateCubeMetaProperty(metaPropKey, metaPropValue) {
        var updatedMetaProps = {};
        updatedMetaProps[metaPropKey] = JSON.stringify(metaPropValue);
        callUpdateCubeMetaProperties(updatedMetaProps);
    }
    
    function checkCubeUpdatePermissions(axisName, cacheable) {
        var permCheck, canUpdate, resource, appId;
        var cacheId = axisName === undefined || axisName === null ? '*cube' : axisName;
        if (_permCache.hasOwnProperty(cacheId)) {
            return _permCache[cacheId];
        }
        appId = _nce.getSelectedTabAppId();
        resource = _cubeName;
        if (axisName !== undefined && axisName !== null) {
            resource += '/' + axisName;
        }
        permCheck = _nce.checkPermissions(appId, resource, [PERMISSION_ACTION.UPDATE, PERMISSION_ACTION.COMMIT]);
        canUpdate = permCheck[PERMISSION_ACTION.UPDATE];
        if (cacheable) {
            _permCache[cacheId] = canUpdate;
        }
        if (canUpdate && !permCheck[PERMISSION_ACTION.COMMIT] && !_nce.hasBeenWarnedAboutUpdatingIfUnableToCommitCube()) {
            _nce.showNote('You must have someone with the correct permissions commit changes to this cube.', 'Warning!');
            _nce.hasBeenWarnedAboutUpdatingIfUnableToCommitCube(true);
        }
        return canUpdate;
    }
    
    function editAxisMetadata(axis) {
        var axisName = axis.name;
        var metaPropertyOptions = {
            objectType: METAPROPERTIES.OBJECT_TYPES.AXIS,
            objectName: axisName,
            axis: axis,
            readonly: !checkCubeUpdatePermissions(axisName)
        };
        openMetaPropertiesBuilder(metaPropertyOptions);
    }

    function onAxisSourceClick(axis) {
        var appId = appIdFrom(axis.referenceApp, axis.referenceVersion, axis.referenceStatus, axis.referenceBranch);
        _nce.selectCubeByName(axis.referenceCubeName, appId);
    }

    function onAxisTransformClick(axis) {
        var appId = appIdFrom(axis.transformApp, axis.transformVersion, axis.transformStatus, axis.transformBranch);
        _nce.selectCubeByName(axis.transformCubeName, appId);
    }

    function onBreakReferenceClick(an) {
        var btnsHtml;
        an.parent().find('li').not(an.parent()).find('button').remove();
        if (an.find('button').length) {
            an.find('button').remove();
            return;
        }
        btnsHtml = '<button class="btn btn-danger btn-xs pull-right axis-menu-button">Cancel</button>';
        btnsHtml += '<button class="btn btn-primary btn-xs pull-right axis-menu-button confirm">Confirm</button>';
        an.append(btnsHtml);
        an.find('button.confirm').on('click', function (e) {
            e.preventDefault();
            onBreakAxisReferenceConfirm($(this));
        });
    }

    function onBreakAxisReferenceConfirm(el) {
        var axisName = el.parent().parent().parent().siblings('button')[0].textContent.trim();
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.BREAK_AXIS_REFERENCE, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), axisName]);
        closeAxisMenu();
        if (result.status) {
            markCubeModified();
            reload();
        } else {
            _nce.showNote('Error breaking reference for axis ' + axis.name + ':<hr class="hr-small"/>' + result.data);
        }
    }

    function onCreateReferenceClick(axisName) {
        var opts = {
            axisName: axisName,
            appSelectList: _nce.loadAppNames(),
            populateVersionFunc: _nce.getVersions,
            populateBranchFunc: _nce.getBranchNamesByAppId,
            populateCubeFunc: _nce.getCubeListForApp,
            populateAxisFunc: _nce.getAxesFromCube,
            afterSave: function(data) { createReferenceOk(data, axisName); },
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.createReferenceFromAxis(opts));
    }

    function createReferenceOk(data, axisName) {
        var splitVer = data.refVer.split('-');
        var refAppId = appIdFrom(data.refApp, splitVer[0], splitVer[1], data.refBranch);
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.CREATE_REFERENCE_AXIS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), axisName, refAppId, data.refCube, data.refAxis]);
        if (result.status) {
            markCubeModified();
            closeAxisMenu();
            reload();
            if (appIdsEqual(_nce.getAppId(), refAppId)) {
                _nce.loadNCubes();
                _nce.runSearch();
            }
        } else {
            _nce.showNote('Error creating new reference for axis ' + axisName + ':<hr class="hr-small"/>' + result.data);
        }
    }

    function buildAxisMenuHtml(axis) {
        var axisName = axis.name;
        var isRef = axis.isRef;
        var axisIndex = findIndexOfAxisName(axisName);
        var isTopAxis = axisIndex === _colOffset;
        var html = '';

        html += '<button type="button" class="btn-sm btn-primary dropdown-toggle axis-btn" data-toggle="dropdown"><span>';
        html += isRef ? axisName + NBSP + '<span class="glyphicon glyphicon-share-alt"></span>' : axisName;
        html += '</span><span class="caret"/></button>';

        html += '<ul class="dropdown-menu" role="menu">';

        if (isRef) {
            html += '<li><a href="#" class="anc-axis-source">Go to Axis Source</a></li>';
            html += '<li';
            if (!axis.transformApp) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-axis-transform">Go to Axis Transform</a></li>';
            html += '<li><a href="#" class="anc-break-reference">Break Reference</a></li>';
        } else {
            html += '<li><a href="#" class="anc-create-reference">Convert to Reference Axis</a></li>';
        }
        html += '<li class="divider"/>';

        html += '<li><a href="#" class="anc-update-axis">Update Axis...</a></li>';
        html += '<li><a href="#" class="anc-add-axis">Add Axis...</a></li>';
        html += '<li><a href="#" class="anc-delete-axis">Delete Axis...</a></li>';
        html += '<li><a href="#" class="anc-edit-axis-metadata">Edit Axis Metadata...</a></li>';
        html += '<li class="divider"/>';

        html += '<li';
        if (isRef) {
            html += ' class="disabled"';
        }
        html += '><a href="#" class="anc-edit-columns">Edit Columns...</a></li>';
        html += '<li class="divider"/>';

        if (isTopAxis && _axes.length > 1) {
            html += '<li><a href="#" class="anc-set-scope">Set Values Scope...</a></li>';
            html += '<li><a href="#" class="anc-filter-data">Filter Data...</a></li>';
            html += '<li';
            if (!getSavedFilterText()) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-clear-filters">Clear Filters</a></li>';
            html += '<li class="divider"/>';
            html += '<li';
            if (!hasModifiedView()) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-set-view">Set as Default View</a></li>';
            html += '<li';
            if (!hasDefaultCubeView()) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-clear-view">Clear Default View</a></li>';
            html += '<li class="divider"/>';
        }

        html += '<li><a href="#" class="anc-hide-columns">Hide Columns...</a></li>';
        html += '<li';
        if (!_hiddenColumns.hasOwnProperty(axisName.toLowerCase())) {
            html += ' class="disabled"';
        }
        html += '><a href="#" class="anc-show-all-columns">Show All Columns</a></li>';
        html += '<li';
        if (!localStorage[getStorageKey(_nce, COLUMN_WIDTHS)]) {
            html += ' class="disabled"';
        }
        html += '><a href="#" class="anc-revert-sizing">Revert Column / Row Sizing</a></li>';
        html += '<li class="divider"/>';

        if (isTopAxis) {
            html += '<li';
            if (!hasGhostAxes()) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-show-all-axes">Show All Axes</a></li>';
        } else {
            html += '<li><a href="#" class="anc-frozen-columns"># Frozen Columns:';
            html += '<input type="text" class="form-control frozen-cols-input" value="' + getNumFrozenCols() + '"/>'
            html += '</a></li>';

            html += '<li class="divider"/>';
            html += '<li';
            if (axis.columnLength !== 1) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-hide-axis">Hide Axis</a></li>';

            html += '<li class="divider"/>';
            html += '<li><a href="#" class="anc-move-axis" class="dropdown-header">Move Axis</a></li>';
            html += '<li><div role="group" class="btn-group btn-group-sm indent-axis-buttons">';

            html += '<button type="button" class="btn btn-default move-left" aria-label="Move Left"';
            if (!axisIndex) {
                html += ' disabled'
            }
            html += '><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span></button>';

            html += '<button type="button" class="btn btn-default move-up" aria-label="Move Up"';
            html += '><span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span></button>';

            html += '<button type="button" class="btn btn-default move-right" aria-label="Move Right"';
            if (axisIndex === _axes.length - 2) {
                html += ' disabled'
            }
            html += '><span class="glyphicon glyphicon-arrow-right" aria-hidden="true"></span></button>';

            html += '</div></li>';

            html += '<li';
            if (!hasCustomAxisOrder()) {
                html += ' class="disabled"';
            }
            html += '><a href="#" class="anc-revert-axis-order">Revert Axis Order</a></li>';
        }

        html += '</ul>';
        return html;
    }

    //====================================== coordinate bar functions ==================================================

    function resetCoordinateBar(displayText) {
        var show = _coordBarText.hasScrollBar();
        _coordBarText[0].scrollLeft = 0;
        _coordBarText[0].innerHTML = displayText || '';
        _coordBarLeftBtn.toggle(show);
        _coordBarRightBtn.toggle(show);
    }

    function setCoordinateBarListeners() {
        _coordBarLeftBtn.on('click', function() {
            _coordBarText[0].scrollLeft -= COORDINATE_BAR_SCROLL_AMOUNT;
            $(this).blur();
        });

        _coordBarRightBtn.on('click', function() {
            _coordBarText[0].scrollLeft += COORDINATE_BAR_SCROLL_AMOUNT;
            $(this).blur();
        });
    }

    // ==================================== Begin Custom HOT Editors ===================================================

    function destroyEditor() {
        var searchQuery, curCell, i, len, curRow, curCol, prevIdx, curSearchCoord;
        if (!_hot) {
            return;
        }
        if (_hot.getActiveEditor()) {
            _hot.getActiveEditor().finishEditing(null, null, null, true);
        }
        searchQuery = _searchField.val();
        if (searchQuery !== null && searchQuery.length) {
            curCell = getSelectedCellRange();
            if (curCell) {
                curRow = curCell.startRow;
                curCol = curCell.startCol;
                prevIdx = _currentSearchResultIndex;
                searchCubeData(searchQuery, true);
                _currentSearchResultIndex = prevIdx;

                for (i = 0, len = _searchCoords.length; i < len; i++) {
                    curSearchCoord = getSearchResult(i);
                    if (curRow === curSearchCoord.row && curCol === curSearchCoord.col) {
                        _currentSearchResultIndex = i;
                        break;
                    }
                }
            }

            setSearchHelperText();
            render();
        }
    }

    function onBeforeKeyDown(event) {
        event.isImmediatePropagationEnabled = false;
        event.cancelBubble = true;
    }

    function keepKeyDownText(e) {
        var addChar;
        var keycode = e.keyCode;
        var validNotNumPad =
            (keycode >= KEY_CODES.NUM_0 && keycode <= KEY_CODES.NUM_9)      ||
            keycode === KEY_CODES.SPACE || keycode === KEY_CODES.ENTER      ||
            (keycode >= KEY_CODES.A && keycode <= KEY_CODES.Z)              ||
            (keycode >= KEY_CODES.SEMICOLON && keycode <= KEY_CODES.ACCENT) ||          // ;=,-./` (in order)
            (keycode >= KEY_CODES.OPEN_BRACKET && keycode <= KEY_CODES.SINGLE_QUOTE);   // [\]' (in order)

        if (validNotNumPad) {
            addChar = String.fromCharCode(keycode);
            _bufferText += e.shiftKey ? addChar : addChar.toLowerCase();
        } else if (keycode >= KEY_CODES.NUMPAD_0 && keycode <= KEY_CODES.DIVIDE) { //numpad
            _bufferText += String.fromCharCode(keycode - KEY_CODES.NUMPAD_0);
        }
    }

    var NcubeBaseEditor = Handsontable.editors.BaseEditor.prototype.extend();
    NcubeBaseEditor.prototype.prepare = function(row, col, prop, td, cellProperties) {
        Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);
        _bufferText = '';
        this.instance.addHook('beforeKeyDown', keepKeyDownText);
    };
    NcubeBaseEditor.prototype.open = function() {
        this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
    };
    NcubeBaseEditor.prototype.finishEditing = function(restoreOriginalValue, ctrlDown, callback, forceClose) {
        if (!this.isOpened()) {
            if (forceClose) {
                // used to be Handsontable.EditorState.EDITING
                this.state = 'STATE_EDITING'; // needed to override finish editing
            }
            Handsontable.editors.BaseEditor.prototype.finishEditing.apply(this, arguments);
        }
    };
    NcubeBaseEditor.prototype.close = function() {
        this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
        this.instance.removeHook('beforeKeyDown', keepKeyDownText);
    };
    NcubeBaseEditor.prototype.getValue = function() { };
    NcubeBaseEditor.prototype.setValue = function() { };
    NcubeBaseEditor.prototype.init = function() { };
    NcubeBaseEditor.prototype.focus = function() { };

    CellEditor = NcubeBaseEditor.prototype.extend();
    CellEditor.prototype.prepare = function(row, col, prop, td, cellProperties) {
        NcubeBaseEditor.prototype.prepare.apply(this, arguments);
        _tableCellId = getCellId(this.row, this.col);
        _cellId = _tableCellId.split('_');
    };
    CellEditor.prototype.open = function() {
        NcubeBaseEditor.prototype.open.apply(this, arguments);
        var element = _nce.getFocusedElement()
        if (!element)
        {
            editCell();
        }
    };
    CellEditor.prototype.isOpened = function() {
        return _editCellModal.hasClass('in');
    };

    ColumnEditor = NcubeBaseEditor.prototype.extend();
    ColumnEditor.prototype.open = function() {
        var row, col, axis, column, columnName, metaPropertyOptions;
        NcubeBaseEditor.prototype.open.apply(this, arguments);

        row = this.row;
        col = this.col;
        if (row === 1) {
            if (_colOffset < 1) {
                return;
            }
            axis = _axes[_colOffset];
            column = getColumnHeader(col);
            columnName = getColumnHeaderValue(col);
        } else {
            axis = _axes[this.col];
            column = getRowHeader(row, col);
            columnName = getRowHeaderPlainText(row, col);
        }

        metaPropertyOptions = {
            objectType: METAPROPERTIES.OBJECT_TYPES.COLUMN,
            objectName: columnName,
            axis: axis,
            column: column,
            readonly: !checkCubeUpdatePermissions(axis.name)
        };
        openMetaPropertiesBuilder(metaPropertyOptions);
    };

    CubeEditor = NcubeBaseEditor.prototype.extend();
    CubeEditor.prototype.open = function() {
        var metaPropertyOptions;
        NcubeBaseEditor.prototype.open.apply(this, arguments);

        metaPropertyOptions = {
            objectType: METAPROPERTIES.OBJECT_TYPES.CUBE,
            objectName: _cubeName,
            readonly: !checkCubeUpdatePermissions()
        };
        openMetaPropertiesBuilder(metaPropertyOptions);
    };

    // ==================================== End Custom HOT Editors =====================================================

    // ==================================== Begin Edit Metaproperties ==================================================

    function getMetaPropertiesControllerInfo(metaPropertyOptions) {
        var getMethod, setMethod;
        var params = [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName()];
        var objectType = metaPropertyOptions.objectType;
        if (objectType === METAPROPERTIES.OBJECT_TYPES.COLUMN) {
            getMethod = CONTROLLER_METHOD.GET_COLUMN_METAPROPERTIES;
            setMethod = CONTROLLER_METHOD.UPDATE_COLUMN_METAPROPERTIES;
            params.push(metaPropertyOptions.axis.name);
            params.push(metaPropertyOptions.column.id);
        } else if (objectType === METAPROPERTIES.OBJECT_TYPES.AXIS) {
            getMethod = CONTROLLER_METHOD.GET_AXIS_METAPROPERTIES;
            setMethod = CONTROLLER_METHOD.UPDATE_AXIS_METAPROPERTIES;
            params.push(metaPropertyOptions.axis.name);
        } else {
            getMethod = CONTROLLER_METHOD.GET_CUBE_METAPROPERTIES;
            setMethod = CONTROLLER_METHOD.UPDATE_CUBE_METAPROPERTIES;
        }

        return {
            getter: getMethod,
            setter: setMethod,
            params: params
        };
    }

    function getMetaProperties(metaPropertyOptions) {
        var controllerInfo = getMetaPropertiesControllerInfo(metaPropertyOptions);
        var result = _nce.call(CONTROLLER + controllerInfo.getter, controllerInfo.params);
        if (result.status) {
            return result.data;
        }
        _nce.showNote("Unable to fetch metaproperties for " + metaPropertyOptions.objectType + " '" + metaPropertyOptions.objectName + "':<hr class=\"hr-small\"/>" + result.data);
    }

    function updateMetaProperties(metaPropertyOptions, metaProperties) {
        var result;
        var controllerInfo = getMetaPropertiesControllerInfo(metaPropertyOptions);
        controllerInfo.params.push(metaProperties);
        result = _nce.call(CONTROLLER + controllerInfo.setter, controllerInfo.params);
        if (!result.status) {
            _nce.showNote("Unable to update metaproperties for " + metaProperties.objectType + " '" + metaPropertyOptions.objectName + "':<hr class=\"hr-small\"/>" + result.data);
        }
        markCubeModified();
    }

    function openMetaPropertiesBuilder(metaPropertyOptions) {
        var metaKeys, metaProperties, i, len, key, opts, val;
        var mpData = getMetaProperties(metaPropertyOptions);
        if (mpData === null) {
            return;
        }
        delete mpData['@type'];
        metaKeys = Object.keys(mpData);
        metaProperties = [];
        for (i = 0, len = metaKeys.length; i < len; i++) {
            key = metaKeys[i];
            val = null;
            val = mpData[key];
            if (typeof val === OBJECT) {
                metaProperties.push({
                    key: key,
                    dataType: val.dataType,
                    isUrl: val.isUrl,
                    isCached: val.isCached,
                    value: val.value
                });
            } else {
                metaProperties.push({
                    key: key,
                    dataType: 'string',
                    isUrl: false,
                    isCached: false,
                    value: val
                });
            }
        }

        opts = {
            name: metaPropertyOptions.objectName,
            type: metaPropertyOptions.objectType,
            readonly: metaPropertyOptions.readonly,
            afterSave: function () { metaPropertiesSave(metaProperties, metaPropertyOptions); },
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown,
            onPopOut: metaPropertiesPopOut
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.metaProperties(opts), metaProperties);
    }

    function metaPropertiesPopOut(el) {
        popoutAceEditor({
            value: el.val(),
            onSave: function(newVal) {
                el.val(newVal);
            }
        })
    }

    function metaPropertiesSave(metaProperties, metaPropertyOptions) {
        var mpIdx, mpLen, prop;
        var mpMap = {};
        for (mpIdx = 0, mpLen = metaProperties.length; mpIdx < mpLen; mpIdx++) {
            prop = metaProperties[mpIdx];
            mpMap[prop.key] = {
                '@type': GROOVY_CLASS.CELL_INFO,
                isUrl: prop.isUrl,
                isCached: prop.isCached,
                value: prop.value,
                dataType: prop.dataType
            };
        }
        updateMetaProperties(metaPropertyOptions, mpMap);
        reload();
    }

    // ===================================== End Edit Metaproperties ===================================================


    // ==================================== Begin Copy / Paste =========================================================

    function getSelectedCellRange() {
        var row1, row2, col1, col2, cellRange;
        cellRange = _hot.getSelected(); // index of the currently selected cells as an array [startRow, startCol, endRow, endCol]
        if (!cellRange) {
            return null;
        }
        cellRange = cellRange[0];
        if (!cellRange) {
            return null;
        }
        row1 = cellRange[0];
        row2 = cellRange[2];
        col1 = cellRange[1];
        col2 = cellRange[3];
        return {
            startRow: Math.min(row1, row2),
            startCol: Math.min(col1, col2),
            endRow: Math.max(row1, row2),
            endCol: Math.max(col1, col2)
        };
    }

    function excelCutCopy(isCut) {
        var clipData, cellRange, cells, row, col, content, cellId, result;
        if (isCut && !_nce.ensureModifiable('Cannot cut / copy cells.')) {
            return;
        }

        cellRange = getSelectedCellRange();
        clipData = copyHeaders(cellRange);
        if (!clipData) {
            cells = [];
            for (row = cellRange.startRow; row <= cellRange.endRow; row++) {
                for (col = cellRange.startCol; col <= cellRange.endCol; col++) {
                    content = getTableTextCellValue(row, col);
                    cellId = getCellId(row, col);
                    if (cellId) {
                        cells.push(cellId.split('_'));
                    }

                    if (content.indexOf('\n') > -1) {
                        // Must quote if newline (and double any quotes inside)
                        clipData += '"' + content.replace(/"/g, '""') + '"';
                    } else {
                        clipData += content;
                    }

                    if (col < cellRange.endCol) {
                        // Only add tab on last - 1 (otherwise paste will overwrite data in next column)
                        clipData += '\t';
                    }
                }
                cells.push(null);
                clipData += '\n';
            }
            cells.splice(cells.length - 1, 1);

            if (isCut) {
                result = _nce.call(CONTROLLER + CONTROLLER_METHOD.COPY_CELLS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), cells, true]);
                if (!result.status) {
                    _nce.showNote('Error copying/cutting cells:<hr class="hr-small"/>' + result.data);
                    return;
                }
                reload();
            }
        }

        _clipboard.val(clipData);
        _clipboard.focusin();
        _clipboard.select();
    }

    function editCutCopy(isCut) {
        var clipData, cellRange, i, len, columns;
        if (isCut && !_nce.ensureModifiable('Cannot cut / copy cells.')) {
            return;
        }

        cellRange = getSelectedCellRange();
        clipData = copyHeaders(cellRange);
        if (!clipData) {
            clipData = nceCutCopyData(cellRange, isCut);
            if (!clipData) {
                return;
            }
            if (isCut) {
                reload();
            }
        }

        _clipboard.val(clipData);
        _clipboard.focusin();
        _clipboard.select();
    }

    function copyHeaders(cellRange) {
        function getColumnValues(axisNum, rangeStart, rangeEnd) {
            var i, len;
            var vals = '';
            var axis = _axes[axisNum];
            var columnNames = _axisColumnMap[axis.name];
            for (i = rangeStart, len = rangeEnd; i <= len; i++) {
                if (vals) {
                    vals += '\n';
                }
                vals += axis.columns[columnNames[i]].value;
            }
            return vals;
        }

        function getAxisNames(axisNumStart, axisNumEnd) {
            var i, len;
            var vals = '';
            for (i = axisNumStart, len = axisNumEnd; i <= len; i++) {
                if (vals) {
                    vals += '\n';
                }
                vals += _axes[i].name;
            }
            return vals;
        }

        if (!cellRange.startRow && !cellRange.endRow) {
            if (!cellRange.startCol && !cellRange.endCol) {
                return _cubeName;
            }
            if (cellRange.startCol && cellRange.endCol) {
                return _axes[_colOffset].name;
            }
        }
        if (cellRange.startRow === 1 && cellRange.endRow === 1) {
            if (cellRange.startCol < _colOffset && cellRange.endCol < _colOffset) {
                return getAxisNames(cellRange.startCol, cellRange.endCol);
            }
            if (cellRange.startCol >= _colOffset && cellRange.endCol >= _colOffset) {
                return getColumnValues(_colOffset, cellRange.startCol - _colOffset, cellRange.endCol - _colOffset);
            }
        }
        if (cellRange.startCol < _colOffset && cellRange.startCol === cellRange.endCol) {
            return getColumnValues(cellRange.startCol, cellRange.startRow - ROW_OFFSET, cellRange.endRow - ROW_OFFSET);
        }
        return '';
    }

    function nceCutCopyData(range, isCut) {
        var row, col, cellId, result;
        var cells = [];
        for (row = range.startRow; row <= range.endRow; row++) {
            for (col = range.startCol; col <= range.endCol; col++) {
                cellId = getCellId(row, col);
                if (cellId) {
                    cells.push(cellId.split('_'));
                }
            }
            cells.push(null);
        }
        cells.splice(cells.length - 1, 1);

        // Get clipboard ready string + optionally clear cells from database
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.COPY_CELLS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), cells, isCut]);
        if (!result.status) {
            _nce.showNote('Error copying/cutting cells:<hr class="hr-small"/>' + result.data);
            return null;
        }
        return CLIP_NCE + result.data;
    }

    function editPaste() {
        var range;
        if (!_nce.ensureModifiable('Cannot paste cells.')) {
            return;
        }

        _clipboard.val('');
        _clipboard.focus();

        range = getSelectedCellRange();
        if (!range || range.length < 1) {
            return;
        }

        delay(function() {
            var content = _clipboard.val();
            if (!content) {
                return;
            }
            pasteData(content, range);
        }, 100);
    }

    function pasteData(content, range) {
        var clipboard, lineNum, lineLen, cellInfo, cellId, clipRect, clipCol, clipRow, k, kLen, addHotIds,
            clipboard2, r, c, info, cloneCellInfo, lines, coords, rowCoords, values, i, iLen, j, jLen;
        // Location of first selected cell in 2D spreadsheet view.
        var firstRow = range.startRow;
        var firstCol = range.startCol;

        // Location of the last selected cell in 2D spreadsheet view.
        var lastRow = range.endRow;
        var lastCol = range.endCol;

        var numTableRows = _hot.countRows();
        var numTableCols = _hot.countCols();

        var onlyOneCellSelected = firstRow === lastRow && firstCol === lastCol;

        // Parse the clipboard content and build-up coordinates where this content will be pasted.
        var result;
        var colNum = firstCol;
        var rowNum = firstRow;

        if (content.indexOf(CLIP_NCE) === 0) {
            // NCE clipboard data (allows us to handle all cell types)
            content = content.slice(CLIP_NCE.length);
            clipboard = JSON.parse(content);

            if (onlyOneCellSelected) {
                // Paste full clipboard data to cube (if it fits, otherwise clip to edges)
                for (lineNum = 0, lineLen = clipboard.length; lineNum < lineLen; lineNum++) {
                    cellInfo = clipboard[lineNum];
                    if (cellInfo === null) {
                        rowNum++;
                        colNum = firstCol;
                    } else {
                        if (colNum < numTableCols) {
                            // Do attempt to read past edge of 2D grid
                            cellId = getCellId(rowNum, colNum);
                            cellInfo.push(cellId.split('_'));
                        }
                        colNum++;
                    }
                    if (rowNum >= numTableRows) {
                        // Do not go past bottom of grid
                        break;
                    }
                }
            } else {
                // Repeat / Clip case: multiple cells are selected when PASTE invoked, clip pasting to selected
                // range. This is the 'fill-mode' of paste (repeating clipboard data to fill selected rectangle)
                clipRect = [[]];  // 2D array
                clipCol = 0;
                clipRow = 0;

                // Refashion linear clipboard (with nulls as column boundaries) to 2D
                for (k = 0, kLen = clipboard.length; k < kLen; k++) {
                    if (clipboard[k]) {
                        clipRect[clipRow][clipCol] = clipboard[k];
                        clipCol++;
                    } else {
                        clipCol = 0;
                        clipRow++;
                        clipRect[clipRow] = [];
                    }
                }
                clipRow++;  // count of rows (not 0 based), e.g. 4 for rows 0-3 (needed for modulo below)
                clipboard2 = [];

                for (r = firstRow; r <= lastRow; r++) {
                    for (c = firstCol; c <= lastCol; c++) {
                        info = clipRect[(r - firstRow) % clipRow][(c - firstCol) % clipCol];
                        cloneCellInfo = info.slice(0);
                        cellId = getCellId(r, c);
                        cloneCellInfo.push(cellId.split('_'));
                        clipboard2.push(cloneCellInfo);
                    }
                    rowNum++;
                }
                clipboard = clipboard2;
            }
            // Paste cells from database
            result = _nce.call(CONTROLLER + CONTROLLER_METHOD.PASTE_CELLS_NCE, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), clipboard]);
        } else {
            // Normal clipboard data, from Excel, for example
            lines = parseExcelClipboard(content);
            coords = [];
            rowCoords = [];
            values = [];

            // If more than one cell is selected, create coords for all selected cells.
            // Server will repeat values, properly throughout the selected 'clip' region.
            for (i = 0, iLen = lines.length; i < iLen; i++) {
                rowCoords = null;
                rowCoords = [];
                values.push(lines[i]);  // push a whole line of values at once.
                colNum = firstCol;

                for (j = 0, jLen = lines[i].length; j < jLen; j++) {
                    if (colNum < numTableCols) {
                        // Do attempt to read past edge of 2D grid
                        cellId = getCellId(rowNum, colNum);
                        rowCoords.push(cellId.split('_'));
                    }
                    colNum++;
                }
                coords.push(rowCoords);
                rowNum++;

                if (rowNum > numTableRows) {
                    // Do not go past bottom of grid
                    break;
                }
            }

            if (!onlyOneCellSelected) {
                // Multiple cells are selected when PASTE invoked, clip pasting to selected range.
                coords = null;
                coords = [];
                addHotIds = [];
                for (r = firstRow; r <= lastRow; r++) {
                    rowCoords = [];
                    for (c = firstCol; c <= lastCol; c++) {
                        cellId = getCellId(r, c);
                        rowCoords.push(cellId.split('_'));
                        addHotIds.push(cellId);
                    }
                    coords.push(rowCoords);
                }
            }

            // Paste cells from database
            result = _nce.call(CONTROLLER + CONTROLLER_METHOD.PASTE_CELLS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), values, coords]);
        }

        if (result.status) {
            markCubeModified();
            reload(true);
        } else {
            _nce.showNote('Error pasting cells:<hr class="hr-small"/>' + result.data);
        }
    }

    function autoFillNce(start, end) {
        var content;
        var copyRange = getSelectedCellRange();
        var pasteRange = {
            startRow: start.row,
            endRow: end.row,
            startCol: start.col,
            endCol: end.col
        };

        if (copyRange.startRow < pasteRange.startRow) { //fill down
            copyRange.endRow = pasteRange.startRow - 1;
        } else if (copyRange.endRow > pasteRange.endRow) { //fill up
            copyRange.startRow = pasteRange.endRow + 1;
        } else if (copyRange.startCol < pasteRange.startCol) { //fill right
            copyRange.endCol = pasteRange.startCol - 1;
        } else if (copyRange.endCol > pasteRange.endCol) { //fill left
            copyRange.startCol = pasteRange.endCol + 1;
        }

        content = nceCutCopyData(copyRange, false);
        if (content) {
            pasteData(content, pasteRange);
        }
    }

    // ==================================== End Copy / Paste ===========================================================

    // ==================================== Everything to do with Cell Editing =========================================

    function addEditCellListeners() {
        _editCellClear.on('click', editCellClear);
        _editCellAnnotate.on('click', function() {
            _nce.annotateCell(_cellId, _nce.getSelectedTabAppId().branch === 'HEAD');
        });
        _editCellCancel.on('click', editCellClose);
        $('#editCellOk').on('click', function() {
            editCellOK();
        });
        _editCellValue.on('keydown', function(e) {
            var start, end, oldVal;
            if (e.keyCode === KEY_CODES.TAB) {
                e.preventDefault();
                start = this.selectionStart;
                end = this.selectionEnd;

                // set textarea value to insert tab
                oldVal = $(this).val();
                $(this).val(oldVal.substring(0, start) + '\t' + oldVal.substring(end));

                // put cursor to correct position
                this.selectionStart = start + 1;
                this.selectionEnd = start + 1;
            }
        }).on('change', function() {
            _isCellDirty = true;
        });
        
        _editCellRadioURL.on('change', onEditCellRadioUrlChange);
        _editCellCache.on('change', function() {
            _isCellDirty = true;
        });
        _urlDropdown.on('change', function() {
            enabledDisableCheckBoxes();
            _isCellDirty = true;
        });
        _valueDropdown.on('change', function() {
            enabledDisableCheckBoxes();
            _isCellDirty = true;
        });

        _editCellModal.on('keydown', function(e) {
            var dir;
            if (!$(e.target).is('textArea, select')) {
                switch (e.keyCode) {
                    case KEY_CODES.ARROW_LEFT:
                    case KEY_CODES.A:
                        dir = KEY_CODES.ARROW_LEFT;
                        break;
                    case KEY_CODES.ARROW_RIGHT:
                    case KEY_CODES.D:
                        dir = KEY_CODES.ARROW_RIGHT;
                        break;
                    case KEY_CODES.ARROW_UP:
                    case KEY_CODES.W:
                        dir = KEY_CODES.ARROW_UP;
                        break;
                    case KEY_CODES.ARROW_DOWN:
                    case KEY_CODES.S:
                        dir = KEY_CODES.ARROW_DOWN;
                        break;
                }
                moveCellEditor(dir);
            }
        }).on('shown.bs.modal', onEditCellModalShown);

        $('#editCellLeft').on('click', function() {
            moveCellEditor(KEY_CODES.ARROW_LEFT);
        });
        $('#editCellRight').on('click', function() {
            moveCellEditor(KEY_CODES.ARROW_RIGHT);
        });
        $('#editCellUp').on('click', function() {
            moveCellEditor(KEY_CODES.ARROW_UP);
        });
        $('#editCellDown').on('click', function() {
            moveCellEditor(KEY_CODES.ARROW_DOWN);
        });

        _editCellPopout.on('click', function(e) {
            var val = _editCellValue.val();
            var dataType = _valueDropdown.val();
            var mode = dataType === 'exp' ? 'groovy' : detectLanguage(val);
            e.preventDefault();
            popoutAceEditor({
                value: val,
                mode: mode,
                readonly: !_nce.ensureModifiable(),
                onSave: function(newVal) {
                    _editCellValue.val(newVal);
                    _isCellDirty = true;
                }
            })
        });
    }

    function detectLanguage(text) {
        if (!text.indexOf('{')) {
            return 'json';
        }
        if (text.indexOf('function') > -1 || text.indexOf('var') > -1) {
            return 'javascript';
        }
        if (_htmlRegEx.test(text)) {
            return 'html';
        }
        if (_cssRegEx.test(text)) {
            return 'css';
        }
        return 'text';
    }
    
    function moveCellEditor(direction) {
        var selectedCellRange, col, row;
        if (direction) {
            selectedCellRange = getSelectedCellRange();
            col = selectedCellRange.startCol;
            row = selectedCellRange.startRow;
            switch (direction) {
                case KEY_CODES.ARROW_LEFT:
                    col--;
                    break;
                case KEY_CODES.ARROW_RIGHT:
                    col++;
                    break;
                case KEY_CODES.ARROW_UP:
                    row--;
                    break;
                case KEY_CODES.ARROW_DOWN:
                    row++;
                    break;
            }
            openCellEditorAt(row, col);
        }
    }
    
    function openCellEditorAt(row, col) {
        editCellOK(true);
        if (row > 1 && row < _numRows && col > (_colOffset ? _colOffset - 1 : 0) && col < _numColumns) {
            destroyEditor();
            _hot.selectCell(row, col);
            _hot.getActiveEditor().beginEditing();
        }
        _editCellValue.focus();
    }

    function editCell() {
        var cellInfo, value, dataType, isUrl, isCached, isDefault, cellValue, selectedCell, columnDefault, result;
        var appId = _nce.getSelectedTabAppId();
        var modifiable = checkCubeUpdatePermissions(null, true);
        
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.GET_CELL_NO_EXECUTE, [appId, _cubeName, _cellId]);
        if (!result.status) {
            _nce.showNote('Unable to fetch the cell contents: ' + result.data);
            return;
        }

        cellInfo = result.data;
        value = null;
        dataType = null;
        isUrl = false;
        isCached = false;
        isDefault = false;
        if (cellInfo.value !== null || cellInfo.dataType !== null || cellInfo.isUrl || cellInfo.isCached) {
            value = cellInfo.value;
            dataType = cellInfo.dataType;
            isUrl = cellInfo.isUrl;
            isCached = cellInfo.isCached;
        } else { // use cube defaults if exist
            isDefault = true;
            selectedCell = getSelectedCellRange();
            columnDefault = getCalculatedColumnDefault(selectedCell.startRow, selectedCell.startCol);
            if (columnDefault !== null) {
                value = columnDefault.value;
                dataType = columnDefault.type;
            } else {
                isUrl = _data.defaultCellValueUrl !== undefined;
                value = isUrl ? _data.defaultCellValueUrl : _data.defaultCellValue;
                dataType = _data.defaultCellValueType;
                isCached = _data.defaultCellValueCache;
            }
        }
        // Set the cell value (String)
        cellValue = value !== null && value !== undefined ? value : '';
        _editCellValue.val(cellValue);
        _isCellDirty = false;
        if (dataType === null || !dataType) {
            dataType = 'string';
        }

        // Set the correct entry in the drop-down
        if (isUrl) {
            _urlDropdown.val(dataType);
        } else {
            _valueDropdown.val(dataType);
        }

        // Choose the correct data type drop-down (show/hide the other)
        _urlDropdown.toggle(isUrl);
        _valueDropdown.toggle(!isUrl);

        // Set the URL check box
        _editCellRadioURL.find('input').prop('checked', isUrl);

        // Set the Cache check box state
        _editCellCache.find('input').prop('checked', isCached);

        enabledDisableCheckBoxes(); // reset for form
        _editCellModal.find('input,textarea,select').attr('disabled', !modifiable);
        _editCellCancel.toggle(modifiable);
        _editCellClear.toggle(modifiable);
        if (modifiable) {
            _editCellModal.one('shown.bs.modal', function () {
                if (_bufferText.trim() !== '') {
                    _editCellValue.val(isDefault ? _bufferText : (cellValue + _bufferText));
                    _isCellDirty = true;
                } else if (isDefault) {
                    _editCellValue.select();
                }
            });
        }
        editCellAffectsCoordBar(true);
        _editCellModal.modal('show');
    }

    function editCellClear() {
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_CELL, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), _cellId, null]);
        if (!result.status) {
            _cellId = null;
            _nce.showNote('Unable to clear cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        delete _data.cells[_tableCellId];
        markCubeModified();
        editCellClose();
    }

    function editCellClose() {
        _cellId = null;
        editCellAffectsCoordBar(false);
        _editCellModal.modal('hide');
        destroyEditor();
    }

    function editCellOK(keepModalOpen) {
        var cellInfo, result, isUrl, appId;
        if (!_isCellDirty) {
            if (!keepModalOpen) {
                editCellClose();
            }
            return;
        }
        appId = _nce.getSelectedTabAppId();
        if (!checkCubeUpdatePermissions(null, true)) {
            if (!keepModalOpen) {
                editCellClose();
            }
            return;
        }

        isUrl = _editCellRadioURL.find('input')[0].checked;
        cellInfo = {
            '@type': GROOVY_CLASS.CELL_INFO,
            isUrl: isUrl,
            value: _editCellValue.val(),
            dataType: isUrl ? _urlDropdown.val() : _valueDropdown.val(),
            isCached: _editCellCache.find('input')[0].checked
        };

        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_CELL, [appId, _cubeName, _cellId, cellInfo]);
        if (!result.status) {
            _nce.showNote('Unable to update cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        _data.cells[_tableCellId] = {value:cellInfo.value};
        markCubeModified();
        if (!keepModalOpen) {
            editCellClose();
        }
        reload();
    }

    function editCellAffectsCoordBar(editState) {
        _utilContainerBar.css({'z-index': editState ? 1051 : '' }); // position above bootstrap modal backdrop
    }

    function onEditCellModalShown() {
        $('#editCellValue').focus();
    }

    function onEditCellRadioUrlChange() {
        var isUrl = _editCellRadioURL.find('input')[0].checked;
        _urlDropdown.toggle(isUrl);
        _valueDropdown.toggle(!isUrl);
        _isCellDirty = true;
    }

    function enabledDisableCheckBoxes() {
        function toggleCheckDisable(el, enabledList, dataType) {
            var disabled = enabledList.indexOf(dataType) === -1;
            el.toggleClass('disabled', disabled).find('input').prop('disabled', disabled);
        }
        var selDataType = _editCellRadioURL.find('input')[0].checked ? _urlDropdown.val() : _valueDropdown.val();
        toggleCheckDisable(_editCellRadioURL, URL_ENABLED_LIST, selDataType);
        toggleCheckDisable(_editCellCache, CACHE_ENABLED_LIST, selDataType);
    }

    // =============================================== End Cell Editing ================================================

    // ============================================== Begin Filtering ==================================================

    function getAxisColumnValues(axis) {
        var i, len;
        var columnValues = [];
        var columns = axis.columns;
        var columnKeys = Object.keys(columns);
        for (i = 0, len = columnKeys.length; i < len; i++) {
            columnValues.push(columns[columnKeys[i]].value);
        }
        return columnValues;
    }

    function filterOpen() {
        function generateFilterColumnData(columnNames, savedData) {
            var i, len, columnName;
            var columnFilterData = [];
            var savedColumnsToSearch = savedData.columnsToSearch || [];
            var savedColumnsToReturn = savedData.columnsToReturn || [];
            for (i = 0, len = columnNames.length; i < len; i++) {
                columnName = columnNames[i];
                columnFilterData.push({
                    columnName: columnName,
                    columnsToSearch: savedColumnsToSearch.indexOf(columnName) > -1,
                    columnsToReturn: savedColumnsToReturn.indexOf(columnName) > -1
                });
            }
            return columnFilterData;
        }

        var savedData = getSavedFilterInfo();
        var axis = _axes[_colOffset];
        var columnSelectList = getAxisColumnValues(axis);
        var opts = {
            axisType: axis.valueType,
            columnSelectList: columnSelectList,
            filterText: savedData.text,
            mapReduceColumns: generateFilterColumnData(columnSelectList, savedData),
            afterSave: onSaveFilterData,
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.filterData(opts));
    }

    function onSaveFilterData(data) {
        var i, len, columnName;
        var filterText = data.filterText;
        var columnsToSearch = [];
        var columnsToReturn = [];
        if (filterText.trim() === 'Map input ->') {
            saveFilterInfo();
        } else {
            for (i = 0, len = data.columnName.length; i < len; i++) {
                columnName = data.columnName[i];
                if (data.columnsToSearch[i]) {
                    columnsToSearch.push(columnName);
                }
                if (data.columnsToReturn[i]) {
                    columnsToReturn.push(columnName);
                }
            }
            saveFilterInfo({
                text: filterText,
                columnsToSearch: columnsToSearch,
                columnsToReturn: columnsToReturn
            });
        }
        reload();
    }

    function callMapReduce() {
        var result;
        var savedData = getSavedFilterInfo();
        var whereText = '{' + savedData.text + '}';
        var colAxisName = _axes[_colOffset].name;
        var isValuesMode = _viewMode === VIEW_VALUES;
        var options = {};
        options[MAP_REDUCE_OPTIONS.INPUT] = isValuesMode ? getSavedScope() : {};
        options[MAP_REDUCE_OPTIONS.SHOULD_EXECUTE] = isValuesMode;
        options[MAP_REDUCE_OPTIONS.COLUMNS_TO_SEARCH] = savedData.columnsToSearch;
        options[MAP_REDUCE_OPTIONS.COLUMNS_TO_RETURN] = savedData.columnsToReturn;
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.MAP_REDUCE, [_nce.getSelectedTabAppId(), _cubeName, colAxisName, whereText, options], {noResolveRefs:false});
        if (result.status) {
            return result.data;
        }
        _nce.showNote('Error calling map reduce:<hr class="hr-small"/>' + result.data);
    }

    // =============================================== End Filtering ===================================================

    // ============================================== Column Editing ===================================================

    function focusModal() {
        var el = $(document.activeElement);
        if (el.is('input')) {
            el.blur();
            el.closest('.modal').focus();
        }
        el = null;
    }

    function selectNextInput(relativeIdx) {
        var newInput;
        var el = document.activeElement;
        var inputs = $(el).closest('.modal').find('input[type="text"]');
        var curIdx = inputs.index(el);
        var newIdx = curIdx + relativeIdx;
        if ((relativeIdx > 0 && newIdx < inputs.length) || (relativeIdx < 0 && newIdx >= 0)) {
            newInput = $(inputs[newIdx]);
            newInput.focusin();
            newInput.select();
        }
    }

    function addColumnEditListeners() {
        _editColumnModal.on('keydown', function(e) {
            var el, inputs, idx;
            var keyCode = e.keyCode;
            var isTextInputTarget = $(e.target).is('input[type="text"]');
            if ((e.metaKey || e.ctrlKey) && !isTextInputTarget) {
                if (keyCode === KEY_CODES.V) {
                    editColPaste();
                } else if (keyCode === KEY_CODES.C) {
                    editColCopy();
                }
                return;
            }
            if (keyCode === KEY_CODES.ENTER) {
                el = document.activeElement;
                inputs = $(el).closest('.modal').find('input[type="text"]');
                idx = inputs.index(el);
                $(el).blur();
                editColAdd([null], idx);
                return;
            }
            if (isTextInputTarget) {
                if (keyCode === KEY_CODES.ARROW_UP) {
                    selectNextInput(-1);
                } else if (keyCode === KEY_CODES.ARROW_DOWN) {
                    selectNextInput(1);
                }
                return;
            }
            if (keyCode === KEY_CODES.DELETE) {
                focusModal();
                editColDelete();
            } else if (keyCode === KEY_CODES.ARROW_UP) {
                focusModal();
                editColUp();
            } else if (keyCode === KEY_CODES.ARROW_DOWN) {
                focusModal();
                editColDown();
            }
        });

        $('#editColAdd').on('click', function() {
            editColAdd([null], null);
        });
        $('#editColDelete').on('click', editColDelete);
        $('#editColUp').on('click', editColUp);
        $('#editColDown').on('click', editColDown);
        $('#editColumnsCancel').on('click', editColCancel);
        $('#editColumnsSave').on('click', editColSave);
    }

    function editColPaste() {
        _editColClipboard.val('');
        _editColClipboard.focus();

        setTimeout(function() {
            var content, vals;
            content = _editColClipboard.val();
            if (content === null || content === '') {
                return;
            }
            vals = content.split(/\t|\n/);
            editColAdd(vals);
        },100);
    }

    function editColCopy() {
        var clipData, i, len, inputs, checkedInputs;
        inputs = $('.editColCheckBox');
        checkedInputs = inputs.filter(':checked');
        if (checkedInputs.length) {
            inputs = checkedInputs;
        }
        clipData = '';
        for (i = 0, len = inputs.length; i < len; i++ ) {
            clipData += $(inputs[i]).parent().parent().find('input[type="text"]').val();
            clipData += '\n';
        }

        _editColClipboard.val(clipData);
        _editColClipboard.focusin();
        _editColClipboard.select();
    }

    function editColumns(axisName) {
        var axis;
        if (!checkCubeUpdatePermissions(axisName)) {
            _nce.showNote('Columns cannot be edited.');
            return false;
        }

        axis = getCubeAxis(axisName);
        if (!axis) {
            return;
        }
        editColumnInstructions(axis);
        loadColumns(axis);
        $('#editColUp, #editColDown').toggle(axis.preferredOrder === 1);
        $('#editColumnsLabel')[0].innerHTML = 'Edit ' + axisName;
        addHotBeforeKeyDown();
        _editColumnModal.modal();
    }

    function sortColumns(axis) {
        if (axis.preferredOrder === 1) {
            axis.columns.sort(function(a, b) {
                return a.displayOrder - b.displayOrder;
            });
        }
    }

    function getUniqueId() {
        return _colIds--;
    }

    function editColAdd(addedColVals, addedAtIndex) {
        function getAddLocation(input) {
            for (i = 0, len = input.length; i < len; i++) {
                if (input[i].checked) {
                    return i;
                }
            }
            return -1;
        }
        var newCol, i, len, addedColVal, c, cLen;
        var html = '';
        var axis = _columnList.prop('model');
        var input = $('.editColCheckBox');
        var loc = notNullOrUndefined(addedAtIndex) ? addedAtIndex : getAddLocation(input);

        for (c = 0, cLen = addedColVals.length; c < cLen; c++){
            addedColVal = addedColVals[c];
            if (addedColVal === '') {
                continue; // blank row from excel copy
            }
            newCol = {
                '@type': 'com.cedarsoftware.ncube.Column',
                'value': addedColVal === undefined || addedColVal === null ? 'newValue' : addedColVal,
                'id': getUniqueId()
            };

            if (loc === -1) {
                axis.columns.push(newCol);
            } else {
                axis.columns.splice(loc + 1, 0, newCol);
            }

            html += buildColumnHtml(newCol, axis.type.name === 'RULE');
        }

        if (input.length) {
            _columnList.find('div.row').eq(loc).after(html);
        } else {
            _columnList.append(html);
        }

        // Select newly added column name, so user can just type over it.
        input = _columnList.find('.form-control');
        loc = loc === -1 ? (input.length - 1) : (loc + 1);
        input[loc].select();
        _editColumnModal.find('.modal-body').scrollTop($(input[loc]).offset().top);
    }

    function editColDelete() {
        var i, len;
        var axis = _columnList.prop('model');
        var cols = axis.columns;
        var colsToDelete = [];
        var checkBoxes = $('.editColCheckBox');
        for (i = checkBoxes.length - 1; i >= 0; i--) {
            if (checkBoxes[i].checked) {
                cols.splice(i, 1);
                $(checkBoxes[i]).parent().parent().parent().remove();
            }
        }
    }

    function editColUp() {
        var i, len, row;
        var axis = _columnList.prop('model');
        var cols = axis.columns;
        var input = $('.editColCheckBox');

        if (cols && cols.length && input[0].checked) {
            // Top one checked, cannot move any items up
            return;
        }

        for (i = 1, len = input.length; i < len; i++) {
            if (input[i].checked) {
                cols[i] = cols.splice(i - 1, 1, cols[i])[0];
                row = $(input[i]).parent().parent().parent();
                row.insertBefore(row.siblings().eq(i - 1));
            }
        }
    }

    function editColDown() {
        var i, row;
        var axis = _columnList.prop('model');
        var cols = axis.columns;
        var input = $('.editColCheckBox');

        if (cols && cols.length && input[cols.length - 1].checked) {
            // Bottom one checked, cannot move any items down
            return;
        }

        for (i = input.length - 2; i >= 0; i--) {
            if (input[i].checked) {
                cols[i] = cols.splice(i + 1, 1, cols[i])[0];
                row = $(input[i]).parent().parent().parent();
                row.insertAfter(row.siblings().eq(i));
            }
        }
    }

    function editColCancel() {
        _editColumnModal.modal('hide');
        removeHotBeforeKeyDown();
        destroyEditor();
    }

    function editColSave() {
        var result, lowerAxisName, input, i, len, col;
        var condInputList = _columnList.find('input[data-type=cond]');
        var nameInputList = _columnList.find('input[data-type=name]');
        var axis = _columnList.prop('model');
        
        for (i = 0, len = condInputList.length; i < len; i++) {
            col = axis.columns[i];
            col.displayOrder = i;
            col.value = condInputList[i].value.replace(/\\n/g, '\n');
            input = nameInputList[i];
            if (input) {
                if (!col.hasOwnProperty('metaProps')) {
                    col.metaProps = {};
                }
                col.metaProps.name = input.value;
            }
        }
        
        axis.defaultCol = null;
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_AXIS_COLUMNS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), axis.name, axis.columns]);

        if (!result.status) {
            _nce.showNote("Unable to update columns for axis '" + axis.name + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        lowerAxisName = axis.name.toLowerCase();
        if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
            _nce.showNote('Hidden column selections for axis ' + axis.name + ' removed.', 'Note', TWO_SECOND_TIMEOUT);
            delete _hiddenColumns[lowerAxisName];
            storeHiddenColumns();
        }
        deleteSavedColumnWidths();
        markCubeModified();
        editColCancel();
        reload();
    }

    function editColumnInstructions(axis) {
        var insTitle, inst;
        switch (axis.type.name) {
            case 'DISCRETE':
                insTitle = 'Instructions - Discrete Column';
                inst = "<i>Discrete</i> column has a single value per column. Values are matched with '='. \
                    Strings are matched case-sensitively.  Look ups are indexed and run \
                    in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(log n)</a>. \
                    <ul><li>Examples: \
                    <ul> \
                    <li>Enter string values as is, no quotes: <code>OH</code></li> \
                    <li>Valid number: <code>42</code></li> \
                    <li>Valid date: <code>2015/02/14</code> (or <code>14 Feb 2015</code>, <code>Feb 14, 2015</code>, <code>February 14th, 2015</code>, <code>2015-02-14</code>)</li> \
                    <li>Do not use mm/dd/yyyy or dd/mm/yyyy. \
                    </li></ul></li></ul>";
                break;
            case 'RANGE':
                insTitle = 'Instructions - Range Column';
                inst = "A <i>Range</i> column contains a <i>low</i> and <i>high</i> value.  It matches when \
                    <i>value</i> is within the range: value >= <i>low</i> and value < <i>high</i>. Look ups are indexed \
                    and run in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(log n)</a>.\
                    <ul><li>Enter low value, high value. Treated [inclusive, exclusive).</li> \
                    <li>Examples: \
                    <ul> \
                    <li><i>Number range</i>: <code>25, 75</code> (meaning x >= 25 AND x < 75)</li> \
                    <li><i>Number range</i>: <code>[100, 1000]</code> (brackets optional)</li> \
                    <li><i>Date range</i>: <code>2015/01/01, 2017-01-01</code> (date >= 2015-01-01 AND date < 2017-01-01) \
                    </li></ul></li></ul>";
                break;
            case 'SET':
                insTitle = 'Instructions - Set Column';
                inst = "A <i>Set</i> column can contain unlimited discrete values and ranges. Discrete values \
                    match with '=' and ranges match when value is within the range [inclusive, exclusive).  Overlapping\
                    ranges and values are <b>not</b> allowed.  If you need that capability, use a <i>Rule</i> axis.\
                    Look ups are indexed and run in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(log n)</a>.\
                    <ul><li>Examples: \
                    <ul> \
                    <li><i>Numbers</i>: <code>6, 10, [20, 30], 45</code></li> \
                    <li><i>Strings</i>: <code>\"TX\", \"OH\", \"GA\"</code></li> \
                    <li><i>Dates</i>: <code>\"2016-01-01\"</code></li> \
                    <li><i>Date range</i>: <code>[\"2010/01/01\", \"2012/12/31\"]</code></li> \
                    <li><i>Date ranges</i>: <code>[\"2015-01-01\", \"2016-12-31\"], [\"2019/01/01\", \"2020/12/31\"]</code> \
                    </li></ul></li></ul>";
                break;
            case 'NEAREST':
                insTitle = 'Instructions - Nearest Column';
                inst = "A <i>Nearest</i> column has a single value per column.  The <i>closest</i> column on the \
                    axis to the passed in value is matched.  Strings are compared similar to spell-check \
                    (See <a href=\"http://en.wikipedia.org/wiki/Levenshtein_distance\" target=\"_blank\">Levenshtein</a> algorithm). \
                    Lat/Lon's column values are compared using earth curvature in distance calculation \
                    (See <a href=\"http://en.wikipedia.org/wiki/Haversine_formula\" target=\"_blank\">Haversine</a> forumla). \
                    Numbers compared using abs(column - value).  Look ups scan all columns and run in \
                    <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(n)</a>. \
                    <ul><li>Examples: \
                    <ul> \
                    <li>With columns <code>Alpha, Bravo, Charlie</code>, <i>value</i> <code>alfa</code> will match column <code>Alpha</code>.  It has the closest 'edit' distance.</li> \
                    <li>With columns <code>1, 10, 100, 1000</code>, <i>value</i> <code>400</code> will match column <code>100</code>. (Distance of 300 is smallest).</li> \
                    <li>Dates are entered in the same formats in Discrete column instructions (many formats supported).</li> \
                    <li>Do not use mm/dd/yyyy or dd/mm/yyyy for dates.</li></ul></li></ul>";
                break;
            case 'RULE':
                insTitle = 'Instructions - Rule Column';
                inst = "A <i>Rule condition</i> column is entered as a rule name and condition.  All rule conditions \
                    that evaluate to <i>true</i> have their associated statement cells executed.  By default all <i>true</i> \
                    conditions will fire. (See our definition of <a href=\"http://groovy.codehaus.org/Groovy+Truth\" target=\"_blank\">true</a>). \
                    The Rule axis can be set so that only the first <i>true</i> condition fires.  When running a rule-cube, \
                    if the name of a rule is bound to the rule axis, execution will start on the named rule.  A rule axis can \
                    have a <i>Default</i> column. Just like all other axis types, at least one condition on a rule axis must fire, \
                    otherwise a CoordinateNotFound exception will be thrown.  Look ups scan all columns (except when fire once is indicated) \
                    and run in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(n)</a>. \
                    <ul><li>Notes: \
                    <ul> \
                    <li>Enter the [optional] rule name in the top line (no quotes).</li> \
                    <li>Enter <i>condition</i> in <a href=\"http://groovy.codehaus.org/\" target=\"_blank\">Groovy</a> on the second line.</li> \
                    <li>The <i>input</i> and <i>output</i> Maps and <i>ncube</i> are available in the condition and statements (cells).</li> \
                    <li><i>Example condition</i>: <code>input.state == 'OH'</code></li> \
                    </ul></li></ul>";
                break;
            default:
                insTitle = 'Instructions';
                inst = 'Unknown axis type';
                break;
        }

        inst += '<br>CTRL+V pastes in list of columns<br>CTRL+C copies all or selected column text';
        _editColInstTitle[0].textContent = insTitle;
        _editColInstructions[0].innerHTML = inst;
    }

    function loadColumns(axis) {
        var axisList, i, len, column, html, isAxisRuleType;
        axisList = axis.columns;
        _columnList.empty();
        _columnList.prop('model', axis);
        html = '';
        isAxisRuleType = axis.type.name === 'RULE';

        for (i = 0, len = axisList.length; i < len; i++) {
            column = axisList[i];
            if (!column.displayOrder || column.displayOrder < DEFAULT_COLUMN_DISPLAY_ORDER) {   // Don't add default column
                html += buildColumnHtml(column, isAxisRuleType);
            }
        }
        _columnList.append(html);
    }
    
    function buildColumnHtml(column, isAxisRuleType) {
        var html, prefix, val;
        prefix = '';
        val = column.value;
        if (column.isUrl) {
            prefix += 'url|';
        }
        if (column.isCached) {
            prefix += 'cache|';
        }
        if (val !== undefined && val !== null) {
            val = val.replace(/"/g, '&quot;').replace(/\n/g, '\\n');
        }

        html = '<div class="row"><div class="input-group">';
        html += '<span class="input-group-addon"><input class="editColCheckBox" type="checkbox"/></span>';
        if (isAxisRuleType) {
            html += '<input class="form-control" type="text" data-type="name" value="' + (column.metaProps ? column.metaProps.name : 'Condition') + '" />';
        }
        html += '<input class="form-control" type="text" data-type="cond" value="' + prefix + val + '" />';
        html += '</div></div>';

        return html;
    }

    // =============================================== End Column Editing ==============================================

    // =============================================== Begin Column Hiding ==========================================

    function getCubeAxis(axisName) {
        var axis;
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.GET_AXIS, [_nce.getSelectedTabAppId(), _cubeName, axisName]);
        if (result.status) {
            axis = result.data;
            if (!axis.columns) {
                axis.columns = [];
            }
            if (axis.defaultCol) {
                // Remove actual Default Column object (not needed, we can infer it from Axis.defaultCol field being not null)
                axis.columns.splice(axis.columns.length - 1, 1);
            }
            sortColumns(axis);
            return axis;
        } else {
            _nce.showNote("Could not retrieve axis: " + axisName + " for n-cube '" + _cubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function hideColumns(axisName) {
        var i, len, column, opts, ruleLabel, labelText, label, axisColumns, axisNames, lowerAxisName, axisHiddenData, columnData;
        var axis = getCubeAxis(axisName);
        if (!axis) {
            return;
        }
        axisColumns = axis.columns;

        columnData = [];
        lowerAxisName = axisName.toLowerCase();
        axisHiddenData = _hiddenColumns[lowerAxisName];

        for (i = 0, len = axisColumns.length; i < len; i++) {
            column = axisColumns[i];
            ruleLabel = '';
            if (column.hasOwnProperty('metaProps') && column.metaProps.hasOwnProperty('name')) {
                ruleLabel = column.metaProps.name + ': ';
            }
            labelText = column.value === null ? DEFAULT_TEXT : column.value;
            label = ruleLabel + labelText;
            columnData.push({
                isShown: !axisHiddenData || !axisHiddenData[column.id],
                columnName: label,
                columnId: column.id
            });
        }

        if (axis.defaultCol !== null) {
            columnData.push({
                isShown: !axisHiddenData || !axisHiddenData[axis.defaultCol.id],
                columnName: DEFAULT_TEXT,
                columnId: axis.defaultCol.id
            })
        }

        axisNames = [];
        for (i = 0, len = _axes.length; i < len; i++) {
            axisNames.push(_axes[i].name);
        }

        opts = {
            axisName: axisName,
            axisNames: axisNames,
            columnData: columnData,
            onAxisChange: hideColumns,
            afterSave: hideColSave,
            onOpen: function() {
                if (_hot && !_hot.hasHook('beforeKeyDown')) {
                    addHotBeforeKeyDown();
                }
            },
            onClose: function() {
                removeHotBeforeKeyDown();
                storeHiddenColumns();
                destroyEditor();
                reload();
            }
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.hideColumns(opts));
    }

    function hideColSave(data) {
        var i, mapSize;
        var len = data.columnId.length;
        var lowerAxisName = data.axisName.toLowerCase();
        var columnIdMap = {};
        for (i = 0; i < len; i++) {
            if (!data.isShown[i]) {
                columnIdMap[data.columnId[i]] = true;
            }
        }

        mapSize = Object.keys(columnIdMap).length;
        if (mapSize === len) {
            _nce.showNote('Please select at least one column to show.', 'Note', TWO_SECOND_TIMEOUT);
            return;
        }
        if (mapSize) {
            _hiddenColumns[lowerAxisName] = columnIdMap;
        } else {
            delete _hiddenColumns[lowerAxisName];
        }
    }

    function hasFilteredData() {
        return _columnIdCombinationsToShow.length && getSavedFilterText();
    }

    function getSavedFilterText() {
        return getSavedFilterInfo().text || '';
    }

    function getSavedFilterInfo() {
        return parseFromLocalStorage(FILTERS) || {text:'', columnsToSearch:[], columnsToReturn:[]};
    }

    function saveFilterInfo(filterInfo) {
        saveOrDeleteValue(filterInfo, getStorageKey(_nce, FILTERS));
    }

    function storeHiddenColumns() {
        if (_data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS)) {
            overrideDefaultViewHiddenColumns(true);
        }
        saveOrDeleteValue(_hiddenColumns, getStorageKey(_nce, HIDDEN_COLUMNS));
    }

    function overrideDefaultViewHiddenColumns(shouldOverride) {
        saveOrDeleteValue(shouldOverride, getStorageKey(_nce, HIDDEN_COLUMNS_OVERRIDE));
    }

    // =============================================== End Column Hiding ===============================================

    // =============================================== Begin Axis Ordering =============================================

    function moveAxes() {
        var i;
        var html = '';

        _moveAxesLabel[0].innerHTML = _cubeName + ' - Reorder Axes';
        _moveAxesInstructions[0].innerHTML = 'Drag column names to rearrange the order in which they appear.'
            + ' The last axis will appear horizontally in the table.';

        for (i = 0; i <= _colOffset; i++) {
            html += '<li class="ui-state-default">' + _axes[i].name + '</li>';
        }
        _moveAxesList.empty();
        _moveAxesList.append(html);

        _moveAxesModal.modal();
    }

    function addMoveAxesListeners() {
        $('#moveAxesCancel').on('click', moveAxesClose);
        $('#moveAxesOk').on('click', moveAxesOk);
        _moveAxesList.sortable({
            placeholder: "ui-state-highlight"
        });
        _moveAxesList.disableSelection();
    }

    function moveAxesClose() {
        _moveAxesModal.modal('hide');
    }

    function moveAxesOk() {
        var i, len;
        var order = [];
        var lis = _moveAxesList.find('li');
        for (i = 0, len = lis.length; i < len; i++) {
            order.push(lis[i].textContent.toLowerCase());
        }

        storeAxisOrder(order);
        deleteSavedColumnWidths();
        moveAxesClose();
        destroyEditor();
        reload();
    }

    function moveAxis(fromIndex, toIndex) {
        _axes.splice(toIndex, 0, _axes.splice(fromIndex, 1)[0]);
        storeAxisOrder();
        deleteSavedColumnWidths();
        destroyEditor();
        reload();
    }

    function findIndexOfAxisName(axisName) {
        var i, len;
        var lower = axisName.toLowerCase();
        for (i = 0, len = _axes.length; i < len; i++) {
            if (_axes[i].name.toLowerCase() === lower) {
                return i;
            }
        }
        return -1;
    }

    function storeAxisOrder(order) {
        var i, len;
        if (!order) {
            order = [];
            for (i = 0, len = _axes.length; i < len; i++) {
                order.push(_axes[i].name.toLowerCase());
            }
        }
        localStorage[getStorageKey(_nce, AXIS_ORDER)] = JSON.stringify(order);
    }

    // =============================================== End Axis Ordering ===============================================

    // =============================================== Begin Axis Editing ==============================================

    function addAxis() {
        var opts;
        if (!checkCubeUpdatePermissions('*')) {
            _nce.showNote('Axis cannot be added.');
            return;
        }

        opts = {
            appSelectList: _nce.loadAppNames(),
            populateVersionFunc: _nce.getVersions,
            populateBranchFunc: _nce.getBranchNamesByAppId,
            populateCubeFunc: _nce.getCubeListForApp,
            populateAxisFunc: _nce.getAxesFromCube,
            afterSave: addAxisOk,
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.addAxis(opts));
    }
    
    function addAxisOk(data) {
        var params, refAppId, transformAppId, result, axisOrderMetaProp, splitVer, axisOpts;
        var axisName = data.name;
        var appId = _nce.getSelectedTabAppId();
        if (!checkCubeUpdatePermissions(axisName)) {
            _nce.showNote('Cannot add axis ' + axisName);
            return;
        }

        if (data.isRef) {
            splitVer = data.refVer.split('-');
            refAppId = appIdFrom(data.refApp, splitVer[0], splitVer[1], data.refBranch);
            if (data.hasTransform) {
                splitVer = data.transVer.split('-');
                transformAppId = appIdFrom(data.transApp, splitVer[0], splitVer[1], data.transBranch);
            }
            axisOpts = { hasDefault: data.default || false };
            params = [refAppId, data.refCube, data.refAxis, transformAppId, data.transCube, axisOpts];
        } else {
            axisOpts = {
                hasDefault: data.default || false,
                isSorted: data.sorted || false,
                fireAll: data.fireAll || false
            };
            params = [data.type, data.valueType, axisOpts];
        }

        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.ADD_AXIS, [appId, _cubeName, axisName].concat(params));
        if (result.status) {
            if (hasCustomAxisOrder()) {
                _axes.splice(_colOffset, 0, {name:axisName});
                storeAxisOrder();
            }
            axisOrderMetaProp = getAxisOrderMetaProp();
            if (axisOrderMetaProp) {
                axisOrderMetaProp.unshift(axisName);
                updateCubeMetaProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER, axisOrderMetaProp);
            }
            deleteSavedColumnWidths();
            saveFilterInfo();
            markCubeModified();
            _nce.loadCube();
            if (!data.isRef) {
                editColumns(axisName);
            }
        } else {
            _nce.showNote("Unable to add axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function deleteAxis(axisName) {
        var opts;
        if (!checkCubeUpdatePermissions(axisName)) {
            _nce.showNote('Axis cannot be deleted.');
            return;
        }

        opts = {
            axisName: axisName,
            afterSave: deleteAxisOk,
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.deleteAxis(opts));
    }

    function deleteAxisOk(data) {
        var lowerAxisName, order;
        var axisName = data.name;
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.DELETE_AXIS, [_nce.getSelectedTabAppId(), _nce.getSelectedCubeName(), axisName]);
        if (result.status) {
            lowerAxisName = axisName.toLowerCase();
            callUpdateMetaPropertiesForDefaultCubeView(true);
            if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
                _nce.showNote('Hidden column selections for axis ' + axisName + ' removed.', 'Note', TWO_SECOND_TIMEOUT);
                delete _hiddenColumns[lowerAxisName];
                storeHiddenColumns();
            }
            if (hasCustomAxisOrder()) {
                order = JSON.parse(localStorage[getStorageKey(_nce, AXIS_ORDER)]);
                _axes.splice(order.indexOf(lowerAxisName), 1);
                storeAxisOrder();
            }
            saveFilterInfo();
            deleteSavedColumnWidths();
            markCubeModified();
            removeHotBeforeKeyDown();
            destroyEditor();
            _nce.loadCube();
        } else {
            _nce.showNote("Unable to delete axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function updateAxis(axisName) {
        var opts;
        var appId = _nce.getSelectedTabAppId();
        var result = _nce.call(CONTROLLER + CONTROLLER_METHOD.GET_AXIS, [appId, _cubeName, axisName]);
        if (!result.status) {
            _nce.showNote("Could not retrieve axis: " + axisName + " for n-cube '" + _nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }

        opts = {
            axis: result.data,
            readonly: !checkCubeUpdatePermissions(axisName),
            afterSave: function(data) { updateAxisOk(axisName, data); },
            onOpen: addHotBeforeKeyDown,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.updateAxis(opts));
    }

    function updateAxisOk(oldAxisName, data) {
        var result, oldName, newName, order;
        result = _nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_AXIS, [_nce.getSelectedTabAppId(), _cubeName, oldAxisName, data.name, data.default || false, data.sorted || false, data.fireAll || false]);
        if (result.status) {
            oldName = oldAxisName.toLowerCase();
            newName = data.name.toLowerCase();
            if (oldName !== newName) {
                callUpdateMetaPropertiesForDefaultCubeView(true);
                _hiddenColumns[newName] = _hiddenColumns[oldName];
                delete _hiddenColumns[oldName];
                storeHiddenColumns();

                if (hasCustomAxisOrder()) {
                    order = JSON.parse(localStorage[getStorageKey(_nce, AXIS_ORDER)]);
                    _axes[order.indexOf(oldName)].name = newName;
                    storeAxisOrder();
                }
            }
            markCubeModified();
            _nce.loadCube();
        } else {
            _nce.showNote("Unable to update axis '" + oldAxisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    // =============================================== End Axis Editing ================================================


    function render() {
        if (!_hot) {
            return;
        }
        _hot.render();
    }

    function reload(keepTable) {
        var selection;
        if (_hot) {
            selection = getSelectedCellRange();
            load(keepTable);
            if (!_hot) { // reload could not construct table
                return;
            }

            if (selection) {
                _hot.selectCell(selection.startRow, selection.startCol, selection.endRow, selection.endCol, true);
            } else {
                selectSavedOrDefaultCell();
            }
        } else { // no table exists
            load();
        }
    }

    function selectSavedOrDefaultCell() {
        var pos, row, col, left, top, wth;
        if (!_hot) {
            return;
        }
        
        pos = _nce.getViewPosition();
        if (typeof pos === OBJECT) {
            row = pos.row;
            col = pos.col;
            left = pos.left;
            top = pos.top;
        } else {
            row = 2;
            col = _axes.length === 1 ? 1 : _colOffset;
        }
        
        _hot.selectCell(row, col);
        wth = $('.wtHolder')[0];
        wth.scrollLeft = left || 0;
        wth.scrollTop = top || 0;
        _hot.render();
    }

    function handleCubeSelected() {
        load();
    }

    // Let parent (main frame) know that the child window has loaded.
    // The loading of all of the Javascript (deeply) is continuous on the main thread.
    // Therefore, the setTimeout(, 1) ensures that the main window (parent frame)
    // is called after all Javascript has been loaded.
    if (window.parent.frameLoaded) {
        setTimeout(function () {
            window.parent.frameLoaded(document);
        }, 1);
    }

    // API
    return {
        init: init,
        handleCubeSelected: handleCubeSelected,
        load: load,
        reload: reload,
        render: render
    };

})(jQuery);

function tabActivated(info) {
    NCubeEditor2.init(info);
    NCubeEditor2.load();
}

function cubeSelected() {
    NCubeEditor2.handleCubeSelected();
}

function onNoteEvent(e, element){}

function closeChildMenu() {
    $('.open').removeClass('open');
    $('div.dropdown-backdrop').hide();
}