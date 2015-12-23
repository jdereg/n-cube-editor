(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollWidth > this.width();
    }
})(jQuery);

var NCubeEditor2 = (function ($)
{
    var headerAxisNames = ['trait','traits','businessDivisionCode','bu','month','months','col','column','cols','columns'];
    var nce = null;
    var hot = null;
    var colNums = null;
    var rowNums = null;
    var cubeName = null;
    var axes = null;
    var colOffset = null;
    var data = null;
    var cache = null;
    var prefixes = null;
    var cubeMap = null;
    var cubeMapRegex = null;
    var _cellId = null;
    var _tableCellId = null;
    var _columnList = null;
    var _editCellModal = null;
    var _editCellValue = null;
    var _editCellCache = null;
    var _editCellRadioURL = null;
    var _editColumnModal = null;
    var _valueDropdown = null;
    var _urlDropdown = null;
    var _colIds = -1;   // Negative and gets smaller (to differentiate on server side what is new)
    var _clipboard = null;
    var _clipFormat = CLIP_NCE;

    var init = function(info) {
        if (!nce) {
            nce = info;

            _columnList = $('#editColumnsList');
            _editCellModal = $('#editCellModal');
            _editCellValue = $('#editCellValue');
            _editCellCache = $('#editCellCache');
            _editCellRadioURL = $('#editCellRadioURL');
            _editColumnModal = $('#editColumnsModal');
            _valueDropdown = $('#datatypes-value');
            _urlDropdown = $('#datatypes-url');
            _clipboard = $('#cell-clipboard');

            addColumnEditListeners();
            addEditCellListeners();

            _editCellRadioURL.change(function() {
                var isUrl = _editCellRadioURL.find('input').is(':checked');
                _urlDropdown.toggle(isUrl);
                _valueDropdown.toggle(!isUrl);
            });

            _urlDropdown.change(function() {
                enabledDisableCheckBoxes()
            });

            _valueDropdown.change(function() {
                enabledDisableCheckBoxes()
            });
            $('#addAxisOk').click(function () {
                addAxisOk()
            });
            $('#deleteAxisOk').click(function () {
                deleteAxisOk()
            });
            $('#updateAxisMenu').click(function () {
                updateAxis()
            });
            $('#updateAxisOk').click(function () {
                updateAxisOk()
            });
            _editCellModal.on('shown.bs.modal', function () {
                $('#editCellValue').focus();
            });

            $(window).resize(function () {
                if (hot) {
                    hot.updateSettings({
                        height: $(this).height() - $('#hot-container').offset().top,
                        width: $(this).width()
                    });
                }

                NCubeEditor2.render();

                $(getDomCoordinateBar()).width($(this).width() - 45);
                $('#coordinate-bar-move-right').css({left: $(this).width() - 20});
            });

        }

        setCoordinateBarListeners();
        buildCubeMap();
    };

    var buildCubeMap = function() {
        // Step 1: Build giant cube list names string for pattern matching
        var s = "";
        prefixes = ['rpm.class.', 'rpm.enum.', ''];
        cubeMap = nce.getCubeMap();

        $.each(cubeMap, function (key)
        {
            if (key.length > 2)
            {   // 1. Only support n-cube names with 3 or more characters in them (too many false replaces will occur otherwise)
                // 2. Chop off accepted prefixes.
                for (var i=0; i < prefixes.length; i++)
                {
                    if (key.indexOf(prefixes[i]) == 0)
                    {
                        key = key.replace(prefixes[i], '');
                        break;
                    }
                }
                // 3. Reverse the cube list order (comes from server alphabetically case-insensitively sorted) to match
                // longer strings before shorter strings.
                // 4. Replace '.' with '\.' so that they are only matched against dots (period), not any character.
                s = escapeRegExp(key) + '|' + s;
            }
        });

        if (s.length > 0) {
            s = s.substring(0, s.length - 1);
        }
        s = '\\b(' + s + ')\\b';
        cubeMapRegex = new RegExp(s, 'gi');
    };

    var load = function() {
        resetCoordinateBar();
        if (hot) {
            hot.destroy();
            hot = null;
        }

        if (!nce.getCubeMap() || !nce.doesCubeExist()) {
            $('#ncube-content')[0].innerHTML = '';
            return;
        }

        var info = nce.getCubeMap()[(nce.getSelectedCubeName() + '').toLowerCase()];
        if (!info) {
            $('#ncube-content')[0].innerHTML = '';
            return;
        }

        var result = nce.call("ncubeController.getJson", [nce.getAppId(), nce.getSelectedCubeName(), {mode:'json-index'}], {noResolveRefs:true});
        if (result.status === false) {
            return;
        }

        handleCubeData(JSON.parse(result.data));

        hot = new Handsontable(document.getElementById('hot-container'), getHotSettings());
        hot.render();
    };

    var getColumnLength = function(axis) {
        if (axis.hasOwnProperty('columnLength')) {
            return axis.columnLength;
        }

        var colLen = Object.keys(axis.columns).length;
        if (axis.hasDefault) {
            colLen++;
        }
        axis.columnLength = colLen;
        return colLen;
    };

    var copyColumn = function(column) {
        var newCol = {};
        var keys = Object.keys(column);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            newCol[key] = column[key];
        }
        return newCol;
    };

    var getAxisColumn = function(axis, colNum) {
        var objColumns = axis.columns;
        var keys = Object.keys(objColumns);
        var obj;

        if (keys.length === 0) {
            return;
        }

        if (colNum >= keys.length) {
            obj = getAxisDefault(axis);
        } else {
            var key = keys[colNum];
            var obj = copyColumn(objColumns[key]);
            obj.id = key;
        }

        return obj;
    };

    var getColumnHeader = function(col) {
        return getAxisColumn(axes[colOffset], col - colOffset);
    };

    var getColumnHeaderValue = function(col) {
        var columnHeader = getColumnHeader(col);
        return columnHeader ? columnHeader.value : '';
    };

    var getColumnHeaderId = function(col) {
        return getColumnHeader(col).id;
    };

    var getAxisDefault = function(axis) {
        var defaultId = Object.keys(data.axes).indexOf(axis.name.toLowerCase()) + 1 + AXIS_DEFAULT;
        return {id:defaultId, value:DEFAULT_TEXT};
    };

    var getRowHeader = function(row, col) {
        var cachedRowHeader = getCacheValue(CACHE_ROW_HEADER, {row:row, col:col});
        if (cachedRowHeader) {
            return cachedRowHeader;
        }

        var result;
        var rowNum = row - 2;
        if (rowNum < 0 || col < 0 || col > axes.length) {
            return;
        }

        var axis = axes[col];
        var colLen = getColumnLength(axis);

        var repeatRowCount = (rowNums.length - 2) / colLen;
        for (var axisNum = 0; axisNum < col; axisNum++) {
            var tempAxis = axes[axisNum];
            var colCount = getColumnLength(tempAxis);
            repeatRowCount /= colCount;
        }

        var columnNumberToGet = Math.floor(rowNum / repeatRowCount) % colLen;
        result = (axis.hasDefault && columnNumberToGet === colLen - 1)
            ? getAxisDefault(axis) : getAxisColumn(axis, columnNumberToGet);

        setCacheValue(CACHE_ROW_HEADER, {row:row, col:col}, result);
        return result;
    };

    var getRowHeaderValue = function(row, col) {
        var rowHeader = getRowHeader(row, col);
        var rule = '';
        var val = '';

        var axis = axes[col];
        var type = axis.type.toLowerCase();
        var valueType = axis.valueType.toLowerCase();

        if (type === 'rule' && rowHeader.name !== undefined) {
            rule = '<span class="rule-name">' + rowHeader.name + '</span><hr class="hr-rule"/>';
        }

        val = rowHeader.value;
        if (valueType === 'date') {
            val = val.substring(0, val.indexOf('T'));
        }
        if (val === undefined) {
            val = rowHeader.url;
        } else if (rule !== '') {
            val = '<span class="code">' + val + '</span>';
        }
        return rule + val;
    };

    var getRowHeaderPlainText = function(row, col) {
        var regexSpan = /(<span([^>]+)>)/ig;
        var regexHr = /(<hr([^>]+)>)/ig;
        var val = getRowHeaderValue(row, col);
        return val.replace(regexHr, ' - ').replace(regexSpan, '');
    };

    var getRowHeaderId = function(row, col) {
        return getRowHeader(row, col).id;
    };

    var getCacheValue = function(valType, vars) {
        if (!cache.hasOwnProperty(valType)) {
            return;
        }
        var coord;
        switch (valType) {
            case CACHE_ROW_HEADER:
                coord = vars.row + '_' + vars.col;
                break;
        }

        return cache[valType][coord];
    };

    var setCacheValue = function(valType, vars, value) {
        if (!cache.hasOwnProperty(valType)) {
            cache[valType] = {};
        }
        var coord;
        switch (valType) {
            case CACHE_ROW_HEADER:
                coord = vars.row + '_' + vars.col;
                break;
        }

        cache[valType][coord] = value;
    };

    var getCellId = function(row, col) {
        var cellId = '';
        var headerInfo = [];

        if (axes.length > 1) {
            for (var i = 0; i < colOffset; i++) {
                headerInfo.push(getRowHeaderId(row, i));
            }
            headerInfo.push(getColumnHeaderId(col));

            headerInfo.sort(function(a, b) {
                return a - b;
            });

            for (var i = 0, len = headerInfo.length; i < len; i++) {
                cellId += headerInfo[i] + '_';
            }
            cellId = cellId.slice(0, -1);
        } else {
            cellId = getRowHeaderId(row, 0);
        }

        return cellId;
    };

    var getCellData = function(row, col) {
        return data.cells[getCellId(row, col)];
    };

    var handleCubeData = function(cubeData) {

        var determineAxesOrder = function (cubeAxes) {
            axes = [];
            var keys = Object.keys(cubeAxes);
            for (var i = 0, len = keys.length; i < len; i++) {
                axes.push(cubeAxes[keys[i]]);
            }

            var horizontal;
            axes.sort(function (a, b) {
                return getColumnLength(b) - getColumnLength(a);
            });

            var delta;
            var smallestDelta = Number.MAX_VALUE;
            for (var i = 0, len = axes.length; i < len; i++) {
                var axis = axes[i];
                if (headerAxisNames.indexOf(axis.name) > -1) {
                    horizontal = i;
                    break;
                }
                delta = Math.abs(getColumnLength(axis) - 12);
                if (delta < smallestDelta) {
                    smallestDelta = delta;
                    horizontal = i;
                }
            }

            horizontal = axes.splice(horizontal, 1);
            axes.push(horizontal[0]);
        };

        var setUpDataTable = function() {
            var getColumnString = function(index) {
                var dividend = index;
                var modulo;
                var colName = '';

                while (dividend > 0) {
                    modulo = (dividend - 1) % 26;
                    colName = String.fromCharCode(65 + modulo) + colName;
                    dividend = Math.floor((dividend - modulo) / 26);
                }

                return colName;
            };

            cubeName = cubeData.ncube;
            rowNums = ['',''];
            colNums = [''];

            var totalRows = 1;
            var numAxes = axes.length;
            colOffset = axes.length - 1;

            if (numAxes > 1) {
                var horizAxis = axes[colOffset];

                for (var i = 1; i < colOffset; i++) {
                    colNums.push('');
                }

                var colLen = getColumnLength(horizAxis);
                if (colLen === 0) {
                    colNums.push('');
                }
                for (var columnIndex = 1; columnIndex <= colLen; columnIndex++) {
                    var columnLetterNum = getColumnString(columnIndex);
                    colNums.push(columnLetterNum);
                }

                for (var axisNum = 0; axisNum < colOffset; axisNum++) {
                    var axis = axes[axisNum];
                    var numCols = getColumnLength(axis);
                    totalRows *= numCols;
                }

                for (var rowNum = 1; rowNum <= totalRows; rowNum++) {
                    rowNums.push(rowNum.toString());
                }
            } else {
                var axis = axes[0];
                colNums.push('A');
                var colLen = getColumnLength(axis);

                for (var columnNum = 1; columnNum <= colLen; columnNum++) {
                    rowNums.push(columnNum.toString());
                }
            }
        };

        cache = {};
        data = cubeData;
        determineAxesOrder(data.axes);
        setUpDataTable();
    };

    var getHotSettings = function() {
        return {
            autoColumnSize: true,
            autoRowSize: false,
            enterBeginsEditing: false,
            enterMoves: {row: 1, col: 0},
            tabMoves : {row: 0, col: 1},
            colHeaders: colNums,
            rowHeaders: rowNums,
            startCols: colNums.length,
            startRows: rowNums.length,
            contextMenu: false,
            manualColumnResize: true,
            manualRowResize: true,
            fixedColumnsLeft: axes.length - 1,
            fixedRowsTop: 2,
            currentRowClassName: CLASS_HANDSON_CURRENT_ROW,
            currentColClassName: CLASS_HANDSON_CURRENT_ROW,
            outsideClickDeselects: false,
            height: function() {
                return $(window).height() - $("#hot-container").offset().top;
            },
            width: function() {
                return $(window).width();
            },
            cells: function (row, col, prop) {
                return {renderer:categoryRenderer};
            },
            afterRender: function() {
                $('tr:visible:odd .cell').css({'background-color': BACKGROUND_ODD_ROW});

                $('.dropdown-toggle').click(function () {
                    var button = $(this);
                    var offset = button.offset();
                    var dropDownTop = offset.top + button.outerHeight();
                    var dropDownLeft = offset.left;

                    var modal = button.closest('.modal-content');
                    if (modal[0]) {
                        var modalOffset = modal.offset();
                        dropDownTop -= modalOffset.top;
                        dropDownLeft -= modalOffset.left;
                    }

                    button.parent().find('ul').css({top: dropDownTop + 'px', left: dropDownLeft + 'px'});
                });
            },
            afterSelection: function(r, c, r2, c2) {
                var display = '';
                if (c >= colOffset) {
                    if (r === 1) {
                        display = '<strong>Axis</strong>: ' + axes[colOffset].name + ', <strong>Column</strong>:' + getColumnHeaderValue(c);
                    } else if (r > 1) {
                        display = '&nbsp;';
                        for (var axisNum = 0; axisNum < colOffset; axisNum++) {
                            var axisName = axes[axisNum].name;
                            var axisVal = getRowHeaderPlainText(r, axisNum);
                            display += '<strong>' + axisName + '</strong>: ' + axisVal + ', ';
                        }
                        if (axes.length > 1) {
                            var axisName = axes[colOffset].name;
                            var axisVal = getColumnHeaderValue(c);
                        } else {
                            var axisName = axes[0].name;
                            var axisVal = getRowHeaderPlainText(r, 0);
                        }
                        display += '<strong>' + axisName + '</strong>: ' + axisVal;
                    }
                }
                else if (r > 1) {
                    display = '<strong>Axis</strong>: ' + axes[c].name + ', <strong>Column</strong>:' + getRowHeaderPlainText(r, c);
                }

                resetCoordinateBar(display);
            }
        };
    };

    var categoryRenderer = function(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);

        // cube name
        if (row === 0 && (col < colOffset || col === 0)) {
            if (col === 0) {
                td.innerHTML = cubeName;
            }
            td.style.background = BACKGROUND_CUBE_NAME;
            td.style.color = COLOR_WHITE;
            td.style.opacity = '1';
            cellProperties.readOnly = true;
            if (col < axes.length - 2) {
                td.style.borderRight = NONE;
                td.style.overflow = 'visible';
            }
        }

        // horizontal axis metadata area
        else if (row === 0) {
            if (axes.length > 1 && col === colOffset) {
                td.style.overflow = 'visible';
                buildAxisMenu(axes[colOffset].name, td);
            }
            td.style.background = BACKGROUND_AXIS_INFO;
            td.style.color = COLOR_WHITE;
            td.style.opacity = '1';
            cellProperties.readOnly = true;

            // rest of the top row
            if (col < colNums.length - 1) {
                td.style.borderRight = NONE;
            }
        }

        // vertical axes metadata area
        else if (row === 1 && (col < colOffset || col === 0)) {
            td.style.background = BACKGROUND_AXIS_INFO;
            td.style.color = COLOR_WHITE;
            td.style.opacity = '1';
            td.style.overflow = 'visible';
            cellProperties.readOnly = true;
            buildAxisMenu(axes[col].name, td);
        }

        // column headers
        else if (row === 1) {
            if (axes.length > 1) {
                td.innerHTML = getColumnHeaderValue(col);
            }
            td.className = CLASS_HANDSON_TABLE_HEADER;
            td.style.background = BACKGROUND_COLUMN_HEADER;
            td.style.color = COLOR_WHITE;
            cellProperties.editor = ColumnEditor;
        }

        // row headaers
        else if (col === 0 || col < colOffset) {
            var val = getRowHeaderValue(row, col);
            if (row > 2 && getColumnLength(axes[col]) > 1 && val === getRowHeaderValue(row - 1, col)) {
                td.style.borderTop = NONE;
            } else {
                td.innerHTML = val;
            }
            td.className = CLASS_HANDSON_TABLE_HEADER;
            td.style.background = BACKGROUND_COLUMN_HEADER;
            td.style.color = COLOR_WHITE;
            cellProperties.editor = ColumnEditor;
        }

        // otherwise in cell data
        else {
            var cellData = getCellData(row, col);
            td.className = 'cell';
            if (cellData) {
                if (cellData.url !== undefined) {
                    td.className += ' url';
                    buildUrlLink(cellData.url, td);
                } else if (['exp', 'method'].indexOf(cellData.type) > -1) {
                    td.className += ' code';
                    buildUrlLink(cellData.value, td);
                } else if ('date' === cellData.type) {
                    var val = cellData.value;
                    td.innerHTML = val.substring(0, val.indexOf('T'));
                } else {
                    td.innerHTML = cellData.value;
                }
            } else if (data.defaultCellValue) {
                td.innerHTML = data.defaultCellValue;
                td.className += ' tableDefault';
            }

            cellProperties.editor = CellEditor;
        }
    };

    var buildUrlLink = function(url, element) {
        if (url && url.length > 2) {
            var found = false;

            url = url.replace(cubeMapRegex, function (matched) {
                found = true;
                return '<a class="nc-anc">' + matched + '</a>';
            });

            if (found) {
                // substitute new text with anchor tag
                element.innerHTML = url;       // Much faster than JQuery .html('') or .text('')

                // Add click handler that opens clicked cube names
                $(element).find('a').each(function () {
                    var link = this;
                    $(link).click(function (e) {
                        e.preventDefault();
                        var cubeName = link.textContent.toLowerCase();

                        for (var i = 0, len = prefixes.length; i < len; i++) {
                            if (cubeMap[prefixes[i] + cubeName]) {
                                nce.selectCubeByName(nce.getProperCubeName(prefixes[i] + link.textContent));
                                break;
                            }
                        }
                    });
                });
            } else {
                element.innerHTML = url;
            }
        }
    };

    var buildAxisMenu = function(axisName, element) {
        var div = $('<div/>').prop({class: 'btn-group axis-menu'});
        var button = $('<button/>').prop({type:'button', class:'btn-sm btn-primary dropdown-toggle axis-btn'})
            .attr('data-toggle', 'dropdown');
        var name = $('<span/>').innerHTML = axisName;
        var caret = $('<span/>').prop({class: 'caret'});
        button.append(name);
        button.append(caret);
        div.append(button);

        var ul = $('<ul/>').prop({class: 'dropdown-menu', role: 'menu'});
        var li = $('<li/>');
        var an = $('<a href="#">');
        an[0].innerHTML = "Update Axis...";
        an.click(function (e) {
            e.preventDefault();
            updateAxis(axisName)
        });
        li.append(an);
        ul.append(li);
        li = $('<li/>');
        an = $('<a href="#">');
        an[0].innerHTML = "Add Axis...";
        an.click(function (e) {
            e.preventDefault();
            addAxis();
        });
        li.append(an);
        ul.append(li);
        li = $('<li/>');
        an = $('<a href="#">');
        an[0].innerHTML = "Delete Axis...";
        an.click(function (e) {
            e.preventDefault();
            deleteAxis(axisName)
        });
        li.append(an);
        ul.append(li);
        li = $('<div/>').prop({'class': 'divider'});
        ul.append(li);
        li = $('<li/>');
        an = $('<a href="#">');
        an[0].innerHTML = "Edit " + axisName + " columns...";
        an.click(function (e) {
            e.preventDefault();
            editColumns(axisName)
        });
        li.append(an);
        ul.append(li);
        $(div).append(ul);
        $(element).append(div);
    };

    //====================================== coordinate bar functions ==================================================

    var getDomCoordinateBar = function() {
        return document.getElementById('coordinate-bar-text');
    };

    var getDomCoordinateBarLeftButton = function() {
        return document.getElementById('coordinate-bar-move-left');
    };

    var getDomCoordinateBarRightButton = function() {
        return document.getElementById('coordinate-bar-move-right');
    };

    var curDown = false;
    var curPos = 0;
    var resetCoordinateBar = function(displayText) {
        var bar = getDomCoordinateBar();
        var left = getDomCoordinateBarLeftButton();
        var right = getDomCoordinateBarRightButton();

        curDown = false;
        curPos = 0;
        bar.scrollLeft = 0;
        bar.innerHTML = displayText || '';

        if ($(bar).hasScrollBar()) {
            $(left).show();
            $(right).show();
        } else {
            $(left).hide();
            $(right).hide();
        }
    };

    var setCoordinateBarListeners = function() {
        var coordBar = getDomCoordinateBar();
        var leftButton = getDomCoordinateBarLeftButton();
        var rightButton = getDomCoordinateBarRightButton();

        coordBar.addEventListener('mousedown', function (e) {
            curDown = true;
            curPos = e.pageX;
        });

        coordBar.addEventListener('mouseup', function(e) {
            curDown = false;
        });

        coordBar.addEventListener('mousemove', function(e) {
            if (curDown) {
                coordBar.scrollLeft = coordBar.scrollLeft + curPos - e.pageX;
            }
        });

        coordBar.addEventListener('mouseout', function(e) {
            curDown = false;
        });

        leftButton.addEventListener('click', function(e) {
            coordBar.scrollLeft = coordBar.scrollLeft - 40;
        });

        rightButton.addEventListener('click', function(e) {
            coordBar.scrollLeft = coordBar.scrollLeft + 40;
        });
    };

    // ==================================== Begin Custom HOT Editors ===================================================

    var destroyEditor = function() {
        hot.getActiveEditor().finishEditing(null, null, null, true);
    };

    var onBeforeKeyDown = function(event) {
        event.isImmediatePropagationEnabled = false;
        event.cancelBubble = true;
    };

    var NcubeBaseEditor = Handsontable.editors.TextEditor.prototype.extend();
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
    };

    var CellEditor = NcubeBaseEditor.prototype.extend();
    CellEditor.prototype.open = function() {
        NcubeBaseEditor.prototype.open.apply(this, arguments);

        _tableCellId = getCellId(this.row, this.col);
        _cellId = _tableCellId.split('_');
        editCell();
    };
    CellEditor.prototype.isOpened = function() {
        return $(_editCellModal).hasClass('in');
    };

    var ColumnEditor = NcubeBaseEditor.prototype.extend();
    ColumnEditor.prototype.open = function() {
        NcubeBaseEditor.prototype.open.apply(this, arguments);

        var axis = this.row === 1 ? axes[colOffset] : axes[this.col];
        editColumns(axis.name);
    };
    ColumnEditor.prototype.isOpened = function() {
        return $(_editColumnModal).hasClass('in');
    };

    // ==================================== End Custom HOT Editors =====================================================

    // ==================================== Everything to do with Cell Editing =========================================

    var addEditCellListeners = function() {
        $('#editCellClear').click(function() {
            editCellClear();
        });
        $('#editCellCancel').click(function() {
            editCellCancel();
        });
        $('#editCellOk').click(function() {
            editCellOK();
        });
    };

    var editCell = function() {
        if (!nce.ensureModifiable('Cell cannot be updated.')) {
            return;
        }

        var result = nce.call("ncubeController.getCellNoExecute", [nce.getAppId(), nce.getSelectedCubeName(), _cellId]);

        if (result.status === false) {
            nce.showNote('Unable to fetch the cell contents: ' + result.data);
            return;
        }

        var cellInfo = result.data;
        // Set the cell value (String)
        _editCellValue.val(cellInfo.value ? cellInfo.value : "");
        if (cellInfo.dataType == "null" || !cellInfo.dataType) {
            cellInfo.dataType = "string";
        }

        // Set the correct entry in the drop-down
        if (cellInfo.isUrl) {
            _urlDropdown.val(cellInfo.dataType);
        } else {
            _valueDropdown.val(cellInfo.dataType);
        }

        // Choose the correct data type drop-down (show/hide the other)
        _urlDropdown.toggle(cellInfo.isUrl);
        _valueDropdown.toggle(!cellInfo.isUrl);

        // Set the URL check box
        _editCellRadioURL.find('input').prop('checked', cellInfo.isUrl);

        // Set the Cache check box state
        _editCellCache.find('input').prop('checked', cellInfo.isCached);

        enabledDisableCheckBoxes(); // reset for form
        _editCellModal.modal('show');
    };

    var editCellClear = function() {
        _editCellModal.modal('hide');
        var result = nce.call("ncubeController.updateCell", [nce.getAppId(), nce.getSelectedCubeName(), _cellId, null]);

        if (result.status === false) {
            _cellId = null;
            nce.showNote('Unable to clear cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        delete data.cells[_tableCellId];
        _cellId = null;
        destroyEditor();
    };

    var editCellCancel = function() {
        _cellId = null;
        _editCellModal.modal('hide');
        destroyEditor();
    };

    var editCellOK = function() {
        var cellInfo = {'@type':'com.cedarsoftware.ncube.CellInfo'};
        cellInfo.isUrl = _editCellRadioURL.find('input').prop('checked');
        cellInfo.value = _editCellValue.val();
        cellInfo.dataType = cellInfo.isUrl ? _urlDropdown.val() : _valueDropdown.val();
        cellInfo.isCached = _editCellCache.find('input').prop('checked');
        _editCellModal.modal('hide');

        var result = nce.call("ncubeController.updateCell", [nce.getAppId(), nce.getSelectedCubeName(), _cellId, cellInfo]);

        if (result.status === false) {
            _cellId = null;
            nce.showNote('Unable to update cell:<hr class="hr-small"/>' + result.data);
            return;
        }

        data.cells[_tableCellId] = {value:cellInfo.value};
        _cellId = null;
        destroyEditor();
    };

    var enabledDisableCheckBoxes = function() {
        var isUrl = _editCellRadioURL.find('input').is(':checked');
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
        _editCellCache.find('input').prop("disabled", !cacheEnabled);

        if (cacheEnabled) {
            _editCellCache.removeClass('disabled');
        } else {
            _editCellCache.addClass('disabled');
        }
    };

    // =============================================== End Cell Editing ================================================

    // ============================================== Column Editing== =================================================

    var addColumnEditListeners = function() {
        $('#editColSelectAll').click(function () {
            checkAll(true, '.editColCheckBox')
        });
        $('#editColSelectNone').click(function () {
            checkAll(false, '.editColCheckBox')
        });
        $('#editColAdd').click(function () {
            editColAdd()
        });
        $('#editColDelete').click(function () {
            editColDelete()
        });
        $('#editColUp').click(function () {
            editColUp()
        });
        $('#editColDown').click(function () {
            editColDown()
        });
        $('#editColumnsCancel').click(function () {
            editColCancel()
        });
        $('#editColumnsSave').click(function () {
            editColSave()
        });
    };

    var editColumns = function(axisName) {
        if (!nce.ensureModifiable('Columns cannot be edited.')) {
            return false;
        }

        var result = nce.call("ncubeController.getAxis", [nce.getAppId(), nce.getSelectedCubeName(), axisName]);
        var axis;
        if (result.status === true) {
            axis = result.data;
            if (!axis.columns) {
                axis.columns = [];
            }
            if (axis.defaultCol) {
                // Remove actual Default Column object (not needed, we can infer it from Axis.defaultCol field being not null)
                axis.columns.splice(axis.columns.length - 1, 1);
            }
        } else {
            nce.showNote("Could not retrieve axes for n-cube '" + nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        sortColumns(axis);
        loadColumns(axis);
        var moveBtnAvail = axis.preferredOrder == 1;
        if (moveBtnAvail === true) {
            $('#editColUp').show();
            $('#editColDown').show();
        } else {
            $('#editColUp').hide();
            $('#editColDown').hide();
        }
        $('#editColumnsLabel')[0].innerHTML = 'Edit ' + axisName;
        $(_editColumnModal).modal();
    };

    var sortColumns = function(axis) {
        if (axis.preferredOrder == 1) {
            axis.columns.sort(function(a, b) {
                return a.displayOrder - b.displayOrder;
            });
        }
    };

    var getUniqueId = function() {
        return _colIds--;
    };

    var editColAdd = function() {
        var input = $('.editColCheckBox');
        var loc = -1;
        $.each(input, function (index, btn) {
            if ($(this).prop('checked')) {
                loc = index;
            }
        });
        var axis = _columnList.prop('model');
        var newCol = {
            '@type': 'com.cedarsoftware.ncube.Column',
            'value': 'newValue',
            'id': getUniqueId()
        };

        if (loc == -1 || axis.preferredOrder == 0) {
            axis.columns.push(newCol);
            loc = input.length - 1;
        } else {
            axis.columns.splice(loc + 1, 0, newCol);
        }
        loadColumns(axis);

        // Select newly added column name, so user can just type over it.
        input = _columnList.find('.form-control');
        input[loc + 1].select();
    };

    var editColDelete = function() {
        var axis = _columnList.prop('model');
        var input = $('.editColCheckBox');
        var cols = axis.columns;
        var colsToDelete = [];
        $.each(input, function (index, btn) {
            if ($(this).prop('checked')) {
                colsToDelete.push(index);
            }
        });

        // Walk through in reverse order, deleting from back to front so that
        // the correct elements are deleted.
        for (var i=colsToDelete.length - 1; i >= 0; i--) {
            cols.splice(colsToDelete[i], 1);
        }
        loadColumns(axis);
    };

    var editColUp = function() {
        var axis = _columnList.prop('model');
        var cols = axis.columns;
        var input = $('.editColCheckBox');

        if (cols && cols.length > 0 && input[0].checked) {
            // Top one checked, cannot move any items up
            return;
        }

        for (var i=0; i < input.length - 1; i++) {
            var tag = input[i];
            cols[i].checked = tag.checked;
            if (!tag.checked) {
                var nextTag = input[i + 1];
                cols[i + 1].checked = nextTag.checked;
                if (nextTag.checked) {
                    tag.checked = true;
                    nextTag.checked = false;

                    var temp = cols[i];
                    cols[i] = cols[i + 1];
                    cols[i + 1] = temp;

                    cols[i].checked = true;
                    cols[i + 1].checked = false;
                }
            }
        }

        loadColumns(axis);
    };

    var editColDown = function() {
        var axis = _columnList.prop('model');
        var cols = axis.columns;
        var input = $('.editColCheckBox');

        if (cols && cols.length > 0 && input[cols.length - 1].checked) {
            // Bottom one checked, cannot move any items down
            return;
        }

        for (var i=input.length - 1; i > 0; i--) {
            var tag = input[i];
            cols[i].checked = tag.checked;
            if (!tag.checked) {
                var nextTag = input[i - 1];
                cols[i - 1].checked = nextTag.checked;
                if (nextTag.checked) {
                    tag.checked = true;
                    nextTag.checked = false;

                    var temp = cols[i];
                    cols[i] = cols[i - 1];
                    cols[i - 1] = temp;

                    cols[i].checked = true;
                    cols[i - 1].checked = false;
                }
            }
        }

        loadColumns(axis);
    };

    var editColCancel = function() {
        $(_editColumnModal).modal('hide');
        destroyEditor();
    };

    var editColSave = function() {
        var axis = _columnList.prop('model');
        _columnList.find('input[data-type=cond]').each(function(index, elem) {
            axis.columns[index].value = elem.value;
        });
        _columnList.find('input[data-type=name]').each(function(index, elem) {
            var col = axis.columns[index];
            if (col.metaProp) {
                col.metaProp.name = elem.value;
            }
        });
        axis.defaultCol = null;
        var result = nce.call("ncubeController.updateAxisColumns", [nce.getAppId(), nce.getSelectedCubeName(), axis]);

        if (result.status !== true) {
            nce.showNote("Unable to update columns for axis '" + axis.name + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        $(_editColumnModal).modal('hide');
        destroyEditor();
        nce.reloadCube();
    };

    var loadColumns = function(axis) {
        var insTitle = $('#editColInstTitle');
        var inst = $('#editColInstructions');
        if ('DISCRETE' == axis.type.name) {
            insTitle[0].textContent = 'Instructions - Discrete Column';
            inst[0].innerHTML = "<i>Discrete</i> column has a single value per column. Values are matched with '='. \
            Strings are matched case-sensitively.  Look ups are indexed and run \
            in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(log n)</a>. \
        <ul><li>Examples: \
        <ul> \
        <li>Enter string values as is, no quotes: <code>OH</code></li> \
        <li>Valid number: <code>42</code></li> \
        <li>Valid date: <code>2015/02/14</code> (or <code>14 Feb 2015</code>, <code>Feb 14, 2015</code>, <code>February 14th, 2015</code>, <code>2015-02-14</code>)</li> \
        <li>Do not use mm/dd/yyyy or dd/mm/yyyy. \
        </li></ul></li></ul>";
        }
        else if ('RANGE' == axis.type.name) {
            insTitle[0].textContent = 'Instructions - Range Column';
            inst[0].innerHTML = "A <i>Range</i> column contains a <i>low</i> and <i>high</i> value.  It matches when \
            <i>value</i> is within the range: value >= <i>low</i> and value < <i>high</i>. Look ups are indexed \
            and run in <a href=\"http://en.wikipedia.org/wiki/Time_complexity\" target=\"_blank\">O(log n)</a>.\
        <ul><li>Enter low value, high value. Treated [inclusive, exclusive).</li> \
        <li>Examples: \
        <ul> \
        <li><i>Number range</i>: <code>25, 75</code> (meaning x >= 25 AND x < 75)</li> \
        <li><i>Number range</i>: <code>[100, 1000]</code> (brackets optional)</li> \
        <li><i>Date range</i>: <code>2015/01/01, 2017-01-01</code> (date >= 2015-01-01 AND date < 2017-01-01) \
        </li></ul></li></ul>";
        }
        else if ('SET' == axis.type.name) {
            insTitle[0].textContent = 'Instructions - Set Column';
            inst[0].innerHTML = "A <i>Set</i> column can contain unlimited discrete values and ranges. Discrete values \
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
        }
        else if ('NEAREST' == axis.type.name) {
            insTitle[0].textContent = 'Instructions - Nearest Column';
            inst[0].innerHTML = "A <i>Nearest</i> column has a single value per column.  The <i>closest</i> column on the \
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
        }
        else if ('RULE' == axis.type.name) {
            insTitle[0].textContent = 'Instructions - Rule Column';
            inst[0].innerHTML = "A <i>Rule condition</i> column is entered as a rule name and condition.  All rule conditions \
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
        }
        else {
            insTitle[0].textContent = 'Instructions';
            inst[0].innerHTML = 'Unknown axis type';
        }

        var axisList = axis.columns;
        _columnList.empty();
        _columnList.prop('model', axis);
        var displayOrder = 0;
        $.each(axisList, function (key, item) {
            if (!item.displayOrder || item.displayOrder < 2147483647) {   // Don't add default column in
                item.displayOrder = displayOrder++;
                var rowDiv = $('<div/>').prop({class: "row", "model": item});
                var div = $('<div/>').prop({class: "input-group"});
                var span = $('<span/>').prop({class: "input-group-addon"});
                var inputBtn = $('<input/>').prop({class: "editColCheckBox", "type": "checkbox"});
                if (item.checked === true) {
                    inputBtn[0].checked = true;
                }

                // For rules with URL to conditions, support URL: (or url:) in front of URL - then store as URL
                if (axis.type.name == 'RULE') {
                    if (!item.metaProps) {
                        item.metaProps = {"name": "Condition " + displayOrder};
                    }
                    var inputName = $('<input/>').prop({class: "form-control", "type": "text"});
                    inputName.attr({"data-type": "name"});
                    inputName.blur(function () {
                        item.metaProps.name = inputName.val();
                    });
                    inputName.val(item.metaProps.name);
                }

                var inputText = $('<input/>').prop({class: "form-control", "type": "text"});
                inputText.attr({"data-type":"cond"});
                inputText.blur(function() {
                    item.value = inputText.val();
                });

                var prefix = '';
                if (item.isUrl) {
                    prefix += 'url|';
                }
                if (item.isCached) {
                    prefix += 'cache|';
                }

                inputText.val(prefix + item.value);
                span.append(inputBtn);
                div.append(span);
                if (axis.type.name == 'RULE') {
                    div.append(inputName);
                }
                div.append(inputText);
                rowDiv.append(div);
                _columnList.append(rowDiv);
            }
        });
    };

    // =============================================== End Column Editing ==============================================

    // =============================================== Begin Axis Editing ==============================================

    var addAxis = function() {
        if (!nce.ensureModifiable('Axis cannot be added.')) {
            return;
        }

        var generalTypes = ['STRING', 'LONG', 'BIG_DECIMAL', 'DOUBLE', 'DATE', 'COMPARABLE'];
        var ruleTypes = ['EXPRESSION'];
        buildDropDown('#addAxisTypeList', '#addAxisTypeName', ['DISCRETE', 'RANGE', 'SET', 'NEAREST', 'RULE'], function (selected) {
            if ("RULE" == selected) {
                buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', ruleTypes, function () { });
                $('#addAxisValueTypeName').val('EXPRESSION');
            } else {
                buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', generalTypes, function () { });
                $('#addAxisValueTypeName').val('STRING');
            }
        });
        buildDropDown('#addAxisValueTypeList', '#addAxisValueTypeName', generalTypes, function () { });
        $('#addAxisName').val('');
        $('#addAxisModal').modal();
    };

    var addAxisOk = function() {
        $('#addAxisModal').modal('hide');
        var axisName = $('#addAxisName').val();
        var axisType = $('#addAxisTypeName').val();
        var axisValueType = $('#addAxisValueTypeName').val();
        var result = nce.call("ncubeController.addAxis", [nce.getAppId(), nce.getSelectedCubeName(), axisName, axisType, axisValueType]);
        if (result.status === true) {
            nce.loadCube();
        } else {
            nce.showNote("Unable to add axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    };

    var deleteAxis = function(axisName) {
        if (!nce.ensureModifiable('Axis cannot be deleted.')) {
            return;
        }

        $('#deleteAxisName').val(axisName);
        $('#deleteAxisModal').modal();
    };

    var deleteAxisOk = function() {
        $('#deleteAxisModal').modal('hide');
        var axisName = $('#deleteAxisName').val();
        var result = nce.call("ncubeController.deleteAxis", [nce.getAppId(), nce.getSelectedCubeName(), axisName]);
        if (result.status === true) {
            nce.loadCube();
        } else {
            nce.showNote("Unable to delete axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    };

    var updateAxis = function(axisName) {
        if (!nce.ensureModifiable('Axis cannot be updated.')) {
            return false;
        }

        var result = nce.call("ncubeController.getAxis", [nce.getAppId(), nce.getSelectedCubeName(), axisName]);
        var axis;
        if (result.status === true) {
            axis = result.data;
        } else {
            nce.showNote("Could not retrieve axes for ncube '" + nce.getSelectedCubeName() + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        var isRule = axis.type.name == 'RULE';
        var isNearest = axis.type.name == 'NEAREST';
        $('#updateAxisLabel')[0].textContent = 'Update Axis';
        $('#updateAxisName').val(axisName);
        $('#updateAxisTypeName').val(axis.type.name);
        $('#updateAxisValueTypeName').val(axis.valueType.name);
        $('#updateAxisDefaultCol').prop({'checked': axis.defaultCol != null});
        if (isRule) {
            hideAxisSortOption();
            showAxisDefaultColumnOption(axis);
            showAxisFireAllOption(axis);
        }
        else if (isNearest) {
            hideAxisSortOption();
            hideAxisDefaultColumnOption();
            hideAxisFireAllOption();
        }
        else {
            showAxisSortOption(axis);
            showAxisDefaultColumnOption(axis);
            hideAxisFireAllOption();
        }
        _axisName = axisName;
        $('#updateAxisModal').modal({
            keyboard: true
        });
    };

    var showAxisSortOption = function(axis) {
        $('#updateAxisSortOrderRow').show();
        $('#updateAxisSortOrder').prop({'checked': axis.preferredOrder == 0, 'disabled': false});
    };

    var hideAxisSortOption = function() {
        $('#updateAxisSortOrderRow').hide();
    };

    var showAxisDefaultColumnOption = function(axis) {
        $('#updateAxisDefaultColRow').show();
        $('#updateAxisDefaultCol').prop({'checked': axis.defaultCol != null, 'disabled': false});
    };

    var hideAxisDefaultColumnOption = function() {
        $('#updateAxisDefaultColRow').hide();
    };

    var showAxisFireAllOption = function(axis) {
        $('#updateAxisFireAllRow').show();
        $('#updateAxisFireAll').prop({'checked': axis.fireAll == true, 'disabled': false});
    };

    var hideAxisFireAllOption = function() {
        $('#updateAxisFireAllRow').hide();
    };

    var updateAxisOk = function() {
        $('#updateAxisModal').modal('hide');
        var axisName = $('#updateAxisName').val();
        var hasDefault = $('#updateAxisDefaultCol').prop('checked');
        var sortOrder = $('#updateAxisSortOrder').prop('checked');
        var fireAll = $('#updateAxisFireAll').prop('checked');
        var result = nce.call("ncubeController.updateAxis", [nce.getAppId(), nce.getSelectedCubeName(), _axisName, axisName, hasDefault, sortOrder, fireAll]);
        if (result.status === true) {
            nce.loadCube();
        } else {
            nce.showNote("Unable to update axis '" + axisName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    };

    // =============================================== End Axis Editing ================================================


    var render = function() {
        if (!hot) {
            return;
        }
        hot.render();
    };

    var handleCubeSelected = function() {
        load();
    };

    // Let parent (main frame) know that the child window has loaded.
    // The loading of all of the Javascript (deeply) is continuous on the main thread.
    // Therefore, the setTimeout(, 1) ensures that the main window (parent frame)
    // is called after all Javascript has been loaded.
    setTimeout(function() { window.parent.frameLoaded(); }, 1);

    // API
    return {
        init: init,
        handleCubeSelected: handleCubeSelected,
        load: load,
        render: render
    };

})(jQuery);

var tabActivated = function tabActivated(info) {
    NCubeEditor2.init(info);
    NCubeEditor2.load();
};

var cubeSelected = function cubeSelected() {
    NCubeEditor2.handleCubeSelected();
};