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

  export var _module = angular.module(pluginName, []);

  _module.config(["$routeProvider", ($routeProvider) => {
    $routeProvider
            .when('/camel/browseEndpoint', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/endpoint/browse/:contextId/*endpointPath', {templateUrl: 'plugins/camel/html/browseEndpoint.html'})
            .when('/camel/createEndpoint', {templateUrl: 'plugins/camel/html/createEndpoint.html'})
            .when('/camel/route/diagram/:contextId/:routeId', {templateUrl: 'plugins/camel/html/routes.html'})
            .when('/camel/routes', {templateUrl: 'plugins/camel/html/routes.html'})
            .when('/camel/typeConverter', {templateUrl: 'plugins/camel/html/typeConverter.html', reloadOnSearch: false})
            .when('/camel/restRegistry', {templateUrl: 'plugins/camel/html/restRegistry.html', reloadOnSearch: false})
            .when('/camel/routeMetrics', {templateUrl: 'plugins/camel/html/routeMetrics.html', reloadOnSearch: false})
            .when('/camel/inflight', {templateUrl: 'plugins/camel/html/inflight.html', reloadOnSearch: false})
            .when('/camel/sendMessage', {templateUrl: 'plugins/camel/html/sendMessage.html', reloadOnSearch: false})
            .when('/camel/source', {templateUrl: 'plugins/camel/html/source.html'})
            .when('/camel/traceRoute', {templateUrl: 'plugins/camel/html/traceRoute.html'})
            .when('/camel/debugRoute', {templateUrl: 'plugins/camel/html/debug.html'})
            .when('/camel/profileRoute', {templateUrl: 'plugins/camel/html/profileRoute.html'})
            .when('/camel/properties', {templateUrl: 'plugins/camel/html/properties.html'})
            .when('/camel/propertiesComponent', {templateUrl: 'plugins/camel/html/propertiesComponent.html'})
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


  _module.run(["HawtioNav", "workspace", "jolokia", "viewRegistry", "layoutFull", "helpRegistry", "preferencesRegistry", "$templateCache", "$location", (nav:HawtioMainNav.Registry, workspace:Workspace, jolokia, viewRegistry, layoutFull, helpRegistry, preferencesRegistry, $templateCache:ng.ITemplateCacheService, $location) => {

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
        if (typeName.startsWith("context")) return contextToolBar;
        if (typeName.startsWith("route")) return routeToolBar;
      }
      var folderNames = selection.folderNames;
      if (folderNames && selection.domain === jmxDomain) {
        var last = folderNames.last();
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
      {field: 'ExchangesCompleted', displayName: 'Completed #'},
      {field: 'ExchangesFailed', displayName: 'Failed #'},
      {field: 'FailuresHandled', displayName: 'Failed Handled #'},
      {field: 'ExchangesTotal', displayName: 'Total #', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery #'},
      {field: 'ExchangesInflight', displayName: 'Inflight #'},
      {field: 'InflightExchanges', displayName: 'Inflight #', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: true},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery #', visible: false},
      {field: 'StartedRoutes', displayName: 'Started Routes #'},
      {field: 'TotalRoutes', displayName: 'Total Routes #'}
    ];
    attributes[jmxDomain + "/routes/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'ExchangesCompleted', displayName: 'Completed #'},
      {field: 'ExchangesFailed', displayName: 'Failed #'},
      {field: 'FailuresHandled', displayName: 'Failed Handled #'},
      {field: 'Redeliveries', displayName: 'Redelivery #'},
      {field: 'ExchangesTotal', displayName: 'Total #', visible: false},
      {field: 'ExchangesInflight', displayName: 'Inflight #'},
      {field: 'OldestInflightDuration', displayName: 'Oldest Inflight Time'},
      {field: 'InflightExchanges', displayName: 'Inflight #', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: true},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time', visible: false},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery #', visible: false}
    ];
    attributes[jmxDomain + "/processors/folder"] = [
      stateColumn,
      {field: 'CamelId', displayName: 'Context'},
      {field: 'RouteId', displayName: 'Route'},
      {field: 'ProcessorId', displayName: 'Processor'},
      {field: 'ExchangesCompleted', displayName: 'Completed #'},
      {field: 'ExchangesFailed', displayName: 'Failed #'},
      {field: 'FailuresHandled', displayName: 'Failed Handled #'},
      {field: 'ExchangesTotal', displayName: 'Total #', visible: false},
      {field: 'ExchangesInflight', displayName: 'Inflight #'},
      {field: 'InflightExchanges', displayName: 'Inflight #', visible: false},
      {field: 'MeanProcessingTime', displayName: 'Mean Time'},
      {field: 'MinProcessingTime', displayName: 'Min Time'},
      {field: 'MaxProcessingTime', displayName: 'Max Time'},
      {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false},
      {field: 'LastProcessingTime', displayName: 'Last Time', visible: false},
      {field: 'DeltaProcessingTime', displayName: 'Delta Time'},
      {field: 'LastExchangeCompletedTimestamp', displayName: 'Last completed', visible: false},
      {field: 'LastExchangeFailedTimestamp', displayName: 'Last failed', visible: false},
      {field: 'Redeliveries', displayName: 'Redelivery #', visible: false},
      {field: 'ExternalRedeliveries', displayName: 'External Redelivery #', visible: false}
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
      {field: 'InflightExchanges', displayName: 'Inflight #'}
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
      {field: 'ActiveCount', displayName: 'Active #'},
      {field: 'PoolSize', displayName: 'Pool Size'},
      {field: 'CorePoolSize', displayName: 'Core Pool Size'},
      {field: 'TaskQueueSize', displayName: 'Task Queue Size'},
      {field: 'TaskCount', displayName: 'Task #'},
      {field: 'CompletedTaskCount', displayName: 'Completed Task #'}
    ];
    attributes[jmxDomain + "/errorhandlers/folder"] = [
      {field: 'CamelId', displayName: 'Context'},
      {field: 'DeadLetterChannel', displayName: 'Dead Letter'},
      {field: 'DeadLetterChannelEndpointUri', displayName: 'Endpoint URI', width: "**", resizable: true},
      {field: 'MaximumRedeliveries', displayName: 'Max Redeliveries'},
      {field: 'RedeliveryDelay', displayName: 'Redelivery Delay'},
      {field: 'MaximumRedeliveryDelay', displayName: 'Max Redeliveries Delay'}
    ];

    var myUrl = '/jmx/attributes?main-tab=camel&sub-tab=camel-attributes';

    var builder = nav.builder();
    var tab = builder.id('camel')
                .title( () => 'Camel' )
                .defaultPage({
                  rank: 20,
                  isValid: (yes, no) => {
                    var name = 'CamelDefaultPage';
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

    // add sub level tabs
    tab.tabs = Jmx.getNavItems(builder, workspace, $templateCache, 'camel');

    // special for route diagram as we want this to be the 1st
    tab.tabs.push({
      id: 'camel-route-diagram',
      title: () => '<i class="fa fa-sitemap"></i> Route Diagram',
      tooltip: () => "View a diagram of the Camel routes",
      show: () =>
        workspace.isRoute()
        && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"),
      isSelected: () => workspace.isLinkActive('camel/routes'),
      href: () => "/camel/routes" + workspace.hash(),
      // make sure we have route diagram shown first
      index: -2
    });
    tab.tabs.push({
      id: 'camel-route-source',
      title: () => '<i class=" fa fa-file-code-o"></i> Source',
      tooltip: () => "View the source of the Camel routes",
      show: () =>
      !workspace.isEndpointsFolder() && !workspace.isEndpoint()
      && (workspace.isRoute() || workspace.isRoutesFolder())
      && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"),
      isSelected: () => workspace.isLinkActive('camel/source'),
      href: () => "/camel/source" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-route-properties',
      title: () => '<i class=" fa fa-edit"></i> Properties',
      tooltip: () => "View the pattern properties",
      show: () => getSelectedRouteNode(workspace),
      href: () => "/camel/properties" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-endpoint-properties',
      title: () => '<i class="fa fa-list"></i> Properties',
      tooltip: () => "Show the endpoint properties",
      show: () =>
      workspace.isEndpoint()
      && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
      && workspace.hasInvokeRights(workspace.selection, "explainEndpointJson"),
      href: () => "/camel/propertiesEndpoint" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-component-properties',
      title: () => '<i class="fa fa-list"></i> Properties',
      tooltip: () => "Show the component properties",
      show: () =>
      workspace.isComponent()
      && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
      && workspace.hasInvokeRights(workspace.selection, "explainComponentJson"),
      href: () => "/camel/propertiesComponent" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-inflight-exchanges',
      title: () => '<i class="fa fa-bar-chart"></i> Inflight Exchanges',
      tooltip: () => "View the entire JVMs Camel inflight exchanges",
      show: () =>
        !workspace.isEndpointsFolder() && !workspace.isEndpoint()
        && !workspace.isComponentsFolder() && !workspace.isComponent()
        && (workspace.isCamelContext() || workspace.isRoutesFolder() || workspace.isRoute())
        && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
        && workspace.hasInvokeRightsForName(getSelectionCamelInflightRepository(workspace), "browse"),
      href: () => "/camel/inflight" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-route-metrics',
      title: () => '<i class="fa fa-bar-chart"></i> Route Metrics',
      tooltip: () => "View the entire JVMs Camel route metrics",
      show: () =>
        !workspace.isEndpointsFolder() && !workspace.isEndpoint()
        && (workspace.isCamelContext() || workspace.isRoutesFolder())
        && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)
        && getSelectionCamelRouteMetrics(workspace)
        && workspace.hasInvokeRightsForName(getSelectionCamelRouteMetrics(workspace), "dumpStatisticsAsJson"),
      href: () => "/camel/routeMetrics" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-rest-services',
      title: () =>'<i class="fa fa-list"></i> Rest Services',
      tooltip: () => "List all the REST services registered in the context",
      show: () =>
        !workspace.isEndpointsFolder() && !workspace.isEndpoint()
        && !workspace.isComponentsFolder() && !workspace.isComponent()
        && (workspace.isCamelContext() || workspace.isRoutesFolder())
        && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)
        && getSelectionCamelRestRegistry(workspace)
        && hasRestServices(workspace, jolokia) // TODO: optimize this so we only invoke it one time until reload
        && workspace.hasInvokeRightsForName(getSelectionCamelRestRegistry(workspace), "listRestServices"),
      href: () => "/camel/restRegistry" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-type-converters',
      title: () => '<i class="fa fa-list"></i> Type Converters',
      tooltip: () => "List all the type converters registered in the context",
      show: () =>
      !workspace.isEndpointsFolder() && !workspace.isEndpoint()
      && !workspace.isComponentsFolder() && !workspace.isComponent()
      && (workspace.isCamelContext() || workspace.isRoutesFolder())
      && Camel.isCamelVersionEQGT(2, 13, workspace, jolokia)
      && workspace.hasInvokeRightsForName(getSelectionCamelTypeConverter(workspace), "listTypeConverters"),
      href: () => "/camel/typeConverter" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-route-profile',
      title: () => '<i class="fa fa-bar-chart"></i> Profile',
      tooltip: () => "Profile the messages flowing through the Camel route",
      show: () => workspace.isRoute()
      && Camel.getSelectionCamelTraceMBean(workspace)
      && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml"),
      href: () => "/camel/profileRoute" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-route-debug',
      title: () => '<i class="fa fa-stethoscope"></i> Debug',
      tooltip: () => "Debug the Camel route",
      show: () => workspace.isRoute()
        && Camel.getSelectionCamelDebugMBean(workspace)
        && workspace.hasInvokeRightsForName(Camel.getSelectionCamelDebugMBean(workspace), "getBreakpoints"),
      href: () => "/camel/debugRoute" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-route-trace',
      title: () => '<i class="fa fa-envelope"></i> Trace',
      tooltip: () => "Trace the messages flowing through the Camel route",
      show: () => workspace.isRoute()
        && Camel.getSelectionCamelTraceMBean(workspace)
        && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml"),
      href: () => "/camel/traceRoute" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-endpoint-browser',
      title: () => '<i class="fa fa-envelope"></i> Browse',
      tooltip: () => "Browse the messages on the endpoint",
      show: () => workspace.isEndpoint()
      && workspace.hasInvokeRights(workspace.selection, "browseAllMessagesAsXml"),
      href: () => "/camel/browseEndpoint" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-endpoint-send',
      title: () => '<i class="fa fa-pencil"></i> Send',
      //title: "Send a message to this endpoint",
      show: () => workspace.isEndpoint()
        && workspace.hasInvokeRights(workspace.selection, workspace.selection.domain === "org.apache.camel" ? "sendBodyAndHeaders" : "sendTextMessage"),
      href: () => "/camel/sendMessage" + workspace.hash()
    });
    tab.tabs.push({
      id: 'camel-endpoint-create',
      title: () =>'<i class="fa fa-plus"></i> Endpoint',
      tooltip: () => "Create a new endpoint",
      show: () => workspace.isEndpointsFolder()
        && workspace.hasInvokeRights(workspace.selection, "createEndpoint"),
      href: () => "/camel/createEndpoint" + workspace.hash()
    });

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
                      angular.forEach(routesFolder.children, (n) => n.addClass = "org-apache-camel-routes");
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
                      angular.forEach(endpointsFolder.children, (n) => {
                        n.addClass = "org-apache-camel-endpoints";
                        if (!getContextId(n)) {
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
                      angular.forEach(componentsFolder.children, (n) => {
                        n.addClass = "org-apache-camel-components";
                        if (!getContextId(n)) {
                          n.entries["context"] = contextNode.entries["context"];
                        }
                      });
                      folder.children.push(componentsFolder);
                      componentsFolder.entries = contextNode.entries;
                      componentsFolder.typeName = "components";
                      componentsFolder.key = componentsNode.key;
                      componentsFolder.domain = componentsNode.domain;
                    }

                    var jmxNode = new Folder("MBeans");

                    // lets add all the entries which are not one context/routes/endpoints/components as MBeans
                    angular.forEach(entries, (jmxChild, name) => {
                      if (name !== "context" && name !== "routes" && name !== "endpoints" && name !== "components") {
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
