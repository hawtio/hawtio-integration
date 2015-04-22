/// <reference path="../../includes.d.ts" />
/**
 * @module Maven
 */
declare module Maven {
    var log: Logging.Logger;
    /**
     * Returns the maven indexer mbean (from the hawtio-maven-indexer library)
     * @method getMavenIndexerMBean
     * @for Maven
     * @param {Core.Workspace} workspace
     * @return {String}
     */
    function getMavenIndexerMBean(workspace: Workspace): any;
    function getAetherMBean(workspace: Workspace): any;
    function mavenLink(url: any): string;
    function getName(row: any): string;
    function completeMavenUri($q: any, $scope: any, workspace: any, jolokia: any, query: any): any;
    function completeVersion(mbean: any, $q: any, $scope: any, workspace: any, jolokia: any, groupId: any, artifactId: any, partial: any, packaging: any, classifier: any): any;
    function completeArtifactId(mbean: any, $q: any, $scope: any, workspace: any, jolokia: any, groupId: any, partial: any, packaging: any, classifier: any): any;
    function completeGroupId(mbean: any, $q: any, $scope: any, workspace: any, jolokia: any, partial: any, packaging: any, classifier: any): any;
    function addMavenFunctions($scope: any, workspace: any): void;
}
