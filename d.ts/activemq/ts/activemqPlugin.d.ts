/// <reference path="../../includes.d.ts" />
/// <reference path="activemqHelpers.d.ts" />
/**
 * @module ActiveMQ
 * @main ActiveMQ
 */
declare module ActiveMQ {
    var _module: ng.IModule;
    function getBroker(workspace: Workspace): Core.Folder;
    function isQueue(workspace: Workspace): boolean;
    function isTopic(workspace: Workspace): boolean;
    function isQueuesFolder(workspace: Workspace): boolean;
    function isTopicsFolder(workspace: Workspace): boolean;
    function isJobScheduler(workspace: Workspace): boolean;
    function isBroker(workspace: Workspace): boolean;
}
