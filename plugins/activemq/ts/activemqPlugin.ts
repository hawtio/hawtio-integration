/// <reference path="activemqHelpers.ts"/>
/// <reference path="destination/destination.module.ts"/>

namespace ActiveMQ {

  export const pluginName: string = 'activemq';
  
  export const _module = angular.module(pluginName, [
    'angularResizable',
    destinationModule
  ]);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider.
        when('/activemq/browseQueue',        {templateUrl: 'plugins/activemq/html/browseQueue.html'}).
        when('/activemq/createDestination',  {template:    '<create-destination></create-destination>'}).
        when('/activemq/deleteQueue',        {template:    '<delete-queue></delete-queue>'}).
        when('/activemq/deleteTopic',        {template:    '<delete-topic></delete-topic>'}).
        when('/activemq/sendMessage',        {templateUrl: 'plugins/camel/html/sendMessage.html'}).
        when('/activemq/durableSubscribers', {templateUrl: 'plugins/activemq/html/durableSubscribers.html'}).
        when('/activemq/jobs',               {templateUrl: 'plugins/activemq/html/jobs.html'}).
        when('/activemq/queues',             {templateUrl: 'app/activemq/html/destinations.html'}).
        when('/activemq/topics',             {templateUrl: 'app/activemq/html/destinations.html', controller: 'topicsController'})
  }]);

  _module.controller('topicsController', function($scope) {
      $scope.destinationType = 'topic';
  });

  _module.run(["HawtioNav", "$location", "workspace", "viewRegistry", "helpRegistry", "preferencesRegistry", "$templateCache", "documentBase", (
      nav: HawtioMainNav.Registry,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      viewRegistry,
      helpRegistry,
      preferencesRegistry: HawtioPreferences.PreferencesRegistry,
      $templateCache: ng.ITemplateCacheService,
      documentBase: string) => {

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
      {field: 'TotalProducerCount', displayName: 'Producer'},
      {field: 'TotalConsumerCount', displayName: 'Consumer'},
      {field: 'StorePercentUsage', displayName: 'Store %'},
      {field: 'TempPercentUsage', displayName: 'Temp %'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'TotalEnqueueCount', displayName: 'Enqueue'},
      {field: 'TotalDequeueCount', displayName: 'Dequeue'}
    ];
    attributes[jmxDomain + "/Queue/folder"] = [
      {field: 'Name', displayName: 'Name', width: "***"},
      {field: 'QueueSize', displayName: 'Queue Size'},
      {field: 'ProducerCount', displayName: 'Producer'},
      {field: 'ConsumerCount', displayName: 'Consumer'},
      {field: 'EnqueueCount', displayName: 'Enqueue'},
      {field: 'DequeueCount', displayName: 'Dequeue'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'DispatchCount', displayName: 'Dispatch', visible: false}
    ];
    attributes[jmxDomain + "/Topic/folder"] = [
      {field: 'Name', displayName: 'Name', width: "****"},
      {field: 'ProducerCount', displayName: 'Producer'},
      {field: 'ConsumerCount', displayName: 'Consumer'},
      {field: 'EnqueueCount', displayName: 'Enqueue'},
      {field: 'DequeueCount', displayName: 'Dequeue'},
      {field: 'MemoryPercentUsage', displayName: 'Memory %'},
      {field: 'DispatchCount', displayName: 'Dispatch', visible: false}
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

    const tab = nav.builder().id('activemq')
      .title(() => 'ActiveMQ')
      .defaultPage({
        rank: 15,
        isValid: (yes, no) => workspace.treeContainsDomainAndProperties(jmxDomain) ? yes() : no()
      })
      .href(() => '/jmx/attributes')
      .isValid(() => workspace.treeContainsDomainAndProperties(jmxDomain))
      .isSelected(() => workspace.isMainTabActive('activemq'))
      .build();

    nav.add(tab);

    function postProcessTree(tree: Jmx.Folder) {
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
                var idx = _.findIndex(grandChildren, n => n.text === name);
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

    function setConsumerType(node: Jmx.NodeSelection) {
      if (node) {
        var parent = node.parent;
        var entries = node.entries;
        if (parent && !parent.typeName && entries) {
          var endpoint = entries["endpoint"];
          if (endpoint === "Consumer" || endpoint === "Producer") {
            parent.typeName = endpoint;
          }
          var connectorName = entries["connectorName"];
          if (connectorName && !node.icon) {
            // lets default a connector icon
            node.icon = UrlHelpers.join(documentBase, "/img/icons/activemq/connector.png");
          }
        }
        angular.forEach(node.children, (child: Jmx.NodeSelection) => setConsumerType(child));
      }
    }
  }]);

  hawtioPluginLoader.addModule(pluginName);

  export function getBroker(workspace: Jmx.Workspace) {
    var answer: Jmx.Folder = null;
    var selection = workspace.selection;
    if (selection) {
      answer = <Jmx.Folder> selection.findAncestor((current: Jmx.Folder) => {
        // log.debug("Checking current: ", current);
        var entries = <any> current.entries;
        if (entries) {
          return (('type' in entries && entries.type === 'Broker') && 'brokerName' in entries && !('destinationName' in entries) && !('destinationType' in entries))
        } else {
          return false;
        }
      });
    }
    return answer;
  }

  export function isQueue(workspace: Jmx.Workspace) {
    //return workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
    return workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Queue'}, 4) || workspace.selectionHasDomainAndType(jmxDomain, 'Queue');
  }

  export function isTopic(workspace: Jmx.Workspace) {
    //return workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
    return workspace.hasDomainAndProperties(jmxDomain, {'destinationType': 'Topic'}, 4) || workspace.selectionHasDomainAndType(jmxDomain, 'Topic');
  }

  export function isQueuesFolder(workspace: Jmx.Workspace) {
    return workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Queue');
  }

  export function isTopicsFolder(workspace: Jmx.Workspace) {
    return workspace.selectionHasDomainAndLastFolderName(jmxDomain, 'Topic');
  }

  export function isJobScheduler(workspace: Jmx.Workspace) {
      return workspace.hasDomainAndProperties(jmxDomain, {'service': 'JobScheduler'}, 4);
  }

  export function isBroker(workspace: Jmx.Workspace) {
    if (workspace.selectionHasDomainAndType(jmxDomain, 'Broker')) {
      var self = Core.pathGet(workspace, ["selection"]);
      var parent = Core.pathGet(workspace, ["selection", "parent"]);
      return !(parent && (parent.ancestorHasType('Broker') || self.ancestorHasType('Broker')));
    }
    return false;
  }
}
