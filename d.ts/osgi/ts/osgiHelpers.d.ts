/// <reference path="../../includes.d.ts" />
/**
 * @module Osgi
 */
declare module Osgi {
    var log: Logging.Logger;
    function defaultBundleValues(workspace: Workspace, $scope: any, values: any): any;
    function getStateStyle(prefix: string, state: string): string;
    function defaultServiceValues(workspace: Workspace, $scope: any, values: any): any;
    function defaultPackageValues(workspace: Workspace, $scope: any, values: any): any[];
    function defaultConfigurationValues(workspace: Workspace, $scope: any, values: any): any[];
    function parseActualPackages(packages: string[]): {};
    function parseManifestHeader(headers: {}, name: string): {};
    function toCollection(values: any): any;
    function labelBundleLinks(workspace: any, values: any, allValues: any): string;
    function bundleLinks(workspace: any, values: any): string;
    function pidLinks(workspace: any, values: any): string;
    /**
     * Finds a bundle by id
     *
     * @method findBundle
     * @for Osgi
     * @param {String} bundleId
     * @param {Array} values
     * @return {any}
     *
     */
    function findBundle(bundleId: any, values: any): string;
    function getSelectionBundleMBean(workspace: Workspace): string;
    /**
     * Walks the tree looking in the first child all the way down until we find an objectName
     * @method findFirstObjectName
     * @for Osgi
     * @param {Folder} node
     * @return {String}
     *
     */
    function findFirstObjectName(node: any): any;
    function getSelectionFrameworkMBean(workspace: Workspace): string;
    function getSelectionServiceMBean(workspace: Workspace): string;
    function getSelectionPackageMBean(workspace: Workspace): string;
    function getSelectionConfigAdminMBean(workspace: Workspace): string;
    function getMetaTypeMBean(workspace: Workspace): string;
    function getProfileMetadataMBean(workspace: Workspace): string;
    function getHawtioOSGiToolsMBean(workspace: Workspace): string;
    function getHawtioConfigAdminMBean(workspace: Workspace): string;
    /**
     * Creates a link to the given configuration pid and/or factoryPid
     */
    function createConfigPidLink($scope: any, workspace: any, pid: any, isFactory?: boolean): string;
    /**
     * Creates a path to the given configuration pid and/or factoryPid
     */
    function createConfigPidPath($scope: any, pid: any, isFactory?: boolean): string;
    /**
     * A helper method which initialises a scope's jolokia to refer to a profile's jolokia if used in a Fabric
     * or use a local jolokia
     */
    function initProfileScope($scope: any, $routeParams: any, $location: any, localStorage: any, jolokia: any, workspace: any, initFn?: any): void;
    function getConfigurationProperties(workspace: any, jolokia: any, pid: any, onDataFn: any): any;
    /**
     * For a pid of the form "foo.generatedId" for a pid "foo" or "foo.bar" remove the "foo." prefix
     */
    function removeFactoryPidPrefix(pid: any, factoryPid: any): any;
}
