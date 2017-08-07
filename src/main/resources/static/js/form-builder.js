/**
 * options:
 *      title               - title of modal dialog
 *      instructionsTitle   - title of instructions area (omit for no instructions box)
 *      instructionsText    - text of instructions area (omit for no instructions box)
 *      saveButtonText      - text of save button; default 'Save'
 *      closeButtonText     - text of close button; default 'Cancel'
 *      afterSave           - callback fires upon clicking save button
 *      onClose             - callback fires whenever modal closes (save or otherwise)
 *      closeAfterSave      - should the modal close or stay open after saving; default TRUE
 *      readonly            - should the user be able to edit or only view; default FALSE
 *      displayType         - type of display (table, list, form); use constant DISPLAY_TYPE
 *      draggable           - should modal be draggable; default TRUE
 *      size                - size of modal; use constant MODAL_SIZE; default LARGE
 *      hasSelectAllNone    - does modal use select all and select none; default FALSE
 *      hasFilter           - does modal use filter; list view only; default FALSE
 *      canAddRemoveRows    - for table if rows can be added or deleted; default FALSE
 *      columns             - columns to show on modal for either table or list view
 *          heading         - heading for column
 *          type            - type of input for column; use constant INPUT_TYPE
 *          default         - used if column has a default value (such as true for checkbox) for new rows
 *          selectOptions   - if type is SELECT, use for list of options for select input
 *          hasFilter       - can filter on column; default FALSE
 *          sortable        - can sort on column; default FALSE
 *          css             - optional css for column
 *      formInputs          - input values to use in form view
 *          collapsible     - used to collapse sections; default FALSE
 *          sectionType     - bootstrap type style of section; use constant BOOTSTRAP_TYPE
 *          type            - type of input; use constant INPUT_TYPE; default TEXT
 *          default         - if input has a desired default value
 *          selectOptions   - if type is SELECT, use for list of options for select input
 *          label           - label for input field
 *          layout          - layout for input field; use constant INPUT_LAYOUT; default NEW_LINE
 *          readonly        - should be disabled
 *          hidden          - should be hidden
 *          listeners       - listeners to attach to the field
 *              action:func - listener action to attach
 */

