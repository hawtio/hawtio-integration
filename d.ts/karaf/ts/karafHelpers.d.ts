/// <reference path="../../includes.d.ts" />
/**
 * @module Karaf
 */
declare module Karaf {
    var log: Logging.Logger;
    function setSelect(selection: any, group: any): any;
    function installRepository(workspace: any, jolokia: any, uri: any, success: any, error: any): void;
    function uninstallRepository(workspace: any, jolokia: any, uri: any, success: any, error: any): void;
    function installFeature(workspace: any, jolokia: any, feature: any, version: any, success: any, error: any): void;
    function uninstallFeature(workspace: any, jolokia: any, feature: any, version: any, success: any, error: any): void;
    function toCollection(values: any): any;
    function featureLinks(workspace: any, name: any, version: any): string;
    function extractFeature(attributes: any, name: any, version: any): any;
    function isPlatformBundle(symbolicName: string): boolean;
    function isActiveMQBundle(symbolicName: string): boolean;
    function isCamelBundle(symbolicName: string): boolean;
    function isCxfBundle(symbolicName: string): boolean;
    function populateFeaturesAndRepos(attributes: any, features: any, repositories: any): void;
    function createScrComponentsView(workspace: any, jolokia: any, components: any): any[];
    function getComponentStateDescription(state: any): string;
    function getAllComponents(workspace: any, jolokia: any): any;
    function getComponentByName(workspace: any, jolokia: any, componentName: any): any;
    function isComponentActive(workspace: any, jolokia: any, component: any): any;
    function getComponentState(workspace: any, jolokia: any, component: any): any;
    function activateComponent(workspace: any, jolokia: any, component: any, success: any, error: any): void;
    function deactivateComponent(workspace: any, jolokia: any, component: any, success: any, error: any): void;
    function populateDependencies(attributes: any, dependencies: any, features: any): void;
    function getSelectionFeaturesMBean(workspace: Workspace): string;
    function getSelectionScrMBean(workspace: Workspace): string;
}
