/// <reference path="../../includes.ts"/>
/// <reference path="karafHelpers.ts"/>
/// <reference path="karafPlugin.ts"/>

/**
 * @module Karaf
 */
module Karaf {

  _module.controller("Karaf.ScrComponentsController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.component = empty();

    // caches last jolokia result
    $scope.result = [];

    // rows in components table
    $scope.components = [];

    // selected components
    $scope.selectedComponents = [];

    $scope.scrOptions = {
      data: 'components',
      sortInfo: { "sortBy": "Name", "ascending": true },
      selectedItems: $scope.selectedComponents,
      columnDefs: [
        {
          field: 'Name',
          displayName: 'Name',
          cellTemplate: '<div class="ngCellText"><a href="{{row.entity.Url}}">{{row.entity.Name}}</a></div>'
        },
        {
          field: 'State',
          displayName: 'State',
          cellTemplate: '{{row.entity.State}}'
        }
      ],
      primaryKeyFn: entity => entity.Name
    };

    var scrMBean = Karaf.getSelectionScrMBean(workspace);
    if (scrMBean) {
      let components = getAllComponents(workspace, jolokia);
      addUrlField(components);
      render(components);
    }

    function addUrlField(components) {
      components.forEach(component => 
        component.Url = Core.url("/osgi/scr-component/" + component.Name + workspace.hash()));
    }

    $scope.activate = () => {
      $scope.selectedComponents.forEach(function (component) {
        activateComponent(workspace, jolokia, component.Name, function () {
          console.log("Activated!")
        }, function () {
          console.log("Failed to activate!")
        });
      });
    };

    $scope.deactivate = () => {
      $scope.selectedComponents.forEach(function (component) {
        deactivateComponent(workspace, jolokia, component.Name, function () {
          console.log("Deactivated!")
        }, function () {
          console.log("Failed to deactivate!")
        });
      });
    };


    function empty() {
      return [
        {
          Name: "",
          Status: false
        }
      ];
    }

    function render(components) {
      if (!angular.equals($scope.result, components)) {
        $scope.components = components;
        $scope.result = $scope.components;
        Core.$apply($scope);
      }
    }
  }]);
}
