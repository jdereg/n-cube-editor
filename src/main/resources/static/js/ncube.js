var NCubeEditor2 = (function ($) {

    var headerAxisNames = ['trait','traits','businessDivisionCode','bu','month','months','col','column','cols','columns', 'attribute', 'attributes'];
    var nce = null;
    var hot = null;
    var CellEditor;
    var ColumnEditor;
    var CubeEditor;
    var numColumns = 0;
    var numRows = 0;
    var cubeName = null;
    var axes = null;
    var _axisIdsInOrder = null;
    var colOffset = null;
    var data = null;
    var prefixes = null;
    var cubeMap = null;
    var cubeMapRegex = null;
    var axisColumnMap = null;
    var _expressionLinks = {};
    var _textDims = {};
    var _columnWidths = null;
    var _rowHeights = null;
    var _cellId = null;
    var _tableCellId = null;
    var _columnList = null;
    var _hideColumnsList = null;
    var _hideColumnsAxisSelect = null;
    var _hideColumnsModal = null;
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
    var _filterModal = null;
    var _filters = null;
    var _filterTable = null;
    var _columnIdCombinationsToShow = null;
    var _searchText = null;
    var _hotContainer = null;
    var _setUpHideModal = null;
    var _setUpHideList = null;
    var _moveAxesModal = null;
    var _moveAxesList = null;
    var _moveAxesLabel = null;
    var _moveAxesInstructions = null;
    var _searchOptionsLabel = null;
    var _searchOptionsModal = null;
    var _searchOptionsLoadAllData = null;
    var _permCache = null;
    var _isCellDirty = null;
    var _coordBarRightBtn = null;
    var _coordBarLeftBtn = null;
    var _coordBarText = null;
    var _utilContainerBar = null;

    function init(info) {
        if (!nce) {
            nce = info;

            _columnList = $('#editColumnsList');
            _hideColumnsList = $('#hideColumnsList');
            _hideColumnsAxisSelect = $('#hideColumnsAxisSelect');
            _hideColumnsModal = $('#hideColumnsModal');
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
            _filterModal = $('#filterModal');
            _filterTable = $('#filterTable');
            _hotContainer = $('#hot-container');
            _setUpHideModal = $('#setUpHideModal');
            _setUpHideList = $('#setUpHideList');
            _moveAxesModal = $('#moveAxesModal');
            _moveAxesList = $('#moveAxesList');
            _moveAxesLabel = $('#moveAxesLabel');
            _moveAxesInstructions = $('#moveAxesInstructions');
            _searchOptionsLabel = $('#searchOptionsLabel');
            _searchOptionsModal = $('#searchOptionsModal');
            _searchOptionsLoadAllData = $('#searchOptionsLoadAllData');
            _coordBarRightBtn = $('#coordinate-bar-move-right');
            _coordBarLeftBtn = $('#coordinate-bar-move-left');
            _coordBarText = $('#coordinate-bar-text');
            _utilContainerBar = $('#util-container-bar');

            addSelectAllNoneListeners();
            addColumnEditListeners();
            addColumnHideListeners();
            addSetUpHideListeners();
            addMoveAxesListeners();
            addEditCellListeners();
            addSearchListeners();
            addModalFilters();
            modalsDraggable(true);

            $('#updateAxisMenu').on('click', updateAxis);
            $('#searchOptionsCancel').on('click', function() {
                searchOptionsClose();
            });
            $('#searchOptionsOk').on('click', function() {
                searchOptionsOk();
            });

            $(document).on('keydown', onWindowKeyDown);

            $(document).on('shown.bs.modal', function() {
                nce.freezePage(true);
            });

            $(document).on('hidden.bs.modal', function() {
                nce.freezePage(false);
            });

            $(window).on('resize', function () {
                if (nce.isPageFrozen()) {
                    nce.freezePage(false);
                    nce.freezePage(true);
                }
                delay(hotResize, PROGRESS_DELAY);
            });
        }

        setCoordinateBarListeners();
        buildCubeMap();
        setUtilityBarDisplay();
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
        if (hot) {
            destroyEditor();
            hot.updateSettings({
                height: winHeight - _hotContainer.offset().top,
                width: winWidth
            });
        }
        
        render();
        setUtilityBarDisplay();
    }
    
    function getShouldLoadAllForSearch() {
        return nce.getShouldLoadAllForSearch() || false;
    }
    
    function saveShouldLoadAllForSearch(shouldLoadAllForSearch) {
        nce.saveShouldLoadAllForSearch(shouldLoadAllForSearch);
    }

    function getNumFrozenCols() {
        var savedNum = nce.getNumFrozenCols();
        if (savedNum !== null) {
            return parseInt(savedNum);
        }
        return colOffset || 1;
    }

    function saveNumFrozenCols(num) {
        nce.saveNumFrozenCols(num);
    }

    function toggleClipFormat(event) {
        if (event) {
            event.preventDefault();
        }
        _clipFormat = CLIP_NCE === _clipFormat ? CLIP_EXCEL : CLIP_NCE;
        render();
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
        prefixes = ['rpm.class.', 'rpm.enum.', ''];
        cubeMap = null;
        cubeMap = nce.getCubeMap();
        cubeMapKeys = Object.keys(cubeMap);
        for (cmIdx = 0, cmLen = cubeMapKeys.length; cmIdx < cmLen; cmIdx++) {
            key = null;
            key = cubeMapKeys[cmIdx];
            if (key.length > 2)
            {   // 1. Only support n-cube names with 3 or more characters in them (too many false replaces will occur otherwise)
                // 2. Chop off accepted prefixes.
                for (i = 0, len = prefixes.length; i < len; i++) {
                    if (key.indexOf(prefixes[i]) === 0) {
                        key = key.replace(prefixes[i], '');
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
        s = '\\b(' + s + ')\\b';
        cubeMapRegex = null;
        cubeMapRegex = new RegExp(s, 'gi');
    }
    
    function markCubeModified() {
        nce.updateCubeLeftHandChangedStatus(cubeName, CHANGETYPE.UPDATED);
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
        var editor, keys, i, len, key;
        editor = hot.getActiveEditor();
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
        removeButtonDropdownLocationListeners();
        removeCellListeners();
        hot.destroy();
        hot = null;
    }
    
    function load(keepTable) {
        var result, mode;
        resetCoordinateBar();
        _permCache = {};
        if (hot && !keepTable) {
            killHotEditor();
        }

        mode = shouldLoadAllCells() ? JSON_MODE.INDEX : JSON_MODE.INDEX_NOCELLS;
        result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_JSON, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), {mode:mode}], {noResolveRefs:true});
        if (!result.status) {
            showHtmlError('Failed to load JSON for cube, error: ' + result.data);
            return;
        }
        clearHtmlError();

        handleCubeData(JSON.parse(result.data));
        if (numRows > MAX_VISIBLE_ROWS) {
            setUpHide();
            return;
        }

        setUpColumnWidths(true);
        if (!hot) {
            hot = new Handsontable(_hotContainer[0], getHotSettings());
        }
        if (!shouldLoadAllCells()) {
            loadCellRows();
        }
        selectSavedOrDefaultCell();
        setClipFormatToggleListener();
        _searchField.val(nce.getSearchQuery() || '');
        _searchText = '';
        runSearch();
        searchDown();
    }
    
    function shouldLoadAllCells() {
        return nce.getFilterOutBlankRows() || getShouldLoadAllForSearch() || getSavedFilters().length;
    }

    function loadCellRows() {
        var r, c, cLen, curId, start, end, result, shouldLoadAll, ids;
        if (!hot) {
            return;
        }

        ids = [];
        shouldLoadAll = shouldLoadAllCells();
        start = shouldLoadAll ? 2 : Math.max(2, hot.rowOffset());
        cLen = colOffset ? axes[colOffset].columnLength + colOffset : 1; // special case for 1 axis
        end = shouldLoadAll ? numRows : Math.min(start + hot.countRenderedRows(), numRows);

        for (r = start; r < end; r++) {
            for (c = colOffset; c < cLen; c++) {
                curId = null;
                curId = getCellIdAsArray(r, c);
                if (!data.cells.hasOwnProperty(curId.join('_'))) {
                    ids.push(curId);
                }
            }
        }
        
        if (ids.length) {
            result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_CELLS_NO_EXECUTE, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), ids], {noResolveRefs:false});
            if (result.status) {
                addCellsToData(result.data);
                setUpColumnWidths(false, start, end);
                runSearch(true);
            } else {
                nce.showNote('Error getting cells:' + result.data);
            }
        }
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
            data.cells[cellId] = cellObj;
        }
    }

    function setUpHide() {
        var i, axis, axisName, btnClass;
        var html = '';

        $('#setUpHideLabel')[0].innerHTML = cubeName + ' - Viewable Area Is Too Large';
        $('#setUpHideColInstructions')[0].innerHTML = 'Select an axis to hide columns and shrink the workable area for '
            + 'this cube. You can hide columns on multiple axes. The viewable row limitation is set at '
            + MAX_VISIBLE_ROWS.toLocaleString() + '. You are currently trying to view ' + numRows.toLocaleString() + ' rows.';

        for (i = 0; i < colOffset; i++) {
            axis = null;
            axis = axes[i];
            axisName = axis.name;
            btnClass = _hiddenColumns.hasOwnProperty(axisName) ? 'btn-warning' : 'btn-primary';
            html += '<li><button class="' + btnClass + '">' + axisName + '</button> ';
            html += axis.columnLength + ' columns';
            html += '</li>';
        }
        _setUpHideList.empty();
        _setUpHideList.append(html);
        _setUpHideList.find('button').on('click', function() {
            _setUpHideModal.modal('hide');
            hideColumns(this.textContent);
        });

        _setUpHideModal.modal();
    }

    function addSetUpHideListeners() {
        $('#setUpHideCancel').on('click', setUpHideCancel);
    }

    function setUpHideCancel() {
        _setUpHideModal.modal('hide');
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
                }, PROGRESS_DELAY);
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
        if (hot) {
            hot.addHook('beforeKeyDown', onBeforeKeyDown);
        }
    }

    function removeHotBeforeKeyDown() {
        if (hot) {
            hot.removeHook('beforeKeyDown', onBeforeKeyDown);
        }
    }
    
    function searchOptionsOpen() {
        $('#searchOptionsLabel')[0].innerHTML = 'Search Options - ' + cubeName;
        _searchOptionsLoadAllData[0].checked = getShouldLoadAllForSearch();
        addHotBeforeKeyDown();
        _searchOptionsModal.modal();
    }

    function searchOptionsClose() {
        _searchOptionsModal.modal('hide');
        removeHotBeforeKeyDown();
        destroyEditor();
    }
    
    function searchOptionsOk() {
        var shouldLoadAllData = _searchOptionsLoadAllData[0].checked;
        saveShouldLoadAllForSearch(shouldLoadAllData);
        searchOptionsClose();
        reload();
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
        if (forceSearch || _searchText !== query) {
            if (query && query.length) {
                searchCubeData(query, false);
            } else {
                clearSearchMatches();
            }
            setSearchHelperText();
            render();
            _searchText = query;
            nce.saveSearchQuery(query);
        }
    }

    function getSearchResult(idx) {
        var val = _searchCoords[idx].split('_');
        return {row:parseInt(val[0]), col:parseInt(val[1])};
    }

    function highlightSearchResult(idx) {
        var result = getSearchResult(idx);
        hot.selectCell(result.row, result.col);
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
        for (axisNum = 0, axisLen = axes.length; axisNum < axisLen; axisNum++) {
            axis = null;
            cols = null;
            colKeys = null;
            axis = axes[axisNum];
            cols = axis.columns;
            colKeys = Object.keys(cols);
            for (colNum = 0, colLen = colKeys.length; colNum < colLen; colNum++) {
                cols[colKeys[colNum]].isSearchResult = false;
            }
        }

        cells = data.cells;
        cellKeys = Object.keys(cells);
        for (i = 0, len = cellKeys.length; i < len; i++) {
            cells[cellKeys[i]].isSearchResult = false;
        }

        _searchCoords = null;
        _searchCoords = [];
        _currentSearchResultIndex = -1;
        nce.saveSearchQuery(null);
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
        rowSpacing = numRows - ROW_OFFSET;
        rowSpacingHelper = [];

        isHorizAxis = function(axisNum) {
            return axisLen > 1 && axisNum === colOffset;
        };

        getColumnTableCoords = function() {
            var rowIdx, m, cIdx, cLen, combo, colId, add, prevCombo, curStr, prevStr, curSubStr, prevSubStr;
            if (isHorizAxis(axisNum)) {
                addToSearchCoords(1, colOffset + colNum);
                return;
            }
            if (!getAppliedFilters().length) {
                rowIdx = colNum * rowSpacing;
                for (m = 0; m < multiplier; m++) {
                    addToSearchCoords(rowIdx + 2, axisNum);
                    rowIdx += rowSpacing * colLen;
                }
                return;
            }
            for (cIdx = 0, cLen = _columnIdCombinationsToShow.length; cIdx < cLen; cIdx++) {
                combo = _columnIdCombinationsToShow[cIdx];
                colId = axisColumnMap[axes[axisNum].name][colNum];
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
                        addToSearchCoords(cIdx + 2, axisNum);
                    }
                }
            }
        };

        // search all axes
        for (axisNum = 0, axisLen = axes.length; axisNum < axisLen; axisNum++) {
            axis = axes[axisNum];
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
        cells = data.cells;
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
                if (!getAppliedFilters().length) {
                    for (colIdNum = 0, colIdLen = colIds.length; colIdNum < colIdLen; colIdNum++) {
                        curColId = colIds[colIdNum];
                        curHelperObj = rowSpacingHelper[colIdNum];
                        curColNum = axisColumnMap[curHelperObj.axisName].indexOf(curColId);

                        if (curHelperObj.horizAxis) {
                            c = curColNum;
                        } else {
                            r += curColNum * curHelperObj.rowSpacing;
                        }
                    }
                    addToSearchCoords(r + 2, c + (colOffset || 1));
                } else {
                    topAxis = axes[colOffset];
                    topAxisId = topAxis.id;
                    for (cellIdIdx = 0, cellIdLen = colIds.length; cellIdIdx < cellIdLen; cellIdIdx++) {
                        if (getAxisIdFromString(colIds[cellIdIdx]) === topAxisId) {
                            topColId = colIds.splice(cellIdIdx, 1)[0];
                            c = axisColumnMap[topAxis.name].indexOf(topColId);
                            colIdCombo = colIds.join('_');
                            r = _columnIdCombinationsToShow.indexOf(colIdCombo);
                            if (r > -1) {
                                addToSearchCoords(r + 2, c + (colOffset || 1));
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
        for (i = 0, len = axes.length; i < len; i++) {
            axis = axes[i];
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

        key = axisColumnMap[axis.name][colNum];
        obj = axis.columns[key];
        if (obj) {
            obj.id = key;
        }

        return obj;
    }

    function getColumnHeader(col) {
        var colHeader = getAxisColumn(axes[colOffset], col - colOffset);
        return colHeader ? colHeader : {id:'', value:''};
    }

    function getColumnHeaderValue(col) {
        return getRowHeaderValue(axes[colOffset], getColumnHeader(col));
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
        if (rowNum < 0 || col < 0 || col > axes.length) {
            return;
        }

        return getAppliedFilters().length ? getFilteredRowHeader(col, rowNum) : getUnFilteredRowHeader(col, rowNum);
    }

    function getFilteredRowHeader(col, rowNum) {
        var ids, idx, idLen, result, curId, column, axis;
        axis = axes[col];
        ids = _columnIdCombinationsToShow[rowNum];
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
        var axis = axes[col];
        var colLen = getColumnLength(axis);
        var repeatRowCount = (numRows - ROW_OFFSET) / colLen;

        for (axisNum = 0; axisNum < col; axisNum++) {
            tempAxis = axes[axisNum];
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
        var temp, i, len;
        var rule = '';
        var val = '';
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
            val = '<a class="nc-anc">' + rowHeader.url + '</a>';
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
        var val = getRowHeaderValue(axes[col], getRowHeader(row, col));
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
        var cellId = '';
        var headerInfo = [];
        var i, ghostAxisColumns;
        var ghostKeys = Object.keys(_ghostAxes);
        var ghostLen = ghostKeys.length;
        var len = axes.length + ghostLen;

        if (len > 1 ) {
            for (i = 0; i < colOffset; i++) {
                headerInfo.push(getRowHeaderId(row, i));
            }
            for (i = 0; i < ghostLen; i++) {
                ghostAxisColumns = _ghostAxes[ghostKeys[i]].columns;
                headerInfo.push(Object.keys(ghostAxisColumns)[0]);
            }
            headerInfo.push(getColumnHeaderId(col));

            headerInfo.sort(function(a, b) {
                return a - b;
            });

            cellId = headerInfo.join('_');
        } else {
            cellId = getRowHeaderId(row, 0);
        }

        headerInfo = null;
        return cellId;
    }

    function getCellIdAsArray(row, col) {
        var headerInfo = [];
        var i, ghostAxisColumns;
        var ghostKeys = Object.keys(_ghostAxes);
        var ghostLen = ghostKeys.length;
        var len = axes.length + ghostLen;

        if (len > 1 ) {
            for (i = 0; i < colOffset; i++) {
                headerInfo.push(parseInt(getRowHeaderId(row, i)));
            }
            for (i = 0; i < ghostLen; i++) {
                ghostAxisColumns = _ghostAxes[ghostKeys[i]].columns;
                headerInfo.push(parseInt(Object.keys(ghostAxisColumns)[0]));
            }
            headerInfo.push(parseInt(getColumnHeaderId(col)));
            return headerInfo.sort();
        }
        return [parseInt(getRowHeaderId(row, 0))];
    }

    function getCellData(row, col) {
        return data.cells[getCellId(row, col)];
    }

    function hasCustomAxisOrder() {
        return localStorage.hasOwnProperty(getStorageKey(nce, AXIS_ORDER));
    }

    function getAppliedFilters() {
        var curFilter, i, len;
        var appliedFilters = [];
        for (i = 0, len = _filters.length; i < len; i++) {
            curFilter = _filters[i];
            if (curFilter.isApplied) {
                appliedFilters.push(curFilter);
            }
        }
        return appliedFilters;
    }

    function getCellsByColumnId(colId) {
        var i, len, key;
        var allCells = data.cells;
        var cellKeys = Object.keys(allCells);
        var columnCells = {};
        for (i = 0, len = cellKeys.length; i < len; i++) {
            key = cellKeys[i];
            if (key.indexOf(colId) > -1) {
                columnCells[key] = allCells[key];
            }
        }
        return columnCells;
    }

    function doesCellMatchFilterExpression(cell, filter) {
        var cellVal, expVal;
        if (!filter.isIncludeAll && cell === undefined) {
            return false;
        }
        cellVal = getTextCellValue(cell);
        expVal = filter.expressionValue;
        switch (filter.comparator) {
            case '=':
                return cellVal === expVal;
            case '!=':
                return cellVal !== expVal;
            case '>':
                if (isNaN(cellVal) || isNaN(expVal)) {
                    return cellVal > expVal;
                }
                return parseInt(cellVal) > parseInt(expVal);
            case '<':
                if (isNaN(cellVal) || isNaN(expVal)) {
                    return cellVal < expVal;
                }
                return parseInt(cellVal) < parseInt(expVal);
            case 'contains':
                return cellVal.toLowerCase().indexOf(expVal.toLowerCase()) > -1;
            case 'excludes':
                return cellVal.toLowerCase().indexOf(expVal.toLowerCase()) === -1;
        }
        return false;
    }

    function getFilteredCellsFromData(filterNum) {
        var dAxes, dKeys, a, aLen, c, cLen, axis, tempCombos, columns, colKeys, colId, comboIdx, comboLen;
        var colCells, colCellKeys, colCellKey, colCell, axisColId, colIdReplaceIdx;
        var combos = [];
        var filter = getAppliedFilters()[filterNum];
        if (filter.isIncludeAll) {
            dAxes = data.axes;
            dKeys = Object.keys(dAxes);
            for (a = 0, aLen = dKeys.length; a < aLen; a++) {
                axis = dAxes[dKeys[a]];
                if (axis.columns[filter.column]) {
                    colIdReplaceIdx = combos.length ? combos[0].length : 0;
                } else {
                    tempCombos = [];
                    columns = axis.columns;
                    colKeys = Object.keys(columns);
                    for (c = 0, cLen = colKeys.length; c < cLen; c++) {
                        colId = colKeys[c];
                        comboLen = combos.length;
                        if (comboLen) {
                            for (comboIdx = 0; comboIdx < comboLen; comboIdx++) {
                                tempCombos.push(combos[comboIdx] + '_' + colId);
                            }
                        } else {
                            tempCombos.push(colId);
                        }
                    }
                    combos = tempCombos;
                    combos.sort();
                }
            }
        } else {
            colCells = getCellsByColumnId(filter.column);
            colCellKeys = Object.keys(colCells);
            for (c = 0, cLen = colCellKeys.length; c < cLen; c++) {
                colCellKey = colCellKeys[c];
                colCell = colCells[colCellKey];
                if (doesCellMatchFilterExpression(colCell, filter) && !isCellHidden(colCellKey)) {
                    colIdReplaceIdx = colCellKey.indexOf(filter.column);
                    axisColId = colCellKey.replace(filter.column,'').replace('__','_');
                    if (!axisColId.indexOf('_')) {
                        axisColId = axisColId.substring(1);
                    } else if (axisColId.substring(axisColId.length - 1) === '_') {
                        axisColId = axisColId.substring(0, axisColId.length - 1);
                    }
                    combos.push(axisColId);
                }
            }
        }

        return {idCombinations:combos, idReplaceIdx:colIdReplaceIdx};
    }

    function isCellHidden(cellId) {
        var hiddenAxisKeys, hiddenAxis, a, aLen, c, cLen, idArray;
        idArray = cellId.split('_');
        cLen = idArray.length;
        hiddenAxisKeys = Object.keys(_hiddenColumns);
        for (a = 0, aLen = hiddenAxisKeys.length; a < aLen; a++) {
            hiddenAxis = _hiddenColumns[hiddenAxisKeys[a]];
            for (c = 0; c < cLen; c++) {
                if (hiddenAxis.hasOwnProperty(idArray[c])) {
                    return true;
                }
            }
        }
        return false;
    }

    function getCustomAxisOrder() {
        if (hasCustomAxisOrder()) {
            return JSON.parse(localStorage[getStorageKey(nce, AXIS_ORDER)]);
        }
        return getAxisOrderMetaProp();
    }

    function getAxisOrderMetaProp() {
        if (data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER)) {
            return JSON.parse(data[METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER]);
        }
    }

    function setAxisIds(cubeAxes) {
        var i, len, axis, keys;
        keys = Object.keys(cubeAxes);
        for (i = 0, len = keys.length; i < len; i++) {
            axis = cubeAxes[keys[i]];
            axis.id = axis.id.toString();
        }
    }

    function setUpAxisOrder(cubeAxes) {
        var i, len, axis, order;
        axes = null;
        axes = [];
        _axisIdsInOrder = null;
        _axisIdsInOrder = [];
        order = getCustomAxisOrder();
        if (order) {
            for (i = order.length - 1; 0 <= i; i--) {
                axis = cubeAxes[order[i]];
                if (axis) {
                    getColumnLength(axis);
                    axes.unshift(axis);
                    _axisIdsInOrder.unshift(axis.id);
                } else {
                    order.splice(i, 1);
                    storeAxisOrder(order);
                }
            }
        } else {
            determineAxisOrder(cubeAxes);
        }
    }

    function determineAxisOrder(cubeAxes) {
        var i, len, axis, keys, horizontal, delta, smallestDelta, colLen;
        keys = Object.keys(cubeAxes);
        for (i = 0, len = keys.length; i < len; i++) {
            axes.push(cubeAxes[keys[i]]);
        }

        axes.sort(function (a, b) {
            return getColumnLength(b) - getColumnLength(a);
        });

        smallestDelta = Number.MAX_VALUE;
        for (i = 0, len = axes.length; i < len; i++) {
            axis = axes[i];
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
        horizontal = axes.splice(horizontal, 1);
        axes.push(horizontal[0]);

        for (i = 0, len = axes.length; i < len; i++) {
            _axisIdsInOrder.push(axes[i].id);
        }
    }

    function setUpHideColumns() {
        var i, axisLength, axis, lowerAxisName, keys, j, len;
        var storageKey = getStorageKey(nce, HIDDEN_COLUMNS);
        _hiddenColumns = null;
        if (localStorage.hasOwnProperty(storageKey)) {
            _hiddenColumns = JSON.parse(localStorage[storageKey]);
        } else if (data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS) && !localStorage[getStorageKey(nce, HIDDEN_COLUMNS_OVERRIDE)]) {
            _hiddenColumns = JSON.parse(data[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS]);
        }
        if (!_hiddenColumns) {
            _hiddenColumns = {};
            return;
        }
        for (i = 0, axisLength = axes.length; i < axisLength; i++) {
            axis = null;
            axis = axes[i];
            lowerAxisName = axis.name.toLowerCase();
            if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
                keys = null;
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
        var storageKey = getStorageKey(nce, GHOST_AXES);
        _ghostAxes = null;
        if (localStorage.hasOwnProperty(storageKey)) {
            _ghostAxes = JSON.parse(localStorage[storageKey]);
        } else if (data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES)) {
            _ghostAxes = JSON.parse(data[METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES]);
        }
        if (!_ghostAxes) {
            _ghostAxes = {};
            return;
        }
        for (i = axes.length; i--;) {
            if (_ghostAxes.hasOwnProperty(axes[i].name)) {
                axes.splice(i, 1);
            }
        }
    }

    function storeGhostAxes() {
        saveOrDeleteValue(_ghostAxes, getStorageKey(nce, GHOST_AXES));
    }

    function hasGhostAxes() {
        return Object.keys(_ghostAxes).length;
    }

    function hasHiddenColumns() {
        return Object.keys(_hiddenColumns).length;
    }

    function setUpAxisColumnMap() {
        var axisNum, axisLen;
        axisColumnMap = null;
        axisColumnMap = {};
        for (axisNum = 0, axisLen = axes.length; axisNum < axisLen; axisNum++) {
            addAxisToAxisColumnMap(axes[axisNum]);
        }
    }

    function addAxisToAxisColumnMap(axis) {
        var axisName, colArray, colKeys, defaultColumn, defId, colNum, colLen;
        axisName = axis.name;
        axisColumnMap[axisName] = [];
        colArray = axisColumnMap[axisName];
        colKeys = Object.keys(axis.columns);
        for (colNum = 0, colLen = colKeys.length; colNum < colLen; colNum++) {
            colArray.push(colKeys[colNum]);
        }

        if (axis.hasDefault) {
            defaultColumn = getAxisDefault(axis);
            defId = defaultColumn.id;
            colArray.push(defId);
            axis.columns[defId] = defaultColumn;
        }
    }

    function setUpDataTable() {
        var appliedFilters, horizAxis, colLen, axisNum, axis, comboIdx, comboLen;
        var curFilterResult, filteredColNum, filterResultIdx, filterResultLen, curFilterResultCombo;
        var resultFromFirstFilter, colIdReplaceIdx, f, fLen, filter, addIn, combo, cellId, cell;
        var totalRows = 1;
        cubeName = data.ncube;
        colOffset = axes.length - 1;
        _filters = null;
        _filters = getSavedFilters();
        appliedFilters = getAppliedFilters();

        if (axes.length > 1) {
            horizAxis = axes[colOffset];
            numColumns = colOffset;
            colLen = getColumnLength(horizAxis);
            if (!colLen) {
                numColumns++;
            }

            numColumns += colLen;

            if (!appliedFilters.length) {
                for (axisNum = 0; axisNum < colOffset; axisNum++) {
                    totalRows *= getColumnLength(axes[axisNum]);
                }
                numRows = totalRows + 2;
            } else if (nce.getFilterOutBlankRows()) {
                _columnIdCombinationsToShow = null;
                _columnIdCombinationsToShow = [];
                createFiltersForBlankRows();
                for (filteredColNum = 0; filteredColNum < colLen; filteredColNum++) {
                    curFilterResult = null;
                    curFilterResult = getFilteredCellsFromData(filteredColNum).idCombinations;
                    for (filterResultIdx = 0, filterResultLen = curFilterResult.length; filterResultIdx < filterResultLen; filterResultIdx++) {
                        curFilterResultCombo = curFilterResult[filterResultIdx];
                        if (_columnIdCombinationsToShow.indexOf(curFilterResultCombo) < 0) {
                            _columnIdCombinationsToShow.push(curFilterResultCombo);
                        }
                    }
                }
                _columnIdCombinationsToShow.sort();
                numRows = _columnIdCombinationsToShow.length + 2;
            } else {
                resultFromFirstFilter = getFilteredCellsFromData(0);
                colIdReplaceIdx = resultFromFirstFilter.idReplaceIdx;
                _columnIdCombinationsToShow = null;
                _columnIdCombinationsToShow = resultFromFirstFilter.idCombinations;

                for (f = appliedFilters[0].isIncludeAll ? 0 : 1, fLen = appliedFilters.length; f < fLen; f++) {
                    filter = appliedFilters[f];
                    addIn = colIdReplaceIdx ? '_' + filter.column : filter.column + '_';

                    for (comboIdx = 0, comboLen = _columnIdCombinationsToShow.length; comboIdx < comboLen; comboIdx++) {
                        combo = _columnIdCombinationsToShow[comboIdx];
                        cellId = [combo.slice(0, colIdReplaceIdx), addIn, combo.slice(colIdReplaceIdx)].join('');
                        cell = data.cells[cellId];
                        if (!doesCellMatchFilterExpression(cell, filter)) {
                            _columnIdCombinationsToShow.splice(comboIdx, 1);
                            comboIdx--;
                            comboLen--;
                        }
                    }
                }
                numRows = _columnIdCombinationsToShow.length + 2;
            }
        } else {
            axis = axes[0];
            numColumns = 2;
            numRows = getColumnLength(axis) + 2;
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

        data = cubeData;
        setAxisIds(data.axes);
        setUpAxisOrder(data.axes);
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
        if (axes.length < 2) {
            _topAxisBtn.empty();
        } else {
            buildAxisMenu(axes[colOffset], _topAxisBtn);
            frozen = getNumFrozenCols();
            idx = colOffset > frozen ? colOffset : frozen;
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
        
        if (axes.length === 1) {
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
        var axis = axes[colOffset];
        var columns = axis.columns;
        var columnKeys = axisColumnMap[axis.name];
        var horizAxisId = axes[colOffset].id;

        topWidths[columnKeys[0]] = savedWidths.hasOwnProperty(colOffset)
            ? savedWidths[colOffset] : getAxisHeaderWidth(axis);

        for (colIndex = 1, colLength = columnKeys.length; colIndex < colLength; colIndex++) {
            colKey = columnKeys[colIndex];
            column = columns[colKey];
            idxOffset = colIndex + colOffset;
            topWidths[colKey] = savedWidths.hasOwnProperty(idxOffset) 
                ? savedWidths[idxOffset] : getAxisColumnWidth(axis, column, topWidths[colKey]);
        }

        if (!columnKeys.length) {
            _columnWidths[0] = MIN_COL_WIDTH;
        } else {
            firstColId = columnKeys[0];
            colPrefix = firstColId.slice(0,-10);
            regex = new RegExp(colPrefix + "(?:\\d{10})");
            cells = data.cells;
            cellKeys = Object.keys(cells);
            topKeys = Object.keys(topWidths);
            for (keyIndex = 0, len = cellKeys.length; keyIndex < len; keyIndex++) {
                cellKey = cellKeys[keyIndex];
                colId = regex.exec(cellKey)[0];
                hotColIdx = topKeys.indexOf(colId) + colOffset;
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
        for (hotCol = 0; hotCol < numColumns; hotCol++) {
            hasAlreadyCalculatedColumnWidth = _columnWidths.hasOwnProperty(hotCol);
            if (hotCol < colOffset) {
                if (hasAlreadyCalculatedColumnWidth) {
                    continue;
                }
                width = savedWidths.hasOwnProperty(hotCol) ? savedWidths[hotCol] : findWidestColumn(axes[hotCol]);
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
            _columnWidths[0] = savedWidths.hasOwnProperty(0) ? savedWidths[0] : findWidestColumn(axes[0]);
        }

        // cell width
        if (savedWidths.hasOwnProperty(1)) {
            _columnWidths[1] = savedWidths[1];
        } else {
            oldWidth = _columnWidths.hasOwnProperty(1) ? _columnWidths[1] : 0;
            cells = data.cells;
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
        var font, width, lineWidths, idx, temp1, temp2, tempWidth;
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

        var ret = {width:width, lineWidths:lineWidths};
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
        var axisColumns = axisColumnMap[axisName];
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
        buildHeightArrayForRange(heights, 0, numRows);
    }
    
    function buildHeightArrayForRange(heights, start, end) {
        var headerInfo, rowId, r, i;
        var savedHeights = getSavedRowHeights();
        for (r = start; r < end; r++) {
            if (savedHeights.hasOwnProperty(r)) {
                _rowHeights.push(savedHeights[r]);
            } else if (r < 2) {
                _rowHeights.push(33);
            } else {
                headerInfo = [];
                for (i = 0; i < colOffset; i++) {
                    headerInfo.push(getRowHeaderId(r, i));
                }
                headerInfo.sort();
                rowId = headerInfo.join('_');
                headerInfo = null;
                _rowHeights.push(heights[rowId] || MIN_ROW_HEIGHT);
            }
        }
    }

    function getStringWidth(str, font) {
        return $('<p>' + str + '</p>').canvasMeasureWidth(font);
    }

    function findWidth(oldWidth, newWidth) {
        if (oldWidth > MAX_COL_WIDTH || newWidth > MAX_COL_WIDTH) {
            return MAX_COL_WIDTH
        }
        return Math.max(MIN_COL_WIDTH, oldWidth || 0, newWidth || 0);
    }

    function deleteSavedColumnWidths() {
        saveOrDeleteValue(null, COLUMN_WIDTHS);
        saveOrDeleteValue(null, ROW_HEIGHTS);
    }

    function getSavedColumnWidths() {
        var localWidthVar = localStorage[getStorageKey(nce, COLUMN_WIDTHS)];
        return localWidthVar ? JSON.parse(localWidthVar) : {};
    }

    function getSavedRowHeights() {
        var localHeightVar = localStorage[getStorageKey(nce, ROW_HEIGHTS)];
        return localHeightVar ? JSON.parse(localHeightVar) : {};
    }

    function saveColumnWidth(col, newVal) {
        var saved = getSavedColumnWidths();
        saved[col] = newVal;
        saveOrDeleteValue(saved, getStorageKey(nce, COLUMN_WIDTHS));
    }

    function saveRowHeight(row, newVal) {
        var saved = getSavedRowHeights();
        saved[row] = newVal;
        saveOrDeleteValue(saved, getStorageKey(nce, ROW_HEIGHTS));
    }

    ///////////////////////////////////////////   END WIDTH HEIGHT   ///////////////////////////////////////////////////

    function calcColumnHeader(index) {
        var dividend, modulo, colName;
        if (axes.length === 1) {
            return index ? 'A' : '';
        }

        if (index < colOffset) {
            return '';
        }

        dividend = (index + 1) - colOffset;
        colName = '';
        while (dividend) {
            modulo = (dividend - 1) % 26;
            colName = String.fromCharCode(65 + modulo) + colName;
            dividend = Math.floor((dividend - modulo) / 26);
        }
        return colName;
    }

    function calcRowHeader(index) {
        var text;
        if (index > 1) {
            return index - 1;
        }
        if (!index) {
            return '';
        }
        text = _clipFormat === CLIP_NCE ? NBSP + 'NCE' + NBSP : 'Excel';
        return '<span class="glyphicon glyphicon-copy" style="font-size:13px"></span>' + NBSP + text;
    }

    function setFrozenColumns(numFixed) {
        saveNumFrozenCols(numFixed);
        hot.updateSettings({fixedColumnsLeft:numFixed});
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
            startCols: numColumns,
            startRows: numRows,
            maxCols: numColumns,
            maxRows: numRows,
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
                if (c >= colOffset) {
                    if (r > 1) {
                        display = '&nbsp;';
                        for (axisNum = 0; axisNum < colOffset; axisNum++) {
                            axisName = axes[axisNum].name;
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
                        if (axes.length > 1) {
                            axis = axes[colOffset];
                            axisName = axis.name;
                            axisVal = getRowHeaderPlainTextForWidth(axis, getColumnHeader(c));
                        } else {
                            axisName = axes[0].name;
                            axisVal = getRowHeaderPlainText(r, 0);
                        }
                        display += '<b>' + axisName + '</b>: ' + axisVal;
                    } else if (r) {
                        display = '<b>Axis</b>: ' + axes[colOffset].name + ', <b>Column</b>:' + getColumnHeaderValue(c);
                    }
                }
                else if (r > 1) {
                    display = '<b>Axis</b>: ' + axes[c].name + ', <b>Column</b>:' + getRowHeaderPlainText(r, c);
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
        var wth = $('.wtHolder');
        var r;
        var c;
        var saved = nce.getViewPosition();
        if (row !== undefined && col !== undefined) {
            r = row;
            c = col;
        } else {
            r = saved.row;
            c = saved.col;
        }
        nce.saveViewPosition({row:r, col:c, left:wth.scrollLeft(), top:wth.scrollTop()});
        wth = null;
    }

    function moveTopAxisMenu() {
        var numFixed = getNumFrozenCols();
        var tr = _hotContainer.find('div.ht_clone_top.handsontable > div > div > div > table > tbody > tr:nth-child(1)');
        var scrollAmt = $('.ht_master .wtHolder').scrollLeft();
        var thWidth = tr.find('th').outerWidth();
        var frozenWidth = thWidth;
        var startingWidth = thWidth;
        var newWidth;
        
        if (!_firstRenderedCol) {
            for (var i = 0; i < colOffset; i++) {
                var curWidth = tr.find('td').eq(i).outerWidth();
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

    function setClipFormatToggleListener() {
        _hotContainer.find('div.ht_clone_top_left_corner.handsontable > div > div > div > table > tbody > tr:nth-child(2) > th').on('click', function(e) {
            toggleClipFormat(e);
        });
    }
    
    function removeClipFormatToggleListener() {
        _hotContainer.find('div.ht_clone_top_left_corner.handsontable > div > div > div > table > tbody > tr:nth-child(2) > th').off('click');
    }

    function setButtonDropdownLocations() {
        $('.dropdown-toggle').on('click', function() {
            var modalOffset;
            var button = $(this);
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
            button = null;
            modal = null;
        });
    }

    function removeButtonDropdownLocationListeners() {
        $('.dropdown-toggle').off('click');
        $('.axis-menu').remove();
    }
    
    function removeCellListeners() {
        _hotContainer.find('a.nc-anc').parent().empty();
    }

    function categoryRenderer(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        cellProperties.editor = NcubeBaseEditor;
        td.className = '';
        if (_firstRenderedCol === null) {
            _firstRenderedCol = col;
        }

        // cube name
        if (!row && (col < colOffset || !col)) {
            renderCubeName(td, col, cellProperties);
        } else if (!row) {
            renderHorizontalAxisMetadata(td, col, cellProperties);
        } else if (row === 1) {
            if (col < colOffset || !col) {
                renderVerticalAxisMetadata(td, col, cellProperties);
            } else {
                renderColumnHeader(td, col, cellProperties);
            }
        } else if (!col || col < colOffset) {
            renderRowHeader(td, row, col, cellProperties);
        } else {
            renderCell(td, row, col, cellProperties);
        }
    }
    
    function renderCubeName(td, col, cellProperties) {
        if (!col) {
            td.innerHTML = cubeName;
        }
        td.className += CLASS_HANDSON_CELL_CUBE_NAME;
        td.style.background = BACKGROUND_CUBE_NAME;
        td.style.color = COLOR_WHITE;
        td.colSpan = 1;
        cellProperties.editor = CubeEditor;
        if (col < axes.length - 2) {
            td.style.borderRight = NONE;
            td.style.overflow = 'visible';
        }
    }
    
    function renderHorizontalAxisMetadata(td, col, cellProperties) {
        if (axes.length > 1 && (col === colOffset || (_firstRenderedCol && col === _firstRenderedCol))) {
            td.style.overflow = 'visible';
            td.colSpan = axes[colOffset].columnLength - _firstRenderedCol;
        }
        setCommonAxisMetadataProps(td, cellProperties);
    }
    
    function renderVerticalAxisMetadata(td, col, cellProperties) {
        setCommonAxisMetadataProps(td, cellProperties);
        td.style.overflow = 'visible';
        buildAxisMenu(axes[col], td);
    }
    
    function setCommonAxisMetadataProps(td, cellProperties) {
        td.style.background = BACKGROUND_AXIS_INFO;
        td.style.color = COLOR_WHITE;
        cellProperties.readOnly = true;
    }
    
    function renderColumnHeader(td, col, cellProperties) {
        var axis, column;
        axis = axes[colOffset];
        if (axes.length > 1) {
            column = getColumnHeader(col);
            td.innerHTML = getRowHeaderValue(axis, column);
            if (column.isSearchResult) {
                td.className += CLASS_HANDSON_SEARCH_RESULT;
            }
        }
        td.className += CLASS_HANDSON_TABLE_HEADER;
        cellProperties.editor = ColumnEditor;
    }

    function renderRowHeader(td, row, col, cellProperties) {
        var rowHeader = getRowHeader(row, col);
        var axis = axes[col];
        if (row > 2 && getColumnLength(axis) > 1  && col < colOffset - 1 && rowHeader.id === getRowHeader(row - 1, col).id && (!col || (col && getRowHeader(row, col - 1) === getRowHeader(row - 1, col - 1)))) {
            td.style.borderTop = NONE;
        } else {
            td.innerHTML = getRowHeaderValue(axis, rowHeader);
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
        if ((cellData.value !== undefined && cellData.value !== null) || (cellData.url !== undefined && cellData.url !== null)) {
            if (cellData.isSearchResult) {
                td.className += CLASS_HANDSON_SEARCH_RESULT;
            }

            if (cellData.url !== undefined) {
                td.className += CLASS_HANDSON_CELL_URL;
                td.innerHTML = '<a class="nc-anc-url">' + cellData.url + '</a>';
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
        var columnDefault;
        columnDefault = getCalculatedColumnDefault(row, col);
        if (columnDefault !== null) {
            td.className += CLASS_HANDSON_COLUMN_DEFAULT;
            if (columnDefault.type === 'date') {
                td.innerHTML = getStringFromDate(columnDefault.value);
            } else {
                if (columnDefault.url !== undefined) {
                    td.innerHTML = '<a class="nc-anc-url">' + columnDefault.url + '</a>';
                    activateLinks(td);
                } else {
                    columnDefault = createUrlAnchorsInString('' + columnDefault.value);
                    columnDefault = buildExpressionLink(columnDefault, NONE);
                    td.innerHTML = columnDefault;
                    activateLinks(td);
                }
            }
        } else if (data.defaultCellValue !== null && data.defaultCellValue !== undefined) {
            td.className += CLASS_HANDSON_CELL_DEFAULT;
            if (_defaultCellText === null) {
                _defaultCellText = buildExpressionLink('' + data.defaultCellValue, NONE);
            }
            td.innerHTML = _defaultCellText;
            activateLinks(td);
        } else if (data.defaultCellValueUrl !== null && data.defaultCellValueUrl !== undefined) {
            td.className += CLASS_HANDSON_CELL_DEFAULT;
            td.innerHTML = '<a class="nc-anc-url">' + data.defaultCellValueUrl + '</a>';
            activateLinks(td);
        }
    }

    function getCalculatedColumnDefault(row, col) {
        var column, columnDefault, tempColumnDefault, i;
        column = getColumnHeader(colOffset ? col : row - ROW_OFFSET);
        columnDefault = getColumnDefault(column);

        for (i = 0; i < colOffset; i++) {
            column = null;
            column = getRowHeader(row, i);
            tempColumnDefault = null;
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
        if (val !== undefined) {
            if (typeof val === OBJECT) {
                return val;
            }
            if (typeof val === 'boolean') {
                return {type: 'boolean', value: val}
            }
            return {type: 'string', value: val};
        }
        return null;
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
        else if (data.defaultCellValue !== null && data.defaultCellValue !== undefined) {
            val = data.defaultCellValue;
        }
        return '' + val;
    }

    function createUrlAnchorsInString(val) {
        var ex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var regex = new RegExp(ex);
        return val.replace(regex, function (matched) {
            return '<a class="nc-anc-url">' + matched + '</a>';
        });
    }
    
    function buildExpressionLink(url, highlightLanguage) {
        var val, shouldHighlight, highlighted, tempHighlight, top, ancIdx, text, endIdx;
        if (_expressionLinks.hasOwnProperty(url)) {
            return _expressionLinks[url];
        }
        if (url && url.length > 2) {
            shouldHighlight = highlightLanguage !== NONE;
        
            url = url.replace(cubeMapRegex, function (matched) {
                return '<a class="nc-anc-cube">' + matched + '</a>';
            });
        
            if (shouldHighlight) {
                if (url.indexOf('<a class="nc-anc-') > -1) {
                    //highlight in between links
                    highlighted = '';
                    while ((ancIdx = url.indexOf('<a class="nc-anc-')) > -1) {
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
                    val = highlighted;
                } else {
                    highlighted = highlightLanguage ? hljs.highlight(highlightLanguage, url, true) : hljs.highlightAuto(url);
                    val = highlighted.value;
                }
            } else {
                val = url;
            }
        } else {
            val = url;
        }
        return val;
    }

    function activateLinks(element) {
        // Add click handler that opens clicked cube names
        $(element).find('a.nc-anc-cube').on('click', function () {
            var i, len, fullName;
            var cubeName = this.textContent.toLowerCase();
            for (i = 0, len = prefixes.length; i < len; i++) {
                fullName = prefixes[i] + cubeName;
                if (cubeMap[fullName]) {
                    nce.selectCubeByName(nce.getProperCubeName(fullName));
                    break;
                }
            }
        });

        // Add click handler that opens clicked cube names
        $(element).find('a.nc-anc-url').on('click', function (e) {
            var link, result, msg;
            link = this.innerHTML;
            if (!link.indexOf('http:') || !link.indexOf('https:') || !link.indexOf('file:')) {
                window.open(link);
            } else {
                result = nce.call(CONTROLLER + CONTROLLER_METHOD.RESOLVE_RELATIVE_URL, [nce.getSelectedTabAppId(), link], {noResolveRefs:true});
                if (result.status && result.data) {
                    $.ajax({
                        async: false,
                        type: 'GET',
                        url: result.data,
                        success: function (data) {
                            popoutAceEditor({
                                value: data,
                                readonly: true
                            });
                        }
                    });
                } else {
                    msg = result.data ? result.data : 'Unable to resolve relative URL against entries in sys.classpath';
                    nce.showNote('Unable to open ' + link + ':<hr class="hr-small"/>' + msg);
                }
            }
            e.preventDefault();
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
            onBreakReferenceClick(axis, $(this));
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
        div.find('a.anc-filter-data').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            filterOpen();
        });
        div.find('a.anc-filter-blank-rows').on('click', function (e) {
            e.preventDefault();
            closeAxisMenu();
            filterOutBlankRows();
        });
        div.find('a.anc-clear-filters').on('click', function (e) {
            e.preventDefault();
            if (!_filters.length) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            clearFilters();
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
            var columnWidthStorageKey = getStorageKey(nce, COLUMN_WIDTHS);
            e.preventDefault();
            if (!localStorage[columnWidthStorageKey]) {
                e.stopImmediatePropagation();
                return;
            }
            closeAxisMenu();
            saveOrDeleteValue(null, columnWidthStorageKey);
            saveOrDeleteValue(null, getStorageKey(nce, ROW_HEIGHTS));
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
            clearFilters();
            moveAxis(axisIndex, colOffset);
        });
        div.find('button.move-right').on('click', function (e) {
            e.preventDefault();
            if (axisIndex === axes.length - 2) {
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
            delete localStorage[getStorageKey(nce, AXIS_ORDER)];
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
        return data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER)
            || data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_AXES)
            || data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS);
    }

    function callUpdateMetaPropertiesForDefaultCubeView(shouldClear) {
        var updatedMetaProps = {};
        overrideDefaultViewHiddenColumns(false);
        nce.showNote('Default view ' + (shouldClear ? 'cleared' : 'set') + '!', 'Note', TWO_SECOND_TIMEOUT);
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
        var metaPropertyOptions, metaProperties, propKeys, i, len, propKey;
        metaPropertyOptions = {
            objectType: METAPROPERTIES.OBJECT_TYPES.CUBE,
            objectName: cubeName
        };
        metaProperties = getMetaProperties(metaPropertyOptions);
        propKeys = Object.keys(updatedMetaProps);
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

    function filterOutBlankRows() {
        createFiltersForBlankRows();
        reload();
    }

    function createFiltersForBlankRows() {
        var topAxis = axes[colOffset];
        var columns = topAxis.columns;
        var columnKeys = Object.keys(columns);
        var colIdx, colLen, colFilter, colId;
        clearFilters();
        nce.saveFilterOutBlankRows(true);
        for (colIdx = 0, colLen = columnKeys.length; colIdx < colLen; colIdx++) {
            colId = columnKeys[colIdx];
            colFilter = null;
            colFilter = {
                isApplied: true,
                column: colId,
                comparator: '!=',
                expressionValue: '',
                isIncludeAll: false
            };
            _filters.push(colFilter);
        }
        saveFilters();
    }
    
    function checkCubeUpdatePermissions(axisName, cacheable) {
        var canUpdate, resource, appId, cacheId;
        cacheId = axisName === undefined || axisName === null ? '*cube' : axisName;
        if (_permCache.hasOwnProperty(cacheId)) {
            return _permCache[cacheId];
        }
        appId = nce.getSelectedTabAppId();
        resource = cubeName;
        if (axisName !== undefined && axisName !== null) {
            resource += '/' + axisName;
        }
        canUpdate = nce.checkPermissions(appId, resource, PERMISSION_ACTION.UPDATE);
        if (cacheable) {
            _permCache[cacheId] = canUpdate;
        }
        if (canUpdate && !nce.checkPermissions(appId, resource, PERMISSION_ACTION.COMMIT) && !nce.hasBeenWarnedAboutUpdatingIfUnableToCommitCube()) {
            nce.showNote('You must have someone with the correct permissions commit changes to this cube.', 'Warning!');
            nce.hasBeenWarnedAboutUpdatingIfUnableToCommitCube(true);
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
        nce.selectCubeByName(axis.referenceCubeName, appId);
    }

    function onAxisTransformClick(axis) {
        var appId = appIdFrom(axis.transformApp, axis.transformVersion, axis.transformStatus, axis.transformBranch);
        nce.selectCubeByName(axis.transformCubeName, appId);
    }

    function onBreakReferenceClick(axis, an) {
        var btnsHtml;
        an.parent().find('li').not(an.parent()).find('button').remove();
        if (!an.find('button').length) {
            btnsHtml = '<button class="btn btn-danger btn-xs pull-right axis-menu-button">Cancel</button>';
            btnsHtml += '<button class="btn btn-primary btn-xs pull-right axis-menu-button confirm">Confirm</button>';
            an.append(btnsHtml);
            an.find('button.confirm').on('click', function (e) {
                var result;
                e.preventDefault();
                $(this).parent().parent().parent().parent().removeClass('open');
                $(this).parent().parent().find('button').remove();
                $('div.dropdown-backdrop').hide();
                result = nce.call(CONTROLLER + CONTROLLER_METHOD.BREAK_AXIS_REFERENCE, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), axis.name]);
                if (result.status) {
                    markCubeModified();
                    closeAxisMenu();
                    reload();
                } else {
                    nce.showNote('Error breaking reference for axis ' + axis.name + ':<hr class="hr-small"/>' + result.data);
                }
            });
        } else {
            an.find('button').remove();
        }
    }

    function buildAxisMenuHtml(axis) {
        var axisName = axis.name;
        var isRef = axis.isRef;
        var axisIndex = findIndexOfAxisName(axisName);
        var isTopAxis = axisIndex === colOffset;
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
            html += '<li class="divider"/>';
        }

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

        if (isTopAxis && axes.length > 1) {
            html += '<li><a href="#" class="anc-filter-data">Filter Data...</a></li>';
            html += '<li><a href="#" class="anc-filter-blank-rows">Filter Out Blank Rows</a></li>';
            html += '<li';
            if (!_filters.length) {
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
        if (!localStorage[getStorageKey(nce, COLUMN_WIDTHS)]) {
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
            if (axisIndex === axes.length - 2) {
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
        if (!hot) {
            return;
        }
        if (hot.getActiveEditor()) {
            hot.getActiveEditor().finishEditing(null, null, null, true);
        }
        var searchQuery = _searchField.val();
        if (searchQuery !== null && searchQuery.length) {
            var curCell = getSelectedCellRange();
            if (curCell) {
                var curRow = curCell.startRow;
                var curCol = curCell.startCol;
                var prevIdx = _currentSearchResultIndex;
                searchCubeData(searchQuery, true);
                _currentSearchResultIndex = prevIdx;

                for (var i = 0, len = _searchCoords.length; i < len; i++) {
                    var curSearchCoord = getSearchResult(i);
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
            keycode == KEY_CODES.SPACE || keycode == KEY_CODES.ENTER        ||
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
                this.state = Handsontable.EditorState.EDITING; // needed to override finish editing
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
        editCell();
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
            if (colOffset < 1) {
                return;
            }
            axis = axes[colOffset];
            column = getColumnHeader(col);
            columnName = getColumnHeaderValue(col);
        } else {
            axis = axes[this.col];
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
            objectName: cubeName,
            readonly: !checkCubeUpdatePermissions()
        };
        openMetaPropertiesBuilder(metaPropertyOptions);
    };

    // ==================================== End Custom HOT Editors =====================================================

    // ==================================== Begin Edit Metaproperties ==================================================

    function getMetaPropertiesControllerInfo(metaPropertyOptions) {
        var getMethod;
        var setMethod;
        var params = [nce.getSelectedTabAppId(), nce.getSelectedCubeName()];
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
        var result = nce.call(CONTROLLER + controllerInfo.getter, controllerInfo.params);
        if (result.status !== true) {
            nce.showNote("Unable to fetch metaproperties for " + metaPropertyOptions.objectType + " '" + metaPropertyOptions.objectName + "':<hr class=\"hr-small\"/>" + result.data);
            return null;
        }
        return result.data;
    }

    function updateMetaProperties(metaPropertyOptions, metaProperties) {
        var controllerInfo, result;
        controllerInfo = getMetaPropertiesControllerInfo(metaPropertyOptions);
        controllerInfo.params.push(metaProperties);
        result = nce.call(CONTROLLER + controllerInfo.setter, controllerInfo.params);
        if (!result.status) {
            nce.showNote("Unable to update metaproperties for " + metaProperties.objectType + " '" + metaPropertyOptions.objectName + "':<hr class=\"hr-small\"/>" + result.data);
        }
        markCubeModified();
    }

    function openMetaPropertiesBuilder(metaPropertyOptions) {
        var mpData, metaKeys, metaProperties, i, len, key, opts, val;
        mpData = getMetaProperties(metaPropertyOptions);
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

        addHotBeforeKeyDown();
        opts = {
            name: metaPropertyOptions.objectName,
            type: metaPropertyOptions.objectType,
            readonly: metaPropertyOptions.readonly,
            afterSave: function () { metaPropertiesSave(metaProperties, metaPropertyOptions); },
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
        var mpMap, mpIdx, mpLen, prop;
        mpMap = {};
        for (mpIdx = 0, mpLen = metaProperties.length; mpIdx < mpLen; mpIdx++) {
            prop = null;
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
        cellRange = hot.getSelected(); // index of the currently selected cells as an array [startRow, startCol, endRow, endCol]
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
        if (isCut && !nce.ensureModifiable('Cannot cut / copy cells.')) {
            return;
        }

        cellRange = getSelectedCellRange();
        clipData = clipData = copyHeaders(cellRange);
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
                result = nce.call(CONTROLLER + CONTROLLER_METHOD.COPY_CELLS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), cells, true]);
                if (!result.status) {
                    nce.showNote('Error copying/cutting cells:<hr class="hr-small"/>' + result.data);
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
        if (isCut && !nce.ensureModifiable('Cannot cut / copy cells.')) {
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
            var axis = axes[axisNum];
            var columnNames = axisColumnMap[axis.name];
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
                vals += axes[i].name;
            }
            return vals;
        }

        var clipData;
        if (!cellRange.startRow && !cellRange.endRow) {
            if (!cellRange.startCol && !cellRange.endCol) {
                clipData = cubeName;
            } else if (cellRange.startCol && cellRange.endCol) {
                clipData = axes[colOffset].name;
            }
        } else if (cellRange.startRow === 1 && cellRange.endRow === 1) {
            if (cellRange.startCol < colOffset && cellRange.endCol < colOffset) {
                clipData = getAxisNames(cellRange.startCol, cellRange.endCol);
            } else if (cellRange.startCol >= colOffset && cellRange.endCol >= colOffset) {
                clipData = getColumnValues(colOffset, cellRange.startCol - colOffset, cellRange.endCol - colOffset);
            }
        }
        else if (cellRange.startCol < colOffset && cellRange.startCol === cellRange.endCol) {
            clipData = getColumnValues(cellRange.startCol, cellRange.startRow - ROW_OFFSET, cellRange.endRow - ROW_OFFSET);
        }
        return clipData;
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
        result = nce.call(CONTROLLER + CONTROLLER_METHOD.COPY_CELLS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), cells, isCut]);
        if (!result.status) {
            nce.showNote('Error copying/cutting cells:<hr class="hr-small"/>' + result.data);
            return null;
        }
        return CLIP_NCE + result.data;
    }

    function editPaste() {
        var range;
        if (!nce.ensureModifiable('Cannot paste cells.')) {
            return;
        }

        _clipboard.val('');
        _clipboard.focus();

        range = getSelectedCellRange();
        if (!range || range.length < 1) {
            return;
        }

        setTimeout(function() {
            var content = _clipboard.val();
            if (!content || content == "") {
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

        var numTableRows = hot.countRows();
        var numTableCols = hot.countCols();

        var onlyOneCellSelected = firstRow == lastRow && firstCol == lastCol;

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
            result = nce.call(CONTROLLER + CONTROLLER_METHOD.PASTE_CELLS_NCE, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), clipboard]);
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
            result = nce.call(CONTROLLER + CONTROLLER_METHOD.PASTE_CELLS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), values, coords]);
        }

        if (result.status) {
            markCubeModified();
            reload(true);
        } else {
            nce.showNote('Error pasting cells:<hr class="hr-small"/>' + result.data);
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
            nce.annotateCell(_cellId, nce.getSelectedTabAppId().branch === 'HEAD');
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
            e.preventDefault();
            popoutAceEditor({
                value: _editCellValue.val(),
                onSave: function(newVal) {
                    _editCellValue.val(newVal);
                    _isCellDirty = true;
                }
            })
        });
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
        if (row > 1 && row < numRows && col > (colOffset ? colOffset - 1 : 0) && col < numColumns) {
            destroyEditor();
            hot.selectCell(row, col);
            hot.getActiveEditor().beginEditing();
        }
    }

    function editCell() {
        var cellInfo, value, dataType, isUrl, isCached, isDefault, cellValue, selectedCell, columnDefault, result;
        var appId = nce.getSelectedTabAppId();
        var modifiable = checkCubeUpdatePermissions(null, true);
        
        result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_CELL_NO_EXECUTE, [appId, cubeName, _cellId]);
        if (!result.status) {
            nce.showNote('Unable to fetch the cell contents: ' + result.data);
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
                isUrl = data.defaultCellValueUrl !== undefined;
                value = isUrl ? data.defaultCellValueUrl : data.defaultCellValue;
                dataType = data.defaultCellValueType;
                isCached = data.defaultCellValueCache;
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
        var result = nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_CELL, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), _cellId, null]);
        if (!result.status) {
            _cellId = null;
            nce.showNote('Unable to clear cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        delete data.cells[_tableCellId];
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
        appId = nce.getSelectedTabAppId();
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

        result = nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_CELL, [appId, cubeName, _cellId, cellInfo]);
        if (!result.status) {
            nce.showNote('Unable to update cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        data.cells[_tableCellId] = {value:cellInfo.value};
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
        var isUrl = _editCellRadioURL.find('input')[0].checked;
        var selDataType = isUrl ? _urlDropdown.val() : _valueDropdown.val();
        var urlEnabled = URL_ENABLED_LIST.indexOf(selDataType) > -1;
        var cacheEnabled = CACHE_ENABLED_LIST.indexOf(selDataType) > -1;

        // Enable / Disable [x] URL
        _editCellRadioURL.find('input').prop("disabled", !urlEnabled);

        if (urlEnabled) {
            _editCellRadioURL.removeClass('disabled');
        } else {
            _editCellRadioURL.addClass('disabled');
        }

        // Enable / Disable [x] Cache
        _editCellCache.find('input').prop('disabled', !cacheEnabled);

        if (cacheEnabled) {
            _editCellCache.removeClass('disabled');
        } else {
            _editCellCache.addClass('disabled');
        }
    }

    // =============================================== End Cell Editing ================================================

    // ============================================== Begin Filtering ==================================================

    function filterOpen() {
        var i, len, colId, opts;
        var columnSelectList = [];
        var columns = axes[colOffset].columns;
        var columnKeys = Object.keys(columns);
        for (i = 0, len = columnKeys.length; i < len; i++) {
            colId = columnKeys[i];
            columnSelectList.push({key:colId, value:columns[colId].value});
        }

        addHotBeforeKeyDown();
        opts = {
            columnSelectList: columnSelectList,
            readonly: nce.getFilterOutBlankRows(),
            afterSave: function() { saveFilters(); reload(); removeHotBeforeKeyDown(); },
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.filterData(opts), _filters);
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
        var result, axis;
        var appId = nce.getSelectedTabAppId();
        if (!checkCubeUpdatePermissions(axisName)) {
            nce.showNote('Columns cannot be edited.');
            return false;
        }

        result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_AXIS, [appId, cubeName, axisName]);
        if (result.status) {
            axis = result.data;
            if (!axis.columns) {
                axis.columns = [];
            }
            if (axis.defaultCol) {
                // Remove actual Default Column object (not needed, we can infer it from Axis.defaultCol field being not null)
                axis.columns.splice(axis.columns.length - 1, 1);
            }
        } else {
            nce.showNote("Could not retrieve axis: " + axisName + " for n-cube '" + nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        editColumnInstructions(axis);
        sortColumns(axis);
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
        var input, loc, axis, newCol, html, i, len, addedColVal, c, cLen;
        input = $('.editColCheckBox');
        loc = addedAtIndex;
        if (loc === undefined || loc === null) {
            loc = -1;
            for (i = 0, len = input.length; i < len; i++) {
                if (input[i].checked) {
                    loc = i;
                    break;
                }
            }
        }
        axis = _columnList.prop('model');
        html = '';

        for (c = 0, cLen = addedColVals.length; c < cLen; c++){
            addedColVal = addedColVals[c];
            if (addedColVal === '') {
                continue; // blank row from excel copy
            }
            newCol = null;
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
        var axis, result, lowerAxisName, input, i, len, condInputList, nameInputList, col;
        condInputList = _columnList.find('input[data-type=cond]');
        nameInputList = _columnList.find('input[data-type=name]');
        axis = _columnList.prop('model');
        
        for (i = 0, len = condInputList.length; i < len; i++) {
            col = axis.columns[i];
            col.displayOrder = i;
            col.value = condInputList[i].value;
            input = nameInputList[i];
            if (input) {
                if (!col.hasOwnProperty('metaProps')) {
                    col.metaProps = {};
                }
                col.metaProps.name = input.value;
            }
        }
        
        axis.defaultCol = null;
        result = nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_AXIS_COLUMNS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), axis.name, axis.columns]);
        
        if (!result.status) {
            nce.showNote("Unable to update columns for axis '" + axis.name + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        lowerAxisName = axis.name.toLowerCase();
        if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
            nce.showNote('Hidden column selections for axis ' + axis.name + ' removed.', 'Note', TWO_SECOND_TIMEOUT);
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
            val = val.replace(/"/g, '&quot;');
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

    function addColumnHideListeners() {
        $('#hideColumnsCancel').on('click', function() {
            hideColClose();
        });
        $('#hideColumnsSave').on('click', function() {
            hideColSave(true);
        });
        _hideColumnsAxisSelect.on('change', function() {
            hideColSave(false);
            hideColumns($(this).val());
        });
    }

    function hideColumns(axisName) {
        var result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_AXIS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), axisName]);
        var axis;
        if (result.status) {
            axis = result.data;
            if (!axis.columns) {
                axis.columns = [];
            }
            if (axis.defaultCol) {   // Remove actual Default Column object (not needed, we can infer it from Axis.defaultCol field being not null)
                axis.columns.splice(axis.columns.length - 1, 1);
            }
        } else {
            nce.showNote("Could not retrieve axis: " + axisName + " for n-cube '" + nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        sortColumns(axis);
        loadHiddenColumns(axis);
        $('#hideColumnsLabel')[0].innerHTML = 'Hide ' + axisName + ' columns';

        if (!_hideColumnsModal.hasClass('in')) {
            populateHideColumnsAxisSelect(axisName);
            addHotBeforeKeyDown();
            _hideColumnsModal.modal();
        }
    }

    function populateHideColumnsAxisSelect(axisName) {
        var i, len;
        var html = '';
        for (i = 0, len = axes.length; i < len; i++) {
            html += '<option>' + axes[i].name + '</option>';
        }
        
        _hideColumnsAxisSelect.empty();
        _hideColumnsAxisSelect.append(html);
        _hideColumnsAxisSelect.val(axisName);
    }

    function loadHiddenColumns(axis) {
        var axisList, lowerAxisName, defaultCol, displayOrder;
        var insTitle = $('#hideColInstTitle');
        var inst = $('#hideColInstructions');
        insTitle[0].textContent = 'Instructions - Hide Column';
        inst[0].innerHTML = "Select columns to show. Deselect columns to hide.";

        axisList = axis.columns;
        lowerAxisName = axis.name.toLowerCase();
        defaultCol = axis.defaultCol;
        if (defaultCol !== null) {
            axisList.push(axis.defaultCol);
        }
        _hideColumnsList.empty();
        _hideColumnsList.prop('model', axis);
        displayOrder = 0;
        $.each(axisList, function (key, item) {
            var itemId, listItem, rowDiv, rowLabel, ruleLabel, labelText, label, inputBtn;
            item.displayOrder = displayOrder++;
            itemId = item.id;
            listItem = $('<li/>').prop({class: "list-group-item skinny-lr no-margins"});
            rowDiv = $('<div/>').prop({class: "container-fluid"});
            rowLabel = $('<label/>').prop({class: "checkbox no-margins col-xs-10"});
            ruleLabel = '';
            if (item.metaProps !=null) {
                ruleLabel = item.metaProps.name + ': ';
            }
            labelText = item.value != null ? item.value : DEFAULT_TEXT;
            label = ruleLabel + labelText;
            inputBtn = $('<input/>').prop({class: "commitCheck", type: "checkbox"});
            inputBtn.attr("data-id", itemId);
            inputBtn[0].checked = !_hiddenColumns[lowerAxisName] || !_hiddenColumns[lowerAxisName][itemId];
            _hideColumnsList.append(listItem);
            listItem.append(rowDiv);
            rowDiv.append(rowLabel);
            rowLabel.append(inputBtn);
            rowLabel.append(label);
        });
    }

    function hideColClose() {
        _hideColumnsModal.modal('hide');
        removeHotBeforeKeyDown();
    }

    function hideColSave(shouldClose) {
        var i, len, columnId;
        var axis = _hideColumnsList.prop('model');
        var lowerAxisName = axis.name.toLowerCase();
        var columnIds = [];
        $('.commitCheck:not(:checked)').each(function () {
            var id = $(this).attr('data-id');
            columnIds.push(id);
        });
        len = columnIds.length;
        if (len === axis.columns.length) {
            nce.showNote('Please select at least one column to show.', 'Note', TWO_SECOND_TIMEOUT);
            return;
        }
        delete _hiddenColumns[lowerAxisName];
        if (len) {
            _hiddenColumns[lowerAxisName] = {};
            for (i = 0; i < len; i++) {
                columnId = columnIds[i];
                _hiddenColumns[lowerAxisName][columnId] = true;
            }
        }
        storeHiddenColumns();

        if (shouldClose) {
            hideColClose();
            destroyEditor();
            reload();
        }
    }

    function getSavedFilters() {
        var filters = localStorage[getStorageKey(nce, FILTERS)];
        return filters ? JSON.parse(filters) : [];
    }

    function clearFilters() {
        _filters = null;
        _filters = [];
        saveFilters();
        nce.saveFilterOutBlankRows(false);
    }

    function saveFilters() {
        saveOrDeleteValue(_filters, getStorageKey(nce, FILTERS));
    }

    function storeHiddenColumns() {
        if (data.hasOwnProperty(METAPROPERTIES.DEFAULT_VIEW.HIDDEN_COLUMNS)) {
            overrideDefaultViewHiddenColumns(true);
        }
        saveOrDeleteValue(_hiddenColumns, getStorageKey(nce, HIDDEN_COLUMNS));
    }

    function overrideDefaultViewHiddenColumns(shouldOverride) {
        saveOrDeleteValue(shouldOverride, getStorageKey(nce, HIDDEN_COLUMNS_OVERRIDE));
    }

    // =============================================== End Column Hiding ===============================================

    // =============================================== Begin Axis Ordering =============================================

    function moveAxes() {
        var i;
        var html = '';

        _moveAxesLabel[0].innerHTML = cubeName + ' - Reorder Axes';
        _moveAxesInstructions[0].innerHTML = 'Drag column names to rearrange the order in which they appear.'
            + ' The last axis will appear horizontally in the table.';

        for (i = 0; i <= colOffset; i++) {
            html += '<li class="ui-state-default">' + axes[i].name + '</li>';
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
        axes.splice(toIndex, 0, axes.splice(fromIndex, 1)[0]);
        storeAxisOrder();
        deleteSavedColumnWidths();
        destroyEditor();
        reload();
    }

    function findIndexOfAxisName(axisName) {
        var i, len;
        var lower = axisName.toLowerCase();
        for (i = 0, len = axes.length; i < len; i++) {
            if (axes[i].name.toLowerCase() === lower) {
                return i;
            }
        }
        return -1;
    }

    function storeAxisOrder(order) {
        var i, len;
        if (!order) {
            order = [];
            for (i = 0, len = axes.length; i < len; i++) {
                order.push(axes[i].name.toLowerCase());
            }
        }
        localStorage[getStorageKey(nce, AXIS_ORDER)] = JSON.stringify(order);
    }

    // =============================================== End Axis Ordering ===============================================

    // =============================================== Begin Axis Editing ==============================================

    function addAxis() {
        var opts;
        if (!checkCubeUpdatePermissions('*')) {
            nce.showNote('Axis cannot be added.');
            return;
        }

        opts = {
            appSelectList: nce.loadAppNames(),
            populateVersionFunc: nce.getVersions,
            populateBranchFunc: nce.getBranchNamesByAppId,
            populateCubeFunc: nce.getCubeListForApp,
            populateAxisFunc: nce.getAxesFromCube,
            afterSave: addAxisOk,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.addAxis(opts));
    }
    
    function addAxisOk(data) {
        var params, refAppId, transformAppId, result, axisOrderMetaProp, splitVer;
        var axisName = data.name;
        var appId = nce.getSelectedTabAppId();
        if (!checkCubeUpdatePermissions(axisName)) {
            nce.showNote('Cannot add axis ' + axisName);
            return;
        }

        if (data.isRef) {
            splitVer = data.refVer.split('-');
            refAppId = appIdFrom(data.refApp, splitVer[0], splitVer[1], data.refBranch);
            if (data.hasTransform) {
                splitVer = data.transVer.split('-');
                transformAppId = appIdFrom(data.transApp, splitVer[0], splitVer[1], data.transBranch);
            }
            params = [refAppId, data.refCube, data.refAxis, transformAppId, data.transCube];
        } else {
            params = [data.type, data.valueType];
        }

        result = nce.call(CONTROLLER + CONTROLLER_METHOD.ADD_AXIS, [appId, cubeName, axisName].concat(params));
        if (result.status) {
            if (hasCustomAxisOrder()) {
                axes.splice(colOffset, 0, {name:axisName});
                storeAxisOrder();
            }
            axisOrderMetaProp = getAxisOrderMetaProp();
            if (axisOrderMetaProp) {
                axisOrderMetaProp.unshift(axisName);
                updateCubeMetaProperty(METAPROPERTIES.DEFAULT_VIEW.AXIS_ORDER, axisOrderMetaProp);
            }
            deleteSavedColumnWidths();
            clearFilters();
            markCubeModified();
            nce.loadCube();
        } else {
            nce.showNote("Unable to add axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function deleteAxis(axisName) {
        var opts;
        if (!checkCubeUpdatePermissions(axisName)) {
            nce.showNote('Axis cannot be deleted.');
            return;
        }

        addHotBeforeKeyDown();
        opts = {
            axisName: axisName,
            afterSave: deleteAxisOk,
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.deleteAxis(opts));
    }

    function deleteAxisOk(data) {
        var lowerAxisName, order;
        var axisName = data.name;
        var result = nce.call(CONTROLLER + CONTROLLER_METHOD.DELETE_AXIS, [nce.getSelectedTabAppId(), nce.getSelectedCubeName(), axisName]);
        if (result.status) {
            lowerAxisName = axisName.toLowerCase();
            callUpdateMetaPropertiesForDefaultCubeView(true);
            if (_hiddenColumns.hasOwnProperty(lowerAxisName)) {
                nce.showNote('Hidden column selections for axis ' + axisName + ' removed.', 'Note', TWO_SECOND_TIMEOUT);
                delete _hiddenColumns[lowerAxisName];
                storeHiddenColumns();
            }
            if (hasCustomAxisOrder()) {
                order = JSON.parse(localStorage[getStorageKey(nce, AXIS_ORDER)]);
                axes.splice(order.indexOf(lowerAxisName), 1);
                storeAxisOrder();
            }
            clearFilters();
            deleteSavedColumnWidths();
            markCubeModified();
            removeHotBeforeKeyDown();
            destroyEditor();
            nce.loadCube();
        } else {
            nce.showNote("Unable to delete axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function updateAxis(axisName) {
        var opts;
        var appId = nce.getSelectedTabAppId();
        var result = nce.call(CONTROLLER + CONTROLLER_METHOD.GET_AXIS, [appId, cubeName, axisName]);
        if (!result.status) {
            nce.showNote("Could not retrieve axis: " + axisName + " for n-cube '" + nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }

        addHotBeforeKeyDown();
        opts = {
            axis: result.data,
            readonly: !checkCubeUpdatePermissions(axisName),
            afterSave: function(data) { updateAxisOk(axisName, data); },
            onClose: removeHotBeforeKeyDown
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.updateAxis(opts));
    }

    function updateAxisOk(oldAxisName, data) {
        var result, oldName, newName, order;
        result = nce.call(CONTROLLER + CONTROLLER_METHOD.UPDATE_AXIS, [nce.getSelectedTabAppId(), cubeName, oldAxisName, data.name, data.default || false, data.sorted || false, data.fireAll || false]);
        if (result.status) {
            oldName = oldAxisName.toLowerCase();
            newName = data.name.toLowerCase();
            if (oldName !== newName) {
                callUpdateMetaPropertiesForDefaultCubeView(true);
                _hiddenColumns[newName] = _hiddenColumns[oldName];
                delete _hiddenColumns[oldName];
                storeHiddenColumns();

                if (hasCustomAxisOrder()) {
                    order = JSON.parse(localStorage[getStorageKey(nce, AXIS_ORDER)]);
                    axes[order.indexOf(oldName)].name = newName;
                    storeAxisOrder();
                }
            }
            markCubeModified();
            nce.loadCube();
        } else {
            nce.showNote("Unable to update axis '" + oldAxisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    // =============================================== End Axis Editing ================================================


    function render() {
        if (!hot) {
            return;
        }
        hot.render();
    }

    function reload(keepTable) {
        var selection;
        if (hot) {
            selection = getSelectedCellRange();
            load(keepTable);
            if (!hot) { // reload could not construct table
                return;
            }

            if (selection) {
                hot.selectCell(selection.startRow, selection.startCol, selection.endRow, selection.endCol, true);
            } else {
                selectSavedOrDefaultCell();
            }
        } else { // no table exists
            load();
        }
    }

    function selectSavedOrDefaultCell() {
        var pos, row, col, left, top, wth;
        if (!hot) {
            return;
        }
        
        pos = nce.getViewPosition();
        if (typeof pos === OBJECT) {
            row = pos.row;
            col = pos.col;
            left = pos.left;
            top = pos.top;
        } else {
            row = 2;
            col = axes.length === 1 ? 1 : colOffset;
        }
        
        hot.selectCell(row, col);
        wth = $('.wtHolder')[0];
        wth.scrollLeft = left || 0;
        wth.scrollTop = top || 0;
        hot.render();
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