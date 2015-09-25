/// <reference path="../libs/hawtio-forms/defs.d.ts"/>
/// <reference path="../libs/hawtio-jmx/defs.d.ts"/>
/// <reference path="../libs/hawtio-ui/defs.d.ts"/>
/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ.pluginName = 'activemq';
    ActiveMQ.log = Logger.get("activemq");
    ActiveMQ.jmxDomain = 'org.apache.activemq';
    function getSelectionQueuesFolder(workspace) {
        function findQueuesFolder(node) {
            if (node) {
                if (node.title === "Queues" || node.title === "Queue") {
                    return node;
                }
                var parent = node.parent;
                if (parent) {
                    return findQueuesFolder(parent);
                }
            }
            return null;
        }
        var selection = workspace.selection;
        if (selection) {
            return findQueuesFolder(selection);
        }
        return null;
    }
    ActiveMQ.getSelectionQueuesFolder = getSelectionQueuesFolder;
    function getSelectionTopicsFolder(workspace) {
        function findTopicsFolder(node) {
            var answer = null;
            if (node) {
                if (node.title === "Topics" || node.title === "Topic") {
                    answer = node;
                }
                if (answer === null) {
                    angular.forEach(node.children, function (child) {
                        if (child.title === "Topics" || child.title === "Topic") {
                            answer = child;
                        }
                    });
                }
            }
            return answer;
        }
        var selection = workspace.selection;
        if (selection) {
            return findTopicsFolder(selection);
        }
        return null;
    }
    ActiveMQ.getSelectionTopicsFolder = getSelectionTopicsFolder;
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
    function selectCurrentMessage(message, key, $scope) {
        // clicking on message's link would interfere with messages selected with checkboxes
        if ('selectAll' in $scope.gridOptions) {
            $scope.gridOptions.selectAll(false);
        }
        else {
            $scope.gridOptions.selectedItems.length = 0;
        }
        var idx = Core.pathGet(message, ["rowIndex"]) || Core.pathGet(message, ['index']);
        var jmsMessageID = Core.pathGet(message, ["entity", key]);
        $scope.rowIndex = idx;
        var selected = $scope.gridOptions.selectedItems;
        selected.splice(0, selected.length);
        if (idx >= 0 && idx < $scope.messages.length) {
            $scope.row = $scope.messages.find(function (msg) { return msg[key] === jmsMessageID; });
            if ($scope.row) {
                selected.push($scope.row);
            }
        }
        else {
            $scope.row = null;
        }
    }
    ActiveMQ.selectCurrentMessage = selectCurrentMessage;
    /**
     * - Adds functions needed for message browsing with details
     * - Adds a watch to deselect all rows after closing the slideout with message details
     * TODO: export these functions too?
     *
     * @param $scope
     * @param fn optional function to call if the selected row was changed
     */
    function decorate($scope, fn) {
        if (fn === void 0) { fn = null; }
        $scope.selectRowIndex = function (idx) {
            $scope.rowIndex = idx;
            var selected = $scope.gridOptions.selectedItems;
            selected.splice(0, selected.length);
            if (idx >= 0 && idx < $scope.messages.length) {
                $scope.row = $scope.messages[idx];
                if ($scope.row) {
                    selected.push($scope.row);
                }
            }
            else {
                $scope.row = null;
            }
            if (fn) {
                fn.apply();
            }
        };
        $scope.$watch("showMessageDetails", function () {
            if (!$scope.showMessageDetails) {
                $scope.row = null;
                $scope.gridOptions.selectedItems.splice(0, $scope.gridOptions.selectedItems.length);
            }
        });
    }
    ActiveMQ.decorate = decorate;
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/**
 * @module ActiveMQ
 * @main ActiveMQ
 */
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module = angular.module(ActiveMQ.pluginName, []);
    ActiveMQ._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/activemq/browseQueue', { templateUrl: 'plugins/activemq/html/browseQueue.html' }).when('/activemq/createDestination', { templateUrl: 'plugins/activemq/html/createDestination.html' }).when('/activemq/deleteQueue', { templateUrl: 'plugins/activemq/html/deleteQueue.html' }).when('/activemq/deleteTopic', { templateUrl: 'plugins/activemq/html/deleteTopic.html' }).when('/activemq/sendMessage', { templateUrl: 'plugins/camel/html/sendMessage.html' }).when('/activemq/durableSubscribers', { templateUrl: 'plugins/activemq/html/durableSubscribers.html' }).when('/activemq/jobs', { templateUrl: 'plugins/activemq/html/jobs.html' });
    }]);
    ActiveMQ._module.run(["HawtioNav", "$location", "workspace", "viewRegistry", "helpRegistry", "preferencesRegistry", "$templateCache", "documentBase", function (nav, $location, workspace, viewRegistry, helpRegistry, preferencesRegistry, $templateCache, documentBase) {
        viewRegistry['{ "main-tab": "activemq" }'] = 'plugins/activemq/html/layoutActiveMQTree.html';
        helpRegistry.addUserDoc('activemq', 'plugins/activemq/doc/help.md', function () {
            return workspace.treeContainsDomainAndProperties("org.apache.activemq");
        });
        preferencesRegistry.addTab("ActiveMQ", "plugins/activemq/html/preferences.html", function () {
            return workspace.treeContainsDomainAndProperties("org.apache.activemq");
        });
        workspace.addTreePostProcessor(postProcessTree);
        // register default attribute views
        var attributes = workspace.attributeColumnDefs;
        attributes[ActiveMQ.jmxDomain + "/Broker/folder"] = [
            { field: 'BrokerName', displayName: 'Name', width: "**" },
            { field: 'TotalProducerCount', displayName: 'Producer' },
            { field: 'TotalConsumerCount', displayName: 'Consumer' },
            { field: 'StorePercentUsage', displayName: 'Store %' },
            { field: 'TempPercentUsage', displayName: 'Temp %' },
            { field: 'MemoryPercentUsage', displayName: 'Memory %' },
            { field: 'TotalEnqueueCount', displayName: 'Enqueue' },
            { field: 'TotalDequeueCount', displayName: 'Dequeue' }
        ];
        attributes[ActiveMQ.jmxDomain + "/Queue/folder"] = [
            { field: 'Name', displayName: 'Name', width: "***" },
            { field: 'QueueSize', displayName: 'Queue Size' },
            { field: 'ProducerCount', displayName: 'Producer' },
            { field: 'ConsumerCount', displayName: 'Consumer' },
            { field: 'EnqueueCount', displayName: 'Enqueue' },
            { field: 'DequeueCount', displayName: 'Dequeue' },
            { field: 'MemoryPercentUsage', displayName: 'Memory %' },
            { field: 'DispatchCount', displayName: 'Dispatch', visible: false }
        ];
        attributes[ActiveMQ.jmxDomain + "/Topic/folder"] = [
            { field: 'Name', displayName: 'Name', width: "****" },
            { field: 'ProducerCount', displayName: 'Producer' },
            { field: 'ConsumerCount', displayName: 'Consumer' },
            { field: 'EnqueueCount', displayName: 'Enqueue' },
            { field: 'DequeueCount', displayName: 'Dequeue' },
            { field: 'MemoryPercentUsage', displayName: 'Memory %' },
            { field: 'DispatchCount', displayName: 'Dispatch', visible: false }
        ];
        attributes[ActiveMQ.jmxDomain + "/Consumer/folder"] = [
            { field: 'ConnectionId', displayName: 'Name', width: "**" },
            { field: 'PrefetchSize', displayName: 'Prefetch Size' },
            { field: 'Priority', displayName: 'Priority' },
            { field: 'DispatchedQueueSize', displayName: 'Dispatched Queue #' },
            { field: 'SlowConsumer', displayName: 'Slow ?' },
            { field: 'Retroactive', displayName: 'Retroactive' },
            { field: 'Selector', displayName: 'Selector' }
        ];
        attributes[ActiveMQ.jmxDomain + "/networkConnectors/folder"] = [
            { field: 'Name', displayName: 'Name', width: "**" },
            { field: 'UserName', displayName: 'User Name' },
            { field: 'PrefetchSize', displayName: 'Prefetch Size' },
            { field: 'ConduitSubscriptions', displayName: 'Conduit Subscriptions?' },
            { field: 'Duplex', displayName: 'Duplex' },
            { field: 'DynamicOnly', displayName: 'Dynamic Only' }
        ];
        attributes[ActiveMQ.jmxDomain + "/PersistenceAdapter/folder"] = [
            { field: 'IndexDirectory', displayName: 'Index Directory', width: "**" },
            { field: 'LogDirectory', displayName: 'Log Directory', width: "**" }
        ];
        var myUrl = '/jmx/attributes';
        var builder = nav.builder();
        var tab = builder.id('activemq').title(function () { return 'ActiveMQ'; }).defaultPage({
            rank: 15,
            isValid: function (yes, no) {
                var name = 'ActiveMQDefaultPage';
                workspace.addNamedTreePostProcessor(name, function (tree) {
                    workspace.removeNamedTreePostProcessor(name);
                    if (workspace.treeContainsDomainAndProperties(ActiveMQ.jmxDomain)) {
                        yes();
                    }
                    else {
                        no();
                    }
                });
            }
        }).href(function () { return myUrl; }).isValid(function () { return workspace.treeContainsDomainAndProperties(ActiveMQ.jmxDomain); }).build();
        tab.tabs = Jmx.getNavItems(builder, workspace, $templateCache, 'activemq');
        // add sub level tabs
        tab.tabs.push({
            id: 'activemq-browse',
            title: function () { return '<i class="fa fa-envelope"></i> Browse'; },
            tooltip: function () { return "Browse the messages on the queue"; },
            show: function () { return isQueue(workspace) && workspace.hasInvokeRights(workspace.selection, "browse()"); },
            href: function () { return "/activemq/browseQueue" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-send',
            title: function () { return '<i class="fa fa-pencil"></i> Send'; },
            tooltip: function () { return "Send a message to this destination"; },
            show: function () { return (isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(workspace.selection, "sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)"); },
            href: function () { return "/activemq/sendMessage" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-durable-subscribers',
            title: function () { return '<i class="fa fa-list"></i> Durable Subscribers'; },
            tooltip: function () { return "Manage durable subscribers"; },
            show: function () { return isBroker(workspace); },
            href: function () { return "/activemq/durableSubscribers" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-jobs',
            title: function () { return '<i class="fa fa-list"></i> Jobs'; },
            tooltip: function () { return "Manage jobs"; },
            show: function () { return isJobScheduler(workspace); },
            href: function () { return "/activemq/jobs" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-create-destination',
            title: function () { return '<i class="fa fa-plus"></i> Create'; },
            tooltip: function () { return "Create a new destination"; },
            show: function () { return (isBroker(workspace) || isQueuesFolder(workspace) || isTopicsFolder(workspace) || isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(getBroker(workspace), "addQueue", "addTopic"); },
            href: function () { return "/activemq/createDestination" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-delete-topic',
            title: function () { return '<i class="fa fa-remove"></i> Delete'; },
            tooltip: function () { return "Delete this topic"; },
            show: function () { return isTopic(workspace) && workspace.hasInvokeRights(getBroker(workspace), "removeTopic"); },
            href: function () { return "/activemq/deleteTopic" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'activemq-delete-queue',
            title: function () { return '<i class="fa fa-remove"></i> Delete'; },
            tooltip: function () { return "Delete or purge this queue"; },
            show: function () { return isQueue(workspace) && workspace.hasInvokeRights(getBroker(workspace), "removeQueue"); },
            href: function () { return "/activemq/deleteQueue" + workspace.hash(); }
        });
        nav.add(tab);
        function postProcessTree(tree) {
            var activemq = tree.get("org.apache.activemq");
            setConsumerType(activemq);
            // lets move queue and topic as first children within brokers
            if (activemq) {
                angular.forEach(activemq.children, function (broker) {
                    angular.forEach(broker.children, function (child) {
                        // lets move Topic/Queue to the front.
                        var grandChildren = child.children;
                        if (grandChildren) {
                            var names = ["Topic", "Queue"];
                            angular.forEach(names, function (name) {
                                var idx = grandChildren.findIndex(function (n) { return n.title === name; });
                                if (idx > 0) {
                                    var old = grandChildren[idx];
                                    grandChildren.splice(idx, 1);
                                    grandChildren.splice(0, 0, old);
                                }
                            });
                        }
                    });
                });
            }
        }
        function setConsumerType(node) {
            if (node) {
                var parent = node.parent;
                var entries = node.entries;
                if (parent && !parent.typeName && entries) {
                    var endpoint = entries["endpoint"];
                    if (endpoint === "Consumer" || endpoint === "Producer") {
                        //console.log("Setting the typeName on " + parent.title + " to " + endpoint);
                        parent.typeName = endpoint;
                    }
                    var connectorName = entries["connectorName"];
                    if (connectorName && !node.icon) {
                        // lets default a connector icon
                        node.icon = UrlHelpers.join(documentBase, "/img/icons/activemq/connector.png");
                    }
                }
                angular.forEach(node.children, function (child) { return setConsumerType(child); });
            }
        }
    }]);
    hawtioPluginLoader.addModule(ActiveMQ.pluginName);
    function getBroker(workspace) {
        var answer = null;
        var selection = workspace.selection;
        if (selection) {
            answer = selection.findAncestor(function (current) {
                // log.debug("Checking current: ", current);
                var entries = current.entries;
                if (entries) {
                    return (('type' in entries && entries.type === 'Broker') && 'brokerName' in entries && !('destinationName' in entries) && !('destinationType' in entries));
                }
                else {
                    return false;
                }
            });
        }
        return answer;
    }
    ActiveMQ.getBroker = getBroker;
    function isQueue(workspace) {
        //return workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
        return workspace.hasDomainAndProperties(ActiveMQ.jmxDomain, { 'destinationType': 'Queue' }, 4) || workspace.selectionHasDomainAndType(ActiveMQ.jmxDomain, 'Queue');
    }
    ActiveMQ.isQueue = isQueue;
    function isTopic(workspace) {
        //return workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
        return workspace.hasDomainAndProperties(ActiveMQ.jmxDomain, { 'destinationType': 'Topic' }, 4) || workspace.selectionHasDomainAndType(ActiveMQ.jmxDomain, 'Topic');
    }
    ActiveMQ.isTopic = isTopic;
    function isQueuesFolder(workspace) {
        return workspace.selectionHasDomainAndLastFolderName(ActiveMQ.jmxDomain, 'Queue');
    }
    ActiveMQ.isQueuesFolder = isQueuesFolder;
    function isTopicsFolder(workspace) {
        return workspace.selectionHasDomainAndLastFolderName(ActiveMQ.jmxDomain, 'Topic');
    }
    ActiveMQ.isTopicsFolder = isTopicsFolder;
    function isJobScheduler(workspace) {
        return workspace.hasDomainAndProperties(ActiveMQ.jmxDomain, { 'service': 'JobScheduler' }, 4);
    }
    ActiveMQ.isJobScheduler = isJobScheduler;
    function isBroker(workspace) {
        if (workspace.selectionHasDomainAndType(ActiveMQ.jmxDomain, 'Broker')) {
            var self = Core.pathGet(workspace, ["selection"]);
            var parent = Core.pathGet(workspace, ["selection", "parent"]);
            return !(parent && (parent.ancestorHasType('Broker') || self.ancestorHasType('Broker')));
        }
        return false;
    }
    ActiveMQ.isBroker = isBroker;
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ.BrowseQueueController = ActiveMQ._module.controller("ActiveMQ.BrowseQueueController", ["$scope", "workspace", "jolokia", "localStorage", '$location', "activeMQMessage", "$timeout", "$dialog", "$templateCache", function ($scope, workspace, jolokia, localStorage, location, activeMQMessage, $timeout, $dialog, $templateCache) {
        $scope.searchText = '';
        $scope.allMessages = [];
        $scope.messages = [];
        $scope.headers = {};
        $scope.mode = 'text';
        $scope.gridOptions = {
            selectedItems: [],
            data: 'messages',
            displayFooter: false,
            showFilter: false,
            showColumnMenu: true,
            enableColumnResize: true,
            enableColumnReordering: true,
            enableHighlighting: true,
            filterOptions: {
                filterText: '',
                useExternalFilter: true
            },
            selectWithCheckboxOnly: true,
            showSelectionCheckbox: true,
            maintainColumnRatios: false,
            columnDefs: [
                {
                    field: 'JMSMessageID',
                    displayName: 'Message ID',
                    cellTemplate: '<div class="ngCellText"><a href="" ng-click="row.entity.openMessageDialog(row)">{{row.entity.JMSMessageID}}</a></div>',
                    // for ng-grid
                    width: '34%'
                },
                {
                    field: 'JMSType',
                    displayName: 'Type',
                    width: '10%'
                },
                {
                    field: 'JMSPriority',
                    displayName: 'Priority',
                    width: '7%'
                },
                {
                    field: 'JMSTimestamp',
                    displayName: 'Timestamp',
                    width: '19%'
                },
                {
                    field: 'JMSExpiration',
                    displayName: 'Expires',
                    width: '10%'
                },
                {
                    field: 'JMSReplyTo',
                    displayName: 'Reply To',
                    width: '10%'
                },
                {
                    field: 'JMSCorrelationID',
                    displayName: 'Correlation ID',
                    width: '10%'
                }
            ]
        };
        $scope.showMessageDetails = false;
        // openMessageDialog is for the dialog itself so we should skip that guy
        var ignoreColumns = ["PropertiesText", "BodyPreview", "Text", "openMessageDialog"];
        var flattenColumns = ["BooleanProperties", "ByteProperties", "ShortProperties", "IntProperties", "LongProperties", "FloatProperties", "DoubleProperties", "StringProperties"];
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid()) {
                return;
            }
            // lets defer execution as we may not have the selection just yet
            setTimeout(loadTable, 50);
        });
        $scope.$watch('gridOptions.filterOptions.filterText', function (filterText) {
            filterMessages(filterText);
        });
        $scope.openMessageDialog = function (message) {
            ActiveMQ.selectCurrentMessage(message, "JMSMessageID", $scope);
            if ($scope.row) {
                $scope.mode = CodeEditor.detectTextFormat($scope.row.Text);
                $scope.showMessageDetails = true;
            }
        };
        $scope.refresh = loadTable;
        ActiveMQ.decorate($scope);
        $scope.moveMessages = function () {
            var selection = workspace.selection;
            var mbean = selection.objectName;
            if (!mbean || !selection) {
                return;
            }
            var selectedItems = $scope.gridOptions.selectedItems;
            $dialog.dialog({
                resolve: {
                    selectedItems: function () { return selectedItems; },
                    gridOptions: function () { return $scope.gridOptions; },
                    queueNames: function () { return $scope.queueNames; },
                    parent: function () { return $scope; }
                },
                template: $templateCache.get("activemqMoveMessageDialog.html"),
                controller: ["$scope", "dialog", "selectedItems", "gridOptions", "queueNames", "parent", function ($scope, dialog, selectedItems, gridOptions, queueNames, parent) {
                    $scope.selectedItems = selectedItems;
                    $scope.gridOptions = gridOptions;
                    $scope.queueNames = queueNames;
                    $scope.queueName = '';
                    $scope.close = function (result) {
                        dialog.close();
                        if (result) {
                            parent.message = "Moved " + Core.maybePlural(selectedItems.length, "message") + " to " + $scope.queueName;
                            var operation = "moveMessageTo(java.lang.String, java.lang.String)";
                            angular.forEach(selectedItems, function (item, idx) {
                                var id = item.JMSMessageID;
                                if (id) {
                                    var callback = (idx + 1 < selectedItems.length) ? intermediateResult : moveSuccess;
                                    jolokia.execute(mbean, operation, id, $scope.queueName, Core.onSuccess(callback));
                                }
                            });
                        }
                    };
                }]
            }).open();
        };
        $scope.resendMessage = function () {
            var selection = workspace.selection;
            var mbean = selection.objectName;
            if (mbean && selection) {
                var selectedItems = $scope.gridOptions.selectedItems;
                //always assume a single message
                activeMQMessage.message = selectedItems[0];
                location.path('activemq/sendMessage');
            }
        };
        $scope.deleteMessages = function () {
            var selection = workspace.selection;
            var mbean = selection.objectName;
            if (!mbean || !selection) {
                return;
            }
            var selected = $scope.gridOptions.selectedItems;
            if (!selected || selected.length === 0) {
                return;
            }
            UI.multiItemConfirmActionDialog({
                collection: selected,
                index: 'JMSMessageID',
                onClose: function (result) {
                    if (result) {
                        $scope.message = "Deleted " + Core.maybePlural(selected.length, "message");
                        var operation = "removeMessage(java.lang.String)";
                        _.forEach(selected, function (item, idx) {
                            var id = item.JMSMessageID;
                            if (id) {
                                var callback = (idx + 1 < selected.length) ? intermediateResult : operationSuccess;
                                jolokia.execute(mbean, operation, id, Core.onSuccess(callback));
                            }
                        });
                    }
                },
                title: 'Delete messages?',
                action: 'The following messages will be deleted:',
                okText: 'Delete',
                okClass: 'btn-danger',
                custom: "This operation is permanent once completed!",
                customClass: "alert alert-warning"
            }).open();
        };
        $scope.retryMessages = function () {
            var selection = workspace.selection;
            var mbean = selection.objectName;
            if (mbean && selection) {
                var selectedItems = $scope.gridOptions.selectedItems;
                $scope.message = "Retry " + Core.maybePlural(selectedItems.length, "message");
                var operation = "retryMessage(java.lang.String)";
                angular.forEach(selectedItems, function (item, idx) {
                    var id = item.JMSMessageID;
                    if (id) {
                        var callback = (idx + 1 < selectedItems.length) ? intermediateResult : operationSuccess;
                        jolokia.execute(mbean, operation, id, Core.onSuccess(callback));
                    }
                });
            }
        };
        $scope.queueNames = function (completionText) {
            var queuesFolder = ActiveMQ.getSelectionQueuesFolder(workspace);
            return (queuesFolder) ? queuesFolder.children.map(function (n) { return n.title; }) : [];
        };
        function populateTable(response) {
            var data = response.value;
            if (!angular.isArray(data)) {
                $scope.allMessages = [];
                angular.forEach(data, function (value, idx) {
                    $scope.allMessages.push(value);
                });
            }
            else {
                $scope.allMessages = data;
            }
            angular.forEach($scope.allMessages, function (message) {
                message.openMessageDialog = $scope.openMessageDialog;
                message.headerHtml = createHeaderHtml(message);
                message.bodyText = createBodyText(message);
            });
            filterMessages($scope.gridOptions.filterOptions.filterText);
            Core.$apply($scope);
        }
        /*
         * For some reason using ng-repeat in the modal dialog doesn't work so lets
         * just create the HTML in code :)
         */
        function createBodyText(message) {
            if (message.Text) {
                var body = message.Text;
                var lenTxt = "" + body.length;
                message.textMode = "text (" + lenTxt + " chars)";
                return body;
            }
            else if (message.BodyPreview) {
                var code = Core.parseIntValue(localStorage["activemqBrowseBytesMessages"] || "1", "browse bytes messages");
                var body;
                message.textMode = "bytes (turned off)";
                if (code != 99) {
                    var bytesArr = [];
                    var textArr = [];
                    message.BodyPreview.forEach(function (b) {
                        if (code === 1 || code === 2) {
                            // text
                            textArr.push(String.fromCharCode(b));
                        }
                        if (code === 1 || code === 4) {
                            // hex and must be 2 digit so they space out evenly
                            var s = b.toString(16);
                            if (s.length === 1) {
                                s = "0" + s;
                            }
                            bytesArr.push(s);
                        }
                        else {
                            // just show as is without spacing out, as that is usually more used for hex than decimal
                            var s = b.toString(10);
                            bytesArr.push(s);
                        }
                    });
                    var bytesData = bytesArr.join(" ");
                    var textData = textArr.join("");
                    if (code === 1 || code === 2) {
                        // bytes and text
                        var len = message.BodyPreview.length;
                        var lenTxt = "" + textArr.length;
                        body = "bytes:\n" + bytesData + "\n\ntext:\n" + textData;
                        message.textMode = "bytes (" + len + " bytes) and text (" + lenTxt + " chars)";
                    }
                    else {
                        // bytes only
                        var len = message.BodyPreview.length;
                        body = bytesData;
                        message.textMode = "bytes (" + len + " bytes)";
                    }
                }
                return body;
            }
            else {
                message.textMode = "unsupported";
                return "Unsupported message body type which cannot be displayed by hawtio";
            }
        }
        /*
         * For some reason using ng-repeat in the modal dialog doesn't work so lets
         * just create the HTML in code :)
         */
        function createHeaderHtml(message) {
            var headers = createHeaders(message);
            var properties = createProperties(message);
            var headerKeys = _.keys(headers);
            function sort(a, b) {
                if (a > b)
                    return 1;
                if (a < b)
                    return -1;
                return 0;
            }
            var propertiesKeys = _.keys(properties).sort(sort);
            var jmsHeaders = headerKeys.filter(function (key) {
                return key.startsWith("JMS");
            }).sort(sort);
            var remaining = headerKeys.subtract(jmsHeaders.concat(propertiesKeys)).sort(sort);
            var buffer = [];
            function appendHeader(key) {
                var value = headers[key];
                if (value === null) {
                    value = '';
                }
                buffer.push('<tr><td class="propertyName"><span class="green">Header</span> - ' + key + '</td><td class="property-value">' + value + '</td></tr>');
            }
            function appendProperty(key) {
                var value = properties[key];
                if (value === null) {
                    value = '';
                }
                buffer.push('<tr><td class="propertyName">' + key + '</td><td class="property-value">' + value + '</td></tr>');
            }
            jmsHeaders.forEach(appendHeader);
            remaining.forEach(appendHeader);
            propertiesKeys.forEach(appendProperty);
            return buffer.join("\n");
        }
        function createHeaders(row) {
            //log.debug("headers: ", row);
            var answer = {};
            angular.forEach(row, function (value, key) {
                if (!ignoreColumns.any(key) && !flattenColumns.any(key)) {
                    answer[Core.escapeHtml(key)] = Core.escapeHtml(value);
                }
            });
            return answer;
        }
        function createProperties(row) {
            //log.debug("properties: ", row);
            var answer = {};
            angular.forEach(row, function (value, key) {
                if (!ignoreColumns.any(key) && flattenColumns.any(key)) {
                    angular.forEach(value, function (v2, k2) {
                        answer['<span class="green">' + key.replace('Properties', ' Property') + '</span> - ' + Core.escapeHtml(k2)] = Core.escapeHtml(v2);
                    });
                }
            });
            return answer;
        }
        function loadTable() {
            var objName;
            if (workspace.selection) {
                objName = workspace.selection.objectName;
            }
            else {
                // in case of refresh
                var key = location.search()['nid'];
                var node = workspace.keyToNodeMap[key];
                objName = node.objectName;
            }
            if (objName) {
                $scope.dlq = false;
                jolokia.getAttribute(objName, "DLQ", Core.onSuccess(onDlq, { silent: true }));
                jolokia.request({ type: 'exec', mbean: objName, operation: 'browse()' }, Core.onSuccess(populateTable));
            }
        }
        function onDlq(response) {
            $scope.dlq = response;
            Core.$apply($scope);
        }
        function intermediateResult() {
        }
        function operationSuccess() {
            $scope.gridOptions.selectedItems.splice(0);
            Core.notification("success", $scope.message);
            setTimeout(loadTable, 50);
        }
        function moveSuccess() {
            operationSuccess();
            workspace.loadTree();
        }
        function filterMessages(filter) {
            var searchConditions = buildSearchConditions(filter);
            evalFilter(searchConditions);
        }
        function evalFilter(searchConditions) {
            if (!searchConditions || searchConditions.length === 0) {
                $scope.messages = $scope.allMessages;
            }
            else {
                ActiveMQ.log.debug("Filtering conditions:", searchConditions);
                $scope.messages = $scope.allMessages.filter(function (message) {
                    ActiveMQ.log.debug("Message:", message);
                    var matched = true;
                    $.each(searchConditions, function (index, condition) {
                        if (!condition.column) {
                            matched = matched && evalMessage(message, condition.regex);
                        }
                        else {
                            matched = matched && (message[condition.column] && condition.regex.test(message[condition.column])) || (message.StringProperties && message.StringProperties[condition.column] && condition.regex.test(message.StringProperties[condition.column]));
                        }
                    });
                    return matched;
                });
            }
        }
        function evalMessage(message, regex) {
            var jmsHeaders = ['JMSDestination', 'JMSDeliveryMode', 'JMSExpiration', 'JMSPriority', 'JMSMessageID', 'JMSTimestamp', 'JMSCorrelationID', 'JMSReplyTo', 'JMSType', 'JMSRedelivered'];
            for (var i = 0; i < jmsHeaders.length; i++) {
                var header = jmsHeaders[i];
                if (message[header] && regex.test(message[header])) {
                    return true;
                }
            }
            if (message.StringProperties) {
                for (var property in message.StringProperties) {
                    if (regex.test(message.StringProperties[property])) {
                        return true;
                    }
                }
            }
            if (message.bodyText && regex.test(message.bodyText)) {
                return true;
            }
            return false;
        }
        function getRegExp(str, modifiers) {
            try {
                return new RegExp(str, modifiers);
            }
            catch (err) {
                return new RegExp(str.replace(/(\^|\$|\(|\)|<|>|\[|\]|\{|\}|\\|\||\.|\*|\+|\?)/g, '\\$1'));
            }
        }
        function buildSearchConditions(filterText) {
            var searchConditions = [];
            var qStr;
            if (!(qStr = $.trim(filterText))) {
                return;
            }
            var columnFilters = qStr.split(";");
            for (var i = 0; i < columnFilters.length; i++) {
                var args = columnFilters[i].split(':');
                if (args.length > 1) {
                    var columnName = $.trim(args[0]);
                    var columnValue = $.trim(args[1]);
                    if (columnName && columnValue) {
                        searchConditions.push({
                            column: columnName,
                            columnDisplay: columnName.replace(/\s+/g, '').toLowerCase(),
                            regex: getRegExp(columnValue, 'i')
                        });
                    }
                }
                else {
                    var val = $.trim(args[0]);
                    if (val) {
                        searchConditions.push({
                            column: '',
                            regex: getRegExp(val, 'i')
                        });
                    }
                }
            }
            return searchConditions;
        }
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module.controller("ActiveMQ.DestinationController", ["$scope", "workspace", "$location", "jolokia", function ($scope, workspace, $location, jolokia) {
        $scope.workspace = workspace;
        $scope.message = "";
        $scope.destinationName = "";
        $scope.queueType = (ActiveMQ.isTopicsFolder(workspace) || ActiveMQ.isTopic(workspace)) ? "false" : "true";
        $scope.destinationTypeName = $scope.queueType ? "Queue" : "Topic";
        $scope.deleteDialog = false;
        $scope.purgeDialog = false;
        updateQueueType();
        function updateQueueType() {
            $scope.destinationTypeName = $scope.queueType === "true" ? "Queue" : "Topic";
        }
        $scope.$watch('queueType', function () {
            updateQueueType();
        });
        $scope.$watch('workspace.selection', function () {
            workspace.moveIfViewInvalid();
        });
        function operationSuccess() {
            $scope.destinationName = "";
            $scope.workspace.operationCounter += 1;
            Core.notification("success", $scope.message);
            $scope.workspace.loadTree();
            Core.$apply($scope);
        }
        function deleteSuccess() {
            // lets set the selection to the parent
            workspace.removeAndSelectParentNode();
            $scope.workspace.operationCounter += 1;
            Core.notification("success", $scope.message);
            // and switch to show the attributes (table view)
            $location.path('/jmx/attributes').search({ "main-tab": "activemq", "sub-tab": "activemq-attributes" });
            Core.$apply($scope);
        }
        function getBrokerMBean(jolokia) {
            var mbean = null;
            var selection = workspace.selection;
            if (selection && ActiveMQ.isBroker(workspace) && selection.objectName) {
                return selection.objectName;
            }
            var folderNames = selection.folderNames;
            //if (selection && jolokia && folderNames && folderNames.length > 1) {
            var parent = selection ? selection.parent : null;
            if (selection && parent && jolokia && folderNames && folderNames.length > 1) {
                mbean = parent.objectName;
                // we might be a destination, so lets try one more parent
                if (!mbean && parent) {
                    mbean = parent.parent.objectName;
                }
                if (!mbean) {
                    mbean = "" + folderNames[0] + ":BrokerName=" + folderNames[1] + ",Type=Broker";
                }
            }
            return mbean;
        }
        $scope.createDestination = function (name, isQueue) {
            var mbean = getBrokerMBean(jolokia);
            if (mbean) {
                var operation;
                if (isQueue === "true") {
                    operation = "addQueue(java.lang.String)";
                    $scope.message = "Created queue " + name;
                }
                else {
                    operation = "addTopic(java.lang.String)";
                    $scope.message = "Created topic " + name;
                }
                if (mbean) {
                    jolokia.execute(mbean, operation, name, Core.onSuccess(operationSuccess));
                }
                else {
                    Core.notification("error", "Could not find the Broker MBean!");
                }
            }
        };
        $scope.deleteDestination = function () {
            var mbean = getBrokerMBean(jolokia);
            var selection = workspace.selection;
            var entries = selection.entries;
            if (mbean && selection && jolokia && entries) {
                var domain = selection.domain;
                var name = entries["Destination"] || entries["destinationName"] || selection.title;
                name = name.unescapeHTML();
                var isQueue = "Topic" !== (entries["Type"] || entries["destinationType"]);
                var operation;
                if (isQueue) {
                    operation = "removeQueue(java.lang.String)";
                    $scope.message = "Deleted queue " + name;
                }
                else {
                    operation = "removeTopic(java.lang.String)";
                    $scope.message = "Deleted topic " + name;
                }
                jolokia.execute(mbean, operation, name, Core.onSuccess(deleteSuccess));
            }
        };
        $scope.purgeDestination = function () {
            var mbean = workspace.getSelectedMBeanName();
            var selection = workspace.selection;
            var entries = selection.entries;
            if (mbean && selection && jolokia && entries) {
                var name = entries["Destination"] || entries["destinationName"] || selection.title;
                name = name.unescapeHTML();
                var operation = "purge()";
                $scope.message = "Purged queue " + name;
                jolokia.execute(mbean, operation, Core.onSuccess(operationSuccess));
            }
        };
        $scope.name = function () {
            var selection = workspace.selection;
            if (selection) {
                return selection.title;
            }
            return null;
        };
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module.controller("ActiveMQ.DurableSubscriberController", ["$scope", "workspace", "jolokia", function ($scope, workspace, jolokia) {
        $scope.refresh = loadTable;
        $scope.durableSubscribers = [];
        $scope.tempData = [];
        $scope.createSubscriberDialog = new UI.Dialog();
        $scope.deleteSubscriberDialog = new UI.Dialog();
        $scope.showSubscriberDialog = new UI.Dialog();
        $scope.topicName = '';
        $scope.clientId = '';
        $scope.subscriberName = '';
        $scope.subSelector = '';
        $scope.gridOptions = {
            selectedItems: [],
            data: 'durableSubscribers',
            displayFooter: false,
            showFilter: false,
            showColumnMenu: true,
            enableCellSelection: false,
            enableColumnResize: true,
            enableColumnReordering: true,
            selectWithCheckboxOnly: false,
            showSelectionCheckbox: false,
            multiSelect: false,
            displaySelectionCheckbox: false,
            filterOptions: {
                filterText: ''
            },
            maintainColumnRatios: false,
            columnDefs: [
                {
                    field: 'destinationName',
                    displayName: 'Topic',
                    width: '30%'
                },
                {
                    field: 'clientId',
                    displayName: 'Client ID',
                    width: '30%'
                },
                {
                    field: 'consumerId',
                    displayName: 'Consumer ID',
                    cellTemplate: '<div class="ngCellText"><span ng-hide="row.entity.status != \'Offline\'">{{row.entity.consumerId}}</span><a ng-show="row.entity.status != \'Offline\'" ng-click="openSubscriberDialog(row)">{{row.entity.consumerId}}</a></div>',
                    width: '30%'
                },
                {
                    field: 'status',
                    displayName: 'Status',
                    width: '10%'
                }
            ]
        };
        $scope.doCreateSubscriber = function (clientId, subscriberName, topicName, subSelector) {
            $scope.createSubscriberDialog.close();
            $scope.clientId = clientId;
            $scope.subscriberName = subscriberName;
            $scope.topicName = topicName;
            $scope.subSelector = subSelector;
            if (Core.isBlank($scope.subSelector)) {
                $scope.subSelector = null;
            }
            var mbean = getBrokerMBean(jolokia);
            if (mbean) {
                jolokia.execute(mbean, "createDurableSubscriber(java.lang.String, java.lang.String, java.lang.String, java.lang.String)", $scope.clientId, $scope.subscriberName, $scope.topicName, $scope.subSelector, Core.onSuccess(function () {
                    Core.notification('success', "Created durable subscriber " + clientId);
                    $scope.clientId = '';
                    $scope.subscriberName = '';
                    $scope.topicName = '';
                    $scope.subSelector = '';
                    loadTable();
                }));
            }
            else {
                Core.notification("error", "Could not find the Broker MBean!");
            }
        };
        $scope.deleteSubscribers = function () {
            var mbean = $scope.gridOptions.selectedItems[0]._id;
            jolokia.execute(mbean, "destroy()", Core.onSuccess(function () {
                $scope.showSubscriberDialog.close();
                Core.notification('success', "Deleted durable subscriber");
                loadTable();
                $scope.gridOptions.selectedItems.splice(0, $scope.gridOptions.selectedItems.length);
            }));
        };
        $scope.openSubscriberDialog = function (subscriber) {
            jolokia.request({ type: "read", mbean: subscriber.entity._id }, Core.onSuccess(function (response) {
                $scope.showSubscriberDialog.subscriber = response.value;
                $scope.showSubscriberDialog.subscriber.Status = subscriber.entity.status;
                console.log("Subscriber is now " + $scope.showSubscriberDialog.subscriber);
                Core.$apply($scope);
                // now lets start opening the dialog
                setTimeout(function () {
                    $scope.showSubscriberDialog.open();
                    Core.$apply($scope);
                }, 100);
            }));
        };
        $scope.topicNames = function (completionText) {
            var topicsFolder = ActiveMQ.getSelectionTopicsFolder(workspace);
            return (topicsFolder) ? topicsFolder.children.map(function (n) { return n.title; }) : [];
        };
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            // lets defer execution as we may not have the selection just yet
            setTimeout(loadTable, 50);
        });
        function loadTable() {
            var mbean = getBrokerMBean(jolokia);
            if (mbean) {
                $scope.durableSubscribers = [];
                jolokia.request({ type: "read", mbean: mbean, attribute: ["DurableTopicSubscribers"] }, Core.onSuccess(function (response) { return populateTable(response, "DurableTopicSubscribers", "Active"); }));
                jolokia.request({ type: "read", mbean: mbean, attribute: ["InactiveDurableTopicSubscribers"] }, Core.onSuccess(function (response) { return populateTable(response, "InactiveDurableTopicSubscribers", "Offline"); }));
            }
        }
        function populateTable(response, attr, status) {
            var data = response.value;
            ActiveMQ.log.debug("Got data: ", data);
            $scope.durableSubscribers.push.apply($scope.durableSubscribers, data[attr].map(function (o) {
                var objectName = o["objectName"];
                var entries = Core.objectNameProperties(objectName);
                if (!('objectName' in o)) {
                    if ('canonicalName' in o) {
                        objectName = o['canonicalName'];
                    }
                    entries = _.cloneDeep(o['keyPropertyList']);
                }
                entries["_id"] = objectName;
                entries["status"] = status;
                return entries;
            }));
            Core.$apply($scope);
        }
        function getBrokerMBean(jolokia) {
            var mbean = null;
            var selection = workspace.selection;
            if (selection && ActiveMQ.isBroker(workspace) && selection.objectName) {
                return selection.objectName;
            }
            var folderNames = selection.folderNames;
            //if (selection && jolokia && folderNames && folderNames.length > 1) {
            var parent = selection ? selection.parent : null;
            if (selection && parent && jolokia && folderNames && folderNames.length > 1) {
                mbean = parent.objectName;
                // we might be a destination, so lets try one more parent
                if (!mbean && parent) {
                    mbean = parent.parent.objectName;
                }
                if (!mbean) {
                    mbean = "" + folderNames[0] + ":BrokerName=" + folderNames[1] + ",Type=Broker";
                }
            }
            return mbean;
        }
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module.controller("ActiveMQ.JobSchedulerController", ["$scope", "workspace", "jolokia", function ($scope, workspace, jolokia) {
        $scope.refresh = loadTable;
        $scope.jobs = [];
        $scope.deleteJobsDialog = new UI.Dialog();
        $scope.gridOptions = {
            selectedItems: [],
            data: 'jobs',
            displayFooter: false,
            showFilter: false,
            showColumnMenu: true,
            enableColumnResize: true,
            enableColumnReordering: true,
            filterOptions: {
                filterText: ''
            },
            selectWithCheckboxOnly: true,
            showSelectionCheckbox: true,
            maintainColumnRatios: false,
            columnDefs: [
                {
                    field: 'jobId',
                    displayName: 'Job ID',
                    width: '25%'
                },
                {
                    field: 'cronEntry',
                    displayName: 'Cron Entry',
                    width: '10%'
                },
                {
                    field: 'delay',
                    displayName: 'Delay',
                    width: '5%'
                },
                {
                    field: 'repeat',
                    displayName: 'repeat',
                    width: '5%'
                },
                {
                    field: 'period',
                    displayName: 'period',
                    width: '5%'
                },
                {
                    field: 'start',
                    displayName: 'Start',
                    width: '25%'
                },
                {
                    field: 'next',
                    displayName: 'Next',
                    width: '25%'
                }
            ]
        };
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            // lets defer execution as we may not have the selection just yet
            setTimeout(loadTable, 50);
        });
        function loadTable() {
            var selection = workspace.selection;
            if (selection) {
                var mbean = selection.objectName;
                if (mbean) {
                    jolokia.request({ type: 'read', mbean: mbean, attribute: "AllJobs" }, Core.onSuccess(populateTable));
                }
            }
            Core.$apply($scope);
        }
        function populateTable(response) {
            var data = response.value;
            if (!angular.isArray(data)) {
                $scope.jobs = [];
                angular.forEach(data, function (value, idx) {
                    $scope.jobs.push(value);
                });
            }
            else {
                $scope.jobs = data;
            }
            Core.$apply($scope);
        }
        $scope.deleteJobs = function () {
            var selection = workspace.selection;
            var mbean = selection.objectName;
            if (mbean && selection) {
                var selectedItems = $scope.gridOptions.selectedItems;
                $scope.message = "Deleted " + Core.maybePlural(selectedItems.length, "job");
                var operation = "removeJob(java.lang.String)";
                angular.forEach(selectedItems, function (item, idx) {
                    var id = item.jobId;
                    if (id) {
                        var callback = (idx + 1 < selectedItems.length) ? intermediateResult : operationSuccess;
                        jolokia.execute(mbean, operation, id, Core.onSuccess(callback));
                    }
                });
            }
        };
        function intermediateResult() {
        }
        function operationSuccess() {
            $scope.gridOptions.selectedItems.splice(0);
            Core.notification("success", $scope.message);
            setTimeout(loadTable, 50);
        }
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
/**
 * @module ActiveMQ
 */
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module.controller("ActiveMQ.PreferencesController", ["$scope", "localStorage", "userDetails", "$rootScope", function ($scope, localStorage, userDetails, $rootScope) {
        var config = {
            properties: {
                activemqUserName: {
                    type: 'string',
                    description: 'The user name to be used when connecting to the broker'
                },
                activemqPassword: {
                    type: 'string',
                    description: 'Password to be used when connecting to the broker'
                },
                activemqFilterAdvisoryTopics: {
                    type: 'boolean',
                    default: 'false',
                    description: 'Whether to exclude advisory topics in tree/table'
                },
                activemqBrowseBytesMessages: {
                    type: 'number',
                    enum: {
                        'Hex and text': 1,
                        'Decimal and text': 2,
                        'Hex': 4,
                        'Decimal': 8,
                        'Off': 99
                    },
                    description: 'Browsing byte messages should display the message body as'
                }
            }
        };
        $scope.entity = $scope;
        $scope.config = config;
        Core.initPreferenceScope($scope, localStorage, {
            'activemqUserName': {
                'value': userDetails.username ? userDetails.username : ""
            },
            'activemqPassword': {
                'value': userDetails.password ? userDetails.password : ""
            },
            'activemqBrowseBytesMessages': {
                'value': 1,
                'converter': parseInt
            },
            'activemqFilterAdvisoryTopics': {
                'value': false,
                'converter': Core.parseBooleanValue,
                'post': function (newValue) {
                    $rootScope.$broadcast('jmxTreeUpdated');
                }
            }
        });
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>
var ActiveMQ;
(function (ActiveMQ) {
    ActiveMQ._module.controller("ActiveMQ.TreeHeaderController", ["$scope", function ($scope) {
        $scope.expandAll = function () {
            Tree.expandAll("#activemqtree");
        };
        $scope.contractAll = function () {
            Tree.contractAll("#activemqtree");
        };
    }]);
    ActiveMQ._module.controller("ActiveMQ.TreeController", ["$scope", "$location", "workspace", "localStorage", function ($scope, $location, workspace, localStorage) {
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateSelectionFromURL, 50);
        });
        $scope.$watch('workspace.tree', function () {
            reloadTree();
        });
        $scope.$on('jmxTreeUpdated', function () {
            reloadTree();
        });
        function reloadTree() {
            ActiveMQ.log.debug("workspace tree has changed, lets reload the activemq tree");
            var children = [];
            var tree = workspace.tree;
            if (tree) {
                var domainName = "org.apache.activemq";
                var folder = tree.get(domainName);
                if (folder) {
                    children = folder.children;
                }
                if (children.length) {
                    var firstChild = children[0];
                    // the children could be AMQ 5.7 style broker name folder with the actual MBean in the children
                    // along with folders for the Queues etc...
                    if (!firstChild.typeName && firstChild.children.length < 4) {
                        // lets avoid the top level folder
                        var answer = [];
                        angular.forEach(children, function (child) {
                            answer = answer.concat(child.children);
                        });
                        children = answer;
                    }
                }
                // filter out advisory topics
                children.forEach(function (broker) {
                    var grandChildren = broker.children;
                    if (grandChildren) {
                        Tree.sanitize(grandChildren);
                        var idx = grandChildren.findIndex(function (n) { return n.title === "Topic"; });
                        if (idx > 0) {
                            var old = grandChildren[idx];
                            // we need to store all topics the first time on the workspace
                            // so we have access to them later if the user changes the filter in the preferences
                            var key = "ActiveMQ-allTopics-" + broker.title;
                            var allTopics = old.children.clone();
                            workspace.mapData[key] = allTopics;
                            var filter = Core.parseBooleanValue(localStorage["activemqFilterAdvisoryTopics"]);
                            if (filter) {
                                if (old && old.children) {
                                    var filteredTopics = old.children.filter(function (c) { return !c.title.startsWith("ActiveMQ.Advisory"); });
                                    old.children = filteredTopics;
                                }
                            }
                            else if (allTopics) {
                                old.children = allTopics;
                            }
                        }
                    }
                });
                var treeElement = $("#activemqtree");
                Jmx.enableTree($scope, $location, workspace, treeElement, children, true);
                // lets do this asynchronously to avoid Error: $digest already in progress
                setTimeout(updateSelectionFromURL, 50);
            }
        }
        function updateSelectionFromURL() {
            Jmx.updateTreeSelectionFromURLAndAutoSelect($location, $("#activemqtree"), function (first) {
                // use function to auto select the queue folder on the 1st broker
                var queues = first.getChildren()[0];
                if (queues && queues.data.title === 'Queue') {
                    first = queues;
                    first.expand(true);
                    return first;
                }
                return null;
            }, true);
        }
    }]);
})(ActiveMQ || (ActiveMQ = {}));

/// <reference path="../../includes.ts"/>
/**
 * @module Camel
 */
var Camel;
(function (Camel) {
    Camel.log = Logger.get("Camel");
    Camel.jmxDomain = 'org.apache.camel';
    Camel.defaultMaximumLabelWidth = 34;
    Camel.defaultCamelMaximumTraceOrDebugBodyLength = 5000;
    Camel.defaultCamelTraceOrDebugIncludeStreams = true;
    Camel.defaultCamelRouteMetricMaxSeconds = 10;
    Camel.defaultHideOptionDocumentation = false;
    Camel.defaultHideOptionDefaultValue = false;
    Camel.defaultHideOptionUnusedValue = false;
    Camel._apacheCamelModel = undefined;
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        Camel._apacheCamelModel = window['_apacheCamelModel'];
        Camel.log.debug("Setting apache camel model: ", Camel._apacheCamelModel);
        next();
    });
    /**
     * Does the given CamelContext has any rest services
     *
     * @param workspace
     * @param jolokia
     * @returns {boolean}
     */
    function hasRestServices(workspace, jolokia) {
        var mbean = getSelectionCamelRestRegistry(workspace);
        if (mbean) {
            var reply = jolokia.request({ type: "read", mbean: mbean, attribute: ["NumberOfRestServices"] });
            var num = reply.value["NumberOfRestServices"];
            return num > 0;
        }
        else {
            return false;
        }
    }
    Camel.hasRestServices = hasRestServices;
    /**
     * Looks up the route XML for the given context and selected route and
     * processes the selected route's XML with the given function
     * @method processRouteXml
     * @param {Workspace} workspace
     * @param {Object} jolokia
     * @param {Folder} folder
     * @param {Function} onRoute
     */
    function processRouteXml(workspace, jolokia, folder, onRoute) {
        var selectedRouteId = getSelectedRouteId(workspace, folder);
        var mbean = getSelectionCamelContextMBean(workspace);
        function onRouteXml(response) {
            var route = null;
            var data = response ? response.value : null;
            if (data) {
                var doc = $.parseXML(data);
                var routes = $(doc).find("route[id='" + selectedRouteId + "']");
                if (routes && routes.length) {
                    route = routes[0];
                }
            }
            onRoute(route);
        }
        if (mbean && selectedRouteId) {
            jolokia.request({ type: 'exec', mbean: mbean, operation: 'dumpRoutesAsXml()' }, Core.onSuccess(onRouteXml, { error: onRouteXml }));
        }
        else {
            if (!selectedRouteId) {
                console.log("No selectedRouteId when trying to lazy load the route!");
            }
            onRoute(null);
        }
    }
    Camel.processRouteXml = processRouteXml;
    /**
     * Returns the URI string for the given EIP pattern node or null if it is not applicable
     * @method getRouteNodeUri
     * @param {Object} node
     * @return {String}
     */
    function getRouteNodeUri(node) {
        var uri = null;
        if (node) {
            uri = node.getAttribute("uri");
            if (!uri) {
                var ref = node.getAttribute("ref");
                if (ref) {
                    var method = node.getAttribute("method");
                    if (method) {
                        uri = ref + "." + method + "()";
                    }
                    else {
                        uri = "ref:" + ref;
                    }
                }
            }
        }
        return uri;
    }
    Camel.getRouteNodeUri = getRouteNodeUri;
    /**
     * Returns the JSON data for the camel folder; extracting it from the associated
     * routeXmlNode or using the previously extracted and/or edited JSON
     * @method getRouteFolderJSON
     * @param {Folder} folder
     * @param {Object} answer
     * @return {Object}
     */
    function getRouteFolderJSON(folder, answer) {
        if (answer === void 0) { answer = {}; }
        var nodeData = folder["camelNodeData"];
        if (!nodeData) {
            var routeXmlNode = folder["routeXmlNode"];
            if (routeXmlNode) {
                nodeData = Camel.getRouteNodeJSON(routeXmlNode);
            }
            if (!nodeData) {
                nodeData = answer;
            }
            folder["camelNodeData"] = nodeData;
        }
        return nodeData;
    }
    Camel.getRouteFolderJSON = getRouteFolderJSON;
    function getRouteNodeJSON(routeXmlNode, answer) {
        if (answer === void 0) { answer = {}; }
        if (routeXmlNode) {
            angular.forEach(routeXmlNode.attributes, function (attr) {
                answer[attr.name] = attr.value;
            });
            // lets not iterate into routes/rests or top level tags
            var localName = routeXmlNode.localName;
            if (localName !== "route" && localName !== "routes" && localName !== "camelContext" && localName !== "rests") {
                // lets look for nested elements and convert those
                // explicitly looking for expressions
                $(routeXmlNode).children("*").each(function (idx, element) {
                    var nodeName = element.localName;
                    var langSettings = Camel.camelLanguageSettings(nodeName);
                    if (langSettings) {
                        // TODO the expression key could be anything really; how should we know?
                        answer["expression"] = {
                            language: nodeName,
                            expression: element.textContent
                        };
                    }
                    else {
                        if (!isCamelPattern(nodeName)) {
                            var nested = getRouteNodeJSON(element);
                            if (nested) {
                                // unwrap the nested expression which we do not want to double wrap
                                if (nested["expression"]) {
                                    nested = nested["expression"];
                                }
                                // special for aggregate as it has duplicate option names
                                if (nodeName === "completionSize") {
                                    nodeName = "completionSizeExpression";
                                }
                                else if (nodeName === "completionTimeout") {
                                    nodeName = "completionTimeoutExpression";
                                }
                                answer[nodeName] = nested;
                            }
                        }
                    }
                });
            }
        }
        return answer;
    }
    Camel.getRouteNodeJSON = getRouteNodeJSON;
    function increaseIndent(currentIndent, indentAmount) {
        if (indentAmount === void 0) { indentAmount = "  "; }
        return currentIndent + indentAmount;
    }
    Camel.increaseIndent = increaseIndent;
    function setRouteNodeJSON(routeXmlNode, newData, indent) {
        if (routeXmlNode) {
            var childIndent = increaseIndent(indent);
            function doUpdate(value, key, append) {
                if (append === void 0) { append = false; }
                if (angular.isArray(value)) {
                    // remove previous nodes
                    $(routeXmlNode).children(key).remove();
                    angular.forEach(value, function (item) {
                        doUpdate(item, key, true);
                    });
                }
                else if (angular.isObject(value)) {
                    // convert languages to the right xml
                    var textContent = null;
                    if (key === "expression") {
                        var languageName = value["language"];
                        if (languageName) {
                            key = languageName;
                            textContent = value["expression"];
                            value = angular.copy(value);
                            delete value["expression"];
                            delete value["language"];
                        }
                    }
                    // TODO deal with nested objects...
                    var nested = $(routeXmlNode).children(key);
                    var element = null;
                    if (append || !nested || !nested.length) {
                        var doc = routeXmlNode.ownerDocument || document;
                        routeXmlNode.appendChild(doc.createTextNode("\n" + childIndent));
                        element = doc.createElementNS(routeXmlNode.namespaceURI, key);
                        if (textContent) {
                            element.appendChild(doc.createTextNode(textContent));
                        }
                        routeXmlNode.appendChild(element);
                    }
                    else {
                        element = nested[0];
                    }
                    setRouteNodeJSON(element, value, childIndent);
                    if (textContent) {
                        nested.text(textContent);
                    }
                }
                else {
                    if (value) {
                        if (key.startsWith("_")) {
                        }
                        else {
                            var text = value.toString();
                            routeXmlNode.setAttribute(key, text);
                        }
                    }
                    else {
                        routeXmlNode.removeAttribute(key);
                    }
                }
            }
            angular.forEach(newData, function (value, key) { return doUpdate(value, key, false); });
        }
    }
    Camel.setRouteNodeJSON = setRouteNodeJSON;
    function getRouteNodeIcon(nodeSettingsOrXmlNode) {
        var nodeSettings = null;
        if (nodeSettingsOrXmlNode) {
            var nodeName = nodeSettingsOrXmlNode.localName;
            if (nodeName) {
                nodeSettings = getCamelSchema(nodeName);
            }
            else {
                nodeSettings = nodeSettingsOrXmlNode;
            }
        }
        if (nodeSettings) {
            var imageName = nodeSettings["icon"] || "generic24.png";
            // use document base to built the url to the icon
            var injector = HawtioCore.injector;
            if (injector) {
                var documentBase = injector.get("documentBase");
                if (documentBase) {
                    return UrlHelpers.join(documentBase, "/img/icons/camel/", imageName);
                }
            }
            else {
                // fallback if no injector
                return UrlHelpers.join("img/icons/camel/", imageName);
            }
        }
        else {
            return null;
        }
    }
    Camel.getRouteNodeIcon = getRouteNodeIcon;
    /**
     * Parse out the currently selected endpoint's name to be used when invoking on a
     * context operation that wants an endpoint name
     * @method getSelectedEndpointName
     * @param {Workspace} workspace
     * @return {any} either a string that is the endpoint name or null if it couldn't be parsed
     */
    function getSelectedEndpointName(workspace) {
        var selection = workspace.selection;
        if (selection && selection['objectName'] && selection['typeName'] && selection['typeName'] === 'endpoints') {
            var mbean = Core.parseMBean(selection['objectName']);
            if (!mbean) {
                return null;
            }
            var attributes = mbean['attributes'];
            if (!attributes) {
                return null;
            }
            if (!('name' in attributes)) {
                return null;
            }
            var uri = attributes['name'];
            uri = uri.replace("\\?", "?");
            if (uri.startsWith("\"")) {
                uri = uri.last(uri.length - 1);
            }
            if (uri.endsWith("\"")) {
                uri = uri.first(uri.length - 1);
            }
            return uri;
        }
        else {
            return null;
        }
    }
    Camel.getSelectedEndpointName = getSelectedEndpointName;
    /**
     * Escapes the given URI text so it can be used in a JMX name
     */
    function escapeEndpointUriNameForJmx(uri) {
        if (angular.isString(uri)) {
            var answer = uri.replace("?", "\\?");
            // lets ensure that we have a "//" after each ":"
            answer = answer.replace(/\:(\/[^\/])/, "://$1");
            answer = answer.replace(/\:([^\/])/, "://$1");
            return answer;
        }
        else {
            return uri;
        }
    }
    Camel.escapeEndpointUriNameForJmx = escapeEndpointUriNameForJmx;
    /**
     * Returns the mbean for the currently selected camel context and the name of the currently
     * selected endpoint for JMX operations on a context that require an endpoint name.
     * @method
     * @param workspace
     * @return {{uri: string, mbean: string}} either value could be null if there's a parse failure
     */
    function getContextAndTargetEndpoint(workspace) {
        return {
            uri: Camel.getSelectedEndpointName(workspace),
            mbean: Camel.getSelectionCamelContextMBean(workspace)
        };
    }
    Camel.getContextAndTargetEndpoint = getContextAndTargetEndpoint;
    /**
     * Returns the cached Camel XML route node stored in the current tree selection Folder
     * @method
     */
    function getSelectedRouteNode(workspace) {
        var selection = workspace.selection || workspace.getSelectedMBean();
        return (selection && Camel.jmxDomain === selection.domain) ? selection["routeXmlNode"] : null;
    }
    Camel.getSelectedRouteNode = getSelectedRouteNode;
    /**
     * Flushes the cached Camel XML route node stored in the selected tree Folder
     * @method
     * @param workspace
     */
    function clearSelectedRouteNode(workspace) {
        var selection = workspace.selection;
        if (selection && Camel.jmxDomain === selection.domain) {
            delete selection["routeXmlNode"];
        }
    }
    Camel.clearSelectedRouteNode = clearSelectedRouteNode;
    /**
     * Looks up the given node name in the Camel schema
     * @method
     */
    function getCamelSchema(nodeIdOrDefinition) {
        return (angular.isObject(nodeIdOrDefinition)) ? nodeIdOrDefinition : Forms.lookupDefinition(nodeIdOrDefinition, Camel._apacheCamelModel);
    }
    Camel.getCamelSchema = getCamelSchema;
    /**
     * Returns true if the given nodeId is a route, endpoint or pattern
     * (and not some nested type like a data format)
     * @method
     */
    function isCamelPattern(nodeId) {
        return Forms.lookupDefinition(nodeId, Camel._apacheCamelModel) != null;
    }
    Camel.isCamelPattern = isCamelPattern;
    /**
     * Returns true if the given node type prefers adding the next sibling as a child
     * @method
     */
    function isNextSiblingAddedAsChild(nodeIdOrDefinition) {
        var definition = getCamelSchema(nodeIdOrDefinition);
        if (definition) {
            return definition["nextSiblingAddedAsChild"] || false;
        }
        return null;
    }
    Camel.isNextSiblingAddedAsChild = isNextSiblingAddedAsChild;
    function acceptInput(nodeIdOrDefinition) {
        var definition = getCamelSchema(nodeIdOrDefinition);
        if (definition) {
            return definition["acceptInput"] || false;
        }
        return null;
    }
    Camel.acceptInput = acceptInput;
    function acceptOutput(nodeIdOrDefinition) {
        var definition = getCamelSchema(nodeIdOrDefinition);
        if (definition) {
            return definition["acceptOutput"] || false;
        }
        return null;
    }
    Camel.acceptOutput = acceptOutput;
    /**
     * Looks up the Camel language settings for the given language name
     * @method
     */
    function camelLanguageSettings(nodeName) {
        return Camel._apacheCamelModel.languages[nodeName];
    }
    Camel.camelLanguageSettings = camelLanguageSettings;
    function isCamelLanguage(nodeName) {
        return (camelLanguageSettings(nodeName) || nodeName === "expression") ? true : false;
    }
    Camel.isCamelLanguage = isCamelLanguage;
    /**
     * Converts the XML string or DOM node to a camel tree
     * @method
     */
    function loadCamelTree(xml, key) {
        var doc = xml;
        if (angular.isString(xml)) {
            doc = $.parseXML(xml);
        }
        // TODO get id from camelContext
        var id = "camelContext";
        var folder = new Folder(id);
        folder.addClass = "org-apache-camel-context";
        folder.domain = Camel.jmxDomain;
        folder.typeName = "context";
        folder.key = Core.toSafeDomID(key);
        var context = $(doc).find("camelContext");
        if (!context || !context.length) {
            context = $(doc).find("routes");
        }
        if (context && context.length) {
            folder["xmlDocument"] = doc;
            folder["routeXmlNode"] = context;
            $(context).children("route").each(function (idx, route) {
                var id = route.getAttribute("id");
                if (!id) {
                    id = "route" + idx;
                    route.setAttribute("id", id);
                }
                var routeFolder = new Folder(id);
                routeFolder.addClass = "org-apache-camel-route";
                routeFolder.typeName = "routes";
                routeFolder.domain = Camel.jmxDomain;
                routeFolder.key = folder.key + "_" + Core.toSafeDomID(id);
                routeFolder.parent = folder;
                var nodeSettings = getCamelSchema("route");
                if (nodeSettings) {
                    var imageUrl = getRouteNodeIcon(nodeSettings);
                    routeFolder.tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || id;
                    routeFolder.icon = imageUrl;
                }
                folder.children.push(routeFolder);
                addRouteChildren(routeFolder, route);
            });
        }
        return folder;
    }
    Camel.loadCamelTree = loadCamelTree;
    /**
     * Adds the route children to the given folder for each step in the route
     * @method
     */
    function addRouteChildren(folder, route) {
        folder.children = [];
        folder["routeXmlNode"] = route;
        route.setAttribute("_cid", folder.key);
        $(route).children("*").each(function (idx, n) {
            addRouteChild(folder, n);
        });
    }
    Camel.addRouteChildren = addRouteChildren;
    /**
     * Adds a child to the given folder / route
     * @method
     */
    function addRouteChild(folder, n) {
        var nodeName = n.localName;
        if (nodeName) {
            var nodeSettings = getCamelSchema(nodeName);
            if (nodeSettings) {
                var imageUrl = getRouteNodeIcon(nodeSettings);
                var child = new Folder(nodeName);
                child.domain = Camel.jmxDomain;
                child.typeName = "routeNode";
                updateRouteNodeLabelAndTooltip(child, n, nodeSettings);
                // TODO should maybe auto-generate these?
                child.parent = folder;
                child.folderNames = folder.folderNames;
                var id = n.getAttribute("id") || nodeName;
                var key = folder.key + "_" + Core.toSafeDomID(id);
                // lets find the next key thats unique
                var counter = 1;
                var notFound = true;
                while (notFound) {
                    var tmpKey = key + counter;
                    if (folder.children.some({ key: tmpKey })) {
                        counter += 1;
                    }
                    else {
                        notFound = false;
                        key = tmpKey;
                    }
                }
                child.key = key;
                child.icon = imageUrl;
                child["routeXmlNode"] = n;
                if (!folder.children) {
                    folder.children = [];
                }
                folder.children.push(child);
                addRouteChildren(child, n);
                return child;
            }
        }
        return null;
    }
    Camel.addRouteChild = addRouteChild;
    /**
     * Returns the root JMX Folder of the camel mbeans
     */
    function getRootCamelFolder(workspace) {
        var tree = workspace ? workspace.tree : null;
        if (tree) {
            return tree.get(Camel.jmxDomain);
        }
        return null;
    }
    Camel.getRootCamelFolder = getRootCamelFolder;
    /**
     * Returns the JMX folder for the camel context
     */
    function getCamelContextFolder(workspace, camelContextId) {
        var answer = null;
        var root = getRootCamelFolder(workspace);
        if (root && camelContextId) {
            angular.forEach(root.children, function (contextFolder) {
                if (!answer && camelContextId === contextFolder.title) {
                    answer = contextFolder;
                }
            });
        }
        return answer;
    }
    Camel.getCamelContextFolder = getCamelContextFolder;
    /**
     * Returns the mbean for the given camel context ID or null if it cannot be found
     */
    function getCamelContextMBean(workspace, camelContextId) {
        var contextsFolder = getCamelContextFolder(workspace, camelContextId);
        if (contextsFolder) {
            var contextFolder = contextsFolder.navigate("context");
            if (contextFolder && contextFolder.children && contextFolder.children.length) {
                var contextItem = contextFolder.children[0];
                return contextItem.objectName;
            }
        }
        return null;
    }
    Camel.getCamelContextMBean = getCamelContextMBean;
    /**
     * Given a selection in the workspace try figure out the URL to the
     * full screen view
     */
    function linkToFullScreenView(workspace) {
        var answer = null;
        var selection = workspace.selection;
        if (selection) {
            var entries = selection.entries;
            if (entries) {
                var contextId = entries["context"];
                var name = entries["name"];
                var type = entries["type"];
                if ("endpoints" === type) {
                    return linkToBrowseEndpointFullScreen(contextId, name);
                }
                if ("routes" === type) {
                    return linkToRouteDiagramFullScreen(contextId, name);
                }
            }
        }
        return answer;
    }
    Camel.linkToFullScreenView = linkToFullScreenView;
    /**
     * Returns the link to browse the endpoint full screen
     */
    function linkToBrowseEndpointFullScreen(contextId, endpointPath) {
        var answer = null;
        if (contextId && endpointPath) {
            answer = "#/camel/endpoint/browse/" + contextId + "/" + endpointPath;
        }
        return answer;
    }
    Camel.linkToBrowseEndpointFullScreen = linkToBrowseEndpointFullScreen;
    /**
     * Returns the link to the route diagram full screen
     */
    function linkToRouteDiagramFullScreen(contextId, routeId) {
        var answer = null;
        if (contextId && routeId) {
            answer = "#/camel/route/diagram/" + contextId + "/" + routeId;
        }
        return answer;
    }
    Camel.linkToRouteDiagramFullScreen = linkToRouteDiagramFullScreen;
    function getFolderCamelNodeId(folder) {
        var answer = Core.pathGet(folder, ["routeXmlNode", "localName"]);
        return ("from" === answer || "to" === answer) ? "endpoint" : answer;
    }
    Camel.getFolderCamelNodeId = getFolderCamelNodeId;
    /**
     * Rebuilds the DOM tree from the tree node and performs all the various hacks
     * to turn the folder / JSON / model into valid camel XML
     * such as renaming language elements from <language expression="foo" language="bar/>
     * to <bar>foo</bar>
     * and changing <endpoint> into either <from> or <to>
     * @method
     * @param treeNode is either the Node from the tree widget (with the real Folder in the data property) or a Folder
     */
    function createFolderXmlTree(treeNode, xmlNode, indent) {
        if (indent === void 0) { indent = Camel.increaseIndent(""); }
        var folder = treeNode.data || treeNode;
        var count = 0;
        var parentName = getFolderCamelNodeId(folder);
        if (folder) {
            if (!xmlNode) {
                xmlNode = document.createElement(parentName);
                var rootJson = Camel.getRouteFolderJSON(folder);
                if (rootJson) {
                    Camel.setRouteNodeJSON(xmlNode, rootJson, indent);
                }
            }
            var doc = xmlNode.ownerDocument || document;
            var namespaceURI = xmlNode.namespaceURI;
            var from = parentName !== "route";
            var childIndent = Camel.increaseIndent(indent);
            angular.forEach(treeNode.children || treeNode.getChildren(), function (childTreeNode) {
                var childFolder = childTreeNode.data || childTreeNode;
                var name = Camel.getFolderCamelNodeId(childFolder);
                var json = Camel.getRouteFolderJSON(childFolder);
                if (name && json) {
                    var language = false;
                    if (name === "endpoint") {
                        if (from) {
                            name = "to";
                        }
                        else {
                            name = "from";
                            from = true;
                        }
                    }
                    if (name === "expression") {
                        var languageName = json["language"];
                        if (languageName) {
                            name = languageName;
                            language = true;
                        }
                    }
                    // lets create the XML
                    xmlNode.appendChild(doc.createTextNode("\n" + childIndent));
                    var newNode = doc.createElementNS(namespaceURI, name);
                    Camel.setRouteNodeJSON(newNode, json, childIndent);
                    xmlNode.appendChild(newNode);
                    count += 1;
                    createFolderXmlTree(childTreeNode, newNode, childIndent);
                }
            });
            if (count) {
                xmlNode.appendChild(doc.createTextNode("\n" + indent));
            }
        }
        return xmlNode;
    }
    Camel.createFolderXmlTree = createFolderXmlTree;
    function updateRouteNodeLabelAndTooltip(folder, routeXmlNode, nodeSettings) {
        var localName = routeXmlNode.localName;
        var id = routeXmlNode.getAttribute("id");
        var label = nodeSettings["title"] || localName;
        // lets use the ID for routes and other things we give an id
        var tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || label;
        if (id) {
            label = id;
        }
        else {
            var uri = getRouteNodeUri(routeXmlNode);
            if (uri) {
                // Don't use from/to as it gets odd if you drag/drop and reorder
                // label += " " + uri;
                label = uri;
                var split = uri.split("?");
                if (split && split.length > 1) {
                    label = split[0];
                }
                tooltip += " " + uri;
            }
            else {
                var children = $(routeXmlNode).children("*");
                if (children && children.length) {
                    var child = children[0];
                    var childName = child.localName;
                    var expression = null;
                    if (Camel.isCamelLanguage(childName)) {
                        expression = child.textContent;
                        if (!expression) {
                            expression = child.getAttribute("expression");
                        }
                    }
                    if (expression) {
                        label += " " + expression;
                        tooltip += " " + childName + " expression";
                    }
                }
            }
        }
        folder.title = label;
        folder.tooltip = tooltip;
        return label;
    }
    Camel.updateRouteNodeLabelAndTooltip = updateRouteNodeLabelAndTooltip;
    /**
     * Returns the selected camel context mbean for the given selection or null if it cannot be found
     * @method
     */
    // TODO should be a service
    function getSelectionCamelContextMBean(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "context");
                    if (result && result.children) {
                        var contextBean = result.children.first();
                        if (contextBean.title) {
                            var contextName = contextBean.title;
                            return "" + domain + ":context=" + contextId + ',type=context,name="' + contextName + '"';
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelContextMBean = getSelectionCamelContextMBean;
    function getSelectionCamelContextEndpoints(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    return tree.navigate(domain, contextId, "endpoints");
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelContextEndpoints = getSelectionCamelContextEndpoints;
    /**
     * Returns the selected camel trace mbean for the given selection or null if it cannot be found
     * @method
     */
    // TODO Should be a service
    function getSelectionCamelTraceMBean(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    // look for the Camel 2.11 mbean which we prefer
                    var result = tree.navigate(domain, contextId, "tracer");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("BacklogTracer"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelTraceMBean = getSelectionCamelTraceMBean;
    function getSelectionCamelDebugMBean(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "tracer");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("BacklogDebugger"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelDebugMBean = getSelectionCamelDebugMBean;
    function getSelectionCamelTypeConverter(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "services");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("DefaultTypeConverter"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelTypeConverter = getSelectionCamelTypeConverter;
    function getSelectionCamelRestRegistry(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "services");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("DefaultRestRegistry"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelRestRegistry = getSelectionCamelRestRegistry;
    function getSelectionCamelEndpointRuntimeRegistry(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "services");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("DefaultRuntimeEndpointRegistry"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelEndpointRuntimeRegistry = getSelectionCamelEndpointRuntimeRegistry;
    function getSelectionCamelInflightRepository(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "services");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("DefaultInflightRepository"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelInflightRepository = getSelectionCamelInflightRepository;
    function getSelectionCamelRouteMetrics(workspace) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "services");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title.startsWith("MetricsRegistryService"); });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionCamelRouteMetrics = getSelectionCamelRouteMetrics;
    // TODO should be a service
    function getContextId(workspace) {
        var selection = workspace.selection;
        if (selection) {
            // find the camel context and find ancestors in the tree until we find the camel context selection
            // this is either if the title is 'context' or if the parent title is 'org.apache.camel' (the Camel tree is a bit special)
            selection = selection.findAncestor(function (s) { return s.title === 'context' || s.parent != null && s.parent.title === 'org.apache.camel'; });
            if (selection) {
                var tree = workspace.tree;
                var folderNames = selection.folderNames;
                var entries = selection.entries;
                var contextId;
                if (tree) {
                    if (folderNames && folderNames.length > 1) {
                        contextId = folderNames[1];
                    }
                    else if (entries) {
                        contextId = entries["context"];
                    }
                }
            }
        }
        return contextId;
    }
    Camel.getContextId = getContextId;
    /**
     * Returns true if the state of the item begins with the given state - or one of the given states
     * @method
     * @param item the item which has a State
     * @param state a value or an array of states
     */
    function isState(item, state) {
        var value = (item.State || "").toLowerCase();
        if (angular.isArray(state)) {
            return state.any(function (stateText) { return value.startsWith(stateText); });
        }
        else {
            return value.startsWith(state);
        }
    }
    Camel.isState = isState;
    function iconClass(state) {
        if (state) {
            switch (state.toLowerCase()) {
                case 'started':
                    return "green fa fa-play-circle";
                case 'suspended':
                    return "fa fa-pause";
            }
        }
        return "orange fa fa-off";
    }
    Camel.iconClass = iconClass;
    function getSelectedRouteId(workspace, folder) {
        if (folder === void 0) { folder = null; }
        var selection = folder || workspace.selection;
        var selectedRouteId = null;
        if (selection) {
            if (selection && selection.entries) {
                var typeName = selection.entries["type"];
                var name = selection.entries["name"];
                if ("routes" === typeName && name) {
                    selectedRouteId = Core.trimQuotes(name);
                }
            }
        }
        return selectedRouteId;
    }
    Camel.getSelectedRouteId = getSelectedRouteId;
    /**
     * Returns the selected camel route mbean for the given route id
     * @method
     */
    // TODO Should be a service
    function getSelectionRouteMBean(workspace, routeId) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "routes");
                    if (result && result.children) {
                        var mbean = result.children.find(function (m) { return m.title === routeId; });
                        if (mbean) {
                            return mbean.objectName;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getSelectionRouteMBean = getSelectionRouteMBean;
    function getCamelVersion(workspace, jolokia) {
        if (workspace) {
            var contextId = getContextId(workspace);
            var selection = workspace.selection;
            var tree = workspace.tree;
            if (tree && selection) {
                var domain = selection.domain;
                if (domain && contextId) {
                    var result = tree.navigate(domain, contextId, "context");
                    if (result && result.children) {
                        var contextBean = result.children.first();
                        if (contextBean.version) {
                            // read the cached version
                            return contextBean.version;
                        }
                        if (contextBean.title) {
                            // okay no version cached, so need to get the version using jolokia
                            var contextName = contextBean.title;
                            var mbean = "" + domain + ":context=" + contextId + ',type=context,name="' + contextName + '"';
                            // must use Core.onSuccess(null) that means sync as we need the version asap
                            var version = jolokia.getAttribute(mbean, "CamelVersion", Core.onSuccess(null));
                            // cache version so we do not need to read it again using jolokia
                            contextBean.version = version;
                            return version;
                        }
                    }
                }
            }
        }
        return null;
    }
    Camel.getCamelVersion = getCamelVersion;
    function createMessageFromXml(exchange) {
        var exchangeElement = $(exchange);
        var uid = exchangeElement.children("uid").text();
        var timestamp = exchangeElement.children("timestamp").text();
        var messageData = {
            headers: {},
            headerTypes: {},
            id: null,
            uid: uid,
            timestamp: timestamp,
            headerHtml: ""
        };
        var message = exchangeElement.children("message")[0];
        if (!message) {
            message = exchange;
        }
        var messageElement = $(message);
        var headers = messageElement.find("header");
        var headerHtml = "";
        headers.each(function (idx, header) {
            var key = header.getAttribute("key");
            var typeName = header.getAttribute("type");
            var value = header.textContent;
            if (key) {
                if (value)
                    messageData.headers[key] = value;
                if (typeName)
                    messageData.headerTypes[key] = typeName;
                headerHtml += "<tr><td class='property-name'>" + key + "</td>" + "<td class='property-value'>" + (humanizeJavaType(typeName)) + "</td>" + "<td class='property-value'>" + (value || "") + "</td></tr>";
            }
        });
        messageData.headerHtml = headerHtml;
        var id = messageData.headers["breadcrumbId"];
        if (!id) {
            var postFixes = ["MessageID", "ID", "Path", "Name"];
            angular.forEach(postFixes, function (postfix) {
                if (!id) {
                    angular.forEach(messageData.headers, function (value, key) {
                        if (!id && key.endsWith(postfix)) {
                            id = value;
                        }
                    });
                }
            });
            // lets find the first header with a name or Path in it
            // if still no value, lets use the first :)
            angular.forEach(messageData.headers, function (value, key) {
                if (!id)
                    id = value;
            });
        }
        messageData.id = id;
        var body = messageElement.children("body")[0];
        if (body) {
            var bodyText = body.textContent;
            var bodyType = body.getAttribute("type");
            messageData["body"] = bodyText;
            messageData["bodyType"] = humanizeJavaType(bodyType);
        }
        return messageData;
    }
    Camel.createMessageFromXml = createMessageFromXml;
    function humanizeJavaType(type) {
        if (!type) {
            return "";
        }
        // skip leading java.lang
        if (type.startsWith("java.lang")) {
            return type.substr(10);
        }
        return type;
    }
    Camel.humanizeJavaType = humanizeJavaType;
    function createBrowseGridOptions() {
        return {
            selectedItems: [],
            data: 'messages',
            displayFooter: false,
            showFilter: false,
            showColumnMenu: true,
            enableColumnResize: true,
            enableColumnReordering: true,
            filterOptions: {
                filterText: ''
            },
            selectWithCheckboxOnly: true,
            showSelectionCheckbox: true,
            maintainColumnRatios: false,
            columnDefs: [
                {
                    field: 'id',
                    displayName: 'ID',
                    // for ng-grid
                    //width: '50%',
                    // for hawtio-datatable
                    // width: "22em",
                    cellTemplate: '<div class="ngCellText"><a href="" ng-click="row.entity.openMessageDialog(row)">{{row.entity.id}}</a></div>'
                }
            ]
        };
    }
    Camel.createBrowseGridOptions = createBrowseGridOptions;
    function loadRouteXmlNodes($scope, doc, selectedRouteId, nodes, links, width) {
        var allRoutes = $(doc).find("route");
        var routeDelta = width / allRoutes.length;
        var rowX = 0;
        allRoutes.each(function (idx, route) {
            var routeId = route.getAttribute("id");
            if (!selectedRouteId || !routeId || selectedRouteId === routeId) {
                Camel.addRouteXmlChildren($scope, route, nodes, links, null, rowX, 0);
                rowX += routeDelta;
            }
        });
    }
    Camel.loadRouteXmlNodes = loadRouteXmlNodes;
    function addRouteXmlChildren($scope, parent, nodes, links, parentId, parentX, parentY, parentNode) {
        if (parentNode === void 0) { parentNode = null; }
        var delta = 150;
        var x = parentX;
        var y = parentY + delta;
        var rid = parent.getAttribute("id");
        var siblingNodes = [];
        var parenNodeName = parent.localName;
        $(parent).children().each(function (idx, route) {
            var id = nodes.length;
            // from acts as a parent even though its a previous sibling :)
            var nodeId = route.localName;
            if (nodeId === "from" && !parentId) {
                parentId = id;
            }
            var nodeSettings = getCamelSchema(nodeId);
            var node = null;
            if (nodeSettings) {
                var label = nodeSettings["title"] || nodeId;
                var uri = getRouteNodeUri(route);
                if (uri) {
                    label += " " + uri.split("?")[0];
                }
                var tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || label;
                if (uri) {
                    tooltip += " " + uri;
                }
                var elementID = route.getAttribute("id");
                var labelSummary = label;
                if (elementID) {
                    var customId = route.getAttribute("customId");
                    if ($scope.camelIgnoreIdForLabel || (!customId || customId === "false")) {
                        labelSummary = "id: " + elementID;
                    }
                    else {
                        label = elementID;
                    }
                }
                // lets check if we need to trim the label
                var labelLimit = $scope.camelMaximumLabelWidth || Camel.defaultMaximumLabelWidth;
                var length = label.length;
                if (length > labelLimit) {
                    labelSummary = label + "\n\n" + labelSummary;
                    label = label.substring(0, labelLimit) + "..";
                }
                var imageUrl = getRouteNodeIcon(nodeSettings);
                if ((nodeId === "from" || nodeId === "to") && uri) {
                    var uriIdx = uri.indexOf(":");
                    if (uriIdx > 0) {
                        var componentScheme = uri.substring(0, uriIdx);
                        //console.log("lets find the endpoint icon for " + componentScheme);
                        if (componentScheme) {
                            var value = Camel.getEndpointIcon(componentScheme);
                            if (value) {
                                // use document base to built the url to the icon
                                var injector = HawtioCore.injector;
                                if (injector) {
                                    var documentBase = injector.get("documentBase");
                                    if (documentBase) {
                                        imageUrl = UrlHelpers.join(documentBase, value);
                                    }
                                }
                                else {
                                    // fallback if no injector
                                    imageUrl = Core.url(value);
                                }
                            }
                        }
                    }
                }
                //console.log("Image URL is " + imageUrl);
                var cid = route.getAttribute("_cid") || route.getAttribute("id");
                node = { "name": name, "label": label, "labelSummary": labelSummary, "group": 1, "id": id, "elementId": elementID, "x": x, "y:": y, "imageUrl": imageUrl, "cid": cid, "tooltip": tooltip, "type": nodeId };
                if (rid) {
                    node["rid"] = rid;
                    if (!$scope.routeNodes)
                        $scope.routeNodes = {};
                    $scope.routeNodes[rid] = node;
                }
                if (!cid) {
                    cid = nodeId + (nodes.length + 1);
                }
                if (cid) {
                    node["cid"] = cid;
                    if (!$scope.nodes)
                        $scope.nodes = {};
                    $scope.nodes[cid] = node;
                }
                // only use the route id on the first from node
                rid = null;
                nodes.push(node);
                if (parentId !== null && parentId !== id) {
                    if (siblingNodes.length === 0 || parenNodeName === "choice") {
                        links.push({ "source": parentId, "target": id, "value": 1 });
                    }
                    else {
                        siblingNodes.forEach(function (nodeId) {
                            links.push({ "source": nodeId, "target": id, "value": 1 });
                        });
                        siblingNodes.length = 0;
                    }
                }
            }
            else {
                // ignore non EIP nodes, though we should add expressions...
                var langSettings = Camel.camelLanguageSettings(nodeId);
                if (langSettings && parentNode) {
                    // lets add the language kind
                    var name = langSettings["name"] || nodeId;
                    var text = route.textContent;
                    if (text) {
                        parentNode["tooltip"] = parentNode["label"] + " " + name + " " + text;
                        parentNode["label"] = text;
                    }
                    else {
                        parentNode["label"] = parentNode["label"] + " " + name;
                    }
                }
            }
            var siblings = addRouteXmlChildren($scope, route, nodes, links, id, x, y, node);
            if (parenNodeName === "choice") {
                siblingNodes = siblingNodes.concat(siblings);
                x += delta;
            }
            else if (nodeId === "choice") {
                siblingNodes = siblings;
                y += delta;
            }
            else {
                siblingNodes = [nodes.length - 1];
                y += delta;
            }
        });
        return siblingNodes;
    }
    Camel.addRouteXmlChildren = addRouteXmlChildren;
    function getCanvasHeight(canvasDiv) {
        var height = canvasDiv.height();
        if (height < 300) {
            console.log("browse thinks the height is only " + height + " so calculating offset from doc height");
            var offset = canvasDiv.offset();
            height = $(document).height() - 5;
            if (offset) {
                var top = offset['top'];
                if (top) {
                    height -= top;
                }
            }
        }
        return height;
    }
    Camel.getCanvasHeight = getCanvasHeight;
    /**
     * Recursively add all the folders which have a cid value into the given map
     * @method
     */
    function addFoldersToIndex(folder, map) {
        if (map === void 0) { map = {}; }
        if (folder) {
            var key = folder.key;
            if (key) {
                map[key] = folder;
            }
            angular.forEach(folder.children, function (child) { return addFoldersToIndex(child, map); });
        }
        return map;
    }
    Camel.addFoldersToIndex = addFoldersToIndex;
    /**
     * Re-generates the XML document using the given Tree widget Node or Folder as the source
     * @method
     */
    function generateXmlFromFolder(treeNode) {
        var folder = (treeNode && treeNode.data) ? treeNode.data : treeNode;
        if (!folder)
            return null;
        var doc = folder["xmlDocument"];
        var context = folder["routeXmlNode"];
        if (context && context.length) {
            var element = context[0];
            var children = element.childNodes;
            var routeIndices = [];
            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                var name = node.localName;
                if ("route" === name && parent) {
                    routeIndices.push(i);
                }
            }
            while (routeIndices.length) {
                var idx = routeIndices.pop();
                var nextIndex = idx + 1;
                while (true) {
                    var node = element.childNodes[nextIndex];
                    if (Core.isTextNode(node)) {
                        element.removeChild(node);
                    }
                    else {
                        break;
                    }
                }
                if (idx < element.childNodes.length) {
                    element.removeChild(element.childNodes[idx]);
                }
                for (var i = idx - 1; i >= 0; i--) {
                    var node = element.childNodes[i];
                    if (Core.isTextNode(node)) {
                        element.removeChild(node);
                    }
                    else {
                        break;
                    }
                }
            }
            Camel.createFolderXmlTree(treeNode, context[0]);
        }
        return doc;
    }
    Camel.generateXmlFromFolder = generateXmlFromFolder;
    /**
     * Returns an object of all the CamelContext MBeans keyed by their id
     * @method
     */
    function camelContextMBeansById(workspace) {
        var answer = {};
        var tree = workspace.tree;
        if (tree) {
            var camelTree = tree.navigate(Camel.jmxDomain);
            if (camelTree) {
                angular.forEach(camelTree.children, function (contextsFolder) {
                    var contextFolder = contextsFolder.navigate("context");
                    if (contextFolder && contextFolder.children && contextFolder.children.length) {
                        var contextItem = contextFolder.children[0];
                        var id = Core.pathGet(contextItem, ["entries", "name"]) || contextItem.key;
                        if (id) {
                            answer[id] = {
                                folder: contextItem,
                                mbean: contextItem.objectName
                            };
                        }
                    }
                });
            }
        }
        return answer;
    }
    Camel.camelContextMBeansById = camelContextMBeansById;
    /**
     * Returns an object of all the CamelContext MBeans keyed by the component name
     * @method
     */
    function camelContextMBeansByComponentName(workspace) {
        return camelContextMBeansByRouteOrComponentId(workspace, "components");
    }
    Camel.camelContextMBeansByComponentName = camelContextMBeansByComponentName;
    /**
     * Returns an object of all the CamelContext MBeans keyed by the route ID
     * @method
     */
    function camelContextMBeansByRouteId(workspace) {
        return camelContextMBeansByRouteOrComponentId(workspace, "routes");
    }
    Camel.camelContextMBeansByRouteId = camelContextMBeansByRouteId;
    function camelContextMBeansByRouteOrComponentId(workspace, componentsOrRoutes) {
        var answer = {};
        var tree = workspace.tree;
        if (tree) {
            var camelTree = tree.navigate(Camel.jmxDomain);
            if (camelTree) {
                angular.forEach(camelTree.children, function (contextsFolder) {
                    var contextFolder = contextsFolder.navigate("context");
                    var componentsFolder = contextsFolder.navigate(componentsOrRoutes);
                    if (contextFolder && componentsFolder && contextFolder.children && contextFolder.children.length) {
                        var contextItem = contextFolder.children[0];
                        var mbean = contextItem.objectName;
                        if (mbean) {
                            var contextValues = {
                                folder: contextItem,
                                mbean: mbean
                            };
                            angular.forEach(componentsFolder.children, function (componentFolder) {
                                var id = componentFolder.title;
                                if (id) {
                                    answer[id] = contextValues;
                                }
                            });
                        }
                    }
                });
            }
        }
        return answer;
    }
    /**
     * Returns an object for the given processor from the Camel tree
     * @method
     */
    function camelProcessorMBeansById(workspace) {
        var answer = {};
        var tree = workspace.tree;
        if (tree) {
            var camelTree = tree.navigate(Camel.jmxDomain);
            if (camelTree) {
                angular.forEach(camelTree.children, function (contextsFolder) {
                    var processorsFolder = contextsFolder.navigate("processors");
                    if (processorsFolder && processorsFolder.children && processorsFolder.children.length) {
                        angular.forEach(processorsFolder.children, function (processorFolder) {
                            var id = processorFolder.title;
                            if (id) {
                                var processorValues = {
                                    folder: processorsFolder,
                                    key: processorFolder.key
                                };
                                answer[id] = processorValues;
                            }
                        });
                    }
                });
            }
        }
        return answer;
    }
    Camel.camelProcessorMBeansById = camelProcessorMBeansById;
    /**
     * Returns true if we should ignore ID values for labels in camel diagrams
     * @method
     */
    function ignoreIdForLabel(localStorage) {
        var value = localStorage["camelIgnoreIdForLabel"];
        return Core.parseBooleanValue(value);
    }
    Camel.ignoreIdForLabel = ignoreIdForLabel;
    /**
     * Returns the maximum width of a label before we start to truncate
     * @method
     */
    function maximumLabelWidth(localStorage) {
        var value = localStorage["camelMaximumLabelWidth"];
        if (angular.isString(value)) {
            value = parseInt(value);
        }
        if (!value) {
            value = Camel.defaultMaximumLabelWidth;
        }
        return value;
    }
    Camel.maximumLabelWidth = maximumLabelWidth;
    /**
     * Returns the max body length for tracer and debugger
     * @method
     */
    function maximumTraceOrDebugBodyLength(localStorage) {
        var value = localStorage["camelMaximumTraceOrDebugBodyLength"];
        if (angular.isString(value)) {
            value = parseInt(value);
        }
        if (!value) {
            value = Camel.defaultCamelMaximumTraceOrDebugBodyLength;
        }
        return value;
    }
    Camel.maximumTraceOrDebugBodyLength = maximumTraceOrDebugBodyLength;
    /**
     * Returns whether to include streams body for tracer and debugger
     * @method
     */
    function traceOrDebugIncludeStreams(localStorage) {
        var value = localStorage["camelTraceOrDebugIncludeStreams"];
        return Core.parseBooleanValue(value, Camel.defaultCamelTraceOrDebugIncludeStreams);
    }
    Camel.traceOrDebugIncludeStreams = traceOrDebugIncludeStreams;
    /**
     * Returns true if we should show inflight counter in Camel route diagram
     * @method
     */
    function showInflightCounter(localStorage) {
        var value = localStorage["camelShowInflightCounter"];
        // is default enabled
        return Core.parseBooleanValue(value, true);
    }
    Camel.showInflightCounter = showInflightCounter;
    /**
     * Returns the max value for seconds in the route metrics UI
     * @method
     */
    function routeMetricMaxSeconds(localStorage) {
        var value = localStorage["camelRouteMetricMaxSeconds"];
        if (angular.isString(value)) {
            value = parseInt(value);
        }
        if (!value) {
            value = Camel.defaultCamelRouteMetricMaxSeconds;
        }
        return value;
    }
    Camel.routeMetricMaxSeconds = routeMetricMaxSeconds;
    /**
     * Whether to hide the documentation for the options
     * @method
     */
    function hideOptionDocumentation(localStorage) {
        var value = localStorage["camelHideOptionDocumentation"];
        return Core.parseBooleanValue(value, Camel.defaultHideOptionDocumentation);
    }
    Camel.hideOptionDocumentation = hideOptionDocumentation;
    /**
     * Whether to hide options which uses default values
     * @method
     */
    function hideOptionDefaultValue(localStorage) {
        var value = localStorage["camelHideOptionDefaultValue"];
        return Core.parseBooleanValue(value, Camel.defaultHideOptionDefaultValue);
    }
    Camel.hideOptionDefaultValue = hideOptionDefaultValue;
    /**
     * Whether to hide options which have unused/empty values
     * @method
     */
    function hideOptionUnusedValue(localStorage) {
        var value = localStorage["camelHideOptionUnusedValue"];
        return Core.parseBooleanValue(value, Camel.defaultHideOptionUnusedValue);
    }
    Camel.hideOptionUnusedValue = hideOptionUnusedValue;
    /**
     * Function to highlight the selected toNode in the nodes graph
     *
     * @param nodes the nodes
     * @param toNode the node to highlight
     */
    function highlightSelectedNode(nodes, toNode) {
        // lets clear the selected node first
        nodes.attr("class", "node");
        nodes.filter(function (item) {
            if (item) {
                var cid = item["cid"];
                var rid = item["rid"];
                var type = item["type"];
                var elementId = item["elementId"];
                // if its from then match on rid
                if ("from" === type) {
                    return toNode === rid;
                }
                // okay favor using element id as the cids can become
                // undefined or mangled with mbean object names, causing this to not work
                // where as elementId when present works fine
                if (elementId) {
                    // we should match elementId if defined
                    return toNode === elementId;
                }
                // then fallback to cid
                if (cid) {
                    return toNode === cid;
                }
                else {
                    // and last rid
                    return toNode === rid;
                }
            }
            return null;
        }).attr("class", "node selected");
    }
    Camel.highlightSelectedNode = highlightSelectedNode;
    /**
     * Is the currently selected Camel version equal or greater than
     *
     * @param major   major version as number
     * @param minor   minor version as number
     */
    function isCamelVersionEQGT(major, minor, workspace, jolokia) {
        var camelVersion = getCamelVersion(workspace, jolokia);
        if (camelVersion) {
            // console.log("Camel version " + camelVersion)
            camelVersion += "camel-";
            var numbers = Core.parseVersionNumbers(camelVersion);
            if (Core.compareVersionNumberArrays(numbers, [major, minor]) >= 0) {
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    }
    Camel.isCamelVersionEQGT = isCamelVersionEQGT;
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelHelpers.ts"/>
/**
 *
 * @module Camel
 * @main Camel
 */
var Camel;
(function (Camel) {
    var jmxModule = Jmx;
    Camel.pluginName = 'camel';
    var routeToolBar = "plugins/camel/html/attributeToolBarRoutes.html";
    var contextToolBar = "plugins/camel/html/attributeToolBarContext.html";
    Camel._module = angular.module(Camel.pluginName, []);
    Camel._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/camel/browseEndpoint', { templateUrl: 'plugins/camel/html/browseEndpoint.html' }).when('/camel/endpoint/browse/:contextId/*endpointPath', { templateUrl: 'plugins/camel/html/browseEndpoint.html' }).when('/camel/createEndpoint', { templateUrl: 'plugins/camel/html/createEndpoint.html' }).when('/camel/route/diagram/:contextId/:routeId', { templateUrl: 'plugins/camel/html/routes.html' }).when('/camel/routes', { templateUrl: 'plugins/camel/html/routes.html' }).when('/camel/typeConverter', { templateUrl: 'plugins/camel/html/typeConverter.html', reloadOnSearch: false }).when('/camel/restRegistry', { templateUrl: 'plugins/camel/html/restRegistry.html', reloadOnSearch: false }).when('/camel/endpointRuntimeRegistry', { templateUrl: 'plugins/camel/html/endpointRuntimeRegistry.html', reloadOnSearch: false }).when('/camel/routeMetrics', { templateUrl: 'plugins/camel/html/routeMetrics.html', reloadOnSearch: false }).when('/camel/inflight', { templateUrl: 'plugins/camel/html/inflight.html', reloadOnSearch: false }).when('/camel/sendMessage', { templateUrl: 'plugins/camel/html/sendMessage.html', reloadOnSearch: false }).when('/camel/source', { templateUrl: 'plugins/camel/html/source.html' }).when('/camel/traceRoute', { templateUrl: 'plugins/camel/html/traceRoute.html' }).when('/camel/debugRoute', { templateUrl: 'plugins/camel/html/debug.html' }).when('/camel/profileRoute', { templateUrl: 'plugins/camel/html/profileRoute.html' }).when('/camel/properties', { templateUrl: 'plugins/camel/html/properties.html' }).when('/camel/propertiesComponent', { templateUrl: 'plugins/camel/html/propertiesComponent.html' }).when('/camel/propertiesDataFormat', { templateUrl: 'plugins/camel/html/propertiesDataFormat.html' }).when('/camel/propertiesEndpoint', { templateUrl: 'plugins/camel/html/propertiesEndpoint.html' });
    }]);
    Camel._module.factory('tracerStatus', function () {
        return {
            jhandle: null,
            messages: []
        };
    });
    Camel._module.filter('camelIconClass', function () { return Camel.iconClass; });
    Camel._module.factory('activeMQMessage', function () {
        return { 'message': null };
    });
    // service for the codehale metrics
    Camel._module.factory('metricsWatcher', ["$window", function ($window) {
        var answer = $window.metricsWatcher;
        if (!answer) {
            // lets avoid any NPEs
            answer = {};
            $window.metricsWatcher = answer;
        }
        return answer;
    }]);
    Camel._module.run(["HawtioNav", "workspace", "jolokia", "viewRegistry", "layoutFull", "helpRegistry", "preferencesRegistry", "$templateCache", "$location", function (nav, workspace, jolokia, viewRegistry, layoutFull, helpRegistry, preferencesRegistry, $templateCache, $location) {
        viewRegistry['camel/endpoint/'] = layoutFull;
        viewRegistry['camel/route/'] = layoutFull;
        viewRegistry['{ "main-tab": "camel" }'] = 'plugins/camel/html/layoutCamelTree.html';
        helpRegistry.addUserDoc('camel', 'plugins/camel/doc/help.md', function () {
            return workspace.treeContainsDomainAndProperties(Camel.jmxDomain);
        });
        preferencesRegistry.addTab('Camel', 'plugins/camel/html/preferences.html', function () {
            return workspace.treeContainsDomainAndProperties(Camel.jmxDomain);
        });
        // TODO should really do this via a service that the JMX plugin exposes
        Jmx.addAttributeToolBar(Camel.pluginName, Camel.jmxDomain, function (selection) {
            // TODO there should be a nicer way to do this!
            var typeName = selection.typeName;
            if (typeName) {
                if (typeName.startsWith("context"))
                    return contextToolBar;
                if (typeName.startsWith("route"))
                    return routeToolBar;
            }
            var folderNames = selection.folderNames;
            if (folderNames && selection.domain === Camel.jmxDomain) {
                var last = folderNames.last();
                if ("routes" === last)
                    return routeToolBar;
                if ("context" === last)
                    return contextToolBar;
            }
            return null;
        });
        // register default attribute views
        var stateField = 'State';
        var stateTemplate = '<div class="ngCellText pagination-centered" title="{{row.getProperty(col.field)}}"><i class="{{row.getProperty(\'' + stateField + '\') | camelIconClass}}"></i></div>';
        var stateColumn = { field: stateField, displayName: stateField, cellTemplate: stateTemplate, width: 56, minWidth: 56, maxWidth: 56, resizable: false, defaultSort: false };
        var attributes = workspace.attributeColumnDefs;
        attributes[Camel.jmxDomain + "/context/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'Uptime', displayName: 'Uptime', visible: false },
            { field: 'CamelVersion', displayName: 'Version', visible: false },
            { field: 'ExchangesCompleted', displayName: 'Completed' },
            { field: 'ExchangesFailed', displayName: 'Failed' },
            { field: 'FailuresHandled', displayName: 'Failed Handled', visible: false },
            { field: 'ExchangesTotal', displayName: 'Total', visible: false },
            { field: 'Redeliveries', displayName: 'Redelivery', visible: false },
            { field: 'ExchangesInflight', displayName: 'Inflight' },
            { field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false },
            { field: 'MeanProcessingTime', displayName: 'Mean Time' },
            { field: 'MinProcessingTime', displayName: 'Min Time' },
            { field: 'MaxProcessingTime', displayName: 'Max Time' },
            { field: 'TotalProcessingTime', displayName: 'Total Time', visible: false },
            { field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false },
            { field: 'LastProcessingTime', displayName: 'Last Time', visible: false },
            { field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false },
            { field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false },
            { field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false },
            { field: 'StartedRoutes', displayName: 'Started Routes' },
            { field: 'TotalRoutes', displayName: 'Total Routes' }
        ];
        attributes[Camel.jmxDomain + "/routes/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'RouteId', displayName: 'Route' },
            { field: 'ExchangesCompleted', displayName: 'Completed' },
            { field: 'ExchangesFailed', displayName: 'Failed' },
            { field: 'FailuresHandled', displayName: 'Failed Handled', visible: false },
            { field: 'Redeliveries', displayName: 'Redelivery', visible: false },
            { field: 'ExchangesTotal', displayName: 'Total', visible: false },
            { field: 'ExchangesInflight', displayName: 'Inflight' },
            { field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false },
            { field: 'MeanProcessingTime', displayName: 'Mean Time' },
            { field: 'MinProcessingTime', displayName: 'Min Time' },
            { field: 'MaxProcessingTime', displayName: 'Max Time' },
            { field: 'TotalProcessingTime', displayName: 'Total Time', visible: false },
            { field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false },
            { field: 'LastProcessingTime', displayName: 'Last Time', visible: false },
            { field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false },
            { field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false },
            { field: 'Redeliveries', displayName: 'Redelivery', visible: false },
            { field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false }
        ];
        attributes[Camel.jmxDomain + "/processors/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'RouteId', displayName: 'Route' },
            { field: 'ProcessorId', displayName: 'Processor' },
            { field: 'ExchangesCompleted', displayName: 'Completed' },
            { field: 'ExchangesFailed', displayName: 'Failed' },
            { field: 'FailuresHandled', displayName: 'Failed Handled', visible: false },
            { field: 'Redeliveries', displayName: 'Redelivery', visible: false },
            { field: 'ExchangesTotal', displayName: 'Total', visible: false },
            { field: 'ExchangesInflight', displayName: 'Inflight' },
            { field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false },
            { field: 'MeanProcessingTime', displayName: 'Mean Time' },
            { field: 'MinProcessingTime', displayName: 'Min Time' },
            { field: 'MaxProcessingTime', displayName: 'Max Time' },
            { field: 'TotalProcessingTime', displayName: 'Total Time', visible: false },
            { field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false },
            { field: 'LastProcessingTime', displayName: 'Last Time', visible: false },
            { field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false },
            { field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false },
            { field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false }
        ];
        attributes[Camel.jmxDomain + "/components/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'ComponentName', displayName: 'Name' }
        ];
        attributes[Camel.jmxDomain + "/consumers/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'RouteId', displayName: 'Route' },
            { field: 'EndpointUri', displayName: 'Endpoint URI', width: "**" },
            { field: 'Suspended', displayName: 'Suspended', resizable: false },
            { field: 'InflightExchanges', displayName: 'Inflight' }
        ];
        attributes[Camel.jmxDomain + "/producers/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'RouteId', displayName: 'Route' },
            { field: 'EndpointUri', displayName: 'Endpoint URI', width: "**" },
            { field: 'Suspended', displayName: 'Suspended', resizable: false }
        ];
        attributes[Camel.jmxDomain + "/services/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'RouteId', displayName: 'Route' },
            { field: 'Suspended', displayName: 'Suspended', resizable: false },
            { field: 'SupportsSuspended', displayName: 'Can Suspend', resizable: false }
        ];
        attributes[Camel.jmxDomain + "/endpoints/folder"] = [
            stateColumn,
            { field: 'CamelId', displayName: 'Context' },
            { field: 'EndpointUri', displayName: 'Endpoint URI', width: "***" },
            { field: 'Singleton', displayName: 'Singleton', resizable: false }
        ];
        attributes[Camel.jmxDomain + "/threadpools/folder"] = [
            { field: 'Id', displayName: 'Id', width: "**" },
            { field: 'ActiveCount', displayName: 'Active' },
            { field: 'PoolSize', displayName: 'Pool Size' },
            { field: 'CorePoolSize', displayName: 'Core Pool Size' },
            { field: 'TaskQueueSize', displayName: 'Task Queue Size' },
            { field: 'TaskCount', displayName: 'Task' },
            { field: 'CompletedTaskCount', displayName: 'Completed Task' }
        ];
        attributes[Camel.jmxDomain + "/errorhandlers/folder"] = [
            { field: 'CamelId', displayName: 'Context' },
            { field: 'DeadLetterChannel', displayName: 'Dead Letter' },
            { field: 'DeadLetterChannelEndpointUri', displayName: 'Endpoint URI', width: "**", resizable: true },
            { field: 'MaximumRedeliveries', displayName: 'Max Redeliveries' },
            { field: 'RedeliveryDelay', displayName: 'Redelivery Delay' },
            { field: 'MaximumRedeliveryDelay', displayName: 'Max Redeliveries Delay' }
        ];
        var myUrl = '/jmx/attributes?main-tab=camel&sub-tab=camel-attributes';
        var builder = nav.builder();
        var tab = builder.id('camel').title(function () { return 'Camel'; }).defaultPage({
            rank: 20,
            isValid: function (yes, no) {
                var name = 'CamelDefaultPage';
                workspace.addNamedTreePostProcessor(name, function (tree) {
                    workspace.removeNamedTreePostProcessor(name);
                    if (workspace.treeContainsDomainAndProperties(Camel.jmxDomain)) {
                        yes();
                    }
                    else {
                        no();
                    }
                });
            }
        }).href(function () { return myUrl; }).isValid(function () { return workspace.treeContainsDomainAndProperties(Camel.jmxDomain); }).build();
        // add sub level tabs
        tab.tabs = Jmx.getNavItems(builder, workspace, $templateCache, 'camel');
        // special for route diagram as we want this to be the 1st
        tab.tabs.push({
            id: 'camel-route-diagram',
            title: function () { return '<i class="fa fa-sitemap"></i> Route Diagram'; },
            tooltip: function () { return "View a diagram of the Camel routes"; },
            show: function () { return (workspace.isRoute() || workspace.isRoutesFolder()) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"); },
            isSelected: function () { return workspace.isLinkActive('camel/routes'); },
            href: function () { return "/camel/routes" + workspace.hash(); },
            // make sure we have route diagram shown first
            index: -2
        });
        tab.tabs.push({
            id: 'camel-route-source',
            title: function () { return '<i class=" fa fa-file-code-o"></i> Source'; },
            tooltip: function () { return "View the source of the Camel routes"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && (workspace.isRoute() || workspace.isRoutesFolder()) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"); },
            isSelected: function () { return workspace.isLinkActive('camel/source'); },
            href: function () { return "/camel/source" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-route-properties',
            title: function () { return '<i class=" fa fa-edit"></i> Properties'; },
            tooltip: function () { return "View the pattern properties"; },
            show: function () { return Camel.getSelectedRouteNode(workspace); },
            href: function () { return "/camel/properties" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-endpoint-properties',
            title: function () { return '<i class="fa fa-list"></i> Properties'; },
            tooltip: function () { return "Show the endpoint properties"; },
            show: function () { return workspace.isEndpoint() && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia) && workspace.hasInvokeRights(workspace.selection, "explainEndpointJson"); },
            href: function () { return "/camel/propertiesEndpoint" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-component-properties',
            title: function () { return '<i class="fa fa-list"></i> Properties'; },
            tooltip: function () { return "Show the component properties"; },
            show: function () { return workspace.isComponent() && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia) && workspace.hasInvokeRights(workspace.selection, "explainComponentJson"); },
            href: function () { return "/camel/propertiesComponent" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-dataformat-properties',
            title: function () { return '<i class="fa fa-list"></i> Properties'; },
            tooltip: function () { return "Show the dataformat properties"; },
            show: function () { return workspace.isDataformat() && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia) && workspace.hasInvokeRights(workspace.selection, "explainDataFormatJson"); },
            href: function () { return "/camel/propertiesDataFormat" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-inflight-exchanges',
            title: function () { return '<i class="fa fa-bar-chart"></i> Inflight Exchanges'; },
            tooltip: function () { return "View the entire JVMs Camel inflight exchanges"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && !workspace.isComponentsFolder() && !workspace.isComponent() && (workspace.isCamelContext() || workspace.isRoutesFolder() || workspace.isRoute()) && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelInflightRepository(workspace), "browse"); },
            href: function () { return "/camel/inflight" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-route-metrics',
            title: function () { return '<i class="fa fa-bar-chart"></i> Route Metrics'; },
            tooltip: function () { return "View the entire JVMs Camel route metrics"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && (workspace.isCamelContext() || workspace.isRoutesFolder()) && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia) && Camel.getSelectionCamelRouteMetrics(workspace) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelRouteMetrics(workspace), "dumpStatisticsAsJson"); },
            href: function () { return "/camel/routeMetrics" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-rest-services',
            title: function () { return '<i class="fa fa-list"></i> Rest Services'; },
            tooltip: function () { return "List all the REST services registered in the context"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && !workspace.isComponentsFolder() && !workspace.isComponent() && (workspace.isCamelContext() || workspace.isRoutesFolder()) && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia) && Camel.getSelectionCamelRestRegistry(workspace) && Camel.hasRestServices(workspace, jolokia) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelRestRegistry(workspace), "listRestServices"); },
            href: function () { return "/camel/restRegistry" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-endpoint-runtime-registry',
            title: function () { return '<i class="fa fa-list"></i> Endpoints (in/out)'; },
            tooltip: function () { return "List all the incoming and outgoing endpoints in the context"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && !workspace.isComponentsFolder() && !workspace.isComponent() && (workspace.isCamelContext() || workspace.isRoutesFolder()) && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia) && Camel.getSelectionCamelEndpointRuntimeRegistry(workspace) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelEndpointRuntimeRegistry(workspace), "endpointStatistics"); },
            href: function () { return "/camel/endpointRuntimeRegistry" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-type-converters',
            title: function () { return '<i class="fa fa-list"></i> Type Converters'; },
            tooltip: function () { return "List all the type converters registered in the context"; },
            show: function () { return !workspace.isEndpointsFolder() && !workspace.isEndpoint() && !workspace.isComponentsFolder() && !workspace.isComponent() && (workspace.isCamelContext() || workspace.isRoutesFolder()) && Camel.isCamelVersionEQGT(2, 13, workspace, jolokia) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTypeConverter(workspace), "listTypeConverters"); },
            href: function () { return "/camel/typeConverter" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-route-profile',
            title: function () { return '<i class="fa fa-bar-chart"></i> Profile'; },
            tooltip: function () { return "Profile the messages flowing through the Camel route"; },
            show: function () { return workspace.isRoute() && Camel.getSelectionCamelTraceMBean(workspace) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml"); },
            href: function () { return "/camel/profileRoute" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-route-debug',
            title: function () { return '<i class="fa fa-stethoscope"></i> Debug'; },
            tooltip: function () { return "Debug the Camel route"; },
            show: function () { return workspace.isRoute() && Camel.getSelectionCamelDebugMBean(workspace) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelDebugMBean(workspace), "getBreakpoints"); },
            href: function () { return "/camel/debugRoute" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-route-trace',
            title: function () { return '<i class="fa fa-envelope"></i> Trace'; },
            tooltip: function () { return "Trace the messages flowing through the Camel route"; },
            show: function () { return workspace.isRoute() && Camel.getSelectionCamelTraceMBean(workspace) && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml"); },
            href: function () { return "/camel/traceRoute" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-endpoint-browser',
            title: function () { return '<i class="fa fa-envelope"></i> Browse'; },
            tooltip: function () { return "Browse the messages on the endpoint"; },
            show: function () { return workspace.isEndpoint() && workspace.hasInvokeRights(workspace.selection, "browseAllMessagesAsXml"); },
            href: function () { return "/camel/browseEndpoint" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-endpoint-send',
            title: function () { return '<i class="fa fa-pencil"></i> Send'; },
            //title: "Send a message to this endpoint",
            show: function () { return workspace.isEndpoint() && workspace.hasInvokeRights(workspace.selection, workspace.selection.domain === "org.apache.camel" ? "sendBodyAndHeaders" : "sendTextMessage"); },
            href: function () { return "/camel/sendMessage" + workspace.hash(); }
        });
        tab.tabs.push({
            id: 'camel-endpoint-create',
            title: function () { return '<i class="fa fa-plus"></i> Endpoint'; },
            tooltip: function () { return "Create a new endpoint"; },
            show: function () { return workspace.isEndpointsFolder() && workspace.hasInvokeRights(workspace.selection, "createEndpoint"); },
            href: function () { return "/camel/createEndpoint" + workspace.hash(); }
        });
        nav.add(tab);
        workspace.addNamedTreePostProcessor('camel', function (tree) {
            var children = [];
            var domainName = Camel.jmxDomain;
            if (tree) {
                var rootFolder = new Folder("Camel Contexts");
                rootFolder.addClass = "org-apache-camel-context-folder";
                rootFolder.children = children;
                rootFolder.typeName = "context";
                rootFolder.key = "camelContexts";
                rootFolder.domain = domainName;
                /*
                var contextFilterText = $scope.contextFilterText;
                $scope.lastContextFilterText = contextFilterText;
                log.debug("Reloading the tree for filter: " + contextFilterText);
                */
                var folder = tree.get(domainName);
                if (folder) {
                    angular.forEach(folder.children, function (value, key) {
                        var entries = value.map;
                        if (entries) {
                            var contextsFolder = entries["context"];
                            var routesNode = entries["routes"];
                            var endpointsNode = entries["endpoints"];
                            var componentsNode = entries["components"];
                            var dataFormatsNode = entries["dataformats"];
                            if (contextsFolder) {
                                var contextNode = contextsFolder.children[0];
                                if (contextNode) {
                                    var title = contextNode.title;
                                    var match = true;
                                    if (match) {
                                        var folder = new Folder(title);
                                        folder.addClass = "org-apache-camel-context";
                                        folder.domain = domainName;
                                        folder.objectName = contextNode.objectName;
                                        folder.entries = contextNode.entries;
                                        folder.typeName = contextNode.typeName;
                                        folder.key = contextNode.key;
                                        folder.version = contextNode.version;
                                        if (routesNode) {
                                            var routesFolder = new Folder("Routes");
                                            routesFolder.addClass = "org-apache-camel-routes-folder";
                                            routesFolder.parent = contextsFolder;
                                            routesFolder.children = routesNode.children;
                                            angular.forEach(routesFolder.children, function (n) { return n.addClass = "org-apache-camel-routes"; });
                                            folder.children.push(routesFolder);
                                            routesFolder.typeName = "routes";
                                            routesFolder.key = routesNode.key;
                                            routesFolder.domain = routesNode.domain;
                                        }
                                        if (endpointsNode) {
                                            var endpointsFolder = new Folder("Endpoints");
                                            endpointsFolder.addClass = "org-apache-camel-endpoints-folder";
                                            endpointsFolder.parent = contextsFolder;
                                            endpointsFolder.children = endpointsNode.children;
                                            angular.forEach(endpointsFolder.children, function (n) {
                                                n.addClass = "org-apache-camel-endpoints";
                                                if (!Camel.getContextId(n)) {
                                                    n.entries["context"] = contextNode.entries["context"];
                                                }
                                            });
                                            folder.children.push(endpointsFolder);
                                            endpointsFolder.entries = contextNode.entries;
                                            endpointsFolder.typeName = "endpoints";
                                            endpointsFolder.key = endpointsNode.key;
                                            endpointsFolder.domain = endpointsNode.domain;
                                        }
                                        if (componentsNode) {
                                            var componentsFolder = new Folder("Components");
                                            componentsFolder.addClass = "org-apache-camel-components-folder";
                                            componentsFolder.parent = contextsFolder;
                                            componentsFolder.children = componentsNode.children;
                                            angular.forEach(componentsFolder.children, function (n) {
                                                n.addClass = "org-apache-camel-components";
                                                if (!Camel.getContextId(n)) {
                                                    n.entries["context"] = contextNode.entries["context"];
                                                }
                                            });
                                            folder.children.push(componentsFolder);
                                            componentsFolder.entries = contextNode.entries;
                                            componentsFolder.typeName = "components";
                                            componentsFolder.key = componentsNode.key;
                                            componentsFolder.domain = componentsNode.domain;
                                        }
                                        if (dataFormatsNode) {
                                            var dataFormatsFolder = new Folder("Dataformats");
                                            dataFormatsFolder.addClass = "org-apache-camel-dataformats-folder";
                                            dataFormatsFolder.parent = contextsFolder;
                                            dataFormatsFolder.children = dataFormatsNode.children;
                                            angular.forEach(dataFormatsFolder.children, function (n) {
                                                n.addClass = "org-apache-camel-dataformats";
                                                if (!Camel.getContextId(n)) {
                                                    n.entries["context"] = contextNode.entries["context"];
                                                }
                                            });
                                            folder.children.push(dataFormatsFolder);
                                            dataFormatsFolder.entries = contextNode.entries;
                                            dataFormatsFolder.typeName = "dataformats";
                                            dataFormatsFolder.key = dataFormatsNode.key;
                                            dataFormatsFolder.domain = dataFormatsNode.domain;
                                        }
                                        var jmxNode = new Folder("MBeans");
                                        // lets add all the entries which are not one context/routes/endpoints/components/dataformats as MBeans
                                        angular.forEach(entries, function (jmxChild, name) {
                                            if (name !== "context" && name !== "routes" && name !== "endpoints" && name !== "components" && name !== "dataformats") {
                                                jmxNode.children.push(jmxChild);
                                            }
                                        });
                                        if (jmxNode.children.length > 0) {
                                            jmxNode.sortChildren(false);
                                            folder.children.push(jmxNode);
                                        }
                                        folder.parent = rootFolder;
                                        children.push(folder);
                                    }
                                }
                            }
                        }
                    });
                    folder.children.splice(0, 0, rootFolder);
                }
            }
        });
    }]);
    hawtioPluginLoader.addModule(Camel.pluginName);
    // register the jmx lazy loader here as it won't have been invoked in the run method
    hawtioPluginLoader.registerPreBootstrapTask(function (task) {
        jmxModule.registerLazyLoadHandler(Camel.jmxDomain, function (folder) {
            if (Camel.jmxDomain === folder.domain && "routes" === folder.typeName) {
                return function (workspace, folder, onComplete) {
                    if ("routes" === folder.typeName) {
                        Camel.processRouteXml(workspace, workspace.jolokia, folder, function (route) {
                            if (route) {
                                Camel.addRouteChildren(folder, route);
                            }
                            onComplete();
                        });
                    }
                    else {
                        onComplete();
                    }
                };
            }
            return null;
        });
        task();
    });
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.AttributesToolBarController", ["$scope", "workspace", "jolokia", function ($scope, workspace, jolokia) {
        $scope.deleteDialog = false;
        $scope.start = function () {
            $scope.invokeSelectedMBeans(function (item) {
                return Camel.isState(item, "suspend") ? "resume()" : "start()";
            });
        };
        $scope.pause = function () {
            $scope.invokeSelectedMBeans("suspend()");
        };
        $scope.stop = function () {
            $scope.invokeSelectedMBeans("stop()", function () {
                // lets navigate to the parent folder!
                // as this will be going way
                workspace.removeAndSelectParentNode();
            });
        };
        /*
         * Only for routes!
         */
        $scope.delete = function () {
            $scope.invokeSelectedMBeans("remove()", function () {
                // force a reload of the tree
                $scope.workspace.operationCounter += 1;
                Core.$apply($scope);
            });
        };
        $scope.anySelectionHasState = function (state) {
            var selected = $scope.selectedItems || [];
            return selected.length && selected.any(function (s) { return Camel.isState(s, state); });
        };
        $scope.everySelectionHasState = function (state) {
            var selected = $scope.selectedItems || [];
            return selected.length && selected.every(function (s) { return Camel.isState(s, state); });
        };
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.BreadcrumbBarController", ["$scope", "$routeParams", "workspace", "jolokia", function ($scope, $routeParams, workspace, jolokia) {
        $scope.workspace = workspace;
        // if we are in dashboard then $routeParams may be null
        if ($routeParams != null) {
            $scope.contextId = $routeParams["contextId"];
            $scope.endpointPath = $routeParams["endpointPath"];
            $scope.endpointName = tidyJmxName($scope.endpointPath);
            $scope.routeId = $routeParams["routeId"];
        }
        $scope.treeViewLink = linkToTreeView();
        var defaultChildEntity = $scope.endpointPath ? "endpoints" : "routes";
        var childEntityToolTips = {
            "endpoints": "Camel Endpoint",
            "routes": "Camel Route"
        };
        /**
         * The array of breadcrumbs so that each item in the list of bookmarks can be switched for fast navigation and
         * we can easily render the navigation path
         */
        $scope.breadcrumbs = [
            {
                name: $scope.contextId,
                items: findContexts(),
                tooltip: "Camel Context"
            },
            {
                name: defaultChildEntity,
                items: findChildEntityTypes($scope.contextId),
                tooltip: "Entity inside a Camel Context"
            },
            {
                name: $scope.endpointName || tidyJmxName($scope.routeId),
                items: findChildEntityLinks($scope.contextId, currentChildEntity()),
                tooltip: childEntityToolTips[defaultChildEntity]
            }
        ];
        // lets find all the camel contexts
        function findContexts() {
            var answer = [];
            var rootFolder = Camel.getRootCamelFolder(workspace);
            if (rootFolder) {
                angular.forEach(rootFolder.children, function (contextFolder) {
                    var id = contextFolder.title;
                    if (id && id !== $scope.contextId) {
                        var name = id;
                        var link = createLinkToFirstChildEntity(id, currentChildEntity());
                        answer.push({
                            name: name,
                            tooltip: "Camel Context",
                            link: link
                        });
                    }
                });
            }
            return answer;
        }
        // lets find all the the child entities of a camel context
        function findChildEntityTypes(contextId) {
            var answer = [];
            angular.forEach(["endpoints", "routes"], function (childEntityName) {
                if (childEntityName && childEntityName !== currentChildEntity()) {
                    var link = createLinkToFirstChildEntity(contextId, childEntityName);
                    answer.push({
                        name: childEntityName,
                        tooltip: "Entity inside a Camel Context",
                        link: link
                    });
                }
            });
            return answer;
        }
        function currentChildEntity() {
            var answer = Core.pathGet($scope, ["breadcrumbs", "childEntity"]);
            return answer || defaultChildEntity;
        }
        /**
         * Based on the current child entity type, find the child links for the given context id and
         * generate a link to the first child; used when changing context or child entity type
         */
        function createLinkToFirstChildEntity(id, childEntityValue) {
            var links = findChildEntityLinks(id, childEntityValue);
            // TODO here we should switch to a default context view if there's no endpoints available...
            var link = links.length > 0 ? links[0].link : Camel.linkToBrowseEndpointFullScreen(id, "noEndpoints");
            return link;
        }
        function findChildEntityLinks(contextId, childEntityValue) {
            if ("endpoints" === childEntityValue) {
                return findEndpoints(contextId);
            }
            else {
                return findRoutes(contextId);
            }
        }
        // lets find all the endpoints for the given context id
        function findEndpoints(contextId) {
            var answer = [];
            var contextFolder = Camel.getCamelContextFolder(workspace, contextId);
            if (contextFolder) {
                var endpoints = (contextFolder["children"] || []).find(function (n) { return "endpoints" === n.title; });
                if (endpoints) {
                    angular.forEach(endpoints.children, function (endpointFolder) {
                        var entries = endpointFolder ? endpointFolder.entries : null;
                        if (entries) {
                            var endpointPath = entries["name"];
                            if (endpointPath) {
                                var name = tidyJmxName(endpointPath);
                                var link = Camel.linkToBrowseEndpointFullScreen(contextId, endpointPath);
                                answer.push({
                                    contextId: contextId,
                                    path: endpointPath,
                                    name: name,
                                    tooltip: "Endpoint",
                                    link: link
                                });
                            }
                        }
                    });
                }
            }
            return answer;
        }
        // lets find all the routes for the given context id
        function findRoutes(contextId) {
            var answer = [];
            var contextFolder = Camel.getCamelContextFolder(workspace, contextId);
            if (contextFolder) {
                var folders = (contextFolder["children"] || []).find(function (n) { return "routes" === n.title; });
                if (folders) {
                    angular.forEach(folders.children, function (folder) {
                        var entries = folder ? folder.entries : null;
                        if (entries) {
                            var routeId = entries["name"];
                            if (routeId) {
                                var name = tidyJmxName(routeId);
                                var link = Camel.linkToRouteDiagramFullScreen(contextId, routeId);
                                answer.push({
                                    contextId: contextId,
                                    path: routeId,
                                    name: name,
                                    tooltip: "Camel Route",
                                    link: link
                                });
                            }
                        }
                    });
                }
            }
            return answer;
        }
        /**
         * Creates a link to the tree view version of this view
         */
        function linkToTreeView() {
            var answer = null;
            if ($scope.contextId) {
                var node = null;
                var tab = null;
                if ($scope.endpointPath) {
                    tab = "browseEndpoint";
                    node = workspace.findMBeanWithProperties(Camel.jmxDomain, {
                        context: $scope.contextId,
                        type: "endpoints",
                        name: $scope.endpointPath
                    });
                }
                else if ($scope.routeId) {
                    tab = "routes";
                    node = workspace.findMBeanWithProperties(Camel.jmxDomain, {
                        context: $scope.contextId,
                        type: "routes",
                        name: $scope.routeId
                    });
                }
                var key = node ? node["key"] : null;
                if (key && tab) {
                    answer = "#/camel/" + tab + "?tab=camel&nid=" + key;
                }
            }
            return answer;
        }
        function tidyJmxName(jmxName) {
            return jmxName ? Core.trimQuotes(jmxName) : jmxName;
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
/// <reference path="../../activemq/ts/activemqHelpers.ts"/>
var Camel;
(function (Camel) {
    Camel.BrowseEndpointController = Camel._module.controller("Camel.BrowseEndpointController", ["$scope", "$routeParams", "workspace", "jolokia", function ($scope, $routeParams, workspace, jolokia) {
        $scope.workspace = workspace;
        $scope.forwardDialog = new UI.Dialog();
        $scope.showMessageDetails = false;
        $scope.mode = 'text';
        $scope.gridOptions = Camel.createBrowseGridOptions();
        $scope.contextId = $routeParams["contextId"];
        $scope.endpointPath = $routeParams["endpointPath"];
        $scope.isJmxTab = !$routeParams["contextId"] || !$routeParams["endpointPath"];
        $scope.$watch('workspace.selection', function () {
            if ($scope.isJmxTab && workspace.moveIfViewInvalid())
                return;
            loadData();
        });
        // TODO can we share these 2 methods from activemq browse / camel browse / came trace?
        $scope.openMessageDialog = function (message) {
            ActiveMQ.selectCurrentMessage(message, "id", $scope);
            if ($scope.row) {
                $scope.mode = CodeEditor.detectTextFormat($scope.row.body);
                $scope.showMessageDetails = true;
            }
        };
        ActiveMQ.decorate($scope);
        $scope.forwardMessagesAndCloseForwardDialog = function () {
            var mbean = Camel.getSelectionCamelContextMBean(workspace);
            var selectedItems = $scope.gridOptions.selectedItems;
            var uri = $scope.endpointUri;
            if (mbean && uri && selectedItems && selectedItems.length) {
                //console.log("Creating a new endpoint called: " + uri + " just in case!");
                jolokia.execute(mbean, "createEndpoint(java.lang.String)", uri, Core.onSuccess(intermediateResult));
                $scope.message = "Forwarded " + Core.maybePlural(selectedItems.length, "message" + " to " + uri);
                angular.forEach(selectedItems, function (item, idx) {
                    var callback = (idx + 1 < selectedItems.length) ? intermediateResult : operationSuccess;
                    var body = item.body;
                    var headers = item.headers;
                    //console.log("sending to uri " + uri + " headers: " + JSON.stringify(headers) + " body: " + body);
                    jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, Core.onSuccess(callback));
                });
            }
            $scope.forwardDialog.close();
        };
        $scope.endpointUris = function () {
            var endpointFolder = Camel.getSelectionCamelContextEndpoints(workspace);
            return (endpointFolder) ? endpointFolder.children.map(function (n) { return n.title; }) : [];
        };
        $scope.refresh = loadData;
        function intermediateResult() {
        }
        function operationSuccess() {
            if ($scope.messageDialog) {
                $scope.messageDialog.close();
            }
            $scope.gridOptions.selectedItems.splice(0);
            Core.notification("success", $scope.message);
            setTimeout(loadData, 50);
        }
        function loadData() {
            var mbean = null;
            if ($scope.contextId && $scope.endpointPath) {
                var node = workspace.findMBeanWithProperties(Camel.jmxDomain, {
                    context: $scope.contextId,
                    type: "endpoints",
                    name: $scope.endpointPath
                });
                if (node) {
                    mbean = node.objectName;
                }
            }
            if (!mbean) {
                mbean = workspace.getSelectedMBeanName();
            }
            if (mbean) {
                Camel.log.info("MBean: " + mbean);
                var options = Core.onSuccess(populateTable);
                jolokia.execute(mbean, 'browseAllMessagesAsXml(java.lang.Boolean)', true, options);
            }
        }
        function populateTable(response) {
            var data = [];
            if (angular.isString(response)) {
                // lets parse the XML DOM here...
                var doc = $.parseXML(response);
                var allMessages = $(doc).find("message");
                allMessages.each(function (idx, message) {
                    var messageData = Camel.createMessageFromXml(message);
                    // attach the open dialog to make it work
                    messageData.openMessageDialog = $scope.openMessageDialog;
                    data.push(messageData);
                });
            }
            $scope.messages = data;
            Core.$apply($scope);
        }
    }]);
})(Camel || (Camel = {}));

var Camel;
(function (Camel) {
    // NOTE this file is code generated by the ide-codegen module in Fuse IDE
    Camel.camelHeaderSchema = {
        definitions: {
            headers: {
                properties: {
                    "CamelAuthentication": {
                        type: "java.lang.String"
                    },
                    "CamelAuthenticationFailurePolicyId": {
                        type: "java.lang.String"
                    },
                    "CamelAcceptContentType": {
                        type: "java.lang.String"
                    },
                    "CamelAggregatedSize": {
                        type: "java.lang.String"
                    },
                    "CamelAggregatedTimeout": {
                        type: "java.lang.String"
                    },
                    "CamelAggregatedCompletedBy": {
                        type: "java.lang.String"
                    },
                    "CamelAggregatedCorrelationKey": {
                        type: "java.lang.String"
                    },
                    "CamelAggregationStrategy": {
                        type: "java.lang.String"
                    },
                    "CamelAggregationCompleteAllGroups": {
                        type: "java.lang.String"
                    },
                    "CamelAggregationCompleteAllGroupsInclusive": {
                        type: "java.lang.String"
                    },
                    "CamelAsyncWait": {
                        type: "java.lang.String"
                    },
                    "CamelBatchIndex": {
                        type: "java.lang.String"
                    },
                    "CamelBatchSize": {
                        type: "java.lang.String"
                    },
                    "CamelBatchComplete": {
                        type: "java.lang.String"
                    },
                    "CamelBeanMethodName": {
                        type: "java.lang.String"
                    },
                    "CamelBeanMultiParameterArray": {
                        type: "java.lang.String"
                    },
                    "CamelBinding": {
                        type: "java.lang.String"
                    },
                    "breadcrumbId": {
                        type: "java.lang.String"
                    },
                    "CamelCharsetName": {
                        type: "java.lang.String"
                    },
                    "CamelCreatedTimestamp": {
                        type: "java.lang.String"
                    },
                    "Content-Encoding": {
                        type: "java.lang.String"
                    },
                    "Content-Length": {
                        type: "java.lang.String"
                    },
                    "Content-Type": {
                        type: "java.lang.String"
                    },
                    "CamelCorrelationId": {
                        type: "java.lang.String"
                    },
                    "CamelDataSetIndex": {
                        type: "java.lang.String"
                    },
                    "org.apache.camel.default.charset": {
                        type: "java.lang.String"
                    },
                    "CamelDestinationOverrideUrl": {
                        type: "java.lang.String"
                    },
                    "CamelDisableHttpStreamCache": {
                        type: "java.lang.String"
                    },
                    "CamelDuplicateMessage": {
                        type: "java.lang.String"
                    },
                    "CamelExceptionCaught": {
                        type: "java.lang.String"
                    },
                    "CamelExceptionHandled": {
                        type: "java.lang.String"
                    },
                    "CamelEvaluateExpressionResult": {
                        type: "java.lang.String"
                    },
                    "CamelErrorHandlerHandled": {
                        type: "java.lang.String"
                    },
                    "CamelExternalRedelivered": {
                        type: "java.lang.String"
                    },
                    "CamelFailureHandled": {
                        type: "java.lang.String"
                    },
                    "CamelFailureEndpoint": {
                        type: "java.lang.String"
                    },
                    "CamelFailureRouteId": {
                        type: "java.lang.String"
                    },
                    "CamelFilterNonXmlChars": {
                        type: "java.lang.String"
                    },
                    "CamelFileLocalWorkPath": {
                        type: "java.lang.String"
                    },
                    "CamelFileName": {
                        type: "java.lang.String"
                    },
                    "CamelFileNameOnly": {
                        type: "java.lang.String"
                    },
                    "CamelFileNameProduced": {
                        type: "java.lang.String"
                    },
                    "CamelFileNameConsumed": {
                        type: "java.lang.String"
                    },
                    "CamelFilePath": {
                        type: "java.lang.String"
                    },
                    "CamelFileParent": {
                        type: "java.lang.String"
                    },
                    "CamelFileLastModified": {
                        type: "java.lang.String"
                    },
                    "CamelFileLength": {
                        type: "java.lang.String"
                    },
                    "CamelFilterMatched": {
                        type: "java.lang.String"
                    },
                    "CamelFileLockFileAcquired": {
                        type: "java.lang.String"
                    },
                    "CamelFileLockFileName": {
                        type: "java.lang.String"
                    },
                    "CamelGroupedExchange": {
                        type: "java.lang.String"
                    },
                    "CamelHttpBaseUri": {
                        type: "java.lang.String"
                    },
                    "CamelHttpCharacterEncoding": {
                        type: "java.lang.String"
                    },
                    "CamelHttpMethod": {
                        type: "java.lang.String"
                    },
                    "CamelHttpPath": {
                        type: "java.lang.String"
                    },
                    "CamelHttpProtocolVersion": {
                        type: "java.lang.String"
                    },
                    "CamelHttpQuery": {
                        type: "java.lang.String"
                    },
                    "CamelHttpResponseCode": {
                        type: "java.lang.String"
                    },
                    "CamelHttpUri": {
                        type: "java.lang.String"
                    },
                    "CamelHttpUrl": {
                        type: "java.lang.String"
                    },
                    "CamelHttpChunked": {
                        type: "java.lang.String"
                    },
                    "CamelHttpServletRequest": {
                        type: "java.lang.String"
                    },
                    "CamelHttpServletResponse": {
                        type: "java.lang.String"
                    },
                    "CamelInterceptedEndpoint": {
                        type: "java.lang.String"
                    },
                    "CamelInterceptSendToEndpointWhenMatched": {
                        type: "java.lang.String"
                    },
                    "CamelLanguageScript": {
                        type: "java.lang.String"
                    },
                    "CamelLogDebugBodyMaxChars": {
                        type: "java.lang.String"
                    },
                    "CamelLogDebugStreams": {
                        type: "java.lang.String"
                    },
                    "CamelLoopIndex": {
                        type: "java.lang.String"
                    },
                    "CamelLoopSize": {
                        type: "java.lang.String"
                    },
                    "CamelMaximumCachePoolSize": {
                        type: "java.lang.String"
                    },
                    "CamelMaximumEndpointCacheSize": {
                        type: "java.lang.String"
                    },
                    "CamelMessageHistory": {
                        type: "java.lang.String"
                    },
                    "CamelMulticastIndex": {
                        type: "java.lang.String"
                    },
                    "CamelMulticastComplete": {
                        type: "java.lang.String"
                    },
                    "CamelNotifyEvent": {
                        type: "java.lang.String"
                    },
                    "CamelOnCompletion": {
                        type: "java.lang.String"
                    },
                    "CamelOverruleFileName": {
                        type: "java.lang.String"
                    },
                    "CamelParentUnitOfWork": {
                        type: "java.lang.String"
                    },
                    "CamelRecipientListEndpoint": {
                        type: "java.lang.String"
                    },
                    "CamelReceivedTimestamp": {
                        type: "java.lang.String"
                    },
                    "CamelRedelivered": {
                        type: "java.lang.String"
                    },
                    "CamelRedeliveryCounter": {
                        type: "java.lang.String"
                    },
                    "CamelRedeliveryMaxCounter": {
                        type: "java.lang.String"
                    },
                    "CamelRedeliveryExhausted": {
                        type: "java.lang.String"
                    },
                    "CamelRedeliveryDelay": {
                        type: "java.lang.String"
                    },
                    "CamelRollbackOnly": {
                        type: "java.lang.String"
                    },
                    "CamelRollbackOnlyLast": {
                        type: "java.lang.String"
                    },
                    "CamelRouteStop": {
                        type: "java.lang.String"
                    },
                    "CamelSoapAction": {
                        type: "java.lang.String"
                    },
                    "CamelSkipGzipEncoding": {
                        type: "java.lang.String"
                    },
                    "CamelSlipEndpoint": {
                        type: "java.lang.String"
                    },
                    "CamelSplitIndex": {
                        type: "java.lang.String"
                    },
                    "CamelSplitComplete": {
                        type: "java.lang.String"
                    },
                    "CamelSplitSize": {
                        type: "java.lang.String"
                    },
                    "CamelTimerCounter": {
                        type: "java.lang.String"
                    },
                    "CamelTimerFiredTime": {
                        type: "java.lang.String"
                    },
                    "CamelTimerName": {
                        type: "java.lang.String"
                    },
                    "CamelTimerPeriod": {
                        type: "java.lang.String"
                    },
                    "CamelTimerTime": {
                        type: "java.lang.String"
                    },
                    "CamelToEndpoint": {
                        type: "java.lang.String"
                    },
                    "CamelTraceEvent": {
                        type: "java.lang.String"
                    },
                    "CamelTraceEventNodeId": {
                        type: "java.lang.String"
                    },
                    "CamelTraceEventTimestamp": {
                        type: "java.lang.String"
                    },
                    "CamelTraceEventExchange": {
                        type: "java.lang.String"
                    },
                    "Transfer-Encoding": {
                        type: "java.lang.String"
                    },
                    "CamelUnitOfWorkExhausted": {
                        type: "java.lang.String"
                    },
                    "CamelUnitOfWorkProcessSync": {
                        type: "java.lang.String"
                    },
                    "CamelXsltFileName": {
                        type: "java.lang.String"
                    }
                }
            }
        }
    };
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.DebugRouteController", ["$scope", "$element", "workspace", "jolokia", "localStorage", "documentBase", function ($scope, $element, workspace, jolokia, localStorage, documentBase) {
        var log = Logger.get("CamelDebugger");
        // ignore the cached stuff in camel.ts as it seems to bork the node ids for some reason...
        $scope.debugging = false;
        $scope.stopped = false;
        $scope.ignoreRouteXmlNode = true;
        $scope.messages = [];
        $scope.mode = 'text';
        // always show the message details
        $scope.showMessageDetails = true;
        $scope.startDebugging = function () {
            log.info("Start debugging");
            setDebugging(true);
        };
        $scope.stopDebugging = function () {
            log.info("Stop debugging");
            setDebugging(false);
        };
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(reloadData, 50);
        });
        $scope.$on("camel.diagram.selectedNodeId", function (event, value) {
            $scope.selectedDiagramNodeId = value;
            updateBreakpointFlag();
        });
        $scope.$on("camel.diagram.layoutComplete", function (event, value) {
            updateBreakpointIcons();
            $($element).find("g.node").dblclick(function (n) {
                var id = this.getAttribute("data-cid");
                $scope.toggleBreakpoint(id);
            });
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid()) {
                return;
            }
            reloadData();
        });
        $scope.toggleBreakpoint = function (id) {
            log.info("Toggle breakpoint");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean && id) {
                var method = isBreakpointSet(id) ? "removeBreakpoint" : "addBreakpoint";
                jolokia.execute(mbean, method, id, Core.onSuccess(breakpointsChanged));
            }
        };
        $scope.addBreakpoint = function () {
            log.info("Add breakpoint");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean && $scope.selectedDiagramNodeId) {
                jolokia.execute(mbean, "addBreakpoint", $scope.selectedDiagramNodeId, Core.onSuccess(breakpointsChanged));
            }
        };
        $scope.removeBreakpoint = function () {
            log.info("Remove breakpoint");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean && $scope.selectedDiagramNodeId) {
                jolokia.execute(mbean, "removeBreakpoint", $scope.selectedDiagramNodeId, Core.onSuccess(breakpointsChanged));
            }
        };
        $scope.resume = function () {
            log.info("Resume");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean) {
                jolokia.execute(mbean, "resumeAll", Core.onSuccess(clearStoppedAndResume));
            }
        };
        $scope.suspend = function () {
            log.info("Suspend");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean) {
                jolokia.execute(mbean, "suspendAll", Core.onSuccess(clearStoppedAndResume));
            }
        };
        $scope.step = function () {
            log.info("Step");
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            var stepNode = getStoppedBreakpointId();
            if (mbean && stepNode) {
                jolokia.execute(mbean, "stepBreakpoint(java.lang.String)", stepNode, Core.onSuccess(clearStoppedAndResume));
            }
        };
        function onSelectionChanged() {
            var toNode = getStoppedBreakpointId();
            if (toNode) {
                // lets highlight the node in the diagram
                var nodes = getDiagramNodes();
                Camel.highlightSelectedNode(nodes, toNode);
            }
            else {
                // clear highlight
                Camel.highlightSelectedNode(nodes, null);
            }
        }
        function reloadData() {
            $scope.debugging = false;
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean) {
                $scope.debugging = jolokia.getAttribute(mbean, "Enabled", Core.onSuccess(null));
                if ($scope.debugging) {
                    jolokia.execute(mbean, "getBreakpoints", Core.onSuccess(onBreakpoints));
                    // get the breakpoints...
                    $scope.graphView = "plugins/camel/html/routes.html";
                    Core.register(jolokia, $scope, {
                        type: 'exec',
                        mbean: mbean,
                        operation: 'getDebugCounter'
                    }, Core.onSuccess(onBreakpointCounter));
                }
                else {
                    $scope.graphView = null;
                }
            }
        }
        function onBreakpointCounter(response) {
            var counter = response.value;
            if (counter && counter !== $scope.breakpointCounter) {
                $scope.breakpointCounter = counter;
                loadCurrentStack();
            }
        }
        /*
         * lets load current 'stack' of which breakpoints are active
         * and what is the current message content
         */
        function loadCurrentStack() {
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean) {
                console.log("getting suspended breakpoints!");
                jolokia.execute(mbean, "getSuspendedBreakpointNodeIds", Core.onSuccess(onSuspendedBreakpointNodeIds));
            }
        }
        function onSuspendedBreakpointNodeIds(response) {
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            $scope.suspendedBreakpoints = response;
            $scope.stopped = response && response.length;
            var stopNodeId = getStoppedBreakpointId();
            if (mbean && stopNodeId) {
                jolokia.execute(mbean, 'dumpTracedMessagesAsXml', stopNodeId, Core.onSuccess(onMessages));
                // lets update the diagram selection to the newly stopped node
                $scope.selectedDiagramNodeId = stopNodeId;
            }
        }
        function onMessages(response, stopNodeId) {
            log.debug("onMessage -> " + response);
            $scope.messages = [];
            if (response) {
                var xml = response;
                if (angular.isString(xml)) {
                    // lets parse the XML DOM here...
                    var doc = $.parseXML(xml);
                    var allMessages = $(doc).find("fabricTracerEventMessage");
                    if (!allMessages || !allMessages.length) {
                        // lets try find another element name
                        allMessages = $(doc).find("backlogTracerEventMessage");
                    }
                    allMessages.each(function (idx, message) {
                        var messageData = Camel.createMessageFromXml(message);
                        var toNode = $(message).find("toNode").text();
                        if (toNode) {
                            messageData["toNode"] = toNode;
                        }
                        // attach the open dialog to make it work
                        messageData.openMessageDialog = $scope.openMessageDialog;
                        $scope.messages.push(messageData);
                    });
                }
            }
            else {
                log.warn("WARNING: dumpTracedMessagesAsXml() returned no results!");
            }
            // lets update the selection and selected row for the message detail view
            updateMessageSelection();
            updateBreakpointIcons();
            onSelectionChanged();
            log.debug("has messages " + $scope.messages.length + " selected row " + $scope.row + " index " + $scope.rowIndex);
            Core.$apply($scope);
        }
        function updateMessageSelection() {
            if ($scope.messages.length > 0) {
                $scope.row = $scope.messages[0];
                var body = $scope.row.body;
                $scope.mode = angular.isString(body) ? CodeEditor.detectTextFormat(body) : "text";
                // it may detect wrong as javascript, so use text instead
                if ("javascript" == $scope.mode) {
                    $scope.mode = "text";
                }
            }
            else {
                // lets make a dummy empty row so we can keep the detail view while resuming
                $scope.row = {
                    headers: {},
                    body: "",
                    bodyType: ""
                };
                $scope.mode = "text";
            }
        }
        function clearStoppedAndResume() {
            $scope.messages = [];
            $scope.suspendedBreakpoints = [];
            $scope.stopped = false;
            updateMessageSelection();
            updateBreakpointIcons();
            onSelectionChanged();
            Core.$apply($scope);
        }
        /*
         * Return the current node id we are stopped at
         */
        function getStoppedBreakpointId() {
            var stepNode = null;
            var stepNodes = $scope.suspendedBreakpoints;
            if (stepNodes && stepNodes.length) {
                stepNode = stepNodes[0];
                if (stepNodes.length > 1 && isSuspendedAt($scope.selectedDiagramNodeId)) {
                    // TODO should consider we stepping from different nodes based on the call thread or selection?
                    stepNode = $scope.selectedDiagramNodeId;
                }
            }
            return stepNode;
        }
        /*
         * Returns true if the execution is currently suspended at the given node
         */
        function isSuspendedAt(nodeId) {
            return containsNodeId($scope.suspendedBreakpoints, nodeId);
        }
        function onBreakpoints(response) {
            $scope.breakpoints = response;
            updateBreakpointFlag();
            // update the breakpoint icons...
            var nodes = getDiagramNodes();
            if (nodes.length) {
                updateBreakpointIcons(nodes);
            }
            Core.$apply($scope);
        }
        /*
         * Returns true if there is a breakpoint set at the given node id
         */
        function isBreakpointSet(nodeId) {
            return containsNodeId($scope.breakpoints, nodeId);
        }
        function updateBreakpointFlag() {
            $scope.hasBreakpoint = isBreakpointSet($scope.selectedDiagramNodeId);
        }
        function containsNodeId(breakpoints, nodeId) {
            return nodeId && breakpoints && breakpoints.some(nodeId);
        }
        function getDiagramNodes() {
            var svg = d3.select("svg");
            return svg.selectAll("g .node");
        }
        var breakpointImage = UrlHelpers.join(documentBase, "/img/icons/camel/breakpoint.gif");
        var suspendedBreakpointImage = UrlHelpers.join(documentBase, "/img/icons/camel/breakpoint-suspended.gif");
        function updateBreakpointIcons(nodes) {
            if (nodes === void 0) { nodes = getDiagramNodes(); }
            nodes.each(function (object) {
                // add breakpoint icon
                var nodeId = object.cid;
                var thisNode = d3.select(this);
                var icons = thisNode.selectAll("image.breakpoint");
                var isSuspended = isSuspendedAt(nodeId);
                var isBreakpoint = isBreakpointSet(nodeId);
                if (isBreakpoint || isSuspended) {
                    var imageUrl = isSuspended ? suspendedBreakpointImage : breakpointImage;
                    // lets add an icon image if we don't already have one
                    if (!icons.length || !icons[0].length) {
                        thisNode.append("image").attr("xlink:href", function (d) {
                            return imageUrl;
                        }).attr("class", "breakpoint").attr("x", -12).attr("y", -20).attr("height", 24).attr("width", 24);
                    }
                    else {
                        icons.attr("xlink:href", function (d) {
                            return imageUrl;
                        });
                    }
                }
                else {
                    icons.remove();
                }
            });
        }
        function breakpointsChanged(response) {
            reloadData();
            Core.$apply($scope);
        }
        function setDebugging(flag) {
            var mbean = Camel.getSelectionCamelDebugMBean(workspace);
            if (mbean) {
                var method = flag ? "enableDebugger" : "disableDebugger";
                var max = Camel.maximumTraceOrDebugBodyLength(localStorage);
                var streams = Camel.traceOrDebugIncludeStreams(localStorage);
                jolokia.setAttribute(mbean, "BodyMaxChars", max);
                jolokia.setAttribute(mbean, "BodyIncludeStreams", streams);
                jolokia.setAttribute(mbean, "BodyIncludeFiles", streams);
                jolokia.execute(mbean, method, Core.onSuccess(breakpointsChanged));
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.EndpointController", ["$scope", "$location", "localStorage", "workspace", "jolokia", function ($scope, $location, localStorage, workspace, jolokia) {
        Camel.initEndpointChooserScope($scope, $location, localStorage, workspace, jolokia);
        $scope.workspace = workspace;
        $scope.message = "";
        $scope.createEndpoint = function (name) {
            var jolokia = workspace.jolokia;
            if (jolokia) {
                var mbean = Camel.getSelectionCamelContextMBean(workspace);
                if (mbean) {
                    $scope.message = "Creating endpoint " + name;
                    var operation = "createEndpoint(java.lang.String)";
                    jolokia.execute(mbean, operation, name, Core.onSuccess(operationSuccess));
                }
                else {
                    Core.notification("error", "Could not find the CamelContext MBean!");
                }
            }
        };
        $scope.createEndpointFromData = function () {
            if ($scope.selectedComponentName && $scope.endpointPath) {
                var name = $scope.selectedComponentName + "://" + $scope.endpointPath;
                console.log("Have endpoint data " + JSON.stringify($scope.endpointParameters));
                var params = "";
                angular.forEach($scope.endpointParameters, function (value, key) {
                    var prefix = params ? "&" : "";
                    params += prefix + key + "=" + value;
                });
                if (params) {
                    name += "?" + params;
                }
                // TODO use form data too for URIs parameters...
                $scope.createEndpoint(name);
            }
        };
        $scope.deleteEndpoint = function () {
            var jolokia = workspace.jolokia;
            var selection = workspace.selection;
            var entries = selection.entries;
            if (selection && jolokia && entries) {
                var domain = selection.domain;
                var brokerName = entries["BrokerName"];
                var name = entries["Destination"];
                var isQueue = "Topic" !== entries["Type"];
                if (domain && brokerName) {
                    var mbean = "" + domain + ":BrokerName=" + brokerName + ",Type=Broker";
                    $scope.message = "Deleting " + (isQueue ? "queue" : "topic") + " " + name;
                    var operation = "removeEndpoint(java.lang.String)";
                    jolokia.execute(mbean, operation, name, Core.onSuccess(deleteSuccess));
                }
            }
        };
        function operationSuccess() {
            $scope.endpointName = "";
            $scope.workspace.operationCounter += 1;
            Core.$apply($scope);
            Core.notification("success", $scope.message);
        }
        function deleteSuccess() {
            // lets set the selection to the parent
            if (workspace.selection) {
                var parent = Core.pathGet(workspace, ["selection", "parent"]);
                if (parent) {
                    $scope.workspace.updateSelectionNode(parent);
                }
            }
            $scope.workspace.operationCounter += 1;
            Core.$apply($scope);
            Core.notification("success", $scope.message);
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/**
 * @module Camel
 */
var Camel;
(function (Camel) {
    /**
     * Define the default categories for endpoints and map them to endpoint names
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    Camel.endpointCategories = {
        bigdata: {
            label: "Big Data",
            endpoints: ["hdfs", "hbase", "lucene", "solr"],
            endpointIcon: "img/icons/camel/endpointRepository24.png"
        },
        database: {
            label: "Database",
            endpoints: ["couchdb", "elasticsearch", "hbase", "jdbc", "jpa", "hibernate", "mongodb", "mybatis", "sql"],
            endpointIcon: "img/icons/camel/endpointRepository24.png"
        },
        cloud: {
            label: "Cloud",
            endpoints: [
                "aws-cw",
                "aws-ddb",
                "aws-sdb",
                "aws-ses",
                "aws-sns",
                "aws-sqs",
                "aws-s3",
                "gauth",
                "ghhtp",
                "glogin",
                "gtask",
                "jclouds"
            ]
        },
        core: {
            label: "Core",
            endpoints: ["bean", "direct", "seda"]
        },
        messaging: {
            label: "Messaging",
            endpoints: ["jms", "activemq", "amqp", "cometd", "cometds", "mqtt", "netty", "vertx", "websocket"],
            endpointIcon: "img/icons/camel/endpointQueue24.png"
        },
        mobile: {
            label: "Mobile",
            endpoints: ["apns"]
        },
        sass: {
            label: "SaaS",
            endpoints: ["salesforce", "sap-netweaver"]
        },
        social: {
            label: "Social",
            endpoints: ["atom", "facebook", "irc", "ircs", "rss", "smpp", "twitter", "weather"]
        },
        storage: {
            label: "Storage",
            endpointIcon: "img/icons/camel/endpointFolder24.png",
            endpoints: ["file", "ftp", "sftp", "scp", "jsch"]
        },
        template: {
            label: "Templating",
            endpoints: ["freemarker", "velocity", "xquery", "xslt", "scalate", "string-template"]
        }
    };
    /**
     * Maps endpoint names to a category object
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    Camel.endpointToCategory = {};
    Camel.endpointIcon = "img/icons/camel/endpoint24.png";
    /**
     *  specify custom label & icon properties for endpoint names
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    Camel.endpointConfigurations = {
        drools: {
            icon: "img/icons/camel/endpointQueue24.png"
        },
        quartz: {
            icon: "img/icons/camel/endpointTimer24.png"
        },
        facebook: {
            icon: "img/icons/camel/endpoints/facebook24.jpg"
        },
        salesforce: {
            icon: "img/icons/camel/endpoints/salesForce24.png"
        },
        sap: {
            icon: "img/icons/camel/endpoints/SAPe24.png"
        },
        "sap-netweaver": {
            icon: "img/icons/camel/endpoints/SAPNetweaver24.jpg"
        },
        timer: {
            icon: "img/icons/camel/endpointTimer24.png"
        },
        twitter: {
            icon: "img/icons/camel/endpoints/twitter24.png"
        },
        weather: {
            icon: "img/icons/camel/endpoints/weather24.jpg"
        }
    };
    /**
     * Define the default form configurations
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    Camel.endpointForms = {
        file: {
            tabs: {
                //'Core': ['key', 'value'],
                'Options': ['*']
            }
        },
        activemq: {
            tabs: {
                'Connection': ['clientId', 'transacted', 'transactedInOut', 'transactionName', 'transactionTimeout'],
                'Producer': ['timeToLive', 'priority', 'allowNullBody', 'pubSubNoLocal', 'preserveMessageQos'],
                'Consumer': ['concurrentConsumers', 'acknowledgementModeName', 'selector', 'receiveTimeout'],
                'Reply': ['replyToDestination', 'replyToDeliveryPersistent', 'replyToCacheLevelName', 'replyToDestinationSelectorName'],
                'Options': ['*']
            }
        }
    };
    Camel.endpointForms["jms"] = Camel.endpointForms.activemq;
    angular.forEach(Camel.endpointCategories, function (category, catKey) {
        category.id = catKey;
        angular.forEach(category.endpoints, function (endpoint) {
            Camel.endpointToCategory[endpoint] = category;
        });
    });
    /**
     * Override the EIP pattern tabs...
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    var camelModelTabExtensions = {
        route: {
            'Overview': ['id', 'description'],
            'Advanced': ['*']
        }
    };
    function getEndpointIcon(endpointName) {
        var value = Camel.getEndpointConfig(endpointName, null);
        var answer = Core.pathGet(value, ["icon"]);
        if (!answer) {
            var category = getEndpointCategory(endpointName);
            answer = Core.pathGet(category, ["endpointIcon"]);
        }
        answer = answer || Camel.endpointIcon;
        if (HawtioCore.injector) {
            var documentBase = HawtioCore.injector.get('documentBase');
            answer = UrlHelpers.join(documentBase, answer);
        }
        return answer;
    }
    Camel.getEndpointIcon = getEndpointIcon;
    function getEndpointConfig(endpointName, category) {
        var answer = Camel.endpointConfigurations[endpointName];
        if (!answer) {
            answer = {};
            Camel.endpointConfigurations[endpointName] = answer;
        }
        if (!answer.label) {
            answer.label = endpointName;
        }
        if (!answer.icon) {
            answer.icon = Core.pathGet(category, ["endpointIcon"]) || Camel.endpointIcon;
        }
        if (!answer.category) {
            answer.category = category;
        }
        return answer;
    }
    Camel.getEndpointConfig = getEndpointConfig;
    function getEndpointCategory(endpointName) {
        return Camel.endpointToCategory[endpointName] || Camel.endpointCategories.core;
    }
    Camel.getEndpointCategory = getEndpointCategory;
    function getConfiguredCamelModel() {
        var schema = Camel._apacheCamelModel;
        var definitions = schema["definitions"];
        if (definitions) {
            angular.forEach(camelModelTabExtensions, function (tabs, name) {
                var model = definitions[name];
                if (model) {
                    if (!model["tabs"]) {
                        model["tabs"] = tabs;
                    }
                }
            });
        }
        return schema;
    }
    Camel.getConfiguredCamelModel = getConfiguredCamelModel;
    function initEndpointChooserScope($scope, $location, localStorage, workspace, jolokia) {
        $scope.selectedComponentName = null;
        $scope.endpointParameters = {};
        $scope.endpointPath = "";
        $scope.schema = {
            definitions: {}
        };
        $scope.jolokia = jolokia;
        var silentOptions = { silent: true };
        $scope.$watch('workspace.selection', function () {
            $scope.loadEndpointNames();
        });
        $scope.$watch('selectedComponentName', function () {
            if ($scope.selectedComponentName !== $scope.loadedComponentName) {
                $scope.endpointParameters = {};
                $scope.loadEndpointSchema($scope.selectedComponentName);
                $scope.loadedComponentName = $scope.selectedComponentName;
            }
        });
        $scope.endpointCompletions = function (completionText) {
            var answer = null;
            var mbean = findCamelContextMBean();
            var componentName = $scope.selectedComponentName;
            var endpointParameters = {};
            if (mbean && componentName && completionText) {
                answer = $scope.jolokia.execute(mbean, 'completeEndpointPath', componentName, endpointParameters, completionText, Core.onSuccess(null, silentOptions));
            }
            return answer || [];
        };
        $scope.loadEndpointNames = function () {
            $scope.componentNames = null;
            var mbean = findCamelContextMBean();
            if (mbean) {
                $scope.jolokia.execute(mbean, 'findComponentNames', Core.onSuccess(onComponents, { silent: true }));
            }
            else {
                console.log("WARNING: No camel context mbean so cannot load component names");
            }
        };
        $scope.loadEndpointSchema = function (componentName) {
            var mbean = findCamelContextMBean();
            if (mbean && componentName && componentName !== $scope.loadedEndpointSchema) {
                $scope.selectedComponentName = componentName;
                $scope.jolokia.execute(mbean, 'componentParameterJsonSchema', componentName, Core.onSuccess(onEndpointSchema, silentOptions));
            }
        };
        function onComponents(response) {
            $scope.componentNames = response;
            Camel.log.info("onComponents: " + response);
            $scope.hasComponentNames = $scope.componentNames ? true : false;
            Core.$apply($scope);
        }
        function onEndpointSchema(response) {
            if (response) {
                try {
                    //console.log("got JSON: " + response);
                    var json = JSON.parse(response);
                    var endpointName = $scope.selectedComponentName;
                    configureEndpointSchema(endpointName, json);
                    $scope.endpointSchema = json;
                    $scope.schema.definitions[endpointName] = json;
                    $scope.loadedEndpointSchema = endpointName;
                    Core.$apply($scope);
                }
                catch (e) {
                    console.log("Failed to parse JSON " + e);
                    console.log("JSON: " + response);
                }
            }
        }
        function configureEndpointSchema(endpointName, json) {
            console.log("======== configuring schema for " + endpointName);
            var config = Camel.endpointForms[endpointName];
            if (config && json) {
                if (config.tabs) {
                    json.tabs = config.tabs;
                }
            }
        }
        function findCamelContextMBean() {
            var profileWorkspace = $scope.profileWorkspace;
            if (!profileWorkspace) {
                var removeJolokia = $scope.jolokia;
                if (removeJolokia) {
                    profileWorkspace = Core.createRemoteWorkspace(removeJolokia, $location, localStorage);
                    $scope.profileWorkspace = profileWorkspace;
                }
            }
            if (!profileWorkspace) {
                Camel.log.info("No profileWorkspace found so defaulting it to workspace for now");
                profileWorkspace = workspace;
            }
            // TODO we need to find the MBean for the CamelContext / Route we are editing!
            var componentName = $scope.selectedComponentName;
            var selectedCamelContextId;
            var selectedRouteId;
            if (angular.isDefined($scope.camelSelectionDetails)) {
                selectedCamelContextId = $scope.camelSelectionDetails.selectedCamelContextId;
                selectedRouteId = $scope.camelSelectionDetails.selectedRouteId;
            }
            console.log("==== componentName " + componentName + " selectedCamelContextId: " + selectedCamelContextId + " selectedRouteId: " + selectedRouteId);
            var contextsById = Camel.camelContextMBeansById(profileWorkspace);
            if (selectedCamelContextId) {
                var mbean = Core.pathGet(contextsById, [selectedCamelContextId, "mbean"]);
                if (mbean) {
                    return mbean;
                }
            }
            if (selectedRouteId) {
                var map = Camel.camelContextMBeansByRouteId(profileWorkspace);
                var mbean = Core.pathGet(map, [selectedRouteId, "mbean"]);
                if (mbean) {
                    return mbean;
                }
            }
            if (componentName) {
                var map = Camel.camelContextMBeansByComponentName(profileWorkspace);
                var mbean = Core.pathGet(map, [componentName, "mbean"]);
                if (mbean) {
                    return mbean;
                }
            }
            // NOTE we don't really know which camel context to pick, so lets just find the first one?
            var answer = null;
            angular.forEach(contextsById, function (details, id) {
                var mbean = details.mbean;
                if (!answer && mbean)
                    answer = mbean;
            });
            return answer;
            /*
                  // we could be remote to lets query jolokia
                  var results = $scope.jolokia.search("org.apache.camel:*,type=context", Core.onSuccess(null));
                  //var results = $scope.jolokia.search("org.apache.camel:*", Core.onSuccess(null));
                  if (results && results.length) {
                    console.log("===== Got results: " + results);
                    return results[0];
                  }
            
                  var mbean = Camel.getSelectionCamelContextMBean(profileWorkspace);
                  if (!mbean && $scope.findProfileCamelContext) {
                    // TODO as a hack for now lets just find any camel context we can
                    var folder = Core.getMBeanTypeFolder(profileWorkspace, Camel.jmxDomain, "context");
                    mbean = Core.pathGet(folder, ["objectName"]);
                  }
                  return mbean;
            */
        }
    }
    Camel.initEndpointChooserScope = initEndpointChooserScope;
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.EndpointRuntimeRegistryController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.data = [];
        $scope.selectedMBean = null;
        $scope.mbeanAttributes = {};
        var columnDefs = [
            {
                field: 'url',
                displayName: 'Url',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'routeId',
                displayName: 'Route Id',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'direction',
                displayName: 'Direction',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'static',
                displayName: 'Static',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'dynamic',
                displayName: 'Dynamic',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'hits',
                displayName: 'Hits',
                cellFilter: null,
                width: "*",
                resizable: true
            }
        ];
        $scope.gridOptions = {
            data: 'data',
            displayFooter: true,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            enableSorting: true,
            columnDefs: columnDefs,
            selectedItems: [],
            filterOptions: {
                filterText: ''
            }
        };
        function onRestRegistry(response) {
            var obj = response.value;
            if (obj) {
                // the JMX tabular data has 2 indexes so we need to dive 2 levels down to grab the data
                var arr = [];
                for (var key in obj) {
                    var entry = obj[key];
                    arr.push({
                        url: entry.url,
                        routeId: entry.routeId,
                        direction: entry.direction,
                        static: entry.static,
                        dynamic: entry.dynamic,
                        hits: entry.hits
                    });
                }
                arr = arr.sortBy("url");
                $scope.data = arr;
                // okay we have the data then set the selected mbean which allows UI to display data
                $scope.selectedMBean = response.request.mbean;
            }
            else {
                // set the mbean to a value so the ui can get updated
                $scope.selectedMBean = "true";
            }
            // ensure web page is updated
            Core.$apply($scope);
        }
        $scope.renderIcon = function (state) {
            return Camel.iconClass(state);
        };
        function loadEndpointRegistry() {
            console.log("Loading EndpointRuntimeRegistry data...");
            var mbean = Camel.getSelectionCamelEndpointRuntimeRegistry(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'endpointStatistics' }, Core.onSuccess(onRestRegistry));
            }
        }
        // load data
        loadEndpointRegistry();
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.InflightController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.data = [];
        $scope.initDone = false;
        $scope.mbeanAttributes = {};
        var columnDefs = [
            {
                field: 'exchangeId',
                displayName: 'Exchange Id',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'routeId',
                displayName: 'Route Id',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'nodeId',
                displayName: 'Node Id',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'duration',
                displayName: 'Duration (ms)',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'elapsed',
                displayName: 'Elapsed (ms)',
                cellFilter: null,
                width: "*",
                resizable: true
            }
        ];
        $scope.gridOptions = {
            data: 'data',
            displayFooter: true,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            enableSorting: true,
            columnDefs: columnDefs,
            selectedItems: [],
            filterOptions: {
                filterText: ''
            }
        };
        function onInflight(response) {
            var obj = response.value;
            if (obj) {
                // the JMX tabular data has 1 index so we need to dive 1 levels down to grab the data
                var arr = [];
                for (var key in obj) {
                    var entry = obj[key];
                    arr.push({
                        exchangeId: entry.exchangeId,
                        routeId: entry.routeId,
                        nodeId: entry.nodeId,
                        duration: entry.duration,
                        elapsed: entry.elapsed
                    });
                }
                arr = arr.sortBy("exchangeId");
                $scope.data = arr;
                // okay we have the data then set the selected mbean which allows UI to display data
                $scope.selectedMBean = response.request.mbean;
            }
            else {
                // clear data
                $scope.data = [];
            }
            $scope.initDone = "true";
            // ensure web page is updated
            Core.$apply($scope);
        }
        $scope.renderIcon = function (state) {
            return Camel.iconClass(state);
        };
        function loadData() {
            console.log("Loading inflight data...");
            // pre-select filter if we have selected a route
            var routeId = Camel.getSelectedRouteId(workspace);
            if (routeId != null) {
                $scope.gridOptions.filterOptions.filterText = routeId;
            }
            var mbean = Camel.getSelectionCamelInflightRepository(workspace);
            if (mbean) {
                // grab inflight in real time
                var query = { type: "exec", mbean: mbean, operation: 'browse()' };
                Core.scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(onInflight, query));
            }
        }
        // load data
        loadData();
    }]);
})(Camel || (Camel = {}));

var Camel;
(function (Camel) {
    Camel.jmsHeaderSchema = {
        definitions: {
            headers: {
                properties: {
                    JMSCorrelationID: {
                        type: "java.lang.String"
                    },
                    JMSDeliveryMode: {
                        "type": "string",
                        "enum": [
                            "PERSISTENT",
                            "NON_PERSISTENT"
                        ]
                    },
                    JMSDestination: {
                        type: "javax.jms.Destination"
                    },
                    JMSExpiration: {
                        type: "long"
                    },
                    JMSPriority: {
                        type: "int"
                    },
                    JMSReplyTo: {
                        type: "javax.jms.Destination"
                    },
                    JMSType: {
                        type: "java.lang.String"
                    },
                    JMSXGroupId: {
                        type: "java.lang.String"
                    },
                    AMQ_SCHEDULED_CRON: {
                        type: "java.lang.String"
                    },
                    AMQ_SCHEDULED_DELAY: {
                        type: "java.lang.String"
                    },
                    AMQ_SCHEDULED_PERIOD: {
                        type: "java.lang.String"
                    },
                    AMQ_SCHEDULED_REPEAT: {
                        type: "java.lang.String"
                    }
                }
            },
            "javax.jms.Destination": {
                type: "java.lang.String"
            }
        }
    };
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
/**
 * @module Camel
 */
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.PreferencesController", ["$scope", "localStorage", function ($scope, localStorage) {
        var config = {
            properties: {
                camelHideOptionDocumentation: {
                    type: 'boolean',
                    default: Camel.defaultHideOptionDocumentation,
                    description: 'Whether to hide documentation in the properties view and Camel route editor'
                },
                camelHideOptionDefaultValue: {
                    type: 'boolean',
                    default: Camel.defaultHideOptionDefaultValue,
                    description: 'Whether to hide options that are using a default value in the properties view'
                },
                camelHideOptionUnusedValue: {
                    type: 'boolean',
                    default: Camel.defaultHideOptionUnusedValue,
                    description: 'Whether to hide unused/empty options in the properties view'
                },
                camelTraceOrDebugIncludeStreams: {
                    type: 'boolean',
                    default: Camel.defaultCamelTraceOrDebugIncludeStreams,
                    description: 'Whether to include stream based message body when using the tracer and debugger'
                },
                camelMaximumTraceOrDebugBodyLength: {
                    type: 'number',
                    default: Camel.defaultCamelMaximumTraceOrDebugBodyLength,
                    description: 'The maximum length of the body before its clipped when using the tracer and debugger'
                },
                camelMaximumLabelWidth: {
                    type: 'number',
                    description: 'The maximum length of a label in Camel diagrams before it is clipped'
                },
                camelIgnoreIdForLabel: {
                    type: 'boolean',
                    default: false,
                    description: 'If enabled then we will ignore the ID value when viewing a pattern in a Camel diagram; otherwise we will use the ID value as the label (the tooltip will show the actual detail)'
                },
                camelShowInflightCounter: {
                    type: 'boolean',
                    default: true,
                    description: 'Whether to show inflight counter in route diagram'
                },
                camelRouteMetricMaxSeconds: {
                    type: 'number',
                    min: '1',
                    max: '100',
                    description: 'The maximum value in seconds used by the route metrics duration and histogram charts'
                }
            }
        };
        $scope.entity = $scope;
        $scope.config = config;
        Core.initPreferenceScope($scope, localStorage, {
            'camelIgnoreIdForLabel': {
                'value': false,
                'converter': Core.parseBooleanValue
            },
            'camelShowInflightCounter': {
                'value': true,
                'converter': Core.parseBooleanValue
            },
            'camelMaximumLabelWidth': {
                'value': Camel.defaultMaximumLabelWidth,
                'converter': parseInt
            },
            'camelMaximumTraceOrDebugBodyLength': {
                'value': Camel.defaultCamelMaximumTraceOrDebugBodyLength,
                'converter': parseInt
            },
            'camelTraceOrDebugIncludeStreams': {
                'value': Camel.defaultCamelTraceOrDebugIncludeStreams,
                'converter': Core.parseBooleanValue
            },
            'camelRouteMetricMaxSeconds': {
                'value': Camel.defaultCamelRouteMetricMaxSeconds,
                'converter': parseInt
            },
            'camelHideOptionDocumentation': {
                'value': Camel.defaultHideOptionDocumentation,
                'converter': Core.parseBooleanValue
            },
            'camelHideOptionDefaultValue': {
                'value': Camel.defaultHideOptionDefaultValue,
                'converter': Core.parseBooleanValue
            },
            'camelHideOptionUnusedValue': {
                'value': Camel.defaultHideOptionUnusedValue,
                'converter': Core.parseBooleanValue
            }
        });
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.ProfileRouteController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.initDone = false;
        $scope.data = [];
        var columnDefs = [
            {
                field: 'id',
                displayName: 'Id',
                cellFilter: null,
                width: "**",
                resizable: true
            },
            {
                field: 'count',
                displayName: 'Count',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'last',
                displayName: 'Last',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'delta',
                displayName: 'Delta',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'mean',
                displayName: 'Mean',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'min',
                displayName: 'Min',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'max',
                displayName: 'Max',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'total',
                displayName: 'Total',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'self',
                displayName: 'Self',
                cellFilter: null,
                width: "*",
                resizable: true
            }
        ];
        $scope.rowIcon = function (id) {
            var entry = $scope.icons[id];
            if (entry) {
                return entry.img + " " + id;
            }
            else {
                return id;
            }
        };
        $scope.gridOptions = {
            data: 'data',
            displayFooter: true,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            enableSorting: false,
            columnDefs: columnDefs,
            filterOptions: {
                filterText: ''
            }
        };
        function onProfile(response) {
            var updatedData = [];
            // its xml structure so we need to parse it
            var xml = response.value;
            if (angular.isString(xml)) {
                // lets parse the XML DOM here...
                var doc = $.parseXML(xml);
                var routeMessages = $(doc).find("routeStat");
                routeMessages.each(function (idx, message) {
                    var messageData = {
                        id: {},
                        count: {},
                        last: {},
                        delta: {},
                        mean: {},
                        min: {},
                        max: {},
                        total: {},
                        self: {}
                    };
                    // compare counters, as we only update if we have new data
                    messageData.id = message.getAttribute("id");
                    var total = 0;
                    total += +message.getAttribute("exchangesCompleted");
                    total += +message.getAttribute("exchangesFailed");
                    messageData.count = total;
                    messageData.last = message.getAttribute("lastProcessingTime");
                    // delta is only avail from Camel 2.11 onwards
                    var delta = message.getAttribute("deltaProcessingTime");
                    if (delta) {
                        messageData.delta = delta;
                    }
                    else {
                        messageData.delta = 0;
                    }
                    messageData.mean = message.getAttribute("meanProcessingTime");
                    messageData.min = message.getAttribute("minProcessingTime");
                    messageData.max = message.getAttribute("maxProcessingTime");
                    messageData.total = message.getAttribute("totalProcessingTime");
                    messageData.self = message.getAttribute("selfProcessingTime");
                    updatedData.push(messageData);
                });
                var processorMessages = $(doc).find("processorStat");
                processorMessages.each(function (idx, message) {
                    var messageData = {
                        id: {},
                        count: {},
                        last: {},
                        delta: {},
                        mean: {},
                        min: {},
                        max: {},
                        total: {},
                        self: {}
                    };
                    messageData.id = message.getAttribute("id");
                    var total = 0;
                    total += +message.getAttribute("exchangesCompleted");
                    total += +message.getAttribute("exchangesFailed");
                    messageData.count = total;
                    messageData.last = message.getAttribute("lastProcessingTime");
                    // delta is only avail from Camel 2.11 onwards
                    var delta = message.getAttribute("deltaProcessingTime");
                    if (delta) {
                        messageData.delta = delta;
                    }
                    else {
                        messageData.delta = 0;
                    }
                    messageData.mean = message.getAttribute("meanProcessingTime");
                    messageData.min = message.getAttribute("minProcessingTime");
                    messageData.max = message.getAttribute("maxProcessingTime");
                    // total time for processors is pre calculated as accumulated from Camel 2.11 onwards
                    var apt = message.getAttribute("accumulatedProcessingTime");
                    if (apt) {
                        messageData.total = apt;
                    }
                    else {
                        messageData.total = "0";
                    }
                    // self time for processors is their total time
                    messageData.self = message.getAttribute("totalProcessingTime");
                    updatedData.push(messageData);
                });
            }
            // if we do as below with the forEach then the data does not update
            // replace data with updated data
            $scope.data = updatedData;
            $scope.initDone = true;
            // ensure web page is updated
            Core.$apply($scope);
        }
        ;
        function loadData() {
            console.log("Loading Camel route profile data...");
            var selectedRouteId = Camel.getSelectedRouteId(workspace);
            var routeMBean = Camel.getSelectionRouteMBean(workspace, selectedRouteId);
            // schedule update the profile data, based on the configured interval
            if (routeMBean) {
                var query = {
                    type: 'exec',
                    mbean: routeMBean,
                    operation: 'dumpRouteStatsAsXml(boolean,boolean)',
                    arguments: [false, true]
                };
                Core.scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(onProfile, query));
            }
        }
        // load data
        loadData();
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.PropertiesController", ["$scope", "workspace", "localStorage", "jolokia", function ($scope, workspace, localStorage, jolokia) {
        var log = Logger.get("Camel");
        $scope.hideHelp = Camel.hideOptionDocumentation(localStorage);
        $scope.hideUnused = Camel.hideOptionUnusedValue(localStorage);
        $scope.hideDefault = Camel.hideOptionDefaultValue(localStorage);
        $scope.viewTemplate = null;
        $scope.schema = Camel._apacheCamelModel;
        $scope.model = null;
        $scope.labels = [];
        $scope.nodeData = null;
        $scope.icon = null;
        $scope.$watch('hideHelp', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideUnused', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideDefault', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateData, 50);
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            updateData();
        });
        $scope.showEntity = function (id) {
            if ($scope.hideDefault) {
                if (isDefaultValue(id)) {
                    return false;
                }
            }
            if ($scope.hideUnused) {
                if (!hasValue(id)) {
                    return false;
                }
            }
            return true;
        };
        function isDefaultValue(id) {
            var defaultValue = Core.pathGet($scope.model, ["properties", id, "defaultValue"]);
            if (angular.isDefined(defaultValue)) {
                // get the value
                var value = Core.pathGet($scope.nodeData, id);
                if (angular.isDefined(value)) {
                    // default value is always a String type, so try to convert value to a String
                    var str = value.toString();
                    // is it a default value
                    return str.localeCompare(defaultValue) === 0;
                }
            }
            return false;
        }
        function hasValue(id) {
            var value = Core.pathGet($scope.nodeData, id);
            if (angular.isUndefined(value) || Core.isBlank(value)) {
                return false;
            }
            if (angular.isString(value)) {
                // to show then must not be blank
                return !Core.isBlank(value);
            }
            return true;
        }
        function updateData() {
            var routeXmlNode = Camel.getSelectedRouteNode(workspace);
            $scope.nodeData = Camel.getRouteNodeJSON(routeXmlNode);
            if (routeXmlNode) {
                $scope.model = Camel.getCamelSchema(routeXmlNode.nodeName);
                if ($scope.model) {
                    if (log.enabledFor(Logger.DEBUG)) {
                        log.debug("Properties - data: " + JSON.stringify($scope.nodeData, null, "  "));
                        log.debug("Properties - schema: " + JSON.stringify($scope.model, null, "  "));
                    }
                    // labels is named group in camelModel.js
                    var labels = [];
                    if ($scope.model.group) {
                        labels = $scope.model.group.split(",");
                    }
                    $scope.labels = labels;
                    $scope.nodeData = Camel.getRouteNodeJSON(routeXmlNode);
                    $scope.icon = Camel.getRouteNodeIcon(routeXmlNode);
                    $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";
                    Core.$apply($scope);
                }
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.PropertiesComponentController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", function ($scope, workspace, localStorage, jolokia, documentBase) {
        var log = Logger.get("Camel");
        $scope.hideHelp = Camel.hideOptionDocumentation(localStorage);
        $scope.hideUnused = Camel.hideOptionUnusedValue(localStorage);
        $scope.hideDefault = Camel.hideOptionDefaultValue(localStorage);
        $scope.viewTemplate = null;
        $scope.schema = null;
        $scope.model = null;
        $scope.labels = [];
        $scope.nodeData = null;
        $scope.icon = null;
        $scope.componentName = null;
        $scope.$watch('hideHelp', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideUnused', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideDefault', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateData, 50);
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            updateData();
        });
        $scope.showEntity = function (id) {
            if ($scope.hideDefault) {
                if (isDefaultValue(id)) {
                    return false;
                }
            }
            if ($scope.hideUnused) {
                if (!hasValue(id)) {
                    return false;
                }
            }
            return true;
        };
        function isDefaultValue(id) {
            var defaultValue = Core.pathGet($scope.model, ["properties", id, "defaultValue"]);
            if (angular.isDefined(defaultValue)) {
                // get the value
                var value = Core.pathGet($scope.nodeData, id);
                if (angular.isDefined(value)) {
                    // default value is always a String type, so try to convert value to a String
                    var str = value.toString();
                    // is it a default value
                    return str.localeCompare(defaultValue) === 0;
                }
            }
            return false;
        }
        function hasValue(id) {
            var value = Core.pathGet($scope.nodeData, id);
            if (angular.isUndefined(value) || Core.isBlank(value)) {
                return false;
            }
            if (angular.isString(value)) {
                // to show then must not be blank
                return !Core.isBlank(value);
            }
            return true;
        }
        function updateData() {
            var contextMBean = Camel.getSelectionCamelContextMBean(workspace);
            var componentMBeanName = null;
            if (!componentMBeanName) {
                componentMBeanName = workspace.getSelectedMBeanName();
            }
            if (componentMBeanName && contextMBean) {
                // TODO: grab name from tree instead? avoids a JMX call
                var reply = jolokia.request({ type: "read", mbean: componentMBeanName, attribute: ["ComponentName"] });
                var name = reply.value["ComponentName"];
                if (name) {
                    $scope.componentName = name;
                    log.info("Calling explainComponentJson for name: " + name);
                    var query = {
                        type: 'exec',
                        mbean: contextMBean,
                        operation: 'explainComponentJson(java.lang.String,boolean)',
                        arguments: [name, true]
                    };
                    jolokia.request(query, Core.onSuccess(populateData));
                }
            }
        }
        function populateData(response) {
            log.debug("Populate data " + response);
            var data = response.value;
            if (data) {
                // the model is json object from the string data
                $scope.model = JSON.parse(data);
                // set title and description
                $scope.model.title = $scope.componentName;
                $scope.model.description = $scope.model.component.description;
                // TODO: look for specific component icon,
                $scope.icon = UrlHelpers.join(documentBase, "/img/icons/camel/endpoint24.png");
                // grab all values form the model as they are the current data we need to add to node data (not all properties has a value)
                $scope.nodeData = {};
                // must be named properties as that is what the form expects
                $scope.model.properties = $scope.model.componentProperties;
                angular.forEach($scope.model.componentProperties, function (property, key) {
                    // does it have a value or fallback to use a default value
                    var value = property["value"] || property["defaultValue"];
                    if (angular.isDefined(value) && value !== null) {
                        $scope.nodeData[key] = value;
                    }
                    // remove label as that causes the UI to render the label instead of the key as title
                    // we should later group the table into labels (eg consumer vs producer)
                    delete property["label"];
                });
                var labels = [];
                if ($scope.model.component.label) {
                    labels = $scope.model.component.label.split(",");
                }
                $scope.labels = labels;
                $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";
                Core.$apply($scope);
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.PropertiesDataFormatController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", function ($scope, workspace, localStorage, jolokia, documentBase) {
        var log = Logger.get("Camel");
        $scope.hideHelp = Camel.hideOptionDocumentation(localStorage);
        $scope.hideUnused = Camel.hideOptionUnusedValue(localStorage);
        $scope.hideDefault = Camel.hideOptionDefaultValue(localStorage);
        $scope.viewTemplate = null;
        $scope.schema = null;
        $scope.model = null;
        $scope.labels = [];
        $scope.nodeData = null;
        $scope.icon = null;
        $scope.dataFormatName = null;
        $scope.$watch('hideHelp', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideUnused', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideDefault', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateData, 50);
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            updateData();
        });
        $scope.showEntity = function (id) {
            if ($scope.hideDefault) {
                if (isDefaultValue(id)) {
                    return false;
                }
            }
            if ($scope.hideUnused) {
                if (!hasValue(id)) {
                    return false;
                }
            }
            return true;
        };
        function isDefaultValue(id) {
            var defaultValue = Core.pathGet($scope.model, ["properties", id, "defaultValue"]);
            if (angular.isDefined(defaultValue)) {
                // get the value
                var value = Core.pathGet($scope.nodeData, id);
                if (angular.isDefined(value)) {
                    // default value is always a String type, so try to convert value to a String
                    var str = value.toString();
                    // is it a default value
                    return str.localeCompare(defaultValue) === 0;
                }
            }
            return false;
        }
        function hasValue(id) {
            var value = Core.pathGet($scope.nodeData, id);
            if (angular.isUndefined(value) || Core.isBlank(value)) {
                return false;
            }
            if (angular.isString(value)) {
                // to show then must not be blank
                return !Core.isBlank(value);
            }
            return true;
        }
        function updateData() {
            var dataFormatMBeanName = null;
            if (!dataFormatMBeanName) {
                dataFormatMBeanName = workspace.getSelectedMBeanName();
            }
            if (dataFormatMBeanName) {
                log.info("Calling informationJson");
                var query = {
                    type: 'exec',
                    mbean: dataFormatMBeanName,
                    operation: 'informationJson'
                };
                jolokia.request(query, Core.onSuccess(populateData));
            }
        }
        function populateData(response) {
            log.debug("Populate data " + response);
            var data = response.value;
            if (data) {
                // the model is json object from the string data
                $scope.model = JSON.parse(data);
                // set title and description
                $scope.model.title = $scope.model.dataformat.title + " (" + $scope.model.dataformat.name + ")";
                $scope.model.description = $scope.model.dataformat.description;
                // TODO: look for specific component icon,
                $scope.icon = UrlHelpers.join(documentBase, "/img/icons/camel/marshal24.png");
                // grab all values form the model as they are the current data we need to add to node data (not all properties has a value)
                $scope.nodeData = {};
                angular.forEach($scope.model.properties, function (property, key) {
                    // does it have a value or fallback to use a default value
                    var value = property["value"] || property["defaultValue"];
                    if (angular.isDefined(value) && value !== null) {
                        $scope.nodeData[key] = value;
                    }
                    // remove label as that causes the UI to render the label instead of the key as title
                    // we should later group the table into labels (eg consumer vs producer)
                    delete property["label"];
                });
                // remove id, as it causes the page to indicate a required field
                delete $scope.model.properties["id"];
                var labels = [];
                if ($scope.model.dataformat.label) {
                    labels = $scope.model.dataformat.label.split(",");
                }
                $scope.labels = labels;
                $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";
                Core.$apply($scope);
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.PropertiesEndpointController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", function ($scope, workspace, localStorage, jolokia, documentBase) {
        var log = Logger.get("Camel");
        $scope.hideHelp = Camel.hideOptionDocumentation(localStorage);
        $scope.hideUnused = Camel.hideOptionUnusedValue(localStorage);
        $scope.hideDefault = Camel.hideOptionDefaultValue(localStorage);
        $scope.viewTemplate = null;
        $scope.schema = null;
        $scope.model = null;
        $scope.labels = [];
        $scope.nodeData = null;
        $scope.icon = null;
        $scope.endpointUrl = null;
        $scope.$watch('hideHelp', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideUnused', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$watch('hideDefault', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                updateData();
            }
        });
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateData, 50);
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            updateData();
        });
        $scope.showEntity = function (id) {
            if ($scope.hideDefault) {
                if (isDefaultValue(id)) {
                    return false;
                }
            }
            if ($scope.hideUnused) {
                if (!hasValue(id)) {
                    return false;
                }
            }
            return true;
        };
        function isDefaultValue(id) {
            var defaultValue = Core.pathGet($scope.model, ["properties", id, "defaultValue"]);
            if (angular.isDefined(defaultValue)) {
                // get the value
                var value = Core.pathGet($scope.nodeData, id);
                if (angular.isDefined(value)) {
                    // default value is always a String type, so try to convert value to a String
                    var str = value.toString();
                    // is it a default value
                    return str.localeCompare(defaultValue) === 0;
                }
            }
            return false;
        }
        function hasValue(id) {
            var value = Core.pathGet($scope.nodeData, id);
            if (angular.isUndefined(value) || Core.isBlank(value)) {
                return false;
            }
            if (angular.isString(value)) {
                // to show then must not be blank
                return !Core.isBlank(value);
            }
            return true;
        }
        function updateData() {
            var contextMBean = Camel.getSelectionCamelContextMBean(workspace);
            var endpointMBean = null;
            if ($scope.contextId && $scope.endpointPath) {
                var node = workspace.findMBeanWithProperties(Camel.jmxDomain, {
                    context: $scope.contextId,
                    type: "endpoints",
                    name: $scope.endpointPath
                });
                if (node) {
                    endpointMBean = node.objectName;
                }
            }
            if (!endpointMBean) {
                endpointMBean = workspace.getSelectedMBeanName();
            }
            if (endpointMBean && contextMBean) {
                // TODO: grab url from tree instead? avoids a JMX call
                var reply = jolokia.request({ type: "read", mbean: endpointMBean, attribute: ["EndpointUri"] });
                var url = reply.value["EndpointUri"];
                if (url) {
                    $scope.endpointUrl = url;
                    log.info("Calling explainEndpointJson for url: " + url);
                    var query = {
                        type: 'exec',
                        mbean: contextMBean,
                        operation: 'explainEndpointJson(java.lang.String,boolean)',
                        arguments: [url, true]
                    };
                    jolokia.request(query, Core.onSuccess(populateData));
                }
            }
        }
        function populateData(response) {
            log.debug("Populate data " + response);
            var data = response.value;
            if (data) {
                // the model is json object from the string data
                $scope.model = JSON.parse(data);
                // set title and description
                $scope.model.title = $scope.endpointUrl;
                $scope.model.description = $scope.model.component.description;
                // TODO: look for specific endpoint icon,
                $scope.icon = UrlHelpers.join(documentBase, "/img/icons/camel/endpoint24.png");
                // grab all values form the model as they are the current data we need to add to node data (not all properties has a value)
                $scope.nodeData = {};
                angular.forEach($scope.model.properties, function (property, key) {
                    // does it have a value or fallback to use a default value
                    var value = property["value"] || property["defaultValue"];
                    if (angular.isDefined(value) && value !== null) {
                        $scope.nodeData[key] = value;
                    }
                    // remove label as that causes the UI to render the label instead of the key as title
                    // we should later group the table into labels (eg consumer vs producer)
                    delete property["label"];
                });
                var labels = [];
                if ($scope.model.component.label) {
                    labels = $scope.model.component.label.split(",");
                }
                $scope.labels = labels;
                $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";
                Core.$apply($scope);
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.RestServiceController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.data = [];
        $scope.selectedMBean = null;
        $scope.mbeanAttributes = {};
        var columnDefs = [
            {
                field: 'url',
                displayName: 'Absolute Url',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'baseUrl',
                displayName: 'Base Url',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'basePath',
                displayName: 'Base Path',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'uriTemplate',
                displayName: 'Uri Template',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'method',
                displayName: 'Method',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'consumes',
                displayName: 'Consumes',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'produces',
                displayName: 'Produces',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'inType',
                displayName: 'Input Type',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'outType',
                displayName: 'Output Type',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'state',
                displayName: 'State',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'routeId',
                displayName: 'Route Id',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'description',
                displayName: 'Description',
                cellFilter: null,
                width: "*",
                resizable: true
            }
        ];
        $scope.gridOptions = {
            data: 'data',
            displayFooter: true,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            enableSorting: true,
            columnDefs: columnDefs,
            selectedItems: [],
            filterOptions: {
                filterText: ''
            }
        };
        function onRestRegistry(response) {
            var obj = response.value;
            if (obj) {
                // the JMX tabular data has 2 indexes so we need to dive 2 levels down to grab the data
                var arr = [];
                for (var key in obj) {
                    var values = obj[key];
                    for (var v in values) {
                        var entry = values[v];
                        arr.push({
                            url: entry.url,
                            baseUrl: entry.baseUrl,
                            basePath: entry.basePath,
                            uriTemplate: entry.uriTemplate,
                            method: entry.method,
                            consumes: entry.consumes,
                            produces: entry.produces,
                            inType: entry.inType,
                            outType: entry.outType,
                            state: entry.state,
                            routeId: entry.routeId,
                            description: entry.description
                        });
                    }
                }
                arr = arr.sortBy("url");
                $scope.data = arr;
                // okay we have the data then set the selected mbean which allows UI to display data
                $scope.selectedMBean = response.request.mbean;
            }
            else {
                // set the mbean to a value so the ui can get updated
                $scope.selectedMBean = "true";
            }
            // ensure web page is updated
            Core.$apply($scope);
        }
        $scope.renderIcon = function (state) {
            return Camel.iconClass(state);
        };
        function loadRestRegistry() {
            console.log("Loading RestRegistry data...");
            var mbean = Camel.getSelectionCamelRestRegistry(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'listRestServices' }, Core.onSuccess(onRestRegistry));
            }
        }
        // load data
        loadRestRegistry();
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.RouteMetricsController", ["$scope", "$location", "workspace", "jolokia", "metricsWatcher", function ($scope, $location, workspace, jolokia, metricsWatcher) {
        var log = Logger.get("Camel");
        $scope.maxSeconds = Camel.routeMetricMaxSeconds(localStorage);
        $scope.filterText = null;
        $scope.initDone = false;
        $scope.metricDivs = [];
        $scope.filterByRoute = function (div) {
            log.debug("Filter by route " + div);
            var match = Core.matchFilterIgnoreCase(div.routeId, $scope.filterText);
            if (!match) {
                // hide using CSS style
                return "display: none;";
            }
            else {
                return "";
            }
        };
        function populateRouteStatistics(response) {
            var obj = response.value;
            if (obj) {
                // turn into json javascript object which metrics watcher requires
                var json = JSON.parse(obj);
                if (!$scope.initDone) {
                    // figure out which routes we have
                    var meters = json['timers'];
                    var counter = 0;
                    if (meters != null) {
                        for (var v in meters) {
                            var key = v;
                            var lastDot = key.lastIndexOf(".");
                            var className = key.substr(0, lastDot);
                            var metricsName = key.substr(lastDot + 1);
                            var firstColon = key.indexOf(":");
                            // compute route id from the key, which is text after the 1st colon, and the last dot
                            var routeId = key.substr(firstColon + 1);
                            lastDot = routeId.lastIndexOf(".");
                            if (lastDot > 0) {
                                routeId = routeId.substr(0, lastDot);
                            }
                            var entry = meters[v];
                            var div = "timer-" + counter;
                            $scope.metricDivs.push({
                                id: div,
                                routeId: routeId
                            });
                            counter++;
                            log.info("Added timer: " + div + " (" + className + "." + metricsName + ") for route: " + routeId + " with max seconds: " + $scope.maxSeconds);
                            metricsWatcher.addTimer(div, className, metricsName, $scope.maxSeconds, routeId, "Histogram", $scope.maxSeconds * 1000);
                        }
                        // ensure web page is updated at this point, as we need the metricDivs in the HTML before we call init graphs later
                        log.info("Pre-init graphs");
                        Core.$apply($scope);
                    }
                    log.info("Init graphs");
                    metricsWatcher.initGraphs();
                }
                $scope.initDone = true;
                // update graphs
                log.debug("Updating graphs: " + json);
                metricsWatcher.updateGraphs(json);
            }
            $scope.initDone = true;
            // ensure web page is updated
            Core.$apply($scope);
        }
        // function to trigger reloading page
        $scope.onResponse = function (response) {
            loadData();
        };
        $scope.$watch('workspace.tree', function () {
            // if the JMX tree is reloaded its probably because a new MBean has been added or removed
            // so lets reload, asynchronously just in case
            setTimeout(loadData, 50);
        });
        function loadData() {
            log.info("Loading RouteMetrics data...");
            // pre-select filter if we have selected a route
            var routeId = Camel.getSelectedRouteId(workspace);
            if (routeId != null) {
                $scope.filterText = routeId;
            }
            var mbean = Camel.getSelectionCamelRouteMetrics(workspace);
            if (mbean) {
                var query = { type: 'exec', mbean: mbean, operation: 'dumpStatisticsAsJson' };
                Core.scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(populateRouteStatistics, query));
            }
            else {
                $scope.initDone = true;
                // ensure web page is updated
                Core.$apply($scope);
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.RouteController", ["$scope", "$routeParams", "$element", "$timeout", "workspace", "$location", "jolokia", "localStorage", function ($scope, $routeParams, $element, $timeout, workspace, $location, jolokia, localStorage) {
        var log = Logger.get("Camel");
        $scope.routes = [];
        $scope.routeNodes = {};
        // if we are in dashboard then $routeParams may be null
        if ($routeParams != null) {
            $scope.contextId = $routeParams["contextId"];
            $scope.routeId = Core.trimQuotes($routeParams["routeId"]);
            $scope.isJmxTab = !$routeParams["contextId"] || !$routeParams["routeId"];
        }
        $scope.camelIgnoreIdForLabel = Camel.ignoreIdForLabel(localStorage);
        $scope.camelMaximumLabelWidth = Camel.maximumLabelWidth(localStorage);
        $scope.camelShowInflightCounter = Camel.showInflightCounter(localStorage);
        var updateRoutes = _.debounce(doUpdateRoutes, 300, { trailing: true });
        // lets delay a little updating the routes to avoid timing issues where we've not yet
        // fully loaded the workspace and/or the XML model
        var delayUpdatingRoutes = 300;
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            updateRoutes();
            //$timeout(updateRoutes, delayUpdatingRoutes, false);
        });
        $scope.$watch('workspace.selection', function () {
            if ($scope.isJmxTab && workspace.moveIfViewInvalid())
                return;
            updateRoutes();
            //$timeout(updateRoutes, delayUpdatingRoutes, false);
        });
        $scope.$on('jmxTreeUpdated', function () {
            updateRoutes();
            //$timeout(updateRoutes, delayUpdatingRoutes, false);
        });
        $scope.$watch('nodeXmlNode', function () {
            if ($scope.isJmxTab && workspace.moveIfViewInvalid())
                return;
            updateRoutes();
            //$timeout(updateRoutes, delayUpdatingRoutes, false);
        });
        function doUpdateRoutes() {
            var routeXmlNode = null;
            if (!$scope.ignoreRouteXmlNode) {
                routeXmlNode = Camel.getSelectedRouteNode(workspace);
                if (!routeXmlNode) {
                    routeXmlNode = $scope.nodeXmlNode;
                }
                if (routeXmlNode && routeXmlNode.localName !== "route") {
                    var wrapper = document.createElement("route");
                    wrapper.appendChild(routeXmlNode.cloneNode(true));
                    routeXmlNode = wrapper;
                }
            }
            $scope.mbean = Camel.getSelectionCamelContextMBean(workspace);
            if (!$scope.mbean && $scope.contextId) {
                $scope.mbean = Camel.getCamelContextMBean(workspace, $scope.contextId);
            }
            if (routeXmlNode) {
                // lets show the remaining parts of the diagram of this route node
                $scope.nodes = {};
                var nodes = [];
                var links = [];
                $scope.processorTree = Camel.camelProcessorMBeansById(workspace);
                Camel.addRouteXmlChildren($scope, routeXmlNode, nodes, links, null, 0, 0);
                showGraph(nodes, links);
            }
            else if ($scope.mbean) {
                jolokia.request({ type: 'exec', mbean: $scope.mbean, operation: 'dumpRoutesAsXml()' }, Core.onSuccess(populateTable));
            }
            else {
                log.info("No camel context bean! Selection: " + workspace.selection);
            }
        }
        var populateTable = function (response) {
            var data = response.value;
            // routes is the xml data of the routes
            $scope.routes = data;
            // nodes and routeNodes is the GUI nodes for the processors and routes shown in the diagram
            $scope.nodes = {};
            $scope.routeNodes = {};
            var nodes = [];
            var links = [];
            var selectedRouteId = $scope.routeId;
            if (!selectedRouteId) {
                selectedRouteId = Camel.getSelectedRouteId(workspace);
            }
            if (data) {
                var doc = $.parseXML(data);
                $scope.processorTree = Camel.camelProcessorMBeansById(workspace);
                Camel.loadRouteXmlNodes($scope, doc, selectedRouteId, nodes, links, getWidth());
                showGraph(nodes, links);
            }
            else {
                console.log("No data from route XML!");
            }
            Core.$apply($scope);
        };
        var postfix = " selected";
        function isSelected(node) {
            if (node) {
                var className = node.getAttribute("class");
                return className && className.endsWith(postfix);
            }
            return false;
        }
        function setSelected(node, flag) {
            var answer = false;
            if (node) {
                var className = node.getAttribute("class");
                var selected = className && className.endsWith(postfix);
                if (selected) {
                    className = className.substring(0, className.length - postfix.length);
                }
                else {
                    if (!flag) {
                        // no need to change!
                        return answer;
                    }
                    className = className + postfix;
                    answer = true;
                }
                node.setAttribute("class", className);
            }
            return answer;
        }
        var onClickGraphNode = function (node) {
            // stop marking the node as selected which it does by default
            log.debug("Clicked on Camel Route Diagram node: " + node.cid);
            $location.path('/camel/properties').search({ "main-tab": "camel", "sub-tab": "camel-route-properties", "nid": node.cid });
        };
        function showGraph(nodes, links) {
            var canvasDiv = $element;
            var width = getWidth();
            var height = getHeight();
            var svg = canvasDiv.children("svg")[0];
            // do not allow clicking on node to show properties if debugging or tracing as that is for selecting the node instead
            var onClick;
            var path = $location.path();
            if (path.startsWith("/camel/debugRoute") || path.startsWith("/camel/traceRoute")) {
                onClick = null;
            }
            else {
                onClick = onClickGraphNode;
            }
            $scope.graphData = Core.dagreLayoutGraph(nodes, links, width, height, svg, false, onClick);
            var gNodes = canvasDiv.find("g.node");
            gNodes.click(function () {
                var selected = isSelected(this);
                // lets clear all selected flags
                gNodes.each(function (idx, element) {
                    setSelected(element, false);
                });
                var cid = null;
                if (!selected) {
                    cid = this.getAttribute("data-cid");
                    setSelected(this, true);
                }
                $scope.$emit("camel.diagram.selectedNodeId", cid);
                Core.$apply($scope);
            });
            if ($scope.mbean) {
                Core.register(jolokia, $scope, {
                    type: 'exec',
                    mbean: $scope.mbean,
                    operation: 'dumpRoutesStatsAsXml',
                    arguments: [true, true]
                }, Core.onSuccess(statsCallback, { silent: true, error: false }));
            }
            $scope.$emit("camel.diagram.layoutComplete");
            return width;
        }
        function getWidth() {
            var canvasDiv = $element;
            return canvasDiv.width();
        }
        function getHeight() {
            var canvasDiv = $element;
            return Camel.getCanvasHeight(canvasDiv);
        }
        function statsCallback(response) {
            var data = response.value;
            if (data) {
                var doc = $.parseXML(data);
                var allStats = $(doc).find("routeStat");
                allStats.each(function (idx, stat) {
                    addTooltipToNode(true, stat);
                });
                var allStats = $(doc).find("processorStat");
                allStats.each(function (idx, stat) {
                    addTooltipToNode(false, stat);
                });
                // now lets try update the graph
                Core.dagreUpdateGraphData($scope.graphData);
            }
            function addTooltipToNode(isRoute, stat) {
                // we could have used a function instead of the boolean isRoute parameter (but sometimes that is easier)
                var id = stat.getAttribute("id");
                var completed = stat.getAttribute("exchangesCompleted");
                var inflight = stat.hasAttribute("exchangesInflight") ? stat.getAttribute("exchangesInflight") : 0;
                var tooltip = "";
                if (id && completed) {
                    var container = isRoute ? $scope.routeNodes : $scope.nodes;
                    var node = container[id];
                    if (!node) {
                        angular.forEach(container, function (value, key) {
                            if (!node && id === value.elementId) {
                                node = value;
                            }
                        });
                    }
                    if (node) {
                        var total = 0 + parseInt(completed);
                        var failed = stat.getAttribute("exchangesFailed");
                        if (failed) {
                            total += parseInt(failed);
                        }
                        var last = stat.getAttribute("lastProcessingTime");
                        var mean = stat.getAttribute("meanProcessingTime");
                        var min = stat.getAttribute("minProcessingTime");
                        var max = stat.getAttribute("maxProcessingTime");
                        tooltip = "totoal: " + total + "\ninflight:" + inflight + "\nlast: " + last + " (ms)\nmean: " + mean + " (ms)\nmin: " + min + " (ms)\nmax: " + max + " (ms)";
                        node["counter"] = total;
                        if ($scope.camelShowInflightCounter) {
                            node["inflight"] = inflight;
                        }
                        var labelSummary = node["labelSummary"];
                        if (labelSummary) {
                            tooltip = labelSummary + "\n\n" + tooltip;
                        }
                        node["tooltip"] = tooltip;
                    }
                    else {
                    }
                }
            }
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    var DELIVERY_PERSISTENT = "2";
    Camel._module.controller("Camel.SendMessageController", ["$route", "$scope", "$element", "$timeout", "workspace", "jolokia", "localStorage", "$location", "activeMQMessage", "PreferencesLastPath", function ($route, $scope, $element, $timeout, workspace, jolokia, localStorage, $location, activeMQMessage, PreferencesLastPath) {
        var log = Logger.get("Camel");
        $scope.noCredentials = false;
        $scope.container = {};
        $scope.message = "\n\n\n\n";
        $scope.headers = [];
        // bind model values to search params...
        Core.bindModelToSearchParam($scope, $location, "tab", "subtab", "compose");
        Core.bindModelToSearchParam($scope, $location, "searchText", "q", "");
        // only reload the page if certain search parameters change
        Core.reloadWhenParametersChange($route, $scope, $location);
        $scope.checkCredentials = function () {
            $scope.noCredentials = (Core.isBlank(localStorage['activemqUserName']) || Core.isBlank(localStorage['activemqPassword']));
        };
        if ($location.path().has('activemq')) {
            $scope.localStorage = localStorage;
            $scope.$watch('localStorage.activemqUserName', $scope.checkCredentials);
            $scope.$watch('localStorage.activemqPassword', $scope.checkCredentials);
            //prefill if it's a resent
            if (activeMQMessage.message !== null) {
                $scope.message = activeMQMessage.message.bodyText;
                if (activeMQMessage.message.PropertiesText !== null) {
                    for (var p in activeMQMessage.message.StringProperties) {
                        $scope.headers.push({ name: p, value: activeMQMessage.message.StringProperties[p] });
                    }
                }
            }
            // always reset at the end
            activeMQMessage.message = null;
        }
        $scope.openPrefs = function () {
            PreferencesLastPath.lastPath = $location.path();
            PreferencesLastPath.lastSearch = $location.search();
            $location.path('/preferences').search({ 'pref': 'ActiveMQ' });
        };
        var LANGUAGE_FORMAT_PREFERENCE = "defaultLanguageFormat";
        var sourceFormat = workspace.getLocalStorage(LANGUAGE_FORMAT_PREFERENCE) || "javascript";
        // TODO Remove this if possible
        $scope.codeMirror = undefined;
        var options = {
            mode: {
                name: sourceFormat
            },
            // Quick hack to get the codeMirror instance.
            onChange: function (codeMirror) {
                if (!$scope.codeMirror) {
                    $scope.codeMirror = codeMirror;
                }
            }
        };
        $scope.codeMirrorOptions = CodeEditor.createEditorSettings(options);
        $scope.addHeader = function () {
            $scope.headers.push({ name: "", value: "" });
            // lets set the focus to the last header
            if ($element) {
                $timeout(function () {
                    var lastHeader = $element.find("input.headerName").last();
                    lastHeader.focus();
                }, 100);
            }
        };
        $scope.removeHeader = function (header) {
            $scope.headers = $scope.headers.remove(header);
        };
        $scope.defaultHeaderNames = function () {
            var answer = [];
            function addHeaderSchema(schema) {
                angular.forEach(schema.definitions.headers.properties, function (value, name) {
                    answer.push(name);
                });
            }
            if (isJmsEndpoint()) {
                addHeaderSchema(Camel.jmsHeaderSchema);
            }
            if (isCamelEndpoint()) {
                addHeaderSchema(Camel.camelHeaderSchema);
            }
            return answer;
        };
        $scope.$watch('workspace.selection', function () {
            // if the current JMX selection does not support sending messages then lets redirect the page
            workspace.moveIfViewInvalid();
        });
        /* save the sourceFormat in preferences for later
         * Note, this would be controller specific preferences and not the global, overriding, preferences */
        // TODO Use ng-selected="changeSourceFormat()" - Although it seemed to fire multiple times..
        $scope.$watch('codeMirrorOptions.mode.name', function (newValue, oldValue) {
            workspace.setLocalStorage(LANGUAGE_FORMAT_PREFERENCE, newValue);
        });
        var sendWorked = function () {
            $scope.message = "";
            Core.notification("success", "Message sent!");
        };
        $scope.autoFormat = function () {
            setTimeout(function () {
                CodeEditor.autoFormatEditor($scope.codeMirror);
            }, 50);
        };
        $scope.sendMessage = function () {
            var body = $scope.message;
            doSendMessage(body, sendWorked);
        };
        function doSendMessage(body, onSendCompleteFn) {
            var selection = workspace.selection;
            if (selection) {
                var mbean = selection.objectName;
                if (mbean) {
                    var headers = null;
                    if ($scope.headers.length) {
                        headers = {};
                        angular.forEach($scope.headers, function (object) {
                            var key = object.name;
                            if (key) {
                                headers[key] = object.value;
                            }
                        });
                        log.info("About to send headers: " + JSON.stringify(headers));
                    }
                    var callback = Core.onSuccess(onSendCompleteFn);
                    if (selection.domain === "org.apache.camel") {
                        var target = Camel.getContextAndTargetEndpoint(workspace);
                        var uri = target['uri'];
                        mbean = target['mbean'];
                        if (mbean && uri) {
                            // if we are running Camel 2.14 we can check if its possible to send to the endpoint
                            var ok = true;
                            if (Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)) {
                                var reply = jolokia.execute(mbean, "canSendToEndpoint(java.lang.String)", uri);
                                if (!reply) {
                                    Core.notification("warning", "Camel does not support sending to this endpoint.");
                                    ok = false;
                                }
                            }
                            if (ok) {
                                if (headers) {
                                    jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, callback);
                                }
                                else {
                                    jolokia.execute(mbean, "sendStringBody(java.lang.String, java.lang.String)", uri, body, callback);
                                }
                            }
                        }
                        else {
                            if (!mbean) {
                                Core.notification("error", "Could not find CamelContext MBean!");
                            }
                            else {
                                Core.notification("error", "Failed to determine endpoint name!");
                            }
                            log.debug("Parsed context and endpoint: ", target);
                        }
                    }
                    else {
                        var user = localStorage["activemqUserName"];
                        var pwd = localStorage["activemqPassword"];
                        // AMQ is sending non persistent by default, so make sure we tell to sent persistent by default
                        if (!headers) {
                            headers = {};
                        }
                        if (!headers["JMSDeliveryMode"]) {
                            headers["JMSDeliveryMode"] = DELIVERY_PERSISTENT;
                        }
                        jolokia.execute(mbean, "sendTextMessage(java.util.Map, java.lang.String, java.lang.String, java.lang.String)", headers, body, user, pwd, callback);
                    }
                }
            }
        }
        function isCamelEndpoint() {
            // TODO check for the camel or if its an activemq endpoint
            return true;
        }
        function isJmsEndpoint() {
            // TODO check for the jms/activemq endpoint in camel or if its an activemq endpoint
            return true;
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.SourceController", ["$scope", "workspace", function ($scope, workspace) {
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateRoutes, 50);
        });
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid())
                return;
            updateRoutes();
        });
        $scope.mode = 'xml';
        function getSource(routeXmlNode) {
            function removeCrappyHeaders(idx, e) {
                var answer = e.getAttribute("customId");
                if (e.nodeName === 'route') {
                    // always keep id on <route> element
                    answer = "true";
                }
                if (!answer || answer !== "true") {
                    e.removeAttribute("id");
                }
                // just always remove customId, _cid, and group
                e.removeAttribute("customId");
                e.removeAttribute("_cid");
                e.removeAttribute("group");
            }
            var copy = $(routeXmlNode).clone();
            copy.each(removeCrappyHeaders);
            copy.find("*").each(removeCrappyHeaders);
            var newNode = (copy && copy.length) ? copy[0] : routeXmlNode;
            return Core.xmlNodeToString(newNode);
        }
        function updateRoutes() {
            // did we select a single route
            var routeXmlNode = Camel.getSelectedRouteNode(workspace);
            if (routeXmlNode) {
                $scope.source = getSource(routeXmlNode);
                Core.$apply($scope);
            }
            else {
                // no then try to find the camel context and get all the routes code
                $scope.mbean = Camel.getSelectionCamelContextMBean(workspace);
                if (!$scope.mbean) {
                    // maybe the parent is the camel context folder (when we have selected the routes folder),
                    // then grab the object name from parent
                    var parent = Core.pathGet(workspace, ["selection", "parent"]);
                    if (parent && parent.title === "context") {
                        $scope.mbean = parent.children[0].objectName;
                    }
                }
                if ($scope.mbean) {
                    var jolokia = workspace.jolokia;
                    jolokia.request({ type: 'exec', mbean: $scope.mbean, operation: 'dumpRoutesAsXml()' }, Core.onSuccess(populateTable));
                }
            }
        }
        var populateTable = function (response) {
            var data = response.value;
            var selectedRouteId = Camel.getSelectedRouteId(workspace);
            if (data && selectedRouteId) {
                var doc = $.parseXML(data);
                var routes = $(doc).find('route[id="' + selectedRouteId + '"]');
                if (routes && routes.length) {
                    var selectedRoute = routes[0];
                    // TODO turn into XML?
                    var routeXml = getSource(selectedRoute);
                    if (routeXml) {
                        data = routeXml;
                    }
                }
            }
            $scope.source = data;
            Core.$apply($scope);
        };
        var saveWorked = function () {
            Core.notification("success", "Route updated!");
            // lets clear the cached route XML so we reload the new value
            Camel.clearSelectedRouteNode(workspace);
            updateRoutes();
        };
        $scope.saveRouteXml = function () {
            var routeXml = $scope.source;
            if (routeXml) {
                var decoded = decodeURIComponent(routeXml);
                Camel.log.debug("addOrUpdateRoutesFromXml xml decoded: " + decoded);
                var jolokia = workspace.jolokia;
                var mbean = Camel.getSelectionCamelContextMBean(workspace);
                if (mbean) {
                    jolokia.execute(mbean, "addOrUpdateRoutesFromXml(java.lang.String)", decoded, Core.onSuccess(saveWorked));
                }
                else {
                    Core.notification("error", "Could not find CamelContext MBean!");
                }
            }
        };
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.TraceRouteController", ["$scope", "workspace", "jolokia", "localStorage", "tracerStatus", function ($scope, workspace, jolokia, localStorage, tracerStatus) {
        var log = Logger.get("CamelTracer");
        $scope.tracing = false;
        $scope.messages = [];
        $scope.graphView = null;
        $scope.mode = 'text';
        $scope.showMessageDetails = false;
        $scope.gridOptions = Camel.createBrowseGridOptions();
        $scope.gridOptions.selectWithCheckboxOnly = false;
        $scope.gridOptions.showSelectionCheckbox = false;
        $scope.gridOptions.multiSelect = false;
        $scope.gridOptions.afterSelectionChange = onSelectionChanged;
        $scope.gridOptions.columnDefs.push({
            field: 'toNode',
            displayName: 'To Node'
        });
        $scope.startTracing = function () {
            log.info("Start tracing");
            setTracing(true);
        };
        $scope.stopTracing = function () {
            log.info("Stop tracing");
            setTracing(false);
        };
        $scope.clear = function () {
            log.debug("Clear messages");
            tracerStatus.messages = [];
            $scope.messages = [];
            Core.$apply($scope);
        };
        $scope.$watch('workspace.selection', function () {
            if (workspace.moveIfViewInvalid()) {
                return;
            }
            $scope.messages = tracerStatus.messages;
            reloadTracingFlag();
        });
        // TODO can we share these 2 methods from activemq browse / camel browse / came trace?
        $scope.openMessageDialog = function (message) {
            ActiveMQ.selectCurrentMessage(message, "id", $scope);
            if ($scope.row) {
                var body = $scope.row.body;
                $scope.mode = angular.isString(body) ? CodeEditor.detectTextFormat(body) : "text";
                // it may detect wrong as javascript, so use text instead
                if ("javascript" == $scope.mode) {
                    $scope.mode = "text";
                }
                $scope.showMessageDetails = true;
            }
            else {
                $scope.showMessageDetails = false;
            }
            Core.$apply($scope);
        };
        ActiveMQ.decorate($scope, onSelectionChanged);
        function reloadTracingFlag() {
            $scope.tracing = false;
            // clear any previous polls
            if (tracerStatus.jhandle != null) {
                log.debug("Unregistering jolokia handle");
                jolokia.unregister(tracerStatus.jhandle);
                tracerStatus.jhandle = null;
            }
            var mbean = Camel.getSelectionCamelTraceMBean(workspace);
            if (mbean) {
                $scope.tracing = jolokia.getAttribute(mbean, "Enabled", Core.onSuccess(null));
                if ($scope.tracing) {
                    var traceMBean = mbean;
                    if (traceMBean) {
                        // register callback for doing live update of tracing
                        if (tracerStatus.jhandle === null) {
                            log.debug("Registering jolokia handle");
                            tracerStatus.jhandle = jolokia.register(populateRouteMessages, {
                                type: 'exec',
                                mbean: traceMBean,
                                operation: 'dumpAllTracedMessagesAsXml()',
                                ignoreErrors: true,
                                arguments: []
                            });
                        }
                    }
                    $scope.graphView = "plugins/camel/html/routes.html";
                }
                else {
                    tracerStatus.messages = [];
                    $scope.messages = [];
                    $scope.graphView = null;
                    $scope.showMessageDetails = false;
                }
            }
        }
        function populateRouteMessages(response) {
            log.debug("Populating response " + response);
            // filter messages due CAMEL-7045 but in camel-core
            // see https://github.com/hawtio/hawtio/issues/292
            var selectedRouteId = Camel.getSelectedRouteId(workspace);
            var xml = response.value;
            if (angular.isString(xml)) {
                // lets parse the XML DOM here...
                var doc = $.parseXML(xml);
                var allMessages = $(doc).find("fabricTracerEventMessage");
                if (!allMessages || !allMessages.length) {
                    // lets try find another element name
                    allMessages = $(doc).find("backlogTracerEventMessage");
                }
                allMessages.each(function (idx, message) {
                    var routeId = $(message).find("routeId").text();
                    if (routeId === selectedRouteId) {
                        var messageData = Camel.createMessageFromXml(message);
                        var toNode = $(message).find("toNode").text();
                        if (toNode) {
                            messageData["toNode"] = toNode;
                        }
                        // attach the open dialog to make it work
                        messageData.openMessageDialog = $scope.openMessageDialog;
                        log.debug("Adding new message to trace table with id " + messageData["id"]);
                        $scope.messages.push(messageData);
                    }
                });
                // keep state of the traced messages on tracerStatus
                tracerStatus.messages = $scope.messages;
                Core.$apply($scope);
            }
        }
        function onSelectionChanged() {
            angular.forEach($scope.gridOptions.selectedItems, function (selected) {
                if (selected) {
                    var toNode = selected["toNode"];
                    if (toNode) {
                        // lets highlight the node in the diagram
                        var nodes = d3.select("svg").selectAll("g .node");
                        Camel.highlightSelectedNode(nodes, toNode);
                    }
                }
            });
        }
        function tracingChanged(response) {
            reloadTracingFlag();
            Core.$apply($scope);
        }
        function setTracing(flag) {
            var mbean = Camel.getSelectionCamelTraceMBean(workspace);
            if (mbean) {
                // set max only supported on BacklogTracer
                // (the old fabric tracer does not support max length)
                if (mbean.toString().endsWith("BacklogTracer")) {
                    var max = Camel.maximumTraceOrDebugBodyLength(localStorage);
                    var streams = Camel.traceOrDebugIncludeStreams(localStorage);
                    jolokia.setAttribute(mbean, "BodyMaxChars", max);
                    jolokia.setAttribute(mbean, "BodyIncludeStreams", streams);
                    jolokia.setAttribute(mbean, "BodyIncludeFiles", streams);
                }
                jolokia.setAttribute(mbean, "Enabled", flag, Core.onSuccess(tracingChanged));
            }
        }
        log.info("Re-activating tracer with " + tracerStatus.messages.length + " existing messages");
        $scope.messages = tracerStatus.messages;
        $scope.tracing = tracerStatus.jhandle != null;
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.TreeHeaderController", ["$scope", "$location", function ($scope, $location) {
        $scope.contextFilterText = '';
        $scope.$watch('contextFilterText', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.$emit("camel-contextFilterText", newValue);
            }
        });
        $scope.expandAll = function () {
            Tree.expandAll("#cameltree");
        };
        $scope.contractAll = function () {
            Tree.contractAll("#cameltree");
        };
    }]);
    Camel._module.controller("Camel.TreeController", ["$scope", "$location", "$timeout", "workspace", "$rootScope", function ($scope, $location, $timeout, workspace, $rootScope) {
        $scope.contextFilterText = $location.search()["cq"];
        $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            $timeout(updateSelectionFromURL, 50, false);
        });
        $scope.$watch('workspace.tree', function () {
            reloadFunction();
        });
        // TODO - how the tree is initialized is different, how this filter works needs to be revisited
        /*
        var reloadOnContextFilterThrottled = _.debounce(() => {
          reloadFunction(() => {
            $("#camelContextIdFilter").focus();
            Core.$apply($scope);
          });
        }, 100, { trailing: true } );
    
        $scope.$watch('contextFilterText', function () {
          if ($scope.contextFilterText != $scope.lastContextFilterText) {
            $timeout(reloadOnContextFilterThrottled, 250, false);
          }
        });
    
        $rootScope.$on('camel-contextFilterText', (event, value) => {
          $scope.contextFilterText = value;
        });
        */
        $scope.$on('jmxTreeUpdated', function () {
            reloadFunction();
        });
        function reloadFunction(afterSelectionFn) {
            if (afterSelectionFn === void 0) { afterSelectionFn = null; }
            $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);
            var children = [];
            var domainName = Camel.jmxDomain;
            // lets pull out each context
            var tree = workspace.tree;
            if (tree) {
                var rootFolder = tree.findDescendant(function (node) {
                    return node.id === 'camelContexts';
                });
                if (rootFolder) {
                    $timeout(function () {
                        var treeElement = $("#cameltree");
                        Jmx.enableTree($scope, $location, workspace, treeElement, [rootFolder], true);
                        // lets do this asynchronously to avoid Error: $digest already in progress
                        updateSelectionFromURL();
                        if (angular.isFunction(afterSelectionFn)) {
                            afterSelectionFn();
                        }
                    }, 10);
                }
            }
        }
        function updateSelectionFromURL() {
            Jmx.updateTreeSelectionFromURLAndAutoSelect($location, $("#cameltree"), function (first) {
                // use function to auto select first Camel context routes if there is only one Camel context
                var contexts = first.getChildren();
                if (contexts && contexts.length === 1) {
                    first = contexts[0];
                    first.expand(true);
                    var children = first.getChildren();
                    if (children && children.length) {
                        var routes = children[0];
                        if (routes.data.typeName === 'routes') {
                            first = routes;
                            //Core.$apply($scope);
                            return first;
                        }
                    }
                }
                //Core.$apply($scope);
                return null;
            }, true);
            $scope.fullScreenViewLink = Camel.linkToFullScreenView(workspace);
        }
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>
var Camel;
(function (Camel) {
    Camel._module.controller("Camel.TypeConverterController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.data = [];
        $scope.selectedMBean = null;
        $scope.mbeanAttributes = {};
        var columnDefs = [
            {
                field: 'from',
                displayName: 'From',
                cellFilter: null,
                width: "*",
                resizable: true
            },
            {
                field: 'to',
                displayName: 'To',
                cellFilter: null,
                width: "*",
                resizable: true
            }
        ];
        $scope.gridOptions = {
            data: 'data',
            displayFooter: true,
            displaySelectionCheckbox: false,
            canSelectRows: false,
            enableSorting: true,
            columnDefs: columnDefs,
            selectedItems: [],
            filterOptions: {
                filterText: ''
            }
        };
        function onAttributes(response) {
            var obj = response.value;
            if (obj) {
                $scope.mbeanAttributes = obj;
                // ensure web page is updated
                Core.$apply($scope);
            }
        }
        function onConverters(response) {
            var obj = response.value;
            if (obj) {
                // the JMX tabular data has 2 indexes so we need to dive 2 levels down to grab the data
                var arr = [];
                for (var key in obj) {
                    var values = obj[key];
                    for (var v in values) {
                        arr.push({ from: key, to: v });
                    }
                }
                arr = arr.sortBy("from");
                $scope.data = arr;
                // okay we have the data then set the selected mbean which allows UI to display data
                $scope.selectedMBean = response.request.mbean;
                // ensure web page is updated
                Core.$apply($scope);
            }
        }
        $scope.renderIcon = function (state) {
            return Camel.iconClass(state);
        };
        $scope.disableStatistics = function () {
            if ($scope.selectedMBean) {
                jolokia.setAttribute($scope.selectedMBean, "StatisticsEnabled", false);
            }
        };
        $scope.enableStatistics = function () {
            if ($scope.selectedMBean) {
                jolokia.setAttribute($scope.selectedMBean, "StatisticsEnabled", true);
            }
        };
        $scope.resetStatistics = function () {
            if ($scope.selectedMBean) {
                jolokia.request({ type: 'exec', mbean: $scope.selectedMBean, operation: 'resetTypeConversionCounters' }, Core.onSuccess(null, { silent: true }));
            }
        };
        function loadConverters() {
            console.log("Loading TypeConverter data...");
            var mbean = Camel.getSelectionCamelTypeConverter(workspace);
            if (mbean) {
                // grab attributes in real time
                var query = { type: "read", mbean: mbean, attribute: ["AttemptCounter", "FailedCounter", "HitCounter", "MissCounter", "NumberOfTypeConverters", "StatisticsEnabled"] };
                jolokia.request(query, Core.onSuccess(onAttributes));
                Core.scopeStoreJolokiaHandle($scope, jolokia, jolokia.register(onAttributes, query));
                // and list of converters
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'listTypeConverters' }, Core.onSuccess(onConverters));
            }
        }
        // load converters
        loadConverters();
    }]);
})(Camel || (Camel = {}));

/// <reference path="../../includes.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf.log = Logger.get("Karaf");
    function setSelect(selection, group) {
        if (!angular.isDefined(selection)) {
            return group[0];
        }
        var answer = group.findIndex(function (item) {
            return item.id === selection.id;
        });
        if (answer !== -1) {
            return group[answer];
        }
        else {
            return group[0];
        }
    }
    Karaf.setSelect = setSelect;
    function installRepository(workspace, jolokia, uri, success, error) {
        Karaf.log.info("installing URI: ", uri);
        jolokia.request({
            type: 'exec',
            mbean: getSelectionFeaturesMBean(workspace),
            operation: 'addRepository(java.lang.String)',
            arguments: [uri]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.installRepository = installRepository;
    function uninstallRepository(workspace, jolokia, uri, success, error) {
        Karaf.log.info("uninstalling URI: ", uri);
        jolokia.request({
            type: 'exec',
            mbean: getSelectionFeaturesMBean(workspace),
            operation: 'removeRepository(java.lang.String)',
            arguments: [uri]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.uninstallRepository = uninstallRepository;
    function installFeature(workspace, jolokia, feature, version, success, error) {
        jolokia.request({
            type: 'exec',
            mbean: getSelectionFeaturesMBean(workspace),
            operation: 'installFeature(java.lang.String, java.lang.String)',
            arguments: [feature, version]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.installFeature = installFeature;
    function uninstallFeature(workspace, jolokia, feature, version, success, error) {
        jolokia.request({
            type: 'exec',
            mbean: getSelectionFeaturesMBean(workspace),
            operation: 'uninstallFeature(java.lang.String, java.lang.String)',
            arguments: [feature, version]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.uninstallFeature = uninstallFeature;
    // TODO move to core?
    function toCollection(values) {
        var collection = values;
        if (!angular.isArray(values)) {
            collection = [values];
        }
        return collection;
    }
    Karaf.toCollection = toCollection;
    function featureLinks(workspace, name, version) {
        return "<a href='" + Core.url("#/karaf/feature/" + name + "/" + version + workspace.hash()) + "'>" + version + "</a>";
    }
    Karaf.featureLinks = featureLinks;
    function extractFeature(attributes, name, version) {
        var features = [];
        var repos = [];
        populateFeaturesAndRepos(attributes, features, repos);
        return features.find(function (feature) {
            return feature.Name == name && feature.Version == version;
        });
        /*
        var f = {};
        angular.forEach(attributes["Features"], (feature) => {
          angular.forEach(feature, (entry) => {
            if (entry["Name"] === name && entry["Version"] === version) {
              var deps = [];
              populateDependencies(attributes, entry["Dependencies"], deps);
              f["Name"] = entry["Name"];
              f["Version"] = entry["Version"];
              f["Bundles"] = entry["Bundles"];
              f["Dependencies"] = deps;
              f["Installed"] = entry["Installed"];
              f["Configurations"] = entry["Configurations"];
              f["Configuration Files"] = entry["Configuration Files"];
              f["Files"] = entry["Configuration Files"];
            }
          });
        });
        return f;
        */
    }
    Karaf.extractFeature = extractFeature;
    var platformBundlePatterns = [
        "^org.apache.aries",
        "^org.apache.karaf",
        "^activemq-karaf",
        "^org.apache.commons",
        "^org.apache.felix",
        "^io.fabric8",
        "^io.fabric8.fab",
        "^io.fabric8.insight",
        "^io.fabric8.mq",
        "^io.fabric8.patch",
        "^io.fabric8.runtime",
        "^io.fabric8.security",
        "^org.apache.geronimo.specs",
        "^org.apache.servicemix.bundles",
        "^org.objectweb.asm",
        "^io.hawt",
        "^javax.mail",
        "^javax",
        "^org.jvnet",
        "^org.mvel2",
        "^org.apache.mina.core",
        "^org.apache.sshd.core",
        "^org.apache.neethi",
        "^org.apache.servicemix.specs",
        "^org.apache.xbean",
        "^org.apache.santuario.xmlsec",
        "^biz.aQute.bndlib",
        "^groovy-all",
        "^com.google.guava",
        "jackson-\\w+-asl",
        "^com.fasterxml.jackson",
        "^org.ops4j",
        "^org.springframework",
        "^bcprov$",
        "^jline$",
        "scala-library$",
        "^org.scala-lang",
        "^stax2-api$",
        "^woodstox-core-asl",
        "^org.jboss.amq.mq-fabric",
        "^gravia-",
        "^joda-time$",
        "^org.apache.ws",
        "-commands$",
        "patch.patch",
        "org.fusesource.insight",
        "activeio-core",
        "activemq-osgi",
        "^org.eclipse.jetty",
        "org.codehaus.jettison.jettison",
        "org.jledit.core",
        "org.fusesource.jansi",
        "org.eclipse.equinox.region"
    ];
    var platformBundleRegex = new RegExp(platformBundlePatterns.join('|'));
    var camelBundlePatterns = ["^org.apache.camel", "camel-karaf-commands$", "activemq-camel$"];
    var camelBundleRegex = new RegExp(camelBundlePatterns.join('|'));
    var cxfBundlePatterns = ["^org.apache.cxf"];
    var cxfBundleRegex = new RegExp(cxfBundlePatterns.join('|'));
    var activemqBundlePatterns = ["^org.apache.activemq", "activemq-camel$"];
    var activemqBundleRegex = new RegExp(activemqBundlePatterns.join('|'));
    function isPlatformBundle(symbolicName) {
        return platformBundleRegex.test(symbolicName);
    }
    Karaf.isPlatformBundle = isPlatformBundle;
    function isActiveMQBundle(symbolicName) {
        return activemqBundleRegex.test(symbolicName);
    }
    Karaf.isActiveMQBundle = isActiveMQBundle;
    function isCamelBundle(symbolicName) {
        return camelBundleRegex.test(symbolicName);
    }
    Karaf.isCamelBundle = isCamelBundle;
    function isCxfBundle(symbolicName) {
        return cxfBundleRegex.test(symbolicName);
    }
    Karaf.isCxfBundle = isCxfBundle;
    function populateFeaturesAndRepos(attributes, features, repositories) {
        var fullFeatures = attributes["Features"];
        angular.forEach(attributes["Repositories"], function (repo) {
            repositories.push({
                id: repo["Name"],
                uri: repo["Uri"]
            });
            if (!fullFeatures) {
                return;
            }
            angular.forEach(repo["Features"], function (feature) {
                angular.forEach(feature, function (entry) {
                    if (fullFeatures[entry['Name']] !== undefined) {
                        var f = _.cloneDeep(fullFeatures[entry['Name']][entry['Version']]);
                        f["Id"] = entry["Name"] + "/" + entry["Version"];
                        f["RepositoryName"] = repo["Name"];
                        f["RepositoryURI"] = repo["Uri"];
                        features.push(f);
                    }
                });
            });
        });
    }
    Karaf.populateFeaturesAndRepos = populateFeaturesAndRepos;
    function createScrComponentsView(workspace, jolokia, components) {
        var result = [];
        angular.forEach(components, function (component) {
            result.push({
                Name: component,
                State: getComponentStateDescription(getComponentState(workspace, jolokia, component))
            });
        });
        return result;
    }
    Karaf.createScrComponentsView = createScrComponentsView;
    function getComponentStateDescription(state) {
        switch (state) {
            case 2:
                return "Enabled";
            case 4:
                return "Unsatisfied";
            case 8:
                return "Activating";
            case 16:
                return "Active";
            case 32:
                return "Registered";
            case 64:
                return "Factory";
            case 128:
                return "Deactivating";
            case 256:
                return "Destroying";
            case 1024:
                return "Disabling";
            case 2048:
                return "Disposing";
        }
        return "Unknown";
    }
    Karaf.getComponentStateDescription = getComponentStateDescription;
    ;
    function getAllComponents(workspace, jolokia) {
        var scrMBean = getSelectionScrMBean(workspace);
        var response = jolokia.request({
            type: 'read',
            mbean: scrMBean,
            arguments: []
        });
        //Check if the MBean provides the Components attribute.
        if (!('Components' in response.value)) {
            response = jolokia.request({
                type: 'exec',
                mbean: scrMBean,
                operation: 'listComponents()'
            });
            return createScrComponentsView(workspace, jolokia, response.value);
        }
        return response.value['Components'].values;
    }
    Karaf.getAllComponents = getAllComponents;
    function getComponentByName(workspace, jolokia, componentName) {
        var components = getAllComponents(workspace, jolokia);
        return components.find(function (c) {
            return c.Name == componentName;
        });
    }
    Karaf.getComponentByName = getComponentByName;
    function isComponentActive(workspace, jolokia, component) {
        var response = jolokia.request({
            type: 'exec',
            mbean: getSelectionScrMBean(workspace),
            operation: 'isComponentActive(java.lang.String)',
            arguments: [component]
        });
        return response.value;
    }
    Karaf.isComponentActive = isComponentActive;
    function getComponentState(workspace, jolokia, component) {
        var response = jolokia.request({
            type: 'exec',
            mbean: getSelectionScrMBean(workspace),
            operation: 'componentState(java.lang.String)',
            arguments: [component]
        });
        return response.value;
    }
    Karaf.getComponentState = getComponentState;
    function activateComponent(workspace, jolokia, component, success, error) {
        jolokia.request({
            type: 'exec',
            mbean: getSelectionScrMBean(workspace),
            operation: 'activateComponent(java.lang.String)',
            arguments: [component]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.activateComponent = activateComponent;
    function deactivateComponent(workspace, jolokia, component, success, error) {
        jolokia.request({
            type: 'exec',
            mbean: getSelectionScrMBean(workspace),
            operation: 'deactiveateComponent(java.lang.String)',
            arguments: [component]
        }, Core.onSuccess(success, { error: error }));
    }
    Karaf.deactivateComponent = deactivateComponent;
    function populateDependencies(attributes, dependencies, features) {
        angular.forEach(dependencies, function (feature) {
            angular.forEach(feature, function (entry) {
                var enhancedFeature = extractFeature(attributes, entry["Name"], entry["Version"]);
                enhancedFeature["id"] = entry["Name"] + "/" + entry["Version"];
                //enhancedFeature["repository"] = repo["Name"];
                features.push(enhancedFeature);
            });
        });
    }
    Karaf.populateDependencies = populateDependencies;
    function getSelectionFeaturesMBean(workspace) {
        if (workspace) {
            var featuresStuff = workspace.mbeanTypesToDomain["features"] || {};
            var karaf = featuresStuff["org.apache.karaf"] || {};
            var mbean = karaf.objectName;
            if (mbean) {
                return mbean;
            }
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("org.apache.karaf", "features");
            if (!folder) {
                // sometimes the features mbean is inside the 'root' folder
                folder = workspace.tree.navigate("org.apache.karaf");
                if (folder) {
                    var children = folder.children;
                    folder = null;
                    angular.forEach(children, function (child) {
                        if (!folder) {
                            folder = child.navigate("features");
                        }
                    });
                }
            }
            if (folder) {
                var children = folder.children;
                if (children) {
                    var node = children[0];
                    if (node) {
                        return node.objectName;
                    }
                }
                return folder.objectName;
            }
        }
        return null;
    }
    Karaf.getSelectionFeaturesMBean = getSelectionFeaturesMBean;
    function getSelectionScrMBean(workspace) {
        if (workspace) {
            var scrStuff = workspace.mbeanTypesToDomain["scr"] || {};
            var karaf = scrStuff["org.apache.karaf"] || {};
            var mbean = karaf.objectName;
            if (mbean) {
                return mbean;
            }
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("org.apache.karaf", "scr");
            if (!folder) {
                // sometimes the features mbean is inside the 'root' folder
                folder = workspace.tree.navigate("org.apache.karaf");
                if (folder) {
                    var children = folder.children;
                    folder = null;
                    angular.forEach(children, function (child) {
                        if (!folder) {
                            folder = child.navigate("scr");
                        }
                    });
                }
            }
            if (folder) {
                var children = folder.children;
                if (children) {
                    var node = children[0];
                    if (node) {
                        return node.objectName;
                    }
                }
                return folder.objectName;
            }
        }
        return null;
    }
    Karaf.getSelectionScrMBean = getSelectionScrMBean;
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/**
 * @module Karaf
 * @main Karaf
 */
var Karaf;
(function (Karaf) {
    var pluginName = 'karaf';
    //export var _module = angular.module(pluginName, ['bootstrap', 'ngResource', 'hawtio-core']);
    Karaf._module = angular.module(pluginName, ['ngResource', 'hawtio-core']);
    Karaf._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/osgi/server', { templateUrl: 'plugins/karaf/html/server.html' }).when('/osgi/features', { templateUrl: 'plugins/karaf/html/features.html', reloadOnSearch: false }).when('/osgi/scr-components', { templateUrl: 'plugins/karaf/html/scr-components.html' }).when('/osgi/scr-component/:name', { templateUrl: 'plugins/karaf/html/scr-component.html' }).when('/osgi/feature/:name/:version', { templateUrl: 'plugins/karaf/html/feature.html' });
    }]);
    Karaf._module.run(["workspace", "viewRegistry", "helpRegistry", function (workspace, viewRegistry, helpRegistry) {
        helpRegistry.addUserDoc('karaf', 'plugins/karaf/doc/help.md', function () {
            return workspace.treeContainsDomainAndProperties('org.apache.karaf');
        });
    }]);
    hawtioPluginLoader.addModule(pluginName);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.FeatureController", ["$scope", "jolokia", "workspace", "$routeParams", function ($scope, jolokia, workspace, $routeParams) {
        $scope.name = $routeParams.name;
        $scope.version = $routeParams.version;
        $scope.bundlesByLocation = {};
        $scope.props = "properties";
        updateTableContents();
        $scope.install = function () {
            Karaf.installFeature(workspace, jolokia, $scope.name, $scope.version, function () {
                Core.notification('success', 'Installed feature ' + $scope.name);
            }, function (response) {
                Core.notification('error', 'Failed to install feature ' + $scope.name + ' due to ' + response.error);
            });
        };
        $scope.uninstall = function () {
            Karaf.uninstallFeature(workspace, jolokia, $scope.name, $scope.version, function () {
                Core.notification('success', 'Uninstalled feature ' + $scope.name);
            }, function (response) {
                Core.notification('error', 'Failed to uninstall feature ' + $scope.name + ' due to ' + response.error);
            });
        };
        $scope.toProperties = function (elements) {
            var answer = '';
            angular.forEach(elements, function (value, name) {
                answer += value['Key'] + " = " + value['Value'] + "\n";
            });
            return answer.trim();
        };
        function populateTable(response) {
            $scope.row = Karaf.extractFeature(response.value, $scope.name, $scope.version);
            if ($scope.row) {
                addBundleDetails($scope.row);
                var dependencies = [];
                //TODO - if the version isn't set or is 0.0.0 then maybe we show the highest available?
                angular.forEach($scope.row.Dependencies, function (version, name) {
                    angular.forEach(version, function (data, version) {
                        dependencies.push({
                            Name: name,
                            Version: version
                        });
                    });
                });
                $scope.row.Dependencies = dependencies;
            }
            Core.$apply($scope);
        }
        function setBundles(response) {
            var bundleMap = {};
            Osgi.defaultBundleValues(workspace, $scope, response.values);
            angular.forEach(response.value, function (bundle) {
                var location = bundle["Location"];
                $scope.bundlesByLocation[location] = bundle;
            });
        }
        function updateTableContents() {
            var featureMbean = Karaf.getSelectionFeaturesMBean(workspace);
            var bundleMbean = Osgi.getSelectionBundleMBean(workspace);
            var jolokia = workspace.jolokia;
            if (bundleMbean) {
                setBundles(jolokia.request({ type: 'exec', mbean: bundleMbean, operation: 'listBundles()' }));
            }
            if (featureMbean) {
                jolokia.request({ type: 'read', mbean: featureMbean }, Core.onSuccess(populateTable));
            }
        }
        function addBundleDetails(feature) {
            var bundleDetails = [];
            angular.forEach(feature["Bundles"], function (bundleLocation) {
                var bundle = $scope.bundlesByLocation[bundleLocation];
                if (bundle) {
                    bundle["Installed"] = true;
                    bundleDetails.push(bundle);
                }
                else {
                    bundleDetails.push({
                        "Location": bundleLocation,
                        "Installed": false
                    });
                }
            });
            feature["BundleDetails"] = bundleDetails;
        }
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.FeaturesController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.responseJson = '';
        $scope.filter = '';
        $scope.installedFeatures = [];
        $scope.features = [];
        $scope.repositories = [];
        $scope.selectedRepositoryId = '';
        $scope.selectedRepository = {};
        $scope.newRepositoryURI = '';
        $scope.init = function () {
            var selectedRepositoryId = $location.search()['repositoryId'];
            if (selectedRepositoryId) {
                $scope.selectedRepositoryId = selectedRepositoryId;
            }
            var filter = $location.search()['filter'];
            if (filter) {
                $scope.filter = filter;
            }
        };
        $scope.init();
        $scope.$watch('selectedRepository', function (newValue, oldValue) {
            //log.debug("selectedRepository: ", $scope.selectedRepository);
            if (newValue !== oldValue) {
                if (!newValue) {
                    $scope.selectedRepositoryId = '';
                }
                else {
                    $scope.selectedRepositoryId = newValue['repository'];
                }
                $location.search('repositoryId', $scope.selectedRepositoryId);
            }
        }, true);
        $scope.$watch('filter', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $location.search('filter', newValue);
            }
        });
        var featuresMBean = Karaf.getSelectionFeaturesMBean(workspace);
        Karaf.log.debug("Features mbean: ", featuresMBean);
        if (featuresMBean) {
            Core.register(jolokia, $scope, {
                type: 'read',
                mbean: featuresMBean
            }, Core.onSuccess(render));
        }
        $scope.inSelectedRepository = function (feature) {
            if (!$scope.selectedRepository || !('repository' in $scope.selectedRepository)) {
                return "";
            }
            if (!feature || !('RepositoryName' in feature)) {
                return "";
            }
            if (feature['RepositoryName'] === $scope.selectedRepository['repository']) {
                return "in-selected-repository";
            }
            return "";
        };
        $scope.isValidRepository = function () {
            return Core.isBlank($scope.newRepositoryURI);
        };
        $scope.installRepository = function () {
            var repoURL = $scope.newRepositoryURI;
            Core.notification('info', 'Adding feature repository URL');
            Karaf.installRepository(workspace, jolokia, repoURL, function () {
                Core.notification('success', 'Added feature repository URL');
                $scope.selectedRepository = {};
                $scope.selectedRepositoryId = '';
                $scope.responseJson = null;
                $scope.triggerRefresh();
            }, function (response) {
                Karaf.log.error('Failed to add feature repository URL ', repoURL, ' due to ', response.error);
                Karaf.log.info('stack trace: ', response.stacktrace);
                Core.$apply($scope);
            });
        };
        $scope.uninstallRepository = function () {
            var repoURI = $scope.selectedRepository['uri'];
            Core.notification('info', 'Removing feature repository ' + repoURI);
            Karaf.uninstallRepository(workspace, jolokia, repoURI, function () {
                Core.notification('success', 'Removed feature repository ' + repoURI);
                $scope.responseJson = null;
                $scope.selectedRepositoryId = '';
                $scope.selectedRepository = {};
                $scope.triggerRefresh();
            }, function (response) {
                Karaf.log.error('Failed to remove feature repository ', repoURI, ' due to ', response.error);
                Karaf.log.info('stack trace: ', response.stacktrace);
                Core.$apply($scope);
            });
        };
        $scope.triggerRefresh = function () {
            jolokia.request({
                type: 'read',
                method: 'POST',
                mbean: featuresMBean
            }, Core.onSuccess(render));
        };
        $scope.install = function (feature) {
            //$('.popover').remove();
            Core.notification('info', 'Installing feature ' + feature.Name);
            Karaf.installFeature(workspace, jolokia, feature.Name, feature.Version, function () {
                Core.notification('success', 'Installed feature ' + feature.Name);
                $scope.installedFeatures.add(feature);
                $scope.responseJson = null;
                $scope.triggerRefresh();
                //Core.$apply($scope);
            }, function (response) {
                Karaf.log.error('Failed to install feature ', feature.Name, ' due to ', response.error);
                Karaf.log.info('stack trace: ', response.stacktrace);
                Core.$apply($scope);
            });
        };
        $scope.uninstall = function (feature) {
            //$('.popover').remove();
            Core.notification('info', 'Uninstalling feature ' + feature.Name);
            Karaf.uninstallFeature(workspace, jolokia, feature.Name, feature.Version, function () {
                Core.notification('success', 'Uninstalled feature ' + feature.Name);
                $scope.installedFeatures.remove(feature);
                $scope.responseJson = null;
                $scope.triggerRefresh();
                //Core.$apply($scope);
            }, function (response) {
                Karaf.log.error('Failed to uninstall feature ', feature.Name, ' due to ', response.error);
                Karaf.log.info('stack trace: ', response.stacktrace);
                Core.$apply($scope);
            });
        };
        $scope.filteredRows = ['Bundles', 'Configurations', 'Configuration Files', 'Dependencies'];
        $scope.showRow = function (key, value) {
            if ($scope.filteredRows.any(key)) {
                return false;
            }
            if (angular.isArray(value)) {
                if (value.length === 0) {
                    return false;
                }
            }
            if (angular.isString(value)) {
                if (Core.isBlank(value)) {
                    return false;
                }
            }
            if (angular.isObject(value)) {
                if (!value || angular.equals(value, {})) {
                    return false;
                }
            }
            return true;
        };
        $scope.installed = function (installed) {
            var answer = Core.parseBooleanValue(installed);
            return answer;
        };
        $scope.showValue = function (value) {
            if (angular.isArray(value)) {
                var answer = ['<ul class="zebra-list">'];
                value.forEach(function (v) {
                    answer.push('<li>' + v + '</li>');
                });
                answer.push('</ul>');
                return answer.join('\n');
            }
            if (angular.isObject(value)) {
                var answer = ['<table class="table">', '<tbody>'];
                angular.forEach(value, function (value, key) {
                    answer.push('<tr>');
                    answer.push('<td>' + key + '</td>');
                    answer.push('<td>' + value + '</td>');
                    answer.push('</tr>');
                });
                answer.push('</tbody>');
                answer.push('</table>');
                return answer.join('\n');
            }
            return "" + value;
        };
        $scope.getStateStyle = function (feature) {
            if (Core.parseBooleanValue(feature.Installed)) {
                return "badge badge-success";
            }
            return "badge";
        };
        $scope.filterFeature = function (feature) {
            if (Core.isBlank($scope.filter)) {
                return true;
            }
            if (feature.Id.has($scope.filter)) {
                return true;
            }
            return false;
        };
        function render(response) {
            var responseJson = angular.toJson(response.value);
            if ($scope.responseJson !== responseJson) {
                $scope.responseJson = responseJson;
                //log.debug("Got response: ", response.value);
                if (response['value']['Features'] === null) {
                    $scope.featuresError = true;
                }
                else {
                    $scope.featuresError = false;
                }
                $scope.features = [];
                $scope.repositories = [];
                var features = [];
                var repositories = [];
                Karaf.populateFeaturesAndRepos(response.value, features, repositories);
                var installedFeatures = features.filter(function (f) {
                    return Core.parseBooleanValue(f.Installed);
                });
                var uninstalledFeatures = features.filter(function (f) {
                    return !Core.parseBooleanValue(f.Installed);
                });
                //log.debug("repositories: ", repositories);
                $scope.installedFeatures = installedFeatures.sortBy(function (f) {
                    return f['Name'];
                });
                uninstalledFeatures = uninstalledFeatures.sortBy(function (f) {
                    return f['Name'];
                });
                repositories.sortBy('id').forEach(function (repo) {
                    $scope.repositories.push({
                        repository: repo['id'],
                        uri: repo['uri'],
                        features: uninstalledFeatures.filter(function (f) {
                            return f['RepositoryName'] === repo['id'];
                        })
                    });
                });
                if (!Core.isBlank($scope.newRepositoryURI)) {
                    var selectedRepo = repositories.find(function (r) {
                        return r['uri'] === $scope.newRepositoryURI;
                    });
                    if (selectedRepo) {
                        $scope.selectedRepositoryId = selectedRepo['id'];
                    }
                    $scope.newRepositoryURI = '';
                }
                if (Core.isBlank($scope.selectedRepositoryId)) {
                    $scope.selectedRepository = $scope.repositories.first();
                }
                else {
                    $scope.selectedRepository = $scope.repositories.find(function (r) {
                        return r.repository === $scope.selectedRepositoryId;
                    });
                }
                Core.$apply($scope);
            }
        }
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.NavBarController", ["$scope", "workspace", function ($scope, workspace) {
        $scope.hash = workspace.hash();
        $scope.isKarafEnabled = workspace.treeContainsDomainAndProperties("org.apache.karaf");
        $scope.isFeaturesEnabled = Karaf.getSelectionFeaturesMBean(workspace);
        $scope.isScrEnabled = Karaf.getSelectionScrMBean(workspace);
        $scope.$on('$routeChangeSuccess', function () {
            $scope.hash = workspace.hash();
        });
        $scope.isActive = function (nav) {
            return workspace.isLinkActive(nav);
        };
        $scope.isPrefixActive = function (nav) {
            return workspace.isLinkPrefixActive(nav);
        };
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.ScrComponentController", ["$scope", "$location", "workspace", "jolokia", "$routeParams", function ($scope, $location, workspace, jolokia, $routeParams) {
        $scope.name = $routeParams.name;
        populateTable();
        function populateTable() {
            $scope.row = Karaf.getComponentByName(workspace, jolokia, $scope.name);
            Core.$apply($scope);
        }
        $scope.activate = function () {
            Karaf.activateComponent(workspace, jolokia, $scope.row['Name'], function () {
                console.log("Activated!");
            }, function () {
                console.log("Failed to activate!");
            });
        };
        $scope.deactivate = function () {
            Karaf.deactivateComponent(workspace, jolokia, $scope.row['Name'], function () {
                console.log("Deactivated!");
            }, function () {
                console.log("Failed to deactivate!");
            });
        };
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.ScrComponentsController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.component = empty();
        // caches last jolokia result
        $scope.result = [];
        // rows in components table
        $scope.components = [];
        // selected components
        $scope.selectedComponents = [];
        $scope.scrOptions = {
            //plugins: [searchProvider],
            data: 'components',
            showFilter: false,
            showColumnMenu: false,
            filterOptions: {
                useExternalFilter: false
            },
            sortInfo: { fields: ['Name'], directions: ['asc'] },
            selectedItems: $scope.selectedComponents,
            rowHeight: 32,
            selectWithCheckboxOnly: true,
            columnDefs: [
                {
                    field: 'Name',
                    displayName: 'Name',
                    cellTemplate: '<div class="ngCellText"><a href="#/osgi/scr-component/{{row.entity.Name}}?p=container">{{row.getProperty(col.field)}}</a></div>',
                    width: 400
                },
                {
                    field: 'State',
                    displayName: 'State',
                    cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field)}}</div>',
                    width: 200
                }
            ]
        };
        var scrMBean = Karaf.getSelectionScrMBean(workspace);
        if (scrMBean) {
            render(Karaf.getAllComponents(workspace, jolokia));
        }
        $scope.activate = function () {
            $scope.selectedComponents.forEach(function (component) {
                Karaf.activateComponent(workspace, jolokia, component.Name, function () {
                    console.log("Activated!");
                }, function () {
                    console.log("Failed to activate!");
                });
            });
        };
        $scope.deactivate = function () {
            $scope.selectedComponents.forEach(function (component) {
                Karaf.deactivateComponent(workspace, jolokia, component.Name, function () {
                    console.log("Deactivated!");
                }, function () {
                    console.log("Failed to deactivate!");
                });
            });
        };
        function empty() {
            return [
                { Name: "", Status: false }
            ];
        }
        function render(components) {
            if (!angular.equals($scope.result, components)) {
                $scope.components = components;
                $scope.result = $scope.components;
                Core.$apply($scope);
            }
        }
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>
/**
 * @module Karaf
 */
var Karaf;
(function (Karaf) {
    Karaf._module.controller("Karaf.ServerController", ["$scope", "$location", "workspace", "jolokia", function ($scope, $location, workspace, jolokia) {
        $scope.data = {
            name: "",
            version: "",
            state: "",
            root: "",
            startLevel: "",
            framework: "",
            frameworkVersion: "",
            location: "",
            sshPort: "",
            rmiRegistryPort: "",
            rmiServerPort: "",
            pid: ""
        };
        $scope.$on('jmxTreeUpdated', reloadFunction);
        $scope.$watch('workspace.tree', reloadFunction);
        function reloadFunction() {
            // if the JMX tree is reloaded its probably because a new MBean has been added or removed
            // so lets reload, asynchronously just in case
            setTimeout(loadData, 50);
        }
        function loadData() {
            console.log("Loading Karaf data...");
            jolokia.search("org.apache.karaf:type=admin,*", Core.onSuccess(render));
        }
        function render(response) {
            // grab the first mbean as there should ideally only be one karaf in the JVM
            if (angular.isArray(response)) {
                var mbean = response[0];
                if (mbean) {
                    jolokia.getAttribute(mbean, "Instances", Core.onSuccess(function (response) {
                        onInstances(response, mbean);
                    }));
                }
            }
        }
        function onInstances(instances, mbean) {
            if (instances) {
                var parsedMBean = Core.parseMBean(mbean);
                var instanceName = 'root';
                if ('attributes' in parsedMBean) {
                    if ('name' in parsedMBean['attributes']) {
                        instanceName = parsedMBean['attributes']['name'];
                    }
                }
                //log.debug("mbean: ", Core.parseMBean(mbean));
                //log.debug("Instances: ", instances);
                // the name is the first child
                var rootInstance = instances[instanceName];
                $scope.data.name = rootInstance.Name;
                $scope.data.state = rootInstance.State;
                $scope.data.root = rootInstance["Is Root"];
                $scope.data.location = rootInstance.Location;
                $scope.data.sshPort = rootInstance["SSH Port"];
                $scope.data.rmiRegistryPort = rootInstance["RMI Registry Port"];
                $scope.data.rmiServerPort = rootInstance["RMI Server Port"];
                $scope.data.pid = rootInstance.Pid;
                // we need to get these data from the system mbean
                $scope.data.version = "?";
                $scope.data.startLevel = "?";
                $scope.data.framework = "?";
                $scope.data.frameworkVersion = "?";
                var systemMbean = "org.apache.karaf:type=system,name=" + rootInstance.Name;
                // get more data, and its okay to do this synchronously
                var response = jolokia.request({ type: "read", mbean: systemMbean, attribute: ["StartLevel", "Framework", "Version"] }, Core.onSuccess(null));
                var obj = response.value;
                if (obj) {
                    $scope.data.version = obj.Version;
                    $scope.data.startLevel = obj.StartLevel;
                    $scope.data.framework = obj.Framework;
                }
                // and the osgi framework version is the bundle version
                var response2 = jolokia.search("osgi.core:type=bundleState,*", Core.onSuccess(null));
                if (angular.isArray(response2)) {
                    var mbean = response2[0];
                    if (mbean) {
                        // get more data, and its okay to do this synchronously
                        var response3 = jolokia.request({ type: 'exec', mbean: mbean, operation: 'getVersion(long)', arguments: [0] }, Core.onSuccess(null));
                        var obj3 = response3.value;
                        if (obj3) {
                            $scope.data.frameworkVersion = obj3;
                        }
                    }
                }
            }
            // ensure web page is updated
            Core.$apply($scope);
        }
    }]);
})(Karaf || (Karaf = {}));

/// <reference path="../../includes.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi.log = Logger.get("OSGi");
    function defaultBundleValues(workspace, $scope, values) {
        var allValues = values;
        angular.forEach(values, function (row) {
            row["ImportData"] = parseActualPackages(row["ImportedPackages"]);
            row["ExportData"] = parseActualPackages(row["ExportedPackages"]);
            row["IdentifierLink"] = bundleLinks(workspace, row["Identifier"]);
            row["Hosts"] = labelBundleLinks(workspace, row["Hosts"], allValues);
            row["Fragments"] = labelBundleLinks(workspace, row["Fragments"], allValues);
            row["ImportedPackages"] = row["ImportedPackages"].union([]);
            row["StateStyle"] = getStateStyle("label", row["State"]);
            row["RequiringBundles"] = labelBundleLinks(workspace, row["RequiringBundles"], allValues);
        });
        return values;
    }
    Osgi.defaultBundleValues = defaultBundleValues;
    function getStateStyle(prefix, state) {
        switch (state) {
            case "INSTALLED":
                return prefix + "-important";
            case "RESOLVED":
                return prefix + "-inverse";
            case "STARTING":
                return prefix + "-warning";
            case "ACTIVE":
                return prefix + "-success";
            case "STOPPING":
                return prefix + "-info";
            case "UNINSTALLED":
                return "";
            default:
                return prefix + "-important";
        }
    }
    Osgi.getStateStyle = getStateStyle;
    function defaultServiceValues(workspace, $scope, values) {
        angular.forEach(values, function (row) {
            row["BundleIdentifier"] = bundleLinks(workspace, row["BundleIdentifier"]);
        });
        return values;
    }
    Osgi.defaultServiceValues = defaultServiceValues;
    function defaultPackageValues(workspace, $scope, values) {
        var packages = [];
        function onPackageEntry(packageEntry, row) {
            if (!row)
                row = packageEntry;
            var name = packageEntry["Name"];
            var version = packageEntry["Version"];
            if (name && !name.startsWith("#")) {
                packageEntry["VersionLink"] = "<a href='" + Core.url("#/osgi/package/" + name + "/" + version + workspace.hash()) + "'>" + version + "</a>";
                var importingBundles = row["ImportingBundles"] || packageEntry["ImportingBundles"];
                var exportingBundles = row["ExportingBundles"] || packageEntry["ExportingBundles"];
                packageEntry["ImportingBundleLinks"] = bundleLinks(workspace, importingBundles);
                packageEntry["ImportingBundleLinks"] = bundleLinks(workspace, importingBundles);
                packageEntry["ExportingBundleLinks"] = bundleLinks(workspace, exportingBundles);
                packages.push(packageEntry);
            }
        }
        // the values could contain a child 'values' array of objects so use those directly
        var childValues = values.values;
        if (childValues) {
            angular.forEach(childValues, onPackageEntry);
        }
        angular.forEach(values, function (row) {
            angular.forEach(row, function (version) {
                angular.forEach(version, function (packageEntry) {
                    onPackageEntry(packageEntry, row);
                });
            });
        });
        return packages;
    }
    Osgi.defaultPackageValues = defaultPackageValues;
    function defaultConfigurationValues(workspace, $scope, values) {
        var array = [];
        angular.forEach(values, function (row) {
            var map = {};
            map["Pid"] = row[0];
            map["PidLink"] = "<a href='" + Core.url("#/osgi/pid/" + row[0] + workspace.hash()) + "'>" + row[0] + "</a>";
            map["Bundle"] = row[1];
            array.push(map);
        });
        return array;
    }
    Osgi.defaultConfigurationValues = defaultConfigurationValues;
    function parseActualPackages(packages) {
        var result = {};
        for (var i = 0; i < packages.length; i++) {
            var pkg = packages[i];
            var idx = pkg.indexOf(";");
            if (idx > 0) {
                var name = pkg.substring(0, idx);
                var ver = pkg.substring(idx + 1);
                var data = result[name];
                if (data === undefined) {
                    data = {};
                    result[name] = data;
                }
                data["ReportedVersion"] = ver;
            }
        }
        return result;
    }
    Osgi.parseActualPackages = parseActualPackages;
    function parseManifestHeader(headers, name) {
        var result = {};
        var data = {};
        var hdr = headers[name];
        if (hdr === undefined) {
            return result;
        }
        var ephdr = hdr.Value;
        var inPkg = true;
        var inQuotes = false;
        var pkgName = "";
        var daDecl = "";
        for (var i = 0; i < ephdr.length; i++) {
            var c = ephdr[i];
            if (c === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (inQuotes) {
                daDecl += c;
                continue;
            }
            // from here on we are never inside quotes
            if (c === ';') {
                if (inPkg) {
                    inPkg = false;
                }
                else {
                    handleDADecl(data, daDecl);
                    // reset directive and attribute variable
                    daDecl = "";
                }
                continue;
            }
            if (c === ',') {
                handleDADecl(data, daDecl);
                result[pkgName] = data;
                // reset data
                data = {};
                pkgName = "";
                daDecl = "";
                inPkg = true;
                continue;
            }
            if (inPkg) {
                pkgName += c;
            }
            else {
                daDecl += c;
            }
        }
        handleDADecl(data, daDecl);
        result[pkgName] = data;
        return result;
    }
    Osgi.parseManifestHeader = parseManifestHeader;
    function handleDADecl(data, daDecl) {
        var didx = daDecl.indexOf(":=");
        if (didx > 0) {
            data["D" + daDecl.substring(0, didx)] = daDecl.substring(didx + 2);
            return;
        }
        var aidx = daDecl.indexOf("=");
        if (aidx > 0) {
            data["A" + daDecl.substring(0, aidx)] = daDecl.substring(aidx + 1);
            return;
        }
    }
    function toCollection(values) {
        var collection = values;
        if (!angular.isArray(values)) {
            collection = [values];
        }
        return collection;
    }
    Osgi.toCollection = toCollection;
    function labelBundleLinks(workspace, values, allValues) {
        var answer = "";
        var sorted = toCollection(values).sort(function (a, b) {
            return a - b;
        });
        angular.forEach(sorted, function (value, key) {
            var prefix = "";
            if (answer.length > 0) {
                prefix = " ";
            }
            var info = allValues[value] || {};
            var labelText = info.SymbolicName;
            answer += prefix + "<a class='label' href='" + Core.url("#/osgi/bundle/" + value + workspace.hash()) + "'>" + labelText + "</a>";
        });
        return answer;
    }
    Osgi.labelBundleLinks = labelBundleLinks;
    function bundleLinks(workspace, values) {
        var answer = "";
        var sorted = toCollection(values).sort(function (a, b) {
            return a - b;
        });
        angular.forEach(sorted, function (value, key) {
            var prefix = "";
            if (answer.length > 0) {
                prefix = " ";
            }
            answer += prefix + "<a class='label' href='" + Core.url("#/osgi/bundle/" + value + workspace.hash()) + "'>" + value + "</a>";
        });
        return answer;
    }
    Osgi.bundleLinks = bundleLinks;
    function pidLinks(workspace, values) {
        var answer = "";
        angular.forEach(toCollection(values), function (value, key) {
            var prefix = "";
            if (answer.length > 0) {
                prefix = " ";
            }
            answer += prefix + "<a href='" + Core.url("#/osgi/bundle/" + value + workspace.hash()) + "'>" + value + "</a>";
        });
        return answer;
    }
    Osgi.pidLinks = pidLinks;
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
    function findBundle(bundleId, values) {
        var answer = "";
        angular.forEach(values, function (row) {
            var id = row["Identifier"];
            if (bundleId === id.toString()) {
                answer = row;
                return answer;
            }
        });
        return answer;
    }
    Osgi.findBundle = findBundle;
    function getSelectionBundleMBean(workspace) {
        if (workspace) {
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("osgi.core", "bundleState");
            return Osgi.findFirstObjectName(folder);
        }
        return null;
    }
    Osgi.getSelectionBundleMBean = getSelectionBundleMBean;
    /**
     * Walks the tree looking in the first child all the way down until we find an objectName
     * @method findFirstObjectName
     * @for Osgi
     * @param {Folder} node
     * @return {String}
     *
     */
    function findFirstObjectName(node) {
        if (node) {
            var answer = node.objectName;
            if (answer) {
                return answer;
            }
            else {
                var children = node.children;
                if (children && children.length) {
                    return findFirstObjectName(children[0]);
                }
            }
        }
        return null;
    }
    Osgi.findFirstObjectName = findFirstObjectName;
    function getSelectionFrameworkMBean(workspace) {
        if (workspace) {
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("osgi.core", "framework");
            return Osgi.findFirstObjectName(folder);
        }
        return null;
    }
    Osgi.getSelectionFrameworkMBean = getSelectionFrameworkMBean;
    function getSelectionServiceMBean(workspace) {
        if (workspace) {
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("osgi.core", "serviceState");
            return Osgi.findFirstObjectName(folder);
        }
        return null;
    }
    Osgi.getSelectionServiceMBean = getSelectionServiceMBean;
    function getSelectionPackageMBean(workspace) {
        if (workspace) {
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("osgi.core", "packageState");
            return Osgi.findFirstObjectName(folder);
        }
        return null;
    }
    Osgi.getSelectionPackageMBean = getSelectionPackageMBean;
    function getSelectionConfigAdminMBean(workspace) {
        if (workspace) {
            // lets navigate to the tree item based on paths
            var folder = workspace.tree.navigate("osgi.compendium", "cm");
            return Osgi.findFirstObjectName(folder);
        }
        return null;
    }
    Osgi.getSelectionConfigAdminMBean = getSelectionConfigAdminMBean;
    function getMetaTypeMBean(workspace) {
        if (workspace) {
            var mbeanTypesToDomain = workspace.mbeanTypesToDomain;
            var typeFolder = mbeanTypesToDomain["MetaTypeFacade"] || {};
            var mbeanFolder = typeFolder["io.fabric8"] || {};
            return mbeanFolder["objectName"];
        }
        return null;
    }
    Osgi.getMetaTypeMBean = getMetaTypeMBean;
    function getProfileMetadataMBean(workspace) {
        if (workspace) {
            var mbeanTypesToDomain = workspace.mbeanTypesToDomain;
            var typeFolder = mbeanTypesToDomain["ProfileMetadata"] || {};
            var mbeanFolder = typeFolder["io.fabric8"] || {};
            return mbeanFolder["objectName"];
        }
        return null;
    }
    Osgi.getProfileMetadataMBean = getProfileMetadataMBean;
    function getHawtioOSGiToolsMBean(workspace) {
        if (workspace) {
            var mbeanTypesToDomain = workspace.mbeanTypesToDomain;
            var toolsFacades = mbeanTypesToDomain["OSGiTools"] || {};
            var hawtioFolder = toolsFacades["hawtio"] || {};
            return hawtioFolder["objectName"];
        }
        return null;
    }
    Osgi.getHawtioOSGiToolsMBean = getHawtioOSGiToolsMBean;
    function getHawtioConfigAdminMBean(workspace) {
        if (workspace) {
            var mbeanTypesToDomain = workspace.mbeanTypesToDomain;
            var typeFolder = mbeanTypesToDomain["ConfigAdmin"] || {};
            var mbeanFolder = typeFolder["hawtio"] || {};
            return mbeanFolder["objectName"];
        }
        return null;
    }
    Osgi.getHawtioConfigAdminMBean = getHawtioConfigAdminMBean;
    /**
     * Creates a link to the given configuration pid and/or factoryPid
     */
    function createConfigPidLink($scope, workspace, pid, isFactory) {
        if (isFactory === void 0) { isFactory = false; }
        return Core.url("#" + createConfigPidPath($scope, pid, isFactory) + workspace.hash());
    }
    Osgi.createConfigPidLink = createConfigPidLink;
    /**
     * Creates a path to the given configuration pid and/or factoryPid
     */
    function createConfigPidPath($scope, pid, isFactory) {
        if (isFactory === void 0) { isFactory = false; }
        var link = pid;
        var versionId = $scope.versionId;
        var profileId = $scope.profileId;
        if (versionId && versionId) {
            var configPage = isFactory ? "/newConfiguration/" : "/configuration/";
            return "/wiki/branch/" + versionId + configPage + link + "/" + $scope.pageId;
        }
        else {
            return "/osgi/pid/" + link;
        }
    }
    Osgi.createConfigPidPath = createConfigPidPath;
    function getConfigurationProperties(workspace, jolokia, pid, onDataFn) {
        var mbean = getSelectionConfigAdminMBean(workspace);
        var answer = null;
        if (jolokia && mbean) {
            answer = jolokia.execute(mbean, 'getProperties', pid, Core.onSuccess(onDataFn));
        }
        return answer;
    }
    Osgi.getConfigurationProperties = getConfigurationProperties;
    /**
     * For a pid of the form "foo.generatedId" for a pid "foo" or "foo.bar" remove the "foo." prefix
     */
    function removeFactoryPidPrefix(pid, factoryPid) {
        if (pid && factoryPid) {
            if (pid.startsWith(factoryPid)) {
                return pid.substring(factoryPid.length + 1);
            }
            var idx = factoryPid.lastIndexOf(".");
            if (idx > 0) {
                var prefix = factoryPid.substring(0, idx + 1);
                return Core.trimLeading(pid, prefix);
            }
        }
        return pid;
    }
    Osgi.removeFactoryPidPrefix = removeFactoryPidPrefix;
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    var OsgiDataService = (function () {
        function OsgiDataService(workspace, jolokia) {
            this.jolokia = jolokia;
            this.workspace = workspace;
        }
        OsgiDataService.prototype.getBundles = function () {
            var bundles = {};
            // TODO make this async,especially given this returns lots of data
            var response = this.jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionBundleMBean(this.workspace),
                operation: 'listBundles()'
            }, Core.onSuccess(null));
            angular.forEach(response.value, function (value, key) {
                var obj = {
                    Identifier: value.Identifier,
                    Name: "",
                    SymbolicName: value.SymbolicName,
                    Fragment: value.Fragment,
                    State: value.State,
                    Version: value.Version,
                    LastModified: new Date(Number(value.LastModified)),
                    Location: value.Location,
                    StartLevel: undefined,
                    RegisteredServices: value.RegisteredServices,
                    ServicesInUse: value.ServicesInUse
                };
                if (value.Headers['Bundle-Name']) {
                    obj.Name = value.Headers['Bundle-Name']['Value'];
                }
                bundles[value.Identifier] = obj;
            });
            return bundles;
        };
        OsgiDataService.prototype.getServices = function () {
            var services = {};
            var response = this.jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionServiceMBean(this.workspace),
                operation: 'listServices()'
            }, Core.onSuccess(null));
            var answer = response.value;
            angular.forEach(answer, function (value, key) {
                services[value.Identifier] = value;
            });
            return services;
        };
        OsgiDataService.prototype.getPackages = function () {
            var packages = {};
            var response = this.jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionPackageMBean(this.workspace),
                operation: 'listPackages()'
            }, Core.onSuccess(null));
            var answer = response.value.values;
            answer.forEach(function (value) {
                packages[value.Name + "-" + value.Version] = value;
            });
            return packages;
        };
        return OsgiDataService;
    })();
    Osgi.OsgiDataService = OsgiDataService;
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiData.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="../../karaf/ts/karafHelpers.ts"/>
/**
 * @module Osgi
 * @main Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi.pluginName = 'osgi';
    Osgi._module = angular.module(Osgi.pluginName, []);
    Osgi._module.config(["$routeProvider", function ($routeProvider) {
        $routeProvider.when('/osgi', { redirectTo: '/osgi/bundle-list' }).when('/osgi/bundle-list', { templateUrl: 'plugins/osgi/html/bundle-list.html' }).when('/osgi/bundles', { templateUrl: 'plugins/osgi/html/bundles.html' }).when('/osgi/bundle/:bundleId', { templateUrl: 'plugins/osgi/html/bundle.html' }).when('/osgi/services', { templateUrl: 'plugins/osgi/html/services.html' }).when('/osgi/packages', { templateUrl: 'plugins/osgi/html/packages.html' }).when('/osgi/package/:package/:version', { templateUrl: 'plugins/osgi/html/package.html' }).when('/osgi/configurations', { templateUrl: 'plugins/osgi/html/configurations.html' }).when('/osgi/pid/:pid/:factoryPid', { templateUrl: 'plugins/osgi/html/pid.html' }).when('/osgi/pid/:pid', { templateUrl: 'plugins/osgi/html/pid.html' }).when('/osgi/fwk', { templateUrl: 'plugins/osgi/html/framework.html' }).when('/osgi/dependencies', { templateUrl: 'plugins/osgi/html/svc-dependencies.html', reloadOnSearch: false });
    }]);
    Osgi._module.run(["HawtioNav", "workspace", "viewRegistry", "helpRegistry", function (nav, workspace, viewRegistry, helpRegistry) {
        //viewRegistry['osgi'] = "plugins/osgi/html/layoutOsgi.html";
        helpRegistry.addUserDoc('osgi', 'plugins/osgi/doc/help.md', function () {
            return workspace.treeContainsDomainAndProperties("osgi.core");
        });
        var builder = nav.builder();
        var configuration = builder.id('osgi-configuration').href(function () { return '/osgi/configurations' + workspace.hash(); }).title(function () { return 'Configuration'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/configuration') || workspace.isLinkPrefixActive('/osgi/pid'); }).build();
        var bundles = builder.id('osgi-bundles').href(function () { return '/osgi/bundle-list' + workspace.hash(); }).title(function () { return 'Bundles'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/bundle'); }).build();
        var features = builder.id('osgi-features').href(function () { return '/osgi/features' + workspace.hash(); }).title(function () { return 'Features'; }).show(function () { return !Core.isBlank(Karaf.getSelectionFeaturesMBean(workspace)); }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/feature'); }).build();
        var packages = builder.id('osgi-packages').href(function () { return '/osgi/packages' + workspace.hash(); }).title(function () { return 'Packages'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/package'); }).build();
        var services = builder.id('osgi-services').href(function () { return '/osgi/services' + workspace.hash(); }).title(function () { return 'Services'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/service'); }).build();
        var scrComponents = builder.id('osgi-scr-components').href(function () { return '/osgi/scr-components' + workspace.hash(); }).title(function () { return 'Declarative Services'; }).show(function () { return !Core.isBlank(Karaf.getSelectionScrMBean(workspace)); }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/scr-component'); }).build();
        var server = builder.id('osgi-server').href(function () { return '/osgi/server' + workspace.hash(); }).title(function () { return 'Server'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/server'); }).build();
        var fwk = builder.id('osgi-fwk').href(function () { return '/osgi/fwk' + workspace.hash(); }).title(function () { return 'Framework'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/fwk'); }).build();
        var dependencies = builder.id('osgi-dependencies').href(function () { return '/osgi/dependencies' + workspace.hash(); }).title(function () { return 'Dependencies'; }).isSelected(function () { return workspace.isLinkPrefixActive('/osgi/dependencies'); }).build();
        var tab = builder.id('osgi').title(function () { return 'OSGi'; }).href(function () { return '/osgi'; }).isValid(function () { return workspace.treeContainsDomainAndProperties("osgi.core"); }).isSelected(function () { return workspace.isLinkActive('osgi'); }).tabs(configuration, bundles, features, packages, services, scrComponents, server, fwk, dependencies).build();
        nav.add(tab);
        /*
        workspace.topLevelTabs.push({
          id: "osgi",
          content: "OSGi",
          title: "Visualise and manage the bundles and services in this OSGi container",
          isValid: (workspace: Workspace) => workspace.treeContainsDomainAndProperties("osgi.core"),
          href: () => "#/osgi/bundle-list",
          isActive: (workspace: Workspace) => workspace.isLinkActive("osgi")
        });
        */
    }]);
    Osgi._module.factory('osgiDataService', ["workspace", "jolokia", function (workspace, jolokia) {
        return new Osgi.OsgiDataService(workspace, jolokia);
    }]);
    hawtioPluginLoader.addModule(Osgi.pluginName);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.BundleListController", ["$scope", "workspace", "jolokia", "localStorage", function ($scope, workspace, jolokia, localStorage) {
        $scope.result = {};
        $scope.bundles = [];
        $scope.bundleUrl = "";
        $scope.display = {
            bundleField: "Name",
            sortField: "Identifier",
            bundleFilter: "",
            startLevelFilter: 0,
            showActiveMQBundles: false,
            showCamelBundles: false,
            showCxfBundles: false,
            showPlatformBundles: false
        };
        if ('bundleList' in localStorage) {
            $scope.display = angular.fromJson(localStorage['bundleList']);
        }
        $scope.$watch('display', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                localStorage['bundleList'] = angular.toJson(newValue);
            }
        }, true);
        $scope.installDisabled = function () {
            return $scope.bundleUrl === "";
        };
        $scope.install = function () {
            jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionFrameworkMBean(workspace),
                operation: "installBundle(java.lang.String)",
                arguments: [$scope.bundleUrl]
            }, {
                success: function (response) {
                    var bundleID = response.value;
                    jolokia.request({
                        type: 'exec',
                        mbean: Osgi.getSelectionBundleMBean(workspace),
                        operation: "isFragment(long)",
                        arguments: [bundleID]
                    }, {
                        success: function (response) {
                            var isFragment = response.value;
                            if (isFragment) {
                                Core.notification("success", "Fragment installed successfully.");
                                $scope.bundleUrl = "";
                                Core.$apply($scope);
                            }
                            else {
                                jolokia.request({
                                    type: 'exec',
                                    mbean: Osgi.getSelectionFrameworkMBean(workspace),
                                    operation: "startBundle(long)",
                                    arguments: [bundleID]
                                }, {
                                    success: function (response) {
                                        Core.notification("success", "Bundle installed and started successfully.");
                                        $scope.bundleUrl = "";
                                        Core.$apply($scope);
                                    },
                                    error: function (response) {
                                        Core.notification("error", response.error);
                                    }
                                });
                            }
                        },
                        error: function (response) {
                            Core.notification("error", response.error);
                        }
                    });
                },
                error: function (response) {
                    Core.notification("error", response.error);
                }
            });
        };
        $scope.$watch('display.sortField', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.bundles = $scope.bundles.sortBy(newValue);
            }
        });
        $scope.getStateStyle = function (state) {
            return Osgi.getStateStyle("badge", state);
        };
        $scope.getLabel = function (bundleObject) {
            var labelText;
            if ($scope.display.bundleField === "Name") {
                labelText = bundleObject.Name;
                if (labelText === "") {
                    labelText = bundleObject.SymbolicName;
                }
            }
            else {
                labelText = bundleObject.SymbolicName;
            }
            return labelText;
        };
        $scope.filterBundle = function (bundle) {
            if ($scope.display.startLevelFilter > 0 && bundle.StartLevel < $scope.display.startLevelFilter) {
                return false;
            }
            var labelText = $scope.getLabel(bundle);
            if ($scope.display.bundleFilter && !labelText.toLowerCase().has($scope.display.bundleFilter.toLowerCase())) {
                return false;
            }
            if (Core.isBlank($scope.display.bundleFilter)) {
                if (($scope.display.showPlatformBundles && Karaf.isPlatformBundle(bundle['SymbolicName'])) || ($scope.display.showActiveMQBundles && Karaf.isActiveMQBundle(bundle['SymbolicName'])) || ($scope.display.showCxfBundles && Karaf.isCxfBundle(bundle['SymbolicName'])) || ($scope.display.showCamelBundles && Karaf.isCamelBundle(bundle['SymbolicName']))) {
                    return true;
                }
                else {
                    return false;
                }
            }
            return true;
        };
        function processResponse(response) {
            var value = response['value'];
            var responseJson = angular.toJson(value);
            if ($scope.responseJson !== responseJson) {
                $scope.responseJson = responseJson;
                $scope.bundles = [];
                angular.forEach(value, function (value, key) {
                    var obj = {
                        Identifier: value.Identifier,
                        Name: "",
                        SymbolicName: value.SymbolicName,
                        Fragment: value.Fragment,
                        State: value.State,
                        Version: value.Version,
                        LastModified: new Date(Number(value.LastModified)),
                        Location: value.Location,
                        StartLevel: undefined
                    };
                    if (value.Headers['Bundle-Name']) {
                        obj.Name = value.Headers['Bundle-Name']['Value'];
                    }
                    $scope.bundles.push(obj);
                });
                $scope.bundles = $scope.bundles.sortBy($scope.display.sortField);
                Core.$apply($scope);
                // Obtain start level information for all the bundles, let's do this async though
                setTimeout(function () {
                    var requests = [];
                    for (var i = 0; i < $scope.bundles.length; i++) {
                        var b = $scope.bundles[i];
                        requests.push({
                            type: 'exec',
                            mbean: Osgi.getSelectionBundleMBean(workspace),
                            operation: 'getStartLevel(long)',
                            arguments: [b.Identifier]
                        });
                    }
                    var outstanding = requests.length;
                    jolokia.request(requests, Core.onSuccess(function (response) {
                        var id = response['request']['arguments'].first();
                        if (angular.isDefined(id)) {
                            var bundle = $scope.bundles[id];
                            if (bundle) {
                                Osgi.log.debug("Setting bundle: ", bundle['Identifier'], " start level to: ", response['value']);
                                bundle['StartLevel'] = response['value'];
                            }
                        }
                        outstanding = outstanding - 1;
                        Osgi.log.debug("oustanding responses: ", outstanding);
                        if (outstanding === 0) {
                            Osgi.log.debug("Updating page...");
                            Core.$apply($scope);
                        }
                    }));
                }, 500);
            }
        }
        Core.register(jolokia, $scope, {
            type: 'exec',
            mbean: Osgi.getSelectionBundleMBean(workspace),
            operation: 'listBundles()'
        }, Core.onSuccess(processResponse));
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    // These functions are exported independently to facilitate unit testing
    function readBSNHeaderData(header) {
        var idx = header.indexOf(";");
        if (idx <= 0) {
            return "";
        }
        return header.substring(idx + 1).trim();
    }
    Osgi.readBSNHeaderData = readBSNHeaderData;
    function formatAttributesAndDirectivesForPopover(data, skipVersion) {
        var str = "";
        if (!data) {
            return str;
        }
        var sortedKeys = Object.keys(data).sort();
        for (var i = 0; i < sortedKeys.length; i++) {
            var da = sortedKeys[i];
            var type = da.charAt(0);
            var separator = "";
            var txtClass;
            if (type === "A") {
                separator = "=";
                txtClass = "text-info";
            }
            if (type === "D") {
                separator = ":=";
                txtClass = "muted";
            }
            if (separator !== "") {
                if (skipVersion) {
                    if (da === "Aversion") {
                        continue;
                    }
                }
                var value = data[da];
                if (value.length > 15) {
                    value = value.replace(/[,]/g, ",<br/>&nbsp;&nbsp;");
                }
                str += "<tr><td><strong class='" + txtClass + "'>" + da.substring(1) + "</strong>" + separator + value + "</td></tr>";
            }
        }
        return str;
    }
    Osgi.formatAttributesAndDirectivesForPopover = formatAttributesAndDirectivesForPopover;
    function formatServiceName(objClass) {
        if (angular.isArray(objClass)) {
            return formatServiceNameArray(objClass);
        }
        var name = objClass.toString();
        var idx = name.lastIndexOf('.');
        return name.substring(idx + 1);
    }
    Osgi.formatServiceName = formatServiceName;
    function formatServiceNameArray(objClass) {
        var rv = [];
        for (var i = 0; i < objClass.length; i++) {
            rv.add(formatServiceName(objClass[i]));
        }
        rv = rv.filter(function (elem, pos, self) {
            return self.indexOf(elem) === pos;
        });
        rv.sort();
        return rv.toString();
    }
    Osgi._module.controller("Osgi.BundleController", ["$scope", "$location", "workspace", "$routeParams", "jolokia", function ($scope, $location, workspace, $routeParams, jolokia) {
        $scope.bundleId = $routeParams.bundleId;
        updateTableContents();
        $scope.showValue = function (key) {
            switch (key) {
                case "Bundle-Name":
                case "Bundle-SymbolicName":
                case "Bundle-Version":
                case "Export-Package":
                case "Import-Package":
                    return false;
                default:
                    return true;
            }
        };
        $scope.executeLoadClass = function (clazz) {
            var mbean = Osgi.getHawtioOSGiToolsMBean(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'getLoadClassOrigin', arguments: [$scope.bundleId, clazz] }, {
                    success: function (response) {
                        var divEl = document.getElementById("loadClassResult");
                        var resultBundle = response.value;
                        var style;
                        var resultTxt;
                        if (resultBundle === -1) {
                            style = "";
                            resultTxt = "Class can not be loaded from this bundle.";
                        }
                        else {
                            style = "alert-success";
                            resultTxt = "Class is served from Bundle " + Osgi.bundleLinks(workspace, resultBundle);
                        }
                        divEl.innerHTML += "<div class='alert " + style + "'>" + "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + "Loading class <strong>" + clazz + "</strong> in Bundle " + $scope.bundleId + ". " + resultTxt + "</div>";
                    },
                    error: function (response) {
                        inspectReportError(response);
                    }
                });
            }
            else {
                inspectReportNoMBeanFound();
            }
        };
        $scope.executeFindResource = function (resource) {
            var mbean = Osgi.getHawtioOSGiToolsMBean(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'getResourceURL', arguments: [$scope.bundleId, resource] }, {
                    success: function (response) {
                        var divEl = document.getElementById("loadClassResult");
                        var resultURL = response.value;
                        var style;
                        var resultTxt;
                        if (resultURL === null) {
                            style = "";
                            resultTxt = "Resource can not be found from this bundle.";
                        }
                        else {
                            style = "alert-success";
                            resultTxt = "Resource is available from: " + resultURL;
                        }
                        divEl.innerHTML += "<div class='alert " + style + "'>" + "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + "Finding resource <strong>" + resource + "</strong> in Bundle " + $scope.bundleId + ". " + resultTxt + "</div>";
                    },
                    error: function (response) {
                        inspectReportError(response);
                    }
                });
            }
            else {
                inspectReportNoMBeanFound();
            }
        };
        $scope.startBundle = function (bundleId) {
            jolokia.request([
                { type: 'exec', mbean: Osgi.getSelectionFrameworkMBean(workspace), operation: 'startBundle', arguments: [bundleId] }
            ], Core.onSuccess(updateTableContents));
        };
        $scope.stopBundle = function (bundleId) {
            jolokia.request([
                { type: 'exec', mbean: Osgi.getSelectionFrameworkMBean(workspace), operation: 'stopBundle', arguments: [bundleId] }
            ], Core.onSuccess(updateTableContents));
        };
        $scope.updatehBundle = function (bundleId) {
            jolokia.request([
                { type: 'exec', mbean: Osgi.getSelectionFrameworkMBean(workspace), operation: 'updateBundle', arguments: [bundleId] }
            ], Core.onSuccess(updateTableContents));
        };
        $scope.refreshBundle = function (bundleId) {
            jolokia.request([
                { type: 'exec', mbean: Osgi.getSelectionFrameworkMBean(workspace), operation: 'refreshBundle', arguments: [bundleId] }
            ], Core.onSuccess(updateTableContents));
        };
        $scope.uninstallBundle = function (bundleId) {
            jolokia.request([{
                type: 'exec',
                mbean: Osgi.getSelectionFrameworkMBean(workspace),
                operation: 'uninstallBundle',
                arguments: [bundleId]
            }], Core.onSuccess(function () {
                $location.path("/osgi/bundle-list");
                Core.$apply($scope);
            }));
        };
        function inspectReportNoMBeanFound() {
            var divEl = document.getElementById("loadClassResult");
            divEl.innerHTML += "<div class='alert alert-error'>" + "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + "The hawtio.OSGiTools MBean is not available. Please contact technical support." + "</div>";
        }
        function inspectReportError(response) {
            var divEl = document.getElementById("loadClassResult");
            divEl.innerHTML += "<div class='alert alert-error'>" + "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + "Problem invoking hawtio.OSGiTools MBean. " + response + "</div>";
        }
        function populateTable(response) {
            var values = response.value;
            $scope.bundles = values;
            // now find the row based on the selection ui
            Osgi.defaultBundleValues(workspace, $scope, values);
            $scope.row = Osgi.findBundle($scope.bundleId, values);
            Core.$apply($scope);
            // This trick is to ensure that the popover is properly visible if it is
            // smaller than the accordion
            $('.accordion-body.collapse').hover(function () {
                $(this).css('overflow', 'visible');
            }, function () {
                $(this).css('overflow', 'hidden');
            });
            // setup tooltips
            $("#bsn").tooltip({ title: readBSNHeaderData($scope.row.Headers["Bundle-SymbolicName"].Value), placement: "right" });
            createImportPackageSection();
            createExportPackageSection();
            populateServicesSection();
        }
        function createImportPackageSection() {
            // setup popovers
            var importPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Import-Package");
            for (var pkg in $scope.row.ImportData) {
                var data = importPackageHeaders[pkg];
                var po = "<small><table>" + "<tr><td><strong>Imported Version=</strong>" + $scope.row.ImportData[pkg].ReportedVersion + "</td></tr>";
                if (data !== undefined) {
                    // This happens in case the package was imported due to a DynamicImport-Package
                    po += formatAttributesAndDirectivesForPopover(data, false);
                    if (importPackageHeaders[pkg]["Dresolution"] !== "optional") {
                        $(document.getElementById("import." + pkg)).addClass("badge-info");
                    }
                }
                else {
                    // This is a dynamic import
                    $(document.getElementById("import." + pkg)).addClass("badge-important");
                    var reason = $scope.row.Headers["DynamicImport-Package"];
                    if (reason !== undefined) {
                        reason = reason.Value;
                        po += "<tr><td>Dynamic Import. Imported due to:</td></tr>";
                        po += "<tr><td><strong>DynamicImport-Package=</strong>" + reason + "</td></tr>";
                    }
                }
                po += "</table></small>";
                $(document.getElementById("import." + pkg)).popover({ title: "attributes and directives", content: po, trigger: "hover", html: true });
                // Unset the value so that we can see whether there are any unbound optional imports left...
                importPackageHeaders[pkg] = undefined;
            }
            var unsatisfied = "";
            for (var pkg in importPackageHeaders) {
                if (importPackageHeaders[pkg] === undefined) {
                    continue;
                }
                if ($scope.row.ExportData[pkg] !== undefined) {
                    continue;
                }
                unsatisfied += "<tr><td><div class='less-big badge badge-warning' id='unsatisfied." + pkg + "'>" + pkg + "</div></td></tr>";
            }
            if (unsatisfied !== "") {
                unsatisfied = "<p/><p class='text-warning'>The following optional imports were not satisfied:<table>" + unsatisfied + "</table></p>";
                document.getElementById("unsatisfiedOptionalImports").innerHTML = unsatisfied;
            }
            for (var pkg in importPackageHeaders) {
                if (importPackageHeaders[pkg] === undefined) {
                    continue;
                }
                var po = "<small><table>";
                po += formatAttributesAndDirectivesForPopover(importPackageHeaders[pkg], false);
                po += "</table></small>";
                $(document.getElementById("unsatisfied." + pkg)).popover({ title: "attributes and directives", content: po, trigger: "hover", html: true });
            }
        }
        function createExportPackageSection() {
            // setup popovers
            var exportPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Export-Package");
            for (var pkg in $scope.row.ExportData) {
                var po = "<small><table>" + "<tr><td><strong>Exported Version=</strong>" + $scope.row.ExportData[pkg].ReportedVersion + "</td></tr>";
                po += formatAttributesAndDirectivesForPopover(exportPackageHeaders[pkg], true);
                po += "</table></small>";
                $(document.getElementById("export." + pkg)).popover({ title: "attributes and directives", content: po, trigger: "hover", html: true });
            }
        }
        function populateServicesSection() {
            if (($scope.row.RegisteredServices === undefined || $scope.row.RegisteredServices.length === 0) && ($scope.row.ServicesInUse === undefined || $scope.row.ServicesInUse === 0)) {
                // no services for this bundle
                return;
            }
            var mbean = Osgi.getSelectionServiceMBean(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'listServices()' }, Core.onSuccess(updateServices));
            }
        }
        function updateServices(result) {
            var data = result.value;
            for (var id in data) {
                var reg = document.getElementById("registers.service." + id);
                var uses = document.getElementById("uses.service." + id);
                if ((reg === undefined || reg === null) && (uses === undefined || uses === null)) {
                    continue;
                }
                jolokia.request({
                    type: 'exec',
                    mbean: Osgi.getSelectionServiceMBean(workspace),
                    operation: 'getProperties',
                    arguments: [id]
                }, Core.onSuccess(function (svcId, regEl, usesEl) {
                    return function (resp) {
                        var props = resp.value;
                        var sortedKeys = Object.keys(props).sort();
                        var po = "<small><table>";
                        for (var i = 0; i < sortedKeys.length; i++) {
                            var value = props[sortedKeys[i]];
                            if (value !== undefined) {
                                var fval = value.Value;
                                if (fval.length > 15) {
                                    fval = fval.replace(/[,]/g, ",<br/>&nbsp;&nbsp;");
                                }
                                po += "<tr><td valign='top'>" + sortedKeys[i] + "</td><td>" + fval + "</td></tr>";
                            }
                        }
                        var regBID = data[svcId].BundleIdentifier;
                        po += "<tr><td>Registered&nbsp;by</td><td>Bundle " + regBID + " <div class='less-big label'>" + $scope.bundles[regBID].SymbolicName + "</div></td></tr>";
                        po += "</table></small>";
                        if (regEl !== undefined && regEl !== null) {
                            regEl.innerText = " " + formatServiceName(data[svcId].objectClass);
                            $(regEl).popover({ title: "service properties", content: po, trigger: "hover", html: true });
                        }
                        if (usesEl !== undefined && usesEl !== null) {
                            usesEl.innerText = " " + formatServiceName(data[svcId].objectClass);
                            $(usesEl).popover({ title: "service properties", content: po, trigger: "hover", html: true });
                        }
                    };
                }(id, reg, uses)));
            }
        }
        function updateTableContents() {
            //console.log("Loading the bundles");
            var mbean = Osgi.getSelectionBundleMBean(workspace);
            if (mbean) {
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'listBundles()' }, Core.onSuccess(populateTable));
            }
        }
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.BundlesController", ["$scope", "workspace", "jolokia", function ($scope, workspace, jolokia) {
        $scope.result = {};
        $scope.bundles = [];
        $scope.selected = [];
        $scope.loading = true;
        $scope.bundleUrl = "";
        $scope.installDisabled = function () {
            return $scope.bundleUrl === "";
        };
        var columnDefs = [
            {
                field: 'Identifier',
                displayName: 'Identifier',
                width: "48",
                headerCellTemplate: '<div ng-click="col.sort()" class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{\'cursor\': col.cursor}" ng-class="{ \'ngSorted\': !noSortVisible }"><div class="ngHeaderText colt{{$index}} pagination-centered" title="Identifier"><i class="fa fa-tag"></i></div><div class="ngSortButtonDown" ng-show="col.showSortButtonDown()"></div><div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div></div>',
            },
            {
                field: 'State',
                displayName: 'Bundle State',
                width: "24",
                headerCellTemplate: '<div ng-click="col.sort()" class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{\'cursor\': col.cursor}" ng-class="{ \'ngSorted\': !noSortVisible }"><div class="ngHeaderText colt{{$index}} pagination-centered" title="State"><i class="fa fa-tasks"></i></div><div class="ngSortButtonDown" ng-show="col.showSortButtonDown()"></div><div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div></div>',
                cellTemplate: '<div class="ngCellText" title="{{row.getProperty(col.field)}}"><i class="{{row.getProperty(col.field)}}"></i></div>'
            },
            {
                field: 'Name',
                displayName: 'Name',
                width: "***",
                cellTemplate: '<div class="ngCellText"><a href="#/osgi/bundle/{{row.entity.Identifier}}?p=container">{{row.getProperty(col.field)}}</a></div>'
            },
            {
                field: 'SymbolicName',
                displayName: 'Symbolic Name',
                width: "***",
                cellTemplate: '<div class="ngCellText"><a href="#/osgi/bundle/{{row.entity.Identifier}}?p=container">{{row.getProperty(col.field)}}</a></div>'
            },
            {
                field: 'Version',
                displayName: 'Version',
                width: "**"
            },
            {
                field: 'Location',
                displayName: 'Update Location',
                width: "***"
            }
        ];
        $scope.gridOptions = {
            data: 'bundles',
            showFilter: false,
            selectedItems: $scope.selected,
            selectWithCheckboxOnly: true,
            columnDefs: columnDefs,
            filterOptions: {
                filterText: ''
            }
        };
        $scope.onResponse = function () {
            jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionBundleMBean(workspace),
                operation: 'listBundles()'
            }, {
                success: render,
                error: render
            });
        };
        $scope.controlBundles = function (op) {
            var startBundle = function (response) {
            };
            var ids = $scope.selected.map(function (b) {
                return b.Identifier;
            });
            if (!angular.isArray(ids)) {
                ids = [ids];
            }
            jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionFrameworkMBean(workspace),
                operation: op,
                arguments: [ids]
            }, {
                success: $scope.onResponse,
                error: $scope.onResponse
            });
        };
        $scope.stop = function () {
            $scope.controlBundles('stopBundles([J)');
        };
        $scope.start = function () {
            $scope.controlBundles('startBundles([J)');
        };
        $scope.update = function () {
            $scope.controlBundles('updateBundles([J)');
        };
        $scope.refresh = function () {
            $scope.controlBundles('refreshBundles([J)');
        };
        $scope.uninstall = function () {
            $scope.controlBundles('uninstallBundles([J)');
        };
        $scope.install = function () {
            jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionFrameworkMBean(workspace),
                operation: "installBundle(java.lang.String)",
                arguments: [$scope.bundleUrl]
            }, {
                success: function (response) {
                    console.log("Got: ", response);
                    $scope.bundleUrl = "";
                    jolokia.request({
                        type: 'exec',
                        mbean: Osgi.getSelectionFrameworkMBean(workspace),
                        operation: "startBundle(long)",
                        arguments: [response.value]
                    }, {
                        success: $scope.onResponse,
                        error: $scope.onResponse
                    });
                },
                error: function (response) {
                    $scope.bundleUrl = "";
                    $scope.onResponse();
                }
            });
        };
        function render(response) {
            if (!angular.equals($scope.result, response.value)) {
                $scope.selected.length = 0;
                $scope.result = response.value;
                $scope.bundles = [];
                angular.forEach($scope.result, function (value, key) {
                    var obj = {
                        Identifier: value.Identifier,
                        Name: "",
                        SymbolicName: value.SymbolicName,
                        State: value.State,
                        Version: value.Version,
                        LastModified: value.LastModified,
                        Location: value.Location
                    };
                    if (value.Headers['Bundle-Name']) {
                        obj.Name = value.Headers['Bundle-Name']['Value'];
                    }
                    $scope.bundles.push(obj);
                });
                $scope.loading = false;
                Core.$apply($scope);
            }
        }
        Core.register(jolokia, $scope, {
            type: 'exec',
            mbean: Osgi.getSelectionBundleMBean(workspace),
            operation: 'listBundles()'
        }, Core.onSuccess(render));
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.ConfigurationsController", ["$scope", "$routeParams", "$location", "workspace", "jolokia", function ($scope, $routeParams, $location, workspace, jolokia) {
        $scope.selectedItems = [];
        $scope.grid = {
            data: 'configurations',
            showFilter: false,
            showColumnMenu: false,
            multiSelect: false,
            filterOptions: {
                filterText: "",
                useExternalFilter: false
            },
            selectedItems: $scope.selectedItems,
            showSelectionCheckbox: false,
            displaySelectionCheckbox: false,
            columnDefs: [
                {
                    field: 'Pid',
                    displayName: 'Configuration',
                    cellTemplate: '<div class="ngCellText"><a ng-href="{{row.entity.pidLink}}" title="{{row.entity.description}}">{{row.entity.name}}</a></div>'
                }
            ]
        };
        /** the kinds of config */
        var configKinds = {
            factory: {
                class: "badge badge-info",
                title: "Configuration factory used to create separate instances of the configuration"
            },
            pid: {
                class: "badge badge-success",
                title: "Configuration which has a set of properties associated with it"
            },
            pidNoValue: {
                class: "badge badge-warning",
                title: "Configuration which does not yet have any bound values"
            }
        };
        $scope.addPidDialog = new UI.Dialog();
        $scope.addPid = function (newPid) {
            if ($scope.configurations.any(function (c) { return c['pid'] == newPid; })) {
                Core.notification("error", "pid \"" + newPid + "\" already exists.");
                return;
            }
            $scope.addPidDialog.close();
            var mbean = Osgi.getHawtioConfigAdminMBean($scope.workspace);
            if (mbean && newPid) {
                var json = JSON.stringify({});
                $scope.jolokia.execute(mbean, "configAdminUpdate", newPid, json, Core.onSuccess(function (response) {
                    Core.notification("success", "Successfully created pid: " + newPid);
                    updateTableContents();
                }));
            }
        };
        $scope.$on("$routeChangeSuccess", function (event, current, previous) {
            // lets do this asynchronously to avoid Error: $digest already in progress
            setTimeout(updateTableContents, 50);
        });
        function onConfigPids(response) {
            var pids = {};
            angular.forEach(response, function (row) {
                var pid = row[0];
                var bundle = row[1];
                var config = createPidConfig(pid, bundle);
                if (!ignorePid(pid)) {
                    config["hasValue"] = true;
                    config["kind"] = configKinds.pid;
                    pids[pid] = config;
                }
            });
            $scope.pids = pids;
            // lets load the factory pids
            var mbean = Osgi.getSelectionConfigAdminMBean($scope.workspace);
            if (mbean) {
                $scope.jolokia.execute(mbean, 'getConfigurations', '(service.factoryPid=*)', Core.onSuccess(onConfigFactoryPids, errorHandler("Failed to load factory PID configurations: ")));
            }
            loadMetaType();
        }
        /**
         * For each factory PID lets find the underlying PID to use to edit it, then lets make a link between them
         */
        function onConfigFactoryPids(response) {
            var mbean = Osgi.getSelectionConfigAdminMBean($scope.workspace);
            var pids = $scope.pids;
            if (pids && mbean) {
                angular.forEach(response, function (row) {
                    var pid = row[0];
                    var bundle = row[1];
                    if (pid && !ignorePid(pid)) {
                        var config = pids[pid];
                        if (config) {
                            config["isFactoryInstance"] = true;
                            $scope.jolokia.execute(mbean, 'getFactoryPid', pid, Core.onSuccess(function (factoryPid) {
                                config["factoryPid"] = factoryPid;
                                config["name"] = Osgi.removeFactoryPidPrefix(pid, factoryPid);
                                if (factoryPid) {
                                    var factoryConfig = getOrCreatePidConfig(factoryPid, bundle, pids);
                                    if (factoryConfig) {
                                        configureFactoryPidConfig(pid, factoryConfig, config);
                                        if ($scope.inFabricProfile) {
                                            Osgi.getConfigurationProperties($scope.workspace, $scope.jolokia, pid, function (configValues) {
                                                var zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);
                                                if (zkPid) {
                                                    config["name"] = Osgi.removeFactoryPidPrefix(zkPid, factoryPid);
                                                    config["zooKeeperPid"] = zkPid;
                                                    Core.$apply($scope);
                                                }
                                            });
                                        }
                                        Core.$apply($scope);
                                    }
                                }
                            }));
                        }
                    }
                });
            }
            updateMetaType();
        }
        function onMetaType(response) {
            $scope.metaType = response;
            updateMetaType();
        }
        function updateConfigurations() {
            var pids = $scope.pids;
            var configurations = [];
            angular.forEach(pids, function (config, pid) {
                if (!config["isFactoryInstance"]) {
                    configurations.push(config);
                }
            });
            $scope.configurations = configurations.sortBy("name");
            Core.$apply($scope);
        }
        function updateMetaType(lazilyCreateConfigs) {
            if (lazilyCreateConfigs === void 0) { lazilyCreateConfigs = true; }
            var metaType = $scope.metaType;
            if (metaType) {
                var pidMetadata = Osgi.configuration.pidMetadata;
                var pids = $scope.pids || {};
                angular.forEach(metaType.pids, function (value, pid) {
                    var bundle = null;
                    var config = lazilyCreateConfigs ? getOrCreatePidConfig(pid, bundle) : pids[pid];
                    if (config) {
                        var factoryPidBundleIds = value.factoryPidBundleIds;
                        if (factoryPidBundleIds && factoryPidBundleIds.length) {
                            setFactoryPid(config);
                        }
                        config["name"] = Core.pathGet(pidMetadata, [pid, "name"]) || trimUnnecessaryPrefixes(value.name) || pid;
                        var description = Core.pathGet(pidMetadata, [pid, "description"]) || value.description;
                        /*
                                    if (description) {
                                      description = description + "\n" + pidBundleDescription(pid, config.bundle);
                                    }
                        */
                        config["description"] = description;
                    }
                });
            }
            updateConfigurations();
        }
        function loadMetaType() {
            if ($scope.pids) {
                if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
                    jolokia.execute($scope.profileMetadataMBean, "metaTypeSummary", $scope.versionId, $scope.profileId, Core.onSuccess(onMetaType));
                }
                else {
                    var metaTypeMBean = Osgi.getMetaTypeMBean($scope.workspace);
                    if (metaTypeMBean) {
                        $scope.jolokia.execute(metaTypeMBean, "metaTypeSummary", Core.onSuccess(onMetaType));
                    }
                }
            }
        }
        function updateTableContents() {
            $scope.configurations = [];
            if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
                jolokia.execute($scope.profileMetadataMBean, "metaTypeSummary", $scope.versionId, $scope.profileId, Core.onSuccess(onProfileMetaType, { silent: true }));
            }
            else {
                if ($scope.jolokia) {
                    var mbean = Osgi.getSelectionConfigAdminMBean($scope.workspace);
                    if (mbean) {
                        $scope.jolokia.execute(mbean, 'getConfigurations', '(service.pid=*)', Core.onSuccess(onConfigPids, errorHandler("Failed to load PID configurations: ")));
                    }
                }
            }
        }
        function onProfileMetaType(response) {
            var metaType = response;
            if (metaType) {
                var pids = {};
                angular.forEach(metaType.pids, function (value, pid) {
                    if (value && !ignorePid(pid)) {
                        // TODO we don't have a bundle ID
                        var bundle = "mvn:" + pid;
                        var config = {
                            pid: pid,
                            name: value.name,
                            class: 'pid',
                            description: value.description,
                            bundle: bundle,
                            kind: configKinds.pid,
                            pidLink: createPidLink(pid)
                        };
                        pids[pid] = config;
                    }
                });
                angular.forEach(pids, function (config, pid) {
                    var idx = pid.indexOf('-');
                    if (idx > 0) {
                        var factoryPid = pid.substring(0, idx);
                        var name = pid.substring(idx + 1, pid.length);
                        var factoryConfig = pids[factoryPid];
                        if (!factoryConfig) {
                            var bundle = config.bundle;
                            factoryConfig = getOrCreatePidConfig(factoryPid, bundle, pids);
                        }
                        if (factoryConfig) {
                            configureFactoryPidConfig(pid, factoryConfig, config, factoryPid);
                            config.name = name;
                            pids[factoryPid] = factoryConfig;
                            // lets remove the pid instance as its now a child of the factory
                            delete pids[pid];
                        }
                    }
                });
                $scope.pids = pids;
            }
            // now lets process the response and replicate the getConfigurations / getProperties API
            // calls on the OSGi API
            // to get the tree of factory pids or pids
            $scope.metaType = metaType;
            updateMetaType(false);
        }
        function trimUnnecessaryPrefixes(name) {
            angular.forEach(["Fabric8 ", "Apache "], function (prefix) {
                if (name && name.startsWith(prefix) && name.length > prefix.length) {
                    name = name.substring(prefix.length);
                }
            });
            return name;
        }
        function pidBundleDescription(pid, bundle) {
            var pidMetadata = Osgi.configuration.pidMetadata;
            return Core.pathGet(pidMetadata, [pid, "description"]) || "pid: " + pid + "\nbundle: " + bundle;
        }
        function createPidConfig(pid, bundle) {
            var pidMetadata = Osgi.configuration.pidMetadata;
            var config = {
                pid: pid,
                name: Core.pathGet(pidMetadata, [pid, "name"]) || pid,
                class: 'pid',
                description: Core.pathGet(pidMetadata, [pid, "description"]) || pidBundleDescription(pid, bundle),
                bundle: bundle,
                kind: configKinds.pidNoValue,
                pidLink: createPidLink(pid)
            };
            return config;
        }
        function ignorePid(pid) {
            var answer = false;
            angular.forEach(Osgi.configuration.ignorePids, function (pattern) {
                if (pid.startsWith(pattern)) {
                    answer = true;
                }
            });
            return answer;
        }
        function getOrCreatePidConfig(pid, bundle, pids) {
            if (pids === void 0) { pids = null; }
            if (ignorePid(pid)) {
                Osgi.log.info("ignoring pid " + pid);
                return null;
            }
            else {
                if (!pids) {
                    pids = $scope.pids;
                }
                var factoryConfig = pids[pid];
                if (!factoryConfig) {
                    factoryConfig = createPidConfig(pid, bundle);
                    pids[pid] = factoryConfig;
                    updateConfigurations();
                }
                return factoryConfig;
            }
        }
        function configureFactoryPidConfig(pid, factoryConfig, config, factoryPid) {
            if (factoryPid === void 0) { factoryPid = null; }
            setFactoryPid(factoryConfig, factoryPid, pid);
            //config["pidLink"] = createPidLink(pid, factoryPid);
            var children = factoryConfig.children;
            if (factoryPid) {
                factoryConfig.pidLink = createPidLink(factoryPid, true);
            }
            if (!children) {
                children = {};
                factoryConfig["children"] = children;
            }
            children[pid] = config;
        }
        function setFactoryPid(factoryConfig, factoryPid, pid) {
            if (factoryPid === void 0) { factoryPid = null; }
            if (pid === void 0) { pid = null; }
            factoryConfig["isFactory"] = true;
            factoryConfig["class"] = "factoryPid";
            factoryConfig["kind"] = configKinds.factory;
            if (!factoryPid) {
                factoryPid = factoryConfig["factoryPid"] || "";
            }
            if (!pid) {
                pid = factoryConfig["pid"] || "";
            }
            if (!factoryPid) {
                factoryPid = pid;
                pid = null;
            }
            factoryConfig["pidLink"] = createPidLink(factoryPid);
        }
        function createPidLink(pid, isFactory) {
            if (isFactory === void 0) { isFactory = false; }
            return Osgi.createConfigPidLink($scope, workspace, pid, isFactory);
        }
        function errorHandler(message) {
            return {
                error: function (response) {
                    Core.notification("error", message + response['error'] || response);
                    Core.defaultJolokiaErrorHandler(response);
                }
            };
        }
        // load the data
        updateTableContents();
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.FrameworkController", ["$scope", "$dialog", "workspace", function ($scope, $dialog, workspace) {
        $scope.editDialog = new UI.Dialog();
        updateContents();
        $scope.edit = function (attr, displayName) {
            $scope.editAttr = attr;
            $scope.editDisplayName = displayName;
            $scope.editDialog.open();
        };
        $scope.edited = function (name, displayName, res) {
            $scope.editDialog.close();
            if (angular.isNumber(res)) {
                var mbean = Osgi.getSelectionFrameworkMBean(workspace);
                if (mbean) {
                    var jolokia = workspace.jolokia;
                    jolokia.request({
                        type: 'write',
                        mbean: mbean,
                        attribute: name,
                        value: res
                    }, {
                        error: function (response) {
                            editWritten("error", response.error);
                        },
                        success: function (response) {
                            editWritten("success", displayName + " changed to " + res);
                        }
                    });
                }
            }
        };
        function editWritten(status, message) {
            Core.notification(status, message);
            updateContents();
        }
        function populatePage(response) {
            $scope.startLevel = response.value.FrameworkStartLevel;
            $scope.initialBundleStartLevel = response.value.InitialBundleStartLevel;
            Core.$apply($scope);
        }
        function updateContents() {
            var mbean = Osgi.getSelectionFrameworkMBean(workspace);
            if (mbean) {
                var jolokia = workspace.jolokia;
                jolokia.request({ type: 'read', mbean: mbean }, Core.onSuccess(populatePage));
            }
        }
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi.configuration = {
        // extra metadata per config admin PID
        pidMetadata: {
            "io.fabric8.container.java": {
                name: "Java Container"
            },
            "io.fabric8.container.process": {
                name: "Process Container"
            },
            "io.fabric8.container.process.overlay.resources": {
                name: "Container Overlay Resources",
                description: "The resources overlaid over the distribution of the process",
                schemaExtensions: {
                    disableHumanizeLabel: true
                }
            },
            "io.fabric8.dosgi": {
                name: "Fabric8 DOSGi",
                description: "The configuration for the Distributed OSGi implementation in Fabric8"
            },
            "io.fabric8.environment": {
                name: "Environment Variables",
                description: "The operating system Environment Variables which are exported into any child processes",
                schemaExtensions: {
                    disableHumanizeLabel: true
                }
            },
            "io.fabric8.fab.osgi.url": {
                name: "FAB URL",
                description: "Configures the 'fab:' URL handler for deploying JARs as bundles"
            },
            "io.fabric8.mq.fabric.server": {
                name: "ActiveMQ Broker",
                description: "The configuration of the Apache ActiveMQ server configured via the fabric"
            },
            "io.fabric8.openshift": {
                name: "OpenShift"
            },
            "io.fabric8.ports": {
                name: "Ports",
                description: "The network ports exported by the container",
                schemaExtensions: {
                    disableHumanizeLabel: true
                }
            },
            "io.fabric8.system": {
                name: "System Properties",
                description: "The Java System Properties which are exported into any child Java processes",
                schemaExtensions: {
                    disableHumanizeLabel: true
                }
            },
            "io.fabric8.version": {
                name: "Versions",
                schemaExtensions: {
                    disableHumanizeLabel: true
                }
            },
            "org.ops4j.pax.logging": {
                name: "Logging",
                description: "The configuration of the logging subsystem"
            },
            "org.ops4j.pax.url.mvn": {
                name: "Maven URL",
                description: "Configures the Maven 'mvn:' URL handler for referencing maven artifacts"
            },
            "org.ops4j.pax.url.war": {
                name: "WAR URL",
                description: "Configures the 'war:' URL handler for referencing WAR deployments"
            },
            "org.ops4j.pax.url.wrap": {
                name: "Wrap URL",
                description: "Configures the 'wrap:' URL handler for wrapping JARs as bundles"
            }
        },
        // pids to ignore from the config UI
        ignorePids: [
            "jmx.acl",
            "io.fabric8.agent",
            "io.fabric8.git",
            "io.fabric8.mq.fabric.template",
            "io.fabric8.openshift.agent",
            "io.fabric8.service.ZkDataStoreImpl",
            "org.apache.felix.fileinstall",
            "org.apache.karaf.command.acl.",
            "org.apache.karaf.service.acl."
        ],
        // UI tabs
        tabs: {
            "fabric8": {
                label: "Fabric8",
                description: "Configuration options for the Fabric8 services",
                pids: ["io.fabric8"]
            },
            "karaf": {
                label: "Karaf",
                description: "Configuration options for the Apache Karaf container and subsystem",
                pids: ["org.apache.karaf"]
            }
        }
    };
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    var OsgiGraphBuilder = (function () {
        function OsgiGraphBuilder(osgiDataService, bundleFilter, packageFilter, showServices, showPackages, hideUnused) {
            this.filteredBundles = {};
            this.bundles = null;
            this.services = null;
            this.packages = null;
            this.PREFIX_BUNDLE = "Bundle-";
            this.PREFIX_SVC = "Service-";
            this.PREFIX_PKG = "Package-";
            this.osgiDataService = osgiDataService;
            this.bundleFilter = bundleFilter;
            this.packageFilter = packageFilter;
            this.showServices = showServices;
            this.showPackages = showPackages;
            this.hideUnused = hideUnused;
            this.graphBuilder = new ForceGraph.GraphBuilder();
        }
        OsgiGraphBuilder.prototype.getBundles = function () {
            if (this.bundles == null) {
                this.bundles = this.osgiDataService.getBundles();
            }
            return this.bundles;
        };
        OsgiGraphBuilder.prototype.getServices = function () {
            if (this.services == null) {
                this.services = this.osgiDataService.getServices();
            }
            return this.services;
        };
        OsgiGraphBuilder.prototype.getPackages = function () {
            if (this.packages == null) {
                this.packages = this.osgiDataService.getPackages();
            }
            return this.packages;
        };
        OsgiGraphBuilder.prototype.bundleNodeId = function (bundle) {
            return this.PREFIX_BUNDLE + bundle.Identifier;
        };
        OsgiGraphBuilder.prototype.serviceNodeId = function (service) {
            return this.PREFIX_SVC + service.Identifier;
        };
        OsgiGraphBuilder.prototype.pkgNodeId = function (pkg) {
            return this.PREFIX_PKG + pkg.Name + "-" + pkg.Version;
        };
        // Create a service node from a given service
        OsgiGraphBuilder.prototype.buildSvcNode = function (service) {
            return {
                id: this.serviceNodeId(service),
                name: "" + service.Identifier,
                type: "service",
                used: false,
                //                image: {
                //                    url: "/img/icons/osgi/service.png",
                //                    width: 32,
                //                    height:32
                //                },
                popup: {
                    title: "Service [" + service.Identifier + "]",
                    content: (function () {
                        var result = "";
                        if (service != null) {
                            service.objectClass.forEach(function (clazz) {
                                if (result.length > 0) {
                                    result = result + "<br/>";
                                }
                                result = result + clazz;
                            });
                        }
                        return result;
                    })
                }
            };
        };
        // Create a bundle node for a given bundle
        OsgiGraphBuilder.prototype.buildBundleNode = function (bundle) {
            return {
                id: this.bundleNodeId(bundle),
                name: bundle.SymbolicName,
                type: "bundle",
                used: false,
                navUrl: "#/osgi/bundle/" + bundle.Identifier,
                //                image: {
                //                    url: "/img/icons/osgi/bundle.png",
                //                    width: 32,
                //                    height:32
                //                },
                popup: {
                    title: "Bundle [" + bundle.Identifier + "]",
                    content: "<p>" + bundle.SymbolicName + "<br/>Version " + bundle.Version + "</p>"
                }
            };
        };
        OsgiGraphBuilder.prototype.buildPackageNode = function (pkg) {
            return {
                id: this.pkgNodeId(pkg),
                name: pkg.Name,
                type: "package",
                used: false,
                popup: {
                    title: "Package [" + pkg.Name + "]",
                    content: "<p>" + pkg.Version + "</p>"
                }
            };
        };
        OsgiGraphBuilder.prototype.exportingBundle = function (pkg) {
            var _this = this;
            var result = null;
            pkg.ExportingBundles.forEach(function (bundleId) {
                if (_this.filteredBundles[_this.PREFIX_BUNDLE + bundleId] != null) {
                    result = bundleId;
                }
            });
            return result;
        };
        OsgiGraphBuilder.prototype.addFilteredBundles = function () {
            var _this = this;
            d3.values(this.getBundles()).forEach(function (bundle) {
                if (_this.bundleFilter == null || _this.bundleFilter == "" || bundle.SymbolicName.startsWith(_this.bundleFilter)) {
                    var bundleNode = _this.buildBundleNode(bundle);
                    _this.filteredBundles[bundleNode.id] = bundle;
                    bundleNode.used = true;
                    _this.graphBuilder.addNode(bundleNode);
                    if (_this.showServices) {
                        var services = _this.getServices();
                        bundle.RegisteredServices.forEach(function (sid) {
                            var svc = services[sid];
                            if (svc) {
                                var svcNode = _this.buildSvcNode(services[sid]);
                                _this.graphBuilder.addNode(svcNode);
                                _this.graphBuilder.addLink(bundleNode.id, svcNode.id, "registered");
                            }
                        });
                    }
                }
            });
        };
        OsgiGraphBuilder.prototype.addFilteredServices = function () {
            var _this = this;
            if (this.showServices) {
                d3.values(this.getBundles()).forEach(function (bundle) {
                    bundle.ServicesInUse.forEach(function (sid) {
                        var svcNodeId = _this.PREFIX_SVC + sid;
                        if (_this.graphBuilder.getNode(svcNodeId) != null) {
                            _this.graphBuilder.getNode(svcNodeId).used = true;
                            var bundleNode = _this.graphBuilder.getNode(_this.bundleNodeId(bundle)) || _this.buildBundleNode(bundle);
                            bundleNode.used = true;
                            _this.graphBuilder.addNode(bundleNode);
                            _this.graphBuilder.addLink(svcNodeId, bundleNode.id, "inuse");
                        }
                    });
                });
            }
        };
        OsgiGraphBuilder.prototype.addFilteredPackages = function () {
            var _this = this;
            if (this.showPackages) {
                d3.values(this.getPackages()).forEach(function (pkg) {
                    if (_this.packageFilter == null || _this.packageFilter == "" || pkg.Name.startsWith(_this.packageFilter)) {
                        var exportingId = _this.exportingBundle(pkg);
                        if (exportingId != null) {
                            var bundleNode = _this.graphBuilder.getNode(_this.PREFIX_BUNDLE + exportingId);
                            bundleNode.used = true;
                            var pkgNode = _this.buildPackageNode(pkg);
                            _this.graphBuilder.addNode(pkgNode);
                            _this.graphBuilder.addLink(bundleNode.id, pkgNode.id, "registered");
                            pkg.ImportingBundles.forEach(function (bundleId) {
                                var bundleNode = _this.graphBuilder.getNode(_this.PREFIX_BUNDLE + bundleId) || _this.buildBundleNode(_this.getBundles()[bundleId]);
                                bundleNode.used = true;
                                pkgNode.used = true;
                                _this.graphBuilder.addNode(bundleNode);
                                _this.graphBuilder.addLink(bundleNode.id, pkgNode.id, "inuse");
                            });
                        }
                    }
                });
            }
        };
        OsgiGraphBuilder.prototype.buildGraph = function () {
            var _this = this;
            this.addFilteredBundles();
            this.addFilteredServices();
            this.addFilteredPackages();
            if (this.hideUnused) {
                // this will filter out all nodes that are not marked as used in our data model
                this.graphBuilder.filterNodes(function (node) {
                    return node.used;
                });
                // this will remove all nodes that do not have connections after filtering the unused nodes
                this.graphBuilder.filterNodes(function (node) {
                    return _this.graphBuilder.hasLinks(node.id);
                });
            }
            return this.graphBuilder.buildGraph();
        };
        return OsgiGraphBuilder;
    })();
    Osgi.OsgiGraphBuilder = OsgiGraphBuilder;
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
var Osgi;
(function (Osgi) {
    Osgi.TopLevelController = Osgi._module.controller("Osgi.TopLevelController", ["$scope", "workspace", function ($scope, workspace) {
        $scope.frameworkMBean = Osgi.getSelectionFrameworkMBean(workspace);
        $scope.bundleMBean = Osgi.getSelectionBundleMBean(workspace);
        $scope.serviceMBean = Osgi.getSelectionServiceMBean(workspace);
        $scope.packageMBean = Osgi.getSelectionPackageMBean(workspace);
        $scope.configAdminMBean = Osgi.getSelectionConfigAdminMBean(workspace);
        $scope.metaTypeMBean = Osgi.getMetaTypeMBean(workspace);
        $scope.osgiToolsMBean = Osgi.getHawtioOSGiToolsMBean(workspace);
        $scope.hawtioConfigAdminMBean = Osgi.getHawtioConfigAdminMBean(workspace);
        $scope.scrMBean = Karaf.getSelectionScrMBean(workspace);
        $scope.featuresMBean = Karaf.getSelectionFeaturesMBean(workspace);
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.PackageController", ["$scope", "$filter", "workspace", "$routeParams", function ($scope, $filter, workspace, $routeParams) {
        $scope.package = $routeParams.package;
        $scope.version = $routeParams.version;
        updateTableContents();
        function populateTable(response) {
            var packages = Osgi.defaultPackageValues(workspace, $scope, response.value);
            $scope.row = packages.filter({ "Name": $scope.package, "Version": $scope.version })[0];
            Core.$apply($scope);
        }
        ;
        function updateTableContents() {
            var mbean = Osgi.getSelectionPackageMBean(workspace);
            if (mbean) {
                var jolokia = workspace.jolokia;
                jolokia.request({ type: 'exec', mbean: mbean, operation: 'listPackages' }, Core.onSuccess(populateTable));
            }
        }
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi.PackagesController = Osgi._module.controller("Osgi.PackagesController", ["$scope", "$filter", "workspace", "$templateCache", "$compile", function ($scope, $filter, workspace, $templateCache, $compile) {
        var dateFilter = $filter('date');
        $scope.packages = [];
        $scope.selectedItems = [];
        $scope.mygrid = {
            data: 'packages',
            showFilter: false,
            showColumnMenu: false,
            filterOptions: {
                filterText: "",
                useExternalFilter: false
            },
            selectedItems: $scope.selectedItems,
            rowHeight: 32,
            selectWithCheckboxOnly: true,
            columnDefs: [
                {
                    field: 'Name',
                    displayName: 'Name',
                    width: "***"
                },
                {
                    field: 'VersionLink',
                    displayName: 'Version',
                    width: "***"
                },
                {
                    field: 'RemovalPending',
                    displayName: 'Removal Pending',
                    width: "***"
                }
            ]
        };
        /*
            $scope.widget = new DataTable.TableWidget($scope, $templateCache, $compile, [
              <DataTable.TableColumnConfig> {
                "mDataProp": null,
                "sClass": "control center",
                "sDefaultContent": '<i class="fa fa-plus"></i>'
              },
              <DataTable.TableColumnConfig> { "mDataProp": "Name" },
              <DataTable.TableColumnConfig> { "mDataProp": "VersionLink" },
              <DataTable.TableColumnConfig> { "mDataProp": "RemovalPending" }
        
            ], {
              rowDetailTemplateId: 'packageBundlesTemplate',
              disableAddColumns: true
            });
        
        */
        $scope.$watch('workspace.selection', function () {
            updateTableContents();
        });
        function populateTable(response) {
            var packages = Osgi.defaultPackageValues(workspace, $scope, response.value);
            augmentPackagesInfo(packages);
        }
        function augmentPackagesInfo(packages) {
            var bundleMap = {};
            var createBundleMap = function (response) {
                angular.forEach(response.value, function (value, key) {
                    var obj = {
                        Identifier: value.Identifier,
                        Name: "",
                        SymbolicName: value.SymbolicName,
                        State: value.State,
                        Version: value.Version,
                        LastModified: value.LastModified,
                        Location: value.Location
                    };
                    if (value.Headers['Bundle-Name']) {
                        obj.Name = value.Headers['Bundle-Name']['Value'];
                    }
                    bundleMap[obj.Identifier] = obj;
                });
                angular.forEach(packages, function (p, key) {
                    angular.forEach(p["ExportingBundles"], function (b, key) {
                        p["ExportingBundles"][key] = bundleMap[b];
                    });
                    angular.forEach(p["ImportingBundles"], function (b, key) {
                        p["ImportingBundles"][key] = bundleMap[b];
                    });
                });
                $scope.packages = packages;
                Core.$apply($scope);
            };
            workspace.jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionBundleMBean(workspace),
                operation: 'listBundles()'
            }, {
                success: createBundleMap,
                error: createBundleMap
            });
        }
        function updateTableContents() {
            var mbean = Osgi.getSelectionPackageMBean(workspace);
            if (mbean) {
                var jolokia = workspace.jolokia;
                // bundles first:
                jolokia.request({
                    type: 'exec',
                    mbean: mbean,
                    operation: 'listPackages'
                }, Core.onSuccess(populateTable));
            }
        }
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.PidController", ["$scope", "$timeout", "$routeParams", "$location", "workspace", "jolokia", function ($scope, $timeout, $routeParams, $location, workspace, jolokia) {
        $scope.deletePropDialog = new UI.Dialog();
        $scope.deletePidDialog = new UI.Dialog();
        $scope.addPropertyDialog = new UI.Dialog();
        $scope.factoryPid = $routeParams.factoryPid;
        $scope.pid = $routeParams.pid;
        $scope.createForm = {
            pidInstanceName: null
        };
        $scope.newPid = $scope.factoryPid && !$scope.pid;
        if ($scope.newPid) {
            $scope.editMode = true;
        }
        if ($scope.pid && !$scope.factoryPid) {
            var idx = $scope.pid.indexOf("-");
            if (idx > 0) {
                $scope.factoryPid = $scope.pid.substring(0, idx);
                $scope.factoryInstanceName = $scope.pid.substring(idx + 1, $scope.pid.length);
            }
        }
        $scope.selectValues = {};
        $scope.modelLoaded = false;
        $scope.canSave = false;
        $scope.setEditMode = function (flag) {
            $scope.editMode = flag;
            $scope.formMode = flag ? "edit" : "view";
            if (!flag || !$scope.entity) {
                $scope.entity = {};
                updateTableContents();
            }
        };
        var startInEditMode = $scope.factoryPid && !$routeParams.pid;
        $scope.setEditMode(startInEditMode);
        $scope.$on("hawtio.form.modelChange", function () {
            if ($scope.modelLoaded) {
                // TODO lets check if we've really changed the values!
                enableCanSave();
                Core.$apply($scope);
            }
        });
        function updatePid(mbean, pid, data) {
            var completeFn = function (response) {
                Core.notification("success", "Successfully updated pid: " + pid);
                if (pid && $scope.factoryPid && $scope.newPid) {
                    // we've just created a new pid so lets move to the full pid URL
                    var newPath = Osgi.createConfigPidPath($scope, pid);
                    $location.path(newPath);
                }
                else {
                    $scope.setEditMode(false);
                    $scope.canSave = false;
                    $scope.saved = true;
                }
            };
            var callback = Core.onSuccess(completeFn, errorHandler("Failed to update: " + pid));
            var json = JSON.stringify(data);
            $scope.jolokia.execute(mbean, "configAdminUpdate", pid, json, callback);
        }
        $scope.pidSave = function () {
            var data = {};
            angular.forEach($scope.entity, function (value, key) {
                var text = undefined;
                if (angular.isString(value)) {
                    text = value;
                }
                else if (angular.isDefined(value)) {
                    text = value.toString();
                }
                if (angular.isDefined(text)) {
                    data[decodeKey(key, $scope.pid)] = text;
                }
            });
            //log.info("about to update value " + angular.toJson(data));
            var mbean = Osgi.getHawtioConfigAdminMBean(workspace);
            if (mbean || $scope.inFabricProfile) {
                var pidMBean = Osgi.getSelectionConfigAdminMBean($scope.workspace);
                var pid = $scope.pid;
                var zkPid = $scope.zkPid;
                var factoryPid = $scope.factoryPid;
                if (!$scope.inFabricProfile && factoryPid && pidMBean && !zkPid) {
                    // lets generate a new pid
                    $scope.jolokia.execute(pidMBean, "createFactoryConfiguration", factoryPid, Core.onSuccess(function (response) {
                        pid = response;
                        if (pid) {
                            updatePid(mbean, pid, data);
                        }
                    }, errorHandler("Failed to create new PID: ")));
                }
                else {
                    if ($scope.newPid) {
                        var pidInstanceName = $scope.createForm.pidInstanceName;
                        if (!pidInstanceName || !factoryPid) {
                            return;
                        }
                        pid = factoryPid + "-" + pidInstanceName;
                    }
                    else if (zkPid) {
                        pid = zkPid;
                    }
                    updatePid(mbean, pid, data);
                }
            }
        };
        function errorHandler(message) {
            return {
                error: function (response) {
                    Core.notification("error", message + "\n" + response['error'] || response);
                    Core.defaultJolokiaErrorHandler(response);
                }
            };
        }
        function enableCanSave() {
            if ($scope.editMode) {
                $scope.canSave = true;
            }
        }
        $scope.addPropertyConfirmed = function (key, value) {
            $scope.addPropertyDialog.close();
            $scope.configValues[key] = {
                Key: key,
                Value: value,
                Type: "String"
            };
            enableCanSave();
            updateSchema();
        };
        $scope.deletePidProp = function (e) {
            $scope.deleteKey = e.Key;
            $scope.deletePropDialog.open();
        };
        $scope.deletePidPropConfirmed = function () {
            $scope.deletePropDialog.close();
            var cell = document.getElementById("pid." + $scope.deleteKey);
            cell.parentElement.remove();
            enableCanSave();
        };
        $scope.deletePidConfirmed = function () {
            $scope.deletePidDialog.close();
            function errorFn(response) {
                Core.notification("error", response.error);
            }
            function successFn(response) {
                Core.notification("success", "Successfully deleted pid: " + $scope.pid);
                $location.path($scope.configurationsLink);
            }
            var mbean = Osgi.getSelectionConfigAdminMBean($scope.workspace);
            if (mbean) {
                $scope.jolokia.request({
                    type: "exec",
                    mbean: mbean,
                    operation: 'delete',
                    arguments: [$scope.pid]
                }, {
                    error: errorFn,
                    success: successFn
                });
            }
        };
        function populateTable(response) {
            $scope.modelLoaded = true;
            var configValues = response || {};
            $scope.configValues = configValues;
            $scope.zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);
            if ($scope.zkPid && $scope.saved) {
                // lets load the current properties direct from git
                // in case we have just saved them into git and config admin hasn't yet
                // quite caught up yet (to avoid freaking the user out that things look like
                // changes got reverted ;)
                function onProfileProperties(gitProperties) {
                    angular.forEach(gitProperties, function (value, key) {
                        var configProperty = configValues[key];
                        if (configProperty) {
                            configProperty.Value = value;
                        }
                    });
                    updateSchemaAndLoadMetaType();
                    Core.$apply($scope);
                }
            }
            else {
                updateSchemaAndLoadMetaType();
            }
        }
        function updateSchemaAndLoadMetaType() {
            updateSchema();
            var configValues = $scope.configValues;
            if (configValues) {
                if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
                    var pid = $scope.factoryPid || $scope.pid;
                    jolokia.execute($scope.profileMetadataMBean, "getPidMetaTypeObject", $scope.versionId, $scope.profileId, pid, Core.onSuccess(onMetaType));
                }
                else {
                    var locale = null;
                    var pid = null;
                    var factoryId = configValues["service.factoryPid"];
                    if (factoryId && !pid) {
                        pid = factoryId["Value"];
                    }
                    var metaTypeMBean = Osgi.getMetaTypeMBean($scope.workspace);
                    if (metaTypeMBean) {
                        $scope.jolokia.execute(metaTypeMBean, "getPidMetaTypeObject", pid, locale, Core.onSuccess(onMetaType));
                    }
                }
            }
            Core.$apply($scope);
        }
        function onMetaType(response) {
            $scope.metaType = response;
            updateSchema();
            Core.$apply($scope);
        }
        /**
         * Updates the JSON schema model
         */
        function updateSchema() {
            var properties = {};
            var required = [];
            $scope.defaultValues = {};
            var schema = {
                type: "object",
                required: required,
                properties: properties
            };
            var inputClass = "span12";
            var labelClass = "control-label";
            //var inputClassArray = "span11";
            var inputClassArray = "";
            var labelClassArray = labelClass;
            var metaType = $scope.metaType;
            if (metaType) {
                var pidMetadata = Osgi.configuration.pidMetadata;
                var pid = metaType.id;
                schema["id"] = pid;
                schema["name"] = Core.pathGet(pidMetadata, [pid, "name"]) || metaType.name;
                schema["description"] = Core.pathGet(pidMetadata, [pid, "description"]) || metaType.description;
                var disableHumanizeLabel = Core.pathGet(pidMetadata, [pid, "schemaExtensions", "disableHumanizeLabel"]);
                angular.forEach(metaType.attributes, function (attribute) {
                    var id = attribute.id;
                    if (isValidProperty(id)) {
                        var key = encodeKey(id, pid);
                        var typeName = asJsonSchemaType(attribute.typeName, attribute.id);
                        var attributeProperties = {
                            title: attribute.name,
                            tooltip: attribute.description,
                            'input-attributes': {
                                class: inputClass
                            },
                            'label-attributes': {
                                class: labelClass
                            },
                            type: typeName
                        };
                        if (disableHumanizeLabel) {
                            attributeProperties.title = id;
                        }
                        if (attribute.typeName === "char") {
                            attributeProperties["maxLength"] = 1;
                            attributeProperties["minLength"] = 1;
                        }
                        var cardinality = attribute.cardinality;
                        if (cardinality) {
                            // lets clear the span on arrays to fix layout issues
                            attributeProperties['input-attributes']['class'] = null;
                            attributeProperties.type = "array";
                            attributeProperties["items"] = {
                                'input-attributes': {
                                    class: inputClassArray
                                },
                                'label-attributes': {
                                    class: labelClassArray
                                },
                                "type": typeName
                            };
                        }
                        if (attribute.required) {
                            required.push(id);
                        }
                        var defaultValue = attribute.defaultValue;
                        if (defaultValue) {
                            if (angular.isArray(defaultValue) && defaultValue.length === 1) {
                                defaultValue = defaultValue[0];
                            }
                            //attributeProperties["default"] = defaultValue;
                            // TODO convert to boolean / number?
                            $scope.defaultValues[key] = defaultValue;
                        }
                        var optionLabels = attribute.optionLabels;
                        var optionValues = attribute.optionValues;
                        if (optionLabels && optionLabels.length && optionValues && optionValues.length) {
                            var enumObject = {};
                            for (var i = 0; i < optionLabels.length; i++) {
                                var label = optionLabels[i];
                                var value = optionValues[i];
                                enumObject[value] = label;
                            }
                            $scope.selectValues[key] = enumObject;
                            Core.pathSet(attributeProperties, ['input-element'], "select");
                            Core.pathSet(attributeProperties, ['input-attributes', "ng-options"], "key as value for (key, value) in selectValues." + key);
                        }
                        properties[key] = attributeProperties;
                    }
                });
                // now lets override anything from the custom metadata
                var schemaExtensions = Core.pathGet(Osgi.configuration.pidMetadata, [pid, "schemaExtensions"]);
                if (schemaExtensions) {
                    // now lets copy over the schema extensions
                    overlayProperties(schema, schemaExtensions);
                }
            }
            // now add all the missing properties...
            var entity = {};
            angular.forEach($scope.configValues, function (value, rawKey) {
                if (isValidProperty(rawKey)) {
                    var key = encodeKey(rawKey, pid);
                    var attrValue = value;
                    var attrType = "string";
                    if (angular.isObject(value)) {
                        attrValue = value.Value;
                        attrType = asJsonSchemaType(value.Type, rawKey);
                    }
                    var property = properties[key];
                    if (!property) {
                        property = {
                            'input-attributes': {
                                class: inputClass
                            },
                            'label-attributes': {
                                class: labelClass
                            },
                            type: attrType
                        };
                        properties[key] = property;
                        if (rawKey == 'org.osgi.service.http.port') {
                            properties[key]['input-attributes']['disabled'] = 'disabled';
                            properties[key]['input-attributes']['title'] = 'Changing port of OSGi http service is not possible from Hawtio';
                        }
                    }
                    else {
                        var propertyType = property["type"];
                        if ("array" === propertyType) {
                            if (!angular.isArray(attrValue)) {
                                attrValue = attrValue ? attrValue.split(",") : [];
                            }
                        }
                    }
                    if (disableHumanizeLabel) {
                        property.title = rawKey;
                    }
                    //comply with Forms.safeIdentifier in 'forms/js/formHelpers.ts'
                    key = key.replace(/-/g, "_");
                    entity[key] = attrValue;
                }
            });
            // add default values for missing values
            angular.forEach($scope.defaultValues, function (value, key) {
                var current = entity[key];
                if (!angular.isDefined(current)) {
                    //log.info("updating entity " + key + " with default: " + value + " as was: " + current);
                    entity[key] = value;
                }
            });
            //log.info("default values: " + angular.toJson($scope.defaultValues));
            $scope.entity = entity;
            $scope.schema = schema;
            $scope.fullSchema = schema;
        }
        /**
         * Recursively overlays the properties in the overlay into the object; so any atttributes are added into the object
         * and any nested objects in the overlay are inserted into the object at the correct path.
         */
        function overlayProperties(object, overlay) {
            if (angular.isObject(object)) {
                if (angular.isObject(overlay)) {
                    angular.forEach(overlay, function (value, key) {
                        if (angular.isObject(value)) {
                            var child = object[key];
                            if (!child) {
                                child = {};
                                object[key] = child;
                            }
                            overlayProperties(child, value);
                        }
                        else {
                            object[key] = value;
                        }
                    });
                }
            }
        }
        var ignorePropertyIds = ["service.pid", "service.factoryPid", "fabric.zookeeper.pid"];
        function isValidProperty(id) {
            return id && ignorePropertyIds.indexOf(id) < 0;
        }
        function encodeKey(key, pid) {
            return key.replace(/\./g, "__");
        }
        function decodeKey(key, pid) {
            return key.replace(/__/g, ".");
        }
        function asJsonSchemaType(typeName, id) {
            if (typeName) {
                var lower = typeName.toLowerCase();
                if (lower.startsWith("int") || lower === "long" || lower === "short" || lower === "byte" || lower.endsWith("int")) {
                    return "integer";
                }
                if (lower === "double" || lower === "float" || lower === "bigdecimal") {
                    return "number";
                }
                if (lower === "string") {
                    // TODO hack to try force password type on dodgy metadata such as pax web
                    if (id && id.endsWith("password")) {
                        return "password";
                    }
                    return "string";
                }
                return typeName;
            }
            else {
                return "string";
            }
        }
        function onProfilePropertiesLoaded(response) {
            $scope.modelLoaded = true;
            var configValues = {};
            $scope.configValues = configValues;
            angular.forEach(response, function (value, oKey) {
                // lets remove any dodgy characters
                var key = oKey.replace(/:/g, '_').replace(/\//g, '_');
                configValues[key] = {
                    Key: key,
                    Value: value
                };
            });
            $scope.zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);
            updateSchemaAndLoadMetaType();
            Core.$apply($scope);
        }
        function updateTableContents() {
            $scope.modelLoaded = false;
            Osgi.getConfigurationProperties($scope.workspace, $scope.jolokia, $scope.pid, populateTable);
        }
        // load initial data
        updateTableContents();
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi.ServiceController = Osgi._module.controller("Osgi.ServiceController", ["$scope", "$filter", "workspace", "$templateCache", "$compile", function ($scope, $filter, workspace, $templateCache, $compile) {
        var dateFilter = $filter('date');
        $scope.services = [];
        $scope.selectedItems = [];
        $scope.mygrid = {
            data: 'services',
            showFilter: false,
            showColumnMenu: false,
            filterOptions: {
                filterText: "",
                useExternalFilter: false
            },
            selectedItems: $scope.selectedItems,
            rowHeight: 32,
            selectWithCheckboxOnly: true,
            columnDefs: [
                {
                    field: 'Identifier',
                    displayName: 'ID',
                    width: "***"
                },
                {
                    field: 'BundleIdentifier',
                    displayName: 'Bundle',
                    width: "***"
                },
                {
                    field: 'objectClass',
                    displayName: 'Object Class(es)',
                    width: "***"
                }
            ]
        };
        /*
            $scope.widget = new DataTable.TableWidget($scope, $templateCache, $compile, [
              <DataTable.TableColumnConfig> {
                "mDataProp": null,
                "sClass": "control center",
                "sDefaultContent": '<i class="fa fa-plus"></i>'
              },
              <DataTable.TableColumnConfig> { "mDataProp": "Identifier" },
              <DataTable.TableColumnConfig> { "mDataProp": "BundleIdentifier" },
              <DataTable.TableColumnConfig> { "mDataProp": "objectClass" }
            ], {
              rowDetailTemplateId: 'osgiServiceTemplate',
              disableAddColumns: true
            });
        */
        $scope.$watch('workspace.selection', function () {
            var mbean = Osgi.getSelectionServiceMBean(workspace);
            if (mbean) {
                var jolokia = workspace.jolokia;
                jolokia.request({
                    type: 'exec',
                    mbean: mbean,
                    operation: 'listServices()'
                }, Core.onSuccess(populateTable));
            }
        });
        var populateTable = function (response) {
            var services = Osgi.defaultServiceValues(workspace, $scope, response.value);
            augmentServicesInfo(services);
        };
        function augmentServicesInfo(services) {
            var bundleMap = {};
            var createBundleMap = function (response) {
                angular.forEach(response.value, function (value, key) {
                    var obj = {
                        Identifier: value.Identifier,
                        Name: "",
                        SymbolicName: value.SymbolicName,
                        State: value.State,
                        Version: value.Version,
                        LastModified: value.LastModified,
                        Location: value.Location
                    };
                    if (value.Headers['Bundle-Name']) {
                        obj.Name = value.Headers['Bundle-Name']['Value'];
                    }
                    bundleMap[obj.Identifier] = obj;
                });
                angular.forEach(services, function (s, key) {
                    angular.forEach(s["UsingBundles"], function (b, key) {
                        s["UsingBundles"][key] = bundleMap[b];
                    });
                });
                $scope.services = services;
                Core.$apply($scope);
            };
            workspace.jolokia.request({
                type: 'exec',
                mbean: Osgi.getSelectionBundleMBean(workspace),
                operation: 'listBundles()'
            }, {
                success: createBundleMap,
                error: createBundleMap
            });
        }
    }]);
})(Osgi || (Osgi = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/**
 * @module Osgi
 */
var Osgi;
(function (Osgi) {
    Osgi._module.controller("Osgi.ServiceDependencyController", ["$scope", "$location", "$routeParams", "workspace", "osgiDataService", function ($scope, $location, $routeParams, workspace, osgiDataService) {
        $scope.init = function () {
            if ($routeParams["bundleFilter"]) {
                $scope.bundleFilter = $routeParams["bundleFilter"];
            }
            else {
                $scope.bundleFilter = "";
            }
            if ($routeParams["pkgFilter"]) {
                $scope.packageFilter = $routeParams["pkgFilter"];
            }
            else {
                $scope.packageFilter = "";
            }
            if ($routeParams["view"] == "packages") {
                $scope.selectView = "packages";
            }
            else {
                $scope.selectView = "services";
            }
            if ($routeParams['hideUnused']) {
                $scope.hideUnused = $routeParams['hideUnused'] == "true";
            }
            else {
                $scope.hideUnused = true;
            }
        };
        $scope.updateLink = function () {
            var search = $location.search();
            if ($scope.bundleFilter && $scope.bundleFilter != "") {
                search["bundleFilter"] = $scope.bundleFilter;
            }
            else {
                delete search["bundleFilter"];
            }
            if ($scope.packageFilter && $scope.packageFilter != "") {
                search["pkgFilter"] = $scope.packageFilter;
            }
            else {
                delete search["pkgFilter"];
            }
            search["view"] = $scope.selectView;
            if ($scope.hideUnused) {
                search["hideUnused"] = "true";
            }
            else {
                search["hideUnused"] = "false";
            }
            $location.search(search);
        };
        $scope.addToDashboardLink = function () {
            var routeParams = angular.toJson($routeParams);
            var href = "#/osgi/dependencies";
            var title = "OSGi dependencies";
            var size = angular.toJson({
                size_x: 2,
                size_y: 2
            });
            var addLink = "#/dashboard/add?tab=dashboard" + "&href=" + encodeURIComponent(href) + "&routeParams=" + encodeURIComponent(routeParams) + "&size=" + encodeURIComponent(size) + "&title=" + encodeURIComponent(title);
            return addLink;
        };
        $scope.$on('$routeUpdate', function () {
            var search = $location.search;
            if (search["bundleFilter"]) {
                $scope.bundleFilter = $routeParams["bundleFilter"];
            }
            else {
                $scope.bundleFilter = "";
            }
            if (search["pkgFilter"]) {
                $scope.packageFilter = $routeParams["pkgFilter"];
            }
            else {
                $scope.packageFilter = "";
            }
            if (search["view"] == "packages") {
                $scope.selectView = "packages";
            }
            else {
                $scope.selectView = "services";
            }
            if (search['hideUnused']) {
                $scope.hideUnused = $routeParams['hideUnused'] == "true";
            }
            else {
                $scope.hideUnused = true;
            }
            $scope.updateLink();
            $scope.updateGraph();
        });
        $scope.updateGraph = function () {
            $scope.updateLink();
            $scope.updatePkgFilter();
            var graphBuilder = new Osgi.OsgiGraphBuilder(osgiDataService, $scope.bundleFilter, $scope.packageFilter, $scope.selectView == "services", $scope.selectView == "packages", $scope.hideUnused);
            $scope.graph = graphBuilder.buildGraph();
            Core.$apply($scope);
        };
        $scope.updatePkgFilter = function () {
            if ($scope.packageFilter == null || $scope.packageFilter == "") {
                $scope.selectView = "services";
                $scope.disablePkg = true;
            }
            else {
                $scope.disablePkg = false;
            }
        };
        $scope.init();
        $scope.updateGraph();
    }]);
})(Osgi || (Osgi = {}));

angular.module("hawtio-integration-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/activemq/html/browseQueue.html","<div ng-controller=\"ActiveMQ.BrowseQueueController\">\n  <div class=\"row\">\n    <div class=\"col-md-6\">\n      <input class=\"search-query col-md-12\" type=\"text\" ng-model=\"gridOptions.filterOptions.filterText\"\n             placeholder=\"Filter messages\">\n    </div>\n    <div class=\"col-md-6\">\n      <div class=\"pull-right\">\n        <form class=\"form-inline\">\n          <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\" ng-show=\"dlq\" ng-click=\"retryMessages()\"\n                  title=\"Moves the dead letter queue message back to its original destination so it can be retried\" data-placement=\"bottom\">\n            <i class=\"fa fa-reply\"></i> Retry\n          </button>\n          <button class=\"btn\" ng-disabled=\"gridOptions.selectedItems.length !== 1\" ng-click=\"resendMessage()\"\n                    title=\"Edit the message to resend it\" data-placement=\"bottom\">\n           <i class=\"fa fa-share-alt\"></i> Resend\n          </button>\n\n          <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\" ng-click=\"moveMessages()\"\n                  title=\"Move the selected messages to another destination\" data-placement=\"bottom\">\n            <i class=\"fa fa-share-alt\"></i> Move\n          </button>\n          <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\"\n                  ng-click=\"deleteMessages()\"\n                  title=\"Delete the selected messages\">\n            <i class=\"fa fa-remove\"></i> Delete\n          </button>\n          <button class=\"btn\" ng-click=\"refresh()\"\n                  title=\"Refreshes the list of messages\">\n            <i class=\"fa fa-refresh\"></i>\n          </button>\n        </form>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n  </div>\n\n  <div hawtio-slideout=\"showMessageDetails\" title=\"{{row.JMSMessageID}}\">\n    <div class=\"dialog-body\">\n\n      <div class=\"row\">\n        <div class=\"pull-right\">\n          <form class=\"form-horizontal no-bottom-margin\">\n\n            <div class=\"btn-group\"\n                 hawtio-pager=\"messages\"\n                 on-index-change=\"selectRowIndex\"\n                 row-index=\"rowIndex\"></div>\n\n            <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\" ng-click=\"moveMessages()\"\n                    title=\"Move the selected messages to another destination\" data-placement=\"bottom\">\n              <i class=\"fa fa-share-alt\"></i> Move\n            </button>\n\n            <button class=\"btn btn-danger\" ng-disabled=\"!gridOptions.selectedItems.length\"\n                    ng-click=\"deleteMessages()\"\n                    title=\"Delete the selected messages\">\n              <i class=\"fa fa-remove\"></i> Delete\n            </button>\n\n            <!-- no need for close button as the hawtio-slideout already have that -->\n\n          </form>\n        </div>\n      </div>\n\n      <div class=\"row\">\n        <div class=\"expandable closed\">\n          <div title=\"Headers\" class=\"title\">\n            <i class=\"expandable-indicator\"></i> Headers & Properties\n          </div>\n          <div class=\"expandable-body well\">\n            <table class=\"table table-condensed table-striped\">\n              <thead>\n              <tr>\n                <th>Header</th>\n                <th>Value</th>\n              </tr>\n              </thead>\n              <tbody compile=\"row.headerHtml\"></tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"row\">\n        <div>Displaying body as <span ng-bind=\"row.textMode\"></span></div>\n        <div hawtio-editor=\"row.bodyText\" read-only=\"true\" mode=\'mode\'></div>\n      </div>\n\n    </div>\n  </div>\n\n  <script type=\"text/ng-template\" id=\"activemqMoveMessageDialog.html\">\n    <div class=\"modal-header\">\n      <span>Move messages?</span>\n    </div>\n    <div class=\"modal-body\">\n      <p>Move\n        <ng-pluralize count=\"gridOptions.selectedItems.length\"\n                      when=\"{\'1\': \'message\', \'other\': \'{} messages\'}\"></ng-pluralize>\n        to: <input type=\"text\" ng-model=\"queueName\" placeholder=\"Queue name\"\n                   typeahead=\"title.unescapeHTML() for title in queueNames($viewValue) | filter:$viewValue\" typeahead-editable=\'true\'></p>\n      <p>\n        You cannot undo this operation.<br>\n        Though after the move you can always move the\n        <ng-pluralize count=\"gridOptions.selectedItems.length\"\n                      when=\"{\'1\': \'message\', \'other\': \'messages\'}\"></ng-pluralize>\n        back again.\n      </p>\n    </div>\n    <div class=\"modal-footer\">\n      <button class=\"btn btn-info\" \n              ng-click=\"close(true)\">Move</button>\n      <button class=\"btn\" \n              ng-click=\"close(false)\">Cancel</button>\n    </div>\n  </script>\n\n</div>\n\n");
$templateCache.put("plugins/activemq/html/createDestination.html","<form class=\"form-horizontal\" ng-controller=\"ActiveMQ.DestinationController\">\n\n  <div class=\"alert alert-info\">\n    <span class=\"pficon pficon-info\"></span>The JMS API does not define a standard address syntax. <p></p> Although a\n    standard address syntax was considered, it was decided that the differences in address semantics between existing\n    message-oriented middleware (MOM) products were too wide to bridge with a single syntax.\n  </div>\n\n  <div class=\"form-group\">\n    <label class=\"col-sm-2 control-label\" for=\"name-markup\">{{destinationTypeName}} name</label>\n\n    <div class=\"col-sm-10\">\n      <input id=\"name-markup\" class=\"form-control\" type=\"text\" size=\"60\" style=\"margin-left:15px;\" maxlength=\"300\"\n             name=\"destinationName\" ng-model=\"destinationName\" placeholder=\"{{destinationTypeName}} name\"/>\n    </div>\n  </div>\n  <div class=\"form-group\">\n    <label class=\"col-sm-2 control-label\">Destination type</label>\n\n    <div class=\"col-sm-10\">\n      <label class=\"checkbox\">\n        <input type=\"radio\" ng-model=\"queueType\" value=\"true\"> Queue\n      </label>\n      <label class=\"checkbox\">\n        <input type=\"radio\" ng-model=\"queueType\" value=\"false\"> Topic\n      </label>\n    </div>\n  </div>\n\n  <div class=\"control-group col-md-12\">\n    <button type=\"submit\" class=\"btn btn-primary\" ng-click=\"createDestination(destinationName, queueType)\"\n            ng-disabled=\"!destinationName\">Create {{destinationTypeName}}\n    </button>\n  </div>\n\n</form>\n");
$templateCache.put("plugins/activemq/html/deleteQueue.html","<div ng-controller=\"ActiveMQ.DestinationController\">\n  <div class=\"row\">\n\n    <div class=\"control-group\">\n\n      <div class=\"alert alert-warning\">\n        <span class=\"pficon-layered\">\n          <span class=\"pficon pficon-warning-triangle\"></span>\n          <span class=\"pficon pficon-warning-exclamation\"></span>\n        </span>\n        <strong>Warning:</strong> these operations cannot be undone. Please be careful!\n      </div>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-4\">\n      <div class=\"control-group\">\n        <button type=\"submit\" class=\"btn btn-warning\" ng-click=\"deleteDialog = true\">Delete queue\n          \'{{name().unescapeHTML()}}\'\n        </button>\n        <label>This will remove the queue completely.</label>\n      </div>\n    </div>\n    <div class=\"col-md-4\">\n      <div class=\"control-group\">\n        <button type=\"submit\" class=\"btn btn-warning\" ng-click=\"purgeDialog = true\">Purge queue\n          \'{{name().unescapeHTML()}}\'\n        </button>\n        <label>Purges all the current messages on the queue.</label>\n      </div>\n    </div>\n  </div>\n\n  <div hawtio-confirm-dialog=\"deleteDialog\"\n       title=\"Confirm delete queue\"\n       ok-button-text=\"Delete\"\n       cancel-button-text=\"Cancel\"\n       on-ok=\"deleteDestination()\">\n    <div class=\"dialog-body\">\n      <p>You are about to delete the <b>{{name().unescapeHTML()}}</b> queue</p>\n      <p>This operation cannot be undone so please be careful.</p>\n    </div>\n  </div>\n\n  <div hawtio-confirm-dialog=\"purgeDialog\"\n       title=\"Confirm purge queue\"\n       ok-button-text=\"Purge\"\n       cancel-button-text=\"Cancel\"\n       on-ok=\"purgeDestination()\">\n    <div class=\"dialog-body\">\n      <p>You are about to purge the <b>{{name().unescapeHTML()}}</b> queue</p>\n      <p>This operation cannot be undone so please be careful.</p>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/activemq/html/deleteTopic.html","<div ng-controller=\"ActiveMQ.DestinationController\">\n  <div class=\"row\">\n\n    <div class=\"control-group\">\n\n      <div class=\"alert alert-warning\">\n        <span class=\"pficon-layered\">\n          <span class=\"pficon pficon-warning-triangle\"></span>\n          <span class=\"pficon pficon-warning-exclamation\"></span>\n        </span>\n        <strong>Warning:</strong> this operation cannot be undone. Please be careful!\n      </div>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-4\">\n      <div class=\"control-group\">\n        <button type=\"submit\" class=\"btn btn-warning\" ng-click=\"deleteDialog = true\">Delete topic\n          \'{{name().unescapeHTML()}}\'\n        </button>\n        <label>This will remove the topic completely.</label>\n      </div>\n    </div>\n  </div>\n\n  <div hawtio-confirm-dialog=\"deleteDialog\"\n       title=\"Confirm delete topic\"\n       ok-button-text=\"Delete\"\n       cancel-button-text=\"Cancel\"\n       on-ok=\"deleteDestination()\">\n    <div class=\"dialog-body\">\n      <p>You are about to delete the <b>{{name().unescapeHTML()}}</b> topic</p>\n      <p>This operation cannot be undone so please be careful.</p>\n    </div>\n  </div>\n\n</div>\n");
$templateCache.put("plugins/activemq/html/durableSubscribers.html","<div ng-controller=\"ActiveMQ.DurableSubscriberController\">\n\n    <div class=\"row\">\n      <div class=\"col-md-12\">\n        <div class=\"pull-right\">\n            <form class=\"form-inline\">\n                <button class=\"btn\" ng-click=\"createSubscriberDialog.open()\"\n                        hawtio-show object-name=\"{{workspace.selection.objectName}}\" method-name=\"createDurableSubscriber\"\n                        title=\"Create durable subscriber\">\n                    <i class=\"fa fa-plus\"></i> Create\n                </button>\n                <button class=\"btn\" ng-click=\"deleteSubscriberDialog.open()\"\n                        hawtio-show object-name=\"{{$scope.gridOptions.selectedItems[0]._id}}\" method-name=\"destroy\"\n                        title=\"Destroy durable subscriber\" ng-disabled=\"gridOptions.selectedItems.length != 1\">\n                    <i class=\"fa fa-exclamation\"></i> Destroy\n                </button>\n                <button class=\"btn\" ng-click=\"refresh()\"\n                        title=\"Refreshes the list of subscribers\">\n                    <i class=\"fa fa-refresh\"></i>\n                </button>\n            </form>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"row\">\n      <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n    </div>\n\n    <div modal=\"createSubscriberDialog.show\">\n      <form name=\"createSubscriber\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"doCreateSubscriber(clientId, subscriberName, topicName, subSelector)\">\n        <div class=\"modal-header\"><h4>Create Durable Subscriber</h4></div>\n        <div class=\"modal-body\">\n          <label>Client Id: </label>\n          <input name=\"clientId\" class=\"input-xlarge\" type=\"text\" ng-model=\"clientId\" required>\n          <label>Subscriber name: </label>\n          <input name=\"subscriberName\" class=\"input-xlarge\" type=\"text\" ng-model=\"subscriberName\" required>\n          <label>Topic name: </label>\n          <input name=\"topicName\" class=\"input-xlarge\" type=\"text\" ng-model=\"topicName\" required typeahead=\"title for title in topicNames($viewValue) | filter:$viewValue\" typeahead-editable=\'true\'>\n          <label>Selector: </label>\n          <input name=\"subSelector\" class=\"input-xlarge\" type=\"text\" ng-model=\"subSelector\">\n        </div>\n        <div class=\"modal-footer\">\n          <input class=\"btn btn-success\" type=\"submit\" value=\"Create\">\n          <input class=\"btn btn-primary\" type=\"button\" ng-click=\"createSubscriberDialog.close()\" value=\"Cancel\">\n        </div>\n      </form>\n    </div>\n\n    <div hawtio-slideout=\"showSubscriberDialog.show\" title=\"Details\">\n      <div class=\"dialog-body\">\n\n        <div class=\"row\">\n          <div class=\"pull-right\">\n            <form class=\"form-inline\">\n\n              <button class=\"btn btn-danger\" ng-disabled=\"showSubscriberDialog.subscriber.Status == \'Active\'\"\n                      ng-click=\"deleteSubscriberDialog.open()\"\n                      title=\"Delete subscriber\">\n                <i class=\"fa fa-remove\"></i> Delete\n              </button>\n\n              <button class=\"btn\" ng-click=\"showSubscriberDialog.close()\" title=\"Close this dialog\">\n                <i class=\"fa fa-remove\"></i> Close\n              </button>\n\n            </form>\n          </div>\n        </div>\n\n          <div class=\"row\">\n              <div class=\"expandable-body well\">\n                <table class=\"table table-condensed table-striped\">\n                  <thead>\n                  <tr>\n                    <th>Property</th>\n                    <th>Value</th>\n                  </tr>\n                  </thead>\n                  <tbody>\n                  <tr>\n                    <td class=\"property-name\">Client Id</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"ClientId\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Subscription Name</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"SubscriptionName\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Topic Name</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"DestinationName\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Selector</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"Selector\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Status</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber.Status}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Enqueue Counter</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"EnqueueCounter\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Dequeue Counter</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"DequeueCounter\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Dispatched Counter</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"DispatchedCounter\"]}}</td>\n                  </tr>\n                  <tr>\n                    <td class=\"property-name\">Pending Size</td>\n                    <td class=\"property-value\">{{showSubscriberDialog.subscriber[\"PendingQueueSize\"]}}</td>\n                  </tr>\n                  </tbody>\n                </table>\n              </div>\n            </div>\n\n      </div>\n\n    </div>\n\n    <div hawtio-confirm-dialog=\"deleteSubscriberDialog.show\" ok-button-text=\"Yes\" cancel-button-text=\"No\" on-ok=\"deleteSubscribers()\">\n      <div class=\"dialog-body\">\n        <p>Are you sure you want to delete the subscriber</p>\n      </div>\n    </div>\n\n</div>");
$templateCache.put("plugins/activemq/html/jobs.html","<div ng-controller=\"ActiveMQ.JobSchedulerController\">\n\n    <div class=\"row\">\n      <div class=\"col-md-12\">\n        <div class=\"pull-right\">\n            <form class=\"form-inline\">\n                <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\"\n                        hawtio-show object-name=\"{{workspace.selection.objectName}}\" method-name=\"removeJob\"\n                        ng-click=\"deleteJobsDialog.open()\"\n                        title=\"Delete the selected jobs\">\n                  <i class=\"fa fa-remove\"></i> Delete\n                </button>\n                <button class=\"btn\" ng-click=\"refresh()\"\n                        title=\"Refreshes the list of subscribers\">\n                    <i class=\"fa fa-refresh\"></i>\n                </button>\n            </form>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"row\">\n      <div class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n    </div>\n\n    <div hawtio-confirm-dialog=\"deleteJobsDialog.show\" ok-button-text=\"Yes\" cancel-button-text=\"No\" on-ok=\"deleteJobs()\">\n      <div class=\"dialog-body\">\n        <p>Are you sure you want to delete the jobs</p>\n      </div>\n    </div>\n\n</div>");
$templateCache.put("plugins/activemq/html/layoutActiveMQTree.html","<script type=\"text/ng-template\" id=\"ActiveMQTreeHeader.html\">\n  <div class=\"tree-header\" ng-controller=\"ActiveMQ.TreeHeaderController\">\n    <div class=\"left\">\n    </div>\n    <div class=\"right\">\n      <i class=\"fa fa-chevron-down clickable\"\n         title=\"Expand all nodes\"\n         ng-click=\"expandAll()\"></i>\n      <i class=\"fa fa-chevron-up clickable\"\n         title=\"Unexpand all nodes\"\n         ng-click=\"contractAll()\"></i>\n    </div>\n  </div>\n</script>\n\n<hawtio-pane position=\"left\" width=\"300\" header=\"ActiveMQTreeHeader.html\">\n  <div id=\"tree-container\"\n       ng-controller=\"Jmx.MBeansController\">\n    <div id=\"activemqtree\"\n         ng-controller=\"ActiveMQ.TreeController\"></div>\n  </div>\n</hawtio-pane>\n<div class=\"row\">\n  <!--\n  <ng-include src=\"\'plugins/jmx/html/subLevelTabs.html\'\"></ng-include>\n  -->\n  <div id=\"properties\" ng-view></div>\n</div>\n");
$templateCache.put("plugins/activemq/html/preferences.html","<div ng-controller=\"ActiveMQ.PreferencesController\">\n  <div hawtio-form-2=\"config\" entity=\"entity\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/attributeToolBarContext.html","<div class=\"row\">\n  <div class=\"col-md-6\" ng-controller=\"Camel.AttributesToolBarController\">\n    <div class=\"control-group\">\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState([\'stop\', \'suspend\'])\" ng-click=\"start()\"><i\n              class=\"fa fa-play-circle\"></i> Start\n      </button>\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState(\'start\')\" ng-click=\"pause()\"><i class=\"fa fa-pause\"></i>\n        Pause\n      </button>\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState([\'start\', \'suspend\'])\" ng-click=\"deleteDialog = true\"><i\n              class=\"fa fa-remove\"></i> Destroy\n      </button>\n    </div>\n\n    <div hawtio-confirm-dialog=\"deleteDialog\"\n         ok-button-text=\"Delete\"\n         on-ok=\"stop()\">\n      <div class=\"dialog-body\">\n        <p>You are about to delete this Camel Context.</p>\n        <p>This operation cannot be undone so please be careful.</p>\n      </div>\n    </div>\n\n  </div>\n  <div class=\"col-md-6\">\n    <div class=\"control-group\">\n      <input class=\"col-md-12 search-query\" type=\"text\" ng-model=\"$parent.gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/attributeToolBarRoutes.html","<div class=\"row\">\n  <div class=\"col-md-6\">\n    <div class=\"control-group\"  ng-controller=\"Camel.AttributesToolBarController\">\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState([\'stop\', \'suspend\'])\" ng-click=\"start()\"><i class=\"fa fa-play-circle\"></i> Start</button>\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState(\'start\')\" ng-click=\"pause()\"><i class=\"fa fa-pause\"></i> Pause</button>\n      <button class=\"btn\" ng-disabled=\"!anySelectionHasState([\'start\', \'suspend\'])\" ng-click=\"stop()\"><i class=\"fa fa-off\"></i> Stop</button>\n      <button class=\"btn\" ng-disabled=\"!everySelectionHasState(\'stop\')\" ng-click=\"delete()\"><i class=\"fa fa-remove\"></i> Delete</button>\n    </div>\n  </div>\n  <div class=\"col-md-6\">\n    <div class=\"control-group\">\n      <input type=\"text\" class=\"col-md-12 search-query\" ng-model=\"$parent.gridOptions.filterOptions.filterText\" placeholder=\"Filter...\">\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/breadcrumbBar.html","<div ng-hide=\"inDashboard\" class=\"logbar logbar-wiki\" ng-controller=\"Camel.BreadcrumbBarController\">\n  <div class=\"wiki logbar-container\">\n    <ul class=\"nav nav-tabs\">\n      <li class=\"\" >\n        <a class=\"breadcrumb-link\">\n          <span class=\"contained c-medium\">Camel Contexts</span>\n        </a>\n      </li>\n        <li class=\"dropdown\" ng-repeat=\"breadcrumb in breadcrumbs\">\n          <a ng-show=\"breadcrumb.items.length > 0\" href=\"#\" class=\"breadcrumb-link dropdown-toggle\" data-toggle=\"dropdown\"\n             data-placement=\"bottom\" title=\"{{breadcrumb.tooltip}}\">\n            {{breadcrumb.name}}\n            <span class=\"caret\"></span>\n          </a>\n          <ul class=\"dropdown-menu\">\n            <li ng-repeat=\"item in breadcrumb.items\">\n              <a ng-href=\"{{item.link}}{{hash}}\"\n                 title=\"Switch to {{item.name}} \"\n                 data-placement=\"bottom\">\n                {{item.name}}</a>\n            </li>\n          </ul>\n        </li>\n      <li class=\"pull-right\" ng-show=\"treeViewLink\" title=\"Switch to the tree based explorer view\">\n        <a href=\"{{treeViewLink}}\"><i class=\"fa fa-resize-full\"></i></a>\n      </li>\n      </ul>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/browseEndpoint.html","<div ng-controller=\"Camel.BrowseEndpointController\">\n  <div ng-hide=\"isJmxTab\">\n    <ng-include src=\"\'plugins/camel/html/breadcrumbBar.html\'\"></ng-include>\n  </div>\n  <div ng-class=\"{\'wiki-fixed\' : !isJmxTab}\">\n    <div class=\"row\">\n      <div class=\"col-md-6\">\n        <input class=\"search-query col-md-12\" type=\"text\" ng-model=\"gridOptions.filterOptions.filterText\"\n               placeholder=\"Filter messages\">\n      </div>\n      <div class=\"col-md-6\">\n        <div class=\"pull-right\">\n          <form class=\"form-inline\">\n            <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\" ng-click=\"forwardDialog.open()\"\n                    hawtio-show object-name=\"{{workspace.selection.objectName}}\" method-name=\"sendBodyAndHeaders\"\n                    title=\"Forward the selected messages to another endpoint\" data-placement=\"bottom\">\n              <i class=\"fa fa-forward\"></i> Forward\n            </button>\n            <button class=\"btn\" ng-click=\"refresh()\"\n                    title=\"Refreshes the list of messages\">\n              <i class=\"fa fa-refresh\"></i>\n            </button>\n          </form>\n        </div>\n      </div>\n    </div>\n\n\n    <div class=\"row\">\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n\n    <div hawtio-slideout=\"showMessageDetails\" title=\"{{row.id}}\">\n      <div class=\"dialog-body\">\n\n        <div class=\"row\">\n          <div class=\"pull-right\">\n            <form class=\"form-horizontal no-bottom-margin\">\n              <div class=\"btn-group\" hawtio-pager=\"messages\" on-index-change=\"selectRowIndex\"\n                   row-index=\"rowIndex\"></div>\n              <button class=\"btn\" ng-disabled=\"!gridOptions.selectedItems.length\" ng-click=\"forwardDialog.open()\"\n                      hawtio-show object-name=\"{{workspace.selection.objectName}}\" method-name=\"sendBodyAndHeaders\"\n                      title=\"Forward the selected messages to another endpoint\" data-placement=\"bottom\">\n                <i class=\"fa fa-forward\"></i> Forward\n              </button>\n\n              <!-- no need for close button as the hawtio-slideout already have that -->\n\n            </form>\n          </div>\n        </div>\n\n        <div class=\"row\">\n          <div class=\"expandable closed\">\n            <div title=\"Headers\" class=\"title\">\n              <i class=\"expandable-indicator\"></i> Headers\n            </div>\n            <div class=\"expandable-body well\">\n              <table class=\"table table-condensed table-striped\">\n                <thead>\n                <tr>\n                  <th>Header</th>\n                  <th>Type</th>\n                  <th>Value</th>\n                </tr>\n                </thead>\n                <tbody compile=\"row.headerHtml\"></tbody>\n              </table>\n            </div>\n          </div>\n\n          <div class=\"row\">\n            <div hawtio-editor=\"row.body\" read-only=\"true\" mode=\"mode\"></div>\n          </div>\n\n        </div>\n\n      </div>\n    </div>\n  </div>\n\n  <div modal=\"forwardDialog.show\" close=\"forwardDialog.close()\" options=\"forwardDialog.options\">\n    <form class=\"form-horizontal no-bottom-margin\" ng-submit=\"forwardDialog.close()\">\n      <div class=\"modal-header\">\n        <h4>Forward\n          <ng-pluralize count=\"selectedItems.length\"\n                        when=\"{\'1\': \'a message\', \'other\': \'messages\'}\"></ng-pluralize>\n        </h4>\n      </div>\n      <div class=\"modal-body\">\n        <p>Forward\n          <ng-pluralize count=\"selectedItems.length\"\n                        when=\"{\'1\': \'a message\', \'other\': \'{} messages\'}\"></ng-pluralize>\n          to: <input type=\"text\" style=\"width: 100%\" ng-model=\"endpointUri\" placeholder=\"Endpoint URI\"\n                     typeahead=\"title for title in endpointUris() | filter:$viewValue\" typeahead-editable=\'true\'></p>\n      </div>\n      <div class=\"modal-footer\">\n        <input id=\"submit\" class=\"btn btn-primary add\" type=\"submit\" ng-click=\"forwardMessagesAndCloseForwardDialog()\"\n               value=\"Forward\">\n        <button class=\"btn btn-warning cancel\" type=\"button\" ng-click=\"forwardDialog.close()\">Cancel</button>\n      </div>\n    </form>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/browseRoute.html","<ng-include src=\"\'plugins/camel/html/browseMessageTemplate.html\'\"></ng-include>\n\n<div class=\"row\">\n  <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n  <!--\n      <div class=\"gridStyle\" hawtio-datatable=\"gridOptions\"></div>\n  -->\n</div>\n");
$templateCache.put("plugins/camel/html/createEndpoint.html","<div ng-controller=\"Camel.EndpointController\" ng-switch=\"hasComponentNames\">\n  <div ng-switch-when=\"true\">\n    <tabs>\n      <pane heading=\"URL\">\n        <ng-include src=\"\'plugins/camel/html/createEndpointURL.html\'\"></ng-include>\n      </pane>\n      <pane heading=\"Components\">\n        <ng-include src=\"\'plugins/camel/html/createEndpointWizard.html\'\"></ng-include>\n      </pane>\n    </tabs>\n  </div>\n  <div ng-switch-default=\"false\">\n    <ng-include src=\"\'plugins/camel/html/createEndpointURL.html\'\"></ng-include>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/createEndpointURL.html","<form class=\"form-horizontal\">\n  <div class=\"control-group\">\n    <input class=\"col-md-12\" type=\"text\" size=\"255\" ng-model=\"endpointName\" placeholder=\"Endpoint URI\"/>\n  </div>\n  <div class=\"control-group\">\n    <button type=\"submit\" class=\"btn btn-info\" ng-click=\"createEndpoint(endpointName)\"\n            ng-disabled=\"!endpointName\">\n      Create endpoint\n    </button>\n  </div>\n</form>\n");
$templateCache.put("plugins/camel/html/createEndpointWizard.html","<div ng-controller=\"Camel.EndpointController\">\n  <form class=\"form-horizontal\">\n    <div class=\"control-group\">\n      <label class=\"control-label\" for=\"componentName\">Component</label>\n\n      <div class=\"controls\">\n        <select id=\"componentName\" ng-model=\"selectedComponentName\"\n                ng-options=\"componentName for componentName in componentNames\"></select>\n      </div>\n    </div>\n    <div ng-show=\"selectedComponentName\">\n      <div class=\"control-group\">\n        <label class=\"control-label\" for=\"endpointPath\">Endpoint</label>\n\n        <div class=\"controls\">\n          <input id=\"endpointPath\" class=\"col-md-10\" type=\"text\" ng-model=\"endpointPath\" placeholder=\"name\"\n                 typeahead=\"title for title in endpointCompletions($viewValue) | filter:$viewValue\" typeahead-editable=\'true\'\n                 min-length=\"1\">\n        </div>\n      </div>\n\n      <div simple-form name=\"formEditor\" entity=\'endpointParameters\' data=\'endpointSchema\' schema=\"schema\"></div>\n\n      <div class=\"control-group\">\n        <div class=\"controls\">\n          <button type=\"submit\" class=\"btn btn-info\" ng-click=\"createEndpointFromData()\"\n                  ng-disabled=\"!endpointPath || !selectedComponentName\">\n            Create endpoint\n          </button>\n        </div>\n      </div>\n    </div>\n  </form>\n</div>\n");
$templateCache.put("plugins/camel/html/debug.html","<div ng-controller=\"Camel.DebugRouteController\" ng-switch=\"debugging\">\n  <div ng-switch-when=\"true\">\n    <div class=\"row\">\n      <div class=\"col-md-10\">\n        <div ng-include src=\"graphView\">\n        </div>\n      </div>\n      <div class=\"col-md-2\">\n        <div class=\"btn-toolbar pull-right\">\n          <div class=\"btn-group\">\n            <div ng-switch=\"hasBreakpoint\">\n              <button ng-switch-when=\"true\" class=\"btn\" ng-disabled=\"!selectedDiagramNodeId\"\n                      ng-click=\"removeBreakpoint()\" title=\"Remove the breakpoint on the selected node\"><i\n                      class=\"fa fa-remove\"></i>\n              </button>\n              <button ng-switch-default=\"false\" class=\"btn\" ng-disabled=\"!selectedDiagramNodeId\"\n                      ng-click=\"addBreakpoint()\" title=\"Add a breakpoint on the selected node\"><i class=\"fa fa-plus\"></i>\n              </button>\n            </div>\n          </div>\n          <div class=\"btn-group\">\n            <button class=\"btn\" type=\"submit\" ng-click=\"stopDebugging()\" title=\"Stops the debugger\">Close\n            </button>\n          </div>\n        </div>\n        <div class=\"btn-toolbar pull-right\">\n          <div class=\"btn-group\">\n            <button class=\"btn\" ng-click=\"step()\" ng-disabled=\"!stopped\" title=\"Step into the next node\"><img\n                    ng-src=\"img/icons/camel/step.gif\"></button>\n            <button class=\"btn\" ng-click=\"resume()\" ng-disabled=\"!stopped\" title=\"Resume running\"><img\n                    ng-src=\"img/icons/camel/resume.gif\"></button>\n            <button class=\"btn\" ng-click=\"suspend()\" ng-disabled=\"stopped\"\n                    title=\"Suspend all threads in this route\"><img ng-src=\"img/icons/camel/suspend.gif\"></button>\n          </div>\n        </div>\n        <div class=\"col-md-12 well\">\n          <form>\n            <div class=\"table-header\">Breakpoints:</div>\n            <ul>\n              <li class=\"table-row\" ng-repeat=\"b in breakpoints\">\n                {{b}}\n              </li>\n            </ul>\n            <div class=\"table-row\">Suspended:</div>\n            <ul>\n              <li class=\"table-row\" ng-repeat=\"b in suspendedBreakpoints\">\n                {{b}}\n              </li>\n            </ul>\n          </form>\n        </div>\n      </div>\n    </div>\n\n    <!-- slider to always show the current debugged message -->\n    <div hawtio-slideout=\"true\" title=\"Breakpoint suspended at {{row.toNode}}\" close=\"false\" top=\"60%\" height=\"40%\">\n      <div class=\"dialog-body\">\n\n        <div title=\"ID\" class=\"title\">\n          {{row.id}}\n        </div>\n\n        <div class=\"row\">\n          <div class=\"expandable closed\">\n            <div title=\"Headers\" class=\"title\">\n              <i class=\"expandable-indicator\"></i> Headers\n            </div>\n            <div class=\"expandable-body well\">\n              <table class=\"table table-condensed table-striped\">\n                <thead>\n                <tr>\n                  <th>Header</th>\n                  <th>Type</th>\n                  <th>Value</th>\n                </tr>\n                </thead>\n                <tbody compile=\"row.headerHtml\"></tbody>\n              </table>\n            </div>\n          </div>\n\n          <div title=\"Body\" class=\"row\">\n            <div>Body type: <span ng-bind=\"row.bodyType\"></span></div>\n            <div hawtio-editor=\"row.body\" read-only=\"true\" mode=\"mode\"></div>\n          </div>\n\n        </div>\n\n      </div>\n    </div>\n\n  </div>\n  <div class=\"col-md-12 well\" ng-switch-default=\"false\">\n    <form>\n      <p>Debugging allows you to step through camel routes to diagnose issues</p>\n\n      <button class=\"btn btn-info\" type=\"submit\" ng-click=\"startDebugging()\">Start debugging</button>\n    </form>\n  </div>\n</div>");
$templateCache.put("plugins/camel/html/endpointRuntimeRegistry.html","<div class=\"row\" ng-controller=\"Camel.EndpointRuntimeRegistryController\">\n\n  <div ng-show=\"selectedMBean\">\n\n    <div class=\"row\" ng-show=\"data.length > 0\">\n      <div class=\"pull-right\">\n        <form class=\"form-inline no-bottom-margin\">\n          <fieldset>\n            <div class=\"control-group inline-block\">\n              <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\"\n                     ng-model=\"gridOptions.filterOptions.filterText\">\n            </div>\n          </fieldset>\n        </form>\n      </div>\n    </div>\n\n    <div class=\"row\" ng-show=\"data.length > 0\">\n      <table class=\"table table-condensed table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n    <div class=\"row well\" ng-show=\"data.length == 0\">\n      <form>\n        <p>There are no endpoints currently in use in this CamelContext.</p>\n      </form>\n    </div>\n  </div>\n\n  <div ng-hide=\"selectedMBean\">\n    <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n  </div>\n\n</div>\n\n");
$templateCache.put("plugins/camel/html/inflight.html","<div class=\"row-fluid\" ng-controller=\"Camel.InflightController\">\n\n  <div ng-show=\"initDone\">\n\n    <div class=\"row-fluid\">\n      <div class=\"pull-right\">\n        <hawtio-filter ng-model=\"gridOptions.filterOptions.filterText\"\n                       placeholder=\"Filter...\"></hawtio-filter>\n      </div>\n    </div>\n\n    <div class=\"row-fluid\">\n      <table class=\"table table-condensed table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n\n  </div>\n\n  <div ng-hide=\"initDone\">\n    <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n  </div>\n\n</div>\n\n");
$templateCache.put("plugins/camel/html/layoutCamelTree.html","\n<script type=\"text/ng-template\" id=\"camelTreeHeader.html\">\n  <div class=\"camel tree-header\" ng-controller=\"Camel.TreeHeaderController\">\n\n    <!--\n    TODO - changes to the tree made this filter not work\n    <div class=\"left\">\n      <div class=\"section-filter\">\n        <input id=\"camelContextIdFilter\"\n               class=\"search-query\"\n               type=\"text\"\n               ng-model=\"contextFilterText\"\n               title=\"filter camel context IDs\"\n               placeholder=\"Filter...\">\n        <i class=\"fa fa-remove clickable\"\n           title=\"Clear filter\"\n           ng-click=\"contextFilterText = \'\'\"></i>\n      </div>\n    </div>\n    -->\n\n    <div class=\"right\">\n      <i class=\"fa fa-chevron-down clickable\"\n         title=\"Expand all nodes\"\n         ng-click=\"expandAll()\"></i>\n      <i class=\"fa fa-chevron-up clickable\"\n         title=\"Unexpand all nodes\"\n         ng-click=\"contractAll()\"></i>\n    </div>\n  </div>\n</script>\n\n<hawtio-pane position=\"left\" width=\"300\" header=\"camelTreeHeader.html\">\n  <div id=\"tree-container\" ng-controller=\"Jmx.MBeansController\">\n    <div class=\"camel-tree\" ng-controller=\"Camel.TreeController\">\n      <div id=\"cameltree\"></div>\n    </div>\n  </div>\n</hawtio-pane>\n<div class=\"row\">\n  <!--\n  <ng-include src=\"\'plugins/jmx/html/subLevelTabs.html\'\"></ng-include>\n  -->\n  <div id=\"properties\" ng-view></div>\n</div>\n");
$templateCache.put("plugins/camel/html/nodePropertiesEdit.html","<div class=\"row-fluid\">\n\n  <!-- the label and input fields needs to be wider -->\n  <style>\n    input, textarea, .uneditable-input {\n      width: 600px;\n    }\n    input, textarea, .editable-input {\n      width: 600px;\n    }\n\n    .form-horizontal .control-label {\n      width: 180px;\n    }\n\n    .form-horizontal .controls {\n      margin-left: 200px;\n    }\n  </style>\n\n  <h3>\n    <img src=\"{{icon}}\" width=\"48\" height=\"48\" ng-show=\"icon\"/> {{model.title}}\n    <span style=\"margin-left: 10px\" ng-repeat=\"label in labels track by $index\" class=\"pod-label badge\" title=\"{{label}}\">{{label}}</span>\n  </h3>\n\n  <div simple-form name=\"formViewer\" mode=\'edit\' entity=\'nodeData\' data=\'model\' schema=\"schema\"\n       showhelp=\"!hideHelp\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/nodePropertiesView.html","<div class=\"row-fluid\">\n\n  <!-- the label and input fields needs to be wider -->\n  <style>\n    input, textarea, .uneditable-input {\n      width: 600px;\n    }\n\n    input, textarea, .editable-input {\n      width: 600px;\n    }\n\n    .form-horizontal .control-label {\n      width: 180px;\n    }\n\n    .form-horizontal .controls {\n      margin-left: 200px;\n    }\n  </style>\n\n  <h3>\n    <img src=\"{{icon}}\" width=\"48\" height=\"48\" ng-show=\"icon\"/> {{model.title}}\n    <span style=\"margin-left: 10px\" ng-repeat=\"label in labels track by $index\" class=\"pod-label badge\" title=\"{{label}}\">{{label}}</span>\n  </h3>\n\n  <div simple-form name=\"formViewer\" mode=\'view\' entity=\'nodeData\' data=\'model\' schema=\"schema\"\n       showhelp=\"!hideHelp\" showempty=\"showEntity\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/preferences.html","<div ng-controller=\"Camel.PreferencesController\">\n  <div hawtio-form-2=\"config\" entity=\"entity\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/profileRoute.html","<div class=\"row\" ng-controller=\"Camel.ProfileRouteController\">\n\n    <div ng-show=\"initDone\">\n\n        <div class=\"row-fluid\">\n            <div class=\"pull-right\">\n                <hawtio-filter ng-model=\"gridOptions.filterOptions.filterText\"\n                               placeholder=\"Filter...\"></hawtio-filter>\n            </div>\n        </div>\n\n        <div class=\"row-fluid\">\n            <table class=\"table table-condensed table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n        </div>\n\n    </div>\n\n    <div ng-hide=\"initDone\">\n        <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n    </div>\n\n</div>\n\n");
$templateCache.put("plugins/camel/html/properties.html","<div ng-controller=\"Camel.PropertiesController\">\n\n  <div class=\"control-group inline-block\">\n    <form class=\"form-inline no-bottom-margin\">\n      <label>Hide Documentation:\n        <input type=\"checkbox\" ng-model=\"hideHelp\"\n               title=\"Hide documentation for the options\"/>\n      </label>\n      <label>Hide Default:\n        <input type=\"checkbox\" ng-model=\"hideDefault\"\n               title=\"Hide options with default values\"/>\n      </label>\n      <label>Hide Unused:\n        <input type=\"checkbox\" ng-model=\"hideUnused\"\n               title=\"Hide options with unused/empty values\"/>\n      </label>\n    </form>\n  </div>\n\n  <div ng-include=\"viewTemplate\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/propertiesComponent.html","<div ng-controller=\"Camel.PropertiesComponentController\">\n\n  <div class=\"control-group inline-block\">\n    <form class=\"form-inline no-bottom-margin\">\n      <label>Hide Documentation:\n        <input type=\"checkbox\" ng-model=\"hideHelp\"\n               title=\"Hide documentation for the options\"/>\n      </label>\n      <label>Hide Default:\n        <input type=\"checkbox\" ng-model=\"hideDefault\"\n               title=\"Hide options with default values\"/>\n      </label>\n      <label>Hide Unused:\n        <input type=\"checkbox\" ng-model=\"hideUnused\"\n               title=\"Hide options with unused/empty values\"/>\n      </label>\n    </form>\n  </div>\n\n  <div ng-include=\"viewTemplate\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/propertiesDataFormat.html","<div ng-controller=\"Camel.PropertiesDataFormatController\">\n\n  <div class=\"control-group inline-block\">\n    <form class=\"form-inline no-bottom-margin\">\n      <label>Hide Documentation:\n        <input type=\"checkbox\" ng-model=\"hideHelp\"\n               title=\"Hide documentation for the options\"/>\n      </label>\n      <label>Hide Default:\n        <input type=\"checkbox\" ng-model=\"hideDefault\"\n               title=\"Hide options with default values\"/>\n      </label>\n      <label>Hide Unused:\n        <input type=\"checkbox\" ng-model=\"hideUnused\"\n               title=\"Hide options with unused/empty values\"/>\n      </label>\n    </form>\n  </div>\n\n  <div ng-include=\"viewTemplate\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/propertiesEndpoint.html","<div ng-controller=\"Camel.PropertiesEndpointController\">\n\n  <div class=\"control-group inline-block\">\n    <form class=\"form-inline no-bottom-margin\">\n      <label>Hide Documentation:\n        <input type=\"checkbox\" ng-model=\"hideHelp\"\n               title=\"Hide documentation for the options\"/>\n      </label>\n      <label>Hide Default:\n        <input type=\"checkbox\" ng-model=\"hideDefault\"\n               title=\"Hide options with default values\"/>\n      </label>\n      <label>Hide Unused:\n        <input type=\"checkbox\" ng-model=\"hideUnused\"\n               title=\"Hide options with unused/empty values\"/>\n      </label>\n    </form>\n  </div>\n\n  <div ng-include=\"viewTemplate\"></div>\n</div>\n");
$templateCache.put("plugins/camel/html/restRegistry.html","<div class=\"row\" ng-controller=\"Camel.RestServiceController\">\n\n  <div ng-show=\"selectedMBean\">\n\n    <div class=\"row\" ng-show=\"data.length > 0\">\n      <div class=\"pull-right\">\n        <form class=\"form-inline no-bottom-margin\">\n          <fieldset>\n            <div class=\"control-group inline-block\">\n              <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\"\n                     ng-model=\"gridOptions.filterOptions.filterText\">\n            </div>\n          </fieldset>\n        </form>\n      </div>\n    </div>\n\n    <div class=\"row\" ng-show=\"data.length > 0\">\n      <table class=\"table table-condensed table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n    <div class=\"row well\" ng-show=\"data.length == 0\">\n      <form>\n        <p>There are no Rest Services registered in this CamelContext.</p>\n      </form>\n    </div>\n  </div>\n\n  <div ng-hide=\"selectedMBean\">\n    <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n  </div>\n\n</div>\n\n");
$templateCache.put("plugins/camel/html/routeMetrics.html","<div class=\"row\" ng-controller=\"Camel.RouteMetricsController\">\n\n  <div class=\"row\">\n    <div class=\"pull-right\">\n      <form class=\"form-inline no-bottom-margin\">\n        <fieldset>\n          <div class=\"control-group inline-block\">\n            <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\" ng-model=\"filterText\">\n          </div>\n        </fieldset>\n      </form>\n    </div>\n  </div>\n\n  <div class=\"row\" ng-show=\"!initDone\">\n    <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n  </div>\n\n  <div class=\"col-md-8 centered well\" ng-show=\"initDone && metricDivs.length === 0\">\n    <form>\n      This Camel context has no route metrics data.\n    </form>\n  </div>\n\n  <!-- div to contain the graphs -->\n  <div class=\"metricsWatcher container mainContent\">\n    <div id=\"{{metric.id}}\" class=\"row\" ng-repeat=\"metric in metricDivs track by $index\" style=\"{{filterByRoute(metric)}}\"></div>\n  </div>\n\n</div>\n\n");
$templateCache.put("plugins/camel/html/routes.html","<style>\n\n  #node-CLOSED rect {\n    stroke-width: 1px;\n    fill: #f88;\n  }\n\n  .node:hover,\n  .node > *:hover,\n  rect > *:hover {\n    cursor: pointer;\n    opacity: 0.6;\n  }\n\n  path.edge {\n    fill: none;\n    stroke: #666;\n    stroke-width: 3px;\n  }\n\n  .edge:hover {\n    cursor: pointer;\n    opacity: 0.4;\n  }\n\n  text.counter {\n    stroke: #080;\n  }\n\n  text.inflight {\n    stroke: #08f;\n  }\n</style>\n<div ng-class=\"{\'wiki-fixed\' : !isJmxTab}\" id=\"canvas\" ng-controller=\"Camel.RouteController\">\n  <!--\n  <div ng-hide=\"isJmxTab\">\n    <ng-include src=\"\'plugins/camel/html/breadcrumbBar.html\'\"></ng-include>\n  </div>\n  -->\n  <svg class=\"camel-diagram\" width=0 height=0>\n    <defs>\n      <marker id=\"arrowhead\"\n              viewBox=\"0 0 10 10\"\n              refX=\"8\"\n              refY=\"5\"\n              markerUnits=\"strokeWidth\"\n              markerWidth=\"4\"\n              markerHeight=\"3\"\n              orient=\"auto\"\n              style=\"fill: #333\">\n        <path d=\"M 0 0 L 10 5 L 0 10 z\"></path>\n      </marker>\n\n      <filter id=\"drop-shadow\" width=\"300%\" height=\"300%\">\n        <feGaussianBlur in=\"SourceAlpha\" result=\"blur-out\" stdDeviation=\"19\"/>\n        <feOffset in=\"blur-out\" result=\"the-shadow\" dx=\"2\" dy=\"2\"/>\n        <feComponentTransfer xmlns=\"http://www.w3.org/2000/svg\">\n          <feFuncA type=\"linear\" slope=\"0.2\"/>\n        </feComponentTransfer>\n        <feMerge xmlns=\"http://www.w3.org/2000/svg\">\n          <feMergeNode/>\n          <feMergeNode in=\"SourceGraphic\"/>\n        </feMerge>\n      </filter>\n      <linearGradient id=\"rect-gradient\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" style=\"stop-color:rgb(254,254,255);stop-opacity:1\"/>\n        <stop offset=\"100%\" style=\"stop-color:rgb(247,247,255);stop-opacity:1\"/>\n      </linearGradient>\n      <linearGradient id=\"rect-select-gradient\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" style=\"stop-color: #ffffa0; stop-opacity: 0.7\"/>\n        <stop offset=\"100%\" style=\"stop-color: #f0f0a0; stop-opacity: 0.7\"/>\n      </linearGradient>\n    </defs>\n  </svg>\n</div>\n\n");
$templateCache.put("plugins/camel/html/sendMessage.html","<div ng-controller=\"Camel.SendMessageController\">\n\n  <div class=\"tabbable\" ng-model=\"tab\">\n\n    <div value=\"compose\" class=\"tab-pane\" title=\"Compose\">\n      <div class=\"row\">\n        <span ng-show=\"noCredentials\" class=\"alert\">\n          No credentials set for endpoint!  Please set your username and password in the <a\n            href=\"\" ng-click=\"openPrefs()\">Preferences</a> page\n        </span>\n\n        <form class=\"form-inline pull-right\">\n          <button class=\"btn\" ng-click=\"addHeader()\" title=\"Add a new message header\"><i\n              class=\"fa fa-plus\"></i> Header\n          </button>\n          <button type=\"submit\" class=\"btn btn-primary\" ng-click=\"sendMessage()\">Send message</button>\n        </form>\n      </div>\n\n      <form class=\"form-inline bottom-margin\" ng-submit=\"addHeader()\">\n        <ol class=\"zebra-list header-list\">\n          <div class=\"row\">\n            <li ng-repeat=\"header in headers\">\n              <div class=\"col-md-4\">\n                <input type=\"text\" style=\"width: 100%\" class=\"headerName\"\n                       ng-model=\"header.name\"\n                       typeahead=\"completion for completion in defaultHeaderNames() | filter:$viewValue\"\n                       typeahead-editable=\'true\'\n                       placeholder=\"Header name\">\n              </div>\n              <div class=\"col-md-6\">\n                <input type=\"text\" style=\"width: 100%\" ng-model=\"header.value\"\n                       placeholder=\"Value of the message header\">\n              </div>\n              <div class=\"col-md-2\">\n                <button type=\"submit\" class=\"btn\" title=\"Add a new message header\">\n                  <i class=\"fa fa-plus\"></i>\n                </button>\n                <button type=\"button\" ng-click=\"removeHeader(header)\" class=\"btn\" title=\"Removes this message header\">\n                  <i class=\"fa fa-remove\"></i>\n                </button>\n              </div>\n            </li>\n          </div>\n        </ol>\n      </form>\n\n      <div class=\"row\">\n        <form class=\"form-inline\">\n          <div class=\"controls\">\n            <label class=\"control-label\" for=\"sourceFormat\" title=\"The text format to use for the message payload\">Payload\n              format: </label>\n            <select ng-model=\"codeMirrorOptions.mode.name\" id=\"sourceFormat\">\n              <option value=\"javascript\">JSON</option>\n              <option value=\"text\" selected>Plain text</option>\n              <option value=\"properties\">Properties</option>\n              <option value=\"xml\">XML</option>\n            </select>\n\n            <button class=\"btn\" ng-click=\"autoFormat()\"\n                    title=\"Automatically pretty prints the message so its easier to read\">Auto format\n            </button>\n          </div>\n        </form>\n      </div>\n\n      <div class=\"row\">\n        <div hawtio-editor=\"message\" mode=\"codeMirrorOptions.mode.name\"></div>\n        <!--\n        <textarea ui-codemirror=\"codeMirrorOptions\" ng-model=\"message\"></textarea>\n        -->\n      </div>\n    </div>\n\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/source.html","<div class=\"form-horizontal\" ng-controller=\"Camel.SourceController\">\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <button class=\"pull-right btn btn-primary\"\n              hawtio-show object-name=\"{{getSelectionCamelContextMBean(workspace)}}\" method-name=\"addOrUpdateRoutesFromXml\"\n              ng-click=\"saveRouteXml()\"><i class=\"fa fa-save\"></i> Update</button>\n    </div>\n  </div>\n  <p></p>\n  <div class=\"row\">\n    <div class=\"col-md-12\">\n      <div hawtio-editor=\"source\" mode=\"mode\"></div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/camel/html/traceRoute.html","<div ng-controller=\"Camel.TraceRouteController\">\n  <div class=\"col-md-12 well\" ng-hide=\"tracing\">\n    <form>\n      <p>Tracing allows you to send messages to a route and then step through and see the messages flow through a route\n        to aid debugging and to help diagnose issues.</p>\n\n      <p>Once you start tracing, you can send messages to the input endpoints, then come back to this page and see the\n        flow of messages through your route.</p>\n\n      <p>As you click on the message table, you can see which node in the flow it came through; moving the selection up\n        and down in the message table lets you see the flow of the message through the diagram.</p>\n\n      <button class=\"btn btn-info\" type=\"submit\" ng-click=\"startTracing()\">Start tracing</button>\n    </form>\n  </div>\n  <div ng-show=\"tracing\">\n\n    <form>\n      <button class=\"btn btn-info pull-right\" type=\"submit\" ng-click=\"stopTracing()\">Stop tracing</button>\n    </form>\n    <div ng-include src=\"graphView\">\n    </div>\n\n    <form>\n      <button class=\"btn btn-info pull-right\" type=\"submit\" ng-click=\"clear()\">Clear messages</button>\n    </form>\n    <div>&nbsp;</div>\n\n    <!-- table and slider to show the traced messages -->\n    <div class=\"row\">\n      <table class=\"table table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n\n    <div hawtio-slideout=\"showMessageDetails\" title=\"{{row.id}}\" top=\"60%\" height=\"40%\">\n      <div class=\"dialog-body\">\n\n        <div class=\"row\">\n          <div class=\"pull-right\">\n            <form class=\"form-horizontal no-bottom-margin\">\n              <div class=\"btn-group\" hawtio-pager=\"messages\" on-index-change=\"selectRowIndex\"\n                   row-index=\"rowIndex\"></div>\n\n              <!-- no need for close button as the hawtio-slideout already have that -->\n\n            </form>\n          </div>\n        </div>\n\n        <div class=\"row\">\n          <div class=\"expandable closed\">\n            <div title=\"Headers\" class=\"title\">\n              <i class=\"expandable-indicator\"></i> Headers\n            </div>\n            <div class=\"expandable-body well\">\n              <table class=\"table table-condensed table-striped\">\n                <thead>\n                <tr>\n                  <th>Header</th>\n                  <th>Type</th>\n                  <th>Value</th>\n                </tr>\n                </thead>\n                <tbody compile=\"row.headerHtml\"></tbody>\n              </table>\n            </div>\n          </div>\n\n          <div class=\"row\">\n            <div>Body type: <span ng-bind=\"row.bodyType\"></span></div>\n            <div hawtio-editor=\"row.body\" read-only=\"true\" mode=\"mode\"></div>\n          </div>\n\n        </div>\n\n      </div>\n    </div>\n\n  </div>\n\n</div>\n");
$templateCache.put("plugins/camel/html/typeConverter.html","<div class=\"row\" ng-controller=\"Camel.TypeConverterController\">\n\n  <!-- the dl need to be wider so we can see the labels -->\n  <style>\n    .dl-horizontal dt {\n      width: 260px;\n    }\n    .dl-horizontal dd {\n      margin-left: 280px;\n    }\n  </style>\n\n  <div ng-show=\"selectedMBean\">\n\n    <div class=\"row\">\n\n      <div class=\"pull-right\">\n        <form class=\"form-inline no-bottom-margin\">\n          <fieldset>\n            <div class=\"controls control-group inline-block controls-row\">\n              <div class=\"btn-group\">\n                <button\n                    class=\"btn\" ng-click=\"resetStatistics()\" title=\"Reset statistics\">\n                  <i class=\"fa fa-refresh\"></i></button>\n                <button\n                    ng-disabled=\"mbeanAttributes.StatisticsEnabled\"\n                    class=\"btn\" ng-click=\"enableStatistics()\" title=\"Enable statistics\">\n                  <i class=\"fa fa-play-circle\"></i></button>\n                <button\n                    ng-disabled=\"!mbeanAttributes.StatisticsEnabled\"\n                    class=\"btn\" ng-click=\"disableStatistics()\" title=\"Disable statistics\">\n                  <i class=\"fa fa-power-off\"></i></button>\n              </div>\n            </div>\n          </fieldset>\n        </form>\n      </div>\n      <div>\n        <dl class=\"dl-horizontal\">\n          <dt>Number of Type Converters</dt>\n          <dd>{{mbeanAttributes.NumberOfTypeConverters}}</dd>\n          <dt># Attempts</dt>\n          <dd>{{mbeanAttributes.AttemptCounter}}</dd>\n          <dt># Hit</dt>\n          <dd>{{mbeanAttributes.HitCounter}}</dd>\n          <dt># Miss</dt>\n          <dd>{{mbeanAttributes.MissCounter}}</dd>\n          <dt># Failed</dt>\n          <dd>{{mbeanAttributes.FailedCounter}}</dd>\n          <dt>Statistics Enabled</dt>\n          <dd>{{mbeanAttributes.StatisticsEnabled}}</dd>\n        </dl>\n      </div>\n\n    </div>\n\n    <div class=\"row\">\n      <div class=\"pull-right\">\n        <form class=\"form-inline no-bottom-margin\">\n          <fieldset>\n            <div class=\"control-group inline-block\">\n              <input type=\"text\" class=\"search-query\" placeholder=\"Filter...\"\n                     ng-model=\"gridOptions.filterOptions.filterText\">\n            </div>\n          </fieldset>\n        </form>\n      </div>\n    </div>\n\n    <div class=\"row\" ng-show=\"data.length > 0\">\n      <table class=\"table table-condensed table-striped\" hawtio-simple-table=\"gridOptions\"></table>\n    </div>\n    <div class=\"row\" ng-show=\"data.length == 0\">\n      <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n    </div>\n\n  </div>\n\n</div>\n\n");
$templateCache.put("plugins/karaf/html/feature-details.html","<div>\n    <table class=\"overviewSection\">\n        <tr ng-hide=\"hasFabric\">\n            <td></td>\n            <td class=\"less-big\">\n                <div class=\"btn-group\">\n                  <button ng-click=\"uninstall(name,version)\" \n                          class=\"btn\" \n                          title=\"uninstall\" \n                          hawtio-show\n                          object-name=\"{{featuresMBean}\"\n                          method-name=\"uninstallFeature\">\n                    <i class=\"fa fa-off\"></i>\n                  </button>\n                  <button ng-click=\"install(name,version)\" \n                          class=\"btn\" \n                          title=\"install\" \n                          hawtio-show\n                          object-name=\"{{featuresMBean}\"\n                          method-name=\"installFeature\">\n                    <i class=icon-play-circle\"></i>\n                  </button>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>Name:</strong></td>\n            <td class=\"less-big\">{{row.Name}}\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>Version:</strong></td>\n            <td class=\"less-big\">{{row.Version}}\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>Repository:</strong></td>\n            <td class=\"less-big\">{{row.RepositoryName}}\n            </td>\n        </tr>\n        <tr>\n          <td class=\"pull-right\"><strong>Repository URI:</strong></td>\n          <td class=\"less-big\">{{row.RepositoryURI}}\n          </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>State:</strong></td>\n            <td class=\"wrap\">\n                <div ng-switch=\"row.Installed\">\n                    <p style=\"display: inline;\" ng-switch-when=\"true\">Installed</p>\n\n                    <p style=\"display: inline;\" ng-switch-default>Not Installed</p>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionFeatures\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionFeatures\"\n                               href=\"#collapseFeatures\">\n                                Features\n                            </a>\n                        </div>\n                        <div id=\"collapseFeatures\" class=\"accordion-body collapse in\">\n                            <ul class=\"accordion-inner\">\n                                <li ng-repeat=\"feature in row.Dependencies\">\n                                    <a href=\'#/osgi/feature/{{feature.Name}}/{{feature.Version}}?p=container\'>{{feature.Name}}/{{feature.Version}}</a>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionBundles\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionBundles\"\n                               href=\"#collapseBundles\">\n                                Bundles\n                            </a>\n                        </div>\n                        <div id=\"collapseBundles\" class=\"accordion-body collapse in\">\n                            <ul class=\"accordion-inner\">\n                                <li ng-repeat=\"bundle in row.BundleDetails\">\n                                    <div ng-switch=\"bundle.Installed\">\n                                        <p style=\"display: inline;\" ng-switch-when=\"true\">\n                                            <a href=\'#/osgi/bundle/{{bundle.Identifier}}?p=container\'>{{bundle.Location}}</a></p>\n\n                                        <p style=\"display: inline;\" ng-switch-default>{{bundle.Location}}</p>\n                                    </div>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionConfigurations\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionConfigurations\"\n                               href=\"#collapsConfigurations\">\n                                Configurations\n                            </a>\n                        </div>\n                        <div id=\"collapsConfigurations\" class=\"accordion-body collapse in\">\n                            <table class=\"accordion-inner\">\n                                <tr ng-repeat=\"(pid, value) in row.Configurations\">\n                                    <td>\n                                      <p>{{value.Pid}}</p>\n                                      <div hawtio-editor=\"toProperties(value.Elements)\" mode=\"props\"></div></td>\n                                </tr>\n                            </table>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionConfigurationFiles\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionConfigurationFiles\"\n                               href=\"#collapsConfigurationFiles\">\n                                Configuration Files\n                            </a>\n                        </div>\n                        <div id=\"collapsConfigurationFiles\" class=\"accordion-body collapse in\">\n                            <table class=\"accordion-inner\">\n                                <tr ng-repeat=\"file in row.Files\">\n                                    <td>{{file.Files}}</td>\n                                </tr>\n                            </table>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n    </table>\n</div>\n");
$templateCache.put("plugins/karaf/html/feature.html","<div class=\"controller-section\" ng-controller=\"Karaf.FeatureController\">\n  <div class=\"row\">\n    <div class=\"col-md-4\">\n      <h1>{{row.id}}</h1>\n    </div>\n  </div>\n\n  <div ng-include src=\"\'plugins/karaf/html/feature-details.html\'\"></div>\n\n</div>\n\n");
$templateCache.put("plugins/karaf/html/features.html","<div class=\"controller-section\" ng-controller=\"Karaf.FeaturesController\">\n\n  <div class=\"row section-filter\">\n    <input type=\"text\" class=\"col-md-12 search-query\" placeholder=\"Filter...\" ng-model=\"filter\">\n    <i class=\"fa fa-remove clickable\" title=\"Clear filter\" ng-click=\"filter = \'\'\"></i>\n  </div>\n\n  <script type=\"text/ng-template\" id=\"popoverTemplate\">\n    <small>\n      <table class=\"table\">\n        <tbody>\n        <tr ng-repeat=\"(k, v) in feature track by $index\" ng-show=\"showRow(k, v)\">\n          <td class=\"property-name\">{{k}}</td>\n          <td class=\"property-value\" ng-bind-html-unsafe=\"showValue(v)\"></td>\n        </tr>\n        </tbody>\n      </table>\n    </small>\n  </script>\n\n  <p></p>\n  <div class=\"row\">\n    <div class=\"col-md-6\">\n      <h3 class=\"centered\">Installed Features</h3>\n      <div ng-show=\"featuresError\" class=\"alert alert-warning\">\n        The feature list returned by the server was null, please check the logs and Karaf console for errors.\n      </div>\n      <div class=\"bundle-list\"\n           hawtio-auto-columns=\".bundle-item\">\n        <div ng-repeat=\"feature in installedFeatures\"\n             class=\"bundle-item\"\n             ng-show=\"filterFeature(feature)\"\n             ng-class=\"inSelectedRepository(feature)\">\n          <a ng-href=\"#/osgi/feature/{{feature.Id}}?p=container\"\n             hawtio-template-popover title=\"Feature details\">\n            <span class=\"badge\" ng-class=\"getStateStyle(feature)\">{{feature.Name}} / {{feature.Version}}</span>\n          </a>\n          <span ng-hide=\"hasFabric\">\n            <a class=\"toggle-action\"\n               href=\"\"\n               ng-show=\"installed(feature.Installed)\"\n               ng-click=\"uninstall(feature)\"\n               hawtio-show\n               object-name=\"{{featuresMBean}\"\n               method-name=\"uninstallFeature\">\n              <i class=\"fa fa-power-off\"></i>\n            </a>\n            <a class=\"toggle-action\"\n               href=\"\"\n               ng-hide=\"installed(feature.Installed)\"\n               ng-click=\"install(feature)\"\n               hawtio-show\n               object-name=\"{{featuresMBean}\"\n               method-name=\"installFeature\">\n              <i class=\"fa fa-play-circle\"></i>\n            </a>\n          </span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"col-md-6\">\n      <h3 class=\"centered\">Available Features</h3>\n      <div class=\"row repository-browser-toolbar centered\">\n        <select id=\"repos\"\n                class=\"input-xlarge\"\n                title=\"Feature repositories\"\n                ng-model=\"selectedRepository\"\n                ng-options=\"r.repository for r in repositories\"></select>\n        <button class=\"btn\"\n                title=\"Remove selected feature repository\"\n                ng-click=\"uninstallRepository()\"\n                ng-hide=\"hasFabric\"\n                hawtio-show\n                object-name=\"{{featuresMBean}}\"\n                method-name=\"removeRepository\"><i class=\"fa fa-remove-sign\"></i></button>\n        <input type=\"text\"\n               class=\"input-xlarge\"\n               placeholder=\"mvn:foo/bar/1.0/xml/features\"\n               title=\"New feature repository URL\"\n               ng-model=\"newRepositoryURI\"\n               ng-hide=\"hasFabric\"\n               hawtio-show\n               object-name=\"{{featuresMBean}}\"\n               method-name=\"addRepository\">\n        <button class=\"btn\"\n                title=\"Add feature repository URL\"\n                ng-hide=\"hasFabric\"\n                ng-click=\"installRepository()\"\n                ng-disabled=\"isValidRepository()\"\n                hawtio-show\n                object-name=\"{{featuresMBean}}\"\n                method-name=\"addRepository\"><i class=\"fa fa-plus\"></i></button>\n      </div>\n      <div class=\"row\">\n        <div class=\"bundle-list\"\n             hawtio-auto-columns=\".bundle-item\">\n          <div ng-repeat=\"feature in selectedRepository.features\"\n               class=\"bundle-item\"\n               ng-show=\"filterFeature(feature)\"\n               hawtio-template-popover title=\"Feature details\">\n            <a ng-href=\"#/osgi/feature/{{feature.Id}}?p=container\">\n              <span class=\"badge\" ng-class=\"getStateStyle(feature)\">{{feature.Name}} / {{feature.Version}}</span>\n            </a >\n            <span ng-hide=\"hasFabric\">\n              <a class=\"toggle-action\"\n                 href=\"\"\n                 ng-show=\"installed(feature.Installed)\"\n                 ng-click=\"uninstall(feature)\"\n                 hawtio-show\n                 object-name=\"{{featuresMBean}\"\n                 method-name=\"uninstallFeature\">\n                <i class=\"fa fa-power-off\"></i>\n              </a>\n              <a class=\"toggle-action\"\n                 href=\"\"\n                 ng-hide=\"installed(feature.Installed)\"\n                 ng-click=\"install(feature)\"\n                 hawtio-show\n                 object-name=\"{{featuresMBean}\"\n                 method-name=\"installFeature\">\n                <i class=\"fa fa-play-circle\"></i>\n              </a>\n            </span>\n          </div>\n        </div>\n      </div>\n    </div>\n\n  </div>\n\n</div>\n");
$templateCache.put("plugins/karaf/html/scr-component-details.html","<div>\n    <table class=\"overviewSection\">\n        <tr ng-hide=\"hasFabric\">\n            <td></td>\n            <td class=\"less-big\">\n                <div class=\"btn-group\">\n                  <button class=\"btn\" \n                          ng-click=\"activate()\"\n                          hawtio-show\n                          object-name=\"{{scrMBean}}\"\n                          method-name=\"activateComponent\">\n                    <i class=\"fa fa-play-circle\"></i> Activate\n                  </button>\n                  <button class=\"btn\" \n                          ng-click=\"deactivate()\"\n                          hawtio-show\n                          object-name=\"{{scrMBean}}\"\n                          method-name=\"deactiveateComponent\">\n                    <i class=\"fa fa-off\"></i> Deactivate\n                  </button>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>Id:</strong></td>\n            <td class=\"less-big\">{{row.Id}}\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>Name:</strong></td>\n            <td class=\"less-big\">{{row.Name}}\n            </td>\n        </tr>\n        <tr>\n            <td class=\"pull-right\"><strong>State:</strong></td>\n            <td class=\"less-big\">{{row.State}}\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionProperties\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionProperties\"\n                               href=\"#collapseProperties\">\n                                Properties\n                            </a>\n                        </div>\n                        <div id=\"collapseProperties\" class=\"accordion-body collapse in\">\n                            <table class=\"accordion-inner\">\n                                <tr ng-repeat=\"(key, value) in row.Properties\">\n                                    <td valign=\"top\">{{key}}</td>\n                                    <td>{{value.Value}}</td>\n                                </tr>\n                            </table>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n            </td>\n            <td>\n                <div class=\"accordion\" id=\"accordionReferences\">\n                    <div class=\"accordion-group\">\n                        <div class=\"accordion-heading\">\n                            <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionReferences\"\n                               href=\"#collapseReferences\">\n                                References\n                            </a>\n                        </div>\n                        <div id=\"collapseReferences\" class=\"accordion-body collapse in\">\n                            <table class=\"accordion-inner\">\n                                <thead>\n                                <tr>\n                                    <th>Name</th>\n                                    <th>Availability</th>\n                                    <th>Cardinality</th>\n                                    <th>Policy</th>\n                                    <th>Bound Services</th>\n                                </tr>\n                                </thead>\n                                <tbody>\n                                    <tr ng-repeat=\"(key, value) in row.References\">\n                                        <td valign=\"left\" class=\"less-big\">{{value.Name}}</td>\n                                        <td valign=\"left\" class=\"less-big\">{{value.Availability}}</td>\n                                        <td valign=\"left\" class=\"less-big\">{{value.Cardinality}}</td>\n                                        <td valign=\"left\" class=\"less-big\">{{value.Policy}}</td>\n                                        <td>\n                                            <ul>\n                                                <li ng-repeat=\"id in value[\'Bound Services\']\">\n                                                    <i class=\"fa fa-cog less-big text-info\" id=\"bound.service.{{id}}\">{{id}}</i>\n                                                </li>\n                                            </ul>\n                                        </td>\n                                    </tr>\n                                </tbody>\n                            </table>\n                        </div>\n                    </div>\n                </div>\n            </td>\n        </tr>\n    </table>\n</div>\n");
$templateCache.put("plugins/karaf/html/scr-component.html","<div class=\"controller-section\" ng-controller=\"Karaf.ScrComponentController\">\n    <div class=\"row\">\n        <div class=\"col-md-4\">\n            <h1>{{row.id}}</h1>\n        </div>\n    </div>\n\n    <div ng-include src=\"\'plugins/karaf/html/scr-component-details.html\'\"></div>\n\n</div>\n");
$templateCache.put("plugins/karaf/html/scr-components.html","<div class=\"controller-section\" ng-controller=\"Karaf.ScrComponentsController\">\n  <div class=\"row\">\n    <div class=\"pull-left\">\n      <form class=\"form-inline no-bottom-margin\">\n        <fieldset>\n          <div class=\"control-group inline-block\">\n            <div class=\"btn-group\">\n              <button ng-disabled=\"selectedComponents.length == 0\" \n                      class=\"btn\" \n                      ng-click=\"activate()\"\n                      hawtio-show\n                      object-name=\"{{scrMBean}}\"\n                      method-name=\"activateComponent\"><i\n                      class=\"fa fa-play-circle\"></i> Activate\n              </button>\n              <button ng-disabled=\"selectedComponents.length == 0\" \n                      class=\"btn\" \n                      ng-click=\"deactivate()\"\n                      hawtio-show\n                      object-name=\"{{scrMBean}}\"\n                      method-name=\"deactiveateComponent\"><i\n                      class=\"fa fa-off\"></i> Deactivate\n              </button>\n            </div>\n          </div>\n        </fieldset>\n      </form>\n    </div>\n\n    <div class=\"pull-right\">\n      <input type=\"text\" class=\"input-text search-query\" placeholder=\"Filter...\" ng-model=\"scrOptions.filterOptions.filterText\">\n    </div>\n  </div>\n\n\n  <div class=\"row\">\n    <div class=\"gridStyle\" ng-grid=\"scrOptions\"></div>\n  </div>\n</div>\n");
$templateCache.put("plugins/karaf/html/server.html","<div class=\"controller-section row\" ng-controller=\"Karaf.ServerController\">\n\n  <dl class=\"dl-horizontal\">\n    <dt>Name</dt>\n    <dd>{{data.name}}</dd>\n    <dt>Version</dt>\n    <dd>{{data.version}}</dd>\n    <dt>State</dt>\n    <dd>{{data.state}}</dd>\n    <dt>Is root</dt>\n    <dd>{{data.root}}</dd>\n    <dt>Start Level</dt>\n    <dd>{{data.startLevel}}</dd>\n    <dt>Framework</dt>\n    <dd>{{data.framework}}</dd>\n    <dt>Framework Version</dt>\n    <dd>{{data.frameworkVersion}}</dd>\n    <dt>Location</dt>\n    <dd>{{data.location}}</dd>\n    <dt>SSH Port</dt>\n    <dd>{{data.sshPort}}</dd>\n    <dt>RMI Registry Port</dt>\n    <dd>{{data.rmiRegistryPort}}</dd>\n    <dt>RMI Server Port</dt>\n    <dd>{{data.rmiServerPort}}</dd>\n    <dt>PID</dt>\n    <dd>{{data.pid}}</dd>\n  </dl>\n\n</div>\n\n");
$templateCache.put("plugins/osgi/html/bundle-details.html","<div>\n  <table>\n    <tr>\n      <td></td>\n      <td class=\"less-big\">\n        <div class=\"btn-group\">\n          <button ng-click=\"stopBundle(bundleId)\" \n                  class=\"btn\" \n                  hawtio-show\n                  object-name=\"{{frameworkMBean}}\"\n                  method-name=\"stopBundle\"\n                  title=\"stop\"><i class=\"fa fa-off\"/></button>\n          <button ng-click=\"startBundle(bundleId)\" \n                  class=\"btn\" \n                  hawtio-show\n                  object-name=\"{{frameworkMBean}}\"\n                  method-name=\"startBundle\"\n                  title=\"start\"><i class=\"fa fa-play-circle\"/></button>\n          <button ng-click=\"refreshBundle(bundleId)\" \n                  class=\"btn\" \n                  hawtio-show\n                  object-name=\"{{frameworkMBean}}\"\n                  method-name=\"refreshBundle\"\n                  title=\"refresh\"><i class=\"fa fa-refresh\"/></button>\n          <button ng-click=\"updateBundle(bundleId)\" \n                  class=\"btn\" \n                  hawtio-show\n                  object-name=\"{{frameworkMBean}}\"\n                  method-name=\"updateBundle\"\n                  title=\"update\"><i class=\"fa fa-cloud-download\"/></button>\n          <button ng-click=\"uninstallBundle(bundleId)\" \n                  class=\"btn\" \n                  hawtio-show\n                  object-name=\"{{frameworkMBean}}\"\n                  method-name=\"uninstallBundle\"\n                  title=\"uninstall\"><i class=\"fa fa-eject\"/></button>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td><p/></td>\n      <td/>\n    <tr>\n      <td>\n        <div ng-switch=\"row.Fragment\">\n          <div ng-switch-when=\"true\"><strong>Fragment&nbsp;ID:</strong></div>\n          <div ng-switch-default><strong>Bundle&nbsp;ID:</strong></div>\n        </div>\n      </td>\n      <td class=\"less-big\">{{row.Identifier}}\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Bundle&nbsp;Name:</strong></td>\n      <td class=\"less-big\">{{row.Headers[\'Bundle-Name\'].Value}}\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Symbolic&nbsp;Name:</strong></td>\n      <td class=\"less-big label\">\n        <div id=\"bsn\" rel=\"tooltip\">{{row.SymbolicName}}</div>\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Version:</strong></td>\n      <td class=\"less-big\">{{row.Version}}\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Start&nbsp;Level:</strong></td>\n      <td class=\"less-big\">{{row.StartLevel}}\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Location:</strong></td>\n      <td class=\"less-big\">{{row.Location}}\n      </td>\n    </tr>\n    <tr>\n      <td><strong>State:</strong></td>\n      <td>\n        <div class=\"less-big label\" ng-class=\"row.StateStyle\">{{row.State}}</div>\n      </td>\n    </tr>\n    <tr>\n      <td><strong>Last&nbsp;Modified:</strong></td>\n      <td class=\"less-big\">{{row.LastModified | date:\'medium\'}}\n      </td>\n    </tr>\n    <tr>\n      <td>\n        <div ng-switch=\"row.Fragment\">\n          <div ng-switch-when=\"true\"><strong>Hosts:</strong></div>\n          <div ng-switch-default><strong>Fragments:</strong></div>\n        </div>\n      </td>\n      <td class=\"less-big\">\n        <div ng-switch=\"row.Fragment\">\n          <div ng-switch-when=\"true\" ng-bind-html-unsafe=\"row.Hosts\"/>\n          <div ng-switch-default ng-bind-html-unsafe=\"row.Fragments\"/>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n      </td>\n      <td>\n        <div class=\"accordion\" id=\"accordionInspectClassloading\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionInspectClassloading\"\n                 href=\"#collapseInspectClassloading\">\n                Inspect Classloading\n              </a>\n            </div>\n            <div id=\"collapseInspectClassloading\" class=\"accordion-body collapse in\">\n              <form class=\"form-inline\" hawtio-show object-name=\"{{osgiToolsMBean}}\" operation-name=\"getLoadClassOrigin\">\n                <fieldset>\n                  &nbsp;&nbsp;\n                  <input class=\"input-xlarge\" type=\"text\" ng-model=\"classToLoad\" placeHolder=\"Enter Class Name to Load...\">\n                  <button class=\"btn btn-success execute\" ng-click=\"executeLoadClass(classToLoad)\">Load class</button>\n                </fieldset>\n              </form>\n              <form class=\"form-inline\" hawtio-show object-name=\"{{osgiToolsMBean}}\" operation-name=\"getResourceURL\">\n                <fieldset>\n                  &nbsp;&nbsp;\n                  <input class=\"input-xlarge\" type=\"text\" ng-model=\"resourceToLoad\"\n                         placeHolder=\"Enter Resource Name to Find...\">\n                  <button class=\"btn btn-success execute\" ng-click=\"executeFindResource(resourceToLoad)\">Get resource\n                  </button>\n                </fieldset>\n              </form>\n              <div id=\"loadClassResult\"/>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n      </td>\n      <td>\n        <div class=\"accordion\" id=\"accordionImportedPackages\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionImportedPackages\"\n                 href=\"#collapseImportedPackages\">\n                Imported Packages\n              </a>\n            </div>\n            <div id=\"collapseImportedPackages\" class=\"accordion-body collapse in\">\n              <table>\n                <tr ng-repeat=\"(package, data) in row.ImportData\">\n                  <td>\n                    <div class=\"less-big badge\" id=\"import.{{package}}\">{{package}}</div>\n                  </td>\n                </tr>\n              </table>\n              <div id=\"unsatisfiedOptionalImports\"/>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n      </td>\n      <td>\n        <div class=\"accordion\" id=\"accordionExportedPackages\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionExportedPackages\"\n                 href=\"#collapseExportedPackages\">\n                Exported Packages\n              </a>\n            </div>\n            <div id=\"collapseExportedPackages\" class=\"accordion-body collapse in\">\n              <table>\n                <tr ng-repeat=\"(package, data) in row.ExportData\">\n                  <td>\n                    <div class=\"less-big badge badge-success\" id=\"export.{{package}}\">{{package}}</div>\n                  </td>\n                </tr>\n              </table>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td></td>\n      <td>\n        <div class=\"accordion\" id=\"accordionServices\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionServices\"\n                 href=\"#collapseServices\">\n                Services\n              </a>\n            </div>\n            <div id=\"collapseServices\" class=\"accordion-body collapse in\">\n              Registered Services\n              <table>\n                <tr ng-repeat=\"id in row.RegisteredServices\">\n                  <td><i class=\"fa fa-cog less-big text-success\" id=\"registers.service.{{id}}\">{{id}}</i></td>\n                </tr>\n              </table>\n              <br/>\n              Services used by this Bundle\n              <table>\n                <tr ng-repeat=\"id in row.ServicesInUse\">\n                  <td><i class=\"fa fa-cog less-big text-info\" id=\"uses.service.{{id}}\">{{id}}</i></td>\n                </tr>\n              </table>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n      </td>\n      <td>\n        <div class=\"accordion\" id=\"accordionRequiringBundles\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionRequiringBundles\"\n                 href=\"#collapseRequiringBundles\">\n                Other Bundles using this Bundle\n              </a>\n            </div>\n            <div id=\"collapseRequiringBundles\" class=\"accordion-body collapse in\">\n              <div class=\"accordion-inner\">\n                <span ng-bind-html-unsafe=\"row.RequiringBundles\"/>\n              </div>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n    <tr>\n      <td>\n      </td>\n      <td>\n        <div class=\"accordion\" id=\"accordionHeaders\">\n          <div class=\"accordion-group\">\n            <div class=\"accordion-heading\">\n              <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordionHeaders\"\n                 href=\"#collapsHeaders\">\n                Headers\n              </a>\n            </div>\n            <div id=\"collapsHeaders\" class=\"accordion-body collapse in\">\n              <table class=\"accordion-inner\">\n                <tr ng-repeat=\"(key, value) in row.Headers\" ng-show=\"showValue(key)\">\n                  <td valign=\"top\">{{key}}</td>\n                  <td>{{value.Value}}</td>\n                </tr>\n              </table>\n            </div>\n          </div>\n        </div>\n      </td>\n    </tr>\n  </table>\n</div>\n");
$templateCache.put("plugins/osgi/html/bundle-list.html","<div class=\"controller-section\" ng-controller=\"Osgi.BundleListController\">\n  <div class=\"row bundle-list-toolbar\">\n\n    <div class=\"pull-left\">\n      <div class=\"btn-group\">\n        <a ng-href=\"#/osgi/bundle-list?p=container\"\n                type=\"button\"\n                class=\"btn active\"\n                title=\"List view\">\n          <i class=\"fa fa-list\"></i>\n        </a>\n        <a ng-href=\"#/osgi/bundles?p=container\"\n                type=\"button\"\n                class=\"btn\"\n                title=\"Table view\">\n          <i class=\"fa fa-table\"></i>\n        </a>\n      </div>\n\n      <div class=\"input-group\" hawtio-show object-name=\"{{frameworkMBean}}\" method-name=\"installBundle\">\n        <input class=\"input-xxlarge\"\n               type=\"text\"\n               placeholder=\"Install Bundle...\"\n               ng-model=\"bundleUrl\">\n        <button ng-disabled=\"installDisabled()\"\n                class=\"btn\"\n                ng-click=\"install()\"\n                title=\"Install\">\n          <i class=\"fa fa-ok\"></i>\n        </button>\n      </div>\n\n    </div>\n\n\n    <div class=\"pull-right\">\n      <strong>Show bundles: </strong>\n      &nbsp;\n      <label for=\"showActiveMQBundles\">ActiveMQ</label>\n      <input id=\"showActiveMQBundles\" type=\"checkbox\" ng-model=\"display.showActiveMQBundles\">\n      &nbsp;\n      &nbsp;\n      <label for=\"showCamelBundles\">Camel</label>\n      <input id=\"showCamelBundles\" type=\"checkbox\" ng-model=\"display.showCamelBundles\">\n      &nbsp;\n      &nbsp;\n      <label for=\"showCxfBundles\">CXF</label>\n      <input id=\"showCxfBundles\" type=\"checkbox\" ng-model=\"display.showCxfBundles\">\n      &nbsp;\n      &nbsp;\n      <label for=\"showPlatformBundles\">Platform</label>\n      <input id=\"showPlatformBundles\" type=\"checkbox\" ng-model=\"display.showPlatformBundles\">\n      &nbsp;\n      &nbsp;\n      &nbsp;\n      <select class=\"input-lg\" ng-model=\"display.sortField\" id=\"sortField\">\n        <option value=\"Identifier\">Sort by ID</option>\n        <option value=\"Name\">Sort by Name</option>\n        <option value=\"SymbolicName\">Sort by Symbolic Name</option>\n      </select>\n      <select class=\"input-lg\" ng-model=\"display.bundleField\" id=\"bundleField\">\n        <option value=\"Name\">Display Name</option>\n        <option value=\"SymbolicName\">Display Symbolic Name</option>\n      </select>\n      <input class=\"input-sm search-query\" type=\"number\" min=\"0\"\n             ng-model=\"display.startLevelFilter\"\n             placeholder=\"Start Level...\"/>\n      <hawtio-filter ng-model=\"display.bundleFilter\" placeholder=\"Filter...\" save-as=\"osgi-bundle-list-text-filter\"></hawtio-filter>\n    </div>\n\n  </div>\n\n  <div class=\"row\" id=\"bundleTableHolder\">\n    <!-- Just create a bit of space between the form and the controls -->\n    <p></p>\n\n    <script type=\"text/ng-template\" id=\"popoverTemplate\">\n<small>\n  <table class=\"table\">\n    <tbody>\n    <tr ng-repeat=\"(k, v) in bundle track by $index\">\n      <td class=\"property-name\">{{k}}</td>\n      <td class=\"property-value\">{{v}}</td>\n    </tr>\n    </tbody>\n  </table>\n</small>\n    </script>\n\n    <div class=\"bundle-list centered\"\n         hawtio-auto-columns=\".bundle-item\">\n      <div ng-repeat=\"bundle in bundles\"\n           class=\"bundle-item\"\n           ng-show=\"filterBundle(bundle)\"\n           hawtio-template-popover title=\"Bundle details\">\n        <a id=\"{{bundle.Identifier}}\"\n           ng-href=\"#/osgi/bundle/{{bundle.Identifier}}?p=container\">\n          <span class=\"badge\" ng-class=\"getStateStyle(bundle.State)\">{{getLabel(bundle)}}</span>\n        </a>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/osgi/html/bundle.html","<div class=\"controller-section\" ng-controller=\"Osgi.BundleController\">\n  <div ng-include src=\"\'plugins/osgi/html/bundle-details.html\'\"></div>\n</div>\n");
$templateCache.put("plugins/osgi/html/bundles.html","<div class=\"controller-section\" ng-controller=\"Osgi.BundlesController\">\n  <div class=\"row\">\n    <div class=\"pull-left\">\n\n      <form class=\"form-inline no-bottom-margin\">\n        <fieldset>\n\n          <div class=\"btn-group inline-block\">\n            <a ng-href=\"#/osgi/bundle-list?p=container\"\n                    type=\"button\"\n                    class=\"btn\"\n                    title=\"List view\">\n              <i class=\"fa fa-list\"></i>\n            </a>\n            <a ng-href=\"#/osgi/bundles?p=container\"\n                    type=\"button\"\n                    class=\"btn active\"\n                    title=\"Table view\">\n              <i class=\"fa fa-table\"></i>\n            </a>\n          </div>\n\n          <div class=\"controls control-group inline-block controls-row\">\n            <div class=\"btn-group\">\n              <button ng-disabled=\"selected.length == 0\" class=\"btn\" ng-click=\"stop()\" title=\"Stop\"><i class=\"fa fa-off\"></i></button>\n              <button ng-disabled=\"selected.length == 0\" class=\"btn\" ng-click=\"start()\" title=\"Start\"><i class=\"fa fa-play-circle\"></i></button>\n              <button ng-disabled=\"selected.length == 0\" class=\"btn\" ng-click=\"refresh()\" title=\"Refresh\"><i class=\"fa fa-refresh\"></i></button>\n              <button ng-disabled=\"selected.length == 0\" class=\"btn\" ng-click=\"update()\" title=\"Update\"><i class=\"fa fa-cloud-download\"></i></button>\n              <button ng-disabled=\"selected.length == 0\" class=\"btn\" ng-click=\"uninstall()\" title=\"Uninstall\"><i class=\"fa fa-eject\"></i></button>\n            </div>\n            <div class=\"input-group\">\n              <input class=\"input-xlarge\" type=\"text\" placeholder=\"Install Bundle...\" ng-model=\"bundleUrl\">\n              <button ng-disabled=\"installDisabled()\" class=\"btn\" ng-click=\"install()\" title=\"Install\"><i class=\"fa fa-ok\"></i></button>\n            </div>\n          </div>\n        </fieldset>\n      </form>\n      \n    </div>\n\n    <div class=\"pull-right\">\n      <form class=\"form-inline no-bottom-margin\">\n        <fieldset>\n          <div class=\"control-group inline-block\">\n            <input type=\"text\"\n                   class=\"input-lg search-query\"\n                   placeholder=\"Filter...\"\n                   ng-model=\"gridOptions.filterOptions.filterText\">\n          </div>\n        </fieldset>\n      </form>\n\n    </div>\n  </div>\n  \n  \n  <div class=\"row\">\n    <div ng-hide=\"loading\" class=\"gridStyle\" ng-grid=\"gridOptions\"></div>\n    <div ng-show=\"loading\">\n      Please wait, loading...\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/osgi/html/configurations.html","<style type=\"text/css\">\n  .configuration-header {\n    margin: 20px 20px;\n  }\n\n  ul.configurations,\n  ul.configurations li {\n    list-style: none;\n  }\n\n  ul.configurations {\n    margin: 0px 20px;\n  }\n\n  ul.configurations .bundle-item {\n    display: list-item;\n    margin-bottom: 4px;\n  }\n\n  ul.configurations li.bundle-item a {\n    /*\n      TODO it\'d be nice to use the natural widgth here,\n      but then it might be nice to use multiple columns?\n    */\n    width: 450px;\n  }\n</style>\n\n<div class=\"controller-section\" ng-controller=\"Osgi.ConfigurationsController\">\n  <div class=\"row\">\n    <div class=\"configuration-header\">\n      <div class=\"configuration-filter\">\n        <input type=\"text\" class=\"col-md-8 search-query\" placeholder=\"Filter...\" ng-model=\"filterText\">\n        <i class=\"fa fa-remove clickable\" title=\"Clear filter\" ng-click=\"filterText = \'\'\"></i>\n        <button class=\"btn pull-right\" ng-click=\"addPidDialog.open()\" title=\"Add a new configuration\" hawtio-show object-name=\"{{hawtioConfigAdminMBean}}\" method-name=\"configAdminUpdate\"><i\n                class=\"fa fa-plus\"></i> Configuration\n        </button>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"row centered\" ng-hide=\"configurations.length\">\n    <p class=\"text-center\"><i class=\"fa fa-spinner fa-spin\"></i></p>\n  </div>\n\n  <ul class=\"configurations\">\n    <li ng-repeat=\'config in configurations | filter:filterText\' class=\'{{config.class}} bundle-item\'>\n      <a ng-href=\"{{config.pidLink}}\" title=\"{{config.description}}\">\n        <span class=\"{{config.kind.class}}\">{{config.name}}</span>\n      </a>\n      <ul ng-show=\"config.isFactory\">\n        <li ng-repeat=\"child in config.children\" class=\'{{child.class}} bundle-item\'>\n          <a ng-href=\"{{child.pidLink}}\" title=\"{{child.description}}\">\n            <span class=\"{{child.kind.class}}\">{{child.name}}</span>\n          </a>\n        </li>\n      </ul>\n    </li>\n  </ul>\n\n  <div modal=\"addPidDialog.show\" close=\"addPidDialog.close()\" options=\"addPidDialog.options\">\n    <form name=\"addPidDialogForm\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"addPid(newPid)\">\n      <div class=\"modal-header\"><h4>Add New Configuration</h4></div>\n      <div class=\"modal-body\">\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"newPid\">New configuration ID</label>\n\n          <div class=\"controls\">\n            <input class=\"input-xlarge\" type=\"text\" id=\"newPid\" ng-model=\"newPid\"/>\n          </div>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" ng-disabled=\"!(newPid !== \'\' && newPid !== undefined)\" type=\"submit\" value=\"Add\">\n        <input class=\"btn btn-primary\" ng-click=\"addPidDialog.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n</div>\n\n");
$templateCache.put("plugins/osgi/html/framework.html","<div class=\"container\" ng-controller=\"Osgi.FrameworkController\">\n    <h3>Framework Configuration</h3>\n    <div class=\"col-md-11\">\n    <table>\n        <tr>\n            <td><strong>Current Framework Start Level:</strong></td>\n            <td class=\"less-big\">{{startLevel}}</td>\n            <td><button class=\"btn btn-primary\" \n                        ng-click=\"edit(\'FrameworkStartLevel\', \'Framework Start Level\')\" \n                        title=\"Edit framework start level\"\n                        hawtio-show\n                        object-name=\"{{frameworkMBean}}\"\n                        method-name=\"setFrameworkStartLevel\">Edit</button></td>\n        </tr>\n        <tr><td><p></p></td></tr>\n        <tr>\n            <td><strong>Initial Bundle Start Level:</strong></td>\n            <td class=\"less-big\">{{initialBundleStartLevel}}</td>\n            <td><button class=\"btn btn-primary\"\n                        ng-click=\"edit(\'InitialBundleStartLevel\', \'Initial Bundle Start Level\')\" \n                        title=\"Edit initial bundle start level\"\n                        hawtio-show\n                        object-name=\"{{frameworkMBean}}\"\n                        method-name=\"setInitialBundleStartLevel\">Edit</button></td>\n        </tr>\n    </table>\n    </div>\n\n    <div modal=\"editDialog.show\" close=\"editDialog.close()\" options=\"editDialog.options\">\n        <form id=\"myForm\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"editDialog.close()\">\n            <div class=\"modal-header\"><h4>Change {{editDisplayName}}</h4></div>\n            <div class=\"modal-body\">\n                <p>New Start Level (0-100): <input ng-model=\"editResult\" type=\"number\" min=\"0\" max=\"100\" required/></p>\n            </div>\n            <div class=\"modal-footer\">\n                <input class=\"btn\" ng-click=\"editDialog.close()\" type=\"submit\" value=\"Cancel\">\n                <input class=\"btn btn-primary\" ng-click=\"edited(editAttr, editDisplayName, editResult)\" type=\"submit\" value=\"OK\">\n            </div>\n        </form>\n    </div>\n</div>\n");
$templateCache.put("plugins/osgi/html/layoutOsgi.html","<ul class=\"nav nav-tabs\" hawtio-auto-dropdown ng-controller=\"Karaf.NavBarController\">\n  <li ng-class=\'{active : isActive(\"#/osgi/configuration\") || isPrefixActive(\"#/osgi/pid\")}\'>\n      <a ng-href=\"#/osgi/configurations{{hash}}\">Configuration</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/bundle\")}\'>\n      <a ng-href=\"#/osgi/bundle-list{{hash}}\">Bundles</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/features\") || isActive(\"#/osgi/feature\")}\' ng-show=\"isFeaturesEnabled\">\n    <a ng-href=\"#/osgi/features{{hash}}\">Features</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/package\")}\'>\n      <a ng-href=\"#/osgi/packages{{hash}}\">Packages</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/service\")}\'>\n      <a ng-href=\"#/osgi/services{{hash}}\">Services</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/scr-components\")}\' ng-show=\"isScrEnabled\">\n    <a ng-href=\"#/osgi/scr-components{{hash}}\">Declarative Services</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/server\")}\'>\n    <a ng-href=\"#/osgi/server{{hash}}\">Server</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/fwk\")}\'>\n      <a ng-href=\"#/osgi/fwk{{hash}}\">Framework</a>\n  </li>\n  <li ng-class=\'{active : isActive(\"#/osgi/dependencies\")}\'>\n      <a ng-href=\"#/osgi/dependencies{{hash}}\">Dependencies</a>\n  </li>\n\n  <li class=\"dropdown overflow\" style=\"float: right !important; visibility: hidden;\">\n    <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\"><i class=\"fa fa-chevron-down\"></i></a>\n    <ul class=\"dropdown-menu right\"></ul>\n  </li>\n\n</ul>\n<div class=\"row\" ng-controller=\"Osgi.TopLevelController\">\n    <div ng-view></div>\n</div>\n\n\n");
$templateCache.put("plugins/osgi/html/package-details.html","<div>\n    <table class=\"overviewSection\">\n        <tr>\n            <td><strong>Name:</strong></td>\n            <td class=\"less-big\">{{row.Name}}\n            </td>\n        </tr>\n        <tr>\n            <td><strong>Version:</strong></td>\n            <td class=\"less-big\">{{row.Version}}\n            </td>\n        </tr>\n        <tr>\n            <td><strong>Removal Pending:</strong></td>\n            <td class=\"less-big\">{{row.RemovalPending}}\n        </tr>\n        <tr>\n            <td><strong>Exporting Bundles:</strong></td>\n            <td>\n                <ul>\n                    <li ng-repeat=\"name in row.ExportingBundles\">\n                        <a href=\'#/osgi/bundle/{{name}}{{hash}}\'>{{name}}</a>\n                    </li>\n                </ul>\n            </td>\n        </tr>\n        <tr>\n            <td><strong>Importing Bundles:</strong></td>\n            <td>\n                <ul>\n                    <li ng-repeat=\"name in row.ImportingBundles\">\n                        <a href=\'#/osgi/bundle/{{name}}{{hash}}\'>{{name}}</a>\n                    </li>\n                </ul>\n            </td>\n        </tr>\n    </table>\n</div>");
$templateCache.put("plugins/osgi/html/package.html","<div class=\"controller-section\" ng-controller=\"Osgi.PackageController\">\n\n<h1>{{row.id}}</h1>\n\n<div ng-include src=\"\'plugins/osgi/html/package-details.html\'\"></div>\n</div>\n");
$templateCache.put("plugins/osgi/html/packages.html","<script type=\"text/ng-template\" id=\"packageBundlesTemplate\">\n  <table>\n    <tr>\n      <th>Exporting Bundles</th>\n      <th>Importing Bundles</th>\n    </tr>\n    <tr>\n      <td>\n        <ul>\n          <li ng-repeat=\"b in row.ExportingBundles\">\n            <a href=\'#/osgi/bundle/{{b.Identifier}}?\'>{{b.SymbolicName}}</a>\n          </li>\n        </ul>\n      </td>\n      <td>\n        <ul>\n          <li ng-repeat=\"b in row.ImportingBundles\">\n            <a href=\'#/osgi/bundle/{{b.Identifier}}?\'>{{b.SymbolicName}}</a>\n          </li>\n        </ul>\n      </td>\n    </tr>\n  </table>\n</script>\n\n<div class=\"controller-section\" ng-controller=\"Osgi.PackagesController\">\n  <table class=\"table table-striped\" hawtio-simple-table=\"mygrid\"></table>\n</div>\n");
$templateCache.put("plugins/osgi/html/pid-details.html","<div>\n  <h4 title=\"{{metaType.description}}\">{{zkPid || metaType.name || pid}}\n    <span ng-show=\"factoryInstanceName\">: {{factoryInstanceName}}</span>\n  </h4>\n\n  <div ng-hide=\"editMode\">\n    <div class=\"row\">\n      <button class=\"btn\" ng-click=\"setEditMode(true)\" title=\"Edit this configuration\" hawtio-show object-name=\"{{hawtioConfigAdminMBean}}\" method-name=\"configAdminUpdate\"><i class=\"fa fa-edit\"></i> Edit</button>\n      <button class=\"btn btn-danger pull-right\" ng-click=\"deletePidDialog.open()\" title=\"Delete this configuration\" hawtio-show object-name=\"{{configAdminMBean}}\" method-name=\"delete\"><i class=\"fa fa-remove\"></i> Delete</button>\n    </div>\n    <div class=\"row config-admin-form view\">\n      <div simple-form name=\"pidEditor\" mode=\'view\' entity=\'entity\' data=\'schema\' schema=\"fullSchema\"></div>\n    </div>\n  </div>\n  <div ng-show=\"editMode\">\n    <div class=\"row\">\n      <button ng-show=\"newPid\" class=\"btn btn-primary\" ng-disabled=\"!canSave || !createForm.pidInstanceName\" ng-click=\"pidSave()\"><i class=\"fa fa-save\"></i> Create</button>\n      <button ng-hide=\"newPid\" class=\"btn btn-primary\" ng-disabled=\"!canSave\" ng-click=\"pidSave()\"><i class=\"fa fa-save\"></i> Save</button>\n      <button class=\"btn btn-warning\" ng-click=\"setEditMode(false)\"><i class=\"fa fa-remove\"></i> Cancel</button>\n      <button class=\"btn pull-right\" ng-click=\"addPropertyDialog.open()\" title=\"Add a new property value to this configuration\"><i class=\"fa fa-plus\"></i> Property</button>\n    </div>\n    <div class=\"row config-admin-form edit\">\n      <div ng-show=\"newPid\" class=\"new-config-name-form\">\n        <form class=\"form-horizontal\" action=\"\">\n          <fieldset>\n            <div class=\"control-group\">\n              <label class=\"control-label\" title=\"The name of the configuration file\">Configuration name: </label>\n              <div class=\"controls\">\n                <input type=\"text\" class=\"col-md-12\"\n                       title=\"The name of the configuration file\"\n                       ng-required=\"true\"\n                       ng-model=\"createForm.pidInstanceName\" name=\"path\"\n                       autofocus=\"autofocus\">\n              </div>\n            </div>\n          </fieldset>\n        </form>\n      </div>\n\n      <div simple-form name=\"pidEditor\" mode=\'edit\' entity=\'entity\' data=\'schema\' schema=\"fullSchema\" onSubmit=\"pidSave()\"></div>\n    </div>\n  </div>\n\n  <div modal=\"deletePropDialog.show\" close=\"deletePropDialog.close()\" options=\"deletePropDialog.options\">\n    <form name=\"deleteProperty\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"deletePidPropConfirmed()\">\n      <div class=\"modal-header\"><h4>Delete property \'{{deleteKey}}\'</h4></div>\n      <div class=\"modal-body\">\n        <p>Are you sure?</p>\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" type=\"submit\" value=\"Delete\">\n        <input class=\"btn btn-primary\" ng-click=\"deletePropDialog.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n\n  <div modal=\"deletePidDialog.show\" close=\"deletePidDialog.close()\" options=\"deletePidDialog.options\">\n    <form name=\"deletePid\" class=\"form-horizontal no-bottom-margin\" ng-submit=\"deletePidConfirmed()\">\n      <div class=\"modal-header\"><h4>Delete configuration: {{pid}}</h4></div>\n      <div class=\"modal-body\">\n        <p>Are you sure?</p>\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" type=\"submit\" value=\"Delete\">\n        <input class=\"btn btn-primary\" ng-click=\"deletePidDialog.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n\n  <div modal=\"addPropertyDialog.show\" close=\"addPropertyDialog.close()\" options=\"addPropertyDialog.options\">\n    <form name=\"addProperty\" class=\"form-horizontal no-bottom-margin\"\n          ng-submit=\"addPropertyConfirmed(addPropKey, addPropValue)\">\n      <div class=\"modal-header\"><h4>Add property</h4></div>\n      <div class=\"modal-body\">\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"propKey\">Key</label>\n\n          <div class=\"controls\">\n            <input class=\"input-xlarge\" type=\"text\" id=\"propKey\" placeholder=\"Key\" ng-model=\"addPropKey\"/>\n            <span class=\"help-block\"\n                  ng-hide=\"addPropKey !== \'\' && addPropKey !== undefined\">A key must be specified</span>\n          </div>\n        </div>\n        <div class=\"control-group\">\n          <label class=\"control-label\" for=\"propValue\">Value</label>\n\n          <div class=\"controls\">\n            <input class=\"input-xlarge\" type=\"text\" id=\"propValue\" placeholder=\"Value\" ng-model=\"addPropValue\"/>\n          </div>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <input class=\"btn btn-success\" ng-disabled=\"!(addPropKey !== \'\' && addPropKey !== undefined)\" type=\"submit\"\n               value=\"Add\">\n        <input class=\"btn btn-primary\" ng-click=\"addPropertyDialog.close()\" type=\"button\" value=\"Cancel\">\n      </div>\n    </form>\n  </div>\n</div>\n");
$templateCache.put("plugins/osgi/html/pid.html","<div class=\"controller-section\" ng-controller=\"Osgi.PidController\">\n  <div ng-include src=\"\'plugins/osgi/html/pid-details.html\'\"></div>\n</div>\n");
$templateCache.put("plugins/osgi/html/services.html","<script type=\"text/ng-template\" id=\"osgiServiceTemplate\">\n  <table>\n    <tr>\n      <th>Using Bundles</th>\n    </tr>\n    <tr>\n      <td>\n        <ul>\n          <li ng-repeat=\"b in row.UsingBundles\">\n            <a href=\'#/osgi/bundle/{{b.Identifier}}{{hash}}\'>{{b.SymbolicName}}</a>\n          </li>\n        </ul>\n      </td>\n    </tr>\n  </table>\n</script>\n\n<div class=\"controller-section\" ng-controller=\"Osgi.ServiceController\">\n\n  <table class=\"table table-striped\" hawtio-simple-table=\"mygrid\"></table>\n\n  <table cellpadding=\"0\" cellspacing=\"0\" border=\"0\"\n         class=\"table table-condensed table-striped table-bordered table-hover\"\n         id=\"grid\">\n    <thead>\n    <tr>\n      <th></th>\n      <th>ID</th>\n      <th>Bundle</th>\n      <th>Object Class(es)</th>\n    </tr>\n    </thead>\n    <tbody>\n  </table>\n</div>\n");
$templateCache.put("plugins/osgi/html/svc-dependencies.html","<style type=\"text/css\">\n\n    div#pop-up {\n        display: none;\n        position:absolute;\n        color: white;\n        font-size: 14px;\n        background: rgba(0,0,0,0.6);\n        padding: 5px 10px 5px 10px;\n        -moz-border-radius: 8px 8px;\n        border-radius: 8px 8px;\n    }\n\n    div#pop-up-title {\n        font-size: 15px;\n        margin-bottom: 4px;\n        font-weight: bolder;\n    }\n    div#pop-up-content {\n        font-size: 12px;\n    }\n\n    rect.graphbox {\n        fill: #DDD;\n    }\n\n    rect.graphbox.frame {\n        stroke: #222;\n        stroke-width: 2px\n    }\n\n    path.link {\n        fill: none;\n        stroke: #666;\n        stroke-width: 1.5px;\n    }\n\n    path.link.registered {\n        stroke: #444;\n    }\n\n    path.link.inuse {\n        stroke-dasharray: 0,2 1;\n    }\n\n    circle {\n        fill: #black;\n    }\n\n    circle.service {\n        fill: blue;\n    }\n\n    circle.bundle {\n        fill: black;\n    }\n\n    circle.package {\n        fill: gray;\n    }\n\n    text {\n        font: 10px sans-serif;\n        pointer-events: none;\n    }\n\n    text.shadow {\n        stroke: #fff;\n        stroke-width: 3px;\n        stroke-opacity: .8;\n    }\n\n</style>\n\n<div ng-controller=\"Osgi.ServiceDependencyController\">\n\n    <div class=\"pull-left\">\n        <form class=\"form-inline no-bottom-margin\">\n            <fieldset>\n                <div class=\"control-group inline-block\">\n                    <input type=\"text\" class=\"search-query\" placeholder=\"Filter Bundle Symbolic Name...\" ng-model=\"bundleFilter\">\n                    <input type=\"text\" class=\"search-query\" placeholder=\"Filter Package Name...\" ng-model=\"packageFilter\" ng-change=\"updatePkgFilter()\">\n                    <label class=\"radio\" for=\"showServices\">\n                        <input id=\"showServices\" type=\"radio\" value=\"services\" ng-model=\"selectView\"> Show Services\n                    </label>\n                    <label class=\"radio\" for=\"showPackages\">\n                        <input id=\"showPackages\" type=\"radio\" value=\"packages\" ng-model=\"selectView\" ng-disabled=\"disablePkg\"> Show Packages\n                    </label>\n                    <label class=\"checkbox\" for=\"hideUnused\">\n                        <input id=\"hideUnused\" type=\"checkbox\" ng-model=\"hideUnused\"> Hide Unused\n                    </label>\n                    <button class=\"btn btn-primary\" ng-click=\"updateGraph()\" title=\"Apply the selected criteria to the Graph.\">Apply</button>\n                </div>\n            </fieldset>\n        </form>\n    </div>\n\n  <div ng-hide=\"inDashboard\" class=\"add-link\">\n    <a ng-href=\"{{addToDashboardLink()}}\" title=\"Add this view to a Dashboard\"><i class=\"fa fa-share\"></i></a>\n  </div>\n\n    <div id=\"pop-up\">\n        <div id=\"pop-up-title\"></div>\n        <div id=\"pop-up-content\"></div>\n    </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-12 canvas\" style=\"min-height: 800px\">\n      <div hawtio-force-graph graph=\"graph\" link-distance=\"100\" charge=\"-300\" nodesize=\"6\"></div>\n    </div>\n  </div>\n\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-integration-templates");