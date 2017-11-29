/// <reference path="../camelPlugin.ts"/>
/// <reference path="properties.service.ts"/>

namespace Camel {

  _module.controller("Camel.PropertiesDataFormatController", ["$scope", "workspace", "localStorage", "jolokia", "documentBase", 'propertiesService', (
      $scope,
      workspace: Jmx.Workspace,
      localStorage: Storage,
      jolokia: Jolokia.IJolokia,
      documentBase: string,
      propertiesService: PropertiesService) => {
    
    var log: Logging.Logger = Logger.get("Camel");

    function updateData() {
      var dataFormatMBeanName:string = null;
      if (!dataFormatMBeanName) {
        dataFormatMBeanName = workspace.getSelectedMBeanName();
      }
      if (dataFormatMBeanName) {
        log.info("Calling informationJson");
        var query = {
          type: 'exec',
          mbean: dataFormatMBeanName,
          operation: 'informationJson'
        };
        jolokia.request(query, Core.onSuccess(populateData));
      }
    }

    function populateData(response) {
      log.debug("Populate data " + response);

      if (response.value) {
        let schema = JSON.parse(response.value);

        $scope.icon = UrlHelpers.join(documentBase, "/img/icons/camel/marshal24.png");
        $scope.title = schema.dataformat.title  + " (" + schema.dataformat.name + ")";
        $scope.labels = schema.dataformat.label ? schema.dataformat.label.split(',') : [];
        $scope.description = schema.dataformat.description;
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
