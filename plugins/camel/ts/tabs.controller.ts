/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.TabsController", ["$scope", "$location", "workspace", "jolokia",
    ($scope, $location, workspace, jolokia) => {

      $scope.tabs = [
        {
          id: 'jmx-attributes',
          title: 'Attributes',
          href: "/jmx/attributes" + workspace.hash(),
          show: () => true
        },
        {
          id: 'camel-route-diagram',
          title: 'Route Diagram',
          href: "/camel/routes" + workspace.hash(),
          show: () => (workspace.isRoute() || workspace.isRoutesFolder())
            && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml")
        },
        {
          id: 'camel-route-source',
          title: 'Source',
          href: "/camel/source" + workspace.hash(),
          show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
            && (workspace.isRoute() || workspace.isRoutesFolder())
            && workspace.hasInvokeRightsForName(getSelectionCamelContextMBean(workspace), "dumpRoutesAsXml"),
          isSelected: () => workspace.isLinkActive('camel/source')
        },
        {
          id: 'camel-route-properties',
          title: 'Properties',
          href: "/camel/propertiesRoute" + workspace.hash(),
          show: () => isRouteNode(workspace)
        },
        {
          id: 'camel-endpoint-properties',
          title: 'Properties',
          href: "/camel/propertiesEndpoint" + workspace.hash(),
          show: () => workspace.isEndpoint()
            && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
            && workspace.hasInvokeRights(workspace.selection, "explainEndpointJson")
        },
        {
          id: 'camel-component-properties',
          title: 'Properties',
          href: "/camel/propertiesComponent" + workspace.hash(),
          show: () => workspace.isComponent()
            && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
            && workspace.hasInvokeRights(workspace.selection, "explainComponentJson")
        },
        {
          id: 'camel-dataformat-properties',
          title: 'Properties',
          href: "/camel/propertiesDataFormat" + workspace.hash(),
          show: () => workspace.isDataformat()
            && Camel.isCamelVersionEQGT(2, 16, workspace, jolokia)
            && workspace.hasInvokeRights(workspace.selection, "explainDataFormatJson")
        },
        {
          id: 'camel-exchanges',
          title: 'Exchanges',
          href: "/camel/exchanges" + workspace.hash(),
          show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
            && !workspace.isComponentsFolder() && !workspace.isComponent()
            && (workspace.isCamelContext() || workspace.isRoutesFolder() || workspace.isRoute())
            && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
            && workspace.hasInvokeRightsForName(getSelectionCamelInflightRepository(workspace), "browse")
        },
        // {
        //   id: 'camel-blocked-exchanges',
        //   title: 'Blocked',
        //   href: "/camel/blocked" + workspace.hash(),
        //   show: () => !workspace.isEndpointsFolder()
        //     && (workspace.isRoute() || workspace.isRoutesFolder())
        //     && Camel.isCamelVersionEQGT(2, 15, workspace, jolokia)
        //     && workspace.hasInvokeRightsForName(getSelectionCamelBlockedExchanges(workspace), "browse")
        // },
        {
          id: 'camel-route-metrics',
          title: 'Route Metrics',
          href: "/camel/routeMetrics" + workspace.hash(),
          show: () => !workspace.isEndpointsFolder() && !workspace.isEndpoint()
            && (workspace.isCamelContext() || workspace.isRoutesFolder())
            && Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)
            && getSelectionCamelRouteMetrics(workspace)
            && workspace.hasInvokeRightsForName(getSelectionCamelRouteMetrics(workspace), "dumpStatisticsAsJson")
        },
        {
          id: 'camel-rest-services',
          title: 'REST Services',
          href: "/camel/restServices" + workspace.hash(),
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
          href: "/camel/endpointRuntimeRegistry" + workspace.hash(),
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
          href: "/camel/typeConverter" + workspace.hash(),
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
          href: "/camel/profileRoute" + workspace.hash(),
          show: () => workspace.isRoute()
            && Camel.getSelectionCamelTraceMBean(workspace)
            && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml")
        },
        {
          id: 'camel-route-debug',
          title: 'Debug',
          href: "/camel/debugRoute" + workspace.hash(),
          show: () => workspace.isRoute()
            && Camel.getSelectionCamelDebugMBean(workspace)
            && workspace.hasInvokeRightsForName(Camel.getSelectionCamelDebugMBean(workspace), "getBreakpoints")
        },
        {
          id: 'camel-route-trace',
          title: 'Trace',
          href: "/camel/traceRoute" + workspace.hash(),
          show: () => workspace.isRoute()
            && Camel.getSelectionCamelTraceMBean(workspace)
            && workspace.hasInvokeRightsForName(Camel.getSelectionCamelTraceMBean(workspace), "dumpAllTracedMessagesAsXml")
        },
        {
          id: 'camel-endpoint-browser',
          title: 'Browse',
          href: "/camel/browseEndpoint" + workspace.hash(),
          show: () => workspace.isEndpoint()
            && workspace.hasInvokeRights(workspace.selection, "browseAllMessagesAsXml")
        },
        {
          id: 'camel-endpoint-send',
          title: 'Send',
          href: "/camel/sendMessage" + workspace.hash(),
          show: () => workspace.isEndpoint()
            && workspace.hasInvokeRights(workspace.selection, workspace.selection.domain === "org.apache.camel" ? "sendBodyAndHeaders" : "sendTextMessage")
        },
        {
          id: 'camel-endpoint-create',
          title: 'Endpoint',
          href: "/camel/createEndpoint" + workspace.hash(),
          show: () => workspace.isEndpointsFolder()
            && workspace.hasInvokeRights(workspace.selection, "createEndpoint")
        },
        {
          id: 'jmx-operations',
          title: 'Operations',
          href: "/jmx/operations" + workspace.hash(),
          show: () => true
        },
        {
          id: 'jmx-charts',
          title: 'Chart',
          href: "/jmx/charts" + workspace.hash(),
          show: () => true
        }
      ];

      $scope.isActive = tab => workspace.isLinkActive(tab.href);

    }]);

}
