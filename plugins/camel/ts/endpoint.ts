/// <reference path="camelPlugin.ts"/>
/// <reference path="endpointChooser.ts"/>

namespace Camel {

  _module.controller("Camel.EndpointController", ["$scope", "$location", "localStorage", "workspace", "jolokia", "jolokiaService", (
      $scope,
      $location: ng.ILocationService,
      localStorage: Storage,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      jolokiaService: JVM.JolokiaService) => {

    Camel.initEndpointChooserScope($scope, $location, localStorage, workspace, jolokia);
    $scope.loadEndpointNames();

    $scope.workspace = workspace;

    $scope.cancel = () => $location.path('/camel/endpoints');

    $scope.createEndpoint = (name) => {
      var jolokia = workspace.jolokia;
      if (jolokia) {
        var mbean = getSelectionCamelContextMBean(workspace);
        if (mbean) {
          var operation = "createEndpoint(java.lang.String)";
          jolokiaService.execute(mbean, operation, name)
            .then((success: boolean) => {
              if (success) {
                operationSuccess();
              } else {
                Core.notification('danger', 'Invalid URI');
              }
            })
            .catch((error: string) => {
              error = error.replace("org.apache.camel.ResolveEndpointFailedException : ", "")
              Core.notification("danger", error);
            });
        } else {
          Core.notification("danger", "Could not find the CamelContext MBean!");
        }
      }
    };

    $scope.createEndpointFromData = () => {
      if ($scope.selectedComponentName && $scope.endpointPath) {
        var name = $scope.selectedComponentName + "://" + $scope.endpointPath;
        log.debug("Have endpoint data " + JSON.stringify($scope.endpointParameters));

        var params = "";
        angular.forEach($scope.endpointParameters, (value, key) => {
          var prefix = params ? "&" : "";
          params += prefix + key + "=" + value;
        });
        if (params) {
          name += "?" + params;
        }
        // TODO use form data too for URIs parameters...
        $scope.createEndpoint(name);
      }
    };

    $scope.deleteEndpoint = () => {
      var jolokia = workspace.jolokia;
      var selection = workspace.selection;
      var entries = selection.entries;
      if (selection && jolokia && entries) {
        var domain = selection.domain;
        var brokerName = entries["BrokerName"];
        var name = entries["Destination"];
        if (domain && brokerName) {
          var mbean = "" + domain + ":BrokerName=" + brokerName + ",Type=Broker";
          var operation = "removeEndpoint(java.lang.String)";
          jolokia.execute(mbean, operation, name, Core.onSuccess(deleteSuccess));
        }
      }
    };

    function operationSuccess() {
      $scope.endpointName = "";
      $scope.workspace.operationCounter += 1;
      Core.$apply($scope);
      Core.notification('success', "Creating endpoint", 3000);
    }

    function deleteSuccess(): void {
      // lets set the selection to the parent
      if (workspace.selection) {
        var parent = Core.pathGet(workspace, ["selection", "parent"]);
        if (parent) {
          $scope.workspace.updateSelectionNode(parent);
        }
      }
      $scope.workspace.operationCounter += 1;
      Core.$apply($scope);
      Core.notification("success", "Endpoint deleted");
    }
  }]);
}
