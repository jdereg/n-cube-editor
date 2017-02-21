package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.Axis
import com.cedarsoftware.ncube.AxisType
import com.cedarsoftware.ncube.AxisValueType
import com.cedarsoftware.ncube.GroovyExpression
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import com.cedarsoftware.ncube.NCubeResourcePersister
import com.cedarsoftware.ncube.ReleaseStatus
import groovy.transform.CompileStatic
import org.junit.Before
import org.junit.Test

import static com.cedarsoftware.util.RpmVisualizerConstants.*
import static com.cedarsoftware.util.VisualizerTestConstants.*

@CompileStatic
class RpmVisualizerTest
{
    static final String PATH_PREFIX = 'rpmvisualizer/**/'
    static final String DETAILS_LABEL_UTILIZED_SCOPE = 'Utilized scope'
    static final String DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS = 'Utilized scope to load class without all traits'
    static final String DETAILS_LABEL_FIELDS = 'Fields'
    static final String DETAILS_LABEL_FIELDS_AND_TRAITS = 'Fields and traits'
    static final String DETAILS_LABEL_CLASS_TRAITS = 'Class traits'
    static final String VALID_VALUES_FOR_FIELD_SENTENCE_CASE = 'Valid values for field '
    static final String VALID_VALUES_FOR_FIELD_LOWER_CASE = 'valid values for field '

    static final String defaultScopeDate = DATE_TIME_FORMAT.format(new Date())
    
    RpmVisualizer visualizer
    RpmVisualizerScopeInfo inputScopeInfo
    RpmVisualizerScopeInfo scopeInfo
    ApplicationID appId
    Map graphInfo
    RpmVisualizerInfo visInfo
    Set messages
    List<Map<String, Object>> nodes
    List<Map<String, Object>> edges

