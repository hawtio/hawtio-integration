/// <reference path="../../includes.ts"/>
/// <reference path="camelHelpers.ts"/>

/**
 *
 * @module Camel
 * @main Camel
 */
module Camel {
  import jmxModule = Jmx;

  export var pluginName = 'camel';

  var routeToolBar = "plugins/camel/html/attributeToolBarRoutes.html";
  var contextToolBar = "plugins/camel/html/attributeToolBarContext.html";

  export var _module = angular.module(pluginName, ['patternfly', 'angularResizable']);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
            .when('/camel/browseEndpoint', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/endpoint/browse/:contextId/*endpointPath', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/createEndpoint', {templateUrl: 'plugins/camel/html/createEndpoint.html'})
            .when('/camel/route/diagram/:contextId/:routeId', {templateUrl: 'plugins/camel/html/routes.html'})
            .when('/camel/routes', {templateUrl: 'plugins/camel/html/routes.html'})
            .when('/camel/typeConverter', {templateUrl: 'plugins/camel/html/typeConverter.html', reloadOnSearch: false})
            .when('/camel/restServices', {templateUrl: 'plugins/camel/html/restServices.html', reloadOnSearch: false})
            .when('/camel/endpointRuntimeRegistry', {templateUrl: 'plugins/camel/html/endpointRuntimeRegistry.html', reloadOnSearch: false})
            .when('/camel/routeMetrics', {templateUrl: 'plugins/camel/html/routeMetrics.html', reloadOnSearch: false})
            .when('/camel/inflight', {templateUrl: 'plugins/camel/html/inflight.html', reloadOnSearch: false})
            .when('/camel/blocked', {templateUrl: 'plugins/camel/html/blocked.html', reloadOnSearch: false})
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


  _module.run(["HawtioNav", "workspace", "jolokia", "viewRegistry", "layoutFull", "helpRegistry", "preferencesRegistry", "$templateCache", "$location", "$rootScope", (nav:HawtioMainNav.Registry, workspace:Workspace, jolokia, viewRegistry, layoutFull, helpRegistry, preferencesRegistry, $templateCache:ng.ITemplateCacheService, $location, $rootScope) => {

    viewRegistry['camel/endpoint/'] = layoutFull;
    viewRegistry['camel/route/'] = layoutFull;
    viewRegistry['{ "main-tab": "camel" }'] = 'plugins/camel/html/layoutCamelTree.html';

    helpRegistry.addUserDoc('camel', 'plugins/camel/doc/help.md', () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain);
    });
    preferencesRegistry.addTab('Camel', 'plugins/camel/html/preferences.html', () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain); 
    });

    // TODO should really do this via a service that the JMX plugin exposes
    Jmx.addAttributeToolBar(pluginName, jmxDomain, (selection: NodeSelection) => {
      // TODO there should be a nicer way to do this!
      var typeName = selection.typeName;
      if (typeName) {
        if (_.startsWith(typeName, "context")) return contextToolBar;
        if (_.startsWith(typeName, "route")) return routeToolBar;
      }
      var folderNames = selection.folderNames;
      if (folderNames && selection.domain === jmxDomain) {
        var last = _.last(folderNames);
        if ("routes" === last)  return routeToolBar;
        if ("context" === last)  return contextToolBar;
      }
      return null;
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
        rank   : 20,
        isValid: (yes, no) => {
          const name = 'CamelDefaultPage';
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
      .href(() => '/jmx/attributes?main-tab=camel')
      .isValid(() => workspace.treeContainsDomainAndProperties(jmxDomain))
      .build();

    nav.add(tab);

    workspace.addNamedTreePostProcessor('camel', (tree) => {
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
          angular.forEach(folder.children, (value, key) => {
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
                      var routesFolder = new Folder("Routes");
                      routesFolder.addClass = "org-apache-camel-routes-folder";
                      routesFolder.parent = contextsFolder;
                      routesFolder.children = routesNode.children;
                      angular.forEach(routesFolder.children, (n:Folder) => n.addClass = "org-apache-camel-routes");
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
                      angular.forEach(endpointsFolder.children, (n:Folder) => {
                        n.addClass = "org-apache-camel-endpoints";
                        /* TODO doesn't compile, is getContextId(workspace:Workspace)
                        if (!getContextId(n)) {
                          n.entries["context"] = contextNode.entries["context"];
                        }
                        */
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
                      angular.forEach(componentsFolder.children, (n:Folder) => {
                        n.addClass = "org-apache-camel-components";
                        /* TODO doesn't compile, is getContextId(workspace:Workspace)
                        if (!getContextId(n)) {
                          n.entries["context"] = contextNode.entries["context"];
                        }
                        */
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
                      angular.forEach(dataFormatsFolder.children, (n:Folder) => {
                        n.addClass = "org-apache-camel-dataformats";
                        /* TODO doesn't compile, is getContextId(workspace:Workspace)
                        if (!getContextId(n)) {
                          n.entries["context"] = contextNode.entries["context"];
                        }
                        */
                      });
                      folder.children.push(dataFormatsFolder);
                      dataFormatsFolder.entries = contextNode.entries;
                      dataFormatsFolder.typeName = "dataformats";
                      dataFormatsFolder.key = dataFormatsNode.key;
                      dataFormatsFolder.domain = dataFormatsNode.domain;
                    }

                    var jmxNode = new Folder("MBeans");

                    // lets add all the entries which are not one context/routes/endpoints/components/dataformats as MBeans
                    angular.forEach(entries, (jmxChild, name) => {
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

  hawtioPluginLoader.addModule(pluginName);

  // register the jmx lazy loader here as it won't have been invoked in the run method
  hawtioPluginLoader.registerPreBootstrapTask((task) => {
    jmxModule.registerLazyLoadHandler(jmxDomain, (folder:Folder) => {
      if (jmxDomain === folder.domain && "routes" === folder.typeName) {
        return (workspace, folder, onComplete) => {
          if ("routes" === folder.typeName) {
            processRouteXml(workspace, workspace.jolokia, folder, (route) => {
              if (route) {
                addRouteChildren(folder, route);
              }
              onComplete();
            });
          } else {
            onComplete();
          }
        }
      }
      return null;
    });
    task();
  });
}
