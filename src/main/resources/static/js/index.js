//noinspection FunctionTooLongJS
/**
 * NCube Editor
 *     IDE for building and editing NCubes
 *
 * @author John DeRegnaucourt (jdereg@gmail.com)
 *         <br>
 *         Copyright (c) Cedar Software LLC
 *         <br><br>
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *         <br><br>
 *         http://www.apache.org/licenses/LICENSE-2.0
 *         <br><br>
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */

var NCE = (function ($) {
    var head = 'HEAD';
    var _savedCall = null;
    var _searchThread;
    var _heartBeatThread;
    var _cubeList = {};
    var _openCubes = localStorage[OPEN_CUBES];
    var _visitedBranches = localStorage[VISITED_BRANCHES];
    var _selectedCubeName = localStorage[SELECTED_CUBE];
    var _selectedApp = localStorage[SELECTED_APP];
    var _selectedVersion = localStorage[SELECTED_VERSION];
    var _selectedBranch;
    var _selectedStatus = localStorage[SELECTED_STATUS] || STATUS.SNAPSHOT;
    var _activeTabViewType = localStorage[ACTIVE_TAB_VIEW_TYPE];
    var _selectedCubeInfo = localStorage[SELECTED_CUBE_INFO];
    var _defaultTab = null;
    var _appTitle = $('#appTitle');
    var _cubeListDivParent = $('#ncube-list-div');
    var _cubeListDiv = _cubeListDivParent.find('.panel-body');
    var _searchNames = $('#cube-search');
    var _cubeSearchOptionsDiv = $('#cube-search-options');
    var _cubeSearchOptionsBtn = $('#cube-search-options-btn');
    var _cubeSearchOptionsIcon = _cubeSearchOptionsBtn.find('span');
    var _cubeSearchContains = $('#cube-search-contains');
    var _cubeSearchTagsInclude = $('#cube-search-tags-include');
    var _cubeSearchTagsExclude = $('#cube-search-tags-exclude');
    var _cubeCount = $('#ncubeCount');
    var _listOfCubes= $('#ncube-list');
    var _listOfModifiedCubes = $('#ncube-mod-list');
    var _mainTabPanel = $('#ncubeTabContent');
    var _openTabsPanel = $('#ncube-tabs');
    var _openTabList = _openTabsPanel.find('ul');
    var _diffOutput = $('#diffOutput');
    var _searchLastKeyTime = Date.now();
    var _searchKeyPressed = false;
    var _diffLastResult = null;
    var _diffHtmlResult = null;
    var _diffLeftName = '';
    var _diffRightName = '';
    var _diffAppId = null;
    var _diffCubeName = null;
    var _didMergeChange = false;
    var _menuOptions = [];
    var _menuList = $('#menuList');
    var _tabOverflow = $('#tab-overflow');
    var _branchNames = [];
    var _draggingTabCubeInfo = null;
    var _tabDragIndicator = $('#tab-drag-indicator');
    var _appMenu = $('#AppMenu');
    var _versionMenu = $('#VersionMenu');
    var _changeVersionMenu = $('#changeVerMenu');
    var _releaseCubesMenu = $('#releaseCubesMenu');
    var _createSnapshotMenu = $('#createSnapshotMenu');
    var _runAppTestsMenu = $('#runAppTestsMenu');
    var _lockUnlockAppMenu = $('#lockUnlockAppMenu');
    var _getAppLockedByMenu = $('#getAppLockedByMenu');
    var _branchMenu = $('#BranchMenu');
    var _branchCommit = $('#branchCommit');
    var _commitRollbackList = $('#commitRollbackList');
    var _branchQuickSelectHeader = $('#branchQuickSelectHeader');
    var _clearCache = $('#clearCache');
    var _releaseCubesNewVersion = null;
    var _releaseCubesProgressPct = null;
    var _releaseCubesProgressText = null;
    var _isReleasePending = false;
    var _branchCompareUpdateOk = $('#branchCompareUpdateOk');
    var _branchCompareUpdateMenu = $('#branchCompareUpdate');
    var _branchCompareUpdateList = $('#branchCompareUpdateList');
    var _revisionHistoryList = $('#revisionHistoryList');
    var _revisionHistoryLabel = $('#revisionHistoryLabel');
    var _diffModalMerge = $('#diffModalMerge');
    var _diffInstructions = $('#diffInstructions');
    var _commitOk = $('#commitOk');
    var _pullRequestLink = $('#pull-link');
    var _rollbackOk = $('#rollbackOk');
    var _commitRollbackLabel = $('#commitRollbackLabel');
    var _viewPullRequests = $('#view-pull-requests');
    var _viewPullRequestsSearchText = $('#view-pull-requests-search-text');
    var _viewPullRequestsSearchButton = $('#view-pull-requests-search-btn');
    var _viewPullRequestsSearchClear = $('#view-pull-requests-search-clear');
    var _viewPullRequestsList = $('#view-pull-requests-list');
    var _viewPullRequestsApp = $('#view-pull-requests-app');
    var _viewPullRequestsVersion = $('#view-pull-requests-version');
    var _viewPullRequestsBranch = $('#view-pull-requests-branch');
    var _viewPullRequestsStatus = $('#view-pull-requests-status');
    var _viewPullRequestsRequestUser = $('#view-pull-requests-request-user');
    var _viewPullRequestsRequestDate = $('#view-pull-requests-request-date');
    var _viewPullRequestsCommitUser = $('#view-pull-requests-commit-user');
    var _viewPullRequestsCommitDate = $('#view-pull-requests-commit-date');
    var _viewPullRequestsRepo = $('#view-pull-requests-repo');
    var _pullRequestData = {};

    //  modal dialogs
    var _commitModal = $('#commitRollbackModal');
    var _diffModal = $('#diffOutputModal');
    var _branchCompareUpdateModal = $('#branchCompareUpdateModal');
    var _revisionHistoryModal = $('#revisionHistoryModal');
    var _viewPullRequestsModal = $('#view-pull-requests-modal');

    preInit();
    initialize();

    function preInit() {
        if (localStorage.getItem(SELECTED_BRANCH) === null) {
            saveSelectedBranch(head);
        } else {
            _selectedBranch = localStorage[SELECTED_BRANCH];
        }

        _selectedCubeInfo = _selectedCubeInfo ? JSON.parse(_selectedCubeInfo) : [];

        if (!_activeTabViewType) {
            _activeTabViewType = DEFAULT_ACTIVE_TAB_VIEW_TYPE;
        }

        if (_visitedBranches === undefined) {
            _visitedBranches = {};
        } else {
            _visitedBranches = JSON.parse(_visitedBranches);
        }

        try {
            _openCubes = JSON.parse(_openCubes);
            if (Object.prototype.toString.call(_openCubes) !== '[object Array]'
                || (_openCubes.length && typeof _openCubes[0] !== OBJECT)) {
                _openCubes = [];
            } else if (!_openCubes[0].hasOwnProperty('cubeKey')) {
                _openCubes = [];
            }
        } catch (ignore) {
            _openCubes = [];
        }
    }

    function initialize() {
        try {
            setupMainSplitter();
            startWorkers();
            loadAppListView();
            loadVersionListView();
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            showActiveBranch();
            loadNCubes();
            buildMenu();
            heartBeat();
            addListeners();
            addModalFilters();
            modalsDraggable(true);
            cubeSearchInit();
            setupWestSplitter();
            loop();
        } catch (e) {
            console.log(e);
        }
    }

    function cubeSearchInit() {
        if (getCubeSearchOptionsShown()) {
            _cubeListDiv.height(_cubeListDiv.height() - CUBE_OPTIONS_OFFSET);
            _cubeSearchOptionsIcon.removeClass(GLYPHICONS.OPTION_HORIZONTAL).addClass(GLYPHICONS.OPTION_VERTICAL);
            _cubeSearchOptionsDiv.toggle();
        }
        runSearch();
    }

    function setupMainSplitter() {
        $('body').layout({
            name: "BodyLayout"
            //	reference only - these options are NOT required because 'true' is the default
            , closable: true	// pane can open & close
            , resizable: true	// when open, pane can be resized
            , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            , livePaneResizing: true
            , togglerLength_open: MAIN_SPLITTER_DEFAULTS.TOGGLER_LENGTH_OPEN
            , togglerLength_closed: "100%"
            //	some pane animation settings
            , west__animatePaneSizing: false
            , west__fxName_open: "none"
            , west__fxName_close: "none"	// NO animation when closing west-pane
            , spacing_open: 5
            , spacing_closed: 5
            , west__resizeable: true
            , west__size: MAIN_SPLITTER_DEFAULTS.WEST_SIZE
            , west__minSize: MAIN_SPLITTER_DEFAULTS.WEST_MIN_SIZE
            , west__maxSize: MAIN_SPLITTER_DEFAULTS.WEST_MAX_SIZE
            //	enable showOverflow on west-pane so CSS popups will overlap north pane
            , west__showOverflowOnHover: true
            , center__triggerEventsOnLoad: false
            , center__maskContents: true
            //	enable state management
            , stateManagement__enabled: false // automatic cookie load & save enabled by default
            , showDebugMessages: false // log and/or display messages from debugging & testing code
            , onresize_end: function() {
                delay(function() {
                    buildTabs();
                },PROGRESS_DELAY);
            }
        });
    }
    
    function setupWestSplitter() {
        var modCubesOpen = parseInt(getModCubesOpen() || 0);
        var toggleClass = modCubesOpen ? 'glyphicon-collapse-down' : 'glyphicon-collapse-up';

        $('#west').layout({
            name: 'westLayout'
            //	reference only - these options are NOT required because 'true' is the default
            , closable: true	// pane can open & close
            , resizable: true	// when open, pane can be resized
            , slidable: false	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            , livePaneResizing: true
            , togglerLength_open: MAIN_SPLITTER_DEFAULTS.TOGGLER_SIZE_WITH_HEADER
            , togglerLength_closed: MAIN_SPLITTER_DEFAULTS.TOGGLER_SIZE_WITH_HEADER
            , togglerAlign_open: 'right'
            , togglerAlign_closed: 'right'
            , stateManagement__enabled: false // automatic cookie load & save enabled by default
            , showDebugMessages: false // log and/or display messages from debugging & testing code
            , animatePaneSizing: false
            , fxName_open: "none"
            , fxName_close: "none"	// NO animation when closing west-pane
            , south__size: modCubesOpen || MAIN_SPLITTER_DEFAULTS.SOUTH_DEFAULT_SIZE
            , south__minSize: MAIN_SPLITTER_DEFAULTS.SOUTH_MIN_SIZE
            , south__maxSize: MAIN_SPLITTER_DEFAULTS.SOUTH_MAX_SIZE
            , south__initClosed: !modCubesOpen
            , spacing_open: MAIN_SPLITTER_DEFAULTS.TOGGLER_SIZE_WITH_HEADER
            , spacing_closed: MAIN_SPLITTER_DEFAULTS.TOGGLER_SIZE_WITH_HEADER
            , triggerEventsOnLoad: true
            , center__showOverflowOnHover: true
            , onresize_end: function() {
                southPanelResize();
            }
            , onclose_end: function() {
                southPanelToggle(false);
            }
            , onopen_end: function() {
                southPanelToggle(true);
            }
        });
        $('.ui-layout-toggler-south')
            .css({
                'font-size': 'small',
                'padding': '2px',
                'background-color': '#2474b8',
                'border': 'none'
            })
            .append('<span id="south-toggler" class="glyphicon ' + toggleClass + '"></span>');
        $('.ui-layout-resizer-south')
            .css({
                'font-size':'small',
                'padding': '2px 0 0 10px',
                'background-color': '#2474b8',
                'color': 'white'
            })
            .prepend('Modified Cubes');
    }

    function southPanelToggle(open) {
        var addClass, removeClass;
        if (open) {
            addClass = 'glyphicon-collapse-down';
            removeClass = 'glyphicon-collapse-up';
        } else {
            addClass = 'glyphicon-collapse-up';
            removeClass = 'glyphicon-collapse-down';
        }
        $('#south-toggler').removeClass(removeClass).addClass(addClass);
        delay(southPanelResize, 1);
    }
    
    function southPanelResize() {
        var totalHeight = $('#west').outerHeight();
        var south = $('#south');
        var southHeight = south[0].offsetParent ? south.outerHeight() : 0;
        var bottomWindowHeight = $('.ui-layout-resizer-south').outerHeight() + southHeight;
        var panelOffset = _cubeListDivParent.offset().top;
        var adjustHeight = totalHeight - bottomWindowHeight - panelOffset;
        var cubeNameFilterHeight = 37;
        var searchOptsHeight = getCubeSearchOptionsShown() ? _cubeSearchOptionsDiv.height() : 0;
        _cubeListDivParent.height(adjustHeight);
        _cubeListDiv.height(adjustHeight - cubeNameFilterHeight - searchOptsHeight);
        saveModCubesOpen(southHeight);
    }
    
    function saveOpenCubeList() {
        localStorage[OPEN_CUBES] = JSON.stringify(_openCubes);
    }

    function addCurrentCubeTab(insertIdx, cubeInfo, dto) {
        var newOpenCube;
        cubeInfo = cubeInfo || [_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, _selectedCubeName, getActiveTabViewType()];
        newOpenCube = {
            cubeKey: getCubeInfoKey(cubeInfo),
            status: null,
            position: {},
            numFrozenCols: null,
            searchQuery: null,
            infoDto: dto ||_cubeList[cubeInfo[CUBE_INFO.NAME].toLowerCase()],
            filterOutBlankRows: false
        };
        if (insertIdx > -1) {
            _openCubes.splice(insertIdx, 0, newOpenCube);
        } else {
            _openCubes.unshift(newOpenCube);
        }
        saveOpenCubeList();
        buildTabs(true, cubeInfo);
    }

    function getOpenCubeIndex(cubeInfo) {
        var i, len;
        var cubeInfoKey = getCubeInfoKey(cubeInfo);
        for (i = 0, len = _openCubes.length; i < len; i++) {
            if (cubeInfoKey === _openCubes[i].cubeKey) {
                return i;
            }
        }
    }

    function saveSelectedCubeInfo(cubeInfo) {
        if (cubeInfo !== undefined) {
            _selectedCubeInfo = cubeInfo;
        }
        localStorage[SELECTED_CUBE_INFO] = JSON.stringify(cubeInfo);
    }

    function saveSelectedCubeName(cubeName) {
        if (cubeName !== undefined) {
            _selectedCubeName = cubeName;
        }
        localStorage[SELECTED_CUBE] = _selectedCubeName;
    }

    function saveSelectedApp(app) {
        if (app !== undefined) {
            _selectedApp = app;
        }
        localStorage[SELECTED_APP] = _selectedApp;
    }
    
    function saveSelectedVersion(version) {
        if (version !== undefined) {
            _selectedVersion = version;
        }
        localStorage[SELECTED_VERSION] = _selectedVersion;
    }

    function saveSelectedStatus(status) {
        if (status !== undefined) {
            _selectedStatus = status;
        }
        localStorage[SELECTED_STATUS] = _selectedStatus;
    }
    
    function saveSelectedBranch(branch) {
        if (branch !== undefined) {
            _selectedBranch = branch;
        }
        localStorage[SELECTED_BRANCH] = _selectedBranch;
    }

    function saveModCubesOpen(size) {
        localStorage[MOD_CUBES_WINDOW] = size || 0;
    }

    function getModCubesOpen() {
        return localStorage[MOD_CUBES_WINDOW];
    }

    function saveOpenCubeInfoValue(property, value) {
        var cube = _openCubes[getOpenCubeIndex(_selectedCubeInfo)];
        if (cube) {
            cube[property] = value;
            saveOpenCubeList();
        }
    }

    function getOpenCubeInfoValue(property) {
        var cube = _openCubes[getOpenCubeIndex(_selectedCubeInfo)];
        if (cube) {
            return cube[property];
        }
        return null;
    }

    function getInfoDto() {
        return getOpenCubeInfoValue(SAVED_INFO.INFO_DTO);
    }

    function saveInfoDto(dto) {
        saveOpenCubeInfoValue(SAVED_INFO.INFO_DTO, dto);
    }

    function saveViewPosition(position) {
        var savedPos = getOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION) || {};
        savedPos[getActiveTabViewType()] = position;
        saveOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION, savedPos);
    }

    function getViewPosition() {
        return (getOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION) || {})[getActiveTabViewType()];
    }

    function saveFilterOutBlankRows(shouldFilterOutBlankRows) {
        saveOpenCubeInfoValue(SAVED_INFO.FILTER_OUT_BLANK_ROWS, shouldFilterOutBlankRows);
    }

    function getFilterOutBlankRows() {
        return getOpenCubeInfoValue(SAVED_INFO.FILTER_OUT_BLANK_ROWS);
    }

    function saveNumFrozenCols(num) {
        saveOpenCubeInfoValue(SAVED_INFO.NUMBER_OF_FROZEN_COLUMNS, num);
    }

    function getNumFrozenCols() {
        return getOpenCubeInfoValue(SAVED_INFO.NUMBER_OF_FROZEN_COLUMNS);
    }

    function saveShouldLoadAllForSearch(shouldLoadAllForSearch) {
        saveOpenCubeInfoValue(SAVED_INFO.SHOULD_LOAD_ALL_FOR_SEARCH, shouldLoadAllForSearch);
    }

    function getShouldLoadAllForSearch() {
        return getOpenCubeInfoValue(SAVED_INFO.SHOULD_LOAD_ALL_FOR_SEARCH);
    }

    function getSearchQuery() {
        return getOpenCubeInfoValue(SAVED_INFO.SEARCH_QUERY);
    }

    function saveSearchQuery(query) {
        saveOpenCubeInfoValue(SAVED_INFO.SEARCH_QUERY, query);
    }

    function hasBeenWarnedAboutUpdatingIfUnableToCommitCube(hasBeenWarned) {
        if (hasBeenWarned) {
            saveOpenCubeInfoValue(SAVED_INFO.HAS_BEEN_WARNED_ABOUT_UPDATING_IF_UNABLE_TO_COMMIT_CUBE, 1);
        } else {
            return getOpenCubeInfoValue(SAVED_INFO.HAS_BEEN_WARNED_ABOUT_UPDATING_IF_UNABLE_TO_COMMIT_CUBE);
        }
    }

    function getCubeInfoKey(cubeInfo) {
        return cubeInfo.join(TAB_SEPARATOR);
    }

    function getCubeInfo(cubeKey) {
        return cubeKey.split(TAB_SEPARATOR);
    }

    function getSelectedCubeInfoKey() {
        return getCubeInfoKey(_selectedCubeInfo);
    }

    function removeTab(cubeInfo) {
        var newCubeInfo, removeTabIdx, currentTabIdx;
        removeTabIdx = getOpenCubeIndex(cubeInfo);
        currentTabIdx = getOpenCubeIndex(_selectedCubeInfo);
        _openCubes.splice(removeTabIdx, 1);
        saveOpenCubeList();

        if (_openCubes.length) {
            newCubeInfo = getCubeInfo(_openCubes[0].cubeKey);
            makeCubeInfoActive(newCubeInfo);
        } else {
            saveSelectedCubeInfo([]);
            saveSelectedCubeName(null);
            switchTabPane(null);
        }

        buildTabs(removeTabIdx === currentTabIdx);
    }

    function removeAllTabs() {
        _openCubes = [];
        delete localStorage[OPEN_CUBES];
        saveSelectedCubeInfo([]);
        saveSelectedCubeName(null);
        buildTabs();
    }

    function buildCubeInfo(app, version, status, branch, name, tab) {
        var cubeInfo = [];
        cubeInfo[CUBE_INFO.APP] = app;
        cubeInfo[CUBE_INFO.VERSION] = version;
        cubeInfo[CUBE_INFO.STATUS] = status;
        cubeInfo[CUBE_INFO.BRANCH] = branch;
        if (name !== undefined && name !== null) {
            cubeInfo[CUBE_INFO.NAME] = name;
        }
        if (tab !== undefined && tab !== null) {
            cubeInfo[CUBE_INFO.TAB_VIEW] = tab;
        }
        return cubeInfo;
    }

    function startWorkers() {
        if (typeof(Worker) === 'undefined') {
            alert('Sorry! No Web Worker support. Try using the Chrome browser.');
        } else {
            /**
             * Background worker thread that will send search filter text asynchronously to server,
             * fetch the results, and ship to main thread (which will be updated to the filtered list).
             */
            _searchThread = new Worker('js/loadCubeList.js');
            _searchThread.onmessage = function (event) {
                var list = event.data;
                loadFilteredNCubeListView(list);
            };

            // background thread for heartbeat
            _heartBeatThread = new Worker('js/heartBeat.js');
            _heartBeatThread.onmessage = function (event) {
                handleHearbeatStatusResult(event.data.obj[0]);
                handleHeartbeatPullRequestResult();
            };
        }
    }

    function handleHeartbeatPullRequestResult() {
        var idx, txid, allRows, openRow;
        if (_viewPullRequestsModal.hasClass('in')) {
            openRow = _viewPullRequestsList.find('tr:not([data-txid])');
            if (openRow.length) {
                allRows = _viewPullRequestsList.find('tr');
                idx = allRows.index(openRow[0]);
                txid = $(allRows.get(idx - 1)).data('txid');
            }
            viewPullRequests(true, txid);
        }
    }

    function handleHearbeatStatusResult(result) {
        var status;
        if (result.key.length) {
            status = result.status;
            saveOpenCubeInfoValue('status', status);
            if (status === CLASS_OUT_OF_SYNC) {
                showOutOfSyncNoticeForCube(_selectedCubeInfo);
            }
            updateTabStatus(_selectedCubeInfo);
        }
    }

    function showOutOfSyncNoticeForCube(cubeInfo) {
        var openCube = _openCubes[getOpenCubeIndex(cubeInfo)];
        if (openCube && !openCube.hasShownStatusMessage) {
            showNote(cubeInfo[CUBE_INFO.NAME] + ' is out-of-date (newer version exists in HEAD). Update n-cube or branch to pick up changes.', 'Out-of-Date', 5500);
            openCube.hasShownStatusMessage = true;
            saveOpenCubeList();
        }
    }

    function makeCubeInfoActive(cubeInfo) {
        saveSelectedCubeInfo(cubeInfo);
        saveSelectedCubeName(cubeInfo[CUBE_INFO.NAME]);
        setActiveTabViewType(cubeInfo[CUBE_INFO.TAB_VIEW]);
    }

    function checkCubeCurrent(cubeInfo) {
        var appId, result, cube;
        appId = appIdFrom(cubeInfo[CUBE_INFO.APP], cubeInfo[CUBE_INFO.VERSION], cubeInfo[CUBE_INFO.STATUS], cubeInfo[CUBE_INFO.BRANCH]);
        result = call(CONTROLLER + CONTROLLER_METHOD.IS_CUBE_CURRENT, [appId, cubeInfo[CUBE_INFO.NAME]], {noResolveRefs:true});
        if (!result.status) {
            showNote('Unable to check if out-of-date:<hr class="hr-small"/>' + result.data);
            return;
        }
        cube = _openCubes[getOpenCubeIndex(cubeInfo)];
        if (cube) {
            cube['status'] = result.data ? null : CLASS_OUT_OF_SYNC;
            saveOpenCubeList();
            if (!result.data) {
                showOutOfSyncNoticeForCube(cubeInfo);
            }
        }
    }
    
    function findTabByCubeInfo(cubeInfo) {
        return $('#' + getCubeInfoKey(cubeInfo).replace(/\./g,'_').replace(/~/g,'\\~'));
    }

    function selectTab(cubeInfo) {
        var tab, idx, listCubeName, id;
        deselectTab();
        tab = findTabByCubeInfo(cubeInfo);
        if (!tab.length) {
            idx = getOpenCubeIndex(cubeInfo);
            if (idx > -1) {
                _openCubes.unshift(_openCubes.splice(idx, 1)[0]);
                saveOpenCubeList();
                buildTabs();
                return;
            }
            tab = _openTabList.children().first();
            id = tab.prop('id');
            cubeInfo[CUBE_INFO.TAB_VIEW] = id.substring(id.lastIndexOf('~') + 1);
            id = id.substring(0, id.lastIndexOf('~'));
            cubeInfo[CUBE_INFO.NAME] = id.substring(id.lastIndexOf('~') + 1);
        }
        tab.addClass('active');

        makeCubeInfoActive(cubeInfo);
        checkCubeCurrent(cubeInfo);
        updateTabStatus(cubeInfo);
        localStorage[ACTIVE_TAB_VIEW_TYPE] = getActiveTabViewType();
        tab.find('a.' + CLASS_ACTIVE_VIEW).removeClass(CLASS_ACTIVE_VIEW);
        tab.find('a').filter(function() {
            return $(this)[0].textContent.trim() === getActiveTabViewType().replace(PAGE_ID,'');
        }).addClass(CLASS_ACTIVE_VIEW);

        listCubeName = null;
        if (cubeInfo[CUBE_INFO.APP] === _selectedApp
            && cubeInfo[CUBE_INFO.VERSION] === _selectedVersion
            && cubeInfo[CUBE_INFO.STATUS] === _selectedStatus
            && cubeInfo[CUBE_INFO.BRANCH] === _selectedBranch) {
            listCubeName = _selectedCubeName;
        }
        setListSelectedStatus(listCubeName, '#ncube-list');

        switchTabPane(getActiveTabViewType());
    }

    function deselectTab() {
        _openTabList.find('li.dropdown.active').removeClass('active');
    }

    function getTabImage(imgSrc) {
        return imgSrc ? '<img src="' + imgSrc + '" height="16px" width="16px" draggable="false"/>' : '';
    }

    function addTab(cubeInfo, status) {
        var imgSrc, x, xLen, opt, html, activeClass, cubeInfoKey;
        cubeInfoKey = getCubeInfoKey(cubeInfo);
        activeClass = cubeInfoKey === getCubeInfoKey(_selectedCubeInfo) ? ' active' : '';
        for (x = 0, xLen = _menuOptions.length; x < xLen; x++) {
            opt = _menuOptions[x];
            if (opt.pageId === cubeInfo[CUBE_INFO.TAB_VIEW]) {
                imgSrc = opt.imgSrc;
                break;
            }
        }

        html = '<li class="dropdown' + activeClass + '" draggable="true" id="' + cubeInfoKey.replace(/\./g,'_') + '">';
        html += '<a href="#" draggable="false" class="dropdown-toggle ncube-tab-top-level ';
        html += status + '" data-toggle="dropdown">';
        html += getTabImage(imgSrc);
        html += '<span class="tab-text">' + cubeInfo[CUBE_INFO.NAME] + '</span>';
        html += '<span class="click-space"><span class="big-caret"></span></span>';
        html += '<span class="glyphicon glyphicon-remove tab-close-icon" aria-hidden="true"></span>';
        html += '</a></li>';

        _openTabList.first().append(html);
        addListenersToTab(findTabByCubeInfo(cubeInfo), cubeInfo);
    }

    function addListenersToTab(li, cubeInfo) {
        li.on('dragstart', function() {
            _draggingTabCubeInfo = cubeInfo;
        });
        li.tooltip({
            trigger: 'hover',
            placement: 'auto top',
            animate: true,
            delay: PROGRESS_DELAY,
            container: 'body',
            title: cubeInfo.slice(0, CUBE_INFO.TAB_VIEW).join(' - '),
            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tab-tooltip"></div></div>'
        });
        li.on('click auxclick', function(e) {
            var self = $(this);
            var target = $(e.target);
            var isClose = target.hasClass('glyphicon-remove') || e.which === KEY_CODES.MOUSE_MIDDLE;
            var isDropdown = target.hasClass('click-space') || target.hasClass('big-caret');

            // only show dropdown when clicking the caret, not just the tab
            if (isClose) {
                e.preventDefault();
                self.tooltip('destroy');
                removeTab(cubeInfo);
            } else {
                if (isDropdown) { // clicking caret for dropdown
                    if (!self.find('ul').length) {
                        addTabDropdownList(self, cubeInfo);
                    }
                    self.find('.ncube-tab-top-level')
                        .addClass('dropdown-toggle')
                        .attr('data-toggle', 'dropdown');
                    $(document).one('click', function() { // prevent tooltip and dropdown from remaining on screen
                        closeTab(self);
                    });
                } else { // when clicking tab show tab, not dropdown
                    self.find('.ncube-tab-top-level')
                        .removeClass('dropdown-toggle')
                        .attr('data-toggle', '')
                        .tab('show');
                }

                if (getCubeInfoKey(cubeInfo) !== getCubeInfoKey(_selectedCubeInfo)) {
                    selectTab(cubeInfo);
                    saveState();
                }
            }
        });
        trimText(li.find('.tab-text')[0]);
    }

    function closeTab(li) {
        li.removeClass('open');
        li.tooltip('hide');
        li.find('button').remove();
        li.find('input').remove();
        $('div.dropdown-backdrop').hide();
    }

    function trimText(el){
        var value, len;
        if (el.scrollWidth > el.offsetWidth) {
            value = el.innerHTML;
            len = value.length;
            if (len > TAB_TRIM_TEXT) {
                value = value.substr(len - TAB_TRIM_TEXT);
            }
            do {
                value = '...' + value.substr(4);
                el.innerHTML = value;
            }
            while (el.scrollWidth > el.offsetWidth);
        }
    }

    function addTabDropdownList(li, cubeInfo) {
        var html, menuIdx, menuLen, menuOption;
        html = '<ul class="dropdown-menu tab-menu">';

        // view type menu options
        for (menuIdx = 0, menuLen = _menuOptions.length; menuIdx < menuLen; menuIdx++) {
            menuOption = null;
            menuOption = _menuOptions[menuIdx];
            html += '<li><a href="#" class="anc-view-type" data-pageid="' + menuOption.pageId + '" data-imgsrc="' + menuOption.imgSrc + '">'
                  + getTabImage(menuOption.imgSrc) + NBSP + menuOption.key
                  + '</a></li>';
        }

        html += '<div class="divider"/>'
              + '<li class="dropdown-submenu li-compare-cube"><a href="#" class="anc-compare" tabindex="-1">Compare...</a></li>'
              + '<li><a href="#" class="anc-revision-history" data-ignoreversion="' + (cubeInfo[CUBE_INFO.BRANCH] === head) + '">Revision History...</a></li>'
              + '<li><a href="#" class="anc-show-outbound-references">Show Outbound References</a></li>'
              + '<li><a href="#" class="anc-show-required-scope">Show Required Scope</a></li>'
              + '<div class="divider"/>';

        if (cubeInfo[CUBE_INFO.BRANCH] !== head) {
            html += '<li><a href="#" class="anc-commit-cube">Commit...</a></li>'
                  + '<li><a href="#" class="anc-rollback-cube">Rollback...</a></li>'
                  + '<li><a href="#" class="anc-update-cube">Update from HEAD</a></li>'
                  + '<div class="divider"/>'
                  + '<li><a href="#" class="anc-delete-cube">Delete...</a></li>'
                  + '<li><a href="#" class="anc-duplicate-cube">Duplicate...</a></li>'
                  + '<li><a href="#" class="anc-rename-cube">Rename...</a></li>'
                  + '<div class="divider"/>';
        }

        html += '<li><a href="#" class="anc-go-to-context">Go to Context</a></li>'
              + '<li><a href="#" class="anc-global-comparator">Compare Two Cubes...</a></li>'
              + '<div class="divider"/>'
              + '<li><a href="#" class="anc-close-cube">Close</a></li>'
              + '<li><a href="#" class="anc-close-all">Close All</a></li>'
              + '<li><a href="#" class="anc-close-others">Close Others</a></li>'
              + '</ul>';
        
        li.append(html);
        addTabDropdownListeners(li, cubeInfo);
        addTabDropdownBranchSubDropdown(li, cubeInfo);
    }

    function addTabDropdownListeners(li, cubeInfo) {
        li.find('a.anc-view-type').on('click', function(e) {
            onViewTypeClick(e, $(this), cubeInfo);
        });
        li.find('a.anc-compare').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        li.find('a.anc-revision-history').on('click', function() {
            revisionHistory($(this).data('ignoreversion'));
        });
        li.find('a.anc-show-outbound-references').on('click', function() {
            showRefsFromCube();
        });
        li.find('a.anc-show-required-scope').on('click', function() {
            showReqScope();
        });
        li.find('a.anc-commit-cube').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addMenuConfirmationButtons(li, $(this), function() {
                callCommit(getInfoDto(), getSelectedTabAppId());
            });
        });
        li.find('a.anc-rollback-cube').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addMenuConfirmationButtons(li, $(this), function() {
                callRollbackFromTab(getInfoDto());
            });
        });
        li.find('a.anc-update-cube').on('click', function() {
            callUpdateBranchCubes(getSelectedTabAppId(), [getInfoDto()], true);
        });
        li.find('a.anc-delete-cube').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addMenuConfirmationButtons(li, $(this), function() {
                callDeleteFromTab(getInfoDto().name);
            });
        });
        li.find('a.anc-duplicate-cube').on('click', function() {
            dupeCube();
        });
        li.find('a.anc-rename-cube').on('click', function(e) {
            var parent, inputs, newNameInput, anc, html;
            e.preventDefault();
            e.stopPropagation();
            anc = $(this);
            parent = anc.parent();
            inputs = parent.find('input');
            if (inputs.length) {
                inputs.remove();
                parent.find('button').remove();
            } else {
                newNameInput = $('<input/>')
                    .prop('type', 'text')
                    .val(cubeInfo[CUBE_INFO.NAME])
                    .addClass('form-control')
                    .click(function (ie) {
                        ie.preventDefault();
                        ie.stopPropagation();
                    })
                    .keyup(function (ie) {
                        if (ie.keyCode === KEY_CODES.ENTER) {
                            closeTab();
                            renameCube(newNameInput.val());
                        }
                    });
                parent.append(newNameInput);
                html = '<button class="btn btn-danger btn-xs pull-right">Cancel</button>';
                html += '<button class="btn btn-primary btn-xs pull-right btn-menu-confirm">Confirm</button>';
                anc.append(html);
                anc.find('button.btn-menu-confirm').on('click', function () {
                    closeTab(li);
                    renameCube(newNameInput.val());
                });
                newNameInput[0].focus();
            }
        });
        li.find('a.anc-close-cube').on('click', function() {
            li.tooltip('destroy');
            removeTab(cubeInfo);
        });
        li.find('a.anc-close-all').on('click', function() {
            li.tooltip('destroy');
            removeAllTabs();
            switchTabPane(null);
        });
        li.find('a.anc-close-others').on('click', function() {
            li.tooltip('destroy');
            removeAllTabs();
            addCurrentCubeTab(null, cubeInfo);
        });
        li.find('a.anc-go-to-context').on('click', function() {
            saveSelectedApp(cubeInfo[CUBE_INFO.APP]);
            loadAppListView();
            saveSelectedStatus(cubeInfo[CUBE_INFO.STATUS]);
            saveSelectedVersion(cubeInfo[CUBE_INFO.VERSION]);
            loadVersionListView();
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            saveSelectedBranch(cubeInfo[CUBE_INFO.BRANCH]);
            showActiveBranch();
            loadNCubes();
            clearSearch();
            buildMenu();
        });
        li.find('a.anc-global-comparator').on('click', function() {
            openGlobalComparator(cubeInfo);
        });
    }

    function addTabDropdownBranchSubDropdown(li, cubeInfo) {
        var appId = appIdFrom(cubeInfo[CUBE_INFO.APP], cubeInfo[CUBE_INFO.VERSION], cubeInfo[CUBE_INFO.STATUS], cubeInfo[CUBE_INFO.BRANCH]);
        var branchNames = getBranchNamesByAppId(appId);
        li.find('li.li-compare-cube').append(
            createBranchesUl(branchNames, function(branchName) {
                var infoDto, leftInfoDto;
                infoDto = getInfoDto();
                leftInfoDto = $.extend(true, {}, infoDto);
                leftInfoDto.branch = branchName;
                diffCubes(leftInfoDto, infoDto, infoDto.name, appId);
            })
        );
    }

    function openGlobalComparator(cubeInfo) {
        var appId = getAppId();
        var opts = {
            rightAppId: appId,
            rightCube: _selectedCubeName,
            appSelectList: loadAppNames(),
            populateVersionFunc: getVersions,
            populateBranchFunc: getBranchNamesByAppId,
            populateCubeFunc: getCubeListForApp,
            afterSave: globalComparatorCompare
        };

        if (cubeInfo) {
            opts.leftDisabled = true;
            opts.leftAppId = appIdFrom(cubeInfo[CUBE_INFO.APP], cubeInfo[CUBE_INFO.VERSION], cubeInfo[CUBE_INFO.STATUS], cubeInfo[CUBE_INFO.BRANCH]);
            opts.leftCube = cubeInfo[CUBE_INFO.NAME];
        } else {
            opts.leftAppId = getAppId();
        }
        FormBuilder.openBuilderModal(NCEBuilderOptions.globalComparator(opts));
    }

    function addMenuConfirmationButtons(li, anc, actionFunc) {
        var buttons, html;
        li.find('li').not(anc.parent()).find('button').remove();
        buttons = anc.find('button');
        if (buttons.length) {
            buttons.remove();
        } else {
            html = '<button class="btn btn-danger btn-xs pull-right">Cancel</button>';
            html += '<button class="btn btn-primary btn-xs pull-right btn-menu-confirm">Confirm</button>';
            anc.append(html);
            anc.find('button.btn-menu-confirm').on('click', function () {
                closeTab(li);
                actionFunc();
            });
        }
    }

    function getActiveContentWindow() {
        var pageId, frame;
        pageId = getActiveTabViewType();
        if (pageId) {
            try {
                frame = document.getElementById('iframe_' + pageId);
                if (frame) {
                    return frame.contentWindow;
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    function closeChildMenu() {
        var cw = getActiveContentWindow();
        if (cw.closeChildMenu !== undefined) {
            cw.closeChildMenu();
        }
    }

    function onNoteEvent(e) {
        var cw;
        cw = getActiveContentWindow();
        if (cw.onNoteEvent !== undefined) {
            cw.onNoteEvent(e);
        }
    }
    
    function onViewTypeClick(e, anc, cubeInfo) {
        var ci2, cia2, tabIdx, isCtrlKey, li, img;
        li = anc.parent().parent().parent();
        setActiveTabViewType(anc.data('pageid'));
        ci2 = buildCubeInfo(cubeInfo[CUBE_INFO.APP], cubeInfo[CUBE_INFO.VERSION], cubeInfo[CUBE_INFO.STATUS], cubeInfo[CUBE_INFO.BRANCH], cubeInfo[CUBE_INFO.NAME], getActiveTabViewType());
        cia2 = getCubeInfoKey(ci2);
        tabIdx = getOpenCubeIndex(ci2);
        isCtrlKey = e.metaKey || e.ctrlKey;
        if (isCtrlKey) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }

        if (tabIdx > -1) { // already open
            e.preventDefault();
            e.stopPropagation();
            closeTab(li);
            selectTab(ci2);
        } else {
            tabIdx = getOpenCubeIndex(cubeInfo);
            if (isCtrlKey) { // open new tab
                li.removeClass('open').tooltip('hide');
                addCurrentCubeTab(tabIdx, ci2, getInfoDto());
            } else { // use current tab
                cubeInfo[CUBE_INFO.TAB_VIEW] = getActiveTabViewType();
                _openCubes[tabIdx].cubeKey = cia2;
                saveOpenCubeList();
                li.attr('id', cia2.replace(/\./g,'_'));
                img = li.find('a.ncube-tab-top-level img');
                if (img.length) {
                    img.attr('src', anc.data('imgsrc'));
                }
                li.find('a').removeClass(CLASS_ACTIVE_VIEW);
                anc.addClass(CLASS_ACTIVE_VIEW);
            }
            switchTabPane(getActiveTabViewType());
        }
    }

    function createBranchesUl(branchNames, func) {
        var html, bnIdx, bnLen, branchesUl;//, branchNames;

        html = '<ul class="dropdown-menu">';
        for (bnIdx = 0, bnLen = branchNames.length; bnIdx < bnLen; bnIdx++) {
            html += '<li><a href="#">';
            html += branchNames[bnIdx];
            html += '</a></li>';
        }
        
        branchesUl = $(html);
        branchesUl.find('a').on('click', function() {
            return func(this.innerHTML);
        });
        return branchesUl;
    }

    function switchTabPane(pageId) {
        var iframeId, frame, cw;
        $('.tab-pane').removeClass('active');
        if (pageId) {
            $('#' + pageId).addClass('active');
            iframeId = 'iframe_' + pageId;
            try {
                frame = document.getElementById(iframeId);
                if (frame) {
                    cw = frame.contentWindow;
                    if (cw.tabActivated !== undefined) {
                        cw.tabActivated(buildAppState());
                        localStorage[ACTIVE_TAB_VIEW_TYPE] = pageId;
                        cw.focus();
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    function updateElementStatus(el, status) {
        el = $(el);
        el.removeClass(CLASS_OUT_OF_SYNC + ' ' + CLASS_CONFLICT);
        if (status !== undefined && status !== null) {
            el.addClass(status);
        }
    }

    function updateTabStatus(cubeInfo) {
        var tab = findTabByCubeInfo(cubeInfo);
        if (tab.length) {
            updateElementStatus(tab.find('a.ncube-tab-top-level')[0], getOpenCubeInfoValue('status'));
        }
    }

    function calcMaxTabs() {
        var windowWidth = _openTabsPanel.width();
        var availableWidth = windowWidth - _tabOverflow.outerWidth();
        return Math.floor(availableWidth / TAB_WIDTH);
    }

    function buildTabs(shouldLoadCube, curCubeInfo) {
        var len, maxTabs, cubeInfo, i, openCube, idx, temp;
        _openTabList.children().remove();
        _tabOverflow.hide();
        _tabDragIndicator.hide();
        len = _openCubes.length;
        if (len) {
            maxTabs = calcMaxTabs();
            cubeInfo = curCubeInfo || _selectedCubeInfo;
            idx = getOpenCubeIndex(cubeInfo);
            if (idx >= maxTabs) { // if selected tab is now in overflow, bring to front
                temp = _openCubes.splice(idx, 1);
                _openCubes.unshift(temp[0]);
                saveOpenCubeList();
            }

            for (i = 0; i < len && i < maxTabs; i++) {
                openCube = _openCubes[i];
                addTab(getCubeInfo(openCube.cubeKey), openCube.status);
            }
            if (len > maxTabs) {
                _tabOverflow.show();
                buildTabOverflow(maxTabs, len);
            }
            if (shouldLoadCube) {
                selectTab(cubeInfo);
            }
        } else {
            switchTabPane(null);
        }
    }

    function buildTabOverflow(maxTabs, len) {
        var dd, largestText, i, tabText, textWidth, x, xLen, opt, button, offset, maxWidth,
            dropdownWidth, dropDownTop, dropDownLeft;
        $('#tab-overflow-text')[0].innerHTML = len - maxTabs;
        dd = _tabOverflow.find('ul');
        largestText = TAB_WIDTH;

        for (i = maxTabs; i < len; i++) {
            (function() {
                var openCube = _openCubes[i];
                var cubeInfo = getCubeInfo(openCube.cubeKey);
                var imgSrc;
                for (x = 0, xLen = _menuOptions.length; x < xLen; x++) {
                    opt = _menuOptions[x];
                    if (opt.pageId === cubeInfo[CUBE_INFO.TAB_VIEW]) {
                        imgSrc = opt.imgSrc;
                        break;
                    }
                }

                tabText = cubeInfo.slice(0, CUBE_INFO.TAB_VIEW).join(' - ');
                textWidth = $('<p>' + tabText + '</p>').canvasMeasureWidth(FONT_CELL) + CALC_WIDTH_TAB_OVERFLOW_MOD;
                if (textWidth > largestText) {
                    largestText = textWidth;
                }

                dd.append(
                    $('<li/>').append(
                        $('<a/>')
                            .attr('href', '#')
                            .addClass(openCube.status)
                            .html(getTabImage(imgSrc)
                                + '<span class="dropdown-tab-text">' + tabText + '</span>'
                                + '<span class="glyphicon glyphicon-remove tab-close-icon" aria-hidden="true"></span>'
                            )
                            .click(function(e) {
                                if ($(e.target).hasClass('glyphicon-remove')) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeTab(cubeInfo);
                                } else {
                                    makeCubeInfoActive(cubeInfo);
                                    buildTabs(true);
                                }
                            })
                    )
                );
            })();
        }

        largestText += TAB_OVERFLOW_TEXT_PADDING;
        button = _tabOverflow.find('button');
        offset = button.offset();
        maxWidth = offset.left + button.outerWidth();
        dropdownWidth = largestText < maxWidth ? largestText : maxWidth;
        dropDownTop = offset.top + button.outerHeight() + parseInt(button.css('marginTop').replace('px',''));
        dropDownLeft = maxWidth - dropdownWidth;
        dd.css({top: dropDownTop + 'px', left: dropDownLeft + 'px', width: dropdownWidth + 'px'});
    }

    function buildMenu() {
        var menu, result;
        result = call(CONTROLLER + CONTROLLER_METHOD.GET_MENU, [getAppId()]);
        if (!result.status) {
            showNote('Unable to load menu.' + result.data);
            return;
        }
        menu = result.data;
        _appTitle[0].innerHTML = menu[CONFIG_TITLE];
        _defaultTab = menu[CONFIG_DEFAULT_TAB];
        if (_defaultTab) {
            _defaultTab = _defaultTab.replace(/\s/g,'_') + PAGE_ID;
            if (!_activeTabViewType) {
                setActiveTabViewType(_defaultTab);
            }
        }
        
        buildViewsFromTabMenu(menu);
        buildNavigationMenu(menu);
    }

    function buildNavigationMenu(menu) {
        var navMenu, html, i, len, menuKeys, heading, menuOptions, optionsKeys, linkText, linkVal, o, oLen;
        _menuList.empty();
        html = '';
        navMenu = menu[CONFIG_NAV_MENU];
        if (!navMenu) {
            return;
        }

        delete navMenu['@type'];
        menuKeys = Object.keys(navMenu);
        for (i = 0, len = menuKeys.length; i < len; i++) {
            heading = menuKeys[i];
            menuOptions = null;
            menuOptions = navMenu[heading];
            html += '<li class="dropdown">';
            html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown">';
            html += heading + '</a>';
            html += '<ul class="dropdown-menu">';

            delete menuOptions['@type'];
            optionsKeys = Object.keys(menuOptions);
            for (o = 0, oLen = optionsKeys.length; o < oLen; o++) {
                linkText = optionsKeys[o];
                linkVal = null;
                linkVal = menuOptions[linkText];

                if (linkVal.hasOwnProperty('html')) {
                    html += '<li><a href="' + encodeURIComponent(linkVal.html) + '">' + linkText + '</a></li>';
                } else if (linkVal.hasOwnProperty('expression')) {
                    html += '<li><a href="#" target="_blank" data-heading="' + heading + '">' + linkText + '</a></li>';
                }
                if (linkVal.hasOwnProperty('divider')) {
                    html += '<div class="divider"/>';
                }
            }

            html += '</ul></li>'
        }
        _menuList.append(html);
        buildMenuExpressionListeners(navMenu);
    }

    function buildMenuExpressionListeners(navMenu) {
        _menuList.find('[data-heading]').on('click', function(e) {
            var opts;
            var anc = $(this);
            var exp = navMenu[anc.data('heading')][this.innerHTML].expression;
            var appId = appIdFrom(exp.app, exp.version, exp.status, exp.branch);
            var result = call(CONTROLLER + CONTROLLER_METHOD.GET_CELL_NO_EXECUTE_BY_COORDINATE, [appId, exp.cube, {method:exp.method, component:'model'}]);
            e.preventDefault();
            if (!result.status) {
                showNote('Unable to initialize plugin.', 'Error', TWO_SECOND_TIMEOUT);
                return;
            }
            // yes, eval is evil. i'm sorry.
            opts = eval(result.data.value);
            opts.afterSave = function(data) {
                data.component = 'controller';
                data.appId = getAppId();
                onMenuExpressionSave(exp, appId, data);
            };
            FormBuilder.openBuilderModal(opts);
        });
    }

    function onMenuExpressionSave(exp, appId, data) {
        var viewData, viewResult;
        var controllerResult = exec([appId, exp.cube, exp.method, data]);
        if (!controllerResult.status) {
            showNote('Unable to perform action: ' + controllerResult.data, 'Error!');
            return;
        }
        viewResult = call(CONTROLLER + CONTROLLER_METHOD.GET_CELL_NO_EXECUTE_BY_COORDINATE, [appId, exp.cube, {method:exp.method, component:'view'}]);
        if (!viewResult.status) {
            showNote('Unable to perform action: ' + viewResult.data, 'Error!');
            return;
        }
        viewData = controllerResult.data;
        delete viewData.component;
        cleanGroovyObject(viewData);
        FormBuilder.openBuilderModal(getViewOptions(viewResult.data.value, data, viewData), viewData);
    }

    // keep params, they are used in eval.
    // yes, eval is evil. i'm sorry.
    function getViewOptions(result, opts, data) {
        return eval(result);
    }

    function cleanGroovyObject(data) {
        var i, len, keys, key, obj;
        keys = Object.keys(data);
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            obj = data[key];
            if (obj !== null && typeof obj === OBJECT) {
                if (obj.hasOwnProperty('@items')) {
                    data[key] = obj['@items'];
                } else {
                    delete obj['@id'];
                    delete obj['@type'];
                }
            }
        }
    }
    
    function buildViewsFromTabMenu(menu) {
        var tabMenu, menuKeys, i, len, key, value, pageId, tabHeight, iframeHtml, html, appId;
        _menuOptions = null;
        _menuOptions = [];
        tabMenu = menu[CONFIG_TAB_MENU];
        delete tabMenu['@type'];
        html = '';
        appId = getAppId();

        menuKeys = Object.keys(tabMenu);
        for (i = 0, len = menuKeys.length; i < len; i++) {
            key = menuKeys[i];
            value = null;
            value = tabMenu[key];
            pageId = key.replace(/\s/g,'_') + PAGE_ID;
            _menuOptions.push({key:key, pageId:pageId, imgSrc:value['img'], html:value['html']});
            if (!_activeTabViewType) {
                setActiveTabViewType(pageId);
                _defaultTab = pageId;
            }

            if (!_mainTabPanel.find('div#' + pageId).length) {
                if (tabHeight === undefined) {
                    tabHeight = _openTabsPanel.outerHeight();
                }
                iframeHtml = value['html'];
                if (!iframeHtml.startsWith('http:') && !iframeHtml.startsWith('https:')) {
                    iframeHtml += '?appId=' + JSON.stringify(appId);
                }

                html += '<div class="tab-pane" id="' + pageId + '" ' + 'style="overflow:hidden;height:calc(100% - ' + tabHeight + 'px);">';
                html += '<iframe id="iframe_' + pageId + '" class="panel-frame" src="' + encodeURI(iframeHtml) + '">';
                html += '</iframe></div>';
            }
        }

        if (html.length) {
            _mainTabPanel.append(html);
        }
    }

    function getCubeMap() {
        return _cubeList;
    }

    function buildAppState() {
        return {
            call: call,
            annotateCell: annotateCell,
            clearNote: clearNote,
            clearNotes: clearNotes,
            displayMap: displayMap,
            doesCubeExist: doesCubeExist,
            ensureModifiable: ensureModifiable,
            exec: exec,
            getAppId: getAppId,
            getAppVersions: getAppVersions,
            getAxesFromCube: getAxesFromCube,
            getBranchNamesByAppId: getBranchNamesByAppId,
            getCubeListForApp: getCubeListForApp,
            getSelectedTabAppId: getSelectedTabAppId,
            getInfoDto: getInfoDto,
            getCubeMap: getCubeMap,
            getProperCubeName: getProperCubeName,
            getSelectedCubeName: getSelectedCubeName,
            getSelectedApp: getSelectedApp,
            getSelectedVersion: getSelectedVersion,
            getSelectedStatus: getSelectedStatus,
            getSelectedBranch: getSelectedBranch,
            getSelectedCubeInfoKey: getSelectedCubeInfoKey,
            isHeadSelected: isHeadSelected,
            loadAppNames: loadAppNames,
            loadCube: loadCube,
            reloadCube: reloadCube,
            selectBranch: selectBranch,
            selectCubeByName: selectCubeByName,
            showNote: showNote,
            updateNote: updateNote,
            loadNCubes: loadNCubes,
            loadNCubeListView: loadNCubeListView,
            getVersions: getVersions,
            runSearch: runSearch,
            saveViewPosition: saveViewPosition,
            getViewPosition: getViewPosition,
            getNumFrozenCols: getNumFrozenCols,
            saveNumFrozenCols: saveNumFrozenCols,
            getSearchQuery: getSearchQuery,
            saveSearchQuery: saveSearchQuery,
            getFilterOutBlankRows: getFilterOutBlankRows,
            saveFilterOutBlankRows: saveFilterOutBlankRows,
            getShouldLoadAllForSearch: getShouldLoadAllForSearch,
            saveShouldLoadAllForSearch: saveShouldLoadAllForSearch,
            checkPermissions: checkPermissions,
            freezePage: freezePage,
            isPageFrozen: isPageFrozen,
            updateCubeLeftHandChangedStatus: updateCubeLeftHandChangedStatus,
            hasBeenWarnedAboutUpdatingIfUnableToCommitCube: hasBeenWarnedAboutUpdatingIfUnableToCommitCube
        };
    }

    function updateCubeLeftHandChangedStatus(cubeName, changeType) {
        var cubeChanged = _cubeList[cubeName.toLowerCase()];
        if(cubeChanged){
            cubeChanged.changed = true;
        }

        _listOfCubes.find('li a')
            .filter(function () { return this.innerText === cubeName; })
            .removeClass('cube-added cube-modified')
            .addClass(changeType.CSS_CLASS);
        buildModifiedCubesList();
    }

    function closeParentMenu() {
        $('.open').removeClass('open').tooltip('hide');
        $('div.dropdown-backdrop').hide();
    }

    function freezePage(shouldFreeze) {
        function createOverlayForDiv(div) {
            var overlayDiv, offset;
            offset = div.offset();
            overlayDiv = $('<div/>')
                .addClass('backdrop-overlay')
                .css({top:offset.top, height: div.outerHeight()+1, left:offset.left, width: div.outerWidth()+1});
            div.append(overlayDiv);
        }

        function overlayDivsInit() {
            createOverlayForDiv($('header.navbar-fixed-top'));
            createOverlayForDiv($('#west'));
            createOverlayForDiv($('#ncube-tabs'));
            createOverlayForDiv($('div.ui-layout-resizer'));
        }

        if (shouldFreeze) {
            if (!isPageFrozen()) {
                overlayDivsInit();
            }
        } else {
            $('div.backdrop-overlay').remove();
        }
    }
    
    function isPageFrozen() {
        return $('div.backdrop-overlay').length;
    }

    function reloadCube() {
        var doc = document.documentElement;
        var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        loadCube();
        window.scrollTo(left, top);
    }

    function clearSearch() {
        _searchNames.val('');
        _cubeSearchContains.val('');
        _cubeSearchTagsInclude.val('');
        _cubeSearchTagsExclude.val('');
        saveCubeSearchOptions();
        loadNCubeListView();
        setListSelectedStatus(_selectedCubeName, '#ncube-list');
        _cubeCount[0].textContent = Object.keys(_cubeList).length;
    }

    function selectCubeByName(cubeName, differentAppId, newTab, dontSaveState) {
        var cubeInfo, cis, found, i, len, oci, idx, tab;
        if (!cubeName) {
            return;
        }
        if (differentAppId) {
            _selectedCubeName = cubeName;
            cubeInfo = [differentAppId.app, differentAppId.version, differentAppId.status, differentAppId.branch, cubeName];
        } else {
            _selectedCubeName = getProperCubeName(cubeName);
            cubeInfo = [_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, _selectedCubeName];
        }

        localStorage[SELECTED_CUBE] = cubeName;
        cis = getCubeInfoKey(cubeInfo);
        found = false;
        for (i = 0, len = _openCubes.length; i < len; i++) {
            oci = _openCubes[i].cubeKey;
            idx = oci.lastIndexOf(TAB_SEPARATOR);
            tab = oci.substring(idx + TAB_SEPARATOR.length);
            oci = oci.substring(0, idx);
            if (oci === cis) {
                if (!newTab || (newTab === tab) ) {
                    cubeInfo.push(tab);
                    if (i < calcMaxTabs()) {
                        selectTab(cubeInfo);
                    } else {
                        makeCubeInfoActive(cubeInfo);
                        buildTabs(true);
                        return;
                    }
                    found = true;
                    break;
                }
            }
        }
        if (!found){
            tab = newTab === undefined ? _defaultTab : newTab;
            setActiveTabViewType(tab);
            cubeInfo.push(getActiveTabViewType());
            addCurrentCubeTab(null, cubeInfo);
        }
        if (!dontSaveState) {
            saveState();
        }
    }

    function hasSearchOptions(opts) {
        return (opts.contains && opts.contains.length)
            || (opts.tagsInclude && opts.tagsInclude.length)
            || (opts.tagsExclude && opts.tagsExclude.length);
    }
    
    function runSearch() {
        var nameFilter, mainList;
        var opts = applyCubeSearchOptions();
        if (hasSearchOptions(opts)) {
            callServerSideSearch();
        } else {
            nameFilter = _searchNames.val().trim();
            mainList = nameFilter.length ? filterCubeNames(nameFilter) : _cubeList;
            loadFilteredNCubeListView(mainList);
        }
    }

    function filterCubeNames(nameFilter) {
        var list, pattern, regex, mainList, i, len, info, keys, key, k, kLen, array;
        list = [];
        pattern = wildcardToRegexString(nameFilter);
        regex = new RegExp(pattern, "i");

        keys = Object.keys(_cubeList);
        for (k = 0, kLen = keys.length; k < kLen; k++) {
            key = keys[k];
            array = regex.exec(key);
            if (array) {
                info = _cubeList[key];
                info.pos = array.index;
                info.endPos = array.index + array[0].length;
                list.push(info);
            }
        }

        list.sort(function (a, b) {
            if (a.pos < b.pos) {
                return -1;
            }
            if (a.pos > b.pos) {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });

        mainList = {};
        for (i = 0, len = list.length; i < len; i++) {
            info = list[i];
            mainList[info.name.toLowerCase()] = info;
        }
        return mainList;
    }

    function callServerSideSearch() {
        var nameFilter, pattern, regex;
        nameFilter = _searchNames.val().trim();
        if (nameFilter.length) {
            pattern = wildcardToRegexString(nameFilter);
            regex = new RegExp(pattern, 'i');
        }
        _searchThread.postMessage([
                nameFilter,
                getCubeSearchOptions(),
                getAppId(),
                regex
            ]);
    }

    function setCubeListLoading() {
        var loadingHtml = '<a>Loading n-cubes...</a>';
        _listOfCubes.empty();
        _listOfCubes.append(loadingHtml);
        _listOfModifiedCubes.empty();
        _listOfModifiedCubes.append(loadingHtml);
    }

    // Clear versions (add single 'Loading versions...' entry)
    function setVersionListLoading() {
        _versionMenu.parent().find('.dropdown-menu').empty();
        _versionMenu[0].innerHTML = 'Version: Loading...';
    }
    
    function onDragTab(e) {
        var offsetLeft, posX, left, top;
        e.preventDefault();
        offsetLeft = $('#center').offset().left;
        posX = e.originalEvent.x - offsetLeft;
        left = Math.floor(posX / TAB_WIDTH) * TAB_WIDTH + offsetLeft;
        top = _openTabsPanel.outerHeight() - _tabDragIndicator.height() + _openTabsPanel.offset().top;
        _tabDragIndicator.css({left:left, top:top});
        _tabDragIndicator.show()
    }
    
    function onDropTab(e) {
        var posX, oldTabIdx, newTabIdx;
        $('.tooltip').hide();
        _tabDragIndicator.hide();
        posX = e.originalEvent.x - $('#center').offset().left;
        oldTabIdx = getOpenCubeIndex(_draggingTabCubeInfo);
        newTabIdx = Math.floor(posX / TAB_WIDTH);
        if (newTabIdx !== oldTabIdx) {
            _openCubes.splice(newTabIdx, 0, _openCubes.splice(oldTabIdx, 1)[0]);
            saveOpenCubeList();
            buildTabs();
        }
    }

    function addListeners() {
        _openTabsPanel.on('drop dragdrop', function(e) {
            onDropTab(e);
        });
        _openTabsPanel.on('dragenter dragover', function(e) {
            onDragTab(e);
        });

        // 'Close' for the Diff Modal
        $('#diffModalClose').on('click', function() {
            diffShow(false);
        });
        _diffModalMerge.on('click', function() {
            diffMerge();
        });

        // Set up back button support (base a page on a app, version, status, branch, and cube name)
        $(window).on('popstate', function(e) {
            onWindowPopstate(e);
        });
        
        $(document).on('click', function() {
            closeChildMenu();
        });

        $('#globalComparatorMenu').on('click', function() {
            openGlobalComparator();
        });
        $('#newCubeMenu').on('click', function () {
            newCube();
        });
        $('#dupeCubeCopy').on('click', function () {
            dupeCubeCopy();
        });
        $('#deleteCubeMenu').on('click', function () {
            deleteCube();
        });
        $('#restoreCubeMenu').on('click', function () {
            restoreCube();
        });
        $('#revisionHistoryOk').on('click', function () {
            revisionHistoryOk();
        });
        $('#batchUpdateAxisReferencesMenu').on('click', function() {
            batchUpdateAxisReferencesOpen(false);
        });
        $('#batchUpdateAxisReferenceTransformsMenu').on('click', function() {
            batchUpdateAxisReferencesOpen(true);
        });

        _runAppTestsMenu.on('click', function() {
            showNote('Running tests...');
            delay(function() {
                runAppTests();
            }, 1);
        });

        addSystemMenuListeners();
        addBranchListeners();
        addSelectAllNoneListeners();
        addSearchListeners();
        addViewPullRequestsListeners();
    }

    function addViewPullRequestsListeners() {
        $(_viewPullRequests).on('click', function() {
            viewPullRequests();
        });
        _viewPullRequestsModal.find('select').on('change', function() {
            viewPullRequestsFilter();
        });
        _viewPullRequestsModal.on('shown.bs.modal', function() {
            viewPullRequestsFilter();
        });
        _viewPullRequestsSearchText.on('keyup', function(e) {
            var key = e.keyCode;
            if (key === KEY_CODES.ENTER) {
                viewPullRequestsSearchTransactionId(this.value.trim());
            }
        });
        _viewPullRequestsSearchButton.on('click', function() {
            viewPullRequestsSearchTransactionId(_viewPullRequestsSearchText.val().trim());
        });
        _viewPullRequestsSearchClear.on('click', function() {
            _viewPullRequestsSearchText.val('');
        });
    }

    function addSearchListeners() {
        _searchNames
            .add(_cubeSearchContains)
            .add(_cubeSearchTagsInclude)
            .add(_cubeSearchTagsExclude)
            .on('input', function () {
                _searchKeyPressed = true;
                _searchLastKeyTime = Date.now();
            });

        _searchNames
            .on('keyup', function(e) {
                if (e.keyCode === KEY_CODES.ESCAPE) {
                    clearSearch();
                }
            });

        _cubeSearchContains
            .add(_cubeSearchTagsInclude)
            .add(_cubeSearchTagsExclude)
            .on('keyup', function(e) {
                if (e.keyCode === KEY_CODES.ESCAPE) {
                    this.value = '';
                    saveCubeSearchOptions();
                    runSearch();
                }
            });

        $('#cube-search-reset').on('click', function() {
            clearSearch();
        });

        _cubeSearchOptionsBtn.on('click', function() {
            var newHeight, removeClass, addClass;
            var prevHeight = _cubeListDiv.height();
            var isVisible = _cubeSearchOptionsDiv.is(':visible');

            if (isVisible) {
                newHeight = prevHeight + CUBE_OPTIONS_OFFSET;
                removeClass = GLYPHICONS.OPTION_VERTICAL;
                addClass = GLYPHICONS.OPTION_HORIZONTAL;
            } else {
                newHeight = prevHeight - CUBE_OPTIONS_OFFSET;
                removeClass = GLYPHICONS.OPTION_HORIZONTAL;
                addClass = GLYPHICONS.OPTION_VERTICAL;
            }

            _cubeListDiv.height(newHeight);
            _cubeSearchOptionsIcon.removeClass(removeClass).addClass(addClass);
            _cubeSearchOptionsDiv.toggle();
            saveCubeSearchOptionsShown(!isVisible);
        });
    }
    
    function addSystemMenuListeners() {
        $('#clearStorage').click(function() {
            clearStorage();
        });
        $('#serverStats').click(function() {
            serverStats();
        });
        $('#httpHeaders').click(function() {
            httpHeaders();
        });
        $('#compareRevs').click(function() {
            compareRevisions();
        });
        $('#promoteRev').click(function() {
            promoteRevision();
        });
        $('#clearRevSelection').click(function() {
            clearRevSelection();
        });
    }

    function onWindowPopstate(e) {
        var state = e.originalEvent.state;
        if (!state) {
            return;
        }

        document.title = state.title;
        saveSelectedCubeName(state.cube);
        selectCubeByName(_selectedCubeName, state.tabAppId, null, true);
    }

    function runAppTests() {
        var msg;
        var result = call(CONTROLLER + CONTROLLER_METHOD.RUN_TESTS, [getAppId()]);
        clearNote();
        if (result.status) {
            msg = getFailedAppTestsMessage(result.data);
            showNote(msg ? ('Failed tests by cube:<br/><hr class="hr-small"/>' + msg) : 'All tests passed!');
        } else {
            showNote('Tests failed to run...');
        }
    }

    function getFailedAppTestsMessage(testData) {
        var i, len, cubeNames, cubeName, failed;
        var html = '';
        delete testData['@type'];
        cubeNames = Object.keys(testData);
        for (i = 0, len = cubeNames.length; i < len; i++) {
            cubeName = cubeNames[i];
            failed = getFailedCubeTestsMessage(testData[cubeName]);
            if (failed) {
                html += cubeName + '<br/>' + failed + '<hr class="hr-small"/>';
            }
        }
        return html;
    }

    function getFailedCubeTestsMessage(tests) {
        var i, len, testNames, testName;
        var html = '';
        delete tests['@type'];
        testNames = Object.keys(tests);
        for (i = 0, len = testNames.length; i < len; i++) {
            testName = testNames[i];
            if (tests[testName]['_result'] !== true) {
                html += '<b class="darkred">' + testName + '</b><br/>';
            }
        }
        return html;
    }

    function globalComparatorCompare(data) {
        var leftDto, rightDto, leftResult, rightResult, title, leftVerSplit, rightVerSplit;
        var leftApp = data.leftApp[0];
        var rightApp = data.rightApp[0];
        var leftVersion = data.leftVersion[0];
        var rightVersion = data.rightVersion[0];
        var leftBranch = data.leftBranch[0];
        var rightBranch = data.rightBranch[0];
        var leftCube = data.leftCube[0];
        var rightCube = data.rightCube[0];

        if (rightApp && rightVersion && rightBranch && rightCube) {
            rightVerSplit = rightVersion.split('-');
            rightResult = call(CONTROLLER + CONTROLLER_METHOD.SEARCH, [appIdFrom(rightApp, rightVerSplit[0], rightVerSplit[1], rightBranch), rightCube, null, getDefaultSearchOptions()]);
            if (rightResult.status && rightResult.data.length) {
                rightDto = rightResult.data[0];
            } else {
                showNote('Unable to load cube ' + rightCube, 'Global Comparator Error', TWO_SECOND_TIMEOUT);
            }
        } else {
            showNote('Right compare info not set!', 'Global Comparator Error', TWO_SECOND_TIMEOUT);
            return;
        }

        if (leftApp && leftVersion && leftBranch && leftCube) {
            leftVerSplit = leftVersion.split('-');
            leftResult = call(CONTROLLER + CONTROLLER_METHOD.SEARCH, [appIdFrom(leftApp, leftVerSplit[0], leftVerSplit[1], leftBranch), leftCube, null, getDefaultSearchOptions()]);
            if (leftResult.status && leftResult.data.length) {
                leftDto = leftResult.data[0];
            } else {
                showNote('Unable to load cube ' + leftCube, 'Global Comparator Error', TWO_SECOND_TIMEOUT);
            }
        } else {
            showNote('Left compare info not set!', 'Global Comparator Error', TWO_SECOND_TIMEOUT);
            return;
        }

        if (leftDto && rightDto) {
            title = [leftApp, leftVersion, leftBranch, leftDto.name].join('-') + ' vs ' + [rightApp, rightVersion, rightBranch, rightDto.name].join('-');
            diffCubes(rightDto, leftDto, title, appIdFrom(leftDto.app, leftDto.version, leftDto.status, leftDto.branch));
        } else {
            showNote('Unable to load cubes for compare!', 'Global Comparator Error', TWO_SECOND_TIMEOUT);
        }
    }

    function batchUpdateAxisReferencesOpen(isTransform) {
        showNote('Finding all reference axes, please wait...');
        setTimeout(function() {
            var opts;
            var result = call(CONTROLLER + CONTROLLER_METHOD.GET_REFERENCE_AXES, [getAppId()]);
            clearNote();
            if (!result.status) {
                showNote('Unable to load reference axes:<hr class="hr-small"/>' + result.data);
                return;
            }
            opts = {
                refAxList: result.data,
                appSelectList: loadAppNames(),
                populateVersionFunc: getVersions,
                populateBranchFunc: getBranchNamesByAppId,
                populateCubeFunc: getCubeListForApp,
                populateAxisFunc: getAxesFromCube,
                afterSave: batchUpdateAxisReferencesUpdate,
                readonly: _selectedBranch === head || !checkAppPermission(PERMISSION_ACTION.UPDATE),
                isTransform: isTransform
            };
            FormBuilder.openBuilderModal(NCEBuilderOptions.referenceAxisUpdater(opts));
        },1);
    }

    function updateRefAxData(data) {
        var i, len, refAx, updateVersion, updateStatus;
        var refAxes = [];
        var prefix = data.isTransform ? 'transform' : 'dest';
        var refAxList = data.refAxList;
        var updateApp = data.updateApp[0];
        var verSplit = data.updateVersion[0];
        var updateBranch = data.updateBranch[0];
        var updateCube = data.updateCube[0];
        var updateAxis = data.updateAxis ? data.updateAxis[0] : null;
        if (verSplit) {
            verSplit = verSplit.split('-');
            updateVersion = verSplit[0];
            updateStatus = verSplit[1];
        }

        for (i = 0, len = refAxList.length; i < len; i++) {
            if (data.isApplied[i]) {
                refAx = refAxList[i];
                if (data.breakTransform) {
                    refAx.transformApp = null;
                    refAx.transformVersion = null;
                    refAx.transformStatus = null;
                    refAx.transformBranch = null;
                    refAx.transformCubeName = null;
                } else {
                    refAx[prefix + 'App'] = updateApp;
                    if (verSplit) {
                        refAx[prefix + 'Version'] = updateVersion;
                        refAx[prefix + 'Status'] = updateStatus;
                        if (updateBranch) {
                            refAx[prefix + 'Branch'] = updateBranch;
                            if (updateCube) {
                                refAx[prefix + 'CubeName'] = updateCube;
                                if (updateAxis) {
                                    refAx.destAxisName = updateAxis;
                                }
                            }
                        }
                    }
                }
                refAxes.push(refAx);
            }
        }
        return refAxes;
    }

    function batchUpdateAxisReferencesUpdate(data) {
        var result, refAxes, refAxLen;
        clearNote();
        if (!data.updateApp[0] && !data.breakTransform) {
            showNote('No dropdown values selected!', null, TWO_SECOND_TIMEOUT);
            return;
        }
        refAxes = updateRefAxData(data);
        refAxLen = refAxes.length;
        if (!refAxLen) {
            showNote('No reference axes selected!', null, TWO_SECOND_TIMEOUT);
            return;
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_REFERENCE_AXES, [refAxes]);
        if (!result.status) {
            showNote('Unable to update reference axes:<hr class="hr-small"/>' + result.data);
            return;
        }
        showNote(refAxLen + ' ' + (refAxLen === 1 ? 'axis' : 'axes') + ' updated', '', TWO_SECOND_TIMEOUT);
        buildTabs(true);
        batchUpdateAxisReferencesOpen(data.isTransform);
    }

    function checkPermissions(appId, resource, actions) {
        return callPermCheck(appId, resource, actions, true);
    }

    function checkAppPermission(actions) {
        return callPermCheck(getAppId(), null, actions, false);
    }

    function callPermCheck(appId, resource, actions, checkModifiable) {
        var isList = typeof actions === OBJECT;
        var result = call(CONTROLLER + CONTROLLER_METHOD[isList ? 'CHECK_PERMISSIONS_MULTIPLE' : 'CHECK_PERMISSIONS'], [appId, resource, actions]);
        if (result.status) {
            if (!checkModifiable || ensureModifiable(null, appId)) {
                return result.data;
            }
        } else {
            showNote('Unable to check permissions:<hr class="hr-small"/>' + result.data);
        }
        return {};
    }

    function checkIsAppAdmin() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_ADMIN, [getAppId()]);
        if (result.status) {
            return result.data;
        }
        showNote('Unable to check for admin permissions:<hr class="hr-small"/>' + result.data);
    }

    function enableDisableReleaseMenu(canReleaseApp) {
        enableDisableMenuButton(_releaseCubesMenu, canReleaseApp, releaseCubes);
        enableDisableMenuButton(_changeVersionMenu, canReleaseApp, changeVersion);
        enableDisableMenuButton(_createSnapshotMenu, canReleaseApp, createSnapshotFromRelease);
    }

    function enableDisableCommitBranch(canCommitOnApp) {
        _branchCommit.toggle(canCommitOnApp);
    }

    function enableDisableLockMenu(isAppAdmin) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [getAppId()]);
        var isLocked;
        if (result.status) {
            isLocked = result.data;
            setLockUnlockMenuText(isLocked);
            setGetAppLockedByMenuText(isLocked);
        } else {
            showNote('Unable to check lock for app \'' + _selectedApp + '\':<hr class="hr-small"/>' + result.data);
        }

        enableDisableMenuButton(_lockUnlockAppMenu, isAppAdmin, lockUnlockApp);
    }

    function handleAppPermissions() {
        var canReleaseApp, canCommitOnApp;
        var permCheck = checkAppPermission([PERMISSION_ACTION.RELEASE, PERMISSION_ACTION.COMMIT]);
        var isAppAdmin = checkIsAppAdmin();
        if (permCheck) {
            canReleaseApp = permCheck[PERMISSION_ACTION.RELEASE];
            canCommitOnApp = permCheck[PERMISSION_ACTION.COMMIT];
        }

        enableDisableReleaseMenu(canReleaseApp);
        enableDisableCommitBranch(canCommitOnApp);
        enableDisableMenuButton(_clearCache, isAppAdmin || head !== getAppId().branch, clearCache);
        enableDisableLockMenu(isAppAdmin);
    }
    
    function buildBranchUpdateMenu() {
        var li = _branchCompareUpdateMenu.parent();
        li.find('ul').remove();
        _branchNames = getBranchNamesByAppId(getAppId());
        li.append(createBranchesUl(_branchNames, compareUpdateBranch));
    }

    function loadAppListView() {
        var ul, html, i, len, appNames;
        handleAppPermissions();
        html = '';
        appNames = loadAppNames();

        for (i = 0, len = appNames.length; i < len; i++) {
            html += '<li><a href="#">' + appNames[i] + '</a></li>';
        }

        ul = _appMenu.parent().find('.dropdown-menu');
        ul.empty();
        ul.append(html);
        ul.find('a').on('click', function() {
            onAppClick(this.innerHTML);
        });
        
        if (_selectedApp) {
            updateAppMenuText();
        }
    }
    
    function onAppClick(appName) {
        saveSelectedApp(appName);
        updateAppMenuText();
        //handleAppPermissions(); // occurs in loadAppListView below
        setVersionListLoading();
        setCubeListLoading();

        setTimeout(function() {   // Allow selection widget to update before loading content
            loadAppListView();
            loadVersionListView();
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            showActiveBranch();
            loadNCubes();
            runSearch();
            buildMenu();
            addToVisitedBranchesList(appIdFrom(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch));
        }, PROGRESS_DELAY);
    }
    
    function updateAppMenuText() {
        _appMenu.find('button')[0].innerHTML = _selectedApp + '&nbsp;<b class="caret"></b>';
    }

    function buildBranchQuickSelectMenu() {
        var list, i, len, html;
        var ul = _branchQuickSelectHeader.parent();
        var idx = ul.find('li').index(_branchQuickSelectHeader);
        ul.find('li:gt(' + idx + ')').remove();
        html = '';

        list = getVisitedBranchesList(appIdFrom(_selectedApp, _selectedVersion, _selectedStatus));
        for (i = 0, len = list.length; i < len; i++) {
            html += '<li><a href="#" class="anc-visited-branch">' + list[i] + '</a></li>';
        }
        ul.append(html);
        ul.find('a.anc-visited-branch').on('click', function() {
            changeBranch(this.innerHTML);
        });
    }

    function addToVisitedBranchesList(appId) {
        var list, oldIdx, branch;
        branch = appId.branch;
        if (branch === head) {
            return;
        }
        list = getVisitedBranchesList(appId);
        oldIdx = list.indexOf(branch);
        if (oldIdx > -1) {
            list.splice(oldIdx, 1);
        }
        list.splice(1, 0, branch);
        _visitedBranches[getTextAppIdNoBranch(appId)] = list.join(TAB_SEPARATOR);
        saveVisitedBranchesList();
    }

    function removeFromVisitedBranchesList(appId) {
        var id, list, oldIdx;
        id = getTextAppIdNoBranch(appId);
        list = getVisitedBranchesList(id);
        oldIdx = list.indexOf(appId.branch);
        if (oldIdx > -1) {
            list.splice(oldIdx, 1);
        }
        _visitedBranches[id] = list.join(TAB_SEPARATOR);
        saveVisitedBranchesList();
    }

    function clearVisitedBranchesList(appId) {
        delete _visitedBranches[getTextAppIdNoBranch(appId)];
        saveVisitedBranchesList();
    }

    function saveVisitedBranchesList() {
        localStorage[VISITED_BRANCHES] = JSON.stringify(_visitedBranches);
    }

    function getVisitedBranchesList(appId) {
        var id = getTextAppIdNoBranch(appId);
        if (_visitedBranches.hasOwnProperty(id)) {
            return _visitedBranches[id].split(TAB_SEPARATOR);
        }
        return [head];
    }

    function getTextAppIdNoBranch(appId) {
        return [appId.app, appId.version, appId.status].join(TAB_SEPARATOR);
    }
    
    function getTextAppId(appId) {
        return [appId.app, appId.version, appId.status, appId.branch].join(TAB_SEPARATOR);
    }

    function saveCubeSearchOptionsShown(isShown) {
        localStorage[CUBE_SEARCH_OPTIONS_SHOWN] = isShown;
    }

    function getCubeSearchOptionsShown() {
        return localStorage[CUBE_SEARCH_OPTIONS_SHOWN] === 'true';
    }

    function saveCubeSearchOptions() {
        var includes = _cubeSearchTagsInclude.val();
        var excludes = _cubeSearchTagsExclude.val();
        var allOptions = localStorage[CUBE_SEARCH_OPTIONS];
        allOptions = allOptions ? JSON.parse(allOptions) : {};
        allOptions[getTextAppId(getAppId())] = {
            contains: _cubeSearchContains.val(),
            tagsInclude: includes.length ? includes.split(',') : null,
            tagsExclude: excludes.length ? excludes.split(',') : null
        };
        localStorage[CUBE_SEARCH_OPTIONS] = JSON.stringify(allOptions);
    }

    function getCubeSearchOptions() {
        var appOptions;
        var allOptions = localStorage[CUBE_SEARCH_OPTIONS];
        if (allOptions) {
            appOptions = JSON.parse(allOptions)[getTextAppId(getAppId())];
            if (appOptions) {
                return appOptions;
            }
        }
        return {contains:null, tagsInclude:null, tagsExclude:null};
    }

    function applyCubeSearchOptions() {
        var opts = getCubeSearchOptions();
        _cubeSearchContains.val(opts.contains);
        _cubeSearchTagsInclude.val(opts.tagsInclude ? opts.tagsInclude.join(',') : null);
        _cubeSearchTagsExclude.val(opts.tagsExclude ? opts.tagsExclude.join(',') : null);
        if (hasSearchOptions(opts)) {
            _cubeSearchOptionsBtn.addClass('btn-info');
        } else {
            _cubeSearchOptionsBtn.removeClass('btn-info');
        }
        return opts;
    }

    function saveState() {
        var title, state;
        var tabAppId = getSelectedTabAppId();
        if (!tabAppId) {
            return;
        }
        title = [tabAppId.app || '',
                     tabAppId.version || '',
                     tabAppId.status || '',
                     tabAppId.branch || '',
                     _selectedCubeName || ''].join(' - ');
        document.title = title;
        state = history.state;
        if (state && appIdsEqual(state.tabAppId, tabAppId)
            && state.cube === _selectedCubeName) {
                // Don't save redundant selection
                return;
        }
        history.pushState({tabAppId:tabAppId, cube:_selectedCubeName, title:title}, title);
    }

    function loadVersionListView() {
        var versions, i, len, ul, html;
        html = '';
        versions = loadVersions();
        if (!versions)
            return;

        for (i = 0, len = versions.length; i < len; i++) {
            html += '<li><a href="#">' + versions[i] + '</a></li>';
        }

        ul = _versionMenu.parent().find('.dropdown-menu');
        ul.empty();
        ul.append(html);
        ul.find('a').on('click', onVersionClick);

        if (_selectedVersion) {
            _versionMenu[0].innerHTML = '<button class="btn-sm btn-primary">' + _selectedVersion + '-' + _selectedStatus + '&nbsp;<b class="caret"></b></button>';
        }
    }
    
    function onVersionClick(e) {
        var arr, version, status, value;
        value = e.target.textContent;
        arr = value.split('-');
        version = arr[0];
        status = arr[1];
        saveSelectedVersion(version);
        saveSelectedStatus(status);
        _versionMenu.find('button')[0].innerHTML = value + '&nbsp;<b class="caret"></b>';

        setCubeListLoading();

        setTimeout(function() {
            // Allow bootstrap-selection widget to update before loading content
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            showActiveBranch();
            loadNCubes();
            runSearch();
            buildMenu();
            addToVisitedBranchesList(appIdFrom(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch));
        }, PROGRESS_DELAY);
    }

    function getActiveTab() {
        return _mainTabPanel.find('div.active iframe');
    }

    function loadNCubeListView() {
        loadFilteredNCubeListView(_cubeList);
    }

    function loadFilteredNCubeListView(cubes) {
        var cubeIdx, cubeLen, cubeKeys, loName, activeTab;
        var filter = _searchNames.val().trim();
        var isNotHead = !isHeadSelected();
        var listItemHtml = '';
        _listOfCubes.empty();

        cubeKeys = Object.keys(cubes);
        for (cubeIdx = 0, cubeLen = cubeKeys.length; cubeIdx < cubeLen; cubeIdx++) {
            loName = cubeKeys[cubeIdx];
            listItemHtml += buildCubeListItem(loName, cubes[loName], filter, isNotHead);
        }

        _listOfCubes.append(listItemHtml);
        buildModifiedCubesList();
        _listOfCubes.find('a').on('click', function() {
            selectCubeByName($(this).data('itemname'));
        });

        if (!keyCount(cubes)) {   // Special case: 0 cubes
            activeTab = getActiveTab();
            if (activeTab && activeTab[0]) {   // Indicate to the active iFrame that a cube selection event has occurred.
                activeTab[0].contentWindow.cubeSelected();
            }
        }
        _cubeCount[0].textContent = cubeIdx;
    }

    function buildModifiedCubesList() {
        _listOfModifiedCubes.empty();
        _listOfModifiedCubes.append(_listOfCubes.find('li').has('a.cube-added, a.cube-modified').clone());
        _listOfModifiedCubes.find('a').on('click', function() { selectCubeByName($(this).data('itemname')); });
        _listOfModifiedCubes.find('a.ncube-selected').removeClass('ncube-selected').addClass('ncube-notselected');
    }

    function buildCubeListItem(loName, infoDto, filter, isNotHead) {
        var cubeName = infoDto.name;
        var classes = [];
        var innerHtml;

        if (filter && infoDto.pos !== null && infoDto.pos !== undefined && infoDto.endPos !== null && infoDto.endPos !== undefined) {
            innerHtml = cubeName.substring(0, infoDto.pos);
            innerHtml += '<span class="search-hilite">';
            innerHtml += cubeName.substring(infoDto.pos, infoDto.endPos);
            innerHtml += '</span>';
            innerHtml += cubeName.substring(infoDto.endPos);
        } else {
            innerHtml = cubeName;
        }

        classes.push(_selectedCubeName === cubeName ? CLASS_NCUBE_SELECTED : CLASS_NCUBE_NOT_SELECTED);
        if (isNotHead) {
            if (!infoDto.headSha1) {
                classes.push(CHANGETYPE.CREATED.CSS_CLASS);
            } else if (infoDto.changed) {
                classes.push(CHANGETYPE.UPDATED.CSS_CLASS);
            }
        }

        return '<li><a href="#" data-itemname="' + loName + '" class="' + classes.join(' ') + '">' + innerHtml + '</a></li>';
    }

    function getProperCubeName(cubeName) {
        var nameToChk = (cubeName + '').toLowerCase();
        var info = _cubeList[nameToChk];
        if (info) {
            return info.name;
        }
        if (getInfoDto()) {
            return getInfoDto().name;
        }
        return null;
    }

    function loadCube() {
        var activeTab;
        saveState();
        try {
            activeTab = getActiveTab();
            if (activeTab && activeTab[0]) {   // Indicate to the active iFrame that a cube selection event has occurred.
                activeTab[0].contentWindow.cubeSelected();
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Tweak the class name of the selected / non-selected items
     * to match what was selected.
     */
    function setListSelectedStatus(itemName, listId) {
        var items, loItemName;
        items = $(listId).find('li a');
        items.filter('.ncube-selected').removeClass('ncube-selected').addClass('ncube-notselected');
        if (itemName === null || itemName === undefined) {
            return;
        }
        loItemName = itemName.toLowerCase();

        items.filter(function() {
            var anchor = $(this);
            var text = anchor[0].textContent;
            var elemName = anchor.data('itemname');
            if (loItemName === elemName || itemName === text) {
                anchor.scrollintoview();
                return true;
            }
            return false;
        }).removeClass('ncube-notselected').addClass('ncube-selected');
    }

    /**
     * Load NCube List from Database
     */
    function loadNCubes() {
        var result, first, dtos, dto, i, len, name;
        _cubeList = {};
        if (!_selectedApp) {
            return;
        }
        if (!_selectedVersion) {
            return;
        }
        if (!_selectedStatus) {
            return;
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.SEARCH, [getAppId(), '*', null, getDefaultSearchOptions()]);
        if (result.status) {
            dtos = result.data;
            for (i = 0, len = dtos.length; i < len; i++) {
                dto = null;
                dto = dtos[i];
                name = dto.name;
                _cubeList[name.toLowerCase()] = dto;
                if (!first) {
                    first = name;
                }
            }
        } else {
            showNote('Unable to load n-cubes:<hr class="hr-small"/>' + result.data);
        }
    }

    function doesCubeExist() {
        var nameToChk = (_selectedCubeName + '').toLowerCase();
        return nameToChk in _cubeList;
    }

    function getVersions(app) {
        var result;
        app = app || _selectedApp;
        if (!app) {
            showNote('Unable to load versions, no n-cube App selected.');
            return;
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.GET_VERSIONS, [app]);
        if (result.status) {
            return result.data;
        }
        showNote('Unable to load versions:<hr class="hr-small"/>' + result.data);
    }

    function loadVersions(app) {
        var arr;
        var versions = getVersions(app);

        if (versions && !_selectedVersion || !doesVersionExist(versions, _selectedVersion, _selectedStatus)) {
            if (versions.length) {
                arr = versions[0].split('-');
            }
            saveSelectedVersion(arr ? arr[0] : null);
            saveSelectedStatus(arr ? arr[1] : null);
        }
        
        return versions;
    }

    function doesVersionExist(versions, selVer, selStatus) {
        var i, len;
        var chkVer = selVer + '-' + selStatus;
        for (i = 0, len = versions.length; i < len; i++) {
            if (versions[i] === chkVer) {
                return true;
            }
        }
        return false;
    }

    function loadAppNames() {
        var result;
        var apps = [];
        result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_NAMES, []);
        if (result.status) {
            apps = null;
            apps = result.data;
        } else {
            showNote('Unable to load n-cube Apps:<hr class="hr-small"/>' + result.data);
        }
        
        if (apps.length && (!_selectedApp || apps.indexOf(_selectedApp) === -1)) {
            saveSelectedApp(apps[0]);
        }
        return apps;
    }

    function newCube() {
        var opts;
        if (isHeadSelected()) {
            selectBranch();
            return false;
        }

        opts = {
            appId: getAppId(),
            appSelectList: loadAppNames(),
            populateVersionFunc: function(app) { return getAppVersions(app, STATUS.SNAPSHOT); },
            afterSave: newCubeSave
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.newCube(opts));
    }

    function newCubeSave(data) {
        var appId, result;
        var app = data.app;
        var version = data.version;
        var cubeName = data.cubeName;

        if (!version) {
            showNote("Note", "Version must be x.y.z");
            return;
        }
        appId = getAppId();
        appId.version = version;
        appId.app = app;
        result = call(CONTROLLER + CONTROLLER_METHOD.CREATE_CUBE, [appId, cubeName]);
        if (result.status) {
            saveSelectedApp(app);
            saveSelectedVersion(version);
            addToVisitedBranchesList(appId);
            loadAppListView();
            loadVersionListView();
            loadNCubes();
            clearSearch();
            selectCubeByName(cubeName);
        } else {
            showNote("Unable to create n-cube '" + cubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function buildFbCubesListTableData(dtos) {
        var i, len, dto, keys, changeType, displayType, prevChangeType, obj;
        var tableData = [];
        if (typeof dtos === OBJECT) {
            keys = Object.keys(dtos);
            len = keys.length;
        } else {
            len = dtos.length;
        }
        for (i = 0; i < len; i++) {
            obj = {};
            dto = keys ? dtos[keys[i]] : dtos[i];
            changeType = dto.changeType;
            if (changeType && changeType !== prevChangeType) {
                prevChangeType = changeType;
                displayType = getLabelDisplayTypeForInfoDto(dto);
                obj._sectionHeading = displayType.LABEL;
            }
            obj._sectionClass = (displayType || {}).CSS_CLASS;
            obj.cubeName = dto.name;
            obj.cubeId = dto.id;
            obj.revision = dto.revision;
            tableData.push(obj);
        }
        return tableData;
    }

    function deleteCube() {
        var opts, tableData;
        if (!ensureModifiable('Cannot delete cubes.', getAppId())) {
            return;
        }

        opts = {
            title: 'Delete cubes from ' + _selectedApp,
            saveButtonText: 'Delete',
            onHtmlClick: onHtmlViewClick,
            onJsonClick: onJsonViewClick,
            afterSave: function(data) {
                callDelete(getFbCubeListData(data));
            }
        };
        tableData = buildFbCubesListTableData(_cubeList);
        FormBuilder.openBuilderModal(NCEBuilderOptions.showCubeList(opts), tableData);
    }

    function getFbCubeListData(data) {
        var i, len, row;
        var cubeList = [];
        for (i = 0, len = data.length; i < len; i++) {
            row = data[i];
            if (row.isSelected) {
                cubeList.push(row.cubeName);
            }
        }
        return cubeList;
    }

    function removeDeletedCubeFromOpenCubes(cubeInfo, cubeName) {
        var x, cis;
        delete _cubeList[cubeName.toLowerCase()];
        if (_selectedCubeName === cubeName) {
            _selectedCubeName = null;
            _activeTabViewType = null;
            delete localStorage[SELECTED_CUBE];
            delete localStorage[ACTIVE_TAB_VIEW_TYPE];
        }

        cubeInfo[CUBE_INFO.NAME] = cubeName;
        cis = getCubeInfoKey(cubeInfo);
        for (x = _openCubes.length - 1; x >= 0; x--) {
            if (_openCubes[x].cubeKey.indexOf(cis) > -1) {
                _openCubes.splice(x, 1);
            }
        }
    }

    function callDelete(cubesToDelete) {
        var i, len, cubeInfo;
        var result = call(CONTROLLER + CONTROLLER_METHOD.DELETE_CUBES, [getAppId(), cubesToDelete]);
        if (result.status) {
            cubeInfo = buildCubeInfo(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch);
            for (i = 0, len = cubesToDelete.length; i < len; i++) {
                removeDeletedCubeFromOpenCubes(cubeInfo, cubesToDelete[i]);
            }
            saveOpenCubeList();
            buildTabs(true);
            runSearch();
        } else {
            showNote("Unable to delete cubes: " + '<hr class="hr-small"/>' + result.data);
        }
    }

    function callDeleteFromTab(cubeToDelete) {
        var cubeInfo;
        var appId = getSelectedTabAppId();
        var result = call(CONTROLLER + CONTROLLER_METHOD.DELETE_CUBES, [appId, [cubeToDelete]]);
        if (result.status) {
            cubeInfo = buildCubeInfo(appId.app, appId.version, appId.status, appId.branch);
            removeDeletedCubeFromOpenCubes(cubeInfo, cubeToDelete);
            if (appIdsEqual(appId, getAppId())) {
                delete _cubeList[cubeToDelete.toLowerCase()];
                runSearch();
            }

            saveOpenCubeList();
            buildTabs(true);
        } else {
            showNote("Unable to delete cubes: " + '<hr class="hr-small"/>' + result.data);
        }
    }

    function restoreCube() {
        var opts, tableData, result;
        clearNote();
        if (!ensureModifiable('Cannot restore cubes.', getAppId())) {
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.SEARCH, [getAppId(), "*", null, getDeletedRecordsSearchOptions()]);
        if (!result.status) {
            showNote('Error fetching deleted cubes (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
            return;
        }

        opts = {
            title: 'Restore cubes to ' + _selectedApp,
            saveButtonText: 'Restore',
            onHtmlClick: onHtmlViewClick,
            onJsonClick: onJsonViewClick,
            afterSave: function(data) {
                callRestore(getFbCubeListData(data));
            }
        };
        tableData = buildFbCubesListTableData(result.data);
        FormBuilder.openBuilderModal(NCEBuilderOptions.showCubeList(opts), tableData);
    }

    function callRestore(cubesToRestore) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.RESTORE_CUBES, [getAppId(), cubesToRestore]);
        if (result.status) {
            loadNCubes();
            if (cubesToRestore.length === 1) {
                selectCubeByName(cubesToRestore[0]);
            }
            clearSearch();
        } else {
            showNote("Unable to restore cubes':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function revisionHistory(ignoreVersion) {
        var appId = getSelectedTabAppId();
        _revisionHistoryList.empty();
        _revisionHistoryLabel[0].textContent = 'Revision History for ' + _selectedCubeName;
        showNote('Loading...', null, null, NOTE_CLASS.PROCESS_DURATION);
        call(CONTROLLER + CONTROLLER_METHOD.GET_REVISION_HISTORY, [appId, _selectedCubeName, ignoreVersion], {callback:function(result) {
            revisionHistoryCallback(appId, ignoreVersion, result);
        }});
    }

    function annotateCell(cellId, ignoreVersion) {
        var appId = getSelectedTabAppId();
        _revisionHistoryList.empty();
        _revisionHistoryLabel[0].textContent = 'Cell Revision History';
        showNote('Loading...', null, null, NOTE_CLASS.PROCESS_DURATION);
        call(CONTROLLER + CONTROLLER_METHOD.GET_CELL_ANNOTATION, [appId, _selectedCubeName, cellId, ignoreVersion], {callback:function(result) {
            revisionHistoryCallback(appId, ignoreVersion, result);
        }});
    }
    
    function revisionHistoryCallback(appId, ignoreVersion, result) {
        var dtos, dto, i, len, html, text, date, prevVer, curVer;
        clearNotes(NOTE_CLASS.PROCESS_DURATION);
        if (result.status) {
            html = '';
            dtos = result.data;
            dtos.sort(function(a, b) {
                var aArr = a.version.split('.');
                var bArr = b.version.split('.');
                return bArr[0] - aArr[0]
                    || bArr[1] - aArr[1]
                    || bArr[2] - aArr[2]
                    || Math.abs(b.revision) - Math.abs(a.revision);
            });

            for (i = 0, len = dtos.length; i < len; i++) {
                dto = null;
                dto = dtos[i];

                if (ignoreVersion) {
                    curVer = dto.version + '-' + dto.status;
                    if (curVer !== prevVer) {
                        prevVer = curVer;
                        html += '<li class="list-group-item skinny-lr"><b>' + prevVer + '</b></li>';
                    }
                }
                text = 'rev: ' + dto.revision + '&nbsp;&nbsp;&nbsp;';
                if (dto.hasOwnProperty('notes') && dto.notes !== '') {
                    text += dto.notes;
                } else {
                    date = '';
                    if (dto.hasOwnProperty('createDate')) {
                        date = new Date(dto.createDate).format('yyyy-mm-dd HH:MM:ss');
                    }
                    text += date + '&nbsp;&nbsp;&nbsp;' + dto.createHid;
                }

                html += '<li class="list-group-item skinny-lr">'
                      + '<div class="container-fluid">'
                      + '<label class="col-xs-1" style="padding:0; width:12%; margin:0 10px 0 0;">'
                      + '<a href="#" class="anc-html" style="margin:0 10px 0 0;" data-cube-id="' + dto.id + '" data-rev-id="' + dto.revision + '" data-cube-name="' + dto.name + '"><kbd>HTML</kbd></a>'
                      + '<a href="#" class="anc-json" style="margin:0 10px 0 0;" data-cube-id="' + dto.id + '" data-rev-id="' + dto.revision + '" data-cube-name="' + dto.name + '"><kbd>JSON</kbd></a>'
                      + '</label>'
                      + '<label class="checkbox no-margins col-xs-10">'
                      + '<input type="checkbox" class="commitCheck" data-cube-id="' + dto.id + '" data-rev-id="' + dto.revision + (ignoreVersion ? ('" data-version="' + curVer) : '') + '" />'
                      + text
                      + '</label>'
                      + '</div></li>';
            }

            _revisionHistoryList.append(html);
            addJsonHtmlListeners(_revisionHistoryList);
            _revisionHistoryModal.modal();
        } else {
            showNote('Error fetching revision history (' + appId.version + ', ' + appId.status + '):<hr class="hr-small"/>' + result.data);
        }
    }
    
    function addJsonHtmlListeners(ul) {
        ul.find('a.anc-html').on('click', function () {
            var el = $(this);
            onHtmlViewClick(el.data('cube-name'), el.data('cube-id'), el.data('rev-id'));
        });
        ul.find('a.anc-json').on('click', function () {
            var el = $(this);
            onJsonViewClick(el.data('cube-name'), el.data('cube-id'), el.data('rev-id'));
        });
    }

    function onHtmlViewClick(cubeName, cubeId, revId) {
        var title = cubeName + '.rev.' + revId + '.html';
        var oldWindow = window.open('', title);
        var result = call(CONTROLLER + CONTROLLER_METHOD.LOAD_CUBE_BY_ID, [getSelectedTabAppId(), cubeId, JSON_MODE.HTML], {noResolveRefs:true});
        if (result.status) {
            oldWindow.document.removeChild(oldWindow.document.documentElement);
            oldWindow.document.write(result.data);
            oldWindow.document.title = title;
        }
    }

    function onJsonViewClick(cubeName, cubeId, revId) {
        var w;
        var result = call(CONTROLLER + CONTROLLER_METHOD.LOAD_CUBE_BY_ID, [getSelectedTabAppId(), cubeId, JSON_MODE.PRETTY], {noResolveRefs:true});
        if (result.status) {
            w = popoutAceEditor({
                value: result.data,
                readonly: true,
                mode: 'json'
            });
            w.document.title = cubeName + '.rev.' + revId + '.json';
        }
    }

    function getSelectedRevisions() {
        var obj, checkboxes, i, len, checkbox;
        obj = {
            cubeIds: [],
            revIds: [],
            versions: []
        };
        checkboxes = _revisionHistoryList.find('.commitCheck:checked');
        for (i = 0, len = checkboxes.length; i < len; i++) {
            checkbox = null;
            checkbox = $(checkboxes[i]);
            obj.cubeIds.push(checkbox.data('cube-id'));
            obj.revIds.push(checkbox.data('rev-id'));
            obj.versions.push(checkbox.data('version'));           // This is only available on HEAD rev history
        }
        return obj;
    }

    function compareRevisions() {
        var loIdx, hiIdx, title, diffOptions;
        var revs = getSelectedRevisions();
        var revIds = revs.revIds;
        var cubeIds = revs.cubeIds;
        var versions = revs.versions;

        if (revIds.length !== 2) {
            showNote('Must select exactly 2 for comparison', 'Note', TWO_SECOND_TIMEOUT);
            return;
        }
        
        if (versions[0]) {
            loIdx = versions[0] < versions[1] ? 0 : 1;
            hiIdx = versions[0] < versions[1] ? 1 : 0;
            title = [versions[loIdx], revIds[loIdx]].join('-') + ' vs ' + [versions[hiIdx], revIds[hiIdx]].join('-');
        } else {
            loIdx = revIds[0] < revIds[1] ? 0 : 1;
            hiIdx = revIds[0] < revIds[1] ? 1 : 0;
            title = revIds[loIdx] + ' vs ' + revIds[hiIdx];
        }

        diffOptions = {
            leftName: revIds[loIdx],
            rightName: revIds[hiIdx],
            title: title,
            appId: getSelectedTabAppId(),
            cubeName: _selectedCubeName,
            canEdit: false,
            cantEditReason: 'Unable to merge into non-current revision.'
        };
        diffCubeRevs(cubeIds[hiIdx], cubeIds[loIdx], diffOptions);
    }

    function promoteRevision() {
        var note, result;
        var revs = getSelectedRevisions();
        var revIds = revs.revIds;

        if (!revIds.length) {
            note = 'Must select a revision to promote.';
        } else if (revIds.length > 1) {
            note = 'Must select only 1 revision to promote.';
        }
        if (note) {
            showNote(note, 'Note', TWO_SECOND_TIMEOUT);
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.PROMOTE_REVISION, [revs.cubeIds[0]]);
        if (result.status) {
            loadCube();
            revisionHistoryOk();
        } else {
            showNote("Unable to promote n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function clearRevSelection() {
        _revisionHistoryList.find('.commitCheck:checked').removeAttr("checked");
    }

    function revisionHistoryOk() {
        _revisionHistoryModal.modal('hide');
    }

    function renameCube(newName) {
        var oldCubeInfo, newCubeInfo, oldCis, newCis, i, len, openCube;
        var result = call("ncubeController.renameCube", [getSelectedTabAppId(), _selectedCubeName, newName]);
        if (result.status) {
            oldCubeInfo = buildCubeInfo(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, _selectedCubeName);
            oldCis = getCubeInfoKey(oldCubeInfo);

            newCubeInfo = buildCubeInfo(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, newName, getActiveTabViewType());
            newCis = getCubeInfoKey(newCubeInfo);

            for (i = 0, len = _openCubes.length; i < len; i++) {
                openCube = _openCubes[i];
                if (openCube.cubeKey.indexOf(oldCis) > -1) {
                    openCube.cubeKey = newCis;
                }
            }
            saveOpenCubeList();
            saveSelectedCubeName(newName);
            buildTabs(true, newCubeInfo);
            loadCube();
            if (appIdsEqual(getSelectedTabAppId(), getAppId())) {
                loadNCubes();
                runSearch();
            }
        } else {
            showNote("Unable to rename n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function dupeCube() {
        var opts;
        var appId = getSelectedTabAppId();
        if (!appId.app || !appId.version || !_selectedCubeName || !appId.status) {
            showNote('No n-cube selected. Nothing to duplicate.');
            return;
        }
        if (isSelectedCubeInHead()) {
            selectBranch();
            return;
        }

        opts = {
            appId: appId,
            cubeName: _selectedCubeName,
            appSelectList: loadAppNames(),
            populateVersionFunc: getAppVersions,
            populateBranchFunc: getBranchNamesByAppId,
            readonly: false,
            afterSave: dupeCubeCopy
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.copyCube(opts));
    }

    function getAppVersions(app, status) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_VERSIONS, [app, status]);
        if (!result.status) {
            showNote('Failed to load App versions:<hr class="hr-small"/>' + result.data);
            return [];
        }
        return result.data;
    }

    function dupeCubeCopy(data) {
        var newName = data.cubeName;
        var newApp = data.app;
        var newVersion = data.version;
        var newBranch = data.branch;
        var destAppId = appIdFrom(newApp, newVersion, STATUS.SNAPSHOT, newBranch);
        var result = call(CONTROLLER + CONTROLLER_METHOD.DUPLICATE_CUBE, [getSelectedTabAppId(), destAppId, _selectedCubeName, newName]);
        if (result.status) {
            saveSelectedApp(newApp);
            loadAppListView();
            saveSelectedStatus(STATUS.SNAPSHOT);
            saveSelectedVersion(newVersion);
            loadVersionListView();
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            saveSelectedBranch(newBranch);
            showActiveBranch();
            loadNCubes();
            clearSearch();
            selectCubeByName(newName);
            buildMenu();
        } else {
            showNote("Unable to duplicate n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function showRefsFromCube() {
        var cubeNames, opts;
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_REFERENCES_FROM, [getSelectedTabAppId(), _selectedCubeName]);
        if (result.status) {
            cubeNames = result.data;
            if (cubeNames.length) {
                opts = {
                    cubeName: _selectedCubeName,
                    refClick: function (e) {
                        selectCubeByName(e.target.textContent, getSelectedTabAppId());
                        FormBuilder.closeBuilderModal();
                    }
                };
                FormBuilder.openBuilderModal(NCEBuilderOptions.outboundRefs(opts), cubeNames);
            } else {
                showNote('No references to show.', null, TWO_SECOND_TIMEOUT);
            }
        } else {
            showNote('Error fetching outbound references for ' + _selectedCubeName + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showReqScope() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_REQUIRED_SCOPE, [getSelectedTabAppId(), _selectedCubeName]);
        if (result.status) {
            FormBuilder.openBuilderModal(NCEBuilderOptions.requiredScope({cubeName: _selectedCubeName}), result.data);
        } else {
            showNote('Error fetching required scope for: ' + _selectedCubeName + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function setLockUnlockMenuText(isLocked) {
        var lockUnlockMenuText = isLocked ? 'Unlock ' : 'Lock ';
        lockUnlockMenuText += _selectedApp;
        _lockUnlockAppMenu[0].innerHTML = lockUnlockMenuText;
    }

    function lockUnlockApp() {
        var appId = getAppId();
        var isLockedResult = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [appId]);
        var isLocked, lockAppResult;
        if (isLockedResult.status) {
            isLocked = isLockedResult.data;
        } else {
            showNote("Unable to check lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + isLockedResult.data);
            return;
        }
        lockAppResult = call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, !isLocked]);
        if (lockAppResult.status) {
            setLockUnlockMenuText(!isLocked);
            setGetAppLockedByMenuText(!isLocked);
        } else {
            showNote("Unable to change lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + lockAppResult.data);
        }
    }

    function getAppLockedBy() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_LOCKED_BY, [getAppId()]);
        if (result.status) {
            return result.data;
        } else {
            showNote("Unable to change lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function setGetAppLockedByMenuText(isLocked) {
        _getAppLockedByMenu[0].innerHTML = isLocked ? 'Locked by ' + getAppLockedBy() : '';
    }

    //////////////////////////////////////////   BEGIN RELEASE PROCESS   ///////////////////////////////////////////////

    function releaseCubes() {
        var opts;
        if (!_isReleasePending) {
            if (_selectedBranch !== head) {
                showNote('HEAD branch must be selected to release a version.');
                return;
            }

            _releaseCubesNewVersion = '';
            setReleaseCubesProgress(0, 'Ready to release');
        }
        opts = {
            app: _selectedApp,
            version: _selectedVersion,
            initProgress: _releaseCubesProgressPct,
            initProgressInfo: _releaseCubesProgressText,
            newVersion: _releaseCubesNewVersion,
            afterSave: releaseCubesOk,
            onClose: stopUpdateProgressUi,
            readonly: _isReleasePending
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.releaseVersion(opts));
    }

    function setReleaseCubesProgress(progress, msg, shouldStopUpdateProgressUi) {
        _releaseCubesProgressPct = progress;
        _releaseCubesProgressText = msg;
        if (shouldStopUpdateProgressUi) {
            stopUpdateProgressUi();
        }
    }

    function updateProgressUi() {
        NCEBuilderOptions.releaseVersion({}).updateProgress(_releaseCubesProgressPct, _releaseCubesProgressText);
    }

    function stopUpdateProgressUi() {
        clearInterval(updateProgressUi);
        updateProgressUi();
        _isReleasePending = false;
    }

    function releaseCubesOk(data) {
        _releaseCubesNewVersion = data.newVersion;

        setInterval(updateProgressUi, ONE_SECOND_TIMEOUT);
        _isReleasePending = true;
        NCEBuilderOptions.releaseVersion({}).toggleReleaseButton(false);
        setReleaseCubesProgress(0, 'Locking app...');
        lockAppForRelease(getAppId(), _releaseCubesNewVersion);
    }

    function lockAppForRelease(appId, newSnapVer) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [appId]);
        if (!result.status){
            setReleaseCubesProgress(0, 'Error checking lock: ' + result.data, true);
            return;
        }
        if (result.data) {
            lockAppForReleaseCallback(appId, newSnapVer);
            return;
        }

        call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, true], {callback: function(result) {
            if (result.status) {
                setTimeout(function() {
                        lockAppForReleaseCallback(appId, newSnapVer);
                }, TEN_SECOND_TIMEOUT);
            } else {
                setReleaseCubesProgress(0, 'Unable to lock app: ' + result.data, true);
            }
        }});
    }

    function lockAppForReleaseCallback(appId, newSnapVer) {
        var branchName, i, len;
        var branchNamesWithoutHead = [];
        setReleaseCubesProgress(0, 'Updating branch names...');
        _branchNames = getBranchNamesByAppId(getAppId());
        for (i = 0, len = _branchNames.length; i < len; i++) {
            branchName = _branchNames[i];
            if (branchName !== head) {
                branchNamesWithoutHead.push(branchName);
            }
        }
        if (branchNamesWithoutHead.length) {
            moveOrDeleteBranch(appId, newSnapVer, branchNamesWithoutHead, 0);
        } else {
            releaseVersion(appId, newSnapVer);
        }
    }

    function moveOrDeleteBranch(appId, newSnapVer, branchNames, branchIdx) {
        var method = newSnapVer ? CONTROLLER_METHOD.MOVE_BRANCH : CONTROLLER_METHOD.DELETE_BRANCH;
        var params = newSnapVer ? [appId, newSnapVer] : [appId];
        var len = branchNames.length;
        var progress = Math.round(branchIdx / (len + 1) * 100);

        appId.branch = branchNames[branchIdx];
        setReleaseCubesProgress(progress, 'Processing branch ' + (branchIdx + 1) + ' of ' + len + ': ' + appId.branch);
        call(CONTROLLER + method, params, {callback: function(result) {
            if (result.status) {
                if (branchIdx < len - 1) {
                    moveOrDeleteBranch(appId, newSnapVer, branchNames, branchIdx + 1);
                } else {
                    releaseVersion(appId, newSnapVer);
                }
            } else {
                setReleaseCubesProgress(progress, 'Error: ' + result.data, true);
            }
        }});
    }

    function releaseVersion(appId, newSnapVer) {
        var len = _branchNames.length;
        var progress = Math.round((len - 1) / len * 100);

        setReleaseCubesProgress(progress, 'Processing release of HEAD...');
        call(CONTROLLER + CONTROLLER_METHOD.RELEASE_VERSION, [appId, newSnapVer], {callback: function(result) {
            if (result.status) {
                if (newSnapVer) {
                    copyReleasedHeadToNewSnapshot(appId, newSnapVer, progress);
                } else {
                    finalizeRelease(appId, newSnapVer);
                }
            } else {
                setReleaseCubesProgress(progress, 'Error: ' + result.data, true);
            }
        }});
    }

    function copyReleasedHeadToNewSnapshot(appId, newSnapVer, progress) {
        var copyAppId = {
            app: appId.app,
            version: newSnapVer,
            status: STATUS.SNAPSHOT,
            branch: head
        };
        appId.branch = head;
        appId.status = STATUS.RELEASE;

        setReleaseCubesProgress(progress, 'Creating new SNAPSHOT from HEAD...');
        call(CONTROLLER + CONTROLLER_METHOD.COPY_BRANCH, [appId, copyAppId], {callback: function(result) {
            if (result.status) {
                finalizeRelease(appId, newSnapVer);
            } else {
                setReleaseCubesProgress(progress, 'Error: ' + result.data, true);
            }
        }});
    }

    function finalizeRelease(appId, newSnapVer) {
        setReleaseCubesProgress(100, 'Unlocking app... ');
        call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, false], {callback: function(result) {
            if (result.status) {
                if (newSnapVer) {
                    updateCubeInfoInOpenCubeList(CUBE_INFO.VERSION, newSnapVer);
                    saveSelectedVersion(newSnapVer);
                } else {
                    saveSelectedStatus(STATUS.RELEASE);
                }
                setReleaseCubesProgress(100, 'Success!', true);
                loadVersionListView();
                loadNCubes();
                loadCube();
                runSearch();
            } else {
                setReleaseCubesProgress(0, 'Unable to unlock app: ' + result.data, true);
            }
        }});
    }

    ///////////////////////////////////////////   END RELEASE PROCESS   ////////////////////////////////////////////////

    function changeVersion() {
        var opts;
        if (_selectedStatus !== STATUS.SNAPSHOT) {
            showNote('Only a SNAPSHOT version can be modified.');
            return;
        }

        opts = {
            app: _selectedApp,
            version: _selectedVersion,
            afterSave: changeVersionOk
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.changeSnapshotVersion(opts));
    }

    function changeVersionOk(data) {
        var newSnapVer = data.newVersion;
        var result = call(CONTROLLER + CONTROLLER_METHOD.CHANGE_VERSION_VALUE, [getAppId(), newSnapVer]);
        if (!result.status) {
            showNote("Unable to change SNAPSHOT version to value '" + newSnapVer + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        updateCubeInfoInOpenCubeList(CUBE_INFO.VERSION, newSnapVer);
        saveSelectedVersion(newSnapVer);
        loadVersionListView();
        loadNCubes();
        loadCube();
        runSearch();
    }

    function createSnapshotFromRelease() {
        var opts;
        if (_selectedStatus !== STATUS.RELEASE) {
            showNote('Must select a released version to copy.');
            return;
        }
        opts = {
            app: _selectedApp,
            version: _selectedVersion,
            afterSave: createSnapshotFromReleaseOk
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.createSnapshotFromRelease(opts));
    }

    function createSnapshotFromReleaseOk(data) {
        var copyAppId = appIdFrom(_selectedApp, data.newVersion, STATUS.SNAPSHOT, head);
        var result = call(CONTROLLER + CONTROLLER_METHOD.COPY_BRANCH, [getAppId(), copyAppId]);
        if (!result.status) {
            showNote('Error creating new SNAPSHOT:<hr class="hr-small"/>' + result.data);
            return;
        }

        saveSelectedVersion(data.newVersion);
        saveSelectedStatus(STATUS.SNAPSHOT);
        loadVersionListView();
        loadNCubes();
        runSearch();
    }

    function doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo, appId) {
        var doesAppMatch, doesVersionMatch, doesStatusMatch, doesBranchMatch;
        if (!appId) {
            appId = getAppId();
        }
        doesAppMatch = cubeInfo[CUBE_INFO.APP] === appId.app;
        doesVersionMatch = cubeInfo[CUBE_INFO.VERSION] === appId.version;
        doesStatusMatch = cubeInfo[CUBE_INFO.STATUS] === appId.status;
        doesBranchMatch = cubeInfo[CUBE_INFO.BRANCH] === appId.branch;

        switch (cubeInfoPart) {
            case CUBE_INFO.APP:
                return doesAppMatch;
            case CUBE_INFO.VERSION:
                return doesAppMatch && doesVersionMatch;
            case CUBE_INFO.STATUS:
                return doesAppMatch && doesVersionMatch && doesStatusMatch;
            case CUBE_INFO.BRANCH:
                return doesAppMatch && doesVersionMatch && doesStatusMatch && doesBranchMatch;
        }
    }

    function updateCubeInfoInOpenCubeList(cubeInfoPart, newValue) {
        var i, len, cubeInfo;
        for (i = 0, len = _openCubes.length; i < len; i++) {
            cubeInfo = getCubeInfo(_openCubes[i].cubeKey);
            if (doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo)) {
                cubeInfo[cubeInfoPart] = newValue;
                _openCubes[i].cubeKey = getCubeInfoKey(cubeInfo);
            }
        }
        saveOpenCubeList();

        if (doesCubeInfoMatchOldAppId(cubeInfoPart, _selectedCubeInfo)) {
            _selectedCubeInfo[cubeInfoPart] = newValue;
        }
         buildTabs(true);
    }

    function removeCubeInfoInOpenCubeList(cubeInfoPart) {
        var i, cubeInfo;
        for (i = _openCubes.length; i--;) {
            cubeInfo = getCubeInfo(_openCubes[i].cubeKey);
            if (doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo)) {
                _openCubes.splice(i, 1);
            }
        }
        saveOpenCubeList();

        if (doesCubeInfoMatchOldAppId(cubeInfoPart, _selectedCubeInfo)) {
            saveSelectedCubeInfo(_openCubes.length ? getCubeInfo(_openCubes[0].cubeKey) : []);
        }
        buildTabs(true);
    }

    function ensureModifiable(operation, overrideAppId) {
        var appId = overrideAppId || getSelectedTabAppId() || getAppId();
        if (!operation) {
            operation = '';
        }
        if (!appId.app || !appId.version || !appId.status || !appId.branch) {
            showNote(operation + ' No application information detected.');
            return false;
        }
        if (appId.status === STATUS.RELEASE) {
            showNote(operation + ' Only a SNAPSHOT version can be modified.');
            return false;
        }
        if (appId.branch === head) {
            showNote(operation + ' HEAD branch cannot be modified.');
            return false;
        }
        return true;
    }

    function viewPullRequestsSearchTransactionId(txid) {
        var jqrow = _viewPullRequestsList.find('[data-txid="' + txid + '"]');
        var row = jqrow[0];
        if (row) {
            if (!jqrow.hasClass('highlight-lightgoldenrodyellow')) {
                jqrow.show();
                pullRequestListClick(row);
            }
            _viewPullRequestsModal.find('.modal-body')[0].scrollTop = row.offsetTop;
        } else {
            showNote(txid + ' was not found.', 'Transaction ID not found!', TWO_SECOND_TIMEOUT);
        }
    }

    function viewPullRequests(isUpdate, txid) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_PULL_REQUESTS, [null, null]);
        if (result.status) {
            _pullRequestData = result.data;
            buildUlForPullRequestView(isUpdate);
            _viewPullRequestsModal.modal();
            if (txid) {
                if (_viewPullRequestsModal.hasClass('in')) {
                    viewPullRequestsSearchTransactionId(txid);
                } else {
                    _viewPullRequestsModal.one('shown.bs.modal', function() {
                        viewPullRequestsSearchTransactionId(txid);
                    });
                }
            }
        } else {
            showNote('Unable to get pull request list.', 'Error', TWO_SECOND_TIMEOUT);
        }
    }

    function viewPullRequestsFilter() {
        var i, len, el, filterVal;
        var selects = _viewPullRequestsModal.find('select');
        var populatedSelects = selects.filter(function() { return this.value.length; });
        pullRequestListClick(); // close open row
        _viewPullRequestsList.find('tr').show();
        for (i = 0, len = populatedSelects.length; i < len; i++) {
            el = populatedSelects[i];
            filterVal = el.value;
            if (filterVal.length) {
                viewPullRequestsHideIfNotMatching(filterVal, selects.index(el) + 1);
            }
        }
    }

    function viewPullRequestsHideIfNotMatching(filterVal, idx) {
        _viewPullRequestsList.find('tr:visible').filter(function() {
            return $(this).find('td:nth-child(' + idx + ')')[0].innerHTML.indexOf(filterVal) === -1;
        }).hide();
    }

    function buildUlForPullRequestView(isUpdate) {
        var i, len, pullRequest, status, statusIdx;
        var html = '';
        var data = {
            apps: {},
            versions: {},
            branches: {},
            statuses: { open:''},
            reqUsers: {},
            reqDates: {},
            comUsers: {},
            comDates: {},
            repos: {}
        };

        for (i = 0, len = _pullRequestData.length; i < len; i++) {
            pullRequest = _pullRequestData[i];
            status = pullRequest.status;
            statusIdx = status.indexOf(':');
            if (statusIdx >= 0) {
                status = status.substring(0, statusIdx);
            }
            data.apps[pullRequest.appId.app] = '';
            data.versions[pullRequest.appId.version] = '';
            data.branches[pullRequest.appId.branch] = '';
            data.statuses[status] = '';
            data.reqUsers[pullRequest.requestUser] = '';
            data.reqDates[pullRequest.requestTime.substring(0, pullRequest.requestTime.indexOf(' '))] = '';
            if (pullRequest.commitUser) {
                data.comUsers[pullRequest.commitUser] = '';
                data.comDates[pullRequest.commitTime.substring(0, pullRequest.commitTime.indexOf(' '))] = '';
            }
            if (pullRequest.prId) {
                data.repos[pullRequest.prId.substring(0, pullRequest.prId.lastIndexOf('-'))] = '';
            }

            html += '<tr data-txid="' + pullRequest.txid + '">'
                  + '<td class="view-pull-requests-app">' + pullRequest.appId.app + '</td>'
                  + '<td class="view-pull-requests-version">' + pullRequest.appId.version + '</td>'
                  + '<td class="view-pull-requests-branch">' + pullRequest.appId.branch + '</td>'
                  + '<td class="view-pull-requests-status">' + status + '</td>'
                  + '<td class="view-pull-requests-requester">' + pullRequest.requestUser + '</td>'
                  + '<td class="view-pull-requests-request-date">' + pullRequest.requestTime + '</td>'
                  + '<td class="view-pull-requests-committer">' + (pullRequest.commitUser || '') + '</td>'
                  + '<td class="view-pull-requests-commit-date">' + (pullRequest.commitTime || '') + '</td>'
                  + '<td class="view-pull-requests-pr">' + (pullRequest.prId || '') + '</td>'
                  + '</tr>';
        }

        _viewPullRequestsList.find('tr').remove();
        _viewPullRequestsList.append(html);
        _viewPullRequestsList.find('tr').on('click', function() {
            pullRequestListClick(this);
        });

        populateSelectFromMap(_viewPullRequestsApp, data.apps, isUpdate);
        populateSelectFromMap(_viewPullRequestsVersion, data.versions, isUpdate);
        populateSelectFromMap(_viewPullRequestsBranch, data.branches, isUpdate);
        populateSelectFromMap(_viewPullRequestsStatus, data.statuses, isUpdate, 'open');
        populateSelectFromMap(_viewPullRequestsRequestUser, data.reqUsers, isUpdate);
        populateSelectFromMap(_viewPullRequestsRequestDate, data.reqDates, isUpdate);
        populateSelectFromMap(_viewPullRequestsCommitUser, data.comUsers, isUpdate);
        populateSelectFromMap(_viewPullRequestsCommitDate, data.comDates, isUpdate);
        populateSelectFromMap(_viewPullRequestsRepo, data.repos, isUpdate);

        if (isUpdate) {
            viewPullRequestsFilter();
        }
    }

    function pullRequestListClick(row) {
        var pr, cubeNames, html, numCols, self;
        var allRows = _viewPullRequestsList.find('tr');
        var openRow = allRows.has('td[colspan]');
        var highlightClass = 'highlight-lightgoldenrodyellow';

        openRow.remove();
        allRows.removeClass(highlightClass);
        if (row && (!openRow.length || allRows.index(openRow[0]) !== allRows.index(row) + 1)) {
            self = $(row);
            self.addClass(highlightClass);
            numCols = self.find('td').length;
            pr = _pullRequestData[_viewPullRequestsList.find('tr').index(row)];
            cubeNames = pr.cubeNames['@items'];
            html = '<tr><td colspan="' + (numCols - 5) + '"></td>'
                 + '<td><b>Transaction ID</b></td><td><b>' + pr.txid + '</b></td>';
            if (pr.status === PULL_REQUEST_STATUS.OPEN) {
                html += '<td><a href="#" class="anc-merge">Merge</a></td>'
                      + '<td><a href="#" class="anc-cancel">Close</a></td>';
            } else if (pr.status !== PULL_REQUEST_STATUS.OBSOLETE) {
                html += '<td><a href="#" class="anc-reopen">Reopen</a></td>';
            }
            html += '</tr><tr><td colspan="' + numCols + '">'
                  + '<ul class="list-group"></ul>'
                  + '</td></tr>';
            self.after(html);
            addPullRequestActionListeners(pr);
            buildUlForCompare(_viewPullRequestsList.find('ul'), pr.appId.branch, cubeNames, {compare:true, html:true, json:true});
        }
    }

    function addPullRequestActionListeners(pr) {
        _viewPullRequestsList.find('a.anc-merge').on('click', function() {
            var appId = appIdFrom(pr.app, pr.version, pr.status, pr.branch);
            var result = call(CONTROLLER + CONTROLLER_METHOD.MERGE_PULL_REQUEST, [pr.txid]);
            handlePullRequestResult(appId, result);
            viewPullRequests(true);
        });
        _viewPullRequestsList.find('a.anc-cancel').on('click', function() {
            var result = call(CONTROLLER + CONTROLLER_METHOD.CANCEL_PULL_REQUEST, [pr.txid]);
            if (result.status) {
                viewPullRequests(true);
            } else {
                showNote(result.data, 'Error');
            }
        });
        _viewPullRequestsList.find('a.anc-reopen').on('click', function() {
            var result = call(CONTROLLER + CONTROLLER_METHOD.REOPEN_PULL_REQUEST, [pr.txid]);
            if (result.status) {
                viewPullRequests(true);
            } else {
                showNote(result.data, 'Error');
            }
        });
    }

    function clearStorage() {
        var i, len, key;
        var keys = Object.keys(localStorage);
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            if (key.startsWith(NCE_PREFIX)) {
                delete localStorage[key];
            }
        }
    }

    function clearCache() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.CLEAR_CACHE, [getAppId()]);
        if (!result.status) {
            showNote('Unable to clear cache:<hr class="hr-small"/>' + result.data);
        }
    }

    function serverStats() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.HEALTH, [true]);
        if (!result.status) {
            showNote('Unable to fetch server statistics:<hr class="hr-small"/>' + result.data);
            return;
        }
        displayMap(result.data.serverStats, DISPLAY_MAP_TITLE.SERVER_STATS);
    }

    function httpHeaders() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_HEADERS, []);
        if (!result.status) {
            showNote('Unable to fetch HTTP headers:<hr class="hr-small"/>' + result.data);
            return;
        }
        displayMap(result.data, DISPLAY_MAP_TITLE.HTTP_HEADERS);
    }

    function displayMap(map, title) {
        var msg = '', rows = 0, key, val;
        delete map['@type'];

        for (key in map) {
            if (map.hasOwnProperty(key)) {
                rows++;
                val = '' + map[key];
                msg += '<dt>' + key + '</dt>';
                msg += '<dd>' + val + '</dd>';
            }
        }

        msg = '<dl class="dl-horizontal">' + msg;
        msg += '</dl>';
        clearNotes(NOTE_CLASS.SYS_META);
        showNote(msg, title, null, NOTE_CLASS.SYS_META);
    }

    // ======================================== Everything to do with Branching ========================================

    function addBranchListeners() {
        // Main menu options
        $('#branchSelect').on('click', function() {
            selectBranch();
        });
        _branchCompareUpdateOk.on('click', function() {
            branchCompareUpdateOk();
        });
        $('#branchCommit').on('click', function() {
            setTimeout(function() { commitBranch(true); }, PROGRESS_DELAY);
            showNote('Processing commit request...');
        });
        _pullRequestLink.on('click', function() {
            generatePullRequestLink();
        });
        _commitOk.on('click', function() {
            commitOk();
        });
        _rollbackOk.on('click', function() {
            rollbackOk();
        });
        $('#branchRollback').on('click', function() {
            setTimeout(function() { commitBranch(false); }, PROGRESS_DELAY);
            showNote('Processing rollback request...');
        });
        $('#branchDelete').on('click', function() {
            deleteBranch();
        });
        $('#branchCopy').on('click', function() {
            copyBranch();
        });
        // From 'Select / Create Branch' Modal
        $('#createBranch').on('click', function() {
            createBranch();
        });
        $('#btnClearBranchQuickSelect').on('click', function(e) {
            var appId = appIdFrom(_selectedApp, _selectedVersion, _selectedStatus);
            e.preventDefault();
            e.stopPropagation();
            clearVisitedBranchesList(appId);
            buildBranchQuickSelectMenu();
        });
        _branchCompareUpdateMenu.on('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        $('button.accept-mine').on('click', function() {
            acceptMineTheirs($(this).closest('.modal').find('ul'), true);
        });
        $('button.accept-theirs').on('click', function() {
            acceptMineTheirs($(this).closest('.modal').find('ul'), false);
        });
    }

    function showActiveBranch() {
        if (_branchNames.indexOf(_selectedBranch) > -1) {
            addToVisitedBranchesList(appIdFrom(_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch));
        } else if (_selectedBranch === head) {
            showNote('Unable to get branch list.', 'Error');
            return;
        } else {
            saveSelectedBranch(head);
            changeBranch(head);
        }
        _branchMenu[0].innerHTML = '<button class="btn-sm btn-primary">&nbsp;' + _selectedBranch + '&nbsp;<b class="caret"></b></button>';
    }

    function getBranchNames() {
        _branchNames = null;
        _branchNames = getBranchNamesByAppId(getAppId());
        return _branchNames;
    }
    
    function getBranchNamesByAppId(appId) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_BRANCHES, [appId]);
        if (!result.status) {
            showNote('Unable to get branches:<hr class="hr-small"/>' + result.data);
            return [];
        }
        return result.data;
    }

    function getCubeListForApp(appId) {
        var i, len, cubes, results;
        var result = call(CONTROLLER + CONTROLLER_METHOD.SEARCH, [appId, '*', null, getDefaultSearchOptions()]);
        if (!result.status) {
            showNote('Unable to run search: ' + result.data, 'Error');
            return;
        }
        cubes = [];
        results = result.data;
        for (i = 0, len = results.length; i < len; i++) {
            cubes.push(results[i].name);
        }
        return cubes;
    }

    function getAxesFromCube(appId, cubeName, axisName) {
        var axisNames, axes, i, len, axis, axisKeys;
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_JSON, [appId, cubeName, {mode:JSON_MODE.INDEX_NOCELLS}], {noResolveRefs:true});
        if (!result.status) {
            showNote('Error getting cube data:<hr class="hr-small"/>' + result.data);
            return {};
        }
        axisNames = [];
        axes = JSON.parse(result.data).axes;
        axisKeys = Object.keys(axes);
        for (i = 0, len = axisKeys.length; i < len; i++) {
            axis = axes[axisKeys[i]];
            if (axis.name === axisName) {
                return axis;
            }
            axisNames.push(axis.name);
        }
        return axisNames;
    }

    function selectBranch() {
        var opts = {
            onCreate: createBranch,
            branchNames: getBranchNames(),
            onBranchClick: changeBranch
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.selectBranch(opts));
    }

    function createBranch(branchName) {
        var appId;
        var validName = /^[a-zA-Z_][0-9a-zA-Z_.-]*$/i;
        if (!branchName || !validName.test(branchName) || head.toLowerCase() == branchName.toLowerCase()) {
            FormBuilder.showAlert('Name must contain only a-z, A-Z, 0-9, _ (underscore), - (dash), or . (dot). Cannot be \'HEAD\'.');
            return;
        }

        appId = getAppId();
        appId.branch = branchName;
        if (!_selectedApp || !_selectedVersion || !_selectedStatus) {
            changeBranch(branchName);
            return;
        }

        setTimeout(function() {
            var result = call(CONTROLLER + CONTROLLER_METHOD.CREATE_BRANCH, [appId]);
            if (!result.status) {
                clearNotes(NOTE_CLASS.PROCESS_DURATION);
                showNote('Unable to create branch:<hr class="hr-small"/>' + result.data);
                return;
            }
            changeBranch(branchName);
        }, PROGRESS_DELAY);
        FormBuilder.closeBuilderModal();
        showNote('Creating branch: ' + branchName, 'Creating...', null, NOTE_CLASS.PROCESS_DURATION);
    }

    function changeBranch(branchName) {
         if (head.toLowerCase() === branchName.toLowerCase()) {
             branchName = head;
         }
        saveSelectedBranch(branchName);
        addToVisitedBranchesList(appIdFrom(_selectedApp, _selectedVersion, _selectedStatus, branchName));

        setTimeout(function() {
            loadAppListView();
            loadVersionListView();
            buildBranchUpdateMenu();
            buildBranchQuickSelectMenu();
            showActiveBranch();
            loadNCubes();
            runSearch();
            buildMenu();

            southPanelResize();
        }, PROGRESS_DELAY);
        clearNotes(NOTE_CLASS.PROCESS_DURATION);
        showNote('Changing branch to: ' + branchName, 'Please wait...', ONE_SECOND_TIMEOUT);
    }

    function compareUpdateBranch(branchName, noNote) {
        var result, branchChanges, branchHead, method, params;
        var appId = getAppId();
        var acceptMineBtn = _branchCompareUpdateModal.find('.accept-mine');

        if (isHeadSelected()) {
            showNote('You cannot update HEAD.');
            return;
        }

        branchHead = branchName === head;
        params = [appId];
        _branchCompareUpdateOk.toggle(branchHead);
        acceptMineBtn.toggle(branchHead);
        if (branchHead) {
            method = CONTROLLER_METHOD.GET_HEAD_CHANGES_FOR_BRANCH;
        } else {
            method = CONTROLLER_METHOD.GET_BRANCH_CHANGES_FOR_MY_BRANCH;
            params.push(branchName);
        }
        result = call(CONTROLLER + method, params);
        if (!result.status) {
            showNote('Unable to get branch changes:<hr class="hr-small"/>' + result.data);
            return;
        }

        $('#branchCompareUpdateLabel')[0].innerHTML = 'Update ' + _selectedBranch + ' from ' + branchName;
        branchChanges = result.data;
        if (!branchChanges.length) {
            if (noNote) {
                _branchCompareUpdateModal.modal('hide');
            } else {
                showNote('No changes detected.', '', TWO_SECOND_TIMEOUT);
            }
            return;
        }
        branchChanges.sort(sortBranchChanges);

        _branchCompareUpdateModal.prop({branchName: branchName, branchChanges: branchChanges});
        buildUlForCompare(_branchCompareUpdateList, branchName, branchChanges, {inputClass:'updateCheck', compare:true, html:true, json:true, action:'update'});

        _branchCompareUpdateModal.modal();
    }
    
    function sortBranchChanges(a, b) {
        var aType, bType;
        if (a.changeType === b.changeType) {
            return a.name.localeCompare(b.name);
        }
        aType = getLabelDisplayTypeForInfoDto(a);
        bType = getLabelDisplayTypeForInfoDto(b);
        return aType.DISPLAY_ORDER - bType.DISPLAY_ORDER;
    }

    function buildUlForCompare(ul, branchName, branchChanges, options) {
        ul.empty();
        ul.append(buildHtmlListForCompare(branchChanges, options));
        ul.find('a.anc-compare').on('click', function() {
            var infoDto, leftInfoDto, diffOptions;
            var self = $(this);
            var idx = self.closest('ul').find('.compare-label').index(self.parent());
            var change = branchChanges[idx];
            if (options.hasOwnProperty('action')) {
                infoDto = $.extend(true, {}, change);
                leftInfoDto = $.extend(true, {}, infoDto);
                leftInfoDto.branch = branchName;
                if ('commit' === options.action) {
                    diffCubes(infoDto, leftInfoDto, infoDto.name, appIdFrom(leftInfoDto.app, leftInfoDto.version, leftInfoDto.status, leftInfoDto.branch));
                } else { // rollback or update
                    diffCubes(leftInfoDto, infoDto, infoDto.name, appIdFrom(infoDto.app, infoDto.version, infoDto.status, infoDto.branch));
                }
            } else {
                diffOptions = {
                    leftName: 'BRANCH',
                    rightName: head,
                    title: change.name,
                    appId: null,
                    cubeName: change.name,
                    canEdit: false,
                    cantEditReason: 'Pull request is view-only.'
                };
                diffCubeRevs(change.head, change.id, diffOptions);
            }
        });
        addJsonHtmlListeners(ul);
        ul.find('li.changeTypeHeader').find('a').on('click', function() {
            selectAllNoneChangeTypeHeaderClick($(this));
        });
        ul.find('li.changeTypeHeader').find('span.glyphicon, b').on('click', function() {
            expandCollapseChangeTypeClick($(this));
        });
        addCountsToChangeTypeHeaders(ul);
    }
    
    function selectAllNoneChangeTypeHeaderClick(el) {
        var state = el.hasClass(CLASS_SECTION_ALL);
        getChangeTypeListItems(el).find('input[type="checkbox"]').prop('checked', state);
    }
    
    function expandCollapseChangeTypeClick(el) {
        var lis, i, len, show, prefix, plus, minus, span;
        prefix = 'glyphicon-';
        plus = 'plus';
        minus = 'minus';
        lis = getChangeTypeListItems(el).closest('li');
        span = el.parent().find('span.glyphicon');
        show = span.hasClass(prefix + plus);
        span.removeClass(prefix + (show ? plus : minus)).addClass(prefix + (show ? minus : plus));
        lis.toggle(show);
    }
    
    function getChangeTypeListItems(el) {
        var li = el.parent();
        var cssClass = li.data('changetype');
        return li.parent().find('label.' + cssClass);
    }

    function addCountsToChangeTypeHeaders(ul) {
        var changeTypeHeaders, cssClass, li, i, len, count;
        changeTypeHeaders = ul.find('li.changeTypeHeader');
        for (i = 0, len = changeTypeHeaders.length; i < len; i++) {
            li = $(changeTypeHeaders[i]);
            cssClass = li.data('changetype');
            count = li.parent().find('label.checkbox-label.' + cssClass).length;
            li.find('b').after('<span class="change-type-header-count">(' + count + ')</span>');
        }
    }

    function branchCompareUpdateOk() {
        var i, len;
        var branchName = _branchCompareUpdateModal.prop('branchName');
        var branchChanges = _branchCompareUpdateModal.prop('branchChanges');
        var inputs = _branchCompareUpdateList.find('.updateCheck');
        var changes = [];
        _branchCompareUpdateOk.attr('disabled', '');
        for (i = 0, len = inputs.length; i < len; i++) {
            if (inputs[i].checked) {
                changes.push(branchChanges[i]);
            }
        }
        callUpdateBranchCubes(getAppId(), changes);
    }

    function getUpdateReturnMapLength(map) {
        if (map && map.hasOwnProperty('@items')) {
            return map['@items'].length;
        }
        return 0;
    }

    function handleUpdateReturnValues(appId, map, isUpdate, success, message) {
        var note, updateMap, addMap, deleteMap, rejectMap, fastforwardMap, restoreMap,
            updates, adds, deletes, rejects, fastforwards, restores;
        updateMap = map['updates'];
        restoreMap = map['restores'];
        addMap = map['adds'];
        deleteMap = map['deletes'];
        rejectMap = map['rejects'];
        fastforwardMap = map['fastforwards'];
        updates = getUpdateReturnMapLength(updateMap);
        restores = getUpdateReturnMapLength(restoreMap);
        adds = getUpdateReturnMapLength(addMap);
        deletes = getUpdateReturnMapLength(deleteMap);
        rejects = getUpdateReturnMapLength(rejectMap);
        fastforwards = getUpdateReturnMapLength(fastforwardMap);

        note = '<b>Branch ' + (isUpdate ? 'Update' : 'Commit') + ' ' + (success ? 'succeeded' : 'failed')
             + ':</b><hr class="hr-small"/>'
             + adds + ' cubes <b class="' + CHANGETYPE.CREATED.CSS_CLASS + '">added</b><br>'
             + restores + ' cubes <b class="' + CHANGETYPE.RESTORED.CSS_CLASS + '">restored</b><br>'
             + updates + ' cubes <b class="' + CHANGETYPE.UPDATED.CSS_CLASS + '">updated</b><br>'
             + deletes + ' cubes <b class="' + CHANGETYPE.DELETED.CSS_CLASS + '">deleted</b><br>';
        if (isUpdate) {
            note += fastforwards + ' cubes <b class="' + CHANGETYPE.FASTFORWARD.CSS_CLASS + '">fast-forwarded</b><br>';
        }
        note += rejects + ' cubes <b class="' + CHANGETYPE.CONFLICT.CSS_CLASS + '">rejected</b>';

        if (adds) {
            note += getUpdateNote(appId, addMap['@items'], 'Added cube names', 'green', true);
        }
        if (restores) {
            note += getUpdateNote(appId, restoreMap['@items'], 'Restored cube names', 'goldenrod', true);
        }
        if (updates) {
            note += getUpdateNote(appId, updateMap['@items'], 'Updated cube names', 'cornflowerblue', true);
        }
        if (deletes) {
            note += getUpdateNote(appId, deleteMap['@items'], 'Deleted cube names', 'white', true);
        }
        if (fastforwards) {
            note += getUpdateNote(appId, fastforwardMap['@items'], 'Fast-forwarded cube names', 'lightgrey', true);
        }
        if (rejects) {
            note += getUpdateNote(appId, rejectMap['@items'], 'Rejected cube names', 'red', false);
        }
        if (message !== undefined) {
            note += '<hr class="hr-small"/>' + message;
        }
        showNote(note, success ? 'Success' : 'Failure');
    }

    function callUpdateBranchCubes(appId, cubeDtos, isFromTabMenu) {
        showNote('Updating selected cubes...', 'Please wait...');
        setTimeout(function() {
            var result;
            clearNote();
            _branchCompareUpdateOk.removeAttr('disabled');
            if (isFromTabMenu) {
                result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_CUBE_FROM_HEAD, [appId, cubeDtos[0].name]);
            } else {
                result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_BRANCH, [appId, cubeDtos]);
            }
            if (!result.status) {
                showNote('Unable to update ' + (isFromTabMenu ? 'cube' : 'branch') + ':<hr class="hr-small"/>' + result.data);
                return;
            }

            handleUpdateReturnValues(appId, result.data, true, true);
            saveOpenCubeList();
            buildTabs();
            if (appIdsEqual(appId, getAppId())) {
                if (!isFromTabMenu) {
                    compareUpdateBranch(head, true);
                }
                loadNCubes();
                runSearch();
            }

            reloadCube();
        }, PROGRESS_DELAY);
    }

    function buildHtmlListForCompare(branchChanges, options) {
        var i, len, infoDto, prevChangeType, changeType, displayType, shouldCompare;
        var html = '';
        var hasCheckbox = options.hasOwnProperty('inputClass');
        for (i = 0, len = branchChanges.length; i < len; i++) {
            infoDto = branchChanges[i];
            changeType = infoDto.changeType;
            displayType = getLabelDisplayTypeForInfoDto(infoDto);
            if (changeType !== prevChangeType) {
                prevChangeType = changeType;
                html += '<li class="list-group-item skinny-lr noselect changeTypeHeader" data-changetype="'
                    + displayType.CSS_CLASS + '"><span class="glyphicon glyphicon-minus"></span>'
                    + '<b class="' + displayType.CSS_CLASS + '"> ' + displayType.LABEL + ' </b>';
                if (hasCheckbox) {
                    html += '<a href="#" class="' + CLASS_SECTION_ALL + '">All</a>'
                          + '<a href="#" class="' + CLASS_SECTION_NONE + '">None</a>';
                }
                html += '</li>';
            }

            html += '<li class="list-group-item skinny-lr no-margins" data-changetype="' + displayType.CSS_CLASS + '">';
            html += '<div class="container-fluid">';

            if (options.hasOwnProperty('compare')) {
                shouldCompare = [CHANGETYPE.CREATED,CHANGETYPE.DELETED,CHANGETYPE.RESTORED].indexOf(displayType) === -1;
                html += '<label class="compare-label">';
                html += shouldCompare ? '<a href="#" class="anc-compare"><kbd>Compare</kbd></a>' : '<kbd class="space-grey">Compare</kbd>';
                html += '</label>';
            }
            if (options.hasOwnProperty('html')) {
                html += getHtmlLabelHtml(infoDto);
            }
            if (options.hasOwnProperty('json')) {
                html += getJsonLabelHtml(infoDto);
            }

            html += '<label class="checkbox checkbox-label ' + displayType.CSS_CLASS + '">';
            if (hasCheckbox) {
                html += '<input class="' + options.inputClass + '" type="checkbox">';
            }
            html += infoDto.name;
            html += '</label>';

            html += '</div></li>';
        }
        return html;
    }
    
    function getJsonLabelHtml(dto) {
        var html = '<label class="json-label">';
        html += '<a href="#" class="anc-json" data-cube-id="' + dto.id + '" data-rev-id="' + dto.revision + '" data-cube-name="' + dto.name + '"><kbd>JSON</kbd></a>';
        html += '</label>';
        return html;
    }
    
    function getHtmlLabelHtml(dto) {
        var html = '<label class="html-label">';
        html += '<a href="#" class="anc-html" data-cube-id="' + dto.id + '" data-rev-id="' + dto.revision + '" data-cube-name="' + dto.name + '"><kbd>HTML</kbd></a>';
        html += '</label>';
        return html;
    }
    
    function getLabelDisplayTypeForInfoDto(infoDto) {
        switch (infoDto.changeType) {
            case CHANGETYPE.CONFLICT.CODE: // CONFLICTS ALWAYS SUPERCEDE OTHER CHANGE TYPES
                return CHANGETYPE.CONFLICT;
            case CHANGETYPE.DELETED.CODE:
                return CHANGETYPE.DELETED;
            case CHANGETYPE.CREATED.CODE:
                return CHANGETYPE.CREATED;
            case CHANGETYPE.RESTORED.CODE:
                return CHANGETYPE.RESTORED;
            case CHANGETYPE.UPDATED.CODE:
                return CHANGETYPE.UPDATED;
            case CHANGETYPE.FASTFORWARD.CODE:
                return CHANGETYPE.FASTFORWARD;
            default:
                return '';
        }
    }

    function commitBranch(state) {
        var errMsg, title, result, branchChanges, action;
        clearNote();
        _commitModal.find('.accept-mine, .accept-theirs').add(_pullRequestLink).add(_commitOk).toggle(state);
        _rollbackOk.toggle(!state);
        action = state ? 'commit' : 'rollback';
        errMsg = state ? 'commit to' : 'rollback in';
        title = (state ? 'Commit' : 'Rollback') + ' changes';
        _commitRollbackList.data('is-commit', state);
        if (state) {
            _pullRequestLink.add(_commitOk).removeAttr('disabled');
        }

        if (isHeadSelected()) {
            showNote('You cannot ' + errMsg + ' HEAD.');
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.GET_BRANCH_CHANGES_FOR_HEAD, [getAppId()]);
        if (!result.status || !result.data) {
            showNote('Unable to get branch changes:<hr class="hr-small"/>' + result.data);
            return;
        }

        _commitRollbackLabel[0].textContent = title;

        branchChanges = result.data;
        branchChanges.sort(sortBranchChanges);

        _commitModal.prop('branchChanges', branchChanges);
        buildUlForCompare(_commitRollbackList, head, branchChanges, {inputClass:'commitCheck', compare:true, html:true, json:true, action: action});
        _commitModal.modal('show');
    }

    function getCommitChanges() {
        var i, len;
        var branchChanges = _commitModal.prop('branchChanges');
        var input = _commitRollbackList.find('.commitCheck');
        var changes = [];
        for (i = 0, len = input.length; i < len; i++) {
            if (input[i].checked) {
                changes.push(branchChanges[i]);
            }
        }
        return changes;
    }

    function generatePullRequestLink() {
        var urlPrefix, viewUrl, result, txid, html;
        var appId = getAppId();
        var changes = getCommitChanges();
        if (!changes.length) {
            showNote('No changes selected!', 'Error', TWO_SECOND_TIMEOUT);
            return;
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.GENERATE_PULL_REQUEST_LINK, [appId, changes]);
        if (result.status) {
            _pullRequestLink.add(_commitOk).attr('disabled', '');
            txid = result.data;
            urlPrefix = document.URL;
            urlPrefix = urlPrefix.substring(0, urlPrefix.lastIndexOf('/'));
            viewUrl = urlPrefix + '/#/viewCommit/' + txid + encodeURI('?app=' + appId.app + '&version=' + appId.version + '&branch=' + appId.branch);
            html = 'Pull Request View Link:<br><a href="#" onclick="NCE.pullRequestLinkClick(\'' + txid + '\');">' + viewUrl + '</a>';
            showNote(html, 'Pull Request Link', null, NOTE_CLASS.HAS_EVENT);
        } else {
            showNote('Error generating link: ' + result.data, 'Error');
        }
    }

    function pullRequestLinkClick(txid) {
        closeOpenModal();
        viewPullRequests(true, txid);
    }

    function commitOk() {
        var changes = getCommitChanges();
        if (!changes.length) {
            showNote('No changes selected!', 'Error', TWO_SECOND_TIMEOUT);
            return;
        }
        _commitModal.modal('hide');
        callCommit(changes);
    }

    function callCommit(changedDtos, appId) {
        showNote('Committing changes on selected cubes...', 'Please wait...');
        setTimeout(function() {
            var result, method, dtos;
            if (appId) {
                method = CONTROLLER_METHOD.COMMIT_CUBE;
                dtos = changedDtos.name;
            } else {
                appId = getAppId();
                method = CONTROLLER_METHOD.COMMIT_BRANCH;
                dtos = changedDtos;
            }
            result = call(CONTROLLER + method, [appId, dtos]);
            handlePullRequestResult(appId, result);
        }, PROGRESS_DELAY);
    }

    function handlePullRequestResult(appId, result) {
        clearNote();
        if (!result.status) {
            handleUpdateReturnValues(appId, {}, false, false, result.exception.detailMessage);
            return;
        }

        if (appIdsEqual(appId, getAppId())) {
            loadNCubes();
            runSearch();
        }
        reloadCube();

        handleUpdateReturnValues(appId, result.data, false, true);
        saveOpenCubeList();
        buildTabs();
    }

    function rollbackOk() {
        _commitModal.modal('hide');
        callRollback(getCommitChanges());
    }

    function callRollback(changes) {
        showNote('Rolling back changes on selected cubes...', 'Please wait...');
        setTimeout(function(){
            var names, i, len, note, result;
            names = [];
            for (i = 0, len = changes.length; i < len; i++) {
                names.push(changes[i].name)
            }
            result = call(CONTROLLER + CONTROLLER_METHOD.ROLLBACK_BRANCH, [getAppId(), names]);
            clearNote();

            if (!result.status) {
                showNote('Unable to rollback cubes:<hr class="hr-small"/>' + result.data);
                return;
            }

            loadNCubes();
            reloadCube();
            runSearch();

            note = 'Successfully rolled back ' + changes.length + ' cube(s).<hr class="hr-small"/>';
            note += getUpdateNote(getAppId(), changes, 'Rolled back cubes', 'cornflowerblue', true);
            saveOpenCubeList();
            buildTabs(true);
            showNote(note);
        }, PROGRESS_DELAY);
    }

    function callRollbackFromTab(changedCube) {
        showNote('Rolling back changes on selected cubes...', 'Please wait...');
        setTimeout(function(){
            var appId, name, result;
            appId = getSelectedTabAppId();
            name = changedCube.name;
            result = call(CONTROLLER + CONTROLLER_METHOD.ROLLBACK_BRANCH, [appId, [name]]);
            clearNote();

            if (!result.status) {
                showNote('Unable to rollback cubes:<hr class="hr-small"/>' + result.data);
                return;
            }

            removeTabStatusFromCubeList(appId, [name]);
            if (appIdsEqual(appId, getAppId())) {
                loadNCubes();
                runSearch();
            }
            reloadCube();
            showNote('Successfully rolled back ' + name + '.');
        }, PROGRESS_DELAY);
    }

    function removeTabStatusFromCubeList(appId, cubeNames) {
        getUpdateNote(appId, cubeNames, null, null, true);
        saveOpenCubeList();
        buildTabs();
    }

    function getUpdateNote(appId, map, header, color, shouldUpdateStatus) {
        var note, i, len, o, oLen, openCube, openCubeInfo, cubeName;
        note = '<hr class="hr-small"/><b style="color:' + color + '">' + header + ':</b><br>';
        map.sort(function(a, b) {
            // sort case-insensitively, use client-side CPU
            var lowA, lowB;
            if (a.hasOwnProperty('name')) {
                a = a.name;
                b = b.name;
            }
            lowA = a.toLowerCase();
            lowB = b.toLowerCase();
            return lowA.localeCompare(lowB);
        });

        for (i = 0, len = map.length; i < len; i++) {
            cubeName = map[i];
            if (cubeName.hasOwnProperty('name')) {
                cubeName = cubeName.name;
            }
            note += cubeName + '<br>';
            if (shouldUpdateStatus) {
                updateTabStatusForUpdateNote(appId, cubeName);
            }
        }
        return note;
    }

    function updateTabStatusForUpdateNote(appId, cubeName) {
        var i, len, openCube, openCubeInfo;
        for (i = 0, len = _openCubes.length; i < len; i++) {
            openCube = null;
            openCube = _openCubes[i];
            openCubeInfo = null;
            openCubeInfo = getCubeInfo(openCube.cubeKey);
            if (cubeName === openCubeInfo[CUBE_INFO.NAME] && doesCubeInfoMatchOldAppId(CUBE_INFO.BRANCH, openCubeInfo, appId)) {
                openCube.status = null;
                openCube.hasShownStatusMessage = false;
            }
        }
    }

    function copyBranch() {
        var opts = {
            appId: getAppId(),
            appSelectList: loadAppNames(),
            populateVersionFunc: getAppVersions,
            readonly: false,
            afterSave: copyBranchOk
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.copyBranch(opts));
    }

    function copyBranchOk(data) {
        var copyAppId = appIdFrom(data.app, data.version, STATUS.SNAPSHOT, data.branch);
        var copyHistory = data.copyHistory || false;
        var result = call(CONTROLLER + CONTROLLER_METHOD.COPY_BRANCH, [getAppId(), copyAppId, copyHistory]);
        if (!result.status) {
            showNote('Unable to copy branch:<hr class="hr-small"/>' + result.data);
            return;
        }

        saveSelectedApp(copyAppId.app);
        saveSelectedVersion(copyAppId.version);
        saveSelectedStatus(copyAppId.status);
        saveSelectedBranch(copyAppId.branch);
        addToVisitedBranchesList(copyAppId);
        loadAppListView();
        loadVersionListView();
        buildBranchUpdateMenu();
        buildBranchQuickSelectMenu();
        showActiveBranch();
        loadNCubes();
        runSearch();
    }

    function deleteBranch() {
        var opts;
        if (isHeadSelected()) {
            showNote('HEAD branch cannot be deleted.');
            return;
        }

        opts = {
            appId: getAppId(),
            afterSave: deleteBranchOk
        };
        FormBuilder.openBuilderModal(NCEBuilderOptions.deleteBranch(opts));
    }

    function deleteBranchOk() {
        var appId = getAppId();
        var result = call(CONTROLLER + CONTROLLER_METHOD.DELETE_BRANCH, [appId]);
        if (result.status) {
            removeFromVisitedBranchesList(appId);
            removeCubeInfoInOpenCubeList(CUBE_INFO.BRANCH);
            changeBranch(head);
        } else {
            showNote('Unable to delete branch:<hr class="hr-small"/>' + result.data);
        }
    }

    function getAllSelectedMineTheirs(ul) {
        var i, len, results, branchChanges, inputs;
        if (!ul.find('input:checked').length) {
            showNote('No cubes selected!', 'Note', TWO_SECOND_TIMEOUT);
            return null;
        }
        branchChanges = ul.closest('.modal').prop('branchChanges');
        inputs = ul.find('label.checkbox input[type="checkbox"]');
        results = [];
        for (i = 0, len = inputs.length; i < len; i++) {
            if (inputs[i].checked) {
                results.push(branchChanges[i].name);
            }
        }
        return results;
    }

    function acceptMineTheirs(ul, isMine) {
        var obj;
        var mineTheirs = getAllSelectedMineTheirs(ul);
        if (!mineTheirs.length) {
            return;
        }
        if (isMine) {
            obj = {
                controllerMethod: CONTROLLER_METHOD.ACCEPT_MINE,
                cubeNames: mineTheirs,
                successMsg: 'cubes updated to overwrite-on-commit.',
                errorMsg: 'Unable to update your branch cubes to overwrite-on-commit'
            };
        } else {
            obj = {
                controllerMethod: CONTROLLER_METHOD.ACCEPT_THEIRS,
                cubeNames: mineTheirs,
                successMsg: 'cubes updated in your branch.',
                errorMsg: 'Unable to update your branch cubes'
            };
        }
        callAcceptMineTheirs(ul, obj);
    }
    
    function callAcceptMineTheirs(ul, options) {
        var appId = getAppId();
        var branchName = ul.closest('.modal').prop('branchName') || head;
        var result = call(CONTROLLER + options.controllerMethod, [appId, options.cubeNames, branchName]);
        if (result.status) {
            showNote(result.data.value + ' ' + options.successMsg, 'Note', TEN_SECOND_TIMEOUT);
            removeTabStatusFromCubeList(getAppId(), options.cubeNames);
            if (options.controllerMethod === CONTROLLER_METHOD.ACCEPT_THEIRS) {
                loadNCubes();
                runSearch();
                if (appIdsEqual(appId, getSelectedTabAppId()) && options.cubeNames.indexOf(_selectedCubeName) > -1) {
                    reloadCube();
                }
            }
            if (ul.is(_branchCompareUpdateList)) {
                compareUpdateBranch(branchName, true)
            } else if (ul.is(_commitRollbackList)) {
                commitBranch(_commitRollbackList.data('is-commit'));
            }
        } else {
            showNote(options.errorMsg + ':<hr class="hr-small"/>' + result.data);
        }
    }

    // =============================================== End Branching ===================================================

    // ============================================== Cube Comparison ==================================================
    
    function addTextToLeftRightNames(compareLeft, compareRight, leftRightName) {
        if (compareLeft !== compareRight) {
            if (leftRightName.receiver.length) {
                leftRightName.receiver += '-';
                leftRightName.transmitter += '-';
            }
            leftRightName.receiver += compareLeft;
            leftRightName.transmitter += compareRight;
        }
    }
    
    function diffCubes(receiverDto, transmitterDto, title, appId) {
        var leftRightName = { receiver: '', transmitter: '' };
        callWithSave(CONTROLLER + CONTROLLER_METHOD.FETCH_JSON_BRANCH_DIFFS, [receiverDto, transmitterDto], {callback:descriptiveDiffCallback});
        if (transmitterDto.branch === receiverDto.branch) {
            addTextToLeftRightNames(transmitterDto.app, receiverDto.app, leftRightName);
            addTextToLeftRightNames(transmitterDto.version, receiverDto.version, leftRightName);
            addTextToLeftRightNames(transmitterDto.status, receiverDto.status, leftRightName);
            addTextToLeftRightNames(transmitterDto.name, receiverDto.name, leftRightName);
        } else {
            leftRightName.receiver = transmitterDto.branch;
            leftRightName.transmitter = receiverDto.branch;
        }
        setupDiff({
            leftName: leftRightName.receiver,
            rightName: leftRightName.transmitter,
            title: title,
            appId: appId,
            cubeName: transmitterDto.name,
            canEdit: appId.branch !== head,
            cantEditReason: 'Unable to merge into HEAD cube. Please use Commit Branch...'
        });
    }

    function diffCubeRevs(receiverId, transmitterId, diffOptions) {
        callWithSave(CONTROLLER + CONTROLLER_METHOD.FETCH_JSON_REV_DIFFS, [receiverId, transmitterId], {callback:descriptiveDiffCallback});
        setupDiff(diffOptions);
    }

    // options: leftName, rightName, title, appId, cubeName, canEdit, cantEditReason
    function setupDiff(diffOptions) {
        _diffOutput.empty();
        $('#diffTitle')[0].innerHTML = diffOptions.title;
        _diffLastResult = 'Loading...';
        _diffHtmlResult = 'Loading...';
        _diffLeftName = diffOptions.leftName;
        _diffRightName = diffOptions.rightName;
        _diffAppId = diffOptions.appId;
        _diffCubeName = diffOptions.cubeName;
        diffOptions.canEdit = diffOptions.canEdit && checkPermissions(diffOptions.appId, _diffCubeName, PERMISSION_ACTION.UPDATE);
        _diffModal.find('.select-all, .select-none, .btn-primary').toggle(diffOptions.canEdit);
        _diffInstructions[0].innerHTML = diffOptions.canEdit
            ? 'Reverse individual differences by merging them right to left. Click a row to see more information about the change.'
            : (diffOptions.cantEditReason || 'View individual changes between two cubes.');
        diffDescriptive(diffOptions.canEdit);
        diffShow(true);
    }
    
    function diffShow(shouldShow) {
        if (shouldShow) {
            _diffModal.show(0, function() {
                $(this).trigger('show');
            });
        } else {
            _diffModal.hide();
            if (_didMergeChange) {
                _didMergeChange = false;
                loadCube();
                if (_commitModal.hasClass('in')) {
                    commitBranch(_commitRollbackList.data('is-commit'));
                } else if (_branchCompareUpdateModal.hasClass('in')) {
                    compareUpdateBranch(_branchCompareUpdateModal.prop('branchName'), true);
                } else if (_revisionHistoryModal.hasClass('in')) {
                    revisionHistory(false);
                }
            }
        }
    }

    function diffMerge() {
        var els, checkedDeltas, allDeltas, result, i, len;
        checkedDeltas = [];
        allDeltas = _diffLastResult['@items'];
        els = _diffOutput.find('.mergeCheck');
        for (i = 0, len = els.length; i < len; i++) {
            if (els[i].checked) {
                checkedDeltas.push(allDeltas[i]);
            }
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.MERGE_DELTAS, [_diffAppId, _diffCubeName, checkedDeltas]);
        if (result.status) {
            _didMergeChange = true;
            _diffOutput.empty();
            _diffLastResult = null;
            if (typeof _savedCall.args[0] === OBJECT) {
                _diffLastResult = 'Loading...';
                executeSavedCall();
                diffDescriptive(true);
            } else {
                diffShow(false);
            }
        } else {
            showNote('Unable to merge deltas:<hr class="hr-small"/>' + result.data);
        }
    }

    function diffDescriptive(canEdit) {
        var delta, deltas, html, i, len, isCellChange, deltaLoc;

        // waiting on server response
        if (typeof _diffLastResult !== OBJECT) {
            _diffOutput[0].innerHTML = _diffLastResult;
            if (_diffLastResult === 'Loading...') {
                setTimeout(function () {
                    emptyDiffOutput();
                    diffDescriptive(canEdit);
                }, PROGRESS_DELAY);
            }
            return;
        }

        // no changes detected
        deltas = _diffLastResult['@items'];
        if (!deltas || !deltas.length) {
            _diffOutput[0].innerHTML = 'No difference';
            return;
        }

        // handle delta set
        html = '<div>' + _diffLeftName + ' <span class="glyphicon glyphicon-arrow-left"></span> ' + _diffRightName;
        html += ' <button id="diff-switch" class="btn btn-primary btn-sm">Reverse Cube Diff Direction</button></div>';
        html += '<ul class="list-group">';
        for (i = 0, len = deltas.length; i < len; i++) {
            delta = null;
            delta = deltas[i];
            deltaLoc = delta.loc.name;
            isCellChange = deltaLoc === DELTA.LOC.CELL;
            html += '<li class="list-group-item skinny-lr no-margins' + (isCellChange ? ' cell-change' : '') + '">';
            html += '<div class="container-fluid"><label class="checkbox" style="padding:0;margin:0 0 0 20px;">';
            if (canEdit) {
                html += '<input class="mergeCheck" type="checkbox">';
            }
            html += delta.desc;
            html += '</label></div>';
            html += '</li>';
        }
        html += '</ul>';
        _diffOutput[0].innerHTML = html;

        _diffOutput.find('li').on('click', function(e) {
            onDeltaClick(e, this);
        });
        _diffOutput.find('#diff-switch').on('click', function() {
            onDiffSwitchClick();
        });
    }

    function onDiffSwitchClick() {
        var args, oldReceiverDto, oldTransmitterDto, appId, title, diffOptions, canEdit;
        args = _savedCall.args;
        oldReceiverDto = args[0];
        oldTransmitterDto = args[1];
        title = $('#diffTitle')[0].innerHTML;
        if (typeof oldReceiverDto === OBJECT) {
            appId = appIdFrom(oldReceiverDto.app, oldReceiverDto.version, oldReceiverDto.status, oldReceiverDto.branch);
            diffCubes(oldTransmitterDto, oldReceiverDto, title, appId);
        } else {
            canEdit = _revisionHistoryList.find('.commitCheck').first().is('[data-cube-id="' + oldReceiverDto + '"]');
            diffOptions = {
                leftName: _diffRightName,
                rightName: _diffLeftName,
                title: title,
                appId: getSelectedTabAppId(),
                cubeName: _selectedCubeName,
                canEdit: canEdit,
                cantEditReason: 'Unable to merge into non-current revision.'
            };
            diffCubeRevs(oldTransmitterDto, oldReceiverDto, diffOptions);
        }
    }
    
    function onDeltaClick(e, li) {
        var isAlreadyOpen, sm, opcodes, delta, leftJson, rightJson, clickTarget;
        clickTarget = $(e.target);
        if (!clickTarget.hasClass('mergeCheck') && !clickTarget.closest('.diff').length) {
            e.preventDefault();
            e.stopImmediatePropagation();
            li = $(li);
            isAlreadyOpen = li.find('.diff').length;
            _diffOutput.find('.diff').remove();
            if (!isAlreadyOpen) {
                delta = _diffLastResult['@items'][li.index()];
                leftJson = constructDeltaText(delta, true);
                rightJson = constructDeltaText(delta, false);
                sm = new difflib.SequenceMatcher(leftJson, rightJson);
                opcodes = sm.get_opcodes();
                li.append(diffview.buildView({
                    baseTextLines: leftJson,
                    newTextLines: rightJson,
                    opcodes: opcodes,
                    // set the display titles for each resource
                    baseTextName: _diffLeftName,
                    newTextName: _diffRightName,
                    contextSize: 3
                }));
                li.find('.author').remove();
            }
        }
    }
    
    function constructDeltaText(delta, isSource) {
        if ([DELTA.LOC.NCUBE, DELTA.LOC.CELL, DELTA.LOC.TEST, DELTA.LOC.TEST_COORD, DELTA.LOC.TEST_ASSERT].indexOf(delta.loc.name) > -1) {
            return getObjectTextArray(isSource ? delta.sourceVal : delta.destVal);
        }
        if (delta.type.name === DELTA.TYPE.UPDATE) {
            return getObjectTextArray(isSource ? delta.sourceVal : delta.destVal);
        }
        return getObjectTextArray(isSource ? delta.sourceList : delta.destList);
    }
    
    function getObjectTextArray(val, level, valKey) {
        var i, len, keys, key, spacer, ret, valRet;
        ret = [];
        level = level || 0;
        spacer = level ? new Array(2 * level).join(' ') : '';

        if (valKey !== null && valKey !== undefined) {
            valRet = getObjectTextArray(val, level + 1);
            if (valRet.length === 1) {
                ret.push(spacer + valKey + ': ' + valRet[0].trim());
            } else {
                ret.push(spacer + valKey + ' {');
                ret = ret.concat(valRet);
                ret.push(spacer + '}');
            }
        } else if (val === undefined) {
            ret.push('');
        } else if (val === null) {
            ret.push(spacer + 'null');
        } else if (val.hasOwnProperty('@items')) {
            ret = getObjectTextArray(val['@items'], level + 1);
        } else if (Object.prototype.toString.call(val) === '[object Array]'){
            for (i = 0, len = val.length; i < len; i++) {
                ret.push(spacer + val[i]);
            }
        } else if (typeof val === OBJECT) {
            keys = Object.keys(val);
            ret.push(spacer + '{');
            for (i = 0, len = keys.length; i < len; i++) {
                key = keys[i];
                if (DELTA_IGNORE_LIST.indexOf(key) === -1) {
                    ret = ret.concat(getObjectTextArray(val[key], level + 1, key));
                }
            }
            ret.push(spacer + '}');
        } else {
            ret.push(spacer + val);
        }
        return ret;
    }

    function emptyDiffOutput() {
        _diffOutput.empty();
    }

    function descriptiveDiffCallback(result) {
        _diffLastResult = result.status ? result.data : ('Cube does not exist: ' + result.data);
    }

    // ============================================ End Cube Comparison ================================================

    // ============================================= General Utilities =================================================

    function callWithSave(target, args, params) {
        _savedCall = null;
        _savedCall = {target:target, args:args, params:params};
        executeSavedCall();
    }

    function executeSavedCall() {
        if (_savedCall) {
            return call(_savedCall.target, _savedCall.args, _savedCall.params);
        }
        return {status:false, data:'Logical error.'};
    }

    function loop() {
        setInterval(function() {
            var now = Date.now();
            if (now - _searchLastKeyTime > CUBE_SEARCH_TIMEOUT && _searchKeyPressed) {
                _searchKeyPressed = false;
                saveCubeSearchOptions();
                runSearch();
            }
        }, CUBE_SEARCH_TIMEOUT);
    }

    function createHeartBeatTransferObj() {
        var obj = {};
        obj[getCubeInfo(getSelectedCubeInfoKey()).slice(0, CUBE_INFO.TAB_VIEW).join(TAB_SEPARATOR)] = '';
        //noinspection MagicNumberJS
        return {obj:obj, aBuffer: new ArrayBuffer(1024 * 1024)};
    }

    function heartBeat() {
        var transferObj = createHeartBeatTransferObj();
        _heartBeatThread.postMessage(transferObj, [transferObj.aBuffer]);
        setInterval(function() {
            var transferObj = createHeartBeatTransferObj();
            _heartBeatThread.postMessage(transferObj, [transferObj.aBuffer]);
        }, MINUTE_TIMEOUT);
    }

    function showNote(msg, title, millis, noteClass) {
        var noteId = $.gritter.add({
            title: (title || 'Note'),
            text: msg,
            image: './img/cube-logo.png',
            sticky: !millis,
            append: false,
            time: (millis || 0),
            class_name: noteClass || 'none'
        });
        addNoteListeners(noteId);
        return noteId;
    }

    function updateNote(noteId, updateId, html) {
        var note;
        note = $('#gritter-item-' + noteId + ' #' + updateId);
        if (note && note[0] && note[0].innerHTML){
            note[0].innerHTML = html;
            return true;
        }
        return false;
    }

    function addNoteListeners(noteId) {
        var noteDiv = $('#gritter-item-' + noteId);
        if (!noteDiv.hasClass(NOTE_CLASS.HAS_EVENT)) {
            noteDiv.addClass(NOTE_CLASS.HAS_EVENT);
            noteDiv.on('change click', function (e) {
                e.preventDefault();
                onNoteEvent(e);
            });
        }
     }

    function clearNote(noteId) {
        if (noteId) {
            $.gritter.remove(noteId);
        } else {
            clearNotes('none');
        }
    }
    
    function clearNotes(idOrClass){
        var i, len, notes, note, isById;
        if (idOrClass) {
            if (Object.prototype.toString.call(idOrClass) === '[object Array]') {
                notes = idOrClass;
                isById = true;
            } else {
                notes = $('.gritter-item-wrapper.' + idOrClass);
                isById = false;
            }
            for (i = 0, len = notes.length; i < len; i++) {
                note = notes[i];
                $.gritter.remove(isById ? note : $(note).data('gritterId'));
            }
        } else {
            $.gritter.removeAll();
        }
    }
    
    function isHeadSelected() {
        return head === _selectedBranch;
    }

    function isSelectedCubeInHead() {
        var appId = getSelectedTabAppId();
        return appId ? appId.branch === head : true;
    }

    function closeOpenModal() {
        $('.modal.in').modal('hide');
    }

    /**
     * Get the ApplicationID based on the user's selections.  Tenant is sent not sent (server will fill
     * that in based on authentication.
     * @returns {app: *, version: *, status: string, branch: *}
     */
    function getAppId() {
        return {
            'app':_selectedApp,
            'version':_selectedVersion,
            'status':_selectedStatus,
            'branch':_selectedBranch
        };
    }

    function getSelectedTabAppId() {
        return _selectedCubeInfo.length ? {
            'app': _selectedCubeInfo[CUBE_INFO.APP],
            'version': _selectedCubeInfo[CUBE_INFO.VERSION],
            'status': _selectedCubeInfo[CUBE_INFO.STATUS],
            'branch': _selectedCubeInfo[CUBE_INFO.BRANCH]
        } : null;
    }

    function getSelectedCubeName() {
        return _selectedCubeName;
    }

    function getSelectedApp() {
        return _selectedApp;
    }

    function getSelectedVersion() {
        return _selectedVersion;
    }

    function getSelectedStatus() {
        return _selectedStatus;
    }

    function getSelectedBranch() {
        return _selectedBranch;
    }

    function setActiveTabViewType(viewType) {
        _activeTabViewType = viewType;
        return getActiveTabViewType();
    }

    function getActiveTabViewType() {
        if (!_activeTabViewType) {
            _activeTabViewType = DEFAULT_ACTIVE_TAB_VIEW_TYPE;
        }
        return _activeTabViewType;
    }

    // API
    return {
        buildTabs: buildTabs,
        closeParentMenu: closeParentMenu,
        getSelectedStatus: getSelectedStatus,
        pullRequestLinkClick: pullRequestLinkClick
    }

})(jQuery);

function frameLoaded(doc) {
    delay(function() {
        var txidStartIdx, txidEndIdx, txid;
        var url = document.URL;
        NCE.buildTabs(true);
        if (url.indexOf('viewCommit') > -1) {
            txidStartIdx = url.lastIndexOf('/') + 1;
            txidEndIdx = url.indexOf('?');
            txid = txidEndIdx > -1 ? url.substring(txidStartIdx, txidEndIdx) : url.substring(txidStartIdx);
            NCE.pullRequestLinkClick(txid);
        }
        window.location.href = '#';
    }, 500);
    if (doc) {
        $(doc).on('click', function() {
            NCE.closeParentMenu();
        });
    }
    $('.fadeMe2').fadeOut(800, function() {
        $('.fadeMe2').remove();
    });
    $('#fadeMe1').fadeOut(500, function() {
        $('#fadeMe1').remove();
    });
}
