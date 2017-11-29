/// <reference path="../camelPlugin.ts"/>
/// <reference path="properties.service.ts"/>

namespace Camel {

  _module.controller("Camel.PropertiesComponentController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", 'propertiesService', (
      $scope,
      workspace: Jmx.Workspace,
      localStorage: Storage,
      jolokia: Jolokia.IJolokia,
      documentBase: string,
      propertiesService: PropertiesService) => {
    
    var log: Logging.Logger = Logger.get("Camel");

    function updateData() {
      var contextMBean = getSelectionCamelContextMBean(workspace);

      var componentMBeanName:string = null;
      if (!componentMBeanName) {
        componentMBeanName = workspace.getSelectedMBeanName();
      }
      if (componentMBeanName && contextMBean) {
        // TODO: grab name from tree instead? avoids a JMX call
        var reply = jolokia.request({type: "read", mbean: componentMBeanName, attribute: ["ComponentName"]});
        var name:string = reply.value["ComponentName"];
        if (name) {
          $scope.componentName = name;
          log.info("Calling explainComponentJson for name: " + name);
          var query = {
            type: 'exec',
            mbean: contextMBean,
            operation: 'explainComponentJson(java.lang.String,boolean)',
            arguments: [name, true]
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
        $scope.title = schema.component.title;
        $scope.description = schema.component.description;
        $scope.labels = schema.component.label ? schema.component.label.split(',') : [];
        $scope.definedProperties = propertiesService.getDefinedProperties(schema['componentProperties']);
        $scope.defaultProperties = propertiesService.getDefaultProperties(schema['componentProperties']);
        $scope.undefinedProperties = propertiesService.getUndefinedProperties(schema['componentProperties']);
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
