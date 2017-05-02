package com.cedarsoftware.ncube

import groovy.transform.CompileStatic
import org.springframework.core.io.Resource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.core.io.support.ResourcePatternResolver


@CompileStatic
class NCubeResourcePersister implements NCubePersister
{
    static final String CLASS_PATH_PREFIX = 'classpath*:**/'
    static final String JSON_FILE_SUFFIX = '.json'
    static String pathPrefix

    NCubeResourcePersister(String pathPrefix = CLASS_PATH_PREFIX)
    {
        this.pathPrefix = pathPrefix
    }

    @Override
    int copyBranchWithHistory(ApplicationID srcAppId, ApplicationID targetAppId) {
        return 0
    }

    @Override
    NCube loadCubeById(long id) {
        //TODO: Implement using PathMatchingResourcePatternResolver
        return null
    }

    @Override
    List<NCubeInfoDto> commitCubes(ApplicationID applicationID, Object[] objects, String s, long txnId) {
        return Collections.EMPTY_LIST
    }

    @Override
    int rollbackCubes(ApplicationID applicationID, Object[] objects, String s1) {
        return 0
    }

    @Override
    boolean mergeAcceptTheirs(ApplicationID applicationID, String s, String s1, String s2) {
        return false
    }

    @Override
    boolean mergeAcceptMine(ApplicationID applicationID, String s, String s1) {
        return false
    }

    @Override
    boolean updateBranchCubeHeadSha1(Long aLong, String x, String s) {
        return false
    }

    @Override
    void updateCube(ApplicationID applicationID, NCube cube, String s) {

    }

    @Override
    List<NCubeInfoDto> pullToBranch(ApplicationID applicationID, Object[] objects, String s, long txnId) {
        return null
    }

    @Override
    boolean deleteBranch(ApplicationID applicationID) {
        return false
    }

    @Override
    boolean deleteCubes(ApplicationID applicationID, Object[] objects, boolean b, String s1)
    {
        return false
    }

    @Override
    boolean duplicateCube(ApplicationID applicationID, ApplicationID applicationID1, String s, String s1, String s2) {
        return false
    }

    @Override
    int copyBranch(ApplicationID srcAppId, ApplicationID targetAppId) {
        return 0
    }

    @Override
    boolean renameCube(ApplicationID applicationID, String oldName, String newName, String userName)
    {
        return false
    }

    @Override
    boolean restoreCubes(ApplicationID applicationID, Object[] objects, String s1)
    {
        return false
    }

    @Override
    NCubeInfoDto commitMergedCubeToHead(ApplicationID appId, NCube cube, String username, long txId) {
        return null
    }

    @Override
    NCubeInfoDto commitMergedCubeToBranch(ApplicationID appId, NCube cube, String headSha1, String username, long txId) {
        return null
    }

    @Override
    boolean updateNotes(ApplicationID applicationID, String s, String s1)
    {
        return false
    }

    @Override
    int changeVersionValue(ApplicationID applicationID, String s)
    {
        return 0
    }

    @Override
    int moveBranch(ApplicationID appId, String newSnapVer) {
        return 0
    }

    @Override
    int releaseCubes(ApplicationID applicationID, String userName)
    {
        return 0
    }

    @Override
    boolean updateTestData(ApplicationID applicationID, String s, String s1)
    {
        return false
    }

    @Override
    NCube loadCube(ApplicationID appId, String name)
    {
        NCubeManager.validateAppId(appId)
        NCube.validateCubeName(name)
        NCube cube = loadCubeFromResources(appId, name)
        return cube
    }

    static NCube loadCubeFromResources(ApplicationID appId, String name)
    {
        ClassLoader cl = NCubeResourcePersister.getClassLoader()
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(cl)
        Resource[] resources = resolver.getResources("${pathPrefix}${name}${JSON_FILE_SUFFIX}")
        Map<String, Object> cubes = loadCubes(appId, resources)
        return cubes[name] as NCube
    }

    private static Map<String, Object> loadCubes(ApplicationID appId, Resource[] resources)
    {
        Map<String, Object> cubes = [:]
        resources.each { Resource resource ->
            NCube cube = NCube.createCubeFromStream(resource.inputStream)
            cube.applicationID = appId
            NCubeManager.addCube(appId, cube)
            cubes[resource.filename - JSON_FILE_SUFFIX] = cube
        }
        return cubes
    }

    @Override
    List<NCubeInfoDto> search(ApplicationID applicationID, String s, String searchValue, Map options)
    {
        //TODO: Implement using PathMatchingResourcePatternResolver
       return []
    }

    @Override
    NCube loadCubeBySha1(ApplicationID applicationID, String s, String s1) {
        //TODO: Implement using PathMatchingResourcePatternResolver
        return null
    }

    @Override
    List<String> getAppNames(String tenant) {
        //TODO: Implement using PathMatchingResourcePatternResolver
        return new ArrayList<String>()
    }

    @Override
    Map<String, List<String>>  getVersions(String tenant, String app) {
        //TODO: Implement using PathMatchingResourcePatternResolver
        Map versions = [SNAPSHOT: [ApplicationID.DEFAULT_VERSION], RELEASE: [ApplicationID.DEFAULT_VERSION]]
        return versions
    }

    @Override
    List<NCubeInfoDto> getRevisions(ApplicationID appId, String cubeName, boolean ignoreVersion)
    {
        //TODO: Implement using PathMatchingResourcePatternResolver
        return new ArrayList<NCubeInfoDto>()
    }

    @Override
    Set<String> getBranches(ApplicationID appId) {
        //TODO: Implement using PathMatchingResourcePatternResolver
        return null
    }

    @Override
    String getTestData(ApplicationID applicationID, String s)
    {
        return null
    }
}
