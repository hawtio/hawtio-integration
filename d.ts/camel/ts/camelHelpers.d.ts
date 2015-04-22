/// <reference path="../../includes.d.ts" />
declare var _apacheCamelModel: any;
/**
 * @module Camel
 */
declare module Camel {
    var log: Logging.Logger;
    var jmxDomain: string;
    var defaultMaximumLabelWidth: number;
    var defaultCamelMaximumTraceOrDebugBodyLength: number;
    var defaultCamelTraceOrDebugIncludeStreams: boolean;
    var defaultCamelRouteMetricMaxSeconds: number;
    var defaultHideOptionDocumentation: boolean;
    var defaultHideOptionDefaultValue: boolean;
    var defaultHideOptionUnusedValue: boolean;
    var _apacheCamelModel: any;
    var _jsonSchema: any;
    /**
     * Does the given CamelContext has any rest services
     *
     * @param workspace
     * @param jolokia
     * @returns {boolean}
     */
    function hasRestServices(workspace: Workspace, jolokia: any): boolean;
    /**
     * Looks up the route XML for the given context and selected route and
     * processes the selected route's XML with the given function
     * @method processRouteXml
     * @param {Workspace} workspace
     * @param {Object} jolokia
     * @param {Folder} folder
     * @param {Function} onRoute
     */
    function processRouteXml(workspace: Workspace, jolokia: any, folder: any, onRoute: any): void;
    /**
     * Returns the URI string for the given EIP pattern node or null if it is not applicable
     * @method getRouteNodeUri
     * @param {Object} node
     * @return {String}
     */
    function getRouteNodeUri(node: any): string;
    /**
     * Returns the JSON data for the camel folder; extracting it from the associated
     * routeXmlNode or using the previously extracted and/or edited JSON
     * @method getRouteFolderJSON
     * @param {Folder} folder
     * @param {Object} answer
     * @return {Object}
     */
    function getRouteFolderJSON(folder: any, answer?: {}): any;
    function getRouteNodeJSON(routeXmlNode: any, answer?: {}): {};
    function increaseIndent(currentIndent: string, indentAmount?: string): string;
    function setRouteNodeJSON(routeXmlNode: any, newData: any, indent: any): void;
    function getRouteNodeIcon(nodeSettingsOrXmlNode: any): string;
    /**
     * Parse out the currently selected endpoint's name to be used when invoking on a
     * context operation that wants an endpoint name
     * @method getSelectedEndpointName
     * @param {Workspace} workspace
     * @return {any} either a string that is the endpoint name or null if it couldn't be parsed
     */
    function getSelectedEndpointName(workspace: Workspace): any;
    /**
     * Escapes the given URI text so it can be used in a JMX name
     */
    function escapeEndpointUriNameForJmx(uri: any): any;
    /**
     * Returns the mbean for the currently selected camel context and the name of the currently
     * selected endpoint for JMX operations on a context that require an endpoint name.
     * @method
     * @param workspace
     * @return {{uri: string, mbean: string}} either value could be null if there's a parse failure
     */
    function getContextAndTargetEndpoint(workspace: Workspace): {
        uri: any;
        mbean: string;
    };
    /**
     * Returns the cached Camel XML route node stored in the current tree selection Folder
     * @method
     */
    function getSelectedRouteNode(workspace: Workspace): any;
    /**
     * Flushes the cached Camel XML route node stored in the selected tree Folder
     * @method
     * @param workspace
     */
    function clearSelectedRouteNode(workspace: Workspace): void;
    /**
     * Looks up the given node name in the Camel schema
     * @method
     */
    function getCamelSchema(nodeIdOrDefinition: any): any;
    /**
     * Returns true if the given nodeId is a route, endpoint or pattern
     * (and not some nested type like a data format)
     * @method
     */
    function isCamelPattern(nodeId: any): boolean;
    /**
     * Returns true if the given node type prefers adding the next sibling as a child
     * @method
     */
    function isNextSiblingAddedAsChild(nodeIdOrDefinition: any): any;
    function acceptInput(nodeIdOrDefinition: any): any;
    function acceptOutput(nodeIdOrDefinition: any): any;
    /**
     * Looks up the Camel language settings for the given language name
     * @method
     */
    function camelLanguageSettings(nodeName: any): any;
    function isCamelLanguage(nodeName: any): boolean;
    /**
     * Converts the XML string or DOM node to a camel tree
     * @method
     */
    function loadCamelTree(xml: any, key: string): Folder;
    /**
     * Adds the route children to the given folder for each step in the route
     * @method
     */
    function addRouteChildren(folder: Folder, route: any): void;
    /**
     * Adds a child to the given folder / route
     * @method
     */
    function addRouteChild(folder: any, n: any): Folder;
    /**
     * Returns the root JMX Folder of the camel mbeans
     */
    function getRootCamelFolder(workspace: any): any;
    /**
     * Returns the JMX folder for the camel context
     */
    function getCamelContextFolder(workspace: any, camelContextId: any): any;
    /**
     * Returns the mbean for the given camel context ID or null if it cannot be found
     */
    function getCamelContextMBean(workspace: any, camelContextId: any): any;
    /**
     * Given a selection in the workspace try figure out the URL to the
     * full screen view
     */
    function linkToFullScreenView(workspace: any): string;
    /**
     * Returns the link to browse the endpoint full screen
     */
    function linkToBrowseEndpointFullScreen(contextId: any, endpointPath: any): string;
    /**
     * Returns the link to the route diagram full screen
     */
    function linkToRouteDiagramFullScreen(contextId: any, routeId: any): string;
    function getFolderCamelNodeId(folder: any): any;
    /**
     * Rebuilds the DOM tree from the tree node and performs all the various hacks
     * to turn the folder / JSON / model into valid camel XML
     * such as renaming language elements from <language expression="foo" language="bar/>
     * to <bar>foo</bar>
     * and changing <endpoint> into either <from> or <to>
     * @method
     * @param treeNode is either the Node from the tree widget (with the real Folder in the data property) or a Folder
     */
    function createFolderXmlTree(treeNode: any, xmlNode: any, indent?: string): any;
    function updateRouteNodeLabelAndTooltip(folder: any, routeXmlNode: any, nodeSettings: any): any;
    /**
     * Returns the selected camel context mbean for the given selection or null if it cannot be found
     * @method
     */
    function getSelectionCamelContextMBean(workspace: Core.Workspace): string;
    function getSelectionCamelContextEndpoints(workspace: Workspace): Core.NodeSelection;
    /**
     * Returns the selected camel trace mbean for the given selection or null if it cannot be found
     * @method
     */
    function getSelectionCamelTraceMBean(workspace: any): string;
    function getSelectionCamelDebugMBean(workspace: any): string;
    function getSelectionCamelTypeConverter(workspace: any): string;
    function getSelectionCamelRestRegistry(workspace: any): string;
    function getSelectionCamelInflightRepository(workspace: any): string;
    function getSelectionCamelRouteMetrics(workspace: any): string;
    function getContextId(workspace: Workspace): any;
    /**
     * Returns true if the state of the item begins with the given state - or one of the given states
     * @method
     * @param item the item which has a State
     * @param state a value or an array of states
     */
    function isState(item: any, state: any): any;
    function iconClass(state: string): string;
    function getSelectedRouteId(workspace: Workspace, folder?: any): any;
    /**
     * Returns the selected camel route mbean for the given route id
     * @method
     */
    function getSelectionRouteMBean(workspace: Workspace, routeId: String): string;
    function getCamelVersion(workspace: Workspace, jolokia: any): any;
    function createMessageFromXml(exchange: any): {
        headers: {};
        headerTypes: {};
        id: any;
        uid: string;
        timestamp: string;
        headerHtml: string;
    };
    function humanizeJavaType(type: String): String;
    function createBrowseGridOptions(): {
        selectedItems: any[];
        data: string;
        displayFooter: boolean;
        showFilter: boolean;
        showColumnMenu: boolean;
        enableColumnResize: boolean;
        enableColumnReordering: boolean;
        filterOptions: {
            filterText: string;
        };
        selectWithCheckboxOnly: boolean;
        showSelectionCheckbox: boolean;
        maintainColumnRatios: boolean;
        columnDefs: {
            field: string;
            displayName: string;
            cellTemplate: string;
        }[];
    };
    function loadRouteXmlNodes($scope: any, doc: any, selectedRouteId: any, nodes: any, links: any, width: any): void;
    function addRouteXmlChildren($scope: any, parent: any, nodes: any, links: any, parentId: any, parentX: any, parentY: any, parentNode?: any): any[];
    function getCanvasHeight(canvasDiv: any): any;
    /**
     * Recursively add all the folders which have a cid value into the given map
     * @method
     */
    function addFoldersToIndex(folder: Folder, map?: {}): {};
    /**
     * Re-generates the XML document using the given Tree widget Node or Folder as the source
     * @method
     */
    function generateXmlFromFolder(treeNode: any): any;
    /**
     * Returns an object of all the CamelContext MBeans keyed by their id
     * @method
     */
    function camelContextMBeansById(workspace: Workspace): {};
    /**
     * Returns an object of all the CamelContext MBeans keyed by the component name
     * @method
     */
    function camelContextMBeansByComponentName(workspace: Workspace): {};
    /**
     * Returns an object of all the CamelContext MBeans keyed by the route ID
     * @method
     */
    function camelContextMBeansByRouteId(workspace: Workspace): {};
    /**
     * Returns an object for the given processor from the Camel tree
     * @method
     */
    function camelProcessorMBeansById(workspace: Workspace): {};
    /**
     * Returns true if we should ignore ID values for labels in camel diagrams
     * @method
     */
    function ignoreIdForLabel(localStorage: any): boolean;
    /**
     * Returns the maximum width of a label before we start to truncate
     * @method
     */
    function maximumLabelWidth(localStorage: any): any;
    /**
     * Returns the max body length for tracer and debugger
     * @method
     */
    function maximumTraceOrDebugBodyLength(localStorage: any): any;
    /**
     * Returns whether to include streams body for tracer and debugger
     * @method
     */
    function traceOrDebugIncludeStreams(localStorage: any): boolean;
    /**
     * Returns true if we should show inflight counter in Camel route diagram
     * @method
     */
    function showInflightCounter(localStorage: any): boolean;
    /**
     * Returns the max value for seconds in the route metrics UI
     * @method
     */
    function routeMetricMaxSeconds(localStorage: any): any;
    /**
     * Whether to hide the documentation for the options
     * @method
     */
    function hideOptionDocumentation(localStorage: any): boolean;
    /**
     * Whether to hide options which uses default values
     * @method
     */
    function hideOptionDefaultValue(localStorage: any): boolean;
    /**
     * Whether to hide options which have unused/empty values
     * @method
     */
    function hideOptionUnusedValue(localStorage: any): boolean;
    /**
     * Function to highlight the selected toNode in the nodes graph
     *
     * @param nodes the nodes
     * @param toNode the node to highlight
     */
    function highlightSelectedNode(nodes: any, toNode: any): void;
    /**
     * Is the currently selected Camel version equal or greater than
     *
     * @param major   major version as number
     * @param minor   minor version as number
     */
    function isCamelVersionEQGT(major: any, minor: any, workspace: any, jolokia: any): boolean;
}
