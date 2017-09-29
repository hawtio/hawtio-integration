/// <reference path="camelHelpers.ts"/>
/// <reference path="contexts/contexts.module.ts"/>
/// <reference path="routes/routes.module.ts"/>

namespace Camel {

  export const pluginName: string = 'camel';

  export const _module = angular.module(pluginName, [
    'patternfly',
    'patternfly.table',
    'angularResizable',
    contextsModule,
    routesModule
  ]);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
            .when('/camel/contexts', {template: '<contexts></contexts>'})
            .when('/camel/routes', {template: '<routes></routes>'})
            .when('/camel/browseEndpoint', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/endpoint/browse/:contextId/*endpointPath', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/createEndpoint', {templateUrl: 'plugins/camel/html/createEndpoint.html'})
            .when('/camel/route/diagram/:contextId/:routeId', {templateUrl: 'plugins/camel/html/routeDiagram.html'})
            .when('/camel/routeDiagram', {templateUrl: 'plugins/camel/html/routeDiagram.html'})
            .when('/camel/typeConverter', {templateUrl: 'plugins/camel/html/typeConverter.html', reloadOnSearch: false})
            .when('/camel/restServices', {templateUrl: 'plugins/camel/html/restServices.html', reloadOnSearch: false})
            .when('/camel/endpointRuntimeRegistry', {templateUrl: 'plugins/camel/html/endpointRuntimeRegistry.html', reloadOnSearch: false})
            .when('/camel/routeMetrics', {templateUrl: 'plugins/camel/html/routeMetrics.html', reloadOnSearch: false})
            .when('/camel/exchanges', {templateUrl: 'plugins/camel/html/exchanges.html', reloadOnSearch: false})
            .when('/camel/sendMessage', {templateUrl: 'plugins/camel/html/sendMessage.html', reloadOnSearch: false})
            .when('/camel/source', {templateUrl: 'plugins/camel/html/source.html'})
            .when('/camel/traceRoute', {templateUrl: 'plugins/camel/html/traceRoute.html'})
            .when('/camel/debugRoute', {templateUrl: 'plugins/camel/html/debug.html'})
            .when('/camel/profileRoute', {templateUrl: 'plugins/camel/html/profileRoute.html'})
            .when('/camel/propertiesRoute', {templateUrl: 'plugins/camel/html/propertiesRoute.html'})
            .when('/camel/propertiesComponent', {templateUrl: 'plugins/camel/html/propertiesComponent.html'})
            .when('/camel/propertiesDataFormat', {templateUrl: 'plugins/camel/html/propertiesDataFormat.html'})
            .when('/camel/propertiesEndpoint', {templateUrl: 'plugins/camel/html/propertiesEndpoint.html'});
  }]);

  _module.factory('tracerStatus',function () {
    return {
      jhandle: null,
      messages: []
    };
  });

  _module.filter('camelIconClass', () => iconClass);

  _module.factory('activeMQMessage', () => {
      return { 'message' : null}
  });

  // service for the codehale metrics
  _module.factory('metricsWatcher', ["$window", ($window) => {
    var answer: any = $window.metricsWatcher;
    if (!answer) {
      // lets avoid any NPEs
      answer = {};
      $window.metricsWatcher = answer;
    }
    return answer;
  }]);


  _module.run(["HawtioNav", "workspace", "jolokia", "viewRegistry", "layoutFull", "helpRegistry", "preferencesRegistry", "$templateCache", "$location", "$rootScope", (
      nav: HawtioMainNav.Registry,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      viewRegistry,
      layoutFull,
      helpRegistry,
      preferencesRegistry: HawtioPreferences.PreferencesRegistry,
      $templateCache: ng.ITemplateCacheService,
      $location: ng.ILocationService,
      $rootScope: ng.IRootScopeService) => {

    viewRegistry['camel/endpoint/'] = layoutFull;
    viewRegistry['camel/route/'] = layoutFull;
    viewRegistry['{ "main-tab": "camel" }'] = 'plugins/camel/html/layoutCamelTree.html';

    helpRegistry.addUserDoc('camel', 'plugins/camel/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain);
    });
    preferencesRegistry.addTab('Camel', 'plugins/camel/html/preferences.html', () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain); 
    });

    // register default attribute views
    var stateField = 'State';
    var stateTemplate = '<div class="ngCellText pagination-centered" title="{{row.getProperty(col.field)}}"><i class="{{row.getProperty(\'' + stateField + '\') | camelIconClass}}"></i></div>';
    var stateColumn = {field: stateField, displayName: stateField,
      cellTemplate: stateTemplate,
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      resizable: false,
      defaultSort: false
      // we do not want to default sort the state column
    };

    var attributes = workspace.attributeColumnDefs;
    attributes[jmxDomain + "/context/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'Uptime', displayName: 'Uptime', visible: false},
      {field: 'CamelVersion', displayName: 'Version', visible: false},
      {field: 'ExchangesCompleted', displayName: 'Completed'},
      {field: 'ExchangesFailed', displayName: 'Failed'},
      {field: 'FailuresHandled', displayName: 'Failed Handled', visible: false},
      {field: 'ExchangesTotal', displayName: 'Total', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery', visible: false},
      {field: 'ExchangesInflight', displayName: 'Inflight'},
      {field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: false},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false},
      {field: 'StartedRoutes', displayName: 'Started Routes'},
      {field: 'TotalRoutes', displayName: 'Total Routes'}
    ];
    attributes[jmxDomain + "/routes/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'ExchangesCompleted', displayName: 'Completed'},
      {field: 'ExchangesFailed', displayName: 'Failed'},
      {field: 'FailuresHandled', displayName: 'Failed Handled', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery', visible: false},
      {field: 'ExchangesTotal', displayName: 'Total', visible: false},
      {field: 'ExchangesInflight', displayName: 'Inflight'},
      {field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: false},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false}
    ];
    attributes[jmxDomain + "/processors/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'ProcessorId', displayName: 'Processor'},
      {field: 'ExchangesCompleted', displayName: 'Completed'},
      {field: 'ExchangesFailed', displayName: 'Failed'},
      {field: 'FailuresHandled', displayName: 'Failed Handled', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery', visible: false},
      {field: 'ExchangesTotal', displayName: 'Total', visible: false},
      {field: 'ExchangesInflight', displayName: 'Inflight'},
      {field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: false},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery', visible: false}
    ];
    attributes[jmxDomain + "/components/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'ComponentName', displayName: 'Name'}
    ];
    attributes[jmxDomain + "/consumers/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'EndpointUri', displayName: 'Endpoint URI', width: "**"},
      {field: 'Suspended', displayName: 'Suspended', resizable: false},
      {field: 'InflightExchanges', displayName: 'Inflight'}
    ];
    attributes[jmxDomain + "/producers/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'EndpointUri', displayName: 'Endpoint URI', width: "**"},
      {field: 'Suspended', displayName: 'Suspended', resizable: false}
    ];
    attributes[jmxDomain + "/services/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'Suspended', displayName: 'Suspended', resizable: false},
      {field: 'SupportsSuspended', displayName: 'Can Suspend', resizable: false}
    ];
    attributes[jmxDomain + "/endpoints/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'EndpointUri', displayName: 'Endpoint URI', width: "***"},
      {field: 'Singleton', displayName: 'Singleton', resizable: false }
    ];
    attributes[jmxDomain + "/threadpools/folder"] = [
      {field: 'Id', displayName: 'Id', width: "**"},
      {field: 'ActiveCount', displayName: 'Active'},
      {field: 'PoolSize', displayName: 'Pool Size'},
      {field: 'CorePoolSize', displayName: 'Core Pool Size'},
      {field: 'TaskQueueSize', displayName: 'Task Queue Size'},
      {field: 'TaskCount', displayName: 'Task'},
      {field: 'CompletedTaskCount', displayName: 'Completed Task'}
    ];
    attributes[jmxDomain + "/errorhandlers/folder"] = [
      {field: 'CamelId', displayName: 'Context'},
      {field: 'DeadLetterChannel', displayName: 'Dead Letter'},
      {field: 'DeadLetterChannelEndpointUri', displayName: 'Endpoint URI', width: "**", resizable: true},
      {field: 'MaximumRedeliveries', displayName: 'Max Redeliveries'},
      {field: 'RedeliveryDelay', displayName: 'Redelivery Delay'},
      {field: 'MaximumRedeliveryDelay', displayName: 'Max Redeliveries Delay'}
    ];

    const tab = nav.builder().id('camel')
      .title(() => 'Camel')
      .defaultPage({
        rank: 20,
        isValid: (yes, no) => workspace.treeContainsDomainAndProperties(jmxDomain) ? yes() : no()
      })
      .href(() => '/camel/contexts?main-tab=camel')
      .isValid(() => workspace.treeContainsDomainAndProperties(jmxDomain))
      .isSelected(() => workspace.isMainTabActive('camel'))
      .build();

    nav.add(tab);

    workspace.addNamedTreePostProcessor('camel', (tree: Jmx.Folder) => {
      const domainName = Camel.jmxDomain;
      if (tree) {
        const rootFolder = new Jmx.Folder('Camel Contexts');
        rootFolder.class = 'org-apache-camel-context-folder';
        rootFolder.children = [];
        rootFolder.typeName = 'context';
        rootFolder.key = 'camelContexts';
        rootFolder.domain = domainName;

        const domain = tree.get(domainName);
        if (domain) {
          const children = [];
          angular.forEach(domain.children, (child, key) => {
            const contextsFolder = child.get('context');
            const routesNode = child.get('routes');
            const endpointsNode = child.get('endpoints');
            const componentsNode = child.get('components');
            const dataFormatsNode = child.get('dataformats');
            if (contextsFolder) {
              const contextNode = contextsFolder.children[0] as Jmx.Folder;
              if (contextNode) {
                // fetch the camel version and add it to the tree here to avoid making a blocking call elsewhere
                jolokia.request({
                  'type': 'read',
                  'mbean': contextNode.objectName,
                  'attribute': 'CamelVersion'
                }, Core.onSuccess((response) => {
                  contextNode.version = response.value;
                  Core.$apply($rootScope);
                }));

                if (routesNode) {
                  contextNode.moveChild(routesNode);
                  routesNode.typeName = 'routes';
                  routesNode.class = 'org-apache-camel-routes-folder';
                  angular.forEach(routesNode.children, (n: Jmx.Folder) => n.class = 'org-apache-camel-routes');
                }
                if (endpointsNode) {
                  contextNode.moveChild(endpointsNode);
                  endpointsNode.typeName = 'endpoints';
                  endpointsNode.class = 'org-apache-camel-endpoints-folder';
                  angular.forEach(endpointsNode.children, (n: Jmx.Folder) => n.class = 'org-apache-camel-endpoints');
                }
                if (componentsNode) {
                  contextNode.moveChild(componentsNode);
                  componentsNode.typeName = 'components';
                  componentsNode.class = 'org-apache-camel-components-folder';
                  angular.forEach(componentsNode.children, (n: Jmx.Folder) => n.class = 'org-apache-camel-components');
                }
                if (dataFormatsNode) {
                  contextNode.moveChild(dataFormatsNode);
                  dataFormatsNode.class = 'org-apache-camel-dataformats-folder';
                  angular.forEach(dataFormatsNode.children, (n: Jmx.Folder) => n.class = 'org-apache-camel-dataformats');
                  dataFormatsNode.typeName = 'dataformats';
                }

                const jmxNode = new Jmx.Folder('MBeans');
                workspace.configureFolder(jmxNode, domainName, 'org-apache-camel', _.clone(child.folderNames).concat('mbeans'), 'mbeans');

                // lets add all the entries which are not one context/routes/endpoints/components/dataformats as MBeans
                child.children
                  .filter(child => !(child.text === 'context'
                    || child.text === 'routes'
                    || child.text === 'endpoints'
                    || child.text === 'components'
                    || child.text === 'dataformats'))
                  .forEach(child => jmxNode.moveChild(child));

                if (jmxNode.children.length > 0) {
                  jmxNode.sortChildren(false);
                  contextNode.moveChild(jmxNode);
                }
                rootFolder.moveChild(contextNode);
              }
              children.push(child);
            }
          });
          children.forEach(child => child.detach());
          domain.children.splice(0, 0, rootFolder);
        }
      }
    });
  }]);

  hawtioPluginLoader.addModule(pluginName);

  // register the jmx lazy loader here as it won't have been invoked in the run method
  hawtioPluginLoader.registerPreBootstrapTask((task) => {
    Jmx.registerLazyLoadHandler(jmxDomain, (folder: Jmx.Folder) => {
      if (jmxDomain === folder.domain && 'routes' === folder.typeName) {
        return (workspace, parent: Jmx.Folder, onComplete: (children: Jmx.NodeSelection[]) => void) => {
          if ('routes' === parent.typeName) {
            processRouteXml(workspace, workspace.jolokia, parent, route => onComplete(route ?
              loadRouteChildren(parent, route) :
              new Array<Jmx.NodeSelection>()));
          } else {
            onComplete(new Array<Jmx.NodeSelection>());
          }
        }
      }
      return null;
    });
    task();
  });
}
