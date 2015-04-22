/// <reference path="../../includes.d.ts" />
declare module ActiveMQ {
    var pluginName: string;
    var log: Logging.Logger;
    var jmxDomain: string;
    function getSelectionQueuesFolder(workspace: any): any;
    function getSelectionTopicsFolder(workspace: any): any;
    /**
     * Sets $scope.row to currently selected JMS message.
     * Used in:
     *  - activemq/js/browse.ts
     *  - camel/js/browseEndpoint.ts
     *
     * TODO: remove $scope argument and operate directly on other variables. but it's too much side effects here...
     *
     * @param message
     * @param key unique key inside message that distinguishes between values
     * @param $scope
     */
    function selectCurrentMessage(message: any, key: string, $scope: any): void;
    /**
     * - Adds functions needed for message browsing with details
     * - Adds a watch to deselect all rows after closing the slideout with message details
     * TODO: export these functions too?
     *
     * @param $scope
     */
    function decorate($scope: any): void;
}
