/// <reference path="../camelPlugin.ts"/>
/// <reference path="properties.service.ts"/>

namespace Camel {

  _module.controller("Camel.PropertiesRouteController", ["$scope", "$rootScope", "workspace", "localStorage", "jolokia", "propertiesService", (
      $scope,
      $rootScope: ng.IRootScopeService,
      workspace: Jmx.Workspace,
      localStorage: Storage,
      jolokia: Jolokia.IJolokia,
      propertiesService: PropertiesService) => {

      var log: Logging.Logger = Logger.get("Camel");

      let routeXmlNode = getSelectedRouteNode(workspace);

      if (routeXmlNode) {
        let data = getRouteNodeJSON(routeXmlNode);
        let schema = getCamelSchema(routeXmlNode.nodeName);
        addValueToProperties(data, schema);
        
        if (log.enabledFor(Logger.DEBUG)) {
          log.debug("Properties - data: " + JSON.stringify(data, null, "  "));
          log.debug("Properties - schema: " + JSON.stringify(schema, null, "  "));
        }

        $scope.icon = getRouteNodeIcon(routeXmlNode);
        $scope.title = schema.title;
        $scope.labels = schema.group ? schema.group.split(',') : [];
        $scope.description = schema.description;
        $scope.definedProperties = propertiesService.getDefinedProperties(schema['properties']);
        $scope.defaultProperties = propertiesService.getDefaultProperties(schema['properties']);
        $scope.undefinedProperties = propertiesService.getUndefinedProperties(schema['properties']);
        $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";
      }

      function addValueToProperties(data, schema) {
        for (let key in data) {
          let property = schema.properties[key];
          if (property) {
            property.value = data[key];
          }
        }
      }

      setTimeout(function() {
        $('[data-toggle=tooltip]').tooltip();
      }, 1000);

    }]);

}
