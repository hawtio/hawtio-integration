/// <reference types="jmx" />
/// <reference types="angular" />
/// <reference types="core" />
/// <reference types="angular-mocks" />
/// <reference types="angular-route" />
declare namespace Pf {
    function filter(items: object[], filterConfig: any): object[];
}
declare namespace ActiveMQ {
    const pluginName: string;
    const log: Logging.Logger;
    const jmxDomain: string;
    function retrieveQueueNames(workspace: Jmx.Workspace, ascend: boolean): string[];
    function retrieveTopicNames(workspace: Jmx.Workspace, ascend: boolean): string[];
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
     * @param fn optional function to call if the selected row was changed
     */
    function decorate($scope: any, fn?: any): void;
    function getBrokerMBean(workspace: Jmx.Workspace, jolokia: any, jmxDomain: string): any;
}
declare namespace ActiveMQ {
    class DestinationController {
        private $scope;
        private workspace;
        private $location;
        private jolokia;
        private localStorage;
        amqJmxDomain: any;
        message: string;
        destinationName: string;
        destinationType: string;
        createDialog: boolean;
        deleteDialog: boolean;
        purgeDialog: boolean;
        constructor($scope: any, workspace: Jmx.Workspace, $location: ng.ILocationService, jolokia: Jolokia.IJolokia, localStorage: Storage);
        private operationSuccess();
        private deleteSuccess();
        private validateDestinationName(name);
        private isQueue(destinationType);
        private checkIfDestinationExists(name, destinationType);
        validateAndCreateDestination(name: string, destinationType: string): void;
        private createDestination(name, destinationType);
        /**
         * When destination name contains "_" like "aaa_bbb", the actual name might be either
         * "aaa_bbb" or "aaa:bbb", so the actual name needs to be checked before removal.
         * @param name destination name
         */
        private restoreRealDestinationName(name);
        deleteDestination(): void;
        purgeDestination(): void;
        selectedName(): string;
        uncapitalisedDestinationType(): string;
    }
}
declare namespace ActiveMQ {
    const createDestinationComponent: angular.IComponentOptions;
    const deleteQueueComponent: angular.IComponentOptions;
    const deleteTopicComponent: angular.IComponentOptions;
}
declare namespace ActiveMQ {
    const destinationModule: string;
}
declare namespace ActiveMQ {
    class TreeController {
        private $scope;
        private $location;
        private workspace;
        private $element;
        constructor($scope: any, $location: ng.ILocationService, workspace: Jmx.Workspace, $element: JQuery);
        $onInit(): void;
        treeFetched(): boolean;
        private updateSelectionFromURL();
        private populateTree();
        private removeTree();
    }
}
declare namespace ActiveMQ {
    class TreeHeaderController {
        private $scope;
        private $element;
        filter: string;
        result: any[];
        constructor($scope: any, $element: JQuery);
        $onInit(): void;
        private search(filter);
        private tree();
        expandAll(): any;
        contractAll(): any;
    }
}
declare namespace ActiveMQ {
    const treeHeaderComponent: angular.IComponentOptions;
    const treeComponent: angular.IComponentOptions;
}
declare namespace ActiveMQ {
    const treeModule: string;
    const treeElementId = "#activemqtree";
}
declare namespace ActiveMQ {
    const _module: angular.IModule;
}
declare namespace ActiveMQ {
    class ActiveMQNavigationService {
        private workspace;
        private configManager;
        constructor(workspace: Jmx.Workspace, configManager: Core.ConfigManager);
        getTabs(): Nav.HawtioTab[];
        private shouldShowBrowseTab();
        private shouldShowSendTab();
        private shouldShowDurableSubscribersTab();
        private shouldShowJobsTab();
        private shouldShowCreateTab();
        private shouldShowDeleteTopicTab();
        private shouldShowDeleteQueueTab();
        private shouldShowQueuesTab();
        private shouldShowTopicsTab();
        private isQueue();
        private isTopic();
        private isQueuesFolder();
        private isTopicsFolder();
        private isJobScheduler();
        private isBroker();
        private getBroker();
    }
}
declare namespace ActiveMQ {
    class ActiveMQNavigationController {
        private $location;
        private activeMQNavigationService;
        tabs: Nav.HawtioTab[];
        constructor($scope: ng.IScope, $location: ng.ILocationService, activeMQNavigationService: ActiveMQNavigationService);
        $onInit(): void;
        goto(tab: Nav.HawtioTab): void;
    }
    const activeMQNavigationComponent: angular.IComponentOptions;
}
declare namespace ActiveMQ {
    var BrowseQueueController: angular.IModule;
}
declare namespace ActiveMQ {
}
declare namespace ActiveMQ {
}
declare namespace ActiveMQ {
}
declare namespace ActiveMQ {
}
declare namespace Camel {
    class Context {
        name: string;
        state: string;
        mbeanName: string;
        selected: boolean;
        constructor(name: string, state: string, mbeanName: string);
        isStarted(): boolean;
        isSuspended(): boolean;
    }
}
declare namespace Camel {
    class ContextsService {
        private jolokiaService;
        private treeService;
        constructor(jolokiaService: JVM.JolokiaService, treeService: Jmx.TreeService);
        getContexts(): ng.IPromise<Context[]>;
        getContext(mbeanName: string): ng.IPromise<Context>;
        startContext(context: Context): ng.IPromise<any>;
        startContexts(contexts: Context[]): ng.IPromise<any[]>;
        suspendContext(context: Context): ng.IPromise<any>;
        suspendContexts(contexts: Context[]): ng.IPromise<any[]>;
        stopContext(context: Context): ng.IPromise<any>;
        stopContexts(contexts: Context[]): ng.IPromise<any[]>;
        executeOperationOnContext(operation: string, context: Context): ng.IPromise<any>;
        executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<any[]>;
    }
}
declare namespace Camel {
    class ContextsController {
        private $uibModal;
        private workspace;
        private contextsService;
        private startAction;
        private suspendAction;
        private deleteAction;
        toolbarConfig: {
            actionsConfig: {
                primaryActions: {
                    name: string;
                    actionFn: (action: any) => void;
                    isDisabled: boolean;
                }[];
                moreActions: {
                    name: string;
                    actionFn: (action: any) => void;
                    isDisabled: boolean;
                }[];
            };
            isTableView: boolean;
        };
        tableConfig: {
            selectionMatchProp: string;
            onCheckBoxChange: (item: any) => void;
        };
        tableColumns: {
            header: string;
            itemField: string;
        }[];
        contexts: Context[];
        constructor($uibModal: any, workspace: Jmx.Workspace, contextsService: ContextsService);
        $onInit(): void;
        private getSelectedContexts();
        private enableDisableActions();
        private updateContexts();
        private removeSelectedContexts();
    }
    const contextsComponent: angular.IComponentOptions;
}
declare namespace Camel {
    class ContextActionsController {
        private $scope;
        private $uibModal;
        private $timeout;
        private workspace;
        private contextsService;
        context: Context;
        unsubscribe: any;
        constructor($scope: any, $uibModal: any, $timeout: ng.ITimeoutService, workspace: Jmx.Workspace, contextsService: ContextsService);
        $onInit(): void;
        $onDestroy(): void;
        isVisible(): boolean;
        start(): void;
        suspend(): void;
        delete(): void;
    }
    const contextActionsComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const contextsModule: string;
}
declare namespace Camel {
    class EndpointsStatisticsService {
        private jolokiaService;
        private treeService;
        constructor(jolokiaService: JVM.JolokiaService, treeService: Jmx.TreeService);
        getStatistics(): ng.IPromise<any[]>;
    }
}
declare namespace Camel {
    class EndpointsStatisticsController {
        private endpointsStatisticsService;
        allItems: any[];
        filteredItems: any[];
        toolbarConfig: {
            filterConfig: {
                fields: {
                    id: string;
                    title: string;
                    placeholder: string;
                    filterType: string;
                }[];
                onFilterChange: (filters: any[]) => void;
                appliedFilters: any[];
                resultsCount: number;
            };
            isTableView: boolean;
        };
        tableConfig: {
            selectionMatchProp: string;
            showCheckboxes: boolean;
        };
        tableDtOptions: {
            order: (string | number)[][];
        };
        tableColumns: {
            itemField: string;
            header: string;
        }[];
        constructor(endpointsStatisticsService: EndpointsStatisticsService);
        $onInit(): void;
    }
    const endpointsStatisticsComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const endpointsStatisticsModule: string;
}
declare namespace Camel {
    class Endpoint {
        uri: string;
        state: string;
        mbean: string;
        constructor(uri: string, state: string, mbean: string);
    }
}
declare namespace Camel {
    class EndpointsService {
        private $q;
        private jolokiaService;
        private workspace;
        constructor($q: ng.IQService, jolokiaService: JVM.JolokiaService, workspace: Jmx.Workspace);
        getEndpoints(): ng.IPromise<Endpoint[]>;
        canCreateEndpoints(): boolean;
    }
}
declare namespace Camel {
    class EndpointsController {
        private $location;
        private endpointsService;
        private addAction;
        toolbarConfig: {
            actionsConfig: {
                primaryActions: {
                    name: string;
                    actionFn: (action: any) => void;
                    isDisabled: boolean;
                }[];
            };
            isTableView: boolean;
        };
        tableConfig: {
            selectionMatchProp: string;
            showCheckboxes: boolean;
        };
        tableDtOptions: {
            order: (string | number)[][];
        };
        tableColumns: {
            header: string;
            itemField: string;
        }[];
        endpoints: Endpoint[];
        constructor($location: ng.ILocationService, endpointsService: EndpointsService);
        $onInit(): void;
    }
    const endpointsComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const endpointsModule: string;
}
declare namespace Camel {
    const exchangesComponent: angular.IComponentOptions;
}
declare namespace Camel {
    class ExchangesService {
        private jolokiaService;
        private treeService;
        private workspace;
        constructor(jolokiaService: JVM.JolokiaService, treeService: Jmx.TreeService, workspace: Jmx.Workspace);
        getInflightExchanges(): ng.IPromise<any[]>;
        getBlockedExchanges(): ng.IPromise<any[]>;
        private getExchanges(serviceName);
        unblockExchange(exchange: any): angular.IPromise<any>;
    }
}
declare namespace Camel {
    class InflightExchangesController {
        private $timeout;
        private exchangesService;
        readonly reloadDelay: number;
        exchanges: any[];
        promise: ng.IPromise<any>;
        constructor($timeout: ng.ITimeoutService, exchangesService: ExchangesService);
        $onInit(): void;
        $onDestroy(): void;
        loadDataPeriodically(): void;
        cancelTimer(): void;
    }
    const inflightExchangesComponent: angular.IComponentOptions;
}
declare namespace Camel {
    class BlockedExchangesController {
        private $timeout;
        private $uibModal;
        private exchangesService;
        readonly reloadDelay: number;
        exchanges: any[];
        promise: ng.IPromise<any>;
        constructor($timeout: ng.ITimeoutService, $uibModal: any, exchangesService: ExchangesService);
        $onInit(): void;
        $onDestroy(): void;
        loadDataPeriodically(): void;
        cancelTimer(): void;
        unblock(exchange: any): void;
    }
    const blockedExchangesComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const confirmUnblockExchangeComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const exchangesModule: string;
}
declare namespace Camel {
    class Route {
        name: string;
        state: string;
        mbean: string;
        selected: boolean;
        constructor(name: string, state: string, mbean: string);
        isStarted(): boolean;
        isStopped(): boolean;
    }
}
declare namespace Camel {
    class RoutesService {
        private jolokiaService;
        constructor(jolokiaService: JVM.JolokiaService);
        getRoute(objectName: string): ng.IPromise<Route>;
        getRoutes(objectNames: string[]): ng.IPromise<Route[]>;
        startRoute(route: Route): ng.IPromise<any>;
        startRoutes(routes: Route[]): ng.IPromise<any>;
        stopRoute(route: Route): ng.IPromise<any>;
        stopRoutes(routes: Route[]): ng.IPromise<any>;
        removeRoute(route: Route): ng.IPromise<any>;
        removeRoutes(routes: Route[]): ng.IPromise<any>;
        executeOperationOnRoutes(operation: string, routes: Route[]): ng.IPromise<any>;
    }
}
declare namespace Camel {
    class RoutesController {
        private $uibModal;
        private workspace;
        private treeService;
        private routesService;
        private startAction;
        private stopAction;
        private deleteAction;
        toolbarConfig: {
            actionsConfig: {
                primaryActions: {
                    name: string;
                    actionFn: (action: any) => void;
                    isDisabled: boolean;
                }[];
                moreActions: {
                    name: string;
                    actionFn: (action: any) => void;
                    isDisabled: boolean;
                }[];
            };
            isTableView: boolean;
        };
        tableConfig: {
            selectionMatchProp: string;
            onCheckBoxChange: (item: any) => void;
        };
        tableColumns: {
            header: string;
            itemField: string;
        }[];
        routes: Route[];
        constructor($uibModal: any, workspace: Jmx.Workspace, treeService: Jmx.TreeService, routesService: RoutesService);
        $onInit(): void;
        private getSelectedRoutes();
        private enableDisableActions();
        private loadRoutes();
        private updateRoutes();
        private removeSelectedRoutes();
    }
    const routesComponent: angular.IComponentOptions;
}
declare namespace Camel {
    class RouteActionsController {
        private $scope;
        private $uibModal;
        private $timeout;
        private workspace;
        private routesService;
        route: Route;
        constructor($scope: any, $uibModal: any, $timeout: ng.ITimeoutService, workspace: Jmx.Workspace, routesService: RoutesService);
        isVisible(): boolean;
        start(): void;
        stop(): void;
        delete(): void;
    }
    const routeActionsComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const routesModule: string;
}
declare namespace Camel {
    class TreeController {
        private $scope;
        private $location;
        private workspace;
        private jolokia;
        private $element;
        constructor($scope: any, $location: ng.ILocationService, workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia, $element: JQuery);
        $onInit(): void;
        treeFetched(): boolean;
        private updateSelectionFromURL();
        private populateTree();
        private removeTree();
    }
}
declare namespace Camel {
    class TreeHeaderController {
        private $scope;
        private $element;
        filter: string;
        result: any[];
        constructor($scope: any, $element: JQuery);
        $onInit(): void;
        private search(filter);
        private tree();
        expandAll(): any;
        contractAll(): any;
    }
}
declare namespace Camel {
    const treeHeaderComponent: angular.IComponentOptions;
    const treeComponent: angular.IComponentOptions;
}
declare namespace Camel {
    const treeModule: string;
    const treeElementId = "#cameltree";
}
declare namespace Camel {
    /**
     * Define the default categories for endpoints and map them to endpoint names
     * @property
     * @for Camel
     * @type {Object}
     */
    var endpointCategories: {
        bigdata: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        database: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        cloud: {
            label: string;
            endpoints: string[];
        };
        core: {
            label: string;
            endpoints: string[];
        };
        messaging: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        mobile: {
            label: string;
            endpoints: string[];
        };
        sass: {
            label: string;
            endpoints: string[];
        };
        social: {
            label: string;
            endpoints: string[];
        };
        storage: {
            label: string;
            endpointIcon: string;
            endpoints: string[];
        };
        template: {
            label: string;
            endpoints: string[];
        };
    };
    /**
     * Maps endpoint names to a category object
     * @property
     * @for Camel
     * @type {Object}
     */
    var endpointToCategory: {};
    var endpointIcon: string;
    /**
     *  specify custom label & icon properties for endpoint names
     * @property
     * @for Camel
     * @type {Object}
     */
    var endpointConfigurations: {
        drools: {
            icon: string;
        };
        quartz: {
            icon: string;
        };
        facebook: {
            icon: string;
        };
        salesforce: {
            icon: string;
        };
        sap: {
            icon: string;
        };
        "sap-netweaver": {
            icon: string;
        };
        timer: {
            icon: string;
        };
        twitter: {
            icon: string;
        };
        weather: {
            icon: string;
        };
    };
    /**
     * Define the default form configurations
     * @property
     * @for Camel
     * @type {Object}
     */
    var endpointForms: {
        file: {
            tabs: {
                'Options': string[];
            };
        };
        activemq: {
            tabs: {
                'Connection': string[];
                'Producer': string[];
                'Consumer': string[];
                'Reply': string[];
                'Options': string[];
            };
        };
    };
    function getEndpointIcon(endpointName: any): any;
    function getEndpointConfig(endpointName: any, category: any): any;
    function getEndpointCategory(endpointName: string): any;
    function getConfiguredCamelModel(): any;
    function initEndpointChooserScope($scope: any, $location: any, localStorage: Storage, workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia): void;
}
declare var _apacheCamelModel: any;
declare namespace Camel {
    const pluginName: string;
    const log: Logging.Logger;
    const jmxDomain: string;
    const defaultMaximumLabelWidth = 34;
    const defaultCamelMaximumTraceOrDebugBodyLength = 5000;
    const defaultCamelTraceOrDebugIncludeStreams: boolean;
    const defaultCamelRouteMetricMaxSeconds = 10;
    const defaultHideOptionDocumentation: boolean;
    const defaultHideOptionDefaultValue: boolean;
    const defaultHideOptionUnusedValue: boolean;
    var _apacheCamelModel: any;
    /**
     * Returns if the given CamelContext has any rest services
     *
     * @param workspace
     * @param jolokia
     * @returns {boolean}
     */
    function hasRestServices(workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia): boolean;
    /**
     * Looks up the route XML for the given context and selected route and
     * processes the selected route's XML with the given function
     * @method processRouteXml
     * @param {Workspace} workspace
     * @param {Object} jolokia
     * @param {Folder} folder
     * @param {Function} onRoute
     */
    function processRouteXml(workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia, folder: Jmx.Folder, onRoute: (route: Element) => void): void;
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
    function getSelectedEndpointName(workspace: Jmx.Workspace): any;
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
    function getContextAndTargetEndpoint(workspace: Jmx.Workspace): {
        uri: any;
        mbean: string;
    };
    /**
     * Returns the cached Camel XML route node stored in the current tree selection Folder
     * @method
     */
    function getSelectedRouteNode(workspace: Jmx.Workspace): any;
    /**
     * Returns true when the selected node is a Camel XML route node, false otherwise.
     * @method
     */
    function isRouteNode(workspace: Jmx.Workspace): boolean;
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
     * Looks up the Camel language settings for the given language name
     * @method
     */
    function camelLanguageSettings(nodeName: any): any;
    function isCamelLanguage(nodeName: any): boolean;
    /**
     * Adds the route children to the given folder for each step in the route
     * @method
     */
    function loadRouteChildren(folder: Jmx.Folder, route: Element): Jmx.NodeSelection[];
    /**
     * Returns the root JMX Folder of the camel mbeans
     */
    function getRootCamelFolder(workspace: Jmx.Workspace): Jmx.Folder;
    /**
     * Returns the JMX folder for the camel context
     */
    function getCamelContextFolder(workspace: Jmx.Workspace, camelContextId: string): Jmx.Folder;
    /**
     * Returns the mbean for the given camel context ID or null if it cannot be found
     */
    function getCamelContextMBean(workspace: Jmx.Workspace, camelContextId: any): string | null;
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
    function updateRouteNodeLabelAndTooltip(folder: Jmx.Folder, routeXmlNode: any, nodeSettings: any): any;
    /**
     * Returns the selected camel context object name for the given selection or null if it cannot be found
     * @method
     */
    function getSelectionCamelContextMBean(workspace: Jmx.Workspace): string;
    /**
     * Returns the selected camel context object name for the given selection or null if it cannot be found
     * @method
     */
    function getSelectionCamelContext(workspace: Jmx.Workspace): Jmx.NodeSelection;
    /**
     * When lazy loading route info (using dumpRoutesAsXml() operation) we need MBean name from the folder
     * and *not* from the selection
     * @param {Workspace} workspace
     * @param {Folder} folder
     */
    function getExpandingFolderCamelContextMBean(workspace: Jmx.Workspace, folder: Jmx.Folder): string;
    function getSelectionCamelContextEndpoints(workspace: Jmx.Workspace): Jmx.NodeSelection;
    /**
     * Returns the selected camel trace mbean for the given selection or null if it cannot be found
     * @method
     */
    function getSelectionCamelTraceMBean(workspace: Jmx.Workspace): string;
    function getSelectionCamelDebugMBean(workspace: Jmx.Workspace): string;
    function getSelectionCamelTypeConverter(workspace: Jmx.Workspace): string;
    function getSelectionCamelRestRegistry(workspace: Jmx.Workspace): string;
    function getSelectionCamelEndpointRuntimeRegistry(workspace: Jmx.Workspace): string;
    function getSelectionCamelInflightRepository(workspace: Jmx.Workspace): string;
    function getSelectionCamelBlockedExchanges(workspace: Jmx.Workspace): string;
    function getSelectionCamelRouteMetrics(workspace: Jmx.Workspace): string;
    function getContextId(workspace: Jmx.Workspace): string;
    function iconClass(state: string): "green fa fa-play-circle" | "fa fa-pause" | "orange fa fa-off";
    function getSelectedRouteId(workspace: Jmx.Workspace, folder?: Jmx.NodeSelection): any;
    /**
     * Returns the selected camel route mbean for the given route id
     * @method
     */
    function getSelectionRouteMBean(workspace: Jmx.Workspace, routeId: String): string;
    function getCamelVersion(workspace: Jmx.Workspace, jolokia: any): string;
    function createMessageFromXml(exchange: any): {
        headers: {};
        headerTypes: {};
        id: any;
        uid: string;
        timestamp: string;
        headerHtml: string;
    };
    function humanizeJavaType(type: string): string;
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
    /**
     * Returns an object of all the CamelContext MBeans keyed by their id
     * @method
     */
    function camelContextMBeansById(workspace: Jmx.Workspace): {
        [id: string]: Jmx.Folder;
    };
    /**
     * Returns an object of all the CamelContext MBeans keyed by the component name
     * @method
     */
    function camelContextMBeansByComponentName(workspace: Jmx.Workspace): {};
    /**
     * Returns an object of all the CamelContext MBeans keyed by the route ID
     * @method
     */
    function camelContextMBeansByRouteId(workspace: Jmx.Workspace): {};
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
    /**
     * Determines whether the endpoint supports browse operations
     * @param endpoint The selected endpoint JMX tree node
     */
    function isBrowsableEndpoint(endpoint: Jmx.NodeSelection): boolean;
}
declare namespace Camel {
    class CamelTreeService {
        private treeService;
        constructor(treeService: Jmx.TreeService);
        getSelectedRouteId(): ng.IPromise<string>;
    }
}
declare namespace Camel {
    const _module: angular.IModule;
}
declare namespace Camel {
    var BrowseEndpointController: angular.IModule;
}
declare namespace Camel {
    class CamelNavigationService {
        private workspace;
        private jolokia;
        private hasRestServices;
        constructor(workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia);
        getTabs(): Nav.HawtioTab[];
    }
}
declare namespace Camel {
    class CamelNavigationController {
        private $scope;
        private $location;
        private camelNavigationService;
        private workspace;
        private tabs;
        constructor($scope: ng.IScope, $location: ng.ILocationService, camelNavigationService: CamelNavigationService, workspace: Jmx.Workspace);
        $onInit(): void;
        goto(tab: Nav.HawtioTab): void;
    }
    const camelNavigationComponent: angular.IComponentOptions;
}
declare namespace Camel {
    var camelHeaderSchema: {
        definitions: {
            headers: {
                properties: {
                    "CamelAuthentication": {
                        type: string;
                    };
                    "CamelAuthenticationFailurePolicyId": {
                        type: string;
                    };
                    "CamelAcceptContentType": {
                        type: string;
                    };
                    "CamelAggregatedSize": {
                        type: string;
                    };
                    "CamelAggregatedTimeout": {
                        type: string;
                    };
                    "CamelAggregatedCompletedBy": {
                        type: string;
                    };
                    "CamelAggregatedCorrelationKey": {
                        type: string;
                    };
                    "CamelAggregationStrategy": {
                        type: string;
                    };
                    "CamelAggregationCompleteAllGroups": {
                        type: string;
                    };
                    "CamelAggregationCompleteAllGroupsInclusive": {
                        type: string;
                    };
                    "CamelAsyncWait": {
                        type: string;
                    };
                    "CamelBatchIndex": {
                        type: string;
                    };
                    "CamelBatchSize": {
                        type: string;
                    };
                    "CamelBatchComplete": {
                        type: string;
                    };
                    "CamelBeanMethodName": {
                        type: string;
                    };
                    "CamelBeanMultiParameterArray": {
                        type: string;
                    };
                    "CamelBinding": {
                        type: string;
                    };
                    "breadcrumbId": {
                        type: string;
                    };
                    "CamelCharsetName": {
                        type: string;
                    };
                    "CamelCreatedTimestamp": {
                        type: string;
                    };
                    "Content-Encoding": {
                        type: string;
                    };
                    "Content-Length": {
                        type: string;
                    };
                    "Content-Type": {
                        type: string;
                    };
                    "CamelCorrelationId": {
                        type: string;
                    };
                    "CamelDataSetIndex": {
                        type: string;
                    };
                    "org.apache.camel.default.charset": {
                        type: string;
                    };
                    "CamelDestinationOverrideUrl": {
                        type: string;
                    };
                    "CamelDisableHttpStreamCache": {
                        type: string;
                    };
                    "CamelDuplicateMessage": {
                        type: string;
                    };
                    "CamelExceptionCaught": {
                        type: string;
                    };
                    "CamelExceptionHandled": {
                        type: string;
                    };
                    "CamelEvaluateExpressionResult": {
                        type: string;
                    };
                    "CamelErrorHandlerHandled": {
                        type: string;
                    };
                    "CamelExternalRedelivered": {
                        type: string;
                    };
                    "CamelFailureHandled": {
                        type: string;
                    };
                    "CamelFailureEndpoint": {
                        type: string;
                    };
                    "CamelFailureRouteId": {
                        type: string;
                    };
                    "CamelFilterNonXmlChars": {
                        type: string;
                    };
                    "CamelFileLocalWorkPath": {
                        type: string;
                    };
                    "CamelFileName": {
                        type: string;
                    };
                    "CamelFileNameOnly": {
                        type: string;
                    };
                    "CamelFileNameProduced": {
                        type: string;
                    };
                    "CamelFileNameConsumed": {
                        type: string;
                    };
                    "CamelFilePath": {
                        type: string;
                    };
                    "CamelFileParent": {
                        type: string;
                    };
                    "CamelFileLastModified": {
                        type: string;
                    };
                    "CamelFileLength": {
                        type: string;
                    };
                    "CamelFilterMatched": {
                        type: string;
                    };
                    "CamelFileLockFileAcquired": {
                        type: string;
                    };
                    "CamelFileLockFileName": {
                        type: string;
                    };
                    "CamelGroupedExchange": {
                        type: string;
                    };
                    "CamelHttpBaseUri": {
                        type: string;
                    };
                    "CamelHttpCharacterEncoding": {
                        type: string;
                    };
                    "CamelHttpMethod": {
                        type: string;
                    };
                    "CamelHttpPath": {
                        type: string;
                    };
                    "CamelHttpProtocolVersion": {
                        type: string;
                    };
                    "CamelHttpQuery": {
                        type: string;
                    };
                    "CamelHttpResponseCode": {
                        type: string;
                    };
                    "CamelHttpUri": {
                        type: string;
                    };
                    "CamelHttpUrl": {
                        type: string;
                    };
                    "CamelHttpChunked": {
                        type: string;
                    };
                    "CamelHttpServletRequest": {
                        type: string;
                    };
                    "CamelHttpServletResponse": {
                        type: string;
                    };
                    "CamelInterceptedEndpoint": {
                        type: string;
                    };
                    "CamelInterceptSendToEndpointWhenMatched": {
                        type: string;
                    };
                    "CamelLanguageScript": {
                        type: string;
                    };
                    "CamelLogDebugBodyMaxChars": {
                        type: string;
                    };
                    "CamelLogDebugStreams": {
                        type: string;
                    };
                    "CamelLoopIndex": {
                        type: string;
                    };
                    "CamelLoopSize": {
                        type: string;
                    };
                    "CamelMaximumCachePoolSize": {
                        type: string;
                    };
                    "CamelMaximumEndpointCacheSize": {
                        type: string;
                    };
                    "CamelMessageHistory": {
                        type: string;
                    };
                    "CamelMulticastIndex": {
                        type: string;
                    };
                    "CamelMulticastComplete": {
                        type: string;
                    };
                    "CamelNotifyEvent": {
                        type: string;
                    };
                    "CamelOnCompletion": {
                        type: string;
                    };
                    "CamelOverruleFileName": {
                        type: string;
                    };
                    "CamelParentUnitOfWork": {
                        type: string;
                    };
                    "CamelRecipientListEndpoint": {
                        type: string;
                    };
                    "CamelReceivedTimestamp": {
                        type: string;
                    };
                    "CamelRedelivered": {
                        type: string;
                    };
                    "CamelRedeliveryCounter": {
                        type: string;
                    };
                    "CamelRedeliveryMaxCounter": {
                        type: string;
                    };
                    "CamelRedeliveryExhausted": {
                        type: string;
                    };
                    "CamelRedeliveryDelay": {
                        type: string;
                    };
                    "CamelRollbackOnly": {
                        type: string;
                    };
                    "CamelRollbackOnlyLast": {
                        type: string;
                    };
                    "CamelRouteStop": {
                        type: string;
                    };
                    "CamelSoapAction": {
                        type: string;
                    };
                    "CamelSkipGzipEncoding": {
                        type: string;
                    };
                    "CamelSlipEndpoint": {
                        type: string;
                    };
                    "CamelSplitIndex": {
                        type: string;
                    };
                    "CamelSplitComplete": {
                        type: string;
                    };
                    "CamelSplitSize": {
                        type: string;
                    };
                    "CamelTimerCounter": {
                        type: string;
                    };
                    "CamelTimerFiredTime": {
                        type: string;
                    };
                    "CamelTimerName": {
                        type: string;
                    };
                    "CamelTimerPeriod": {
                        type: string;
                    };
                    "CamelTimerTime": {
                        type: string;
                    };
                    "CamelToEndpoint": {
                        type: string;
                    };
                    "CamelTraceEvent": {
                        type: string;
                    };
                    "CamelTraceEventNodeId": {
                        type: string;
                    };
                    "CamelTraceEventTimestamp": {
                        type: string;
                    };
                    "CamelTraceEventExchange": {
                        type: string;
                    };
                    "Transfer-Encoding": {
                        type: string;
                    };
                    "CamelUnitOfWorkExhausted": {
                        type: string;
                    };
                    "CamelUnitOfWorkProcessSync": {
                        type: string;
                    };
                    "CamelXsltFileName": {
                        type: string;
                    };
                };
            };
        };
    };
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
    var jmsHeaderSchema: {
        definitions: {
            headers: {
                properties: {
                    JMSCorrelationID: {
                        type: string;
                    };
                    JMSDeliveryMode: {
                        "type": string;
                        "enum": string[];
                    };
                    JMSDestination: {
                        type: string;
                    };
                    JMSExpiration: {
                        type: string;
                    };
                    JMSPriority: {
                        type: string;
                    };
                    JMSReplyTo: {
                        type: string;
                    };
                    JMSType: {
                        type: string;
                    };
                    JMSXGroupId: {
                        type: string;
                    };
                    AMQ_SCHEDULED_CRON: {
                        type: string;
                    };
                    AMQ_SCHEDULED_DELAY: {
                        type: string;
                    };
                    AMQ_SCHEDULED_PERIOD: {
                        type: string;
                    };
                    AMQ_SCHEDULED_REPEAT: {
                        type: string;
                    };
                };
            };
            "javax.jms.Destination": {
                type: string;
            };
        };
    };
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
    function createGraphStates(nodes: any, links: any, transitions: any): any;
    function dagreLayoutGraph(nodes: any, links: any, svgElement: any, allowDrag?: boolean, onClick?: any): {
        nodes: any;
        graph: graphlib.Graph;
    };
    function dagreUpdateGraphData(): void;
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
    class Property {
        name: string;
        value: string;
        description: string;
        constructor(name: string, value: string, description: string);
        static sortByName(a: any, b: any): 0 | 1 | -1;
    }
}
declare namespace Camel {
    class PropertiesService {
        getDefinedProperties(schemaProperties: {}): Property[];
        getDefaultProperties(schemaProperties: {}): Property[];
        getUndefinedProperties(schemaProperties: {}): Property[];
    }
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Camel {
}
declare namespace Karaf {
    const pluginName: string;
    const log: Logging.Logger;
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
    function getComponentStateDescription(state: any): "Active" | "Enabled" | "Unsatisfied" | "Activating" | "Registered" | "Factory" | "Deactivating" | "Destroying" | "Disabling" | "Disposing" | "Unknown";
    function getAllComponents(workspace: any, jolokia: any): any;
    function getComponentByName(workspace: any, jolokia: any, componentName: any): any;
    function isComponentActive(workspace: any, jolokia: any, component: any): any;
    function getComponentState(workspace: any, jolokia: any, component: any): any;
    function activateComponent(workspace: any, jolokia: any, component: any, success: any, error: any): void;
    function deactivateComponent(workspace: any, jolokia: any, component: any, success: any, error: any): void;
    function populateDependencies(attributes: any, dependencies: any, features: any): void;
    function getSelectionFeaturesMBean(workspace: Jmx.Workspace): string;
    function getSelectionScrMBean(workspace: Jmx.Workspace): string;
}
declare namespace Karaf {
    class Feature {
        id: string;
        name: string;
        version: string;
        installed: boolean;
        repositoryName: string;
        repositoryUri: string;
        constructor(name: string, version: string, installed: boolean, repositoryName: string, repositoryUri: string);
        getState(): string;
    }
}
declare namespace Karaf {
    class FeatureRepository {
        name: string;
        uri: string;
        features: Feature[];
        dependencies: string[];
        constructor(name: string, uri: string);
    }
}
declare namespace Karaf {
    class FeaturesService {
        private $q;
        private jolokia;
        private workspace;
        constructor($q: ng.IQService, jolokia: Jolokia.IJolokia, workspace: Jmx.Workspace);
        getFeatureRepositories(): ng.IPromise<FeatureRepository[]>;
        installFeature(feature: Feature): ng.IPromise<string>;
        uninstallFeature(feature: Feature): ng.IPromise<string>;
        addFeatureRepository(repositoryUri: string): ng.IPromise<string>;
        removeFeatureRepository(repository: FeatureRepository): ng.IPromise<string>;
        private execute(mbean, operation, args?, type?);
        private handleResponse(response);
        sortByName(a: any, b: any): 0 | 1 | -1;
    }
}
declare namespace Karaf {
    class FeaturesController {
        private featuresService;
        private $uibModal;
        private $scope;
        private workspace;
        private static FILTER_FUNCTIONS;
        private features;
        private repositories;
        private selectedRepository;
        private repositoryUri;
        private repositoryFilterValues;
        listConfig: {
            showSelectBox: boolean;
            useExpandingRows: boolean;
        };
        loading: boolean;
        listItems: any;
        private readonly installButton;
        private readonly uninstallButton;
        listItemActionButtons: any[];
        private readonly addRepositoryAction;
        private readonly removeRepositoryAction;
        toolbarConfig: {
            filterConfig: {
                fields: ({
                    id: string;
                    title: string;
                    placeholder: string;
                    filterType: string;
                    filterValues?: undefined;
                } | {
                    id: string;
                    title: string;
                    placeholder: string;
                    filterType: string;
                    filterValues: string[];
                })[];
                onFilterChange: (filters: any[]) => void;
                appliedFilters: any[];
                resultsCount: number;
            };
            actionsConfig: {
                primaryActions: any[];
            };
            isTableView: boolean;
        };
        constructor(featuresService: FeaturesService, $uibModal: any, $scope: any, workspace: Jmx.Workspace);
        $onInit(): void;
        private itemActionButtons();
        private toolbarActions();
        private loadFeatureRepositories();
        private applyFilters(filters);
        enableButtonForItem(action: any, item: any): boolean;
    }
    const featuresComponent: angular.IComponentOptions;
}
declare namespace Karaf {
    const featuresModule: string;
}
declare namespace Karaf {
    interface ScrComponent {
        id: number;
        bundleId: number;
        name: string;
        state: string;
        properties: any;
        references: any;
    }
}
declare namespace Karaf {
    class ScrComponentsService {
        private $q;
        private jolokia;
        private workspace;
        constructor($q: ng.IQService, jolokia: Jolokia.IJolokia, workspace: Jmx.Workspace);
        getComponents(): ng.IPromise<ScrComponent[]>;
        enableComponents(components: ScrComponent[]): ng.IPromise<string>;
        enableComponent(component: ScrComponent): ng.IPromise<string>;
        disableComponents(components: ScrComponent[]): ng.IPromise<string>;
        disableComponent(component: ScrComponent): ng.IPromise<string>;
        private execute(mbean, operation, type, ...args);
        private handleResponse(response);
    }
}
declare namespace Karaf {
    class ScrComponentsController {
        private scrComponentsService;
        private workspace;
        private static FILTER_FUNCTIONS;
        private readonly enableAction;
        private readonly disableAction;
        private toolbarActions();
        private toolbarConfig;
        private tableConfig;
        private tableColumns;
        private tableItems;
        private components;
        private loading;
        constructor(scrComponentsService: ScrComponentsService, workspace: Jmx.Workspace);
        $onInit(): void;
        private loadComponents();
        private applyFilters(filters);
        private enableDisableActions();
        private getSelectedComponents();
    }
    const scrListComponent: angular.IComponentOptions;
}
declare namespace Karaf {
    class ScrComponentDetailController {
        private scrComponentsService;
        private $routeParams;
        private workspace;
        component: ScrComponent;
        srcComponentsUrl: string;
        loading: boolean;
        scrMBean: string;
        constructor(scrComponentsService: ScrComponentsService, $routeParams: angular.route.IRouteParamsService, workspace: Jmx.Workspace);
        $onInit(): void;
        private loadComponent();
        disableComponentEnable(): boolean;
        enableComponent(): void;
        disableComponentDisable(): boolean;
        disableComponent(): void;
    }
    const scrDetailComponent: angular.IComponentOptions;
}
declare namespace Karaf {
    const scrComponentsModule: string;
}
declare namespace Karaf {
    const _module: angular.IModule;
}
declare namespace Karaf {
}
declare namespace Karaf {
}
declare namespace Karaf {
}
declare namespace Karaf {
}
declare namespace Osgi {
    const pluginName: string;
    const log: Logging.Logger;
    function defaultBundleValues(workspace: Jmx.Workspace, $scope: any, values: any): any;
    function getStateStyle(prefix: string, state: string): string;
    function defaultServiceValues(workspace: Jmx.Workspace, $scope: any, values: any): any;
    function defaultPackageValues(workspace: Jmx.Workspace, $scope: any, values: any): any[];
    function defaultConfigurationValues(workspace: Jmx.Workspace, $scope: any, values: any): any[];
    function parseActualPackages(packages: string[]): {};
    function parseManifestHeader(headers: {}, name: string): {};
    function toCollection(values: any): any;
    function labelBundleLinks(workspace: any, values: any, allValues: any): any[];
    function bundleLinks(workspace: any, values: any): string;
    function bundleUrls(workspace: any, values: any): any[];
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
    function getSelectionBundleMBean(workspace: Jmx.Workspace): string;
    /**
     * Walks the tree looking in the first child all the way down until we find an objectName
     * @method findFirstObjectName
     * @for Osgi
     * @param {Folder} node
     * @return {String}
     *
     */
    function findFirstObjectName(node: any): any;
    function getSelectionFrameworkMBean(workspace: Jmx.Workspace): string;
    function getSelectionServiceMBean(workspace: Jmx.Workspace): string;
    function getSelectionPackageMBean(workspace: Jmx.Workspace): string;
    function getSelectionConfigAdminMBean(workspace: Jmx.Workspace): string;
    function getMetaTypeMBean(workspace: Jmx.Workspace): string;
    function getProfileMetadataMBean(workspace: Jmx.Workspace): string;
    function getHawtioOSGiToolsMBean(workspace: Jmx.Workspace): string;
    function getHawtioConfigAdminMBean(workspace: Jmx.Workspace): string;
    /**
     * Creates a link to the given configuration pid and/or factoryPid
     */
    function createConfigPidLink($scope: any, workspace: any, pid: any, isFactory?: boolean): string;
    /**
     * Creates a path to the given configuration pid and/or factoryPid
     */
    function createConfigPidPath($scope: any, pid: any, isFactory?: boolean): string;
    function getConfigurationProperties(workspace: any, jolokia: any, pid: any, onDataFn: any): any;
    /**
     * For a pid of the form "foo.generatedId" for a pid "foo" or "foo.bar" remove the "foo." prefix
     */
    function removeFactoryPidPrefix(pid: any, factoryPid: any): any;
}
declare namespace Osgi {
    class OsgiDataService {
        private jolokia;
        private workspace;
        constructor(workspace: Jmx.Workspace, jolokia: any);
        getBundles(): {};
        getServices(): {};
        getPackages(): {};
    }
}
declare namespace Osgi {
    interface Bundle {
        id: number;
        name: string;
        location: string;
        symbolicName: string;
        state: string;
        version: string;
    }
}
declare namespace Osgi {
    class BundlesService {
        private $q;
        private jolokia;
        private workspace;
        constructor($q: ng.IQService, jolokia: Jolokia.IJolokia, workspace: Jmx.Workspace);
        getBundles(): ng.IPromise<Bundle[]>;
        startBundles(bundles: Bundle[]): ng.IPromise<string>;
        stopBundles(bundles: Bundle[]): ng.IPromise<string>;
        updateBundles(bundles: Bundle[]): ng.IPromise<string>;
        refreshBundles(bundles: Bundle[]): ng.IPromise<string>;
        uninstallBundles(bundles: Bundle[]): ng.IPromise<string>;
        installBundle(bundleUrl: string): ng.IPromise<string>;
        private execute(mbean, operation, args?);
        private handleResponse(response);
    }
}
declare namespace Osgi {
    class BundlesController {
        private bundlesService;
        private workspace;
        private static FILTER_FUNCTIONS;
        private readonly startAction;
        private readonly stopAction;
        private readonly refreshAction;
        private readonly updateAction;
        private readonly uninstallAction;
        private readonly tableConfig;
        private readonly toolbarConfig;
        private readonly tableColumns;
        private tableItems;
        private bundles;
        private loading;
        constructor(bundlesService: BundlesService, workspace: Jmx.Workspace);
        $onInit(): void;
        private loadBundles();
        private toolbarActions();
        private applyFilters(filters);
        private getSelectedBundles();
        private enableDisableActions();
    }
    const bundlesComponent: angular.IComponentOptions;
}
declare namespace Osgi {
    class InstallBundleController {
        private bundlesService;
        private workspace;
        loading: boolean;
        frameworkMBean: string;
        bundles: Bundle[];
        constructor(bundlesService: BundlesService, workspace: Jmx.Workspace);
        install(bundleUrl: string): void;
        findBundleByUrl(bundleUrl: string): Bundle;
        installDisabled(bundleUrl: string): boolean;
    }
    const installBundleComponent: angular.IComponentOptions;
}
declare namespace Osgi {
    const bundlesModule: string;
}
declare namespace Osgi {
    const _module: angular.IModule;
}
declare namespace Osgi {
    function formatServiceName(objClass: any): string;
}
declare namespace Osgi {
}
declare namespace Osgi {
}
declare namespace Osgi {
    var configuration: {
        pidMetadata: {
            "io.fabric8.container.java": {
                name: string;
            };
            "io.fabric8.container.process": {
                name: string;
            };
            "io.fabric8.container.process.overlay.resources": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.dosgi": {
                name: string;
                description: string;
            };
            "io.fabric8.environment": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.fab.osgi.url": {
                name: string;
                description: string;
            };
            "io.fabric8.mq.fabric.server": {
                name: string;
                description: string;
            };
            "io.fabric8.openshift": {
                name: string;
            };
            "io.fabric8.ports": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.system": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.version": {
                name: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "org.ops4j.pax.logging": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.mvn": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.war": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.wrap": {
                name: string;
                description: string;
            };
        };
        ignorePids: string[];
        tabs: {
            "fabric8": {
                label: string;
                description: string;
                pids: string[];
            };
            "karaf": {
                label: string;
                description: string;
                pids: string[];
            };
        };
    };
}
declare namespace Osgi {
    class OsgiNavigationController {
        private $location;
        private workspace;
        tabs: Nav.HawtioTab[];
        constructor($location: ng.ILocationService, workspace: Jmx.Workspace);
        $onInit(): void;
        goto(tab: Nav.HawtioTab): void;
    }
    const osgiNavigationComponent: angular.IComponentOptions;
}
declare namespace Osgi {
    var TopLevelController: angular.IModule;
}
declare namespace Osgi {
    var PackagesController: angular.IModule;
}
declare namespace Osgi {
}
declare namespace Osgi {
    var ServiceController: angular.IModule;
}
declare namespace SpringBoot {
    class SpringBootService {
        private $q;
        private treeService;
        constructor($q: ng.IQService, treeService: Jmx.TreeService);
        getTabs(): ng.IPromise<Nav.HawtioTab[]>;
        private hasEndpoint(name);
    }
}
declare namespace SpringBoot {
    class SpringBootController {
        private $location;
        private springBootService;
        tabs: Nav.HawtioTab[];
        constructor($location: ng.ILocationService, springBootService: SpringBootService);
        $onInit(): void;
        goto(tab: Nav.HawtioTab): void;
    }
    const springBootComponent: angular.IComponentOptions;
}
declare namespace SpringBoot {
    function configureRoutes($routeProvider: angular.route.IRouteProvider): void;
    function configureLayout($templateCache: ng.ITemplateCacheService, viewRegistry: any, HawtioNav: Nav.Registry, workspace: Jmx.Workspace, treeService: Jmx.TreeService, springBootService: SpringBootService): void;
}
declare namespace SpringBoot {
    class Health {
        status: HealthStatus;
        items: HealthItem[];
        constructor(status: HealthStatus, items: HealthItem[]);
    }
    type HealthStatus = 'FATAL' | 'DOWN' | 'OUT OF SERVICE' | 'UNKNOWN' | 'UP';
    interface HealthItem {
        title: string;
        info: string[];
    }
}
declare namespace SpringBoot {
    class HealthService {
        private jolokiaService;
        private humanizeService;
        constructor(jolokiaService: JVM.JolokiaService, humanizeService: Core.HumanizeService);
        getHealth(): ng.IPromise<Health>;
        private toHealthStatus(str);
        private toItems(data);
    }
}
declare namespace SpringBoot {
    class HealthController {
        private $timeout;
        private healthService;
        readonly reloadDelay: number;
        health: Health;
        promise: ng.IPromise<any>;
        constructor($timeout: ng.ITimeoutService, healthService: HealthService);
        $onInit(): void;
        $onDestroy(): void;
        loadDataPeriodically(): void;
        cancelTimer(): void;
        getStatusIcon(): "pficon-error-circle-o" | "pficon-ok" | "pficon-info";
        getStatusClass(): "alert-success" | "alert-danger" | "alert-info";
    }
    const healthComponent: angular.IComponentOptions;
}
declare namespace SpringBoot {
    const healthModule: string;
}
declare namespace SpringBoot {
    class Trace {
        timestamp: string;
        method: string;
        path: string;
        httpStatusCode: number;
        timeTaken: number;
        info: any;
        constructor(trace: any);
    }
}
declare namespace SpringBoot {
    class TraceService {
        private jolokiaService;
        constructor(jolokiaService: JVM.JolokiaService);
        getTraces(): ng.IPromise<Trace[]>;
    }
}
declare namespace SpringBoot {
    class TraceController {
        private traceService;
        private $scope;
        private $filter;
        private $timeout;
        private $interval;
        private $uibModal;
        private static CACHE_SIZE;
        private toolbarConfig;
        loading: boolean;
        traces: Trace[];
        tableItems: Trace[];
        selectedTrace: Trace;
        promise: ng.IPromise<any>;
        dateFormat: string;
        constructor(traceService: TraceService, $scope: any, $filter: ng.IFilterService, $timeout: ng.ITimeoutService, $interval: ng.IIntervalService, $uibModal: any);
        $onInit(): void;
        $onDestroy(): void;
        loadTraces(): void;
        applyFilters(filters: any[]): void;
        getStatusClass(trace: Trace): string;
        openTraceModal(trace: Trace): void;
        private aggregateTraces(traces);
        private scrollIfRequired();
    }
    const traceComponent: angular.IComponentOptions;
}
declare namespace SpringBoot {
    const traceModule: string;
}
declare namespace SpringBoot {
    const loggersJmxDomain: string;
    interface LoggerConfiguration {
        levels: string[];
        loggers: Logger[];
    }
    interface Logger {
        name: string;
        configuredLevel: string;
        effectiveLevel: string;
    }
}
declare namespace SpringBoot {
    class LoggersService {
        private jolokiaService;
        constructor(jolokiaService: JVM.JolokiaService);
        getLoggerConfiguration(): ng.IPromise<LoggerConfiguration>;
        setLoggerLevel(logger: Logger): ng.IPromise<void>;
    }
}
declare namespace SpringBoot {
    class LoggersController {
        private loggersService;
        private filterFields;
        private filterConfig;
        private toolbarConfig;
        private pageSize;
        private pageNumber;
        private numTotalItems;
        loading: boolean;
        loggers: Logger[];
        tableItems: Logger[];
        loggerLevels: string[];
        constructor(loggersService: LoggersService);
        $onInit(): void;
        loadData(): void;
        setLoggerLevel(logger: Logger): void;
        applyFilters(filters: any[]): void;
        private orderLoggers(item);
    }
    const loggersComponent: angular.IComponentOptions;
}
declare namespace SpringBoot {
    const loggersModule: string;
}
declare namespace SpringBoot {
    const log: Logging.Logger;
}
