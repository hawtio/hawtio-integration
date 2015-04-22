/// <reference path="../../includes.d.ts" />
/**
 * A bunch of API stubs for now until we remove references to Fabric or refactor the code
 * to work nicely in Kubernetes
 */
declare module Fabric {
    var fabricTopLevel: string;
    var profileSuffix: string;
    function initScope($scope: any, $location: any, jolokia: any, workspace: any): void;
    function brokerConfigLink(workspace: any, jolokia: any, localStorage: any, version: any, profile: any, brokerName: any): void;
    function containerJolokia(jolokia: any, id: any, fn: any): void;
    function pagePathToProfileId(pageId: any): void;
    function profileJolokia(jolokia: any, profileId: any, versionId: any, callback: any): void;
    function getDefaultVersionId(jolokia: any): void;
    function getContainersFields(jolokia: any, fields: any, onFabricContainerData: any): void;
    function loadBrokerStatus(onBrokerData: any): void;
    function connectToBroker($scope: any, container: any, postfix: any): void;
    function createJolokia(url: any): void;
    function hasFabric(workspace: any): void;
    function profilePath(profileId: any): void;
    function getOverlayProfileProperties(versionId: any, profileId: any, pid: any, onProfilePropertiesLoaded: any): void;
    function getProfileProperties(versionId: any, profileId: any, zkPid: any, onProfileProperties: any): void;
    function setProfileProperties(versionId: any, profileId: any, pid: any, data: any, callback: any): void;
    function deleteConfigurationFile(versionId: any, profileId: any, configFile: any, successFn: any, errorFn: any): void;
    function getProfile(jolokia: any, branch: any, profileName: any, someFlag: any): void;
    function createProfile(jolokia: any, branch: any, profileName: any, baseProfiles: any, successFn: any, errorFn: any): void;
    function newConfigFile(jolokia: any, branch: any, profileName: any, fileName: any, successFn: any, errorFn: any): void;
    function saveConfigFile(jolokia: any, branch: any, profileName: any, fileName: any, contents: any, successFn: any, errorFn: any): void;
    function getVersionIds(jolokia: any): void;
}
