/**
 * Graphical representation of n-cubes
 *
 * @author Beata Heekin (bbheekin@gmail.com)
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

var Visualizer = (function ($) {

    var _network = null;
    var _nce = null;
    var _loadedCubeName = null;
    var _excludedNodeIdList = null;
    var _excludedEdgeIdList = null;
    var _nodes = null;
    var _edges = null;
    var _scope = null;
    var _keepCurrentScope = false;
    var _reset = false;
    var _availableScopeKeys = [];
    var _selectedGroups = null;
    var _availableGroupsAtLevel = null;
    var _availableGroupsAllLevels = null;
    var _availableScopeValues = {};
    var _allGroups = null;
    var _maxLevel = null;
    var _nodeCount = null;
    var _groupSuffix = null;
    var _selectedCubeName = null;
    var _hierarchical = false;
    var _loadTraits = false;
    var _selectedLevel = null;
    var _visualizerInfo = null;
    var _visualizerNetwork = null;
    var _visualizerContent = null;
    var _visualizerHtmlError = null;
    var TWO_LINE_BREAKS = '<BR><BR>';
    var _nodeTitle = null;
    var _nodeVisualizer = null;
    var _nodeTraits = null;
    var _nodeDesc = null;
    var _layout = null;
    var _scopeBuilderTable = null;
    var _scopeBuilderModal = null;
    var _scopeBuilderScope = [];
    var _scopeInput = null;
    var _scopeBuilderListenersAdded = false;
    var STATUS_SUCCESS = 'success';
    var STATUS_MISSING_START_SCOPE = 'missingStartScope';
  
    var init = function (info) {
        if (!_nce) {
            _nce = info;

            _layout = $('#visBody').layout({
                name: 'visLayout'
                ,	livePaneResizing:			true
                ,   east__minSize:              50
                ,   east__maxSize:              1000
                ,   east__size:                 250
                ,   east__closable:             true
                ,   east__resizeable:           true
                ,   east__initClosed:           true
                ,   east__slidable:             true
                ,   center__triggerEventsOnLoad: true
                ,   center__maskContents:       true
                ,   togglerLength_open:         60
                ,   togglerLength_closed:       '100%'
                ,	spacing_open:			    5  // ALL panes
                ,	spacing_closed:			    5 // ALL panes
            });

            _visualizerContent = $('#visualizer-content');
            _visualizerHtmlError = $('#visualizer-error');
            _visualizerInfo = $('#visualizer-info');
            _visualizerNetwork = $('#visualizer-network');
            _nodeTitle = $('#nodeTitle');
            _nodeTraits = $('#nodeTraits');
            _nodeVisualizer = $('#nodeVisualizer');
            _nodeDesc = $('#nodeDesc');
            _scopeBuilderTable = $('#scopeBuilderTable');
            _scopeBuilderModal = $('#scopeBuilderModal');
            _scopeInput = $('#scope');

            $(window).resize(function() {
                if (_network) {
                    _network.setSize('100%', getVisNetworkHeight());
                }
            });

             $('#selectedLevel-list').change(function () {
                _selectedLevel = $('#selectedLevel-list').val()
                reload();
            });

            $('#hierarchical').change(function () {
                _hierarchical = this.checked;
                draw();
            });

            $('#loadTraits').change(function () {
                _loadTraits = this.checked;
             });
            

            _scopeInput.change(function () {
                _scope = buildScopeFromText(this.value);
                saveScope();
                updateScopeBuilderScope();
            });

            $('#loadGraph').click(function () {
                load();
            });

            $('#reset').click(function () {
                _reset = true;
                load();
            });

            $('#refreshGroups').click(function () {
                reload();
            });
         }
    };

    function updateScopeBuilderScope()
    {
        var keys = Object.keys(_scope);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var value = _scope[key];
            var shouldInsertNewExpression = true;
            for (var j = 0, jLen = _scopeBuilderScope.length; j < jLen; j++) {
                var expression = _scopeBuilderScope[j];
                if (expression.isApplied && expression.key === key) {
                    expression.value = value;
                    shouldInsertNewExpression = false;
                    break;
                }
            }
            if (shouldInsertNewExpression) {
                _scopeBuilderScope.push({'isApplied': true, 'key': key, 'value': value});
            }
        }
    }

    function buildScopeFromText(scopeString) {
        var newScope = {};
        if (scopeString) {
            var tuples = scopeString.split(',');
            for (var i = 0, iLen = tuples.length; i < iLen; i++) {
                var tuple = tuples[i].split(':');
                var key = tuple[0].trim();
                var value = tuple[1];
                if (value) {
                    newScope[key] = value.trim();
                }
            }
         }
        return newScope;
    }

    var reload = function () {
        setGroupsAndExcluded();
        draw();
        loadSelectedLevelListView();
        loadAvailableGroupsView();
        loadCountsView();
        _visualizerInfo.show();
        _visualizerNetwork.show();
    };

    var loadTraits = function(node)
    {
        var options =
        {
            loadTraits: true,
            node: node,
            scope: _scope,
            availableScopeKeys: _availableScopeKeys,
            availableScopeValues: _availableScopeValues
        };
        
        var result = _nce.call('ncubeController.getVisualizerTraits', [_nce.getSelectedTabAppId(), options]);
        if (result.status === false) {
            _nce.showNote('Failed to load traits: ' + TWO_LINE_BREAKS + result.data);
            return node;
        }

        var json = result.data;

        if (json.status === STATUS_SUCCESS) {
            if (json.message !== null) {
                _nce.showNote(json.message);
            }
            var visInfo = json.visInfo
            node = visInfo.nodes['@items'][0];
            _scope = visInfo.scope;
            delete _scope['@type'];
            delete _scope['@id'];
            saveScope();
            updateScopeBuilderScope();
            _availableScopeValues = visInfo.availableScopeValues;
            _availableScopeKeys = visInfo.availableScopeKeys['@items'].sort();
            replaceNode(_nodes, node)
            _nodeDesc[0].innerHTML = node.desc;
            draw();
         }
        else {
            var message = json.message;
            if (json.stackTrace != null) {
                message = message + TWO_LINE_BREAKS + json.stackTrace
            }
            _nce.showNote('Failed to load traits: ' + TWO_LINE_BREAKS + message);
        }
        return node;
    }

    var load = function ()
    {
        clearVisLayoutEast()
        _nce.clearError();

        if (!_nce.getSelectedCubeName()) {
            _visualizerContent.hide();
            _nce.showNote('Failed to load visualizer: ' + TWO_LINE_BREAKS + 'No cube selected.');
            return;
        }

        //TODO: The .replace is temporary until figured out why nce.getSelectedCubeName()
        //TODO: occasionally contains a cube name with "_" instead of "." (e.g. rpm_class_product instead of
        //TODO: rpm.class.product) after a page refresh.
        _selectedCubeName = _nce.getSelectedCubeName().replace(/_/g, '.')

        if (_keepCurrentScope)
        {
            _keepCurrentScope = false;
        }
        else if (_reset)
        {
            _scope = null;
            _reset = false;
        }
        else{
            _scope = getSavedScope();
        }

         
        if (_reset || _selectedCubeName !== _loadedCubeName)
        {
            _selectedLevel = null;
            _selectedGroups = null;
            _hierarchical = false;
            _loadTraits = false;
            _network = null;
        }
  
        var options =
        {
            selectedLevel: _selectedLevel,
            startCubeName: _selectedCubeName,
            scope: _scope,
            selectedGroups: _selectedGroups,
            availableScopeKeys: _availableScopeKeys,
            availableScopeValues: _availableScopeValues,
            loadTraits: _loadTraits
        };


        var result = _nce.call('ncubeController.getVisualizerJson', [_nce.getSelectedTabAppId(), options]);
        if (result.status === false) {
            _nce.showNote('Failed to load visualizer: ' + TWO_LINE_BREAKS + result.data);
            _visualizerContent.hide();
            _visualizerInfo.hide();
            _visualizerNetwork.hide();
            return;
        }

        var json = result.data;

        if (json.status === STATUS_SUCCESS) {
            if (json.message !== null) {
                _nce.showNote(json.message);
            }
            loadData(json.visInfo, json.status);
            setGroupsAndExcluded();
            draw();
            loadSelectedLevelListView();
            saveScope();
            updateScopeBuilderScope();
            loadScopeView();
            loadHierarchicalView();
            loadLoadTraitsView();
            loadAvailableGroupsView();
            loadCountsView();
            _visualizerContent.show();
            _visualizerInfo.show();
            _visualizerNetwork.show();
        }
        else if (json.status === STATUS_MISSING_START_SCOPE) {
            _nce.showNote(json.message);
            loadData(json.visInfo, json.status);
            saveScope();
            updateScopeBuilderScope();
            loadScopeView();
            _visualizerContent.show();
            _visualizerInfo.hide();
            _visualizerNetwork.hide();
        }
        else {
            _visualizerContent.hide();
             var message = json.message;
            if (json.stackTrace != null) {
                message = message + TWO_LINE_BREAKS + json.stackTrace
            }
            _nce.showNote('Failed to load visualizer: ' + TWO_LINE_BREAKS + message);
        }
 
         if (_scopeBuilderListenersAdded === false){
            availableScopeKeys = _availableScopeKeys;
            availableScopeValues = _availableScopeValues;
            addScopeBuilderListeners();
            _scopeBuilderListenersAdded = true;
        }
    };

    function clearVisLayoutEast(){
        _nodeTitle[0].innerHTML = '';
        _nodeVisualizer[0].innerHTML = '';
        _nodeTraits[0].innerHTML = '';
        _nodeDesc[0].innerHTML = '';
        _layout.close('east');
    }

    function loadHierarchicalView() {
        $('#hierarchical').prop('checked', _hierarchical);
    }

    function loadLoadTraitsView() {
        $('#loadTraits').prop('checked', _loadTraits);
    }

    function loadScopeView() {
        _scopeInput.val(getScopeString());
    }

    function loadAvailableGroupsView()
    {
        var div = $('#availableGroupsAllLevels');
        div.empty();

        _availableGroupsAllLevels.sort();
        for (var j = 0; j < _availableGroupsAllLevels.length; j++)
        {
            var groupName = _availableGroupsAllLevels[j];
            var id = groupName + _groupSuffix;
            var input = $('<input>').attr({type: 'checkbox', id: id});

            var selected = false;
            for (var k = 0; k < _selectedGroups.length; k++)
            {
                if (groupIdsEqual(id, _selectedGroups[k]))
                {
                    selected = true;
                    break;
                }
            }
            input.prop('checked', selected);

            input.change(function () {
                selectedGroupChangeEvent(this);
            });

            div.append(input);
            div.append(NBSP + _allGroups[groupName] + NBSP + NBSP);
        }
    }

    function getScopeString(){
        var scopeString = '';
        var keys = Object.keys(_scope);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            scopeString += key + ':' + _scope[key] + ', ';
        }
        var scopeLen = scopeString.length;
        if (scopeLen > 1) {
            scopeString = scopeString.substring(0, scopeLen - 2);
        }
        return scopeString;
    }

    function selectedGroupChangeEvent(group)
    {
        if (group.checked) {
            for (var k = 0, kLen = _availableGroupsAllLevels.length; k < kLen; k++)
            {
                if (groupIdsEqual(group.id, _availableGroupsAllLevels[k])) {
                    _selectedGroups.push(_availableGroupsAllLevels[k]);
                    break;
                }
            }
        }
        else {
            for (var i = 0, len = _selectedGroups.length; i < len; i++) {
                if (groupIdsEqual(group.id, _selectedGroups[i])) {
                    _selectedGroups.splice(i, 1);
                    break;
                }
            }
        }

        groupCurrentlyAvailable(group)
    }

    function groupCurrentlyAvailable(group){
        var currentlyIncluded = false;

        for (var l = 0; l < _availableGroupsAtLevel.length; l++)
        {
            if (groupIdsEqual(group.id, _availableGroupsAtLevel[l]))
            {
                currentlyIncluded = true;
                break;
            }
        }

        if (group.checked && !currentlyIncluded) {
            var groupIdPrefix = group.id.split(_groupSuffix)[0];
            var levelLabel = _selectedLevel === 1 ? 'level' : 'levels';
            _nce.showNote('The group ' + groupIdPrefix + ' is not included in the ' + _selectedLevel + ' ' + levelLabel + ' currently displayed. Increase the levels to include the group.', 'Note', 3000);
        }
    }

    function groupIdsEqual(groupId1, groupId2)
    {
        var groupId1Prefix = groupId1.split(_groupSuffix)[0];
        var groupId2Prefix = groupId2.split(_groupSuffix)[0];
        return groupId1Prefix === groupId2Prefix;
    }

    function loadCountsView()
    {
        var maxLevelLabel = _maxLevel === 1 ? 'level' : 'levels';
        var nodeCountLabel = _nodeCount === 1 ? 'node' : 'nodes';
        $('#counts')[0].textContent = _nodeCount + ' ' + nodeCountLabel + ' over ' +  _maxLevel + ' ' + maxLevelLabel;
    }

    function loadSelectedLevelListView()
    {
        var select = $('#selectedLevel-list');
        select.empty();

        for (var j = 1; j <= _maxLevel; j++)
        {
            var option = $('<option/>');
            option[0].textContent = j.toString();
            select.append(option);
        }

        select.val('' + _selectedLevel);
    }

    function getVisNetworkHeight() {
        return  '' + ($(this).height() - $('#network').offset().top);
    }
    
    function isSelectedGroup(node)
    {
        for (var j = 0, jLen = _selectedGroups.length; j < jLen; j++)
        {
            if (groupIdsEqual(node.group, _selectedGroups[j])){
                return true;
            }
        }
        return false;
    }

    function setGroupsAndExcluded()
    {
        _excludedNodeIdList = [];
        _excludedEdgeIdList = [];
        var selectedGroups = [];
        var availableGroupsAtLevel = [];
        var   level = parseInt(_selectedLevel);
        
        //given the selected level, determine nodes to exclude, selected groups and available groups 
        for (var i = 0, iLen = _nodes.length; i < iLen; i++)
        {
            var node  = _nodes[i];
            var selectedGroup = isSelectedGroup(node);

            if (parseInt(node.level) > level)
            {
                _excludedNodeIdList.push(node.id);
            }
            else {
                if (selectedGroup) {
                    //collect selected groups at level
                    var groupNamePrefix = node.group.replace(_groupSuffix, '');
                    if (_selectedGroups.indexOf(groupNamePrefix) > -1 && selectedGroups.indexOf(groupNamePrefix) === -1) {
                        selectedGroups.push(groupNamePrefix);
                    }
                }
                else{
                    _excludedNodeIdList.push(node.id);
                }
                //collect available groups at level
                var groupNamePrefix = node.group.replace(_groupSuffix, '');
                if (availableGroupsAtLevel.indexOf(groupNamePrefix) == -1) {
                    availableGroupsAtLevel.push(groupNamePrefix)
                }
            }
        }

        //given the selected level, determine edges to exclude
        for (var k = 0, kLen = _edges.length; k < kLen; k++)
        {
            var edge  = _edges[k];
            if (parseInt(edge.level) > level)
            {
                _excludedEdgeIdList.push(edge.id);
            }
        }
        _selectedGroups = selectedGroups;
        _availableGroupsAtLevel = availableGroupsAtLevel;
    }

    function loadData(visInfo, status) {

        if (status === STATUS_SUCCESS) {
            _allGroups = visInfo.allGroups;
            _availableGroupsAllLevels = visInfo.availableGroupsAllLevels['@items'];
            _selectedGroups = visInfo.selectedGroups['@items'];
            _selectedLevel = visInfo.selectedLevel;
            _groupSuffix = visInfo.groupSuffix;
            _nodeCount = visInfo.nodeCount;
            _maxLevel = visInfo.maxLevel;
            _nodes = visInfo.nodes['@items'];
            _edges = visInfo.edges['@items'];
        }
        _scope = visInfo.scope;
        delete _scope['@type'];
        delete _scope['@id'];
        _loadedCubeName = _selectedCubeName;
        _availableScopeValues = visInfo.availableScopeValues;
        _availableScopeKeys = visInfo.availableScopeKeys['@items'].sort();
     }

    var handleCubeSelected = function() {
        load();
    };

    function clusterDescendantsBySelectedNode(nodeId, immediateDescendantsOnly) {
        _network.clusteredNodeIds.push(nodeId);
        clusterDescendants(immediateDescendantsOnly)
    }

    function clusterDescendants(immediateDescendantsOnly) {
        for (var i = 0; i < _network.clusteredNodeIds.length; i++) {
            var id = _network.clusteredNodeIds[i];
            clusterDescendantsByNodeId(id, immediateDescendantsOnly);
        }
    }

    function clusterDescendantsByNodeId(nodeId, immediateDescendantsOnly) {
        var clusterOptionsByData = getClusterOptionsByNodeId(nodeId);
        _network.clusterDescendants(nodeId, immediateDescendantsOnly, clusterOptionsByData, true)
    }

    function getClusterOptionsByNodeId(nodeId) {
        var clusterOptionsByData;
        return clusterOptionsByData = {
            processProperties: function (clusterOptions, childNodes) {
                var node = getNodeById(childNodes, nodeId);
                clusterOptions.label = node.label + ' cluster (double-click to expand)';
                clusterOptions.title = node.title + TWO_LINE_BREAKS + '(double-click to expand)';
                return clusterOptions;
            }
        };
    }

    function openClusterByClusterNodeId(clusterNodeId)  //TEMP: gets called when a clustered node is clicked
    {
        var nodesInCluster = _network.getNodesInCluster(clusterNodeId);
        for (var i = 0; i < nodesInCluster.length; i++)
        {
            var node = nodesInCluster[i];
            var indexNode = _network.clusteredNodeIds.indexOf(node);
            if (indexNode !== -1)
            {
                _network.clusteredNodeIds.splice(indexNode, 1);
            }
        }
        _network.openCluster(clusterNodeId)
    }

    function draw()
    {
        var container = document.getElementById('network');
        var options = {
            height: getVisNetworkHeight(),
            interaction: {
                navigationButtons: true,
                keyboard: {
                    enabled: false,
                    speed: {x: 5, y: 5, zoom: 0.02}
                },
                zoomView: true
            },
            nodes: {
                value: 24,
                scaling: {
                    min: 24,
                    max: 24,
                    label: {
                        enabled: false
                    }
                }
            },
            edges: {
                arrows: 'to',
                color: 'gray',
                smooth: true,
                hoverWidth: 3
            },
            physics: {
                barnesHut: {gravitationalConstant: -30000},
                stabilization: {iterations: 2500}
            },
            layout: {
                hierarchical: _hierarchical,
                improvedLayout : true,
                randomSeed:2
            },
            groups: { 
                PRODUCT: {
                    shape: 'box',
                    color: '#DAE4FA'
                },
                RISK: {
                    shape: 'box',
                    color: '#759BEC'
                },
                COVERAGE: {
                    shape: 'box',
                    color: '#113275',
                    font: {
                        color: '#D8D8D8'
                    }
                },
                CONTAINER: {
                    shape: 'star',
                    color: "#731d1d" // dark red
                },
                LIMIT: {
                    shape: 'ellipse',
                    color: '#FFFF99'
                },
                DEDUCTIBLE: {
                    shape: 'ellipse',
                    color: '#FFFF99'
                },
                PREMIUM: {
                    shape: 'circle',
                    color: '#0B930B',
                    font: {
                        color: '#D8D8D8'
                    }
                },
                RATE: {
                    shape: 'ellipse',
                    color: '#EAC259'
                },
                ROLE: {
                    shape: 'box',
                    color: '#F59D56'
                },
                ROLEPLAYER: {
                    shape: 'box',
                    color: '#F2F2F2'
                },
                RATEFACTOR: {
                    shape: 'ellipse',
                    color: '#EAC259'
                },
                PARTY: {
                    shape: 'box',
                    color: '#004000' // dark green
                },
                PLACE: {
                    shape: 'box',
                    color: '#481849' // dark purple
                },
                PRODUCT_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                RISK_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                COVERAGE_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                LIMIT_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                PREMIUM_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                RATE_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                RATEFACTOR_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                ROLE_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                ROLEPLAYER_ENUM : {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                CONTAINER_ENUM: {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                DEDUCTIBLE_ENUM: {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                PARTY_ENUM: {
                    shape: 'dot',
                    color: 'gray'   // gray
                },
                PLACE_ENUM: {
                    shape: 'dot',
                    color: 'gray'   // gray
                }
            }
        };

        if (_network) { // clean up memory
            _network.destroy();
            _network = null;
        }
        _network = new vis.Network(container, {nodes:_nodes, edges:_edges}, options);
        _network.nodesHandler.remove(_excludedNodeIdList);
        _network.edgesHandler.remove(_excludedEdgeIdList);
        customizeNetworkForNce(_network);
        _network.clusteredNodeIds = [];

        _network.on('select', function(params) {
            var nodeId = params.nodes[0];
            var node = getNodeById(_nodes, nodeId );
            if (node) {
                var cubeName = node.name;
                var appId =_nce.getSelectedTabAppId();
                var cubeLink = $('<a/>');
                cubeLink.addClass('nc-anc');
                cubeLink.html(cubeName);
                cubeLink.click(function (e) {
                    e.preventDefault();
                    _nce.selectCubeByName(cubeName, appId, TAB_VIEW_TYPE_NCUBE + PAGE_ID);
                });
                _nodeTitle[0].innerHTML = 'Class ';
                _nodeTitle.append(cubeLink);

                var visualizerLink = $('<a/>');
                visualizerLink.addClass('nc-anc');
                visualizerLink.html('visualize');
                visualizerLink.click(function (e) {
                    e.preventDefault();
                    _keepCurrentScope = true;
                    _scope = node.scope;
                    _nce.selectCubeByName(cubeName, appId, TAB_VIEW_TYPE_VISUALIZER + PAGE_ID);
                 });
                _nodeVisualizer[0].innerHTML = '';
                _nodeVisualizer.append(visualizerLink);

                var traitsLink = $('<a/>');
                traitsLink.addClass('nc-anc');
                traitsLink.html('load traits<BR><BR>');
                traitsLink.click(function (e) {
                    e.preventDefault();
                    loadTraits(node);
                  });
                _nodeTraits[0].innerHTML = '';
                _nodeTraits.append(traitsLink);

                _nodeDesc[0].innerHTML = node.desc;
                _layout.open('east');
            }
        });

        _network.on('doubleClick', function (params) {
            if (params.nodes.length === 1) {
                if (_network.isCluster(params.nodes[0])) {
                    openClusterByClusterNodeId(params.nodes[0]);
                } else {
                    clusterDescendantsBySelectedNode(params.nodes[0], false);
                }
            }
        });
    }

    function replaceNode(nodes, newNode) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            if (node.id === newNode.id) {
                nodes.splice(i, 1);
                nodes.push(newNode)
                return;
            }
        }
    }

    function getNodeById(nodes, nodeId) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            if (node.id === nodeId) {
                return node;
            }
        }
    }

    function customizeNetworkForNce(network) {
        network.clustering.clusterDescendants = function(nodeId, immediateDescendantsOnly, options) {
            var collectDescendants = function(node, parentNodeId, childEdgesObj, childNodesObj, immediateDescendantsOnly, options, parentClonedOptions, _this) {

                // collect the nodes that will be in the cluster
                for (var i = 0; i < node.edges.length; i++) {
                    var edge = node.edges[i];
                    //if (edge.hiddenByCluster !== true) {  //BBH:: commented this line
                    if (edge.hiddenByCluster !== true && edge.toId != parentNodeId) { //BBH: added this line
                        var childNodeId = _this._getConnectedId(edge, parentNodeId);

                        // if the child node is not in a cluster (may not be needed now with the edge.hiddenByCluster check)
                        if (_this.clusteredNodes[childNodeId] === undefined) {
                            if (childNodeId !== parentNodeId) {
                                if (options.joinCondition === undefined) {
                                    childEdgesObj[edge.id] = edge;
                                    childNodesObj[childNodeId] = _this.body.nodes[childNodeId];
                                    if (immediateDescendantsOnly == false) {
                                        collectDescendants(_this.body.nodes[childNodeId], childNodeId, childEdgesObj, childNodesObj, immediateDescendantsOnly, options, parentClonedOptions, _this); //BBH: added this line
                                    }
                                } else {
                                    // clone the options and insert some additional parameters that could be interesting.
                                    var childClonedOptions = _this._cloneOptions(this.body.nodes[childNodeId]);
                                    if (options.joinCondition(parentClonedOptions, childClonedOptions) === true) {
                                        childEdgesObj[edge.id] = edge;
                                        childNodesObj[childNodeId] = _this.body.nodes[childNodeId];
                                        if (immediateDescendantsOnly == false) {
                                            collectDescendants(_this.body.nodes[childNodeId], childNodeId, childEdgesObj, childNodesObj, immediateDescendantsOnly, options, parentClonedOptions, _this); //BBH: added this line
                                        }
                                    }
                                }
                            } else {
                                // swallow the edge if it is self-referencing.
                                childEdgesObj[edge.id] = edge;
                            }
                        }
                    }
                }
            };

            var refreshData = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

            // kill conditions
            if (nodeId === undefined) {
                throw new Error('No nodeId supplied to clusterDescendants!');
            }
            if (this.body.nodes[nodeId] === undefined) {
                throw new Error('The nodeId given to clusterDescendants does not exist!');
            }

            var node = this.body.nodes[nodeId];
            options = this._checkOptions(options, node);
            if (options.clusterNodeProperties.x === undefined) {
                options.clusterNodeProperties.x = node.x;
            }
            if (options.clusterNodeProperties.y === undefined) {
                options.clusterNodeProperties.y = node.y;
            }
            if (options.clusterNodeProperties.fixed === undefined) {
                options.clusterNodeProperties.fixed = {};
                options.clusterNodeProperties.fixed.x = node.options.fixed.x;
                options.clusterNodeProperties.fixed.y = node.options.fixed.y;
            }

            var childNodesObj = {};
            var childEdgesObj = {};
            var parentNodeId = node.id;
            var parentClonedOptions = this._cloneOptions(node);
            childNodesObj[parentNodeId] = node;

            collectDescendants(node, parentNodeId, childEdgesObj, childNodesObj, immediateDescendantsOnly, options, parentClonedOptions, this);

            this._cluster(childNodesObj, childEdgesObj, options, refreshData);
        };

        network.clustering._cloneOptions = function(item, type) {
            var clonedOptions = {};
            var util = vis.util;
            if (type === undefined || type === 'node') {
                util.deepExtend(clonedOptions, item.options, true);
                clonedOptions.x = item.x;
                clonedOptions.y = item.y;
                clonedOptions.amountOfConnections = item.edges.length;
            } else {
                util.deepExtend(clonedOptions, item.options, true);
            }
            return clonedOptions;
        };

        network.clusterDescendants = function () {
            return this.clustering.clusterDescendants.apply(this.clustering, arguments);
        };
    }

    /*================================= BEGIN SCOPE BUILDER ==========================================================*/
    var availableScopeKeys = []
    var availableScopeValues = {}

    //TODO  1. The key in the scope picker is case sensitive, which doesn’t play well with the case insensitive scope
    //TODO     that comes across from the server (Product vs. product, etc.).
    //TODO  2. Check the availableScopeValues map when the user selects a scope key. If the map contains
    //TODO     the selected key, make the scope value field a dropdown that contains the available scope values.
    function addScopeBuilderListeners() {
        var builderOptions = {
            title: 'Scope Builder',
            instructionsTitle: 'Instructions - Scope Builder',
            instructionsText: 'Add scoping for visualization.',
            availableScopeValues: availableScopeValues,
            columns: {
                isApplied: {
                    heading: 'Apply',
                    default: true,
                    type: PropertyBuilder.COLUMN_TYPES.CHECKBOX
                },
                key: {
                    heading: 'Key',
                    type: PropertyBuilder.COLUMN_TYPES.SELECT,
                    selectOptions: availableScopeKeys
                },
                value: {
                    heading: 'Value',
                    type: PropertyBuilder.COLUMN_TYPES.TEXT
                }
            },
            afterSave: function() {
                scopeBuilderSave();
            }
        };

        $('#scopeBuilderOpen').click(function() {
            PropertyBuilder.openBuilderModal(builderOptions, _scopeBuilderScope);
        });
    }

    function scopeBuilderSave() {
         var newScope = getScopeBuilderScopeText();
        _scopeInput.val(newScope);
        _scope = buildScopeFromText(newScope)
        saveScope();
     }

    function getSavedScope() {
        var scopeMap = localStorage[getStorageKey(_nce, SCOPE_MAP)];
        return scopeMap ? JSON.parse(scopeMap) : {};
    }

    //TODO: Temporarily override this function in index.js until figured out why nce.getSelectedCubeName()
    //TODO: occasionally contains a cube name with "_" instead of "." (e.g. rpm_class_product instead of
    //TODO: rpm.class.product) after a page refresh.
    function getStorageKey(nce, prefix) {
        //return prefix + ':' + nce.getSelectedTabAppId().app.toLowerCase() + ':' + nce.getSelectedCubeName().toLowerCase();
        return prefix + ':' + nce.getSelectedTabAppId().app.toLowerCase() + ':' + _selectedCubeName.toLowerCase();
    }

    function saveScope() {
        saveOrDeleteValue(_scope, getStorageKey(_nce, SCOPE_MAP));
    }

    function getScopeBuilderScopeText() {
        var scopeText = '';
        for (var i = 0, len = _scopeBuilderScope.length; i < len; i++) {
            var expression = _scopeBuilderScope[i];
            if (expression.isApplied) {
                scopeText += expression.key + ':' + expression.value + ', ';
            }
        }
        scopeText = scopeText.substring(0, scopeText.length - 2);
        return scopeText;
    }

    /*================================= END SCOPE BUILDER ============================================================*/

// Let parent (main frame) know that the child window has loaded.
// The loading of all of the Javascript (deeply) is continuous on the main thread.
// Therefore, the setTimeout(, 1) ensures that the main window (parent frame)
// is called after all Javascript has been loaded.
    setTimeout(function() { window.parent.frameLoaded(); }, 1);

    return {
        init: init,
        handleCubeSelected: handleCubeSelected,
        load: load
    };

})(jQuery);

var tabActivated = function tabActivated(info)
{
    Visualizer.init(info);
    Visualizer.load();
};

var cubeSelected = function cubeSelected()
{
    Visualizer.handleCubeSelected();
};
