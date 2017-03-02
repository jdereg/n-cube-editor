package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import com.cedarsoftware.ncube.NCubeResourcePersister
import com.cedarsoftware.ncube.ReleaseStatus
import com.cedarsoftware.ncube.exception.CoordinateNotFoundException
import com.cedarsoftware.ncube.exception.InvalidCoordinateException
import groovy.transform.CompileStatic
import org.junit.Before
import org.junit.Test

import static com.cedarsoftware.util.VisualizerConstants.*
import static com.cedarsoftware.util.VisualizerTestConstants.*

@CompileStatic
class VisualizerTest{

    static final String PATH_PREFIX = 'visualizer/**/'

    Visualizer visualizer
    Map inputScope
    VisualizerScopeInfo scopeInfo
    ApplicationID appId
    Map graphInfo
    VisualizerInfo visInfo
    Set messages
    List<Map<String, Object>> nodes
    List<Map<String, Object>> edges

    @Before
    void beforeTest(){
        appId = new ApplicationID(ApplicationID.DEFAULT_TENANT, 'test.visualizer', ApplicationID.DEFAULT_VERSION, ReleaseStatus.SNAPSHOT.name(), ApplicationID.HEAD)
        visualizer = new Visualizer()
        inputScope = new CaseInsensitiveMap()
        graphInfo = null
        visInfo = null
        messages = null
        nodes = null
        edges = null
        NCubeManager.NCubePersister = new NCubeResourcePersister(PATH_PREFIX)
    }

    @Test
    void testBuildGraph_checkVisInfo()
    {
        String startCubeName = 'CubeWithRefs'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages

        assert 5 == nodes.size()
        assert 4 == edges.size()
        assert [:] as CaseInsensitiveMap == scopeInfo.scope
        assert 3l == visInfo.maxLevel
        assert 6l == visInfo.nodeCount
        assert 5l == visInfo.relInfoCount
        assert 999999l == visInfo.defaultLevel
        assert [:] == scopeInfo.optionalGraphScopeAvailableValues
        assert '' == visInfo.groupSuffix
        assert ['NCUBE'] as Set == visInfo.availableGroupsAllLevels

        Map allGroups = [NCUBE: 'n-cube', RULE_NCUBE: 'rule cube', UNSPECIFIED: 'Unspecified']
        assert allGroups == visInfo.allGroups
        assert allGroups.keySet() == visInfo.allGroupsKeys

        //TODO:
       /* assert [CubeWithRefs: [] as Set,
                CubeWithNoDefaultsAndNoValues: ['CubeJAxis1', 'CubeJAxis2'] as Set,
                CubeHasTwoRefsToSameCube: [] as Set] == visInfo.requiredScopeKeys

        assert [CubeWithRefs: ['CubeDAxis1', 'CubeDAxis2'] as Set,
                CubeWithNoDefaultsAndNoValues: [] as Set,
                CubeHasTwoRefsToSameCube: ['CubeEAxis1', 'CubeEAxis2'] as Set] == visInfo.optionalScopeKeys
*/
        assert [('n-cube'): ['n-cube', 'rule cube'],
                ('rule cube'): ['n-cube', 'rule cube']] == visInfo.typesToAddMap

        //Spot check the network overrides
        assert (visInfo.networkOverridesBasic.groups as Map).keySet().containsAll(allGroups.keySet())
        assert true == ((visInfo.networkOverridesFull.nodes as Map).shadow as Map).enabled
        assert true == (visInfo.networkOverridesTopNode.shapeProperties as Map).useBorderWithImage
    }

