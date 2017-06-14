/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.TabsController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.tabs = [
      {
        id: 'jmx-attributes',
        title: 'Attributes',
        path: "/jmx/attributes",
        show: () => !isContextsFolder(workspace) && !workspace.isRoutesFolder()
      },
      {
        id: 'camel-contexts',
        title: 'Contexts',
        path: "/camel/contexts",
        show: () => isContextsFolder(workspace)
      },
      {
        id: 'camel-routes',
        title: 'Routes',
        path: "/camel/routes",
        show: () => workspace.isRoutesFolder()
      },
      {
        id: 'camel-route-diagram',
        title: 'Route Diagram',
        path: "/camel/routeDiagram",
        show: () => (workspace.isRoute() || workspace.isRoutesFolder())
          && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml")
      },
      {
        id: 'camel-route-source',
        title: 'Source',
        path: "/camel/source",
        show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && (workspace.isRoute() || workspace.isRoutesFolder())
          && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"),
        isSelected: () => workspace.isLinkActive('camel/source')
      },
      {
        id: 'camel-route-properties',
        title: 'Properties',
        path: "/camel/propertiesRoute",
        show: () => isRouteNode(workspace)
      },
      {
        id: 'camel-endpoint-properties',
        title: 'Properties',
        path: "/camel/propertiesEndpoint",
        show: () => workspace.isEndpoint()
          && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, "explainEndpointJson")
      },
      {
        id: 'camel-component-properties',
        title: 'Properties',
        path: "/camel/propertiesComponent",
        show: () => workspace.isComponent()
          && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, "explainComponentJson")
      },
      {
        id: 'camel-dataformat-properties',
        title: 'Properties',
        path: "/camel/propertiesDataFormat",
        show: () => workspace.isDataformat()
          && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia)
          && workspace.hasInvokeRights(workspace.selection, "explainDataFormatJson")
      },
      {
        id: 'camel-exchanges',
        title: 'Exchanges',
        path: "/camel/exchanges",
        show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && !workspace.isComponentsFolder() && !workspace.isComponent()
          && (workspace.isCamelContext() || workspace.isRoutesFolder() || workspace.isRoute())
          && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
          && workspace.hasInvokeRightsForName(getSelectionCamelInflightRepository(workspace), "browse")
      },
      // {
      //   id: 'camel-blocked-exchanges',
      //   title: 'Blocked',
      //   path: "/camel/blocked",
      //   show: () => !workspace.isEndpointsFolder()
      //     && (workspace.isRoute() || workspace.isRoutesFolder())
      //     && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
      //     && workspace.hasInvokeRightsForName(getSelectionCamelBlockedExchanges(workspace), "browse")
      // },
      {
        id: 'camel-route-metrics',
        title: 'Route Metrics',
        path: "/camel/routeMetrics",
        show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && (workspace.isCamelContext() || workspace.isRoutesFolder())
          && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)
          && getSelectionCamelRouteMetrics(workspace)
          && workspace.hasInvokeRightsForName(getSelectionCamelRouteMetrics(workspace), "dumpStatisticsAsJson")
      },
      {
        id: 'camel-rest-services',
        title: 'REST Services',
        path: "/camel/restServices",
        show: () => !getSelectedRouteNode(workspace)
          && !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && !workspace.isComponentsFolder() && !workspace.isComponent()
          && (workspace.isCamelContext() || workspace.isRoutesFolder())
          && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)
          && getSelectionCamelRestRegistry(workspace)
          && hasRestServices(workspace, jolokia)
          && workspace.hasInvokeRightsForName(getSelectionCamelRestRegistry(workspace), "listRestServices")
      },
      {
        id: 'camel-endpoint-runtime-registry',
        title: 'Endpoints (in/out)',
        path: "/camel/endpointRuntimeRegistry",
        show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && !workspace.isComponentsFolder() && !workspace.isComponent()
          && (workspace.isCamelContext() || workspace.isRoutesFolder())
          && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia)
          && getSelectionCamelEndpointRuntimeRegistry(workspace)
          && workspace.hasInvokeRightsForName(getSelectionCamelEndpointRuntimeRegistry(workspace), "endpointStatistics")
      },
      {
        id: 'camel-type-converters',
        title: 'Type Converters',
        path: "/camel/typeConverter",
        show: () => !getSelectedRouteNode(workspace)
          && !workspace.isEndpointsFolder() && !workspace.isEndpoint()
          && !workspace.isComponentsFolder() && !workspace.isComponent()
          && (workspace.isCamelContext() || workspace.isRoutesFolder())
          && Camel.isCamelVersionEQGT(2, 13, workspace, jolokia)
          && workspace.hasInvokeRightsForName(getSelectionCamelTypeConverter(workspace), "listTypeConverters")
      },
      {
        id: 'camel-route-profile',
        title: 'Profile',
        path: "/camel/profileRoute",
        show: () => workspace.isRoute()
          && Camel.getSelectionCamelTraceMBean(workspace)
          && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml")
      },
      {
        id: 'camel-route-debug',
        title: 'Debug',
        path: "/camel/debugRoute",
        show: () => workspace.isRoute()
          && Camel.getSelectionCamelDebugMBean(workspace)
          && workspace.hasInvokeRightsForName(Camel.getSelectionCamelDebugMBean(workspace), "getBreakpoints")
      },
      {
        id: 'camel-route-trace',
        title: 'Trace',
        path: "/camel/traceRoute",
        show: () => workspace.isRoute()
          && Camel.getSelectionCamelTraceMBean(workspace)
          && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml")
      },
      {
        id: 'camel-endpoint-browser',
        title: 'Browse',
        path: "/camel/browseEndpoint",
        show: () => workspace.isEndpoint()
          && workspace.hasInvokeRights(workspace.selection, "browseAllMessagesAsXml")
      },
      {
        id: 'camel-endpoint-send',
        title: 'Send',
        path: "/camel/sendMessage",
        show: () => workspace.isEndpoint()
          && workspace.hasInvokeRights(workspace.selection, workspace.selection.domain === "org.apache.camel" ? "sendBodyAndHeaders" : "sendTextMessage")
      },
      {
        id: 'camel-endpoint-create',
        title: 'Endpoint',
        path: "/camel/createEndpoint",
        show: () => workspace.isEndpointsFolder()
          && workspace.hasInvokeRights(workspace.selection, "createEndpoint")
      },
      {
        id: 'jmx-operations',
        title: 'Operations',
        path: "/jmx/operations",
        show: () => !isContextsFolder(workspace) && !workspace.isRoutesFolder()
      },
      {
        id: 'jmx-charts',
        title: 'Chart',
        path: "/jmx/charts",
        show: () => !isContextsFolder(workspace) && !workspace.isRoutesFolder()
      }
    ];

    $scope.isActive = tab => workspace.isLinkActive(tab.path);

    $scope.goto = (path: string) => $location.path(path);

  }]);

  function isContextsFolder(workspace: Jmx.Workspace) {
    return workspace.selection && workspace.selection.key === 'camelContexts';
  }

  let _hasRestServices: boolean = null;

  function hasRestServices(workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia) {
    if (_hasRestServices === null) {
       _hasRestServices = Camel.hasRestServices(workspace, jolokia);
    }
    return _hasRestServices;
  }
}
