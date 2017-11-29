/// <reference path="../camelPlugin.ts"/>
/// <reference path="properties.service.ts"/>

namespace Camel {

  _module.controller("Camel.PropertiesEndpointController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", 'propertiesService', (
      $scope,
      workspace: Jmx.Workspace,
      localStorage: Storage,
      jolokia: Jolokia.IJolokia,
      documentBase: string,
      propertiesService: PropertiesService) => {
    
    var log: Logging.Logger = Logger.get("Camel");

    function updateData() {
      var contextMBean = getSelectionCamelContextMBean(workspace);

      var endpointMBean:string = null;
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
        var reply = jolokia.request({type: "read", mbean: endpointMBean, attribute: ["EndpointUri"]});
        var url:string = reply.value["EndpointUri"];
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

      if (response.value) {
        let schema = JSON.parse(response.value);

        $scope.icon = UrlHelpers.join(documentBase, "/img/icons/camel/endpoint24.png");
        $scope.title = $scope.endpointUrl;
        $scope.labels = schema.component.label ? schema.component.label.split(',') : [];
        $scope.description = schema.component.description;
        $scope.definedProperties = propertiesService.getDefinedProperties(schema['properties']);
        $scope.defaultProperties = propertiesService.getDefaultProperties(schema['properties']);
        $scope.undefinedProperties = propertiesService.getUndefinedProperties(schema['properties']);
        $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";

        Core.$apply($scope);
      }
    }

    setTimeout(function() {
      $('[data-toggle=tooltip]').tooltip();
    }, 1000);

    updateData();

  }]);

}
