/// <reference path="../../includes.ts"/>

/**
 * A bunch of API stubs for now until we remove references to Fabric or refactor the code
 * to work nicely in Kubernetes
 */
module Fabric {

  export var fabricTopLevel = "fabric/profiles/";
  export var profileSuffix = ".profile";


  export function initScope($scope, $location, jolokia, workspace) {
  }

  export function brokerConfigLink(workspace, jolokia, localStorage, version, profile, brokerName) {
  }

  export function containerJolokia(jolokia, id, fn) {
  }

  export function pagePathToProfileId(pageId) {
  }

  export function profileJolokia(jolokia, profileId, versionId, callback) {
  }

  export function getDefaultVersionId(jolokia) {
  }

  export function getContainersFields(jolokia, fields, onFabricContainerData) {
  }

  export function loadBrokerStatus(onBrokerData) {
    /** TODO
     Core.register(jolokia, $scope, {type: 'exec', mbean: Fabric.mqManagerMBean, operation: "loadBrokerStatus()"}, Core.onSuccess(onBrokerData));
     */
  }

  export function connectToBroker($scope, container, postfix) {
  }

  export function createJolokia(url) {
  }

  export function hasFabric(workspace) {
  }

  export function profilePath(profileId) {
  }

  export function getOverlayProfileProperties(versionId, profileId, pid, onProfilePropertiesLoaded) {
    /**
     * TODO
     jolokia.execute(Fabric.managerMBean, "getOverlayProfileProperties", $scope.versionId, $scope.profileId, $scope.pid, Core.onSuccess(onProfilePropertiesLoaded));
     */
  }

  export function getProfileProperties(versionId, profileId, zkPid, onProfileProperties) {
    /** TODO
     jolokia.execute(Fabric.managerMBean, "getProfileProperties", $scope.versionId, $scope.profileId, $scope.zkPid, Core.onSuccess(onProfileProperties));
     */
  }


  export function setProfileProperties(versionId, profileId, pid, data, callback) {
    /*
     TODO
     jolokia.execute(Fabric.managerMBean, "setProfileProperties", $scope.versionId, $scope.profileId, pid, data, callback);
     */
  }


  export function deleteConfigurationFile(versionId, profileId, configFile, successFn, errorFn) {
    /** TODO
    jolokia.execute(Fabric.managerMBean, "deleteConfigurationFile",
      versionId, profileId, configFile,
      Core.onSuccess(successFn, {error: errorFn}));
     */
  }

  export function getProfile(jolokia, branch, profileName, someFlag) {

  }

  export function createProfile(jolokia, branch, profileName, baseProfiles, successFn, errorFn) {
  }

  export function newConfigFile(jolokia, branch, profileName, fileName, successFn, errorFn) {
  }

  export function saveConfigFile(jolokia, branch, profileName, fileName, contents, successFn, errorFn) {
  }

  export function getVersionIds(jolokia) {
  }


}