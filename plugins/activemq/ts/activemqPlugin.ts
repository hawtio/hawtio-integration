/// <reference path="destination/destination.module.ts"/>
/// <reference path="tree/tree.module.ts"/>
/// <reference path="activemq.component.ts"/>
/// <reference path="activemq-navigation.component.ts"/>
/// <reference path="activemq-navigation.service.ts"/>
/// <reference path="activemqHelpers.ts"/>

namespace ActiveMQ {

  export const _module = angular
    .module(pluginName, [
      'angularResizable',
      destinationModule,
      treeModule,
    ])
    .config(defineRoutes)
    .controller('topicsController', ['$scope', ($scope): void => {
      $scope.destinationType = 'topics';
    }])
    .controller('queuesController', ['$scope', ($scope): void => {
      $scope.destinationType = 'queues';
    }])
    .component('activemq', activeMQComponent)
    .component('activemqNavigation', activeMQNavigationComponent)
    .service('activeMQNavigationService', ActiveMQNavigationService)
    .run(configurePlugin);

  function defineRoutes(configManager: Core.ConfigManager): void {
    'ngInject';
    configManager.
      addRoute('/activemq/browseQueue',        {templateUrl: 'plugins/activemq/html/browseQueue.html'}).
      addRoute('/activemq/createDestination',  {template:    '<create-destination></create-destination>'}).
      addRoute('/activemq/deleteQueue',        {template:    '<delete-queue></delete-queue>'}).
      addRoute('/activemq/deleteTopic',        {template:    '<delete-topic></delete-topic>'}).
      addRoute('/activemq/sendMessage',        {templateUrl: 'plugins/camel/html/sendMessage.html'}).
      addRoute('/activemq/durableSubscribers', {templateUrl: 'plugins/activemq/html/durableSubscribers.html'}).
      addRoute('/activemq/jobs',               {templateUrl: 'plugins/activemq/html/jobs.html'}).
      addRoute('/activemq/queues',             {templateUrl: 'plugins/activemq/html/destinations.html', controller: 'queuesController'}).
      addRoute('/activemq/topics',             {templateUrl: 'plugins/activemq/html/destinations.html', controller: 'topicsController'});
  }

  function configurePlugin(
      mainNavService: Nav.MainNavService,
      workspace: Jmx.Workspace,
      helpRegistry: Help.HelpRegistry,
      preferencesRegistry: Core.PreferencesRegistry,
      localStorage: Storage,
      preLogoutTasks: Core.Tasks,
      documentBase: string,
      activeMQNavigationService: ActiveMQNavigationService
    ): void {
    'ngInject';

    helpRegistry.addUserDoc('activemq', 'plugins/activemq/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties("org.apache.activemq");
    });

    preferencesRegistry.addTab("ActiveMQ", "plugins/activemq/html/preferences.html", () => {
      return workspace.treeContainsDomainAndProperties("org.apache.activemq");
    });

    mainNavService.addItem({
      title: 'ActiveMQ',
      href: '/jmx/attributes',
      template: '<activemq></activemq>',
      isValid: () => workspace.treeContainsDomainAndProperties(jmxDomain) && activeMQNavigationService.getTabs().length > 0
    });

    workspace.addTreePostProcessor(postProcessTree);

    // clean up local storage upon logout
    preLogoutTasks.addTask('CleanupActiveMQCredentials', () => {
      log.debug("Clean up ActiveMQ credentials in local storage");
      localStorage.removeItem('activemqUserName');
      localStorage.removeItem('activemqPassword');
    });

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
  }

  hawtioPluginLoader.addModule(pluginName);

}