    @Before
    void beforeTest(){
        appId = new ApplicationID(ApplicationID.DEFAULT_TENANT, 'test.visualizer', ApplicationID.DEFAULT_VERSION, ReleaseStatus.SNAPSHOT.name(), ApplicationID.HEAD)
        visualizer = new RpmVisualizer()
        inputScopeInfo = new RpmVisualizerScopeInfo(appId)
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
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage',
                     risk             : 'WProductOps'] as CaseInsensitiveMap
        inputScopeInfo.scope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)
        assert !visInfo.messages

        //Check visInfo
        assert 5 == visInfo.nodes.size()
        assert 4 == visInfo.edges.size()
        assert 4l == visInfo.maxLevel
        assert 6l == visInfo.nodeCount
        assert 5l == visInfo.relInfoCount
        assert 3l == visInfo.defaultLevel
        assert '_ENUM' == visInfo.groupSuffix
        assert scope == scopeInfo.scope

        Map allGroups =  [PRODUCT: 'Product', FORM: 'Form', RISK: 'Risk', COVERAGE: 'Coverage', CONTAINER: 'Container', DEDUCTIBLE: 'Deductible', LIMIT: 'Limit', RATE: 'Rate', RATEFACTOR: 'Rate Factor', PREMIUM: 'Premium', PARTY: 'Party', PLACE: 'Place', ROLE: 'Role', ROLEPLAYER: 'Role Player', UNSPECIFIED: 'Unspecified']
        assert allGroups == visInfo.allGroups
        assert allGroups.keySet() == visInfo.allGroupsKeys
        assert ['COVERAGE', 'RISK'] as Set == visInfo.availableGroupsAllLevels

        //Spot check typesToAddMap
        assert ['Coverage', 'Deductible', 'Limit', 'Premium', 'Rate', 'Ratefactor', 'Role'] == visInfo.typesToAddMap['Coverage']

        //Spot check the network overrides
        assert (visInfo.networkOverridesBasic.groups as Map).keySet().containsAll(allGroups.keySet())
        assert false == ((visInfo.networkOverridesFull.nodes as Map).shadow as Map).enabled
        assert (visInfo.networkOverridesTopNode.shapeProperties as Map).containsKey('borderDashes')
    }

    @Test
    void testBuildGraph_canLoadTargetAsRpmClass()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product:'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     coverage: 'CCCoverage',
                     sourceCoverage: 'FCoverage',
                     risk: 'WProductOps'] as CaseInsensitiveMap

        inputScopeInfo.scope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        Map node = checkNodeBasics('Location', 'Risk', UNABLE_TO_LOAD, 'Coverage points directly to Risk via field Location, but there is no risk named Location on Risk.', true)
        checkNoScopePrompt(node)
        Map availableScope = new CaseInsensitiveMap(scope)
        availableScope.putAll([risk: 'Location', sourceRisk: 'WProductOps'])
        assert node.availableScope == availableScope
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_checkNodeAndEdge_nonEPM()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //Top level source node
        Map node = checkNodeBasics('partyrole.LossPrevention', 'partyrole.LossPrevention', '', '', false)
        assert null == node.fromFieldName
        assert 'UNSPECIFIED' == node.group
        assert '1' == node.level
        assert null == node.sourceCubeName
        assert null == node.sourceDescription
        assert null == node.typesToAdd
        assert scope == node.scope
        assert scope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>roleRefCode</li><li>Parties</li></ul></pre>")

        //Edge from top level node to enum
        Map edge = edges.find { Map edge -> 'partyrole.LossPrevention' == edge.fromName && 'partyrole.BasePartyRole.Parties' == edge.toName}
        assert 'Parties' == edge.fromFieldName
        assert '2' == edge.level
        assert 'Parties' == edge.label
        assert "Field Parties cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Enum node under top level node
        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Parties on partyrole.LossPrevention", '', false)
        assert 'Parties' == node.fromFieldName
        assert 'PARTY_ENUM' == node.group
        assert '2' == node.level
        assert 'rpm.class.partyrole.LossPrevention' == node.sourceCubeName
        assert [_effectiveVersion: ApplicationID.DEFAULT_VERSION, sourceFieldName: 'Parties'] == node.scope
        assert [_effectiveVersion: ApplicationID.DEFAULT_VERSION, sourceFieldName: 'Parties'] == node.availableScope
        assert 'LossPrevention' == node.sourceDescription
        assert null == node.typesToAdd
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>party.MoreNamedInsured</li><li>party.ProfitCenter</li></ul></pre>")

        //Edge from enum to target node
        edge = edges.find { Map edge1 -> 'partyrole.BasePartyRole.Parties' == edge1.fromName && 'party.ProfitCenter' == edge1.toName}
        assert 'party.ProfitCenter' == edge.fromFieldName
        assert '3' == edge.level
        assert !edge.label
        assert 'Valid value party.ProfitCenter cardinality 0:1' == edge.title

        //Target node under enum
        node = checkNodeBasics('party.ProfitCenter', 'party.ProfitCenter', '', '', false)
        assert 'party.ProfitCenter' == node.fromFieldName
        assert 'PARTY' == node.group
        assert '3' == node.level
        assert 'rpm.enum.partyrole.BasePartyRole.Parties' == node.sourceCubeName
        assert 'partyrole.BasePartyRole.Parties' == node.sourceDescription
        assert  [] == node.typesToAdd
        assert scope == node.scope
        assert [_effectiveVersion: ApplicationID.DEFAULT_VERSION, sourceFieldName: 'Parties'] == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>roleRefCode</li><li>fullName</li><li>fein</li></ul></pre>")
    }

    @Test
    void testBuildGraph_checkStructure()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                          product          : 'WProduct',
                          policyControlDate: '2017-01-01',
                          quoteDate        : '2017-01-01',
                          coverage         : 'FCoverage',
                          risk             : 'WProductOps'] as CaseInsensitiveMap
        inputScopeInfo.scope = new CaseInsensitiveMap(scope)

        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)

        assert nodes.size() == 5
        assert edges.size() == 4

        assert nodes.find { Map node -> 'FCoverage' == node.label}
        assert nodes.find { Map node -> 'ICoverage' == node.label}
        assert nodes.find { Map node -> 'CCCoverage' == node.label}
        assert nodes.find { Map node -> "${UNABLE_TO_LOAD}Location".toString() == node.label}
        assert nodes.find { Map node -> "${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage".toString() == node.title}

        assert edges.find { Map edge -> 'FCoverage' == edge.fromName && 'Coverage.Coverages' == edge.toName}
        assert edges.find { Map edge -> 'Coverage.Coverages' == edge.fromName && 'ICoverage' == edge.toName}
        assert edges.find { Map edge -> 'Coverage.Coverages' == edge.fromName && 'CCCoverage' == edge.toName}
        assert edges.find { Map edge -> 'CCCoverage' == edge.fromName && 'Location' == edge.toName}
    }

    @Test
    void testBuildGraph_checkStructure_nonEPM()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = new CaseInsensitiveMap(scope)

        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)

        assert nodes.size() == 4
        assert edges.size() == 3

        assert nodes.find { Map node ->'rpm.class.partyrole.LossPrevention' == node.cubeName}
        assert nodes.find { Map node ->'rpm.class.party.MoreNamedInsured' == node.cubeName}
        assert nodes.find { Map node ->'rpm.class.party.ProfitCenter' == node.cubeName}
        assert nodes.find { Map node ->'rpm.enum.partyrole.BasePartyRole.Parties' == node.cubeName}

        assert edges.find { Map edge ->'partyrole.BasePartyRole.Parties' == edge.fromName && 'party.ProfitCenter' == edge.toName}
        assert edges.find { Map edge ->'partyrole.BasePartyRole.Parties' == edge.fromName && 'party.MoreNamedInsured' == edge.toName}
        assert edges.find { Map edge ->'partyrole.LossPrevention' == edge.fromName && 'partyrole.BasePartyRole.Parties' == edge.toName}
    }

    @Test
    void testBuildGraph_checkNodeAndEdge()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage',
                     risk             : 'WProductOps'] as CaseInsensitiveMap
        inputScopeInfo.scope = new CaseInsensitiveMap(scope)

        Map enumScope = new CaseInsensitiveMap(scope)
        enumScope.sourceFieldName = 'Coverages'

        Map cCoverageScope = new CaseInsensitiveMap(scope)
        cCoverageScope.coverage = 'CCCoverage'
        cCoverageScope.sourceCoverage = 'FCoverage'

        Map availableCCCoverageScope = new CaseInsensitiveMap(cCoverageScope)
        availableCCCoverageScope.sourceFieldName = 'Coverages'

        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //Top level source node
        Map node = checkNodeBasics('FCoverage', 'Coverage', '', '', false)
        assert 'rpm.class.Coverage' == node.cubeName
        assert null == node.fromFieldName
        assert 'COVERAGE' == node.group
        assert '1' == node.level
        assert null == node.sourceCubeName
        assert null == node.sourceDescription
        assert ['Coverage', 'Deductible', 'Limit', 'Premium', 'Rate', 'Ratefactor', 'Role'] == node.typesToAdd
        assert scope == node.scope
        assert scope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>Coverages</li><li>Exposure</li><li>StatCode</li></ul></pre>")

        //Edge from top level node to enum
        Map edge = edges.find { Map edge -> 'FCoverage' == edge.fromName && 'Coverage.Coverages' == edge.toName}
        assert 'Coverages' == edge.fromFieldName
        assert '2' == edge.level
        assert 'Coverages' == edge.label
        assert "Field Coverages cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Enum node under top level node
        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage", '', false)
        assert 'rpm.enum.Coverage.Coverages' == node.cubeName
        assert 'Coverages' == node.fromFieldName
        assert 'COVERAGE_ENUM' == node.group
        assert '2' == node.level
        assert 'rpm.class.Coverage' == node.sourceCubeName
        assert 'FCoverage' == node.sourceDescription
        assert enumScope == node.scope
        assert enumScope == node.availableScope
        assert null == node.typesToAdd
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>CCCoverage</li><li>ICoverage</li></ul></pre>")

        //Edge from enum to target node
        edge = edges.find { Map edge1 -> 'Coverage.Coverages' == edge1.fromName && 'CCCoverage' == edge1.toName}
        assert 'CCCoverage' == edge.fromFieldName
        assert '3' == edge.level
        assert !edge.label
        assert "Valid value CCCoverage cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Target node of top level node
        node = checkNodeBasics('CCCoverage', 'Coverage', '', '', false)
        assert 'rpm.class.Coverage' == node.cubeName
        assert 'CCCoverage' == node.fromFieldName
        assert 'COVERAGE' == node.group
        assert '3' == node.level
        assert 'rpm.enum.Coverage.Coverages' == node.sourceCubeName
        assert 'field Coverages on FCoverage' == node.sourceDescription
        assert ['Coverage', 'Deductible', 'Limit', 'Premium', 'Rate', 'Ratefactor', 'Role'] == node.typesToAdd
        assert cCoverageScope == node.scope
        assert availableCCCoverageScope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>Exposure</li><li>Location</li><li>StatCode</li><li>field1</li><li>field2</li><li>field3</li><li>field4</li></ul></pre>")
    }

    @Test
    void testGetCellValues_classNode_showCellValues()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                          product          : 'WProduct',
                          policyControlDate: '2017-01-01',
                          quoteDate        : '2017-01-01',
                          sourceCoverage   : 'FCoverage',
                          coverage         : 'CCCoverage',
                          sourceFieldName  : 'Coverages',
                          risk             : 'WProductOps',
                          businessDivisionCode: 'AAADIV'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'CCCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'CCCoverage',
                scope: nodeScope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: scope,
                typesToAdd: [],
          ]

        inputScopeInfo.scope = scope
        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set
        Map options = [node: oldNode, visInfo: visInfo, scopeInfo: inputScopeInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        assert !visInfo.messages
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = checkNodeBasics('CCCoverage', 'Coverage', '', '', false, true)
        assert nodeScope == node.scope
        assert scope == node.availableScope
        String nodeDetails = node.details as String
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: 1133</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre>")
        assert nodeDetails.contains("field1</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: 1133</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field2</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: 1133</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field3</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field3</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field4</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: 1133</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: CCCoverage</li><li>r:scopedName: CCCoverage</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_classNode_showCellValues_withURLs()
    {
        String httpsURL = 'https://mail.google.com'
        String fileURL = 'file:///C:/Users/bheekin/Desktop/honey%20badger%20thumbs%20up.jpg'
        String httpURL = 'http://www.google.com'
        String fileLink = """<a href="#" onclick='window.open("${fileURL}");return false;'>${fileURL}</a>"""
        String httpsLink = """<a href="#" onclick='window.open("${httpsURL}");return false;'>${httpsURL}</a>"""
        String httpLink = """<a href="#" onclick='window.open("${httpURL}");return false;'>${httpURL}</a>"""

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'AdmCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps',
                     businessDivisionCode: 'AAADIV'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'AdmCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'AdmCoverage',
                scope: nodeScope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: scope,
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        inputScopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set
        Map options = [node: oldNode, visInfo: visInfo, scopeInfo: inputScopeInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        assert !visInfo.messages
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node -> 'AdmCoverage' == node.label}
        assert true == node.showCellValuesLink
        assert true == node.showCellValues
        assert true == node.cellValuesLoaded
        assert nodeScope == node.scope
        assert scope == node.availableScope
        String nodeDetails = node.details as String
        assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${fileLink}</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${httpLink}</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${httpsLink}</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: AdmCoverage</li><li>r:scopedName: AdmCoverage</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_enumNode_showCellValues()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)

        Map oldNode = [
                id: '2',
                cubeName: 'rpm.enum.Coverage.Coverages',
                fromFieldName: 'FCoverage',
                title: "${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage",
                level: '2',
                scope: nodeScope,
                availableScope: scope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: new CaseInsensitiveMap(scope),
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        inputScopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set

        Map options = [node: oldNode, visInfo: visInfo, scopeInfo: inputScopeInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        assert !visInfo.messages
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node1 -> "${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage".toString() == node1.title}
        assert true == node.showCellValuesLink
        assert true == node.showCellValues
        assert true == node.cellValuesLoaded
        assert nodeScope == node.scope
        assert scope == node.availableScope
        String nodeDetails = node.details as String
        assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS_AND_TRAITS}</b><pre><ul><li><b>CCCoverage</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:name: CCCoverage</li><li>v:max: 999999</li><li>v:min: 0</li></ul></pre><li><b>ICoverage</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:name: ICoverage</li><li>v:max: 1</li><li>v:min: 0</li></ul>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_classNode_hideCellValues()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     sourceCoverage   : 'FCoverage',
                     coverage         : 'CCCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'CCCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'CCCoverage',
                scope: nodeScope,
                showCellValues: false,
                showCellValuesLink: true,
                cellValuesLoaded: true,
                availableScope: scope,
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        inputScopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set

        Map options = [node: oldNode, visInfo: visInfo, scopeInfo: inputScopeInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        assert !visInfo.messages
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node -> 'CCCoverage' == node.label}
        assert true == node.showCellValuesLink
        assert false == node.showCellValues
        assert true == node.cellValuesLoaded
        assert nodeScope == node.scope
        assert scope == node.availableScope
        String nodeDetails = node.details as String
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>Exposure</li><li>Location</li><li>StatCode</li><li>field1</li><li>field2</li><li>field3</li><li>field4</li></ul></pre>")
        assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
    }

    @Test
    void testBuildGraph_cubeNotFound()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.enum.partyrole.BasePartyRole.Parties')
        try
        {
            //Change enum to have reference to non-existing cube
            cube.addColumn((AXIS_NAME), 'party.NoCubeExists')
            cube.setCell(true,[name:'party.NoCubeExists', trait: R_EXISTS])
            inputScopeInfo.scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
            String startCubeName = 'rpm.class.partyrole.LossPrevention'
            Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

            buildGraph(options)
            
            assert 1 == messages.size()
            assert 'No cube exists with name of rpm.class.party.NoCubeExists. Cube not included in the visualization.' == messages.first()
        }
        finally
        {
            //Reset cube
            cube.deleteColumn((AXIS_NAME), 'party.NoCubeExists')
            assert !cube.findColumn(AXIS_NAME, 'party.NoCubeExists')
        }
    }

    @Test
    void testBuildGraph_effectiveVersionApplied_beforeFieldAddAndObsolete()
    {
        Map scope = [product: 'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     _effectiveVersion: '1.0.0'] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li><li>fieldObsolete101</li></ul></pre>")
    }

    @Test
    void testBuildGraph_effectiveVersionApplied_beforeFieldAddAfterFieldObsolete()
    {
        Map scope = [product: 'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     _effectiveVersion: '1.0.1'] as CaseInsensitiveMap
        inputScopeInfo.scope = scope

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li></ul></pre>")
    }

    @Test
    void testBuildGraph_effectiveVersionApplied_afterFieldAddAndObsolete()
    {
        Map scope = [product: 'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     _effectiveVersion: '1.0.2'] as CaseInsensitiveMap
        inputScopeInfo.scope = scope

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}</b><pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li><li>fieldAdded102</li></ul></pre>")
    }

    @Test
    void testBuildGraph_validRpmClass()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        
        checkValidRpmClass( startCubeName)
    }

    @Test
    void testBuildGraph_validRpmClass_notStartWithRpmClass()
    {
        String startCubeName = 'ValidRpmClass'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 1 == messages.size()
        String message = messages.first()
        assert "Starting cube for visualization must begin with 'rpm.class', n-cube ${startCubeName} does not.".toString() == message
    }

    @Test
    void testBuildGraph_validRpmClass_noTraitAxis()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.deleteAxis(AXIS_TRAIT)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 1 == messages.size()
        String message = messages.first()
        assert "Cube ${startCubeName} is not a valid rpm class since it does not have both a field axis and a traits axis.".toString() == message
    }

    @Test
    void testBuildGraph_validRpmClass_noFieldAxis()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.deleteAxis(AXIS_FIELD)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 1 == messages.size()
        String message = messages.first()
        assert "Cube ${startCubeName} is not a valid rpm class since it does not have both a field axis and a traits axis.".toString() == message
    }

    @Test
    void testBuildGraph_validRpmClass_noCLASSTRAITSField()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.getAxis(AXIS_FIELD).columns.remove(CLASS_TRAITS)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        checkValidRpmClass( startCubeName)
    }

    @Test
    void testBuildGraph_validRpmClass_noRExistsTrait()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.getAxis(AXIS_TRAIT).columns.remove(R_EXISTS)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        checkValidRpmClass(startCubeName)
    }

    @Test
    void testBuildGraph_validRpmClass_noRRpmTypeTrait()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.getAxis(AXIS_TRAIT).columns.remove(R_RPM_TYPE)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScopeInfo.scope = scope
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        checkValidRpmClass( startCubeName)
    }

    @Test
    void testBuildGraph_invokedWithParentVisualizerInfoClass()
    {
        Map scope     = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                          product          : 'WProduct',
                          policyControlDate: '2017-01-01',
                          quoteDate        : '2017-01-01',
                          coverage         : 'FCoverage',
                          risk             : 'WProductOps'] as CaseInsensitiveMap
        inputScopeInfo.scope = scope

        String startCubeName = 'rpm.class.Coverage'
        VisualizerInfo notRpmVisInfo = new VisualizerInfo()
        notRpmVisInfo.groupSuffix = 'shouldGetReset'

        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: notRpmVisInfo]

        buildGraph(options)
        assert 0 == messages.size()

        assert 'RpmVisualizerInfo' == visInfo.class.simpleName
        assert '_ENUM' ==  visInfo.groupSuffix

        Map node = nodes.find { Map node ->'FCoverage' == node.label}
        assert 'COVERAGE' == node.group
    }

    @Test
    void testBuildGraph_exceptionInMinimumTrait()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.scope.class.Coverage.traits')
        Map coordinate = [(AXIS_FIELD): 'Exposure', (AXIS_TRAIT): R_EXISTS, coverage: 'FCoverage'] as Map

        try
        {
            //Change r:exists trait for FCoverage to throw an exception
            String expression = 'int a = 5; int b = 0; return a / b'
            cube.setCell(new GroovyExpression(expression, null, false), coordinate)

            Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                         product          : 'WProduct',
                         policyControlDate: '2017-01-01',
                         quoteDate        : '2017-01-01'] as CaseInsensitiveMap
            inputScopeInfo.scope = scope

            String startCubeName = 'rpm.class.Product'
            Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

            buildGraph(options)
            assert 0 == messages.size()
            List<Map<String, Object>> nodes = visInfo.nodes as List

            Map node = nodes.find {Map node -> 'Unable to load FCoverage' == node.label}
            assert 'Coverage' == node.title
            assert 'Coverage' == node.detailsTitle1
            assert null == node.detailsTitle2
            String nodeDetails = node.details as String
            assert nodeDetails.contains("${UNABLE_TO_LOAD}fields and traits for FCoverage")
            checkExceptionMessage(nodeDetails)
            assert false == node.showCellValuesLink
            assert false == node.showCellValues
            assert false == node.cellValuesLoaded
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_FIELDS)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
        finally
        {
            //Reset cube
            cube.setCell(new GroovyExpression('true', null, false), coordinate)
        }
    }

    @Test
    void testBuildGraph_graphScopePrompt_initial()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.displayScopeMessage
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkRequiredGraphScope()
        checkOptionalGraphScope()
    }

    @Test
    void testBuildGraph_nodeScopePrompts_initial()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 1 == nodes.size()
        assert 0 == edges.size()
        
        //Check starting node scope prompt
        Map node = checkNodeBasics('Product', 'Product', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        checkScopePromptTitle(node, 'product', true, 'rpm.scope.class.Product.traits')
        checkScopePromptDropdown(node, 'product', '', ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        assert node.availableScope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()
    }
    
    @Test 
    void testBuildGraph_graphScopePrompt_afterProductSelected()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.displayScopeMessage
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkRequiredGraphScope('AProduct')
        checkOptionalGraphScope('AProduct')
    }

    @Test
    void testBuildGraph_nodeScopePrompts_afterProductSelected()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()
        
        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product', '', '', false)
        checkNoScopePrompt(node)
        assert node.availableScope == [product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has two default scope prompts, no required prompts
        node = checkNodeBasics('ARisk', 'Risk', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'div', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(node, 'div', DEFAULT, ['div1', DEFAULT], ['div2'], SELECT_OR_ENTER_VALUE)
        checkScopePromptTitle(node, 'state', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(node, 'state', DEFAULT, ['KY', 'NY', 'OH', DEFAULT], ['IN', 'GA'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'pgm')
        assert node.availableScope == [sourceFieldName: 'Risks', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has one required scope prompt, no default prompts
        node = checkNodeBasics('BRisk', 'Risk', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        checkScopePromptTitle(node, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(node, 'pgm', '', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [sourceFieldName: 'Risks', risk: 'BRisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has two required scope prompts, no default prompts
        node = checkNodeBasics('ACoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        checkScopePromptTitle(node, 'div', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(node, 'div', '', ['div1', 'div2'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkScopePromptTitle(node, 'pgm', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(node, 'pgm', '', ['pgm1', 'pgm2', 'pgm3'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [coverage: 'ACoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //BCoverage has one required scope prompt, one default scope prompt. The default scope prompt doesn't show yet since
        //there is currently a required scope prompt for the node.
        node = checkNodeBasics('BCoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        checkScopePromptTitle(node, 'div', true, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(node, 'div', '', ['div3'], ['div1', 'div2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'pgm')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [coverage: 'BCoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //CCoverage has one default scope prompt, no required prompts
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(node, 'state', 'Default', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'pgm')
        assert node.availableScope == [sourceFieldName: 'Coverages', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_graphScopePrompt_afterInvalidProductEntered()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User enters invalid XXXProduct. Reload.
        inputScopeInfo.scope.product = 'XXXProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check graph scope prompt
        checkRequiredGraphScope('XXXProduct')
        checkOptionalGraphScope()
    }

    @Test
    void testBuildGraph_nodeScopePrompts_afterInvalidProductEntered()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User enters invalid XXXProduct. Reload.
        inputScopeInfo.scope.product = 'XXXProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check starting node scope prompt
        Map node = checkNodeBasics('XXXProduct', 'Product', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, DIFFERENT_VALUE_MUST_BE_PROVIDED, true)
        checkScopePromptTitle(node, 'product', true, 'rpm.scope.class.Product.traits')
        checkScopePromptDropdown(node, 'product', '', ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'pgm')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [product: 'XXXProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_graphScopePrompt_afterProductSelected_afterOptionalGraphScopeSelected_once()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User picks pgm = pgm1, state = OH and div = div1. Reload.
        inputScopeInfo.scope.pgm = 'pgm1'
        inputScopeInfo.scope.state = 'OH'
        inputScopeInfo.scope.div = 'div1'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [pgm: 'pgm1', state: 'OH', div: 'div1', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.displayScopeMessage
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkRequiredGraphScope('AProduct')
        checkOptionalGraphScope('AProduct', 'pgm1', 'OH', 'div1')
    }

    @Test
    void testBuildGraph_graphScopePrompt_afterProductSelected_afterOptionalGraphScopeSelected_twice()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User picks pgm = pgm1, state = OH and div = div1. Reload.
        inputScopeInfo.scope.pgm = 'pgm1'
        inputScopeInfo.scope.state = 'OH'
        inputScopeInfo.scope.div = 'div1'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User changes to div = div3. Reload.
        inputScopeInfo.scope.div = 'div3'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt - BCoverage no longer has missing required scope since div=div3, and as a result exposes a
        //new optional scope value for state (NM).
        Map expectedAvailableScope = [pgm: 'pgm1', state: 'OH', div: 'div3', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.displayScopeMessage
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkRequiredGraphScope('AProduct')
        checkOptionalGraphScope('AProduct', 'pgm1', 'OH', 'div3', true)
    }

    @Test
    void testBuildGraph_nodeScopePrompts_afterProductSelected_afterOptionalGraphScopeSelected_once()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User picks pgm = pgm1, state = OH and div = div1. Reload.
        inputScopeInfo.scope.pgm = 'pgm1'
        inputScopeInfo.scope.state = 'OH'
        inputScopeInfo.scope.div = 'div1'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product', '', '', false)
        checkNoScopePrompt(node)
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [state: 'OH', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has no scope prompts
        node = checkNodeBasics('ARisk', 'Risk', '', '', false)
        checkNoScopePrompt(node)
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', sourceFieldName: 'Risks', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [div: 'div1', state: 'OH', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has required scope prompt since requires pgm=pgm3
        node = checkNodeBasics('BRisk', 'Risk', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, DIFFERENT_VALUE_MUST_BE_PROVIDED, true)
        checkScopePromptTitle(node, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(node, 'pgm', '', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', sourceFieldName: 'Risks', risk: 'BRisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has no scope prompts
        node = checkNodeBasics('ACoverage', 'Coverage', '', '', false)
        checkNoScopePrompt(node)
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', coverage: 'ACoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [pgm: 'pgm1', div: 'div1', coverage: 'ACoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BCoverage has one required scope prompt since requires div=div3.
        node = checkNodeBasics('BCoverage', 'Coverage', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, DIFFERENT_VALUE_MUST_BE_PROVIDED, true)
        checkScopePromptTitle(node, 'div', true, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(node, 'div', '', ['div3'], ['div1', 'div2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'pgm')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', coverage: 'BCoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //CCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(node, 'state', 'OH', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'pgm')
        assert node.availableScope == [pgm: 'pgm1', div: 'div1', state: 'OH', sourceFieldName: 'Coverages', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [state: 'OH', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_nodeScopePrompts_afterProductSelected_afterOptionalGraphScopeSelected_twice()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScopeInfo.scope.product = 'AProduct'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User picks pgm = pgm1, state = OH and div = div1. Reload.
        inputScopeInfo.scope.pgm = 'pgm1'
        inputScopeInfo.scope.state = 'OH'
        inputScopeInfo.scope.div = 'div1'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)

        //User changes to div = div3. Reload.
        inputScopeInfo.scope.div = 'div3'
        options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo, visInfo: visInfo]
        buildGraph(options)
        assert 0 == messages.size()
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product', '', '', false)
        checkNoScopePrompt(node)
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [state: 'OH', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has default scope prompt since it doesn't have div3 as an optional scope value.
        node = checkNodeBasics('ARisk', 'Risk', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'div', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(node, 'div', 'div3', ['div1', DEFAULT], ['div2', 'div3'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'pgm')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', sourceFieldName: 'Risks', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [div: 'div3', state: 'OH', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has required scope prompt since requires pgm=pgm3
        node = checkNodeBasics('BRisk', 'Risk', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, DIFFERENT_VALUE_MUST_BE_PROVIDED, true)
        checkScopePromptTitle(node, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(node, 'pgm', '', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', sourceFieldName: 'Risks', risk: 'BRisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has required scope prompt since requires div1 or div2
        node = checkNodeBasics('ACoverage', 'Coverage', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, DIFFERENT_VALUE_MUST_BE_PROVIDED, true)
        checkScopePromptTitle(node, 'div', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(node, 'div', '', ['div1', 'div2'], ['div3', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'pgm')
        checkNoScopePrompt(node, 'state')
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', coverage: 'ACoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //BCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('BCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'state', false, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(node, 'state', 'OH', ['KY', 'IN', 'NY', DEFAULT], ['GA', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'pgm')
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', sourceFieldName: 'Coverages', coverage: 'BCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [div: 'div3', state: 'OH', coverage: 'BCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //CCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        checkScopePromptTitle(node, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(node, 'state', 'OH', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node, 'product')
        checkNoScopePrompt(node, 'div')
        checkNoScopePrompt(node, 'pgm')
        assert node.availableScope == [pgm: 'pgm1', div: 'div3', state: 'OH', sourceFieldName: 'Coverages', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [state: 'OH', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_graphScopePrompt_initial_nonEPM()
    {
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        assert nodes.size() == 4
        assert edges.size() == 3

        assert scopeInfo.scope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION]
        assert scopeInfo.displayScopeMessage
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkGraphScopeNonEPM()
    }

    @Test
    void testBuildGraph_nodeScopePrompt_initial_nonEPM()
    {
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        inputScopeInfo.scope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        assert nodes.size() == 4
        assert edges.size() == 3

        //partyrole.LossPrevention has no scope prompt
        Map node = checkNodeBasics('partyrole.LossPrevention', 'partyrole.LossPrevention', '', '', false)
        String nodeDetails = node.details as String
        checkNoScopePrompt(node)
        assert node.availableScope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        assert node.scope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_missingRequiredScope_nonEPM()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.class.party.ProfitCenter')
        try
        {
            //Change cube to have declared required scope
            cube.setMetaProperty('requiredScopeKeys', ['dummyRequiredScopeKey'])
            String startCubeName = 'rpm.class.partyrole.LossPrevention'
            inputScopeInfo.scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
            Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

            buildGraph(options)
            assert 0 == messages.size()
            String scopeMessage = scopeInfo.scopeMessage

            //Check graph scope prompt
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.dummyRequiredScopeKey.size()
            assert 1 == scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey.size()
            assert ['rpm.class.party.ProfitCenter'] as Set== scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey as Set
            assert scopeMessage.contains("""<input id="dummyRequiredScopeKey" value="" placeholder="Enter value..." class="scopeInput form-control" """)
            assert !scopeMessage.contains('<li id="dummyRequiredScopeKey"')

            //Check node scope prompt
            Map node = checkNodeBasics('party.ProfitCenter', 'party.ProfitCenter', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
            checkScopePromptTitle(node, 'dummyRequiredScopeKey', true, 'rpm.class.party.ProfitCenter')
            checkScopePromptDropdown(node, 'dummyRequiredScopeKey', '', [], [], ENTER_VALUE)
            assert node.scope == new CaseInsensitiveMap()
            assert node.availableScope == [sourceFieldName: 'Parties', _effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        }
        finally
        {
            //Reset cube
            cube.removeMetaProperty('requiredScopeKeys')
        }
    }

    @Test
    void testBuildGraph_missingDeclaredRequiredScope()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.class.Coverage')
        try
        {
            //Change cube to have declared required scope
            cube.setMetaProperty('requiredScopeKeys', ['dummyRequiredScopeKey'])
            Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                         product          : 'WProduct',
                         policyControlDate: '2017-01-01',
                         quoteDate        : '2017-01-01',
                         risk             : 'WProductOps']

            Map availableNodeScope = new CaseInsensitiveMap(scope)
            availableNodeScope.putAll([sourceFieldName: 'Coverages', risk: 'StateOps', sourceRisk: 'WProductOps', coverage: 'CCCoverage'])

            String startCubeName = 'rpm.class.Risk'
            inputScopeInfo.scope = new CaseInsensitiveMap(scope)
            Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]
            buildGraph(options)
            assert 0 == messages.size()
            String scopeMessage = scopeInfo.scopeMessage

            //Check graph scope prompt
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.dummyRequiredScopeKey.size()
            assert 1 == scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey.size()
            assert ['rpm.class.Coverage'] as Set== scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey as Set
            assert scopeMessage.contains("""<input id="dummyRequiredScopeKey" value="" placeholder="Enter value..." class="scopeInput form-control" """)
            assert !scopeMessage.contains('<li id="dummyRequiredScopeKey"')

            //Check node scope prompt
            Map node = checkNodeBasics('CCCoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
            checkScopePromptTitle(node, 'dummyRequiredScopeKey', true, 'rpm.class.Coverage')
            checkScopePromptDropdown(node, 'dummyRequiredScopeKey', '', [], [], ENTER_VALUE)
            assert node.scope == new CaseInsensitiveMap()
            assert node.availableScope == availableNodeScope
         }
        finally
        {
            //Reset cube
            cube.removeMetaProperty('requiredScopeKeys')
        }
    }

    @Test //TODO: check
    void testGetCellValues_classNode_showCellValues_unboundAxes()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     sourceCoverage   : 'FCoverage',
                     coverage         : 'CCCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'CCCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'CCCoverage',
                scope: nodeScope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: scope,
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        RpmVisualizerScopeInfo scopeInfo = new RpmVisualizerScopeInfo(appId)
        scopeInfo.appId = appId
        scopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set

        Map options = [node: oldNode, visInfo: visInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        Set<String> messages = visInfo.messages
        assert 0 == messages.size()
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        //TODO: Check scope

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node -> 'CCCoverage' == node.label}
        assert true == node.showCellValuesLink
        assert true == node.showCellValues
        assert true == node.cellValuesLoaded
        String nodeDetails = node.details as String
        checkUnboundAxesMessage_CCCoverage(nodeDetails)
        assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: None</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field1</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field1</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field2</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field2</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field3</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field3</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field4</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field4</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: CCCoverage</li><li>r:scopedName: CCCoverage</li></ul></pre><br><b>")
    }

    @Test //TODO: check
    void testGetCellValues_classNode_showCellValues_withMissingRequiredScope()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     sourceCoverage   : 'FCoverage',
                     coverage         : 'CCCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'CCCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'CCCoverage',
                scope: nodeScope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: scope,
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        RpmVisualizerScopeInfo scopeInfo = new RpmVisualizerScopeInfo(appId)
        scopeInfo.appId = appId
        scopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set

        Map options = [node: oldNode, visInfo: visInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        Set<String> messages = visInfo.messages
        assert 0 == messages.size()
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        //TODO: Check scope

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node -> 'CCCoverage' == node.label}
        assert true == node.showCellValuesLink
        assert true == node.showCellValues
        assert true == node.cellValuesLoaded
        String nodeDetails = node.details as String
        checkUnboundAxesMessage_CCCoverage(nodeDetails)
        assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: None</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field1</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field1</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field2</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field2</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field3</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field3</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field4</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field4</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: CCCoverage</li><li>r:scopedName: CCCoverage</li></ul></pre><br><b>")
    }

    @Test //TODO: check
    void testGetCellValues_classNode_showCellValues_withInvalidRequiredScope()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product          : 'WProduct',
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     sourceCoverage   : 'FCoverage',
                     coverage         : 'CCCoverage',
                     sourceFieldName  : 'Coverages',
                     risk             : 'WProductOps'] as CaseInsensitiveMap

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.remove('sourceFieldName')

        Map oldNode = [
                id: '4',
                cubeName: 'rpm.class.Coverage',
                fromFieldName: 'CCCoverage',
                title: 'rpm.class.Coverage',
                level: '3',
                label: 'CCCoverage',
                scope: nodeScope,
                showCellValues: true,
                showCellValuesLink: true,
                cellValuesLoaded: false,
                availableScope: scope,
                typesToAdd: [],
        ]

        RpmVisualizerInfo visInfo = new RpmVisualizerInfo(appId)
        RpmVisualizerScopeInfo scopeInfo = new RpmVisualizerScopeInfo(appId)
        scopeInfo.appId = appId
        scopeInfo.scope = scope
        visInfo.allGroupsKeys = ['PRODUCT', 'FORM', 'RISK', 'COVERAGE', 'CONTAINER', 'DEDUCTIBLE', 'LIMIT', 'RATE', 'RATEFACTOR', 'PREMIUM', 'PARTY', 'PLACE', 'ROLE', 'ROLEPLAYER', 'UNSPECIFIED'] as Set
        visInfo.groupSuffix = '_ENUM'
        visInfo.availableGroupsAllLevels = [] as Set

        Map options = [node: oldNode, visInfo: visInfo]

        Map graphInfo = visualizer.getCellValues(appId, options)
        assert STATUS_SUCCESS == graphInfo.status
        Set<String> messages = visInfo.messages
        assert 0 == messages.size()
        List<Map<String, Object>> nodes = visInfo.nodes as List
        List<Map<String, Object>> edges = visInfo.edges as List

        //TODO: Check scope

        assert nodes.size() == 1
        assert edges.size() == 0

        Map node = nodes.find { Map node -> 'CCCoverage' == node.label}
        assert true == node.showCellValuesLink
        assert true == node.showCellValues
        assert true == node.cellValuesLoaded
        String nodeDetails = node.details as String
        checkUnboundAxesMessage_CCCoverage(nodeDetails)
        assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
        assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: None</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field1</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field1</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field2</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field2</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field3</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field3</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field4</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field4</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: CCCoverage</li><li>r:scopedName: CCCoverage</li></ul></pre><br><b>")
    }

    @Test //TODO
    void testBuildGraph_unboundAxes()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product:'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     businessDivisionCode: 'bogusDIV']

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        String scopeMessage = scopeInfo.scopeMessage
        //TODO:
        //assert scopeMessage.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}the graph.")
        //assert scopeMessage.contains('<div id="businessDivisionCode" title="The default for businessDivisionCode was utilized on rpm.scope.enum.Risk.Risks.traits, rpm.scope.enum.Risk.Coverages.traits')
        // assert scopeMessage.contains("A different scope value may be supplied for businessDivisionCode:")
        //assert scopeMessage.contains('<option>Default (bogusDIV provided, but not found)</option>')
        assert scopeMessage.contains('<option id="businessDivisionCode: null">Default</option>')
        assert scopeMessage.contains('<option id="businessDivisionCode: AAADIV" >AAADIV</option>')
        assert scopeMessage.contains('<option id="businessDivisionCode: BBBDIV" >BBBDIV</option>')


        List<Map<String, Object>> nodes = visInfo.nodes as List

        Map node = nodes.find { Map node1 -> "${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Risks on WProductOps".toString() == node1.title}
        String nodeDetails = node.details as String
        //assert nodeDetails.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Risks on WProductOps.")
        //TODO:
        // assert nodeDetails.contains('<div id="businessDivisionCode" title="The default for businessDivisionCode was utilized on rpm.scope.enum.Risk.Risks.traits')
        // assert nodeDetails.contains("A different scope value may be supplied for businessDivisionCode:")
        // assert nodeDetails.contains('<option>Default (bogusDIV provided, but not found)</option>')
        assert nodeDetails.contains('<option id="businessDivisionCode: null">Default</option>')
        assert nodeDetails.contains('<option id="businessDivisionCode: AAADIV" >AAADIV</option>')
        assert nodeDetails.contains('<option id="businessDivisionCode: BBBDIV" >BBBDIV</option>')

    }

    @Test //TODO
    void testBuildGraph_unboundAxes_defaultIsOnlyValue()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product:'BProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01']

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        String scopeMessage = scopeInfo.scopeMessage
        assert scopeMessage.contains('Optional scope in graph')
        assert scopeMessage.contains('<option id="state: null">Default</option>')
        List<Map<String, Object>> nodes = (graphInfo.visInfo as RpmVisualizerInfo).nodes as List

        Map node = nodes.find { Map node1 -> 'DRisk' == node1.label}
        String nodeDetails = node.details as String
        //assert nodeDetails.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Coverages on WProductOps.")
        //TODO:
        // assert nodeDetails.contains('<div id="businessDivisionCode" title="The default for businessDivisionCode was utilized on rpm.scope.enum.Risk.Coverages.traits')
        //assert nodeDetails.contains("A different scope value may be supplied for businessDivisionCode:")
        //assert nodeDetails.contains('<option>Default (bogusDIV provided, but not found)</option>')
        // assert nodeDetails.contains('<option title="businessDivisionCode: AAADIV">AAADIV</option>')
        //assert !nodeDetails.contains('<option title="businessDivisionCode: BBBDIV">BBBDIV</option>')
        //assert nodeDetails.contains('<option title="businessDivisionCode: CCCDIV">CCCDIV</option>')
    }

    @Test  //TODO
    void testBuildGraph_unboundAxes_noUnboundAxis_withDerivedScopeKey_notTopNode()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     risk             : 'WProductOps']

        String startCubeName = 'rpm.class.Risk'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        String scopeMessage = scopeInfo.scopeMessage
        //TODO
        //assert scopeMessage.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}the graph.")
        assert !scopeMessage.contains('product')

        List<Map<String, Object>> nodes = visInfo.nodes as List
        Map node = nodes.find {Map node ->  'StateOps' == node.detailsTitle2}
        String nodeDetails = node.details as String
        //TODO
        assert !nodeDetails.contains('product')
    }

    @Test //TODO
    void testBuildGraph_unboundAxes_withDerivedScopeKey_topNode()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     sourceRisk       : 'WProductOps',
                     risk             : 'StateOps']

        String startCubeName = 'rpm.class.Risk'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        String scopeMessage = scopeInfo.scopeMessage
        //TODO
        //assert scopeMessage.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}the graph.")
        //assert scopeMessage.contains('<div id="product" title="The default for product was utilized on rpm.scope.class.Risk.traits.Coverages" class="input-group input-group-sm">')
        //assert scopeMessage.contains('A different scope value may be supplied for product:')
        //assert scopeMessage.contains('<option>Default (no value provided)</option>')
        assert scopeMessage.contains('WProduct')
        assert scopeMessage.contains('UProduct')
        assert scopeMessage.contains('GProduct')

        List<Map<String, Object>> nodes = visInfo.nodes as List
        Map node = nodes.find {Map node ->  'StateOps' == node.detailsTitle2}
        String nodeDetails = node.details as String
        //TODO:
        // assert nodeDetails.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}StateOps of type Risk.")
        //assert nodeDetails.contains('<div id="product" title="The default for product was utilized on rpm.scope.class.Risk.traits.Coverages" class="input-group input-group-sm">')
        //assert nodeDetails.contains('A different scope value may be supplied for product:')
        //assert nodeDetails.contains('<option>Default (no value provided)</option>')
        assert nodeDetails.contains('WProduct')
        assert nodeDetails.contains('UProduct')
        assert nodeDetails.contains('GProduct')
    }

    @Test //TODO
    void testBuildGraph_unboundAxes_withDerivedScopeKey_notTopNode()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     product          : 'WProduct',
                     risk             : 'WProductOps']

        String startCubeName = 'rpm.class.Risk'
        Map options = [startCubeName: startCubeName, scopeInfo: inputScopeInfo]

        buildGraph(options)
        assert 0 == messages.size()
        String message = scopeInfo.scopeMessage
        //TODO
        // assert message.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}the graph.")
        assert message.contains("businessDivisionCode")
        // assert !message.contains('product')

        List<Map<String, Object>> nodes = visInfo.nodes as List
        Map node = nodes.find {Map node ->  'StateOps' == node.detailsTitle2}
        String nodeDetails = node.details as String
        //TODO
        //assert !nodeDetails.contains('product')
    }

    //*************************************************************************************
    
    private void buildGraph(Map options)
    {
        visInfo?.nodes = []
        visInfo?.edges = []
        Map graphInfo = visualizer.buildGraph(appId, options)
        visInfo = graphInfo.visInfo as RpmVisualizerInfo
        scopeInfo = graphInfo.scopeInfo as RpmVisualizerScopeInfo
        messages = visInfo.messages
        nodes = visInfo.nodes as List
        edges = visInfo.edges as List
    }

    private void getCellValues(Map options)
    {
        visInfo?.nodes = []
        visInfo?.edges = []
        Map graphInfo = visualizer.getCellValues(appId, options)
        visInfo = graphInfo.visInfo as RpmVisualizerInfo
        scopeInfo = graphInfo.scopeInfo as RpmVisualizerScopeInfo
        messages = visInfo.messages
        nodes = visInfo.nodes as List
        edges = visInfo.edges as List
    }

    private void checkRequiredGraphScope(String selectedProductName = '')
    {
        Set<String> scopeKeys = ['policyControlDate', 'quoteDate', '_effectiveVersion', 'product'] as CaseInsensitiveSet
        Set<String> products = ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'] as CaseInsensitiveSet

        assert 4 == scopeInfo.requiredGraphScopeAvailableValues.keySet().size()
        assert scopeInfo.requiredGraphScopeAvailableValues.keySet().containsAll(scopeKeys)
        assert 0 == scopeInfo.requiredGraphScopeAvailableValues.policyControlDate.size()
        assert 0 == scopeInfo.requiredGraphScopeAvailableValues.quoteDate.size()
        assert 1 == scopeInfo.requiredGraphScopeAvailableValues._effectiveVersion.size()
        assert [ApplicationID.DEFAULT_VERSION] as Set == scopeInfo.requiredGraphScopeAvailableValues._effectiveVersion as Set
        assert 5 == scopeInfo.requiredGraphScopeAvailableValues.product.size()
        assert scopeInfo.requiredGraphScopeAvailableValues.product.containsAll(products)

        assert 4 == scopeInfo.requiredGraphScopeCubeNames.keySet().size()
        assert scopeInfo.requiredGraphScopeCubeNames.keySet().containsAll(scopeKeys)
        assert 0 == scopeInfo.requiredGraphScopeCubeNames.policyControlDate.size()
        assert 0 == scopeInfo.requiredGraphScopeCubeNames.quoteDate.size()
        assert 0 == scopeInfo.requiredGraphScopeCubeNames._effectiveVersion.size()
        assert 1 == scopeInfo.requiredGraphScopeCubeNames.product.size()
        assert ['rpm.scope.class.Product.traits'] as Set== scopeInfo.requiredGraphScopeCubeNames.product as Set

        String scopeMessage = scopeInfo.scopeMessage
        assert scopeMessage.contains(REQUIRED_SCOPE_TO_LOAD_GRAPH)
        assert scopeMessage.contains('title="policyControlDate is required to load the graph"')
        assert scopeMessage.contains('title="quoteDate is required to load the graph"')
        assert scopeMessage.contains('title="_effectiveVersion is required to load the graph"')
        assert scopeMessage.contains('title="product is required to load the graph"')
        assert scopeMessage.contains("""<input id="policyControlDate" value="${defaultScopeDate}" placeholder="Enter value..." class="scopeInput form-control" """)
        assert scopeMessage.contains("""<input id="quoteDate" value="${defaultScopeDate}" placeholder="Enter value..." class="scopeInput form-control" """)
        assert scopeMessage.contains("""<input id="_effectiveVersion" value="${ApplicationID.DEFAULT_VERSION}" placeholder="Select or enter value..." class="scopeInput form-control" """)
        assert scopeMessage.contains("""<input id="product" value="${selectedProductName}" placeholder="Select or enter value..." class="scopeInput form-control" """)
        assert scopeMessage.contains('<li id="product: AProduct" class="scopeClick"')
        assert scopeMessage.contains('<li id="product: BProduct" class="scopeClick"')
        assert scopeMessage.contains('<li id="product: GProduct" class="scopeClick"')
        assert scopeMessage.contains('<li id="product: UProduct" class="scopeClick"')
        assert scopeMessage.contains('<li id="product: WProduct" class="scopeClick"')
    }

    private void checkOptionalGraphScope(String selectedProductName = '', String selectedPgmName = '', String selectedStateName = 'Default', selectedDivName = 'Default', boolean includeStateNM = false)
    {
        Set<String> scopeKeys = ['pgm', 'state', 'div'] as CaseInsensitiveSet
        String scopeMessage = scopeInfo.scopeMessage

        if (selectedProductName)
        {
            assert scopeMessage.contains(OPTIONAL_SCOPE_IN_GRAPH)
            assert 3 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
            assert scopeInfo.optionalGraphScopeAvailableValues.keySet().containsAll(scopeKeys)
            assert 3 == scopeInfo.optionalGraphScopeAvailableValues.pgm.size()
            assert ['pgm1', 'pgm2', 'pgm3'] as Set == scopeInfo.optionalGraphScopeAvailableValues.pgm as Set
            if (includeStateNM)
            {
                assert 7 == scopeInfo.optionalGraphScopeAvailableValues.state.size()
                assert [null, 'KY', 'NY', 'OH', 'GA', 'IN', 'NM'] as Set == scopeInfo.optionalGraphScopeAvailableValues.state as Set
            }
            else{
                assert 6 == scopeInfo.optionalGraphScopeAvailableValues.state.size()
                assert [null, 'KY', 'NY', 'OH', 'GA', 'IN'] as Set == scopeInfo.optionalGraphScopeAvailableValues.state as Set
            }
            assert 4 == scopeInfo.optionalGraphScopeAvailableValues.div.size()
            assert [null, 'div1', 'div2', 'div3'] as Set == scopeInfo.optionalGraphScopeAvailableValues.div as Set

            assert 3 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
            assert scopeInfo.optionalGraphScopeCubeNames.keySet().containsAll(scopeKeys)
            assert 2 == scopeInfo.optionalGraphScopeCubeNames.pgm.size()
            assert ['rpm.scope.class.Risk.traits.fieldBRisk', 'rpm.scope.class.Coverage.traits.fieldACoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.pgm as Set
            if (includeStateNM)
            {
                assert 3 == scopeInfo.optionalGraphScopeCubeNames.state.size()
                assert ['rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldCCoverage', 'rpm.scope.class.Coverage.traits.fieldBCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.state as Set
            }
            else
            {
                assert 2 == scopeInfo.optionalGraphScopeCubeNames.state.size()
                assert ['rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldCCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.state as Set
            }

            assert 3 == scopeInfo.optionalGraphScopeCubeNames.div.size()
            assert ['rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldACoverage', 'rpm.scope.class.Coverage.traits.fieldBCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.div as Set

            assert scopeMessage.contains('title="pgm is optional to load the graph, but may be required for some nodes"')
            assert scopeMessage.contains('title="state is optional to load the graph, but may be required for some nodes"')
            assert scopeMessage.contains('title="div is optional to load the graph, but may be required for some nodes"')

            assert scopeMessage.contains("""<input id="div" value="${selectedDivName}" placeholder="Select or enter value..." class="scopeInput form-control" """)
            assert scopeMessage.contains('<li id="div: Default" class="scopeClick"')
            assert scopeMessage.contains('<li id="div: div1" class="scopeClick"')
            assert scopeMessage.contains('<li id="div: div2" class="scopeClick"')

            assert scopeMessage.contains("""<input id="state" value="${selectedStateName}" placeholder="Select or enter value..." class="scopeInput form-control" """)
            assert scopeMessage.contains('<li id="state: Default" class="scopeClick"')
            assert scopeMessage.contains('<li id="state: KY" class="scopeClick"')
            assert scopeMessage.contains('<li id="state: NY" class="scopeClick"')
            assert scopeMessage.contains('<li id="state: OH" class="scopeClick"')
            assert scopeMessage.contains('<li id="state: GA" class="scopeClick"')
            assert scopeMessage.contains('<li id="state: IN" class="scopeClick"')
            if (includeStateNM)
            {
                assert scopeMessage.contains('<li id="state: NM" class="scopeClick"')
            }
            else
            {
                assert !scopeMessage.contains('<li id="state: NM" class="scopeClick"')
            }

            assert scopeMessage.contains("""<input id="pgm" value="${selectedPgmName}" placeholder="Select or enter value..." class="scopeInput form-control" """)
            assert scopeMessage.contains('<li id="pgm: pgm1" class="scopeClick"')
            assert scopeMessage.contains('<li id="pgm: pgm2" class="scopeClick"')
            assert scopeMessage.contains('<li id="pgm: pgm3" class="scopeClick"')
        }
        else
        {
            assert scopeMessage.contains(NO_OPTIONAL_SCOPE_IN_GRAPH)
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
            assert 0 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
        }
    }

    private void checkGraphScopeNonEPM()
    {
        assert 1 == scopeInfo.requiredGraphScopeAvailableValues.keySet().size()
        assert scopeInfo.requiredGraphScopeAvailableValues.keySet().contains('_effectiveVersion')
        assert 1 == scopeInfo.requiredGraphScopeAvailableValues._effectiveVersion.size()
        assert [ApplicationID.DEFAULT_VERSION] as Set == scopeInfo.requiredGraphScopeAvailableValues._effectiveVersion as Set

        assert 1 == scopeInfo.requiredGraphScopeCubeNames.keySet().size()
        assert scopeInfo.requiredGraphScopeCubeNames.keySet().containsAll('_effectiveVersion')
        assert 0 == scopeInfo.requiredGraphScopeCubeNames._effectiveVersion.size()

        String scopeMessage = scopeInfo.scopeMessage
        assert scopeMessage.contains(REQUIRED_SCOPE_TO_LOAD_GRAPH)
        assert scopeMessage.contains('title="_effectiveVersion is required to load the graph"')
        assert scopeMessage.contains("""<input id="_effectiveVersion" value="${ApplicationID.DEFAULT_VERSION}" placeholder="Select or enter value..." class="scopeInput form-control" """)

        assert scopeMessage.contains(NO_OPTIONAL_SCOPE_IN_GRAPH)
        assert 0 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
        assert 0 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
    }

    private Map checkNodeBasics(String nodeName, String nodeType, String nodeNamePrefix, String nodeDetailsMessage, boolean missingRequired = false, boolean showCellValues = false)
    {
        Map node = nodes.find {Map node1 ->  "${nodeNamePrefix}${nodeName}".toString() == node1.label}
        checkNodeBasics(node, missingRequired, showCellValues)
        assert nodeType == node.title
        assert nodeType == node.detailsTitle1
        assert (node.details as String).contains(nodeDetailsMessage)
        if (nodeName == nodeType || missingRequired)  //No detailsTitle2 when missing required scope or a non-EPM class (i.e. nodeName equals nodeType)
        {
            assert null == node.detailsTitle2
        }
        else
        {
            assert nodeName == node.detailsTitle2
        }
        return node
    }

    private Map checkEnumNodeBasics(String nodeTitle, String nodeDetailsMessage, boolean missingRequired, boolean showCellValues = false)
    {
        Map node = nodes.find {Map node1 ->  nodeTitle == node1.title}
        checkNodeBasics(node, missingRequired, showCellValues)
        assert null == node.label
        assert nodeTitle == node.detailsTitle1
        assert null == node.detailsTitle2
        assert (node.details as String).contains(nodeDetailsMessage)
        return node
    }

    private void checkNodeBasics(Map node, boolean missingRequired = false, boolean showCellValues = false)
    {
        String nodeDetails = node.details as String
        if (missingRequired)
        {
            assert nodeDetails.contains("${UNABLE_TO_LOAD}fields and traits")
            assert false == node.showCellValuesLink
            assert false == node.cellValuesLoaded
            assert false == node.showCellValues
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
        else if (showCellValues)
        {
            assert !nodeDetails.contains(UNABLE_TO_LOAD)
            assert true == node.showCellValuesLink
            assert true == node.cellValuesLoaded
            assert true == node.showCellValues
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
        else
        {
            assert !nodeDetails.contains(UNABLE_TO_LOAD)
            assert true == node.showCellValuesLink
            assert true == node.cellValuesLoaded
            assert false == node.showCellValues
            assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_FIELDS)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
    }

    private static void checkScopePromptTitle(Map node, String scopeKey, boolean required, String cubeNames)
    {
        String nodeDetails = node.details as String
        if (required)
        {
            if (cubeNames)
            {
                assert nodeDetails.contains("""title="${scopeKey} is required by ${cubeNames} to load this node""")
            }
            else
            {
                assert nodeDetails.contains("""title="${scopeKey} is required to load the graph""")
            }
        }
        else
        {
            if (cubeNames)
            {
                assert nodeDetails.contains("""title="${scopeKey} is optional to load this node. Used on:""")
                assert nodeDetails.contains(cubeNames)
            }
            else
            {
                assert nodeDetails.contains("""title="${scopeKey} is optional to load the graph, but may be required for some nodes""")
            }
        }
    }

    private static void checkScopePromptDropdown(Map node, String scopeKey, String selectedScopeValue, List<String> availableScopeValues, List<String> unavailableScopeValues, String placeHolder)
    {
        String nodeDetails = node.details as String
        assert nodeDetails.contains("""<input id="${scopeKey}" value="${selectedScopeValue}" placeholder="${placeHolder}" class="scopeInput form-control" """)
        if (!availableScopeValues && !unavailableScopeValues)
        {
            assert !nodeDetails.contains("""<li id=""")
            return
        }

        availableScopeValues.each{String scopeValue ->
            assert nodeDetails.contains("""<li id="${scopeKey}: ${scopeValue}" class="scopeClick" """)
        }
        unavailableScopeValues.each{String scopeValue ->
            assert !nodeDetails.contains("""<li id="${scopeKey}: ${scopeValue}" class="scopeClick" """)
        }
    }

    private static void checkNoScopePrompt(Map node, String scopeKey = '')
    {
        String nodeDetails = node.details as String
        assert !nodeDetails.contains("""title="${scopeKey}""")
        assert !nodeDetails.contains("""<input id="${scopeKey}""")
        assert !nodeDetails.contains("""<li id="${scopeKey}""")
    }

    private static void checkUnboundAxesMessage_CCCoverage(String message)
    {
        //TODO:
        //assert message.contains("${OPTIONAL_SCOPE_AVAILABLE_TO_LOAD}CCCoverage of type Coverage.")

        //assert message.contains("${ADD_SCOPE_VALUE_FOR_OPTIONAL_KEY}businessDivisionCode")
        assert message.contains('AAADIV')
        assert message.contains('BBBDIV')

        //assert message.contains("${ADD_SCOPE_VALUE_FOR_OPTIONAL_KEY}program")
        assert message.contains('program1')
        assert message.contains('program2')
        assert message.contains('program3')

        // assert message.contains("${ADD_SCOPE_VALUE_FOR_OPTIONAL_KEY}type")
        assert message.contains('type1')
        assert message.contains('type2')
        assert message.contains('type3')
        assert message.contains('typeA')
        assert message.contains('typeB')

        // assert message.contains('<option>Default (no value provided)</option>')
    }

    private static void checkExceptionMessage(String message)
    {
        assert message.contains("An exception was thrown while loading this node.")
        assert message.contains(DETAILS_LABEL_MESSAGE)
        assert message.contains(DETAILS_LABEL_ROOT_CAUSE)
        assert message.contains('java.lang.ArithmeticException: Division by zero')
        assert message.contains(DETAILS_LABEL_STACK_TRACE)
    }

    private checkValidRpmClass( String startCubeName)
    {
        assert nodes.size() == 1
        assert edges.size() == 0
        Map node = nodes.find { startCubeName == (it as Map).cubeName}
        assert 'ValidRpmClass' == node.title
        assert 'ValidRpmClass' == node.detailsTitle1
        assert null == node.detailsTitle2
        assert 'ValidRpmClass' == node.label
        assert  null == node.typesToAdd
        assert UNSPECIFIED == node.group
        assert null == node.fromFieldName
        assert '1' ==  node.level
        assert scopeInfo.scope == node.scope
        String nodeDetails = node.details as String
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_ALL_TRAITS)
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}</b><pre><ul></ul></pre>")
        assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
        assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
    }

    private NCube createNCubeWithValidRpmClass(String cubeName)
    {
        NCube cube = new NCube(cubeName)
        cube.applicationID = appId
        String axisName = AXIS_FIELD
        cube.addAxis(new Axis(axisName, AxisType.DISCRETE, AxisValueType.STRING, false, Axis.SORTED, 1))
        cube.addColumn(axisName, CLASS_TRAITS)
        axisName = AXIS_TRAIT
        cube.addAxis(new Axis(axisName, AxisType.DISCRETE, AxisValueType.STRING, false, Axis.SORTED, 2))
        cube.addColumn(axisName, R_EXISTS)
        cube.addColumn(axisName, R_RPM_TYPE)
        NCubeManager.addCube(cube.applicationID, cube)
        return cube
    }
}