    @Test
    void testBuildGraph_checkNodeAndEdgeInfo()
    {
        String startCubeName = 'CubeWithRefs'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages
        assert 5 == nodes.size()
        assert 4 == edges.size()

        //Check top node
        Map node = nodes.find { Map node ->'CubeWithRefs' == node.cubeName}
        assert null == node.fromFieldName
        assert startCubeName == node.title
        assert startCubeName == node.detailsTitle1
        assert null == node.detailsTitle2
        assert NCUBE == node.group
        assert '1' == node.level
        assert '1' == node.id
        assert startCubeName == node.label
        assert null == node.sourceCubeName
        assert null == node.sourceDescription
        assert [:] == node.scope
        assert [:] == node.availableScope
        assert ['n-cube', 'rule cube'] == node.typesToAdd
        assert true == node.showCellValuesLink
        assert false == node.showCellValues
        assert false == node.cellValuesLoaded
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_SCOPE}</b><pre><ul><li>none</li></ul></pre><br><b>")
        assert nodeDetails.contains("${DETAILS_LABEL_AVAILABLE_SCOPE}</b><pre><ul><li>none</li></ul></pre><br><b>")
       // assert nodeDetails.contains("${DETAILS_LABEL_REQUIRED_SCOPE_KEYS}</b><pre><ul><li>none</li></ul></pre><br><b>")
       // assert nodeDetails.contains("${DETAILS_LABEL_OPTIONAL_SCOPE_KEYS}</b><pre><ul><li>CubeDAxis1</li><li>CubeDAxis2</li></ul></pre><br>")
        assert nodeDetails.contains("${DETAILS_LABEL_AXES}</b><pre><ul><li>CubeDAxis1</li><li>CubeDAxis2</li></ul></pre><br>")
        assert !nodeDetails.contains(DETAILS_LABEL_CELL_VALUES)

