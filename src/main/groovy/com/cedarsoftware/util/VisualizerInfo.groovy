package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic
import static com.cedarsoftware.util.VisualizerConstants.*

/**
 * Provides information to visualize n-cubes.
 */

@CompileStatic
class VisualizerInfo
{
    protected  ApplicationID appId
    protected List<Map<String, Object>> nodes = []
    protected List<Map<String, Object>> edges = []

    protected long maxLevel
    protected  long nodeCount
    protected long relInfoCount
    protected long defaultLevel
    protected String loadCellValuesLabel

    protected  Map<String,String> allGroups
    protected Set<String> allGroupsKeys
    protected String groupSuffix
    protected Set<String> availableGroupsAllLevels
    protected Set<String> messages

    protected Map<String, Object> networkOverridesBasic
    protected Map<String, Object> networkOverridesFull
    protected Map<String, Object> networkOverridesTopNode

    protected Map<String, Set<String>> requiredScopeKeysByCube = [:]
    protected Map<String, Set<String>> allOptionalScopeKeysByCube = [:]

    protected Map<String, List<String>> typesToAddMap = [:]

    VisualizerInfo(){}

    protected VisualizerInfo(ApplicationID applicationID)
    {
        appId = applicationID
        loadConfigurations(cubeType)
    }

    protected void init()
    {
        maxLevel = 1
        nodeCount = 1
        relInfoCount = 1
        messages = new LinkedHashSet()
        availableGroupsAllLevels = new LinkedHashSet()
    }

    protected String getCubeType()
    {
        return CUBE_TYPE_DEFAULT
    }

    protected NCube loadConfigurations(String cubeType)
    {
        String configJson = NCubeManager.getResourceAsString(JSON_FILE_PREFIX + VISUALIZER_CONFIG_CUBE_NAME + JSON_FILE_SUFFIX)
        NCube configCube = NCube.fromSimpleJson(configJson)
        configCube.applicationID = appId
        String networkConfigJson = NCubeManager.getResourceAsString(JSON_FILE_PREFIX + VISUALIZER_CONFIG_NETWORK_OVERRIDES_CUBE_NAME + JSON_FILE_SUFFIX)
        NCube networkConfigCube = NCube.fromSimpleJson(networkConfigJson)
        networkConfigCube.applicationID = appId

        networkOverridesBasic = networkConfigCube.getCell([(CONFIG_ITEM): CONFIG_NETWORK_OVERRIDES_BASIC, (CUBE_TYPE): cubeType]) as Map
        networkOverridesFull = networkConfigCube.getCell([(CONFIG_ITEM): CONFIG_NETWORK_OVERRIDES_FULL, (CUBE_TYPE): cubeType]) as Map
        networkOverridesTopNode = networkConfigCube.getCell([(CONFIG_ITEM): CONFIG_NETWORK_OVERRIDES_TOP_NODE, (CUBE_TYPE): cubeType]) as Map
        defaultLevel = configCube.getCell([(CONFIG_ITEM): CONFIG_DEFAULT_LEVEL, (CUBE_TYPE): cubeType]) as long
        allGroups = configCube.getCell([(CONFIG_ITEM): CONFIG_ALL_GROUPS, (CUBE_TYPE): cubeType]) as Map
        allGroupsKeys = new CaseInsensitiveSet(allGroups.keySet())
        String groupSuffix = configCube.getCell([(CONFIG_ITEM): CONFIG_GROUP_SUFFIX, (CUBE_TYPE): cubeType]) as String
        this.groupSuffix = groupSuffix ?: ''
        loadTypesToAddMap(configCube)
        loadCellValuesLabel = getLoadCellValuesLabel()
        return configCube
    }

    protected List getTypesToAdd(String group)
    {
        return typesToAddMap[allGroups[group]]
    }

    protected void loadTypesToAddMap(NCube configCube)
    {
        typesToAddMap = [:]
        Set<String> allTypes = configCube.getCell([(CONFIG_ITEM): CONFIG_ALL_TYPES, (CUBE_TYPE): cubeType]) as Set
        allTypes.each{String type ->
            Map.Entry<String, String> entry = allGroups.find{ String key, String value ->
                value == type
            }
            typesToAddMap[entry.value] = allTypes as List
        }
    }

    protected String getLoadCellValuesLabel()
    {
        'cell values'
    }

    protected void convertToSingleMessage()
    {
        if (messages)
        {
            messages = [messages.join(DOUBLE_BREAK)] as Set
        }
    }
}