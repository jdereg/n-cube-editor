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
    static final String DETAILS_LABEL_UTILIZED_SCOPE_WITH_TRAITS = 'Utilized scope with traits'
    static final String DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_TRAITS = 'Utilized scope with no traits'
    static final String DETAILS_LABEL_FIELDS = 'Fields</b>'
    static final String DETAILS_LABEL_FIELDS_AND_TRAITS = 'Fields and traits'
    static final String DETAILS_LABEL_CLASS_TRAITS = 'Class traits'
    static final String VALID_VALUES_FOR_FIELD_SENTENCE_CASE = 'Valid values for field '
    static final String VALID_VALUES_FOR_FIELD_LOWER_CASE = 'valid values for field '
    static final String ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS = 'Additional scope used to load traits for this class'

    static final String defaultScopeDate = DATE_TIME_FORMAT.format(new Date())

    RpmVisualizer visualizer
    Map inputScope
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
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
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
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     coverage: 'CCCoverage'] as CaseInsensitiveMap

        inputScope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        Map node = checkNodeBasics('Location', 'Risk', UNABLE_TO_LOAD, 'Coverage points directly to Risk via field Location, but there is no risk named Location on Risk.', true)
        checkNoScopePrompt(node.details as String)
        Map availableScope = new CaseInsensitiveMap(scope)
        availableScope.putAll([risk: 'Location'])
        assert node.availableScope == availableScope
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_checkNodeAndEdge_nonEPM()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //Top level source node
        Map node = checkNodeBasics('partyrole.LossPrevention', 'partyrole.LossPrevention')
        assert null == node.fromFieldName
        assert 'UNSPECIFIED' == node.group
        assert '1' == node.level
        assert null == node.sourceCubeName
        assert null == node.sourceDescription
        assert null == node.typesToAdd
        assert scope == node.scope
        assert scope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>roleRefCode</li><li>Parties</li></ul></pre>")

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
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>party.MoreNamedInsured</li><li>party.ProfitCenter</li></ul></pre>")

        //Edge from enum to target node
        edge = edges.find { Map edge1 -> 'partyrole.BasePartyRole.Parties' == edge1.fromName && 'party.ProfitCenter' == edge1.toName}
        assert 'party.ProfitCenter' == edge.fromFieldName
        assert '3' == edge.level
        assert !edge.label
        assert 'Valid value party.ProfitCenter cardinality 0:1' == edge.title

        //Target node under enum
        node = checkNodeBasics('party.ProfitCenter', 'party.ProfitCenter')
        assert 'party.ProfitCenter' == node.fromFieldName
        assert 'PARTY' == node.group
        assert '3' == node.level
        assert 'rpm.enum.partyrole.BasePartyRole.Parties' == node.sourceCubeName
        assert 'partyrole.BasePartyRole.Parties' == node.sourceDescription
        assert  [] == node.typesToAdd
        assert scope == node.scope
        assert [_effectiveVersion: ApplicationID.DEFAULT_VERSION, sourceFieldName: 'Parties'] == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>roleRefCode</li><li>fullName</li><li>fein</li></ul></pre>")
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
        inputScope = new CaseInsensitiveMap(scope)

        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]

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
        inputScope = new CaseInsensitiveMap(scope)

        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        Map options = [startCubeName: startCubeName, scope: inputScope]

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
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map enumScope = new CaseInsensitiveMap(scope)
        enumScope.sourceFieldName = 'Coverages'

        Map cCoverageScope = new CaseInsensitiveMap(scope)
        cCoverageScope.coverage = 'CCCoverage'
        cCoverageScope.sourceCoverage = 'FCoverage'

        Map availableCCCoverageScope = new CaseInsensitiveMap(cCoverageScope)
        availableCCCoverageScope.sourceFieldName = 'Coverages'

        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //Top level source node
        Map node = checkNodeBasics('FCoverage', 'Coverage')
        assert 'rpm.class.Coverage' == node.cubeName
        assert null == node.fromFieldName
        assert 'COVERAGE' == node.group
        assert '1' == node.level
        assert null == node.sourceCubeName
        assert null == node.sourceDescription
        assert ['Coverage', 'Deductible', 'Limit', 'Premium', 'Rate', 'Ratefactor', 'Role'] == node.typesToAdd
        assert scope == node.scope
        assert scope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>Coverages</li><li>Exposure</li><li>StatCode</li></ul></pre>")

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
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>CCCoverage</li><li>ICoverage</li></ul></pre>")

        //Edge from enum to target node
        edge = edges.find { Map edge1 -> 'Coverage.Coverages' == edge1.fromName && 'CCCoverage' == edge1.toName}
        assert 'CCCoverage' == edge.fromFieldName
        assert '3' == edge.level
        assert !edge.label
        assert "Valid value CCCoverage cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Target node of top level node
        node = checkNodeBasics('CCCoverage', 'Coverage')
        assert 'rpm.class.Coverage' == node.cubeName
        assert 'CCCoverage' == node.fromFieldName
        assert 'COVERAGE' == node.group
        assert '3' == node.level
        assert 'rpm.enum.Coverage.Coverages' == node.sourceCubeName
        assert 'field Coverages on FCoverage' == node.sourceDescription
        assert ['Coverage', 'Deductible', 'Limit', 'Premium', 'Rate', 'Ratefactor', 'Role'] == node.typesToAdd
        assert cCoverageScope == node.scope
        assert availableCCCoverageScope == node.availableScope
        assert (node.details as String).contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>Exposure</li><li>Location</li><li>StatCode</li><li>field1</li><li>field2</li><li>field3</li><li>field4</li></ul></pre>")
    }

    @Test
    void testGetCellValues_classNode_show()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'CCCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNodeBasics('CCCoverage', 'Coverage')
        assert scope == node.scope
        assert scope == node.availableScope
        assert scope == scopeInfo.scope

        //Simulate that the user clicks Show Traits for the node. Optional scope prompts display.
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNodeBasics('CCCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        assert scope == node.scope
        assert scope == node.availableScope
        assert scope == scopeInfo.scope
        String nodeDetails = node.details as String
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: None</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre>")
        assert nodeDetails.contains("field1</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field1</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field2</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field2</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field3</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field3</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre><li><b>")
        assert nodeDetails.contains("field4</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: DEI default for field4</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: CCCoverage</li><li>r:scopedName: CCCoverage</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_classNode_show_unboundAxes_changeToNonDefault()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'CCCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map expectedNodeScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert nodes.size() == 2
        Map node = checkNodeBasics('CCCoverage', 'Coverage')
        checkNoScopePrompt(node.details as String)

        //Simulate that the user clicks Show Traits for the node
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1

        node = checkNodeBasics('CCCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'businessDivisionCode', false, '  - rpm.scope.class.Coverage.traits.StatCode\n  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'businessDivisionCode', 'Default', ['AAADIV', 'BBBDIV', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)

        checkScopePromptTitle(nodeDetails, 'program', false, '  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'program', 'Default', ['program1', 'program2', 'program3', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)

        checkScopePromptTitle(nodeDetails, 'type', false, '  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field3CovC\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'type', 'Default', ['type1', 'type2', 'type3', 'typeA', 'typeB', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)

        assert node.availableScope == scope
        assert node.scope == scope

        //Simulate that the user picks businessDivisionCode = AAADIV
        expectedNodeScope.businessDivisionCode = 'AAADIV'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.businessDivisionCode = 'AAADIV'
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        node = checkNodeBasics('CCCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        assert nodes.size() == 1
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'businessDivisionCode', false, '  - rpm.scope.class.Coverage.traits.StatCode\n  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'businessDivisionCode', 'AAADIV', ['AAADIV', 'BBBDIV', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)
        checkScopePromptTitle(nodeDetails, 'program', false, '  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'program', 'Default', ['program1', 'program2', 'program3', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)
        checkScopePromptTitle(nodeDetails, 'type', false, '  - rpm.scope.class.Coverage.traits.field1And2\n  - rpm.scope.class.Coverage.traits.field3CovC\n  - rpm.scope.class.Coverage.traits.field4')
        checkScopePromptDropdown(nodeDetails, 'type', 'Default', ['type1', 'type2', 'type3', 'typeA', 'typeB', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)
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
    void testGetCellValues_classNode_show_URLs()
    {
        String httpsURL = 'https://mail.google.com'
        String fileURL = 'file:///C:/Users/bheekin/Desktop/honey%20badger%20thumbs%20up.jpg'
        String httpURL = 'http://www.google.com'
        String fileLink = """<a href="#" onclick='window.open("${fileURL}");return false;'>${fileURL}</a>"""
        String httpsLink = """<a href="#" onclick='window.open("${httpsURL}");return false;'>${httpsURL}</a>"""
        String httpLink = """<a href="#" onclick='window.open("${httpURL}");return false;'>${httpURL}</a>"""

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'AdmCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        Map node = checkNodeBasics('AdmCoverage', 'Coverage')
        assert scope == node.scope
        assert scope == node.availableScope

        //Simulate that the user clicks Show Traits for the node.
        //An optional scope prompt for business division code shows.
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)

        //Simulate that the user picks businessDivisionCode = AAADIV
        Map expectedNodeScope =  inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        expectedNodeScope.businessDivisionCode = 'AAADIV'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.businessDivisionCode = 'AAADIV'
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        node = checkNodeBasics('AdmCoverage', 'Coverage', '', '', false, true)
        assert nodes.size() == 1
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'businessDivisionCode', false, 'rpm.scope.class.Coverage.traits.StatCode')
        checkScopePromptDropdown(nodeDetails, 'businessDivisionCode', 'AAADIV', ['AAADIV', 'BBBDIV', DEFAULT], [], SELECT_OR_ENTER_VALUE, true)
        assert nodeDetails.contains("Exposure</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${fileLink}</li><li>r:exists: true</li><li>r:extends: DataElementInventory</li><li>r:rpmType: string</li></ul></pre>")
        assert nodeDetails.contains("Location</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${httpLink}</li><li>r:exists: true</li><li>r:rpmType: Risk</li><li>v:max: 1</li><li>v:min: 0</li></ul></pre><li><b>")
        assert nodeDetails.contains("StatCode</b></li><pre><ul><li>r:declared: true</li><li>r:defaultValue: ${httpsLink}</li><li>r:exists: true</li><li>r:extends: DataElementInventory[StatCode]</li><li>r:rpmType: string</li></ul></pre></ul></pre>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li><li>r:name: AdmCoverage</li><li>r:scopedName: AdmCoverage</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_enumNode_show()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'FCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)
        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.sourceFieldName = 'Coverages'

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert nodes.size() == 5
        Map node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage")

        //Simulate that the user clicks Show Traits for the node
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1

        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Coverages on FCoverage", '', false, true)
        assert nodeScope == node.scope
        assert nodeScope == node.availableScope
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS_AND_TRAITS}</b><pre><ul><li><b>CCCoverage</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:name: CCCoverage</li><li>v:max: 999999</li><li>v:min: 0</li></ul></pre><li><b>ICoverage</b></li><pre><ul><li>r:declared: true</li><li>r:exists: true</li><li>r:name: ICoverage</li><li>v:max: 1</li><li>v:min: 0</li></ul>")
        assert nodeDetails.contains("${DETAILS_LABEL_CLASS_TRAITS}</b><pre><ul><li>r:exists: true</li></ul></pre><br><b>")
    }

    @Test
    void testGetCellValues_classNode_hide()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'TCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map expectedNodeScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert nodes.size() == 1
        Map node = checkNodeBasics('TCoverage', 'Coverage')

        //Simulate that the user clicks Show Traits for the node.
        //Required node scope prompt now shows for points.
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_REQUIRED, true, true)

        //Simulate that the user picks points = A in the node scope prompt. Node scope contains points.
        expectedNodeScope.points = 'A'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.points = 'A'
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope

        //Simulate that the user clicks Hide Traits for the node.
        //No scope prompts show for the node and no traits show. Node scope has been reset.
        node.showCellValues = false
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        assert nodes.size() == 1
        node = checkNodeBasics('TCoverage', 'Coverage')
        checkNoScopePrompt(node.details as String)
        assert scope == node.scope
        assert scope == node.availableScope
        assert scope == scopeInfo.scope
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
            inputScope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
            String startCubeName = 'rpm.class.partyrole.LossPrevention'
            Map options = [startCubeName: startCubeName, scope: inputScope]

            buildGraph(options, true)
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
        inputScope = scope
        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li><li>fieldObsolete101</li></ul></pre>")
    }

    @Test
    void testBuildGraph_effectiveVersionApplied_beforeFieldAddAfterFieldObsolete()
    {
        Map scope = [product: 'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     _effectiveVersion: '1.0.1'] as CaseInsensitiveMap
        inputScope = scope

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li></ul></pre>")
    }

    @Test
    void testBuildGraph_effectiveVersionApplied_afterFieldAddAndObsolete()
    {
        Map scope = [product: 'WProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01',
                     _effectiveVersion: '1.0.2'] as CaseInsensitiveMap
        inputScope = scope

        String startCubeName = 'rpm.class.Product'
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)

        Map node = nodes.find { Map node1 -> 'WProduct' == node1.label}
        String nodeDetails = node.details as String
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}<pre><ul><li>CurrentCommission</li><li>CurrentExposure</li><li>Risks</li><li>fieldAdded102</li></ul></pre>")
    }

    @Test
    void testBuildGraph_validRpmClass()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)

        checkValidRpmClass( startCubeName)
    }

    @Test
    void testBuildGraph_validRpmClass_notStartWithRpmClass()
    {
        String startCubeName = 'rpm.klutz.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options, true)
        assert 1 == messages.size()
        String message = messages.first()
        assert "Starting cube for visualization must begin with 'rpm.class', n-cube ${startCubeName} does not.".toString() == message
    }

    @Test
    void testBuildGraph_validRpmClass_startCubeNotFound()
    {
        String startCubeName = 'ValidRpmClass'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options, true)
        assert 1 == messages.size()
        String message = messages.first()
        assert "No cube exists with name of ${startCubeName} for application id ${appId.toString()}".toString() == message
    }

    @Test
    void testBuildGraph_validRpmClass_noTraitAxis()
    {
        String startCubeName = 'rpm.class.ValidRpmClass'
        createNCubeWithValidRpmClass(startCubeName)
        NCube cube = NCubeManager.getCube(appId, startCubeName)
        cube.deleteAxis(AXIS_TRAIT)

        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options, true)
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
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options, true)
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
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

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
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

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
        inputScope = scope
        Map options = [startCubeName: startCubeName, scope: inputScope]

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
        inputScope = scope

        String startCubeName = 'rpm.class.Coverage'
        VisualizerInfo notRpmVisInfo = new VisualizerInfo()
        notRpmVisInfo.groupSuffix = 'shouldGetReset'

        Map options = [startCubeName: startCubeName, scope: inputScope, visInfo: notRpmVisInfo]

        buildGraph(options)

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
            inputScope = scope

            String startCubeName = 'rpm.class.Product'
            Map options = [startCubeName: startCubeName, scope: inputScope]
            buildGraph(options)

            Map node = checkNodeBasics('FCoverage', 'Coverage', UNABLE_TO_LOAD, 'Unable to load the class due to an exception.', true)
            String nodeDetails = node.details as String
            assert nodeDetails.contains(DETAILS_LABEL_MESSAGE)
            assert nodeDetails.contains(DETAILS_LABEL_ROOT_CAUSE)
            assert nodeDetails.contains('java.lang.ArithmeticException: Division by zero')
            assert nodeDetails.contains(DETAILS_LABEL_STACK_TRACE)
        }
        finally
        {
            //Reset cube
            cube.setCell(new GroovyExpression('true', null, false), coordinate)
        }
    }

    @Test
    void testBuildGraph_scopePrompt_graph_initial()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkTopNodeScope()
        checkOptionalGraphScope()
    }

    @Test
    void testBuildGraph_scopePrompt_nodes_initial()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check starting node scope prompt
        Map node = checkNodeBasics('Product', 'Product', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'product', true, 'rpm.scope.class.Product.traits')
        checkScopePromptDropdown(nodeDetails, 'product', '', ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        assert node.availableScope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_scopePrompt_graph_afterProductSelected()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScope.product = 'AProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkTopNodeScope('AProduct')
        checkOptionalGraphScope('AProduct')
    }

    @Test
    void testBuildGraph_scopePrompt_nodes_afterProductSelected()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScope.product = 'AProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product')
        checkNoScopePrompt(node.details as String)
        assert node.availableScope == [product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //Product.Risks enum has one default scope prompt, no required prompts
        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Risks on AProduct", '', false)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', false, 'rpm.scope.enum.Product.Risks.traits.exists')
        checkScopePromptDropdown(nodeDetails, 'div', DEFAULT, ['div1', 'div2', DEFAULT], ['div3'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'state')
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.availableScope == [sourceFieldName: 'Risks', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [sourceFieldName: 'Risks', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has two default scope prompts, no required prompts
        node = checkNodeBasics('ARisk', 'Risk', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(nodeDetails, 'div', DEFAULT, ['div1', DEFAULT], ['div2', 'div3'], SELECT_OR_ENTER_VALUE)
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(nodeDetails, 'state', DEFAULT, ['KY', 'NY', 'OH', DEFAULT], ['IN', 'GA'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.availableScope == [sourceFieldName: 'Risks', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has one required scope prompt, no default prompts
        node = checkNodeBasics('BRisk', 'Risk', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(nodeDetails, 'pgm', '', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.availableScope == [sourceFieldName: 'Risks', risk: 'BRisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has two required scope prompts, no default prompts
        node = checkNodeBasics('ACoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(nodeDetails, 'div', '', ['div1', 'div2'], [DEFAULT, 'div3'], SELECT_OR_ENTER_VALUE)
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(nodeDetails, 'pgm', '', ['pgm1', 'pgm2', 'pgm3'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.availableScope == [coverage: 'ACoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //BCoverage has one required scope prompt, one default scope prompt. The default scope prompt doesn't show yet since
        //there is currently a required scope prompt for the node.
        node = checkNodeBasics('BCoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', true, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(nodeDetails, 'div', '', ['div3'], ['div1', 'div2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.availableScope == [coverage: 'BCoverage', sourceFieldName: 'Coverages', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()

        //CCoverage has one default scope prompt, no required prompts
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(nodeDetails, 'state', 'Default', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.availableScope == [sourceFieldName: 'Coverages', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == [coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_scopePrompt_graph_afterInvalidProductEntered()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User enters invalid XXXProduct. Reload.
        inputScope.product = 'XXXProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check graph scope prompt
        checkTopNodeScope('XXXProduct')
        checkOptionalGraphScope()
    }

    @Test
    void testBuildGraph_scopePrompt_nodes_afterInvalidProductEntered()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User enters invalid XXXProduct. Reload.
        inputScope.product = 'XXXProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //Check starting node scope prompt
        Map node = checkNodeBasics('XXXProduct', 'Product', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, IS_NOT_VALID_FOR, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'product', true, 'rpm.scope.class.Product.traits')
        checkScopePromptDropdown(nodeDetails, 'product', 'XXXProduct', ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'pgm')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.availableScope == [product: 'XXXProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_scopePrompt_graph_afterProductSelected_afterOptionalGraphScopeSelected()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()
        assert 0 == edges.size()

        //User picks AProduct. Reload.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.product = 'AProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //User picks pgm = pgm1, state = OH and div = div1. Reload after each.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.pgm = 'pgm1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.state = 'OH'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.div = 'div1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt
        Map expectedAvailableScope = [pgm: 'pgm1', state: 'OH', div: 'div1', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkTopNodeScope('AProduct')
        checkOptionalGraphScope('AProduct', 'pgm1', 'OH', 'div1')

        //User changes to div = div3. Reload.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.div = 'div3'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //Check graph scope prompt - BCoverage no longer has missing required scope since div=div3, and as a result exposes a
        //new optional scope value for state (NM).
        expectedAvailableScope = [pgm: 'pgm1', state: 'OH', div: 'div3', product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
        assert scopeInfo.scope == expectedAvailableScope
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkTopNodeScope('AProduct')
        checkOptionalGraphScope('AProduct', 'pgm1', 'OH', 'div3', true)
    }


    @Test
    void testBuildGraph_scopePrompt_nodes_afterProductSelected_afterOptionalGraphScopeSelected_once()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScope.product = 'AProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //User picks pgm = pgm1, state = OH and div = div1. Reload after each.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.pgm = 'pgm1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.state = 'OH'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.div = 'div1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product')
        checkNoScopePrompt(node.details as String)
        assert node.scope == [product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //Product.Risks enum has no scope prompt
        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Risks on AProduct", '', false)
        checkNoScopePrompt(node.details as String)
        assert node.scope == [div: 'div1', sourceFieldName: 'Risks', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has no scope prompts
        node = checkNodeBasics('ARisk', 'Risk')
        checkNoScopePrompt(node.details as String)
        assert node.scope == [div: 'div1', state: 'OH', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has required scope prompt since requires pgm=pgm3
        node = checkNodeBasics('BRisk', 'Risk', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, IS_NOT_VALID_FOR, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(nodeDetails, 'pgm', 'pgm1', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has no scope prompts
        node = checkNodeBasics('ACoverage', 'Coverage')
        checkNoScopePrompt(node.details as String)
        assert node.scope == [pgm: 'pgm1', div: 'div1', coverage: 'ACoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BCoverage has one required scope prompt since requires div=div3.
        node = checkNodeBasics('BCoverage', 'Coverage', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, IS_NOT_VALID_FOR, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', true, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(nodeDetails, 'div', 'div1', ['div3'], ['div1', 'div2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.scope == new CaseInsensitiveMap()

        //CCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(nodeDetails, 'state', 'OH', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.scope == [state: 'OH', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_scopePrompt_nodes_afterProductSelected_afterOptionalGraphScopeSelected_twice()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //User picks AProduct. Reload.
        inputScope.product = 'AProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //User picks pgm = pgm1, state = OH and div = div1. Reload after each.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.pgm = 'pgm1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.state = 'OH'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.div = 'div1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)

        //User changes to div = div3. Reload.
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.div = 'div3'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 8 == nodes.size()
        assert 7 == edges.size()

        //AProduct has no scope prompt
        Map node = checkNodeBasics('AProduct', 'Product')
        checkNoScopePrompt(node.details as String)
        assert node.scope == [ product: 'AProduct',_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //Product.Risks has default scope prompt since it doesn't have div3 as an optional scope value.
        node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Risks on AProduct", '', false)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', false, 'rpm.scope.enum.Product.Risks.traits.exists')
        checkScopePromptDropdown(nodeDetails, 'div', 'div3', ['div1', 'div2', DEFAULT], ['div3'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'state')
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.scope == [div: 'div3', sourceFieldName: 'Risks', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap

        //ARisk has default scope prompt since it doesn't have div3 as an optional scope value.
        node = checkNodeBasics('ARisk', 'Risk', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', false, 'rpm.scope.class.Risk.traits.fieldARisk')
        checkScopePromptDropdown(nodeDetails, 'div', 'div3', ['div1', DEFAULT], ['div2', 'div3'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.scope == [div: 'div3', state: 'OH', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //BRisk has required scope prompt since requires pgm=pgm3
        node = checkNodeBasics('BRisk', 'Risk', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, IS_NOT_VALID_FOR, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.class.Risk.traits.fieldBRisk')
        checkScopePromptDropdown(nodeDetails, 'pgm', 'pgm1', ['pgm3'], ['pgm1', 'pgm2', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.scope == new CaseInsensitiveMap()

        //ACoverage has required scope prompt since requires div1 or div2
        node = checkNodeBasics('ACoverage', 'Coverage', REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR, IS_NOT_VALID_FOR, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'div', true, 'rpm.scope.class.Coverage.traits.fieldACoverage')
        checkScopePromptDropdown(nodeDetails, 'div', 'div3', ['div1', 'div2'], ['div3', DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'pgm')
        checkNoScopePrompt(node.details as String, 'state')
        assert node.scope == new CaseInsensitiveMap()

        //BCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('BCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Coverage.traits.fieldBCoverage')
        checkScopePromptDropdown(nodeDetails, 'state', 'OH', ['KY', 'IN', 'NY', DEFAULT], ['GA', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.scope == [div: 'div3', state: 'OH', coverage: 'BCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap

        //CCoverage has one default scope prompt since it doesn't have OH as an optional scope value.
        node = checkNodeBasics('CCoverage', 'Coverage', '', DEFAULTS_WERE_USED, false)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Coverage.traits.fieldCCoverage')
        checkScopePromptDropdown(nodeDetails, 'state', 'OH', ['GA', 'IN', 'NY', DEFAULT], ['KY', 'OH'], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'product')
        checkNoScopePrompt(node.details as String, 'div')
        checkNoScopePrompt(node.details as String, 'pgm')
        assert node.scope == [state: 'OH', coverage: 'CCoverage', risk: 'ARisk', product: 'AProduct', _effectiveVersion: ApplicationID.DEFAULT_VERSION, policyControlDate: defaultScopeDate, quoteDate: defaultScopeDate] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_scopePrompt_graph_initial_nonEPM()
    {
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)
        assert nodes.size() == 4
        assert edges.size() == 3

        assert scopeInfo.scope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION]
        assert scopeInfo.scopeMessage.contains('Reset scope')
        checkGraphScopeNonEPM()
    }

    @Test
    void testBuildGraph_scopePrompt_nodes_initial_nonEPM()
    {
        String startCubeName = 'rpm.class.partyrole.LossPrevention'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]

        buildGraph(options)
        assert nodes.size() == 4
        assert edges.size() == 3

        //partyrole.LossPrevention has no scope prompt
        Map node = checkNodeBasics('partyrole.LossPrevention', 'partyrole.LossPrevention')
        checkNoScopePrompt(node.details as String)
        assert node.availableScope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
        assert node.scope == [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
    }

    @Test
    void testBuildGraph_scopePrompt_missingRequiredScope_nonEPM()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.class.party.ProfitCenter')
        try
        {
            //Change cube to have declared required scope
            cube.setMetaProperty('requiredScopeKeys', ['dummyRequiredScopeKey'])
            String startCubeName = 'rpm.class.partyrole.LossPrevention'
            inputScope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION] as CaseInsensitiveMap
            Map options = [startCubeName: startCubeName, scope: inputScope]

            buildGraph(options)
            String scopeMessage = scopeInfo.scopeMessage

            //Check graph scope prompt
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.dummyRequiredScopeKey.size()
            assert 1 == scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey.size()
            assert ['rpm.class.party.ProfitCenter'] as Set== scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey as Set
            assert scopeMessage.contains("""<input id="dummyRequiredScopeKey" value="" placeholder="Enter value..." class="scopeInput form-control " """)
            assert !scopeMessage.contains('<li id="dummyRequiredScopeKey"')

            //Check node scope prompt
            Map node = checkNodeBasics('party.ProfitCenter', 'party.ProfitCenter', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
            String nodeDetails = node.details as String
            checkScopePromptTitle(nodeDetails, 'dummyRequiredScopeKey', true, 'rpm.class.party.ProfitCenter')
            checkScopePromptDropdown(nodeDetails, 'dummyRequiredScopeKey', '', [], [], ENTER_VALUE)
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
    void testBuildGraph_scopePrompt_missingDeclaredRequiredScope()
    {
        NCube cube = NCubeManager.getCube(appId, 'rpm.class.Coverage')
        try
        {
            //Change cube to have declared required scope
            cube.setMetaProperty('requiredScopeKeys', ['dummyRequiredScopeKey'])
            Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                         policyControlDate: '2017-01-01',
                         quoteDate        : '2017-01-01',
                         risk             : 'WProductOps']

            Map availableNodeScope = new CaseInsensitiveMap(scope)
            availableNodeScope.putAll([sourceFieldName: 'Coverages', risk: 'StateOps', sourceRisk: 'WProductOps', coverage: 'CCCoverage'])

            String startCubeName = 'rpm.class.Risk'
            inputScope = new CaseInsensitiveMap(scope)
            Map options = [startCubeName: startCubeName, scope: inputScope]
            buildGraph(options)
            String scopeMessage = scopeInfo.scopeMessage

            //Check graph scope prompt
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.dummyRequiredScopeKey.size()
            assert 1 == scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey.size()
            assert ['rpm.class.Coverage'] as Set== scopeInfo.optionalGraphScopeCubeNames.dummyRequiredScopeKey as Set
            assert scopeMessage.contains("""<input id="dummyRequiredScopeKey" value="" placeholder="Enter value..." class="scopeInput form-control " """)
            assert !scopeMessage.contains('<li id="dummyRequiredScopeKey"')

            //Check node scope prompt
            Map node = checkNodeBasics('CCCoverage', 'Coverage', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
            String nodeDetails = node.details as String
            checkScopePromptTitle(nodeDetails, 'dummyRequiredScopeKey', true, 'rpm.class.Coverage')
            checkScopePromptDropdown(nodeDetails, 'dummyRequiredScopeKey', '', [], [], ENTER_VALUE)
            assert node.scope == new CaseInsensitiveMap()
            assert node.availableScope == availableNodeScope
        }
        finally
        {
            //Reset cube
            cube.removeMetaProperty('requiredScopeKeys')
        }
    }

    @Test
    void testGetCellValues_classNode_show_missingRequiredScope()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'TCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map expectedNodeScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert nodes.size() == 1
        Map node = checkNodeBasics('TCoverage', 'Coverage')
        checkNoScopePrompt(node.details as String)
        assert scope == scopeInfo.scope

        //Simulate that the user clicks Show Traits for the node.
        //Required node scope prompt now shows for points.
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1

        //Check that graph scope prompt does not contain the points scope key
        checkTCoverageGraphScopePrompt()

        //Check that there is a node scope prompt for points, but not yet one for businessDivision code
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_REQUIRED, true, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'points', true, 'rpm.scope.class.Coverage.traits.fieldTCoverage')
        checkScopePromptDropdown(nodeDetails, 'points', '', ['A', 'B', 'C' ], [DEFAULT], SELECT_OR_ENTER_VALUE, true)
        checkNoScopePrompt(nodeDetails, 'businessDivisionCode')
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope

        //Simulate that the user picks points = A in the node scope prompt.
        //Both required scope points and unbound node scope prompt businessDivisionCode are now showing.
        expectedNodeScope.points = 'A'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.points = 'A'
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        assert nodes.size() == 1

        //Check that graph scope prompt does not contain the points scope key or the businessDivisionCode scope key.
        checkTCoverageGraphScopePrompt()

        //Check that the node scope prompts for points and businessDivisionCode are showing
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'points', true, 'rpm.scope.class.Coverage.traits.fieldTCoverage')
        checkScopePromptDropdown(nodeDetails, 'points', 'A', ['A', 'B', 'C' ], [DEFAULT], SELECT_OR_ENTER_VALUE, true)
        checkScopePromptTitle(nodeDetails, 'businessDivisionCode', false, 'rpm.scope.class.Coverage.traits.StatCode')
        checkScopePromptDropdown(nodeDetails, 'businessDivisionCode', DEFAULT, ['AAADIV', 'BBBDIV', DEFAULT ], [], SELECT_OR_ENTER_VALUE, true)
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope

        //Simulate that the user picks businessDivisionCode = AAADIV in the node scope prompt.
        //Both scope prompts are still showing.
        expectedNodeScope.points = 'A'
        expectedNodeScope.businessDivisionCode = 'AAADIV'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.points = 'A'
        inputScope.businessDivisionCode = 'AAADIV'
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        assert nodes.size() == 1

        //Check that graph scope prompt does not contain the points scope key or the businessDivisionCode scope key.
        checkTCoverageGraphScopePrompt()

        //Check that the node scope prompts are still showing
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_USED_TO_LOAD_TRAITS, false, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'points', true, 'rpm.scope.class.Coverage.traits.fieldTCoverage')
        checkScopePromptDropdown(nodeDetails, 'points', 'A', ['A', 'B', 'C' ], [DEFAULT], SELECT_OR_ENTER_VALUE, true)
        checkScopePromptTitle(nodeDetails, 'businessDivisionCode', false, 'rpm.scope.class.Coverage.traits.StatCode')
        checkScopePromptDropdown(nodeDetails, 'businessDivisionCode', 'AAADIV', ['AAADIV', 'BBBDIV', DEFAULT ], [], SELECT_OR_ENTER_VALUE, true)
        assert expectedNodeScope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope
    }

    @Test
    void testGetCellValues_classNode_show_invalidRequiredScope()
    {
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     coverage         : 'TCoverage'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map expectedNodeScope = new CaseInsensitiveMap(scope)

        //Build graph
        String startCubeName = 'rpm.class.Coverage'
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert nodes.size() == 1
        Map node = checkNodeBasics('TCoverage', 'Coverage')
        checkNoScopePrompt(node.details as String)
        assert scope == scopeInfo.scope

        //Simulate that the user clicks Show Traits for the node.
        //Required node scope prompt now shows for points.
        node.showCellValues = true
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: scopeInfo.scope]
        getCellValues(options)
        assert nodes.size() == 1

        //Check that graph scope prompt does not contain the points scope key
        checkTCoverageGraphScopePrompt()

        //Check that there is a node scope prompt for points.
        node = checkNodeBasics('TCoverage', 'Coverage', '', ADDITIONAL_SCOPE_REQUIRED, true, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'points', true, 'rpm.scope.class.Coverage.traits.fieldTCoverage')
        checkScopePromptDropdown(nodeDetails, 'points', '', ['A', 'B', 'C' ], [DEFAULT], SELECT_OR_ENTER_VALUE, true)
        assert scope == node.scope
        assert scope == node.availableScope
        assert scope == scopeInfo.scope

        //Simulate that the user enters points = bogus in the node scope prompt.
        //Invalid node scope prompt should now show for points.
        expectedNodeScope.points = 'bogus'
        inputScope = new CaseInsensitiveMap(scopeInfo.scope)
        inputScope.points = 'bogus'
        options = [startCubeName: startCubeName, node: node, visInfo: visInfo, scopeInfo: scopeInfo, scope: inputScope]
        getCellValues(options)
        assert nodes.size() == 1

        //Check that graph scope prompt does not contain the points scope key.
        checkTCoverageGraphScopePrompt()

        //Check that the node scope prompt for points is showing.
        node = checkNodeBasics('TCoverage', 'Coverage', '', IS_NOT_VALID_FOR, true, true)
        nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'points', true, 'rpm.scope.class.Coverage.traits.fieldTCoverage')
        checkScopePromptDropdown(nodeDetails, 'points', 'bogus', ['A', 'B', 'C' ], [DEFAULT], SELECT_OR_ENTER_VALUE, true)
        assert scope == node.scope
        assert expectedNodeScope == node.availableScope
        assert scope == scopeInfo.scope
    }


    @Test
    void testBuildGraph_scopePrompt_enumWithSingleDefaultValue()
    {
        String startCubeName = 'rpm.class.Product'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     product:'BProduct',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01']
        inputScope = new CaseInsensitiveMap(scope)

        Map nodeScope = new CaseInsensitiveMap(scope)
        nodeScope.risk = 'DRisk'

        Map availableScope = new CaseInsensitiveMap(nodeScope)
        availableScope.sourceFieldName = 'Risks'

        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 4 == nodes.size()
        assert 3 == edges.size()

        //The edge for field Risks from BProduct to enum Product.Risks
        Map edge = edges.find { Map edge -> 'BProduct' == edge.fromName && 'Product.Risks' == edge.toName}
        assert 'Risks' == edge.label
        assert "Field Risks cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        Map node = checkNodeBasics('DRisk', 'Risk', '', DEFAULTS_WERE_USED, false)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'state', false, 'rpm.scope.class.Risk.traits.fieldDRisk')
        checkScopePromptDropdown(nodeDetails as String, 'state', 'Default', [DEFAULT], [], SELECT_OR_ENTER_VALUE)

        assert node.availableScope == availableScope
        assert node.scope == nodeScope
    }

    @Test
    void testBuildGraph_scopePrompt_enumWithMissingRequiredScope()
    {
        String startCubeName = 'rpm.class.Risk'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     risk: 'DRisk',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map availableScope = new CaseInsensitiveMap(scope)
        availableScope.sourceFieldName = 'Coverages'

        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 2 == nodes.size()
        assert 1 == edges.size()

        //The edge for field Coverages from DRisk to enum Risk.Coverages
        Map edge = edges.find { Map edge -> 'DRisk' == edge.fromName && 'Risk.Coverages' == edge.toName}
        assert "${ADDITIONAL_SCOPE_REQUIRED_FOR}Coverages".toString() == edge.label
        assert "Field Coverages cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Risk.Coverages enum has one required prompt
        Map node = checkEnumNodeBasics("${ADDITIONAL_SCOPE_REQUIRED_FOR}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Coverages on DRisk", ADDITIONAL_SCOPE_REQUIRED, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.enum.Risk.Coverages.traits.exists')
        checkScopePromptDropdown(nodeDetails, 'pgm', '', ['pgm1', 'pgm2', 'pgm3' ], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'state')

        assert node.availableScope == availableScope
        assert node.scope == new CaseInsensitiveMap()
    }

    @Test
    void testBuildGraph_scopePrompt_enumWithInvalidRequiredScope()
    {
        String startCubeName = 'rpm.class.Risk'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     risk: 'DRisk',
                     pgm: 'pgm4',
                     policyControlDate:'2017-01-01',
                     quoteDate:'2017-01-01'] as CaseInsensitiveMap
        inputScope = new CaseInsensitiveMap(scope)

        Map availableScope = new CaseInsensitiveMap(scope)
        availableScope.sourceFieldName = 'Coverages'

        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 2 == nodes.size()
        assert 1 == edges.size()

        //The edge for field Coverages from DRisk to enum Risk.Coverages
        Map edge = edges.find { Map edge -> 'DRisk' == edge.fromName && 'Risk.Coverages' == edge.toName}
        assert "${REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR}Coverages".toString() == edge.label
        assert "Field Coverages cardinality ${V_MIN_CARDINALITY}:${V_MAX_CARDINALITY}".toString() == edge.title

        //Risk.Coverages enum has one required prompt
        Map node = checkEnumNodeBasics("${REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Coverages on DRisk", IS_NOT_VALID_FOR, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'pgm', true, 'rpm.scope.enum.Risk.Coverages.traits.exists')
        checkScopePromptDropdown(nodeDetails, 'pgm', 'pgm4', ['pgm1', 'pgm2', 'pgm3' ], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkNoScopePrompt(node.details as String, 'state')
        assert node.availableScope == availableScope
        assert node.scope == new CaseInsensitiveMap()
    }


    @Test
    void testBuildGraph_scopePrompt_derivedScopeKey_topNode()
    {
        String startCubeName = 'rpm.class.Risk'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     risk             : 'StateOps']
        inputScope = new CaseInsensitiveMap(scope)

        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //Check that sourceRisk is now part of top node scope
        List<String> risks = ['ARisk', 'BRisk', 'DRisk', 'GProductOps', 'GStateOps', 'ProductLocation', 'StateOps', 'WProductOps']
        assert scopeInfo.topNodeGraphScopeAvailableValues.keySet().contains('sourceRisk')
        assert risks as Set == scopeInfo.topNodeGraphScopeAvailableValues.sourceRisk as Set
        assert scopeInfo.topNodeGraphScopeCubeNames.keySet().contains('sourceRisk')
        assert ['rpm.scope.class.Risk.traits.Risks'] as Set== scopeInfo.topNodeGraphScopeCubeNames.sourceRisk as Set
        String scopeMessage = scopeInfo.scopeMessage
        checkScopePromptTitle(scopeMessage, 'sourceRisk', true, null, 'topNode')
        checkScopePromptDropdown(scopeMessage, 'sourceRisk', '', risks, [DEFAULT], SELECT_OR_ENTER_VALUE)

        //Check node
        Map node = checkNodeBasics('StateOps', 'Risk', ADDITIONAL_SCOPE_REQUIRED_FOR, ADDITIONAL_SCOPE_REQUIRED, true)
        String nodeDetails = node.details as String
        checkScopePromptTitle(nodeDetails, 'sourceRisk', true, 'rpm.scope.class.Risk.traits.Risks')
        checkScopePromptDropdown(nodeDetails, 'sourceRisk', '', risks, [DEFAULT], SELECT_OR_ENTER_VALUE)
    }

    @Test
    void testBuildGraph_scopePrompt_derivedScopeKey_notTopNode()
    {
        String startCubeName = 'rpm.class.Risk'
        Map scope = [_effectiveVersion: ApplicationID.DEFAULT_VERSION,
                     policyControlDate: '2017-01-01',
                     quoteDate        : '2017-01-01',
                     product          : 'WProduct',
                     risk             : 'WProductOps']
        inputScope = new CaseInsensitiveMap(scope)

        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)

        //Check that sourceRisk is not part of required graph scope
        assert !scopeInfo.topNodeGraphScopeAvailableValues.keySet().contains('sourceRisk')
        assert !scopeInfo.topNodeGraphScopeCubeNames.keySet().contains('sourceRisk')
        checkNoScopePrompt(scopeInfo.scopeMessage, 'sourceRisk')

        //Check node
        Map node = checkNodeBasics('StateOps', 'Risk')
        checkNoScopePrompt(node.details as String)
    }

    @Test
    void testBuildGraph_inScopeScopeValues_unboundAxis()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()

        //User picks GProduct. Reload. This will result in unboundAxis on div.
        inputScope.product = 'GProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //Check graph scope promp
        assert 3 == scopeInfo.optionalGraphScopeAvailableValues.div.size()
        assert [null, 'div1', 'div2'] as Set == scopeInfo.optionalGraphScopeAvailableValues.div as Set

        //Check node scope prompt
        Map node = checkEnumNodeBasics("${VALID_VALUES_FOR_FIELD_SENTENCE_CASE}Risks on GProduct")
        checkScopePromptDropdown(node.details as String, 'div', 'Default', ['div1', 'div2', DEFAULT], [], SELECT_OR_ENTER_VALUE)
    }

    /* TODO: Will revisit providing "in scope" available scope values for r:exists at a later time.
    @Test
    void testBuildGraph_inScopeScopeValues_invalidCoordinate()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()

        //User picks GProduct. Reload.
        inputScope.product = 'GProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //User picks div = div1. Reload. This will result in InvalidCoordinateException due to missing category scope.
        inputScope.div = 'div1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //Check graph scope prompt
        assert 5 == scopeInfo.optionalGraphScopeAvailableValues.category.size()
        assert ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'] as Set == scopeInfo.optionalGraphScopeAvailableValues.category as Set

        //Check node scope prompt
        Map node = checkEnumNodeBasics("${ADDITIONAL_SCOPE_REQUIRED_FOR}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Risks on GProduct", ADDITIONAL_SCOPE_REQUIRED, true)
        checkScopePromptDropdown(node.details as String, 'category', '', ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'], [DEFAULT], SELECT_OR_ENTER_VALUE)
    }

    @Test
    void testBuildGraph_inScopeScopeValues_coordinateNotFound()
    {
        //Load graph with no scope
        String startCubeName = 'rpm.class.Product'
        inputScope = new CaseInsensitiveMap()
        Map options = [startCubeName: startCubeName, scope: inputScope]
        buildGraph(options)
        assert 1 == nodes.size()

        //User picks GProduct. Reload.
        inputScope.product = 'GProduct'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //User picks div = div1. Reload. This will result in InvalidCoordinateException since category is required scope.
        inputScope.div = 'div1'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //User picks category = catBogus. Reload. This will result in CoordinateNotFoundException since catBogus doesn't exist.
        inputScope.category = 'catBogus'
        options = [startCubeName: startCubeName, scope: inputScope, visInfo: visInfo]
        buildGraph(options)
        assert 2 == nodes.size()

        //Check graph scope prompt for category
        assert 5 == scopeInfo.optionalGraphScopeAvailableValues.category.size()
        assert ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'] as Set == scopeInfo.optionalGraphScopeAvailableValues.category as Set

        //Check node scope prompt
        Map node = checkEnumNodeBasics("${REQUIRED_SCOPE_VALUE_NOT_FOUND_FOR}${VALID_VALUES_FOR_FIELD_LOWER_CASE}Risks on GProduct", IS_NOT_VALID_FOR, true)
        checkScopePromptDropdown(node.details as String, 'category', '', ['cat1', 'cat2', 'cat3', 'cat4',  'cat5'], [DEFAULT,], SELECT_OR_ENTER_VALUE)
    }
    */


    //*************************************************************************************

    private void buildGraph(Map options, boolean hasMessages = false)
    {
        visualizer = new RpmVisualizer()
        visInfo?.nodes = []
        visInfo?.edges = []
        Map graphInfo = visualizer.buildGraph(appId, options)
        visInfo = graphInfo.visInfo as RpmVisualizerInfo
        scopeInfo = graphInfo.scopeInfo as RpmVisualizerScopeInfo
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
        visInfo = graphInfo.visInfo as RpmVisualizerInfo
        scopeInfo = graphInfo.scopeInfo as RpmVisualizerScopeInfo
        messages = visInfo.messages
        if (!hasMessages)
        {
            assert !messages
        }
        nodes = visInfo.nodes as List
        edges = visInfo.edges as List
    }

    private void checkTopNodeScope(String selectedProductName = '')
    {
        Set<String> scopeKeys = ['policyControlDate', 'quoteDate', '_effectiveVersion', 'product'] as CaseInsensitiveSet
        Set<String> products = ['AProduct', 'BProduct', 'GProduct', 'UProduct', 'WProduct'] as CaseInsensitiveSet

        assert 4 == scopeInfo.topNodeGraphScopeAvailableValues.keySet().size()
        assert scopeInfo.topNodeGraphScopeAvailableValues.keySet().containsAll(scopeKeys)
        assert 0 == scopeInfo.topNodeGraphScopeAvailableValues.policyControlDate.size()
        assert 0 == scopeInfo.topNodeGraphScopeAvailableValues.quoteDate.size()
        assert 1 == scopeInfo.topNodeGraphScopeAvailableValues._effectiveVersion.size()
        assert [ApplicationID.DEFAULT_VERSION] as Set == scopeInfo.topNodeGraphScopeAvailableValues._effectiveVersion as Set
        assert 5 == scopeInfo.topNodeGraphScopeAvailableValues.product.size()
        assert scopeInfo.topNodeGraphScopeAvailableValues.product.containsAll(products)

        assert 4 == scopeInfo.topNodeGraphScopeCubeNames.keySet().size()
        assert scopeInfo.topNodeGraphScopeCubeNames.keySet().containsAll(scopeKeys)
        assert 0 == scopeInfo.topNodeGraphScopeCubeNames.policyControlDate.size()
        assert 0 == scopeInfo.topNodeGraphScopeCubeNames.quoteDate.size()
        assert 0 == scopeInfo.topNodeGraphScopeCubeNames._effectiveVersion.size()
        assert 1 == scopeInfo.topNodeGraphScopeCubeNames.product.size()
        assert ['rpm.scope.class.Product.traits'] as Set== scopeInfo.topNodeGraphScopeCubeNames.product as Set

        String scopeMessage = scopeInfo.scopeMessage
        assert scopeMessage.contains(selectedProductName + SCOPE_UTILIZED_BY_TOP_NODE)
        checkScopePromptTitle(scopeMessage, 'policyControlDate', true, null, 'topNode')
        checkScopePromptTitle(scopeMessage, 'quoteDate', true, null, 'topNode')
        checkScopePromptTitle(scopeMessage, '_effectiveVersion', true, null, 'topNode')
        checkScopePromptTitle(scopeMessage, 'product', true, null, 'topNode')
        checkScopePromptDropdown(scopeMessage, 'policyControlDate', "${defaultScopeDate}", [], [DEFAULT], ENTER_VALUE)
        checkScopePromptDropdown(scopeMessage, 'quoteDate', "${defaultScopeDate}", [], [DEFAULT], ENTER_VALUE)
        checkScopePromptDropdown(scopeMessage, '_effectiveVersion', "${ApplicationID.DEFAULT_VERSION}", [], [DEFAULT], SELECT_OR_ENTER_VALUE)
        checkScopePromptDropdown(scopeMessage, 'product', "${selectedProductName}", products as List, [DEFAULT], SELECT_OR_ENTER_VALUE)
    }

    private void checkOptionalGraphScope(String selectedProductName = '', String selectedPgmName = '', String selectedStateName = 'Default', selectedDivName = 'Default', boolean includeStateNM = false)
    {
        Set<String> scopeKeys = ['pgm', 'state', 'div'] as CaseInsensitiveSet
        String scopeMessage = scopeInfo.scopeMessage

        if (selectedProductName)
        {
            assert scopeMessage.contains(OPTIONAL_SCOPE_IN_VISUALIZATION)
            assert 3 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
            assert scopeInfo.optionalGraphScopeAvailableValues.keySet().containsAll(scopeKeys)
            assert 3 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
            assert scopeInfo.optionalGraphScopeCubeNames.keySet().containsAll(scopeKeys)

            //Check pgm
            checkScopePromptTitle(scopeMessage, 'pgm', false, null, 'additionalGraphScope')
            assert 3 == scopeInfo.optionalGraphScopeAvailableValues.pgm.size()
            assert ['pgm1', 'pgm2', 'pgm3'] as Set == scopeInfo.optionalGraphScopeAvailableValues.pgm as Set
            assert 2 == scopeInfo.optionalGraphScopeCubeNames.pgm.size()
            assert ['rpm.scope.class.Risk.traits.fieldBRisk', 'rpm.scope.class.Coverage.traits.fieldACoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.pgm as Set
            checkScopePromptDropdown(scopeMessage, 'pgm', "${selectedPgmName}", ['pgm1', 'pgm2', 'pgm3'], [DEFAULT], SELECT_OR_ENTER_VALUE)

            //Check div
            checkScopePromptTitle(scopeMessage, 'div', false, null, 'additionalGraphScope')
            if ('div3' == selectedDivName)
            {
                checkScopePromptDropdown(scopeMessage, 'div', "${selectedDivName}", ['div1', 'div2', DEFAULT], ['div3'], SELECT_OR_ENTER_VALUE)
                assert 3 == scopeInfo.optionalGraphScopeAvailableValues.div.size()
                assert [null, 'div1', 'div2'] as Set == scopeInfo.optionalGraphScopeAvailableValues.div as Set
                assert 3 == scopeInfo.optionalGraphScopeCubeNames.div.size()
                assert ['rpm.scope.enum.Product.Risks.traits.exists', 'rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldACoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.div as Set

            }
            else
            {
                checkScopePromptDropdown(scopeMessage, 'div', "${selectedDivName}", ['div1', 'div2', 'div3', DEFAULT], [], SELECT_OR_ENTER_VALUE)
                assert 4 == scopeInfo.optionalGraphScopeAvailableValues.div.size()
                assert [null, 'div1', 'div2', 'div3'] as Set == scopeInfo.optionalGraphScopeAvailableValues.div as Set
                if ('div1' == selectedDivName)
                {
                    assert 2 == scopeInfo.optionalGraphScopeCubeNames.div.size()
                    assert ['rpm.scope.enum.Product.Risks.traits.exists', 'rpm.scope.class.Coverage.traits.fieldBCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.div as Set
                }
                else
                {
                    assert 4 == scopeInfo.optionalGraphScopeCubeNames.div.size()
                    assert ['rpm.scope.enum.Product.Risks.traits.exists', 'rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldACoverage', 'rpm.scope.class.Coverage.traits.fieldBCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.div as Set
                }
            }

            //Check state
            checkScopePromptTitle(scopeMessage, 'state', false, null, 'additionalGraphScope')
            if (includeStateNM)
            {
                assert 7 == scopeInfo.optionalGraphScopeAvailableValues.state.size()
                assert [null, 'KY', 'NY', 'OH', 'GA', 'IN', 'NM'] as Set == scopeInfo.optionalGraphScopeAvailableValues.state as Set
                assert 3 == scopeInfo.optionalGraphScopeCubeNames.state.size()
                assert ['rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldCCoverage', 'rpm.scope.class.Coverage.traits.fieldBCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.state as Set
                checkScopePromptDropdown(scopeMessage, 'state', "${selectedStateName}", ['KY', 'NY', 'OH', 'GA', 'IN', 'NM', DEFAULT], [], SELECT_OR_ENTER_VALUE)
            }
            else
            {
                assert 6 == scopeInfo.optionalGraphScopeAvailableValues.state.size()
                assert [null, 'KY', 'NY', 'OH', 'GA', 'IN'] as Set == scopeInfo.optionalGraphScopeAvailableValues.state as Set
                assert 2 == scopeInfo.optionalGraphScopeCubeNames.state.size()
                assert ['rpm.scope.class.Risk.traits.fieldARisk', 'rpm.scope.class.Coverage.traits.fieldCCoverage'] as Set == scopeInfo.optionalGraphScopeCubeNames.state as Set
                checkScopePromptDropdown(scopeMessage, 'state', "${selectedStateName}", ['KY', 'NY', 'OH', 'GA', 'IN', DEFAULT], ['NM'], SELECT_OR_ENTER_VALUE)
            }
        }
        else
        {
            assert 0 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
            assert 0 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
        }
    }

    private void checkGraphScopeNonEPM()
    {
        assert 1 == scopeInfo.topNodeGraphScopeAvailableValues.keySet().size()
        assert scopeInfo.topNodeGraphScopeAvailableValues.keySet().contains('_effectiveVersion')
        assert 1 == scopeInfo.topNodeGraphScopeAvailableValues._effectiveVersion.size()
        assert [ApplicationID.DEFAULT_VERSION] as Set == scopeInfo.topNodeGraphScopeAvailableValues._effectiveVersion as Set

        assert 1 == scopeInfo.topNodeGraphScopeCubeNames.keySet().size()
        assert scopeInfo.topNodeGraphScopeCubeNames.keySet().containsAll('_effectiveVersion')
        assert 0 == scopeInfo.topNodeGraphScopeCubeNames._effectiveVersion.size()

        String scopeMessage = scopeInfo.scopeMessage
        assert scopeMessage.contains('partyrole.LossPrevention' + SCOPE_UTILIZED_BY_TOP_NODE )
        assert scopeMessage.contains('title="Scope key _effectiveVersion is required to load partyrole.LossPrevention')
        assert scopeMessage.contains("""<input id="_effectiveVersion" value="${ApplicationID.DEFAULT_VERSION}" placeholder="Select or enter value..." class="scopeInput form-control " """)

        assert 0 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
        assert 0 == scopeInfo.optionalGraphScopeCubeNames.keySet().size()
    }

    private Map checkNodeBasics(String nodeName, String nodeType, String nodeNamePrefix = '', String nodeDetailsMessage = '', boolean unableToLoad = false, boolean showCellValues = false)
    {
        Map node = nodes.find {Map node1 ->  "${nodeNamePrefix}${nodeName}".toString() == node1.label}
        checkNodeAndEnumNodeBasics(node, unableToLoad, showCellValues)
        assert nodeType == node.title
        assert nodeType == node.detailsTitle1
        assert (node.details as String).contains(nodeDetailsMessage)
        if (showCellValues)
        {
            assert nodeName == node.detailsTitle2
        }
        else if (nodeName == nodeType || unableToLoad)  //No detailsTitle2 when missing required scope or a non-EPM class (i.e. nodeName equals nodeType)
        {
            assert null == node.detailsTitle2
        }
        else
        {
            assert nodeName == node.detailsTitle2
        }
        return node
    }

    private Map checkEnumNodeBasics(String nodeTitle, String nodeDetailsMessage = '', boolean unableToLoad = false, boolean showCellValues = false)
    {
        Map node = nodes.find {Map node1 ->  nodeTitle == node1.title}
        checkNodeAndEnumNodeBasics(node, unableToLoad, showCellValues)
        assert null == node.label
        assert nodeTitle == node.detailsTitle1
        assert null == node.detailsTitle2
        assert (node.details as String).contains(nodeDetailsMessage)
        return node
    }

    private static void checkNodeAndEnumNodeBasics(Map node, boolean unableToLoad = false, boolean showCellValues = false)
    {
        String nodeDetails = node.details as String
        if (showCellValues && unableToLoad)
        {
            assert nodeDetails.contains("${UNABLE_TO_LOAD}traits")
            assert false == node.showCellValuesLink
            assert false == node.cellValuesLoaded
            assert true == node.showCellValues
        }
        else if (unableToLoad)
        {
            assert nodeDetails.contains("${UNABLE_TO_LOAD}")
            assert false == node.showCellValuesLink
            assert false == node.cellValuesLoaded
            assert false == node.showCellValues
        }
        else if (showCellValues)
        {
            assert !nodeDetails.contains("${UNABLE_TO_LOAD}")
            assert true == node.showCellValuesLink
            assert true == node.cellValuesLoaded
            assert true == node.showCellValues
        }
        else
        {
            assert !nodeDetails.contains("${UNABLE_TO_LOAD}")
            assert true == node.showCellValuesLink
            assert true == node.cellValuesLoaded
            assert false == node.showCellValues
        }

        if (unableToLoad)
        {
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITH_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
        else if (showCellValues)
        {
            assert !nodeDetails.contains(UNABLE_TO_LOAD)
            assert !nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITH_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_AVAILABLE_SCOPE)
            assert nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
        else
        {
            assert !nodeDetails.contains(UNABLE_TO_LOAD)
            assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_TRAITS)
            assert nodeDetails.contains(DETAILS_LABEL_FIELDS)
            assert !nodeDetails.contains(DETAILS_LABEL_FIELDS_AND_TRAITS)
            assert !nodeDetails.contains(DETAILS_LABEL_CLASS_TRAITS)
        }
    }

    private static void checkScopePromptTitle(String message, String scopeKey, boolean required, String cubeNames = null, String scopeType = null)
    {
        if (required)
        {
            assert message.contains("""title="Scope key ${scopeKey} is required to load""")
        }
        else if ('additionalGraphScope' == scopeType)
        {
            assert message.contains("Scope key ${scopeKey} is used in the in the visualization. It may be optional for some classes and required by others.")
        }
        else
        {
            assert message.contains("""title="Scope key ${scopeKey} is optional to load""")
        }
        if (cubeNames)
        {
            assert message.contains(cubeNames)
        }
    }

    private static void checkScopePromptDropdown(String message, String scopeKey, String selectedScopeValue, List<String> availableScopeValues, List<String> unavailableScopeValues, String placeHolder, boolean showCellValues = false)
    {
        String loadCellValuesClass = showCellValues ? DETAILS_CLASS_LOAD_CELL_VALUES : ''
        assert message.contains("""<input id="${scopeKey}" value="${selectedScopeValue}" placeholder="${placeHolder}" class="scopeInput form-control ${loadCellValuesClass}" """)
        if (!availableScopeValues && !unavailableScopeValues)
        {
            assert !message.contains("""<li id=""")
            return
        }

        availableScopeValues.each{String scopeValue ->
            assert message.contains("""<li id="${scopeKey}: ${scopeValue}" class="scopeClick ${loadCellValuesClass}" """)
        }
        unavailableScopeValues.each{String scopeValue ->
            assert !message.contains("""<li id="${scopeKey}: ${scopeValue}" class="scopeClick ${loadCellValuesClass}" """)
        }
    }

    private static void checkNoScopePrompt(String message, String scopeKey = '')
    {
        assert !message.contains("""title="${scopeKey}""")
        assert !message.contains("""<input id="${scopeKey}""")
        assert !message.contains("""<li id="${scopeKey}""")
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
        assert nodeDetails.contains(DETAILS_LABEL_UTILIZED_SCOPE_WITHOUT_TRAITS)
        assert nodeDetails.contains("${DETAILS_LABEL_FIELDS}<pre><ul></ul></pre>")
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

    private void checkTCoverageGraphScopePrompt()
    {
        Set<String> scopeKeys = ['policyControlDate', 'quoteDate', '_effectiveVersion', 'coverage'] as CaseInsensitiveSet
        assert 4 == scopeInfo.topNodeGraphScopeAvailableValues.keySet().size()
        assert scopeInfo.topNodeGraphScopeCubeNames.keySet().containsAll(scopeKeys)
        assert 0 == scopeInfo.optionalGraphScopeAvailableValues.keySet().size()
    }

}
