var NCEBuilderOptions = (function () {
    /*
     * All methods have valid options of:
     * readonly     - self-explanatory
     * afterSave    - callback to fire on save
     * onClose      - callback to fire when the modal closes (fires after save if saved)
     */

    // begin private
    function populateTableElement(key) {
        populateElement(FormBuilder.findTableElementsByKey(key));
    }

    function populateFormElement(key) {
        populateElement(FormBuilder.findElementByKey(key));
    }

    function populateElement(el) {
        el.trigger('populate');
    }
    // end private

    /*
     * additional required options:
     *  columnSelectList
     */
    function filterData(opts) {
        return {
            title: 'Filter Data',
            instructionsTitle: 'Instructions - Filter Data',
            instructionsText: 'Select filters to apply to cell data for ncube.',
            displayType: FormBuilder.DISPLAY_TYPE.TABLE,
            size: FormBuilder.MODAL_SIZE.LARGE,
            canAddRemoveRows: true,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            columns: {
                isApplied: {
                    heading: 'Apply',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    default: true
                },
                column: {
                    heading: 'Column',
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    selectOptions: opts.columnSelectList
                },
                comparator: {
                    heading: 'Comparator',
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    selectOptions: FILTER_COMPARATOR_LIST,
                    default: FILTER_COMPARATOR_LIST[0]
                },
                expressionValue: {
                    heading: 'Comparison Value',
                    type: FormBuilder.INPUT_TYPE.TEXT
                },
                isIncludeAll: {
                    heading: 'Include Empty Cells',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    default: true
                }
            }
        };
    }

    /*
     * additional required options:
     *  name
     *  type
     */
    function metaProperties(opts) {
        return {
            title: 'Metaproperties - ' + opts.name,
            instructionsTitle: 'Instructions - Metaproperties',
            instructionsText: 'Add custom properties for this ' + opts.type + '.',
            displayType: FormBuilder.DISPLAY_TYPE.TABLE,
            canAddRemoveRows: true,
            size: FormBuilder.MODAL_SIZE.LARGE,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            columns: {
                key: {
                    heading: 'Key',
                    type: FormBuilder.INPUT_TYPE.TEXT
                },
                dataType: {
                    heading: 'Type',
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    default: 'string',
                    selectOptions: METAPROPERTIES.DATA_TYPE_LIST
                },
                isUrl: {
                    heading: 'Url',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX
                },
                isCached: {
                    heading: 'Cached',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX
                },
                value: {
                    heading: 'Value',
                    type: FormBuilder.INPUT_TYPE.TEXT
                },
                popout: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    css: {},
                    default: 'Pop Out',
                    listeners: {
                        click: function(e) {
                            e.preventDefault();
                            opts.onPopOut($(e.target).closest('tr').find('.value'));
                        }
                    }
                }
            }
        };
    }

    /*
     * additional required options:
     *  appId
     *  appSelectList
     *  populateVersionFunc
     */
    function copyBranch(opts) {
        var appId = opts.appId;
        return {
            title: 'Copy ' + appId.app + ' ' + appId.version + '-' + appId.status + ' ' + appId.branch,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Copy Branch',
            formInputs: {
                app: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'New app',
                    selectOptions: opts.appSelectList,
                    data: appId.app,
                    listeners: {
                        change: function() {
                            FormBuilder.findElementByKey('version').trigger('populate');
                        }
                    }
                },
                version: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'New version',
                    data: appId.version,
                    listeners: {
                        populate: function() {
                            var app = FormBuilder.getInputValue('app') || appId.app;
                            var versions = opts.populateVersionFunc(app, STATUS.SNAPSHOT);
                            FormBuilder.populateTextSelect($(this).parent(), versions);
                        }
                    }
                },
                branch: {
                    label: 'New branch'
                },
                copyHistory: {
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    label: 'Copy branch with history'
                }
            }
        };
    }

    /*
     * additional required options:
     *  appId
     */
    function deleteBranch(opts) {
        var appId = opts.appId;
        return {
            title: 'Delete ' + appId.app + ' ' + appId.version + '-' + appId.status + ' ' + appId.branch,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            size: FormBuilder.MODAL_SIZE.SMALL,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Delete Branch',
            formInputs: {
                surety: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    label: 'Are you sure?'
                }
            }
        };
    }

    /*
     * additional required options:
     *  appId
     *  cubeName
     *  appSelectList
     *  populateVersionFunc
     *  populateBranchFunc
     */
    function copyCube(opts) {
        var appId = opts.appId;
        return {
            title: 'Duplicate - ' + opts.cubeName,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Duplicate',
            formInputs: {
                app: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'New app',
                    selectOptions: opts.appSelectList,
                    data: appId.app,
                    listeners: {
                        change: function() {
                            FormBuilder.findElementByKey('version').trigger('populate');
                            FormBuilder.findElementByKey('branch').trigger('populate');
                        }
                    }
                },
                version: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'New version',
                    data: appId.version,
                    listeners: {
                        change: function() {
                            FormBuilder.findElementByKey('branch').trigger('populate');
                        },
                        populate: function() {
                            var app = FormBuilder.getInputValue('app') || appId.app;
                            var versions = opts.populateVersionFunc(app, STATUS.SNAPSHOT);
                            FormBuilder.populateTextSelect($(this).parent(), versions);
                        }
                    }
                },
                branch: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'New branch',
                    data: appId.branch,
                    listeners: {
                        populate: function() {
                            var app = FormBuilder.getInputValue('app');
                            var version = FormBuilder.getInputValue('version');
                            var newAppId = app ? {
                                app: app,
                                version: version,
                                status: STATUS.SNAPSHOT,
                                branch: 'HEAD'
                            } : appId;
                            var branches = opts.populateBranchFunc(newAppId);
                            FormBuilder.populateTextSelect($(this).parent(), branches);
                        }
                    }
                },
                cubeName: {
                    label: 'New n-cube name',
                    data: opts.cubeName
                }
            }
        };
    }

    /*
     * additional required options:
     *  appSelectList
     *  populateVersionFunc
     *  populateCubeFunc
     *  populateAxisFunc
     */
    function addAxis(opts) {
        return {
            title: 'Add Axis',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Add Axis',
            formInputs: {
                name: {
                    label: 'Axis name'
                },
                isRef: {
                    label: 'Reference Axis',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    listeners: {
                        change: function() {
                            FormBuilder.toggle('refSection');
                            FormBuilder.toggle('hasTransform');
                            FormBuilder.toggle('transformSection', false);
                        }
                    }
                },
                refSection: {
                    label: 'Reference Axis',
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    hidden: true,
                    formInputs: {
                        refApp: {
                            label: 'Application',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            selectOptions: opts.appSelectList,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('refVer').trigger('populate');
                                    FormBuilder.findElementByKey('refBranch').trigger('populate');
                                    FormBuilder.findElementByKey('refCube').trigger('populate');
                                    FormBuilder.findElementByKey('refAxis').trigger('populate');
                                }
                            }
                        },
                        refVer: {
                            label: 'Version',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('refBranch').trigger('populate');
                                    FormBuilder.findElementByKey('refCube').trigger('populate');
                                    FormBuilder.findElementByKey('refAxis').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.getInputValue('refApp');
                                    var versions = app ? opts.populateVersionFunc(app) : null;
                                    FormBuilder.populateSelect($(this), versions);
                                }
                            }
                        },
                        refBranch: {
                            label: 'Branch',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('refCube').trigger('populate');
                                    FormBuilder.findElementByKey('refAxis').trigger('populate');
                                },
                                populate: function() {
                                    var branches, splitVer;
                                    var app = FormBuilder.getInputValue('refApp');
                                    var version = FormBuilder.getInputValue('refVer');
                                    if (app && version) {
                                        splitVer = version.split('-');
                                        branches = opts.populateBranchFunc(appIdFrom(app, splitVer[0], splitVer[1], 'HEAD'));
                                    }
                                    FormBuilder.populateSelect($(this), branches);
                                }
                            }
                        },
                        refCube: {
                            label: 'Cube',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('refAxis').trigger('populate');
                                },
                                populate: function() {
                                    var cubes, splitVer;
                                    var app = FormBuilder.getInputValue('refApp');
                                    var version = FormBuilder.getInputValue('refVer');
                                    var branch = FormBuilder.getInputValue('refBranch');
                                    if (app && version && branch) {
                                        splitVer = version.split('-');
                                        cubes = opts.populateCubeFunc(appIdFrom(app, splitVer[0], splitVer[1], branch));
                                    }
                                    FormBuilder.populateSelect($(this), cubes);
                                }
                            }
                        },
                        refAxis: {
                            label: 'Axis',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    var axis, splitVer;
                                    var app = FormBuilder.getInputValue('refApp');
                                    var version = FormBuilder.getInputValue('refVer');
                                    var branch = FormBuilder.getInputValue('refBranch');
                                    var cube = FormBuilder.getInputValue('refCube');
                                    if (app && version && branch && cube) {
                                        splitVer = version.split('-');
                                        axis = opts.populateAxisFunc(appIdFrom(app, splitVer[0], splitVer[1], branch), cube, $(this).val());
                                        FormBuilder.setInputValue('type', axis.type);
                                        FormBuilder.setInputValue('valueType', axis.valueType);
                                    }
                                },
                                populate: function() {
                                    var axisNames, splitVer;
                                    var app = FormBuilder.getInputValue('refApp');
                                    var version = FormBuilder.getInputValue('refVer');
                                    var branch = FormBuilder.getInputValue('refBranch');
                                    var cube = FormBuilder.getInputValue('refCube');
                                    if (app && version && branch && cube) {
                                        splitVer = version.split('-');
                                        axisNames = opts.populateAxisFunc(appIdFrom(app, splitVer[0], splitVer[1], branch), cube);
                                    }
                                    FormBuilder.populateSelect($(this), axisNames);
                                }
                            }
                        }
                    }
                },
                hasTransform: {
                    label: 'Transform',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    hidden: true,
                    listeners: {
                        change: function() {
                            FormBuilder.toggle('transformSection');
                        }
                    }
                },
                transformSection: {
                    label: 'Transform',
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    hidden: true,
                    formInputs: {
                        transApp: {
                            label: 'Application',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            selectOptions: opts.appSelectList,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('transVer').trigger('populate');
                                    FormBuilder.findElementByKey('transBranch').trigger('populate');
                                    FormBuilder.findElementByKey('transCube').trigger('populate');
                                }
                            }
                        },
                        transVer: {
                            label: 'Version',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('transBranch').trigger('populate');
                                    FormBuilder.findElementByKey('transCube').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.getInputValue('transApp');
                                    var versions = app ? opts.populateVersionFunc(app) : null;
                                    FormBuilder.populateSelect($(this), versions);
                                }
                            }
                        },
                        transBranch: {
                            label: 'Branch',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                change: function() {
                                    FormBuilder.findElementByKey('transCube').trigger('populate');
                                },
                                populate: function() {
                                    var branches, splitVer;
                                    var app = FormBuilder.getInputValue('transApp');
                                    var version = FormBuilder.getInputValue('transVer');
                                    if (app && version) {
                                        splitVer = version.split('-');
                                        branches = opts.populateBranchFunc(appIdFrom(app, splitVer[0], splitVer[1], 'HEAD'))
                                    }
                                    FormBuilder.populateSelect($(this), branches);
                                }
                            }
                        },
                        transCube: {
                            label: 'Cube',
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            listeners: {
                                populate: function() {
                                    var cubes, splitVer;
                                    var app = FormBuilder.getInputValue('transApp');
                                    var version = FormBuilder.getInputValue('transVer');
                                    var branch = FormBuilder.getInputValue('transBranch');
                                    if (app && version && branch) {
                                        splitVer = version.split('-');
                                        cubes = opts.populateCubeFunc(appIdFrom(app, splitVer[0], splitVer[1], branch));
                                    }
                                    FormBuilder.populateSelect($(this), cubes);
                                }
                            }
                        }
                    }
                },
                type: {
                    label: 'Axis type (Discrete, Range, Set, Nearest, Rule)',
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    selectOptions: AXIS_TYPE_LIST.TYPE,
                    data: 'DISCRETE',
                    listeners: {
                        change: function() {
                            var type = this.value;
                            FormBuilder.findElementByKey('valueType').trigger('populate');
                            FormBuilder.toggle('default', type !== 'NEAREST');
                            FormBuilder.toggle('sorted', ['RULE','NEAREST'].indexOf(type) === -1);
                            FormBuilder.toggle('fireAll', type === 'RULE');
                        }
                    }
                },
                valueType: {
                    label: 'Column data type (String, Date, Integer, ...)',
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    data: AXIS_SUBTYPES.STRING,
                    listeners: {
                        populate: function() {
                            var axisType = FormBuilder.getInputValue('type');
                            var isRuleAxis = axisType === 'RULE';
                            var valueTypes = isRuleAxis ? AXIS_TYPE_LIST.RULE_SUBTYPE : AXIS_TYPE_LIST.GENERAL_SUBTYPE;
                            var initVal = isRuleAxis ? 'EXPRESSION' : 'STRING';
                            FormBuilder.populateSelect($(this), valueTypes, initVal);
                        }
                    }
                },
                default: {
                    label: 'Has Default Column',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    default: true
                },
                sorted: {
                    label: 'Sorted',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX
                },
                fireAll: {
                    label: 'Fire all matching (versus first matching)',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    hidden: true
                }
            }
        };
    }

    /*
     * additional required options:
     *  axisName
     */
    function deleteAxis(opts) {
        return {
            title: 'Delete Axis - ' + opts.axisName,
            instructionsTitle: '',
            instructionsText: 'Note: All cells will be cleared when an axis is deleted.',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Delete Axis',
            formInputs: {
                name: {
                    label: 'Axis to delete',
                    readonly: true,
                    data: opts.axisName
                }
            }
        };
    }

    /*
     * additional required options:
     *  axis
     */
    function updateAxis(opts) {
        var axis = opts.axis;
        var metaProps = axis.metaProps || {};
        return {
            title: 'Update Axis - ' + axis.name,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            formInputs: {
                name: {
                    label: 'Axis name',
                    data: axis.name
                },
                refSection: {
                    label: 'Reference Axis',
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    hidden: !axis.isRef,
                    readonly: true,
                    formInputs: {
                        refApp: {
                            label: 'Application',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            data: metaProps.referenceApp
                        },
                        refVer: {
                            label: 'Version',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            data: metaProps.referenceVersion + '-' + metaProps.referenceStatus
                        },
                        refBranch: {
                            label: 'Branch',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            data: metaProps.referenceBranch
                        },
                        refCube: {
                            label: 'Cube',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            data: metaProps.referenceCubeName
                        },
                        refAxis: {
                            label: 'Axis',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            data: metaProps.referenceAxisName
                        }
                    }
                },
                transformSection: {
                    label: 'Transform',
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    hidden: !metaProps.transformApp,
                    readonly: true,
                    formInputs: {
                        transApp: {
                            label: 'Application',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            readonly: true,
                            hidden: !metaProps.transformApp,
                            data: metaProps.transformApp
                        },
                        transVer: {
                            label: 'Version',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            readonly: true,
                            hidden: !metaProps.transformApp,
                            data: metaProps.transformVersion + '-' + metaProps.transformStatus
                        },
                        transBranch: {
                            label: 'Branch',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            readonly: true,
                            hidden: !metaProps.transformApp,
                            data: metaProps.transformBranch
                        },
                        transCube: {
                            label: 'Cube',
                            layout: FormBuilder.INPUT_LAYOUT.TABLE,
                            readonly: true,
                            hidden: !metaProps.transformApp,
                            data: metaProps.transformCubeName
                        }
                    }
                },
                type: {
                    label: 'Axis type (Discrete, Range, Set, Nearest, Rule)',
                    readonly: true,
                    data: axis.type.name
                },
                valueType: {
                    label: 'Column data type (String, Date, Integer, ...)',
                    readonly: true,
                    data: axis.valueType.name
                },
                default: {
                    label: 'Has Default Column',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    hidden: axis.type.name === 'NEAREST',
                    data: axis.defaultCol,
                    default: false
                },
                sorted: {
                    label: 'Sorted',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    readonly: axis.isRef,
                    hidden: ['RULE','NEAREST'].indexOf(axis.type.name) > -1,
                    data: !axis.preferredOrder,
                    default: false
                },
                fireAll: {
                    label: 'Fire all matching (versus first matching)',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    hidden: axis.type.name !== 'RULE',
                    data: axis.fireAll,
                    default: false
                }
            }
        };
    }

    /*
     * additional required options:
     *  cubeName
     *  refClick
     */
    function outboundRefs(opts) {
        return {
            title: 'Outbound refs of - ' + opts.cubeName,
            displayType: FormBuilder.DISPLAY_TYPE.TABLE,
            size: FormBuilder.MODAL_SIZE.MEDIUM,
            readonly: true,
            onClose: opts.onClose,
            closeButtonText: 'Close',
            hasFilter: true,
            css: {},
            columns: {
                refCube: {
                    type: FormBuilder.INPUT_TYPE.LINK,
                    css: {},
                    listeners: {
                        click: opts.refClick
                    }
                }
            }
        };
    }

    /*
     * additional required options:
     *  cubeName
     */
    function requiredScope(opts) {
        return {
            title: 'Scope for - ' + opts.cubeName,
            displayType: FormBuilder.DISPLAY_TYPE.TABLE,
            size: FormBuilder.MODAL_SIZE.MEDIUM,
            readonly: true,
            onClose: opts.onClose,
            closeButtonText: 'Close',
            hasFilter: true,
            css: {},
            columns: {
                scopeKey: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    css: {}
                }
            }
        };
    }

    /*
     * additional required options:
     *  leftAppId
     *  leftCube
     *  rightAppId
     *  rightCube
     *  leftDisabled
     *  appSelectList
     *  populateVersionFunc
     *  populateBranchFunc
     *  populateCubeFunc
     */
    function globalComparator(opts) {
        return {
            title: 'Compare Any Two Cubes',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Compare',
            formInputs: {
                appRow: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: { margin: '0 auto', width: '90%'},
                    data: [{
                        appLabel: 'Application',
                        leftApp: [opts.leftAppId.app],
                        rightApp: [opts.rightAppId.app]
                    }],
                    columns: {
                        appLabel: {
                            type: FormBuilder.INPUT_TYPE.READONLY,
                            css: { width: '20%' }
                        },
                        leftApp: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            selectOptions: opts.appSelectList,
                            readonly: opts.leftDisabled,
                            css: { width: '40%' },
                            listeners: {
                                load: function() { $(this).trigger('change'); },
                                change: function() {
                                    FormBuilder.findTableElementsByKey('leftVersion').trigger('populate');
                                    FormBuilder.findTableElementsByKey('leftBranch').trigger('populate');
                                    FormBuilder.findTableElementsByKey('leftCube').trigger('populate');
                                }
                            }
                        },
                        rightApp: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            selectOptions: opts.appSelectList,
                            css: { width: '40%' },
                            listeners: {
                                load: function() { $(this).trigger('change'); },
                                change: function() {
                                    FormBuilder.findTableElementsByKey('rightVersion').trigger('populate');
                                    FormBuilder.findTableElementsByKey('rightBranch').trigger('populate');
                                    FormBuilder.findTableElementsByKey('rightCube').trigger('populate');
                                }
                            }
                        }
                    }
                },
                versionRow: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: { margin: '0 auto', width: '90%'},
                    data: [{
                        versionLabel: 'Version',
                        leftVersion: [opts.leftAppId.version + '-' + opts.rightAppId.status],
                        rightVersion: [opts.rightAppId.version + '-' + opts.rightAppId.status]
                    }],
                    columns: {
                        versionLabel: {
                            type: FormBuilder.INPUT_TYPE.READONLY,
                            css: { width: '20%' }
                        },
                        leftVersion: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            readonly: opts.leftDisabled,
                            css: { width: '40%' },
                            listeners: {
                                change: function() {
                                    FormBuilder.findTableElementsByKey('leftBranch').trigger('populate');
                                    FormBuilder.findTableElementsByKey('leftCube').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('leftApp').val();
                                    var versions = opts.populateVersionFunc(app || opts.leftAppId.app);
                                    var def = app ? '' : opts.leftAppId.version + '-' + opts.leftAppId.status;
                                    FormBuilder.populateSelect($(this), versions, def);
                                }
                            }
                        },
                        rightVersion: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            css: { width: '40%' },
                            listeners: {
                                change: function() {
                                    FormBuilder.findTableElementsByKey('rightBranch').trigger('populate');
                                    FormBuilder.findTableElementsByKey('rightCube').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('rightApp').val();
                                    var versions = opts.populateVersionFunc(app || opts.rightAppId.app);
                                    var def = app ? '' : opts.rightAppId.version + '-' + opts.rightAppId.status;
                                    FormBuilder.populateSelect($(this), versions, def);
                                }
                            }
                        }
                    }
                },
                branchRow: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: { margin: '0 auto', width: '90%'},
                    data: [{
                        branchLabel: 'Branch',
                        leftBranch: [opts.leftAppId.branch],
                        rightBranch: [opts.rightAppId.branch]
                    }],
                    columns: {
                        branchLabel: {
                            type: FormBuilder.INPUT_TYPE.READONLY,
                            css: { width: '20%' }
                        },
                        leftBranch: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            readonly: opts.leftDisabled,
                            css: { width: '40%' },
                            listeners: {
                                change: function() {
                                    FormBuilder.findTableElementsByKey('leftCube').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('leftApp').val();
                                    var version = FormBuilder.findTableElementsByKey('leftVersion').val();
                                    var verstat = version ? version.split('-') : version;
                                    var newAppId = app && verstat ? appIdFrom(app, verstat[0], verstat[1], 'HEAD') : opts.leftAppId;
                                    var branches = opts.populateBranchFunc(newAppId);
                                    FormBuilder.populateSelect($(this), branches, newAppId.branch);
                                }
                            }
                        },
                        rightBranch: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            css: { width: '40%' },
                            listeners: {
                                change: function() {
                                    FormBuilder.findTableElementsByKey('rightCube').trigger('populate');
                                },
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('rightApp').val();
                                    var version = FormBuilder.findTableElementsByKey('rightVersion').val();
                                    var verstat = version ? version.split('-') : version;
                                    var newAppId = app && verstat ? appIdFrom(app, verstat[0], verstat[1], 'HEAD') : opts.rightAppId;
                                    var branches = opts.populateBranchFunc(newAppId);
                                    FormBuilder.populateSelect($(this), branches, newAppId.branch);
                                }
                            }
                        }
                    }
                },
                cubeRow: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: { margin: '0 auto', width: '90%'},
                    data: [{
                        cubeLabel: 'Cube',
                        leftCube: [opts.leftAppId.cube],
                        rightCube: [opts.rightAppId.cube]
                    }],
                    columns: {
                        cubeLabel: {
                            type: FormBuilder.INPUT_TYPE.READONLY,
                            css: { width: '20%' }
                        },
                        leftCube: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            readonly: opts.leftDisabled,
                            css: { width: '40%' },
                            listeners: {
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('leftApp').val();
                                    var version = FormBuilder.findTableElementsByKey('leftVersion').val();
                                    var branch = FormBuilder.findTableElementsByKey('leftBranch').val();
                                    var verstat = version ? version.split('-') : version;
                                    var newAppId = app && verstat && branch ? appIdFrom(app, verstat[0], verstat[1], branch) : opts.leftAppId;
                                    var cubes = opts.populateCubeFunc(newAppId);
                                    FormBuilder.populateSelect($(this), cubes, opts.leftCube);
                                }
                            }
                        },
                        rightCube: {
                            type: FormBuilder.INPUT_TYPE.SELECT,
                            css: { width: '40%' },
                            listeners: {
                                populate: function() {
                                    var app = FormBuilder.findTableElementsByKey('rightApp').val();
                                    var version = FormBuilder.findTableElementsByKey('rightVersion').val();
                                    var branch = FormBuilder.findTableElementsByKey('rightBranch').val();
                                    var verstat = version ? version.split('-') : version;
                                    var newAppId = app && verstat && branch ? appIdFrom(app, verstat[0], verstat[1], branch) : opts.rightAppId;
                                    var cubes = opts.populateCubeFunc(newAppId);
                                    FormBuilder.populateSelect($(this), cubes, opts.rightCube);
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    /*
     * additional required options:
     *  onCreate
     *  branchNames
     *  onBranchClick
     */
    function selectBranch(opts) {
        return {
            title: 'Select or Create Branch',
            instructionsTitle: '',
            instructionsText: 'Before a change can be made, a <b>branch</b> must be selected or created.',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            onClose: opts.onClose,
            hasFilter: true,
            formInputs: {
                name: {
                    label: 'New branch name',
                    buttonLabel: 'Create',
                    buttonClick: function() {
                        opts.onCreate(FormBuilder.getInputValue('name'));
                    }
                },
                selectBranchSection: {
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    label: 'Select existing branch',
                    sectionType: FormBuilder.BOOTSTRAP_TYPE.PRIMARY,
                    formInputs: {
                        branchList: {
                            type: FormBuilder.INPUT_TYPE.TABLE,
                            css: { 'max-height':'300px;' },
                            data: opts.branchNames,
                            columns: {
                                branchName: {
                                    type: FormBuilder.INPUT_TYPE.BUTTON,
                                    css: {},
                                    listeners: {
                                        click: function(e) {
                                            opts.onBranchClick(e.target.textContent);
                                            FormBuilder.closeBuilderModal();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    /*
     * additional required options:
     *  app
     *  version
     */
    function createSnapshotFromRelease(opts) {
        var setNextVer = function(e, versionPart) {
            var nextVersion = getNextVersion(opts.version, versionPart);
            FormBuilder.setInputValue('newVersion', nextVersion);
            e.preventDefault();
        };
        return {
            title: 'Copy ' + opts.app + ' ' + opts.version + '-' + STATUS.RELEASE,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Create',
            formInputs: {
                questionLabel: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'What kind of version is this?'
                },
                major: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Major',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.MAJOR);
                        }
                    }
                },
                minor: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Minor',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.MINOR);
                        }
                    }
                },
                patch: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Patch',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.PATCH);
                        }
                    }
                },
                newVersion: {
                    label: 'New SNAPSHOT version',
                    readonly: true,
                    placeholder: 'Version number major.minor.patch'
                }
            }
        };
    }

    /*
     * additional required options:
     *  app
     *  version
     *  initProgress
     *  initProgressInfo
     *  optional - newVersion
     */
    function releaseVersion(opts) {
        var setNextVer = function(e, versionPart) {
            var nextVersion = getNextVersion(opts.version, versionPart);
            FormBuilder.setInputValue('newVersion', nextVersion);
            e.preventDefault();
        };
        return {
            updateProgress: function(progress, msg) {
                FormBuilder.setInputValue('progressBar', progress);
                FormBuilder.setInputValue('progressInfo', msg);
            },
            toggleReleaseButton: function(state) {
                $('.form-builder-save').toggle(state);
            },
            title: 'Release ' + opts.app + ' ' + opts.version + '-' + STATUS.SNAPSHOT,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Release',
            closeButtonText: 'Close',
            closeAfterSave: false,
            formInputs: {
                questionLabel: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'What kind of version is this?'
                },
                major: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Major',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.MAJOR);
                        }
                    }
                },
                minor: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Minor',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.MINOR);
                        }
                    }
                },
                patch: {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: 'btn-primary',
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Patch',
                    listeners: {
                        click: function(e) {
                            setNextVer(e, VERSION.PATCH);
                        }
                    }
                },
                newVersion: {
                    label: 'New SNAPSHOT version',
                    readonly: true,
                    placeholder: 'Version number major.minor.patch',
                    data: opts.newVersion
                },
                progressBar: {
                    type: FormBuilder.INPUT_TYPE.PROGRESS,
                    progressClass: 'progress-bar-striped',
                    data: opts.initProgress
                },
                progressInfo: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    label: opts.initProgressInfo
                }
            }
        };
    }

    /*
     * additional required options:
     *  app
     *  version
     */
    function changeSnapshotVersion(opts) {
        return {
            title: 'Change ' + opts.app + ' ' + opts.version,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Change',
            formInputs: {
                newVersion: {
                    label: 'Change to',
                    placeholder: 'Version number major.minor.patch'
                }
            }
        };
    }

    /*
     * additional required options:
     *  refAxList
     *  isTransform
     *  appSelectList
     *  populateVersionFunc
     *  populateBranchFunc
     *  populateCubeFunc
     */
    function referenceAxisUpdater(opts) {
        function getUpdateRowColumns() {
            function populateAxis() {
                populateTableElement('updateAxis');
            }

            function populateCube() {
                populateTableElement('updateCube');
                populateAxis();
            }

            function populateBranch() {
                populateTableElement('updateBranch');
                populateCube();
            }

            function populateVersion() {
                populateTableElement('updateVersion');
                populateBranch();
            }

            function getUpdateRowValue(key) {
                return FormBuilder.findTableElementsByKey(key).val();
            }

            function getUpdateApp() {
                return getUpdateRowValue('updateApp');
            }

            function getUpdateVersionStatus() {
                var version = getUpdateRowValue('updateVersion');
                return version ? version.split('-') : null;
            }

            function getUpdateBranch() {
                return getUpdateRowValue('updateBranch');
            }

            function getLabelColumnSpec() {
                return {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    css: { width: '5%' }
                };
            }

            function getSelectColumnSpec() {
                return {
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    css: { width: '15%' }
                };
            }

            var columns = {};

            columns.appLabel = getLabelColumnSpec();
            columns.updateApp = getSelectColumnSpec();
            columns.updateApp.selectOptions = opts.appSelectList;
            columns.updateApp.listeners = {
                load: function() { $(this).trigger('change'); },
                change: function() { populateVersion(); }
            };

            columns.versionLabel = getLabelColumnSpec();
            columns.updateVersion = getSelectColumnSpec();
            columns.updateVersion.listeners = {
                change: function() { populateBranch(); },
                populate: function() {
                    var app = getUpdateApp();
                    var versions = app ? opts.populateVersionFunc(app) : null;
                    FormBuilder.populateSelect($(this), versions);
                }
            };

            columns.branchLabel = getLabelColumnSpec();
            columns.updateBranch = getSelectColumnSpec();
            columns.updateBranch.listeners = {
                change: function() { populateCube(); },
                populate: function() {
                    var app = getUpdateApp();
                    var verstat = getUpdateVersionStatus();
                    var branches = (app && verstat) ? opts.populateBranchFunc(appIdFrom(app, verstat[0], verstat[1], 'HEAD')) : null;
                    FormBuilder.populateSelect($(this), branches);
                }
            };

            columns.cubeLabel = getLabelColumnSpec();
            columns.updateCube = getSelectColumnSpec();
            columns.updateCube.listeners = {
                change: function() { populateAxis(); },
                populate: function() {
                    var app = getUpdateApp();
                    var verstat = getUpdateVersionStatus();
                    var branch = getUpdateBranch();
                    var cubes = (app && verstat && branch) ? opts.populateCubeFunc(appIdFrom(app, verstat[0], verstat[1], branch)) : null;
                    FormBuilder.populateSelect($(this), cubes);
                }
            };

            if (!opts.isTransform) {
                columns.axisLabel = getLabelColumnSpec();
                columns.updateAxis = getSelectColumnSpec();
                columns.updateAxis.listeners = {
                    populate: function () {
                        var app = getUpdateApp();
                        var verstat = getUpdateVersionStatus();
                        var branch = getUpdateBranch();
                        var cube = getUpdateRowValue('updateCube');
                        var axisNames = (app && verstat && branch && cube) ? opts.populateAxisFunc(appIdFrom(app, verstat[0], verstat[1], branch), cube) : null;
                        FormBuilder.populateSelect($(this), axisNames);
                    }
                };
            }

            return columns;
        }

        function getRefAxTableColumns() {
            function getSortableReadonlyColumnSpec(heading, width) {
                return {
                    heading: heading,
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    sortable: true,
                    css: {width: width, overflow: 'hidden', 'text-overflow': 'ellipsis'}
                }
            }

            var prefix = opts.isTransform ? 'transform' : 'dest';
            var columns = {};

            columns.isApplied = {
                heading: 'Apply',
                type: FormBuilder.INPUT_TYPE.CHECKBOX,
                css: {width: '4%', overflow:'hidden', 'text-overflow':'ellipsis'}
            };

            columns.srcCubeName = getSortableReadonlyColumnSpec('Source Cube', '32%');
            columns.srcAxisName = getSortableReadonlyColumnSpec('Source Axis', '32%');
            columns[prefix + 'App'] = getSortableReadonlyColumnSpec('App', '10%');
            columns[prefix + 'Version'] = getSortableReadonlyColumnSpec('Version', '5%');
            columns[prefix + 'Branch'] = getSortableReadonlyColumnSpec('Branch', '10%');
            columns[prefix + 'CubeName'] = getSortableReadonlyColumnSpec('Cube', '16%');

            if (!opts.isTransform) {
                columns.destAxisName = getSortableReadonlyColumnSpec('Axis', '13%');
            }

            return columns;
        }

        function getFooterButtons() {
            return opts.isTransform ? {
                breakTransform: {
                    buttonClass: 'btn-primary',
                    label: 'Break Transform',
                    action: function() {
                        FormBuilder.setDataValue('breakTransform', true);
                        FormBuilder.closeBuilderModal(true);
                    }
                }
            } : {};
        }

        var heading = opts.isTransform ? 'Transform' : 'Destination';
        return {
            title: 'Reference Axis Batch Updater - ' + heading,
            instructionsTitle: 'Instructions - Update Reference Axis ' + heading,
            instructionsText: 'Update the reference axis ' + heading.toLowerCase() + ' properties of checked reference axes. Only selected fields will change, blank fields will not be changed.',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            size: FormBuilder.MODAL_SIZE.XL,
            hasFilter: true,
            hasSelectAllNone: true,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            data: {
                refAxList: opts.refAxList,
                isTransform: opts.isTransform
            },
            closeAfterSave: false,
            saveButtonText: 'Update',
            closeButtonText: 'Close',
            footerButtons: getFooterButtons(),
            formInputs: {
                updateRow: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: { margin: '0 auto', width: '90%'},
                    data: [{
                        appLabel: 'App',
                        versionLabel: 'Version',
                        branchLabel: 'Branch',
                        cubeLabel: 'Cube',
                        axisLabel: 'Axis'
                    }],
                    columns: getUpdateRowColumns()
                },
                refAxTable: {
                    type: FormBuilder.INPUT_TYPE.TABLE,
                    css: {
                        margin: '0',
                        width: '100%',
                        'table-layout':'fixed',
                        'max-height': '400px'
                    },
                    data: opts.refAxList,
                    columns: getRefAxTableColumns()
                }
            }
        };
    }

    /*
     * additional required options:
     */
    function deleteAllTests(opts) {
        return {
            title: 'Delete all tests?',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            size: FormBuilder.MODAL_SIZE.SMALL,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Delete',
            formInputs: {
                surety: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    label: 'Are you sure?'
                }
            }
        };
    }

    /*
     * additional required options:
     *  axisName
     *  axisNames
     *  columnData
     *  onAxisChange
     */
    function hideColumns(opts) {
        var columnListColumns = {
            isShown: {
                type: FormBuilder.INPUT_TYPE.CHECKBOX
            },
            columnName: {
                type: FormBuilder.INPUT_TYPE.READONLY,
                css: {}
            },
            columnId: {
                type: FormBuilder.INPUT_TYPE.READONLY,
                css: { display: 'none' }
            }
        };
        return {
            title: 'Hide columns for ' + opts.axisName,
            instructionsTitle: 'Instructions - Hide Column',
            instructionsText: 'Select columns to show. Deselect columns to hide.',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: false,
            onClose: opts.onClose,
            hasFilter: true,
            hasSelectAllNone: true,
            saveButtonText: 'Apply',
            afterSave: opts.afterSave,
            formInputs: {
                axisLabel: {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: 'Change Axis:'
                },
                axisName: {
                    type: FormBuilder.INPUT_TYPE.SELECT,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    selectOptions: opts.axisNames,
                    default: opts.axisName,
                    listeners: {
                        change: function() {
                            var data = FormBuilder.copyFormTableDataToModel(columnListColumns);
                            data.axisName = opts.axisName;
                            opts.afterSave(data);
                            opts.onAxisChange($(this).val());
                        }
                    }
                },
                hideColumnSection: {
                    type: FormBuilder.INPUT_TYPE.SECTION,
                    label: '',
                    formInputs: {
                        columnList: {
                            type: FormBuilder.INPUT_TYPE.TABLE,
                            css: {},
                            data: opts.columnData,
                            columns: columnListColumns
                        }
                    }
                }
            }
        };
    }

    /*
     * additional required options:
     *  cubeName
     *  numRows
     *  onAxisClick
     *  axisData - array
     *      name
     *      buttonClass
     *      columnLength
     */
    function largeCubeHideColumns(opts) {
        function getAxisInputs(axisData) {
            var i, len, axisInfo, axisName;
            var formInputs = {};

            for (i = 0, len = axisData.length; i < len; i++) {
                axisInfo = axisData[i];
                axisName = axisInfo.name;
                formInputs[axisName + 'Button'] = {
                    type: FormBuilder.INPUT_TYPE.BUTTON,
                    buttonClass: axisInfo.buttonClass,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: axisName,
                    listeners: {
                        click: function(e) {
                            e.preventDefault();
                            opts.onAxisClick(this.textContent);
                        }
                    }
                };
                formInputs[axisName + 'Label'] = {
                    type: FormBuilder.INPUT_TYPE.READONLY,
                    layout: FormBuilder.INPUT_LAYOUT.INLINE,
                    label: axisInfo.columnLength + ' columns'
                };
                formInputs[axisName + 'Newline'] = {
                    type: FormBuilder.INPUT_TYPE.READONLY
                };
            }

            return formInputs;
        }

        return {
            title: opts.cubeName,
            instructionsTitle: 'Instructions - Viewable Area Is Too Large',
            instructionsText: 'Select an axis to hide columns and shrink the workable area for '
                + 'this cube. You can hide columns on multiple axes. The viewable row limitation is set at '
                + MAX_VISIBLE_ROWS.toLocaleString() + '. You are currently trying to view ' + opts.numRows.toLocaleString() + ' rows.',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            closeButtonText: 'Close',
            formInputs: getAxisInputs(opts.axisData)
        };
    }

    /*
     * additional required options:
     *  axisName
     *  appSelectList
     *  populateVersionFunc
     *  populateBranchFunc
     *  populateCubeFunc
     *  populateAxisFunc
     */
    function createReferenceFromAxis(opts) {
        function buildFormInputs(exists) {
            function populateAxis() {
                if (exists) {
                    populateFormElement('refAxis');
                }
            }

            function populateCube() {
                populateFormElement('refCube');
                populateAxis();
            }

            function populateBranch() {
                populateFormElement('refBranch');
                populateCube();
            }

            function populateVersion() {
                populateFormElement('refVer');
                populateBranch();
            }

            function getValue(key) {
                return FormBuilder.findElementByKey(key).val();
            }

            function getRefApp() {
                return getValue('refApp');
            }

            function getRefVersionStatus() {
                var version = getValue('refVer');
                return version ? version.split('-') : null;
            }

            function getRefBranch() {
                return getValue('refBranch');
            }

            function getInputType() {
                return exists ? FormBuilder.INPUT_TYPE.SELECT : FormBuilder.INPUT_TYPE.TEXT_SELECT;
            }

            function getInputLayout() {
                return exists ? FormBuilder.INPUT_LAYOUT.TABLE : FormBuilder.INPUT_LAYOUT.NEW_LINE;
            }

            function addTypeAndLayoutToInputs(formInputs) {
                var i, len, input;
                var keys = Object.keys(formInputs);
                for (i = 0, len = keys.length; i < len; i++) {
                    input = formInputs[keys[i]];
                    input.type = getInputType();
                    input.layout = getInputLayout();
                }
            }

            function formBuilderPopulate(el, content) {
                if (exists) {
                    FormBuilder.populateSelect(el, content);
                } else {
                    FormBuilder.populateTextSelect(el.parent(), content);
                }
            }

            function removeReleasesFromVersionList(versions) {
                var i, len, version;
                var newList = [];
                for (i = 0, len = versions.length; i < len; i++) {
                    version = versions[i];
                    if (version.indexOf(STATUS.RELEASE) === -1) {
                        newList.push(version);
                    }
                }
                return newList;
            }

            var formInputs = {
                refApp: {
                    label: 'Application',
                    selectOptions: opts.appSelectList,
                    listeners: {
                        change: populateVersion
                    }
                },
                refVer: {
                    label: 'Version',
                    listeners: {
                        change: populateBranch,
                        populate: function() {
                            var app = getRefApp();
                            var versions = app ? opts.populateVersionFunc(app) : null;
                            if (versions && !exists) {
                                versions = removeReleasesFromVersionList(versions);
                            }
                            formBuilderPopulate($(this), versions);
                        }
                    }
                },
                refBranch: {
                    label: 'Branch',
                    listeners: {
                        change: populateCube,
                        populate: function() {
                            var app = getRefApp();
                            var verstat = getRefVersionStatus();
                            var branches = (app && verstat) ? opts.populateBranchFunc(appIdFrom(app, verstat[0], verstat[1], 'HEAD')) : null;
                            if (branches && !exists) {
                                branches.splice(0, 1); // remove HEAD
                            }
                            formBuilderPopulate($(this), branches);
                        }
                    }
                },
                refCube: {
                    label: 'Cube',
                    listeners: {
                        change: populateAxis,
                        populate: function() {
                            var app = getRefApp();
                            var verstat = getRefVersionStatus();
                            var branch = getRefBranch();
                            var cubes = (app && verstat && branch) ? opts.populateCubeFunc(appIdFrom(app, verstat[0], verstat[1], branch)) : null;
                            formBuilderPopulate($(this), cubes);
                        }
                    }
                },
                refAxis: {
                    label: 'Axis',
                    listeners: {
                        populate: function() {
                            var app = getRefApp();
                            var verstat = getRefVersionStatus();
                            var branch = getRefBranch();
                            var cube = getValue('refCube');
                            var axisNames = (app && verstat && branch && cube) ? opts.populateAxisFunc(appIdFrom(app, verstat[0], verstat[1], branch), cube) : null;
                            formBuilderPopulate($(this), axisNames);
                        }
                    }
                }
            };

            addTypeAndLayoutToInputs(formInputs);
            return formInputs;
        }

        function buildSection(exists) {
            return {
                label: '',
                type: FormBuilder.INPUT_TYPE.SECTION,
                hidden: !exists,
                formInputs: buildFormInputs(exists)
            };
        }

        return {
            title: 'Create Reference - ' + opts.axisName,
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Save',
            formInputs: {
                isExistingRef: {
                    label: 'Existing Reference Axis',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    default: true,
                    listeners: {
                        change: function() {
                            FormBuilder.toggle('existingSection');
                            FormBuilder.toggle('nonExistingSection');
                        }
                    }
                },
                existingSection: buildSection(true),
                nonExistingSection: buildSection(false)
            }
        };
    }

    /*
     * additional required options:
     *  appId
     *  cubeName
     *  appSelectList
     *  populateVersionFunc
     */
    function newCube(opts) {
        var appId = opts.appId;
        return {
            title: 'New n-cube',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'Create',
            formInputs: {
                app: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'App',
                    selectOptions: opts.appSelectList,
                    data: appId.app,
                    listeners: {
                        change: function() {
                            populateFormElement('version');
                        }
                    }
                },
                version: {
                    type: FormBuilder.INPUT_TYPE.TEXT_SELECT,
                    label: 'SNAPSHOT Version',
                    data: appId.version,
                    listeners: {
                        populate: function() {
                            var app = FormBuilder.getInputValue('app') || appId.app;
                            var versions = opts.populateVersionFunc(app);
                            FormBuilder.populateTextSelect($(this).parent(), versions);
                        }
                    }
                },
                cubeName: {
                    label: 'New n-cube name'
                }
            }
        };
    }

    /*
     * additional required options:
     *  title
     *  saveButtonText
     *  onHtmlClick
     *  onJsonClick
     */
    function showCubeList(opts) {
        function getValue(tr, key) {
            return tr.find('.' + key)[0].textContent;
        }

        function getViewButton(text, func) {
            return {
                type: FormBuilder.INPUT_TYPE.BUTTON,
                css: {width: '9%'},
                default: text,
                listeners: {
                    click: function(e) {
                        var tr = $(e.target).closest('tr');
                        var cubeName = getValue(tr, 'cubeName');
                        var cubeId = getValue(tr, 'cubeId');
                        var revId = getValue(tr, 'revId');
                        e.preventDefault();
                        func(cubeName, cubeId, revId);
                    }
                }
            };
        }

        function getColumns() {
            var i, len, key;
            var columns = {};
            var buttons = opts.cubeButtons;
            var keys = Object.keys(buttons);

            for (i = 0, len = keys.length; i < len; i++) {
                key = keys[i];
                columns[key] = getViewButton(key, buttons[key]);
            }

            columns.isSelected = {
                heading: '',
                type: FormBuilder.INPUT_TYPE.CHECKBOX,
                css: {}
            };
            columns.cubeName = {
                heading: '',
                type: FormBuilder.INPUT_TYPE.READONLY,
                css: {}
            };
            columns.cubeId = {
                heading: '',
                type: FormBuilder.INPUT_TYPE.READONLY,
                css: { display: 'none' }
            };
            columns.revId = {
                heading: '',
                type: FormBuilder.INPUT_TYPE.READONLY,
                css: { display: 'none' }
            };

            return columns;
        }

        return {
            displayType: FormBuilder.DISPLAY_TYPE.TABLE,
            title: opts.title,
            saveButtonText: opts.saveButtonText,
            readonly: opts.readonly,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            hasFilter: true,
            hasSelectAllNone: true,
            css: {margin: '0', width: '100%'},
            columns: getColumns()
        };
    }

    /*
     * additional required options:
     *  loadAll
     */
    function cubeDataSearchOptions(opts) {
        return {
            title: 'Search Options',
            displayType: FormBuilder.DISPLAY_TYPE.FORM,
            size: FormBuilder.MODAL_SIZE.SMALL,
            afterSave: opts.afterSave,
            onClose: opts.onClose,
            saveButtonText: 'OK',
            formInputs: {
                loadAll: {
                    label: 'Load all cube data on search',
                    type: FormBuilder.INPUT_TYPE.CHECKBOX,
                    data: opts.loadAll
                }
            }
        };
    }

    return {
        filterData: filterData,
        metaProperties: metaProperties,
        copyBranch: copyBranch,
        deleteAllTests: deleteAllTests,
        deleteBranch: deleteBranch,
        copyCube: copyCube,
        cubeDataSearchOptions: cubeDataSearchOptions,
        newCube: newCube,
        addAxis: addAxis,
        deleteAxis: deleteAxis,
        updateAxis: updateAxis,
        outboundRefs: outboundRefs,
        requiredScope: requiredScope,
        globalComparator: globalComparator,
        hideColumns: hideColumns,
        largeCubeHideColumns: largeCubeHideColumns,
        selectBranch: selectBranch,
        createReferenceFromAxis: createReferenceFromAxis,
        createSnapshotFromRelease: createSnapshotFromRelease,
        changeSnapshotVersion: changeSnapshotVersion,
        releaseVersion: releaseVersion,
        referenceAxisUpdater: referenceAxisUpdater,
        showCubeList: showCubeList
    };
})(jQuery);