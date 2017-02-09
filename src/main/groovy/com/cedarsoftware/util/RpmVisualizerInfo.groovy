package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.NCube
import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.RpmVisualizerConstants.*

/**
 * Provides information to visualize rpm classes.
 */

@CompileStatic
class RpmVisualizerInfo extends VisualizerInfo
{
    RpmVisualizerInfo(){}

    RpmVisualizerInfo(ApplicationID applicationID)
    {
        super(applicationID)
    }

    @Override
    protected String getCubeType()
    {
        return CUBE_TYPE_RPM
    }

    protected boolean addMissingMinimumScope(String scopeKey, String defaultValue, String startCubeName)
    {
        Map<String, Object> scope = scopeInfo.scope
        boolean missingScope
        if (scope.containsKey(scopeKey))
        {
            if (!scope[scopeKey])
            {
                missingScope = true
            }
        } else
        {
            missingScope = true
        }

        if (missingScope)
        {
            if (defaultValue)
            {
                scope[scopeKey] = defaultValue
            }
            else
            {
                String scopeCubeName = startCubeName.replace(RPM_CLASS_DOT, RPM_SCOPE_CLASS_DOT) + DOT_TRAITS
                scopeInfo.addMissingRequiredScope(scopeKey, scopeCubeName, null, false)
            }
        }
        scopeInfo.allRequiredScopeKeys << scopeKey
        return missingScope
    }


    @Override
    List getTypesToAdd(String group)
    {
        if (!group.endsWith(groupSuffix))
        {
            return typesToAddMap[allGroups[group]]
        }
        return null
    }

   @Override
   void loadTypesToAddMap(NCube configCube)
    {
        typesToAddMap = [:]
        String json = NCubeManager.getResourceAsString(JSON_FILE_PREFIX + TYPES_TO_ADD_CUBE_NAME + JSON_FILE_SUFFIX)
        NCube typesToAddCube = NCube.fromSimpleJson(json)
        Set<String> allTypes = configCube.getCell([(CONFIG_ITEM): CONFIG_ALL_TYPES, (CUBE_TYPE): cubeType]) as Set

        allTypes.each { String sourceType ->
            Map<String, Boolean> map = typesToAddCube.getMap([(SOURCE_TYPE): sourceType, (TARGET_TYPE): new LinkedHashSet()]) as Map
            List<String> typesToAdd = map.findAll { String type, Boolean available ->
                available
            }.keySet() as List
            typesToAddMap[sourceType] = typesToAdd
        }
    }

    @Override
    protected String getLoadCellValuesLabel()
    {
        'traits'
    }
}