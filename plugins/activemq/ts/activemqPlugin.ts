/// <reference path="../../includes.ts"/>
/// <reference path="activemqHelpers.ts"/>

/**
 * @module ActiveMQ
 * @main ActiveMQ
 */
module ActiveMQ {
  export var _module = angular.module(pluginName, []);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
            when('/activemq/browseQueue', {templateUrl: 'plugins/activemq/html/browseQueue.html'}).
            when('/activemq/createDestination', {templateUrl: 'plugins/activemq/html/createDestination.html'}).
            when('/activemq/deleteQueue', {templateUrl: 'plugins/activemq/html/deleteQueue.html'}).
            when('/activemq/deleteTopic', {templateUrl: 'plugins/activemq/html/deleteTopic.html'}).
            when('/activemq/sendMessage', {templateUrl: 'plugins/camel/html/sendMessage.html'}).
            when('/activemq/durableSubscribers', {templateUrl: 'plugins/activemq/html/durableSubscribers.html'}).
            when('/activemq/jobs', {templateUrl: 'plugins/activemq/html/jobs.html'})
  }]);

  _module.run(["HawtioNav", "$location", "workspace", "viewRegistry", "helpRegistry", "preferencesRegistry", "$templateCache", (nav:HawtioMainNav.Registry, $location:ng.ILocationService, workspace:Workspace, viewRegistry, helpRegistry, preferencesRegistry, $templateCache:ng.ITemplateCacheService) => {

    viewRegistry['{ "main-tab": "activemq" }'] = 'plugins/activemq/html/layoutActiveMQTree.html';
    helpRegistry.addUserDoc('activemq', 'plugins/activemq/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties("org.apache.activemq");
    });

    preferencesRegistry.addTab("ActiveMQ", "plugins/activemq/html/preferences.html", () => {
      return workspace.treeContainsDomainAndProperties("org.apache.activemq");              
    });

    workspace.addTreePostProcessor(postProcessTree);

    // register default attribute views
    var attributes = workspace.attributeColumnDefs;
    attributes[jmxDomain + "/Broker/folder"] = [
      {field: 'BrokerName', displayName: 'Name', width: "**"},
      {field: 'TotalProducerCount', displayName: 'Producer #'},
      {field: 'TotalConsumerCount', displayName: 'Consumer #'},
      {field: 'StorePercentUsage', displayName: 'Store %'},
      {field: 'TempPercentUsage', displayName: 'Temp %'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'TotalEnqueueCount', displayName: 'Enqueue #'},
      {field: 'TotalDequeueCount', displayName: 'Dequeue #'}
    ];
    attributes[jmxDomain + "/Queue/folder"] = [
      {field: 'Name', displayName: 'Name', width: "***"},
      {field: 'QueueSize', displayName: 'Queue Size'},
      {field: 'ProducerCount', displayName: 'Producer #'},
      {field: 'ConsumerCount', displayName: 'Consumer #'},
      {field: 'EnqueueCount', displayName: 'Enqueue #'},
      {field: 'DequeueCount', displayName: 'Dequeue #'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'DispatchCount', displayName: 'Dispatch #', visible: false}
    ];
    attributes[jmxDomain + "/Topic/folder"] = [
      {field: 'Name', displayName: 'Name', width: "****"},
      {field: 'ProducerCount', displayName: 'Producer #'},
      {field: 'ConsumerCount', displayName: 'Consumer #'},
      {field: 'EnqueueCount', displayName: 'Enqueue #'},
      {field: 'DequeueCount', displayName: 'Dequeue #'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'DispatchCount', displayName: 'Dispatch #', visible: false}
    ];
    attributes[jmxDomain + "/Consumer/folder"] = [
      {field: 'ConnectionId', displayName: 'Name', width: "**"},
      {field: 'PrefetchSize', displayName: 'Prefetch Size'},
      {field: 'Priority', displayName: 'Priority'},
      {field: 'DispatchedQueueSize', displayName: 'Dispatched Queue #'},
      {field: 'SlowConsumer', displayName: 'Slow ?'},
      {field: 'Retroactive', displayName: 'Retroactive'},
      {field: 'Selector', displayName: 'Selector'}
    ];
    attributes[jmxDomain + "/networkConnectors/folder"] = [
      {field: 'Name', displayName: 'Name', width: "**"},
      {field: 'UserName', displayName: 'User Name'},
      {field: 'PrefetchSize', displayName: 'Prefetch Size'},
      {field: 'ConduitSubscriptions', displayName: 'Conduit Subscriptions?'},
      {field: 'Duplex', displayName: 'Duplex'},
      {field: 'DynamicOnly', displayName: 'Dynamic Only'}
    ];
    attributes[jmxDomain + "/PersistenceAdapter/folder"] = [
      {field: 'IndexDirectory', displayName: 'Index Directory', width: "**"},
      {field: 'LogDirectory', displayName: 'Log Directory', width: "**"}
    ];

    var myUrl = '/jmx/attributes';

    var builder = nav.builder();
    var tab = builder.id('activemq')
                     .title( () => 'ActiveMQ' )
                     .defaultPage({
                       rank: 15,
                       isValid: (yes, no) => {
                         var name = 'ActiveMQDefaultPage';
                         workspace.addNamedTreePostProcessor(name, (tree) => {
                           workspace.removeNamedTreePostProcessor(name);
                           if (workspace.treeContainsDomainAndProperties(jmxDomain)) {
                             yes();
                           } else {
                             no();
                           }
                         });
                       }
                     })
                     .href( () => myUrl )
                     .isValid( () => workspace.treeContainsDomainAndProperties(jmxDomain) )
                     .build();
    tab.tabs = Jmx.getNavItems(builder, workspace, $templateCache, 'activemq');
    // add sub level tabs
    tab.tabs.push({
      id: 'activemq-browse',
      title: () => '<i class="fa fa-envelope"></i> Browse',
      tooltip: () => "Browse the messages on the queue",
      show: () => isQueue(workspace) && workspace.hasInvokeRights(workspace.selection, "browse()"),
      href: () => "/activemq/browseQueue" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-send',
      title: () => '<i class="fa fa-pencil"></i> Send',
      tooltip: () => "Send a message to this destination",
      show: () => (isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(workspace.selection, "sendTextMessage(java.util.Map,java.lang.String,java.lang.String,java.lang.String)"),
      href: () => "/activemq/sendMessage" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-durable-subscribers',
      title: () => '<i class="fa fa-list"></i> Durable Subscribers',
      tooltip: () => "Manage durable subscribers",
      show: () => isBroker(workspace),
      href: () => "/activemq/durableSubscribers" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-jobs',
      title: () => '<i class="fa fa-list"></i> Jobs',
      tooltip: () => "Manage jobs",
      show: () => isJobScheduler(workspace),
      href: () => "/activemq/jobs" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-create-destination',
      title: () => '<i class="fa fa-plus"></i> Create',
      tooltip: () => "Create a new destination",
      show: () => (isBroker(workspace) || isQueuesFolder(workspace) || isTopicsFolder(workspace) || isQueue(workspace) || isTopic(workspace)) && workspace.hasInvokeRights(getBroker(workspace), "addQueue", "addTopic"),
      href: () => "/activemq/createDestination" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-delete-topic',
      title: () => '<i class="fa fa-remove"></i> Delete',
      tooltip: () => "Delete this topic",
      show: () => isTopic(workspace) && workspace.hasInvokeRights(getBroker(workspace), "removeTopic"),
      href: () => "/activemq/deleteTopic" + workspace.hash()
    });
    tab.tabs.push({
      id: 'activemq-delete-queue',
      title: () => '<i class="fa fa-remove"></i> Delete',
      tooltip: () => "Delete or purge this queue",
      show: () => isQueue(workspace) && workspace.hasInvokeRights(getBroker(workspace), "removeQueue"),
      href: () => "/activemq/deleteQueue" + workspace.hash()
    });
    nav.add(tab);

    function postProcessTree(tree) {
      var activemq = tree.get("org.apache.activemq");
      setConsumerType(activemq);

      // lets move queue and topic as first children within brokers
      if (activemq) {
        angular.forEach(activemq.children, (broker) => {
          angular.forEach(broker.children, (child) => {
            // lets move Topic/Queue to the front.
            var grandChildren = child.children;
            if (grandChildren) {
              var names = ["Topic", "Queue"];
              angular.forEach(names, (name) => {
                var idx = grandChildren.findIndex(n => n.title === name);
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

    function setConsumerType(node:Core.Folder) {
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
            node.icon = Core.url("/img/icons/activemq/connector.png");
          }
        }
        angular.forEach(node.children, (child) => setConsumerType(child));
      }
    }
  }]);

  hawtioPluginLoader.addModule(pluginName);

  export function getBroker(workspace:Workspace) {
    var answer:Core.Folder = null;
    var selection = workspace.selection;
    if (selection) {
      answer = <Core.Folder> selection.findAncestor((current:Core.Folder) => {
        // log.debug("Checking current: ", current);
        var entries = <any> current.entries;
        if (entries) {
          return (('type' in entries && entries.type === 'Broker') && 'brokerName' in entries && !('destinationName' in entries) && !('destinationType' in entries))
        } else {
          return false;
        }
      });
      // log.debug("Found ancestor: ", answer);
    }
    return answer;
  }

  export function isQueue(workspace:Workspace) {
    //return workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
    return workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Queue'}, 4) || workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
  }

  export function isTopic(workspace:Workspace) {
    //return workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
    return workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Topic'}, 4) || workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
  }

  export function isQueuesFolder(workspace:Workspace) {
    return workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Queue');
  }

  export function isTopicsFolder(workspace:Workspace) {
    return workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Topic');
  }

  export function isJobScheduler(workspace:Workspace) {
      return workspace.hasDomainAndProperties(jmxDomain, {'service': 'JobScheduler'}, 4);
  }

  export function isBroker(workspace:Workspace) {
    if (workspace.selectionHasDomainAndType(jmxDomain, 'Broker')) {
      var self = Core.pathGet(workspace, ["selection"]);
      var parent = Core.pathGet(workspace, ["selection", "parent"]);
      return !(parent && (parent.ancestorHasType('Broker') || self.ancestorHasType('Broker')));
    }
    return false;
  }
}