var FormBuilder = (function ($) {

    // constants
    var INPUT_TYPE = {
        BUTTON: 'button',
        CHECKBOX: 'checkbox',
        LINK: 'link',
        PROGRESS: 'progress',
        READONLY: 'readonly',
        SECTION: 'section',
        SELECT: 'select',
        TABLE: 'table',
        TEXT: 'text',
        TEXT_SELECT: 'text-select'
    };
    var BOOTSTRAP_TYPE = {
        DANGER: 'danger',
        DEFAULT: 'default',
        INFO: 'info',
        PRIMARY: 'primary',
        SUCCESS: 'success',
        WARNING: 'warning'
    };
    var DISPLAY_TYPE = {
        FORM: 'form',
        LIST: 'list',
        TABLE: 'table'
    };
    var INPUT_LAYOUT = {
        INLINE: 'inline',
        NEW_LINE: 'new-line',
        TABLE: 'table'
    };
    var MODAL_SIZE = {
        SMALL: 'modal-sm',
        MEDIUM: '',
        LARGE: 'modal-lg',
        XL: 'modal-xl'
    };
    //noinspection MagicNumberJS
    var TD_CSS = {
        'padding-right': 25,
        'text-align':'center'
    };
    var TR_CLASS = 'form-builder-data-row';

    var ID_PREFIX = {
        COLLAPSE: 'form-builder-collapse-',
        INPUT: 'form-builder-input-',
        SECTION: 'form-builder-section-'
    };

    var Filter = {};

    // elements;
    var _modal = null;

    // external variables
    var _data = null;
    var _options = null;

    // public
    function openBuilderModal(options, data) {
        var container;
        var buildNew = !_modal;
        _data = data || options.data || {};
        _options = options;
        setDefaultOptions();

        _modal = _modal || buildModal();
        container = _modal.find('.modal-content');
        if (!buildNew) {
            container.empty();
        }
        container.append(buildModalHeader());
        container.append(buildModalContent());
        container.append(buildModalFooter());

        if (_options.displayType !== DISPLAY_TYPE.FORM) {
            container.find('input,textarea,select').attr('disabled', _options.readonly);
        }

        if (buildNew) {
            _modal.modal();
        } else {
            addModalFilter();
        }
    }

    function setDataValue(key, val) {
        _data[key] = val;
    }

    function setDefaultOptions() {
        if (!_options.hasOwnProperty('size')) {
            _options.size = MODAL_SIZE.MEDIUM;
        }
        if (!_options.hasOwnProperty('saveButtonText')) {
            _options.saveButtonText = 'Save';
        }
        if (!_options.hasOwnProperty('closeButtonText')) {
            _options.closeButtonText = 'Cancel';
        }
        if (!_options.hasOwnProperty('draggable')) {
            _options.draggable = true;
        }
        if (!_options.hasOwnProperty('closeAfterSave')) {
            _options.closeAfterSave = true;
        }
    }

    function buildModal() {
        var sizeClass = _options.size;
        var html = '<div tabindex="-1" data-role="dialog" data-backdrop="static" class="modal fade">'
                 + '<div class="modal-dialog ' + sizeClass + '">'
                 + '<div class="modal-content"></div>'
                 + '</div></div>';

        var modal = $(html).on('shown.bs.modal', function() {
            makeModalDraggable();
            addModalFilter();
            positionDropdownMenus(_modal);
        }).on('hidden.bs.modal', function() {
            closeModal();
        });

        if (!_options.readonly) {
            modal.keyup(function (e) {
                if (_options.displayType === DISPLAY_TYPE.TABLE) {
                    if (e.keyCode === KEY_CODES.ENTER) {
                        addTableRowForTableTypeBuilder();
                    }
                }
            });
        }

        return modal;
    }

    function buildModalHeader() {
        var html = '<div class="modal-header"><button class="close">&times;</button>'
                 + '<h3 class="modal-title">' + _options.title + '</h3>'
                 + '</div>';
        var header = $(html);
        header.find('button').on('click', function() { closeBuilderModal() });
        return header;
    }

    function closeBuilderModal(shouldSave) {
        var shouldClose = _options.closeAfterSave;
        if (shouldSave) {
            switch (_options.displayType) {
                case DISPLAY_TYPE.TABLE:
                    copyTableDataToModel();
                    break;
                case DISPLAY_TYPE.FORM:
                    copyFormDataToModel(_options.formInputs);
                    break;
            }
            if (_options.hasOwnProperty('afterSave')) {
                _options.afterSave(_data);
            }
        }
        if (!shouldSave || (shouldSave && shouldClose)) {
            _modal.modal('hide');
        }
    }

    function buildModalFooter() {
        var html, footer, i, len;
        var buttons = [];

        if (!_options.readonly) {
            if (_options.hasSelectAllNone) {
                buttons.push('<button class="btn btn-info btn-sm pull-left form-builder-select-all" aria-hidden="true">Select All</button>');
                buttons.push('<button class="btn btn-info btn-sm pull-left form-builder-select-none" aria-hidden="true">Select None</button>');
            }
            if (_options.displayType !== DISPLAY_TYPE.FORM && _options.canAddRemoveRows) {
                buttons.push('<button class="btn btn-success btn-sm form-builder-add">Add New</button>');
                buttons.push('<button class="btn btn-danger btn-sm form-builder-clear">Clear</button>');
            }
            if (_options.afterSave) {
                buttons.push('<button class="btn btn-primary btn-sm form-builder-save">' + _options.saveButtonText + '</button>');
            }
        }
        buttons.splice(buttons.length - 2, 0, '<button class="btn btn-default btn-sm form-builder-cancel">' + _options.closeButtonText + '</button>');

        html = '<div class="modal-footer">';
        for (i = 0, len = buttons.length; i < len; i++) {
            html += buttons[i];
        }
        html += '</div>';

        footer = $(html);
        footer.find('.form-builder-select-all').on('click', function() { checkAll(true, 'input[type="checkbox"]'); });
        footer.find('.form-builder-select-none').on('click', function() { checkAll(false, 'input[type="checkbox"]'); });
        footer.find('.form-builder-add').on('click', function() { addTableRowForTableTypeBuilder(); });
        footer.find('.form-builder-clear').on('click', function() { clearTableRows(); });
        footer.find('.form-builder-cancel').on('click', function() { closeBuilderModal(); });
        footer.find('.form-builder-save').on('click', function() { closeBuilderModal(true); });

        if (_options.hasOwnProperty('footerButtons')) {
            buildCustomFooterButtons(footer);
        }
        return footer;
    }

    function buildCustomFooterButtons(footer) {
        var i, len, button, html, btnOpt, key;
        var btnOpts = _options.footerButtons;
        var keys = Object.keys(btnOpts);
        var cancelButton = footer.find('.form-builder-cancel');

        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            btnOpt = btnOpts[key];
            html = '<button class="btn ' + btnOpt.buttonClass +' btn-sm form-builder-' + key + '">' + btnOpt.label + '</button>';
            button = $(html);
            button.on('click', btnOpt.action);
            cancelButton.before(button);
        }
    }

    function buildModalContent() {
        var style = _options.size === MODAL_SIZE.SMALL ? '' : 'overflow-y:auto;min-height:450px;';
        var body = $('<div class="modal-body" style="'+ style + '">');

        if (_options.hasOwnProperty('instructionsTitle') && _options.hasOwnProperty('instructionsText')) {
            body.append(initSubSection('inst', _options.instructionsTitle, _options.instructionsText, BOOTSTRAP_TYPE.DEFAULT, true));
        }

        switch (_options.displayType) {
            case DISPLAY_TYPE.TABLE:
                body.append(buildTable(_data, _options));
                break;
            case DISPLAY_TYPE.FORM:
                body.append(buildForm());
                break;
        }
        return body;
    }

    function buildForm() {
        var form = $('<form role="form"/>');
        form.append(buildFormSection(_options.formInputs, _options.readonly));
        return form;
    }

    function buildFormSection(formInputs, readonly) {
        var i, len, formInput, key, subSection, control, sectionReadonly;
        var section = $('<div style="clear:both;"/>');
        var keys = Object.keys(formInputs);
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            formInput = formInputs[key];
            formInput.name = key;
            if (!formInput.hidden) {
                if (formInput.type === INPUT_TYPE.SECTION) {
                    subSection = initSubSectionFromFormInput(formInput);
                    sectionReadonly = readonly || formInput.readonly;
                    control = buildFormSection(formInput.formInputs, sectionReadonly);
                    addToSubSection(subSection, control);
                    section.append(subSection);
                } else {
                    control = buildFormControl(formInput, readonly);
                    section.append(control);
                }
            }
        }
        return section;
    }

    function initSubSection(id, title, body, type, collapsible) {
        var sectionId = ID_PREFIX.SECTION + id;
        var collapseId = ID_PREFIX.COLLAPSE + id;
        var panelType = type || BOOTSTRAP_TYPE.DEFAULT;
        var html = '<div class="form-builder-section"><div id="' + sectionId + '" class="panel-group">'
            + '<div class="panel panel-' + panelType + '">'
            + '<div class="panel-heading"><h4 class="panel-title">'
            + (collapsible ? ('<a data-toggle="collapse" href="#' + collapseId + '">' + title + '</a>') : title)
            + '</h4></div><div id="' + collapseId + '" class="panel-collapse collapse in">'
            + '<div class="panel-body">' + (body || '') + '</div></div></div></div></div>';
        return $(html);
    }
    
    function initSubSectionFromFormInput(formInput) {
        return initSubSection(formInput.name, formInput.label, formInput.data, formInput.sectionType, formInput.collapsible);
    }
    
    function addToSubSection(section, toAdd) {
        section.find('.panel-body').append(toAdd);
    }

    function buildFormControl(formInput, readonlyOverride) {
        var style = formInput.layout === INPUT_LAYOUT.INLINE ? 'display:inline-block;margin: 0 10px;' : '';
        var control = $('<div class="form-group" style="' + style + '"/>');
        control.append(buildFormInput(formInput, readonlyOverride));
        registerListeners(formInput, control);
        return control;
    }

    function registerListeners(formInput, control) {
        if (formInput.hasOwnProperty('listeners')) {
            addListenersToControl(control, formInput.listeners);
            if (formInput.listeners.hasOwnProperty('populate')) {
                control.find('input,select').trigger('populate');
            }
        }
    }

    function toggle(formInputKey, forceState) {
        var control, nearest, sectionControl;
        var formInputInfo = findFormInputByKey(_options.formInputs, formInputKey);
        var formInput = formInputInfo.current;
        var existingControl = findInputGroup(formInput);
        formInput.hidden = forceState !== undefined && forceState !== null ? !forceState : !formInput.hidden;

        if (formInput.hidden) {
            existingControl.remove();
        } else if (!existingControl.length) {
            if (formInput.type === INPUT_TYPE.SECTION) {
                control = initSubSectionFromFormInput(formInput);
                sectionControl = buildFormSection(formInput.formInputs);
                positionDropdownMenus(sectionControl);
                addToSubSection(control, sectionControl);
            } else {
                control = buildFormControl(formInput);
                positionDropdownMenus(control);
            }

            if (formInputInfo.hasOwnProperty('before')) {
                nearest = formInputInfo.before;
                findInputGroup(nearest).after(control);
            } else if (formInputInfo.hasOwnProperty('after')) {
                nearest = formInputInfo.after;
                findInputGroup(nearest).before(control);
            } else {
                _modal.find('form').append(control);
            }
        }
    }

    function findInputGroup(formInput) {
        var isSection = formInput.type === INPUT_TYPE.SECTION;
        var prefix = isSection ? ID_PREFIX.SECTION : ID_PREFIX.INPUT;
        var selector = isSection ? '.form-builder-section' : '.form-group';
        return _modal.find('#' + prefix + formInput.name).closest(selector);
    }

    function findFormInputByKey(formInputs, searchKey) {
        var i, len, formInput, lowerRet;
        var ret = {};
        var keys = Object.keys(formInputs);
        for (i = 0, len = keys.length; i < len; i++) {
            formInput = formInputs[keys[i]];
            if (formInput.name === searchKey) {
                ret.current = formInput;
                if (ret.hasOwnProperty('before')) {
                    return ret;
                }
            } else if (!formInput.hidden) {
                if (formInput.type === INPUT_TYPE.SECTION) {
                    lowerRet = findFormInputByKey(formInput.formInputs, searchKey);
                    if (lowerRet.hasOwnProperty('current')) {
                        return lowerRet;
                    }
                }
                if (ret.hasOwnProperty('current')) {
                    ret.after = formInput;
                    return ret;
                }
                ret.before = formInput;
            }
        }
        return {};
    }

    function buildFormInput(formInput, readonlyOverride) {
        var control, group;
        var id = ID_PREFIX.INPUT + formInput.name;
        var label = formInput.label || '';
        var placeholder = formInput.placeholder || '';
        var readonly = readonlyOverride || formInput.readonly;
        var selectOptions = formInput.selectOptions;
        var initVal = '';

        if (formInput.data !== undefined && formInput.data !== null) {
            initVal = formInput.data;
        } else if (formInput.hasOwnProperty('default')) {
            initVal = formInput.default;
        }

        if (formInput.layout === INPUT_LAYOUT.TABLE) {
            switch (formInput.type) {
                case INPUT_TYPE.SELECT:
                    control = createFormTableDisplayDefaultSelectInput(id, label, selectOptions, readonly, initVal);
                    break;
                default:
                    control = createFormTableDisplayTextInput({id:id, label:label, readonly:readonly, initVal:initVal, placeholder:placeholder});
                    break;
            }
            return control;
        }

        switch (formInput.type) {
            case INPUT_TYPE.CHECKBOX:
                control = createFormCheckboxInput(id, label, readonly, initVal);
                break;
            case INPUT_TYPE.SELECT:
                control = createFormDefaultDisplaySelectInput(id, label, selectOptions, readonly, initVal);
                break;
            case INPUT_TYPE.TABLE:
                control = $('<div id="' + id + '"/>').append(buildTable(initVal, formInput));
                break;
            case INPUT_TYPE.TEXT_SELECT:
                control = createFormTextSelectInput(id, label, selectOptions, readonly, initVal);
                break;
            case INPUT_TYPE.READONLY:
                control = $('<span id="' + id + '">' + label + '</span>');
                break;
            case INPUT_TYPE.BUTTON:
                control = $('<button id="' + id + '" class="btn ' + formInput.buttonClass + '">' + label + '</button>');
                break;
            case INPUT_TYPE.PROGRESS:
                control = $('<div class="progress"><div id="' + id + '" class="progress-bar ' + formInput.progressClass + '" role="progressbar" aria-valuenow="' +
                    (initVal === '' ? '0' : initVal) + '" aria-valuemin="0" aria-valuemax="100"></div></div>');
                break;
            default:
                group = typeof formInput.buttonClick === 'function';
                control = createFormTextInput({id:id, label:label, readonly:readonly, initVal:initVal, group:group, placeholder:placeholder});
                if (group) {
                    control.find('input').parent().append('<span class="input-group-btn"><button id="' + id + '-btn' + '" class="btn btn-default" type="button">' + formInput.buttonLabel + '</button></span>');
                    control.find('button').on('click', formInput.buttonClick);
                }
                break;
        }
        return control;
    }

    function createFormTableDisplayDefaultSelectInput(id, label, opts, readonly, initVal) {
        return createFormDefaultSelectInput(id, label, opts, readonly, initVal, {label:'width:20%;', input:'display:inline-block;width:77%;'});
    }

    function createFormDefaultDisplaySelectInput(id, label, opts, readonly, initVal) {
        return createFormDefaultSelectInput(id, label, opts, readonly, initVal, {label:'', input:''});
    }

    function createFormDefaultSelectInput(id, label, opts, readonly, initVal, styles) {
        var inputGroup = $('<label for="' + id + '" style="' + styles.label + '">' + label + '</label>'
            + '<select id="' + id + '" class="form-control input-sm" style="' + styles.input + '"'
            + (readonly ? ' disabled' : '') + '>');
        populateSelect(inputGroup.last(), opts, initVal);
        return inputGroup;
    }

    function createFormTextSelectInput(id, label, opts, readonly, initVal) {
        var inputGroup = $('<label for="' + id + '">' + label + '</label>'
            + '<div class="input-group"><div class="input-group-btn">'
            + '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">'
            + 'Choose<span class="caret"></span></button><ul class="dropdown-menu"></ul></div>'
            + '<input id="' + id + '" type="text" class="form-control"'
            + (readonly ? ' readonly' : '') + '></div>');
        populateTextSelect(inputGroup, opts);
        inputGroup.find('input').val(initVal);
        return inputGroup;
    }

    function createFormCheckboxInput(id, label, readonly, initVal) {
        var inputGroup = $('<div class="checkbox"><label><input id="' + id + '" type="checkbox"'
            + (readonly ? ' disabled' : '') + '>' + label + '</label></div>');
        inputGroup.find('input')[0].checked = initVal;
        return inputGroup;
    }

    function createFormTableDisplayTextInput(opts) {
        opts.styles = {label:'width:20%;', input:'display:inline-block;width:77%;'};
        return createFormTextInput(opts);
    }

    /*
     *  id
     *  label
     *  readonly
     *  initVal
     *  placeholder
     *  group
     *  styles
     *      label
     *      input
     */
    function createFormTextInput(opts) {
        var groupDiv, inputGroup, inputElement;
        if (!opts.hasOwnProperty('styles')) {
            opts.styles = {label: '', input: '' };
        }
        inputGroup = $('<label for="' + opts.id + '" style="' + opts.styles.label + '">' + opts.label + ':</label>');
        inputElement = $('<input id="' + opts.id + '" type="text" class="form-control"' +
            ' style="' + opts.styles.input + '"' +
            (opts.readonly ? ' readonly' : '') +
            ' placeholder="' + opts.placeholder + '">');
        inputElement.val(opts.initVal);
        if (opts.group) {
            groupDiv = $('<div class="input-group">');
            inputGroup.append(groupDiv);
            groupDiv.append(inputElement);
        } else {
            inputGroup = inputGroup.add(inputElement);
        }
        return inputGroup;
    }

    function addListenersToControl(control, listeners) {
        var i, len, key;
        var keys = Object.keys(listeners);
        var input = control.find('input,select,a,button');
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            input.on(key, listeners[key]);
        }
    }

    function populateSelect(el, opts, init) {
        var i, len, optEl, opt;
        el.empty();
        if (!opts) {
            return;
        }
        for (i = 0, len = opts.length; i < len; i++) {
            optEl = $('<option/>');
            opt = opts[i];

            if (typeof opt === 'object') {
                optEl.val(opt.key);
                optEl.text(opt.value);
            } else {
                optEl.text(opts[i]);
            }

            el.append(optEl);
        }
        el.val(init);
    }

    function populateTextSelect(inputGroup, opts) {
        var i, len, html, ul, input;
        ul = inputGroup.find('ul');
        ul.empty();
        if (!opts) {
            return;
        }
        html = '';
        input = inputGroup.find('input');
        for (i = 0, len = opts.length; i < len; i++) {
            html += '<li><a href="#">' + opts[i] + '</a></li>';
        }
        ul.append(html);
        ul.find('a').on('click', function(e) {
            e.preventDefault();
            input.val(this.innerHTML);
            input.trigger('change');
        });
    }

    function buildTable(data, tableOpts) {
        var columns, columnKeys, headingRow, c, cLen, column, header, key;
        var style = tableOpts.css || { margin: '0 auto' };
        var dataTable= $('<table/>').css(style);

        columns = tableOpts.columns;
        columnKeys = Object.keys(columns);
        tableOpts.columnKeys = columnKeys;
        headingRow = $('<tr/>');

        for (c = 0, cLen = columnKeys.length; c < cLen; c++) {
            key = columnKeys[c];
            column = columns[key];
            column.name = key;
            header = $('<th/>').html(column.heading).css(column.css || TD_CSS);
            if (column.sortable) {
                header.on('click', function() {
                    sortTable(dataTable, data, this, tableOpts);
                });
            }
            headingRow.append(header);
        }
        dataTable.append(headingRow);
        createTableRows(dataTable, data, tableOpts);
        return $('<div/>').append($('<div style="max-height:300px; overflow-y:auto;"/>').append(dataTable));
    }

    function sortTable(table, data, sortHeader, tableOpts) {
        // TODO - NEEDS FLESHED OUT
        var asc;
        var headers = table.parent().parent().find('th');
        var curIdx = headers.index(sortHeader);
        var span = headers.find('span');
        var prevIdx = headers.index(span.parent());
        var key = tableOpts.columnKeys[curIdx];

        if (curIdx === prevIdx && span.hasClass('glyphicon-triangle-top')) {
            asc = false;
            span.removeClass('glyphicon-triangle-top').addClass('glyphicon-triangle-bottom');
        } else {
            asc = true;
            span.remove();
            $(sortHeader).prepend('<span class="glyphicon glyphicon-triangle-top"></span>');
        }

        data.sort(function(a, b) {
            var aVal = a[key];
            var bVal = b[key];
            if (isNaN(aVal) || isNaN(bVal)) {
                return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return asc ? aVal - bVal : bVal - aVal;
            }
        });

        table.find('tr').remove();
        createTableRows(table, data, tableOpts);
        if (typeof Filter.filter === 'function') {
            Filter.filter();
        }
    }

    function createTableRows(table, data, tableOpts) {
        var d, dLen;
        dLen = data.length;
        if (dLen) {
            for (d = 0; d < dLen; d++) {
                addTableRow(table, data[d], tableOpts);
            }
        } else {
            addTableRow(table, null, tableOpts); //start with empty row
        }
    }

    function addTableRowForTableTypeBuilder(dataRow) {
        addTableRow(_modal.find('table'), dataRow, _options);
    }

    function addTableRow(table, dataRow, tableOpts) {
        var c, cLen, key, column, dataVal, inputElement, closeBtn, td;
        var tr = $('<tr/>').addClass(TR_CLASS);
        var columnKeys = tableOpts.columnKeys;
        var columns = tableOpts.columns;
        if (tableOpts.canAddRemoveRows && !tableOpts.readonly) {
            closeBtn = $('<span/>').addClass('glyphicon glyphicon-remove tab-close-icon');
            closeBtn.click(function () {
                $(this).closest('tr').remove();
            });
        }
        for (c = 0, cLen = columnKeys.length; c < cLen; c++) {
            key = columnKeys[c];
            column = columns[key];
            dataVal = undefined;
            if (dataRow) {
                dataVal = typeof dataRow === 'object' ? dataRow[key] : dataRow;
            }
            if (dataVal === undefined) {
                dataVal = column.hasOwnProperty('default') ? column.default : null;
            }

            inputElement = getDataRowInput(column, dataVal);
            inputElement.addClass(key);
            td = $('<td/>').append(inputElement).css(column.css || TD_CSS);
            registerListeners(column, td);
            if (column.readonly) {
                td.find('input,textarea,select').attr('disabled', true);
            }
            tr.append(td);
        }

        table.append(tr);
        if (closeBtn) {
            tr.append($('<td/>').append(closeBtn));
        }
        tr.find('input').first().focus();
    }

    function getDataRowInput(column, dataVal) {
        var inputElement;
        var inputClass = ID_PREFIX.INPUT + column.name;
        switch (column.type) {
            case INPUT_TYPE.CHECKBOX:
                inputElement = $('<input class="' + inputClass + '"/>').prop({type:'checkbox', checked:dataVal});
                break;
            case INPUT_TYPE.READONLY:
                inputElement = $('<span class="' + inputClass + '">' + (dataVal || '') + '</span>');
                break;
            case INPUT_TYPE.SELECT:
                inputElement = $('<select class="' + inputClass + '" style="width:100%;max-width:95%;"/>');
                populateSelect(inputElement, column.selectOptions, dataVal);
                break;
            case INPUT_TYPE.TEXT:
                inputElement = $('<input class="' + inputClass + '" type="text"/>').val(dataVal);
                break;
            case INPUT_TYPE.LINK:
                inputElement = $('<a class="' + inputClass + '" href="#">' + dataVal + '</a>');
                break;
            case INPUT_TYPE.BUTTON:
                inputElement = $('<a href="#"><kbd>' + dataVal + '</kbd></a>');
                break;
        }
        return inputElement;
    }

    function clearTableRows() {
        findTableRows().remove();
    }

    function findTableRows() {
        return _modal.find('tr.' + TR_CLASS);
    }

    function copyTableDataToModel() {
        var trs, columnKeys, columns, trIdx, trLen, tr;
        _data.splice(0, _data.length);
        trs = findTableRows();
        columnKeys = _options.columnKeys;
        columns = _options.columns;
        for (trIdx = 0, trLen = trs.length; trIdx < trLen; trIdx++) {
            tr = null;
            tr = $(trs[trIdx]);
            _data.push(getDataRow(columns, columnKeys, tr));
        }
    }

    function copyFormDataToModel(formInputs) {
        var i, len, key, input, inputOpts, val;
        var keys = Object.keys(formInputs);

        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            input = $('#' + ID_PREFIX.INPUT + key);
            inputOpts = formInputs[key];
            if (!inputOpts.hidden) {
                switch (inputOpts.type) {
                    case INPUT_TYPE.SECTION:
                        copyFormDataToModel(inputOpts.formInputs);
                        break;
                    case INPUT_TYPE.TABLE:
                        copyFormTableDataToModel(inputOpts.columns);
                    case INPUT_TYPE.CHECKBOX:
                        val = input.prop('checked');
                        break;
                    default:
                        val = input.val();
                        break;
                }
                _data[key] = val || inputOpts.default;
            }
        }
    }

    function copyFormTableDataToModel(columns) {
        var i, len, key, els, el, e, eLen, val;
        var columnKeys = Object.keys(columns);
        for (i = 0, len = columnKeys.length; i < len; i++) {
            key = columnKeys[i];
            _data[key] = [];
            els = findTableElementsByKey(key);
            for (e = 0, eLen = els.length; e < eLen; e++) {
                el = $(els[e]);
                if (el.is('span')) {
                    val = el[0].textContent;
                } else if (el.is(':checkbox')) {
                    val = el[0].checked;
                } else {
                    val = el.val();
                }
                _data[key].push(val);
            }
        }
        return _data;
    }

    function getDataRow(columns, columnKeys, tr) {
        var c, cLen, key, inputElement, dataVal;
        var dataRow = {};
        for (c = 0, cLen = columnKeys.length; c < cLen; c++) {
            key = columnKeys[c];
            inputElement = null;
            inputElement = tr.find('.' + key);

            switch (columns[key].type) {
                case INPUT_TYPE.CHECKBOX:
                    dataVal = inputElement[0].checked;
                    break;
                case INPUT_TYPE.READONLY:
                    dataVal = inputElement[0].innerHTML;
                    break;
                case INPUT_TYPE.SELECT:
                case INPUT_TYPE.TEXT:
                    dataVal = inputElement.val();
                    break;
            }
            dataRow[key] = dataVal;
        }
        return dataRow;
    }

    function getInputValue(key) {
        var el = findElementByKey(key);
        if (el.length) {
            return el.val();
        }
    }

    function setInputValue(key, value) {
        var el = findElementByKey(key);
        if (el.length) {
            if (el.hasClass('progress-bar')) {
                el.css('width', value + '%').attr('aria-valuenow', value).text(value + '%');
            } else if (el.is('span')) {
                el.html(value);
            } else {
                el.val(value);
            }
        }
    }

    function findElementByKey(key) {
        return _modal.find('#' + ID_PREFIX.INPUT + key);
    }

    function findTableElementsByKey(key) {
        return $('.' + TR_CLASS).find('.' + key);
    }

    function makeModalDraggable() {
        var realPosX, realPosY;
        var $doc = $(document);
        var docWidth = $doc.width();
        var docHeight = $doc.height();
        var content = _modal.find('.modal-content');
        var modalWidth = content.outerWidth();
        var modalHeight = content.outerHeight();
        var marginTop = _modal.find('.modal-dialog').css('margin-top');
        var shouldBeDraggable = _options.draggable && docHeight > modalHeight;
        marginTop = marginTop.substring(0, marginTop.indexOf('px'));
        marginTop = parseInt(marginTop);
        realPosX = docWidth - modalWidth;
        realPosY = docHeight - modalHeight - marginTop * 2;
        _modal.draggable({
            handle: '.modal-header',
            containment: [-realPosX, -marginTop, realPosX, realPosY]
        });
        _modal.draggable(shouldBeDraggable ? 'enable' : 'disable');
    }

    function addModalFilter() {
        var items, checkBoxes, checkedItems, contentDiv, countSpan, div, input;
        if (!_options.hasFilter) {
            return;
        }
        items = [];
        checkBoxes = [];
        checkedItems = [];
        contentDiv = _modal.find('.modal-content');
        countSpan = $('<span/>');
        div = $('<div/>');
        input = $('<input/>');

        function refreshItems() {
            input.focus();
            items = contentDiv.find('.modal-body').find('li,tr');
            if (items.find('input[type="checkbox"]').length) {
                items = items.has('input[type="checkbox"]:not(".exclude")');
            }
            items.on('remove', function() {
                delay(function() {
                    refreshItems();
                }, 50);
            });
            checkBoxes = items.find('input[type="checkbox"]');
            refreshCount();
        }

        function refreshCount() {
            checkedItems = checkBoxes.filter(function() {
                return $(this)[0].checked;
            });
            countSpan[0].innerHTML = checkedItems.length + ' of ' + items.length + ' Selected';
        }

        countSpan.addClass('pull-left selected-count');
        contentDiv.find('.btn.pull-left:last').after(countSpan);

        contentDiv.click(function() {
            refreshCount();
        });

        input.addClass('modal-filter-input');
        input.prop({'type':'text','placeholder':'Filter...'});
        input.css({'width':'100%'});
        input.on('keyup', function(e) {
            delay(function() {
                Filter.filter();
            }, e.keyCode === KEY_CODES.ENTER ? 0 : PROGRESS_DELAY);
        });

        contentDiv.find('.modal-header').after(div);
        div.append(input);

        contentDiv.parent().parent().on('shown.bs.modal', function(){
            refreshItems();
        });
        contentDiv.on('show', function() {
            refreshItems();
        });

        Filter.filter = function() {
            var query = input.val().toLowerCase();
            refreshItems();
            if (query === '') {
                items.show();
            } else {
                items.hide();
                items.filter(function () {
                    var el, cb, tds, td;
                    var item = $(this);
                    if (item.is('li')) {
                        el = item;
                        cb = item.find('input[type="checkbox"]');
                        if (cb.length) {
                            el = cb.parent();
                        }
                        return el[0].textContent.toLowerCase().indexOf(query) > -1;
                    }
                    if (item.is('tr')) {
                        tds = item.find('td').filter(function() {
                            td = $(this);
                            if (td.find('input[type="checkbox"]').length) {
                                return false;
                            }
                            return td[0].textContent.toLowerCase().indexOf(query) > -1;
                        });
                        return tds.length;
                    }
                }).show();
            }
        };

        // run on init
        refreshItems();
    }

    function positionDropdownMenus(el) {
        el.find('.dropdown-toggle').on('click', function () {
            var contentOffset;
            var button = $(this);
            var offset = button.offset();
            var dropDownTop = offset.top + button.outerHeight();
            var dropDownLeft = offset.left;
            var content = button.closest('.modal-content');
            if (content.length) {
                contentOffset = content.offset();
                dropDownTop -= contentOffset.top;
                dropDownLeft -= contentOffset.left;
            }

            button.parent().find('ul')
                .addClass('form-builder-dropdown-menu')
                .css({position: 'fixed', top: dropDownTop + 'px', left: dropDownLeft + 'px'});
        });
    }

    function closeModal() {
        _modal.remove();
        _modal = null;
        if (typeof _options.onClose === FUNCTION) {
            _options.onClose();
        }
    }

    function checkAll(state, queryStr) {
        $(queryStr).filter(':visible').not('.exclude').prop('checked', state).change();
    }

    function showAlert(text) {
        var warning = $('<div id="branchNameWarning" class="alert alert-warning alert-dismissible" role="alert">'
                    + '<button type="button" class="close" aria-label="Close">'
                    + '<span aria-hidden="true">&times;</span></button>'
                    + text + '</div>');
        warning.find('button').on('click', function() { $(this).parent().remove(); });
        _modal.find('.modal-body').prepend(warning);
    }

    return {
        closeBuilderModal: closeBuilderModal,
        findElementByKey: findElementByKey,
        findTableElementsByKey: findTableElementsByKey,
        getInputValue: getInputValue,
        setInputValue: setInputValue,
        openBuilderModal: openBuilderModal,
        populateSelect: populateSelect,
        populateTextSelect: populateTextSelect,
        showAlert: showAlert,
        toggle: toggle,
        setDataValue: setDataValue,
        copyFormTableDataToModel: copyFormTableDataToModel,
        BOOTSTRAP_TYPE: BOOTSTRAP_TYPE,
        DISPLAY_TYPE: DISPLAY_TYPE,
        ID_PREFIX: ID_PREFIX,
        INPUT_LAYOUT: INPUT_LAYOUT,
        INPUT_TYPE: INPUT_TYPE,
        MODAL_SIZE: MODAL_SIZE
    };

})(jQuery);