        //Check one target node
        node = nodes.find { Map node2 ->'CubeHasTwoRefsToSameCube' == node2.cubeName}
        assert 'CubeDAxis1: CubeDAxis1Col3' == node.fromFieldName
        assert 'CubeHasTwoRefsToSameCube' == node.title
        assert 'CubeHasTwoRefsToSameCube' == node.detailsTitle1
        assert null == node.detailsTitle2
        assert NCUBE == node.group
        assert '2' == node.level
        assert 'CubeHasTwoRefsToSameCube' == node.label
        assert 'CubeWithRefs' == node.sourceCubeName
        assert 'CubeWithRefs' == node.sourceDescription
        assert [CubeDAxis1: 'CubeDAxis1Col3'] == node.scope
        assert [CubeDAxis1: 'CubeDAxis1Col3'] == node.availableScope
        assert ['n-cube', 'rule cube'] == node.typesToAdd
        assert true == node.showCellValuesLink
        assert false == node.showCellValues
        assert false == node.cellValuesLoaded
        nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_SCOPE}</b><pre><ul><li>CubeDAxis1: CubeDAxis1Col3</li></ul></pre><br><b>")
        assert nodeDetails.contains("${DETAILS_LABEL_AVAILABLE_SCOPE}</b><pre><ul><li>CubeDAxis1: CubeDAxis1Col3</li></ul></pre><br><b>")
       // assert nodeDetails.contains("${DETAILS_LABEL_REQUIRED_SCOPE_KEYS}</b><pre><ul><li>none</li></ul></pre><br><b>")
       // assert nodeDetails.contains("${DETAILS_LABEL_OPTIONAL_SCOPE_KEYS}</b><pre><ul><li>CubeEAxis1</li><li>CubeEAxis2</li></ul></pre><br><b>")
        assert nodeDetails.contains("${DETAILS_LABEL_AXES}</b><pre><ul><li>CubeEAxis1</li><li>CubeEAxis2</li></ul></pre><br>")
        assert !nodeDetails.contains(DETAILS_LABEL_CELL_VALUES)

        //Check edge between top node and target node above
        Map edge = edges.find { Map edge -> 'CubeHasTwoRefsToSameCube' == edge.toName && 'CubeWithRefs' == edge.fromName}
        assert 'CubeDAxis1: CubeDAxis1Col3' == edge.fromFieldName
        assert '2' == edge.level
        assert !edge.label
        assert  'CubeDAxis1: CubeDAxis1Col3' == edge.title
    }

    @Test
    void testBuildGraph_checkStructure()
    {
        String startCubeName = 'CubeWithRefs'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages
        assert nodes.size() == 5
        assert edges.size() == 4

        assert nodes.find { Map node -> 'CubeWithRefs' == node.label}
        assert nodes.find { Map node -> 'CubeHasTwoRefsToSameCube' == node.label}
        assert 3 == nodes.findAll { Map node -> 'CubeWithNoDefaultsAndNoValues' == node.label}.size()

        assert edges.find { Map edge -> 'CubeWithRefs' == edge.fromName && 'CubeHasTwoRefsToSameCube' == edge.toName}
        assert edges.find { Map edge -> 'CubeWithRefs' == edge.fromName && 'CubeWithNoDefaultsAndNoValues' == edge.toName}
        assert 2 == edges.findAll { Map edge -> 'CubeHasTwoRefsToSameCube' == edge.fromName && 'CubeWithNoDefaultsAndNoValues' == edge.toName}.size()
    }

    @Test
    void testBuildGraph_invokedWithDifferentVisInfoClass()
    {
        String startCubeName = 'CubeWithRefs'
        VisualizerInfo otherVisInfo = new OtherVisualizerInfo()
        assert otherVisInfo instanceof VisualizerInfo
        assert 'VisualizerInfo' != otherVisInfo.class.simpleName
        otherVisInfo.groupSuffix = 'shouldGetResetToEmpty'

        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, visInfo: otherVisInfo, scope: inputScope]
        buildGraph(options)
        assert !messages

        assert 'VisualizerInfo' == visInfo.class.simpleName
        assert '' ==  visInfo.groupSuffix

        Map node = visInfo.nodes.find { Map node ->'CubeWithRefs' == node.cubeName}
        assert NCUBE == node.group
    }

    @Test
    void testBuildGraph_cubeHasRefToNotExistsCube()
    {
        String startCubeName = 'CubeHasRefToNotExistsCube'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options, true)
        assert ['No cube exists with name of NotExistCube. Cube not included in the visualization.'] as Set == messages
        assert 1 == nodes.size()
        assert [] == edges

        Map node = nodes.find { Map node ->'CubeHasRefToNotExistsCube' == node.cubeName}
        assert null == node.fromFieldName
        assert startCubeName == node.title
    }

    @Test
    void testBuildGraph_ruleCubeWithAllDefaultsAndOnlyDefaultValues()
    {
        String startCubeName = 'RuleCubeWithAllDefaultsAndOnlyDefaultValues'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages

        assert 4l == visInfo.maxLevel

        Map node = nodes.find { Map node -> startCubeName == node.cubeName}
        assert RULE_NCUBE == node.group

        List<Map> level2Edges = edges.findAll { Map level2Edge -> startCubeName == level2Edge.fromName && '2' == level2Edge.level}
        assert level2Edges.size() == 4

        //Cube ref is a cube level default
        Map edge = level2Edges.find { Map edge1 -> 'CubeWithNoDefaultsAndNoValues' == edge1.toName}
        assert '' == edge.fromFieldName

        //Cube ref is a column level default from a rule axis
        edge = level2Edges.find { Map edge2 -> 'CubeWithDefaultsAndNoValues' == edge2.toName}
        assert 'RuleAxis1: (Condition3): true' == edge.fromFieldName

        // Cube ref is a condition on a rule axis
        edge = level2Edges.find { Map edge3 -> 'CubeWithSingleValue' == edge3.toName}
        assert 'RuleAxis1: (Condition1): @CubeWithSingleValue[:]' == edge.fromFieldName

        // Cube ref is a column level default from non-rule axis
        edge = level2Edges.find { Map edge4 -> 'CubeWithRefs' == edge4.toName}
        assert 'Axis2: Axis2Col2' == edge.fromFieldName
    }

    @Test
    void testBuildGraph_cubeHasTwoRefsToSameCube()
    {
        String startCubeName = 'CubeHasTwoRefsToSameCube'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages

        assert 2l == visInfo.maxLevel

        Map node = nodes.find { Map node ->'CubeHasTwoRefsToSameCube' == node.cubeName}
        assert null == node.fromFieldName
        assert [:] == node.scope
        assert [:] == node.availableScope

        node = nodes.find { Map node2 ->'CubeWithNoDefaultsAndNoValues' == node2.cubeName &&
                'CubeEAxis1: CubeEAxis1Col3, CubeEAxis2: CubeEAxis2Col1' == node2.fromFieldName}
        assert [CubeEAxis1: 'CubeEAxis1Col3', CubeEAxis2: 'CubeEAxis2Col1']  as CaseInsensitiveMap == node.scope
        assert [CubeEAxis1: 'CubeEAxis1Col3', CubeEAxis2: 'CubeEAxis2Col1']  as CaseInsensitiveMap == node.availableScope

        node = nodes.find { Map node3 ->'CubeWithNoDefaultsAndNoValues' == node3.cubeName &&
                'CubeEAxis1: default column, CubeEAxis2: default column' == node3.fromFieldName}
        assert [CubeEAxis1: 'default column', CubeEAxis2: 'default column'] as CaseInsensitiveMap == node.scope
        assert [CubeEAxis1: 'default column', CubeEAxis2: 'default column'] as CaseInsensitiveMap == node.availableScope
    }

    @Test
    void testBuildGraph_hasCircularRef()
    {
        String startCubeName = 'CubeHasCircularRef1'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert !messages

        assert 4l == visInfo.maxLevel

        Map node = nodes.find { Map node ->'CubeHasCircularRef1' == node.cubeName  && null == node.sourceCubeName && '1' == node.level}
        assert null == node.fromFieldName
        assert 'CubeHasCircularRef1' == node.title

        node = nodes.find { Map node2 ->'CubeHasCircularRef2' == node2.cubeName && 'CubeHasCircularRef1' == node2.sourceCubeName && '2' == node2.level}
        assert 'CubeGAxis1: CubeGAxis1Col3, CubeGAxis2: CubeGAxis2Col2' == node.fromFieldName
        assert 'CubeHasCircularRef2' == node.title
        assert 'CubeHasCircularRef1' == node.sourceDescription
        assert [CubeGAxis1: 'CubeGAxis1Col3', CubeGAxis2: 'CubeGAxis2Col2'] as CaseInsensitiveMap == node.scope
        assert [CubeGAxis1: 'CubeGAxis1Col3', CubeGAxis2: 'CubeGAxis2Col2'] as CaseInsensitiveMap == node.availableScope

        node = nodes.find { Map node2 ->'CubeHasCircularRef1' == node2.cubeName && 'CubeHasCircularRef2' == node2.sourceCubeName && '3' == node2.level}
        assert 'CubeHAxis1: CubeHAxis1Col1, CubeHAxis2: CubeHAxis2Col1' == node.fromFieldName
        assert 'CubeHasCircularRef1' == node.title
        assert 'CubeHasCircularRef2' == node.sourceDescription
        assert [CubeHAxis1: 'CubeHAxis1Col1', CubeHAxis2: 'CubeHAxis2Col1'] as CaseInsensitiveMap== node.scope
        assert [CubeHAxis1: 'CubeHAxis1Col1', CubeHAxis2: 'CubeHAxis2Col1', CubeGAxis1: 'CubeGAxis1Col3', CubeGAxis2: 'CubeGAxis2Col2'] as CaseInsensitiveMap ==  node.availableScope

        node = nodes.find { Map node2 ->'CubeHasCircularRef2' == node2.cubeName && 'CubeHasCircularRef1' == node2.sourceCubeName && '4' == node2.level}
        assert 'CubeGAxis1: CubeGAxis1Col3, CubeGAxis2: CubeGAxis2Col2' == node.fromFieldName
        assert 'CubeHasCircularRef2' == node.title
        assert 'CubeHasCircularRef1' == node.sourceDescription
        assert [CubeGAxis1: 'CubeGAxis1Col3', CubeGAxis2: 'CubeGAxis2Col2'] as CaseInsensitiveMap == node.scope
        assert [CubeHAxis1: 'CubeHAxis1Col1', CubeHAxis2: 'CubeHAxis2Col1', CubeGAxis1: 'CubeGAxis1Col3', CubeGAxis2: 'CubeGAxis2Col2'] as CaseInsensitiveMap ==  node.availableScope

        assert nodes.size() == 4
        assert edges.size() == 4
    }

    @Test
    void testGetCellValues_showCellValues_executedCellAndThreeTypesExceptionCells()
    {
        //Build graph
        String startCubeName = 'CubeWithExecutedCellAndThreeTypesExceptionCells'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, true, true, true)

        String nodeDetails = node.details as String

        //Cube has four cells with values.
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)

        //One throws InvalidCoordinateException
        assert nodeDetails.contains('class="' + InvalidCoordinateException.class.simpleName)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)

        //one throws CoordinateNotFoundException
        assert nodeDetails.contains('class="' + CoordinateNotFoundException.class.simpleName)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)

        //one throws Exception
        assert nodeDetails.contains('class="' + DETAILS_CLASS_EXCEPTION)
        assert nodeDetails.contains(DETAILS_TITLE_ERROR_DURING_EXECUTION)

        //one executes ok
        assert nodeDetails.contains('class="' + DETAILS_CLASS_EXECUTED_CELL)
        assert nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
    }

    @Test
    void testGetCellValues_showCellValues_executedCell()
    {
         //Build graph
        String startCubeName = 'CubeWithExecutedCell'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true, true)

        String nodeDetails = node.details as String
        assert nodeDetails.contains(DETAILS_LABEL_CELL_VALUES)
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_EXECUTED_CELL)
        assert nodeDetails.contains('class="' + DETAILS_CLASS_EXECUTED_CELL)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col4, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("@CubeWithSingleValue[CubeKAxis1:'CubeKAxis1Col1', CubeKAxis2: 'CubeKAxis2Col3']")
        assert nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
        assert nodeDetails.contains("value from CubeWithSingleValue in coordinate [CubeKAxis1:'CubeKAxis1Col1 ', CubeKAxis2: 'CubeKAxis2Col3']")
    }


    @Test
    void testGetCellValues_showCellValues_executedCells_withURLs()
    {
        String httpsURL = 'https://mail.google.com'
        String fileURL = 'file:///C:/Users/bheekin/Desktop/honey%20badger%20thumbs%20up.jpg'
        String httpURL = 'http://www.google.com'

        //Build graph
        String startCubeName = 'CubeWithExecutedCellsWithURLs'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true, true)

        String nodeDetails = node.details as String
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_EXECUTED_CELL)
        assert nodeDetails.contains('class="' + DETAILS_CLASS_EXECUTED_CELL)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col2, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col3, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col4, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains('class="coord_1 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains('class="coord_2 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains(httpsURL)
        assert nodeDetails.contains(fileURL)
        assert nodeDetails.contains(httpURL)
        assert nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
        assert nodeDetails.contains("""<a href="#" onclick='window.open("${httpsURL}");return false;'>${httpsURL}</a>""")
        assert nodeDetails.contains("""<a href="#" onclick='window.open("${fileURL}");return false;'>${fileURL}</a>""")
        assert nodeDetails.contains("""<a href="#" onclick='window.open("${httpURL}");return false;'>${httpURL}</a>""")
    }

    @Test
    void testGetCellValues_showCellValues_noDefaultsNoCellValues()
    {
        //Build graph
        String startCubeName = 'CubeWithNoDefaultsAndNoValues'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true, true, false)

        String nodeDetails = node.details as String
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(NONE)
        assert !nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert !nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
    }

   /* @Test  TODO:
    void testGetCellValues_showCellValues_notTopNode_requiredScope()
    {
        Map scope = [Axis1Primary: 'Axis1Col2',
                     Axis2Primary: 'Axis2Col2']
        inputScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'CubeWithDefaultColumn'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName, startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, startCubeName, '', '', false, true)
        assert scope == node.scope
        assert scope == node.availableScope
     }
*/

    @Test
    void testGetCellValues_showCellValues_withDefaultsNoCellValues()
    {
        //Build graph
        String startCubeName = 'CubeWithDefaultsAndNoValues'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true, true, false)

        String nodeDetails = node.details as String
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(NONE)
        assert !nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert !nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
    }


    @Test
    void testGetCellValues_showCellValues_ruleCubeWithAllDefaultsAndOnlyDefaultValues()
    {
       //Build graph
        String startCubeName = 'RuleCubeWithAllDefaultsAndOnlyDefaultValues'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1

        //TODO: Should show default values
        //node = checkNode(startCubeName, false, true)
        String nodeDetails = node.details as String
        assert !nodeDetails.contains(DETAILS_LABEL_EXPAND_ALL)
        assert !nodeDetails.contains(DETAILS_LABEL_COLLAPSE_ALL)

        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(NONE)
        assert !nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert !nodeDetails.contains(DETAILS_LABEL_EXECUTED_VALUE)
    }

    @Test
    void testGetCellValues_showCellValues_exceptionCell()
    {
        //Build graph
        String startCubeName = 'CubeWithExceptionCell'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, true, true)
        String nodeDetails = node.details as String

        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_ERROR_DURING_EXECUTION)
        assert nodeDetails.contains('class="' + DETAILS_CLASS_EXCEPTION)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col3, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("int a = 5")
        assert nodeDetails.contains("int b = 0")
        assert nodeDetails.contains("return a / b")
        assert nodeDetails.contains(DETAILS_LABEL_EXCEPTION)
        assert nodeDetails.contains("An exception was thrown while loading the coordinate")
        assert nodeDetails.contains(DETAILS_LABEL_MESSAGE)
        assert nodeDetails.contains(DETAILS_LABEL_ROOT_CAUSE)
        assert nodeDetails.contains(DETAILS_LABEL_STACK_TRACE)
    }

    /*TODO: Show cell values is temporarily disabled for n-cubes. Will add back in and fix these tests at that time
    @Test
    void testGetCellValues_showCellValues_coordinateNotFoundCell_dueToOneNotFoundValue()
    {
        //Build graph
        String startCubeName = 'CubeWithCoordinateNotFoundCell'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true)

        String nodeDetails = node.details as String
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)
        assert nodeDetails.contains('class="' + CoordinateNotFoundException.class.simpleName)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col2, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("@CubeWithSingleValue[CubeKAxis1:'bogusScopeValue', CubeKAxis2: 'CubeKAxis2Col3']")
        assert nodeDetails.contains(DETAILS_LABEL_EXCEPTION)
        assert nodeDetails.contains("The value bogusScopeValue is not valid for CubeKAxis1")
        assert nodeDetails.contains(DETAILS_CLASS_SCOPE_CLICK)
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col1")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col2")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col3")
    }

    @Test
    void testGetCellValues_showCellValues_coordinateNotFoundCell_dueToTwoNotFoundValues()
    {
        //Build graph
        String startCubeName = 'CubeWithCoordinateNotFoundCellDueToTwoNotFoundValues'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true)

        String nodeDetails = node.details as String
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)
        assert nodeDetails.contains('class="' + CoordinateNotFoundException.class.simpleName)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col2, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("@CubeWithSingleValue[CubeKAxis1:'bogusScopeValue', CubeKAxis2: 'dummyScopeValue']")
        assert nodeDetails.contains(DETAILS_LABEL_EXCEPTION)
        assert nodeDetails.contains("The value bogusScopeValue is not valid for CubeKAxis1")
        assert nodeDetails.contains(DETAILS_CLASS_SCOPE_CLICK)
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col1")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col2")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col3")

        //TODO: Should have values for CubeKAxis2
    }


    @Test
    void testGetCellValues_showCellValues_invalidCoordinateCell_dueToOneInvalidCoordinateKey()
    {
        //Build graph
        String startCubeName = 'CubeWithInvalidCoordinateCell'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true)

        String nodeDetails = node.details as String

        //Cube has one cell with a value. It executed OK.
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)
        assert nodeDetails.contains('class="' + InvalidCoordinateException.class.simpleName)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col1, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("@CubeWithSingleValue[bogusAxisName:'CubeKAxis1Col1', CubeKAxis2: 'CubeKAxis2Col3']")
        assert nodeDetails.contains(DETAILS_LABEL_EXCEPTION)

        assert nodeDetails.contains(ADDITIONAL_SCOPE_REQUIRED)
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col1")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col2")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col3")

        //TODO: CubeKAxis2 should not get flagged as invalid
        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col1")
        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col2")
        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col3")
    }

    @Test
    void testGetCellValues_showCellValues_invalidCoordinateCell_dueToTwoInvalidCoordinateKeys()
    {
        //Build graph
        String startCubeName = 'CubeWithInvalidCoordinateCellDueToTwoInvalidKeys'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode(startCubeName)

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode(startCubeName, false, true)

        String nodeDetails = node.details as String
        assert nodeDetails.contains(DETAILS_LABEL_CELL_VALUES)
        assert nodeDetails.contains('class="' + DETAILS_CLASS_CELL_VALUES)
        assert nodeDetails.contains(DETAILS_TITLE_MISSING_OR_INVALID_COORDINATE)
        assert nodeDetails.contains('class="' + InvalidCoordinateException.class.simpleName)
        assert nodeDetails.contains('CubeMAxis1: CubeMAxis1Col1, CubeMAxis2: CubeMAxis2Col1')
        assert nodeDetails.contains('class="coord_0 ' + DETAILS_CLASS_WORD_WRAP)
        assert nodeDetails.contains(DETAILS_LABEL_NON_EXECUTED_VALUE)
        assert nodeDetails.contains("@CubeWithSingleValue[bogusAxisName:'CubeKAxis1Col1', dummyAxisName: 'CubeKAxis2Col3']")
        assert nodeDetails.contains(DETAILS_LABEL_EXCEPTION)

        assert nodeDetails.contains(ADDITIONAL_SCOPE_REQUIRED)
        assert nodeDetails.contains(DETAILS_CLASS_SCOPE_CLICK)
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col1")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col2")
        assert nodeDetails.contains("CubeKAxis1: CubeKAxis1Col3")

        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col1")
        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col2")
        assert nodeDetails.contains("CubeKAxis2: CubeKAxis2Col3")
    }

   */

    @Test
    void testHandleCoordinateNotFoundException_withNoCubeNameOrAxisName()
    {
        //Neither cube name nor axis name
        CoordinateNotFoundException e = new CoordinateNotFoundException('CoordinateNotFoundException', null, null, null, null)
        VisualizerScopeInfo scopeInfo = new VisualizerScopeInfo()
        VisualizerRelInfo relInfo = new VisualizerRelInfo()
        relInfo.targetId = 1l
        scopeInfo.init(appId, [:])
        String message = VisualizerHelper.handleCoordinateNotFoundException(e, scopeInfo, relInfo)
        checkExceptionMessage(message, 'CoordinateNotFoundException')

        //No cube name
        e = new CoordinateNotFoundException('CoordinateNotFoundException', null, null, 'dummyAxis', null)
        message = VisualizerHelper.handleCoordinateNotFoundException(e, scopeInfo, relInfo)
        checkExceptionMessage(message, 'CoordinateNotFoundException')

        //No axis name
        e = new CoordinateNotFoundException('CoordinateNotFoundException', 'dummyCube', null, null, null)
        message = VisualizerHelper.handleCoordinateNotFoundException(e, scopeInfo, relInfo)
        checkExceptionMessage(message, 'CoordinateNotFoundException')
    }

    @Test
    void testHandleInvalidCoordinateException_withNoMissingScope()
    {
        Map visInfoScope = [dummyVisInfoKey: 'dummyValue'] as CaseInsensitiveMap
        Map relInfoScope = [dummyRelInfoKey: 'dummyValue'] as CaseInsensitiveMap
        NCube cube = new NCube('dummyCube')
        InvalidCoordinateException e = new InvalidCoordinateException('InvalidCoordinateException', null, null, relInfoScope.keySet())
        VisualizerScopeInfo scopeInfo = new VisualizerScopeInfo()
        scopeInfo.init(appId, [scope: new CaseInsensitiveMap(visInfoScope)])
        VisualizerRelInfo relInfo = new VisualizerRelInfo(appId)
        relInfo.targetId = 1l
        relInfo.targetCube = cube
        relInfo.availableTargetScope = new CaseInsensitiveMap(relInfoScope)
        String message = VisualizerHelper.handleInvalidCoordinateException(e, scopeInfo, relInfo, [] as Set)
        checkExceptionMessage(message, 'InvalidCoordinateException')
    }

    private static void checkExceptionMessage(String message, String exceptionName)
    {
        assert message.contains(DETAILS_LABEL_MESSAGE)
        assert message.contains(DETAILS_LABEL_ROOT_CAUSE)
        assert message.contains(exceptionName)
        assert message.contains(DETAILS_LABEL_STACK_TRACE)
    }

    @Test
    void testGetCellValues_hideCellValues()
    {
        //Build graph
        String startCubeName = 'CubeWithExecutedCell'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNode('CubeWithExecutedCell')

        //Simulate that the user clicks Show Cell Values for the node
        node.showCellValues = true
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNode('CubeWithExecutedCell', false, true)

        //Simulate that the user clicks Hide Cell Values for the node
        node.showCellValues = false
        options = [node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        checkNode('CubeWithExecutedCell', false, false, true)
    }

    private void buildGraph(Map options, boolean hasMessages = false)
    {
        visualizer = new Visualizer()
        visInfo?.nodes = []
        visInfo?.edges = []
        Map graphInfo = visualizer.buildGraph(appId, options)
        visInfo = graphInfo.visInfo as VisualizerInfo
        scopeInfo = graphInfo.scopeInfo as VisualizerScopeInfo
        messages = visInfo.messages
        if (!hasMessages)
        {
            assert !messages
        }
        nodes = visInfo.nodes as List
        edges = visInfo.edges as List
    }

    private void getCellValues(Map options, boolean hasMessages = false)
    {
        visInfo?.nodes = []
        visInfo?.edges = []
        Map graphInfo = visualizer.getCellValues(appId, options)
        visInfo = graphInfo.visInfo as VisualizerInfo
        scopeInfo = graphInfo.scopeInfo as VisualizerScopeInfo
        messages = visInfo.messages
        if (!hasMessages)
        {
            assert !messages
        }
        nodes = visInfo.nodes as List
        edges = visInfo.edges as List
    }

    private Map checkNode(String nodeName, boolean exceptionCell = false, boolean showCellValues = false, boolean cellValuesLoaded = false, boolean hasCellValues = true)
    {
        Map node = nodes.find {Map node1 ->  nodeName == node1.title}
        assert nodeName == node.label
        assert nodeName == node.detailsTitle1
        assert null == node.detailsTitle2
        String nodeDetails = node.details as String
        if (showCellValues)
        {
            assert true == node.showCellValuesLink
            assert true == node.cellValuesLoaded
            assert true == node.showCellValues
        }
        else
        {
            assert true == node.showCellValuesLink
            assert cellValuesLoaded == node.cellValuesLoaded
            assert false == node.showCellValues
        }

        assert nodeDetails.contains(DETAILS_LABEL_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AXES)

        boolean hasMessage = exceptionCell
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_MESSAGE)
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_ROOT_CAUSE)
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_STACK_TRACE)

        hasMessage = showCellValues
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_CELL_VALUES)

        hasMessage = showCellValues && hasCellValues
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_EXPAND_ALL)
        assert hasMessage == nodeDetails.contains(DETAILS_LABEL_COLLAPSE_ALL)
        assert hasMessage == nodeDetails.contains(DETAILS_TITLE_EXPAND_ALL)
        assert hasMessage == nodeDetails.contains(DETAILS_TITLE_COLLAPSE_ALL)
        assert hasMessage == nodeDetails.contains(DETAILS_CLASS_EXPAND_ALL)
        assert hasMessage == nodeDetails.contains(DETAILS_CLASS_COLLAPSE_ALL)

        return node
    }

    class OtherVisualizerInfo extends VisualizerInfo {}
}
