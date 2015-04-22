/// <reference path="../../includes.d.ts" />
/// <reference path="dockerRegistryInterfaces.d.ts" />
declare module DockerRegistry {
    var context: string;
    var hash: string;
    var defaultRoute: string;
    var basePath: string;
    var templatePath: string;
    var pluginName: string;
    var log: Logging.Logger;
    var SEARCH_FRAGMENT: string;
    /**
     * Fetch the available docker images in the registry, can only
     * be called after app initialization
     */
    function getDockerImageRepositories(callback: (restURL: string, repositories: DockerImageRepositories) => void): void;
    function completeDockerRegistry(): ng.IPromise<{}>;
}
