/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

/**
 * @module Osgi
 */
module Osgi {

  _module.controller("Osgi.BundlesController", ["$scope", "workspace", "jolokia", (
      $scope,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.result = {};
    $scope.bundles = [];
    $scope.selected = [];
    $scope.loading = true;
    $scope.bundleUrl = "";
    // $scope.listViewUrl = Core.url('/osgi/bundle-list' + workspace.hash());
    $scope.tableViewUrl = Core.url('/osgi/bundles' + workspace.hash());

    $scope.installDisabled = function() {
      return $scope.bundleUrl === "";
    }

    var columnDefs = [
      {
        field: 'Identifier',
        displayName: 'ID',
        customSortField: (item) => parseInt(item.Identifier)
      },
      {
        field: 'State',
        displayName: 'State',
        cellTemplate: '{{row.entity.State.toLowerCase()}}'
      },
      {
        field: 'Name',
        displayName: 'Name',
        cellTemplate: '<div class="ngCellText"><a href="{{row.entity.Url}}">{{row.entity.Name}}</a></div>'
      },
      {
        field: 'SymbolicName',
        displayName: 'Symbolic Name',
        cellTemplate: '<div class="ngCellText"><a href="{{row.entity.Url}}">{{row.entity.SymbolicName}}</a></div>'
      },
      {
        field: 'Version',
        displayName: 'Version',
        sortable: false
      }
    ];

    $scope.gridOptions = {
      data: 'bundles',
      showFilter: false,
      selectedItems: $scope.selected,
      selectWithCheckboxOnly: true,
      columnDefs: columnDefs,
      filterOptions: {
        filterText: ''
      },
      primaryKeyFn: entity => entity.Identifier
    };

    $scope.onResponse = function () {
      jolokia.request({
            type: 'exec',
            mbean: getSelectionBundleMBean(workspace),
            operation: 'listBundles()'
          },
          {
            success: render,
            error: render
          });
    }

    $scope.controlBundles = function(op) {
      var startBundle = function(response) {

      }
      var ids = $scope.selected.map(function(b) { return b.Identifier });
      if (!angular.isArray(ids)) {
        ids = [ids];
      }
      jolokia.request({
        type: 'exec',
        mbean: getSelectionFrameworkMBean(workspace),
        operation: op,
        arguments: [ids]
      },
      {
        success: $scope.onResponse,
        error: $scope.onResponse
      });
    }

    $scope.stop = function() {
      $scope.controlBundles('stopBundles([J)');
    }

    $scope.start = function() {
      $scope.controlBundles('startBundles([J)');
    }

    $scope.update = function() {
      $scope.controlBundles('updateBundles([J)');
    }

    $scope.refresh = function() {
      $scope.controlBundles('refreshBundles([J)');
    }

    $scope.uninstall = function() {
      $scope.controlBundles('uninstallBundles([J)');
    }

    $scope.install = function() {
      jolokia.request({
        type: 'exec',
        mbean: getSelectionFrameworkMBean(workspace),
        operation: "installBundle(java.lang.String)",
        arguments: [$scope.bundleUrl]
      },
      {
        success: function(response) {
          console.log("Got: ", response);
          $scope.bundleUrl = ""
          jolokia.request({
                type: 'exec',
                mbean: getSelectionFrameworkMBean(workspace),
                operation: "startBundle(long)",
                arguments: [response.value]
              },
              {
                success: $scope.onResponse,
                error: $scope.onResponse
              });
        },
        error: function(response) {
          $scope.bundleUrl = ""
          $scope.onResponse();
        }
      });
    }

    function render(response) {
      if (!angular.equals($scope.result, response.value)) {
        $scope.selected.length = 0;
        $scope.result = response.value;
        $scope.bundles = [];
        angular.forEach($scope.result, function(value, key) {
          var obj = {
            Identifier: value.Identifier,
            Name: "",
            SymbolicName: value.SymbolicName,
            State: value.State,
            Version: value.Version,
            LastModified: value.LastModified,
            Location: value.Location,
            Url: Core.url("/osgi/bundle/" + value.Identifier + workspace.hash())
          };
          if (value.Headers['Bundle-Name']) {
            obj.Name = value.Headers['Bundle-Name']['Value'];
          }
          $scope.bundles.push(obj);
        });
        $scope.loading = false;
        Core.$apply($scope);
      }
    }

    Core.register(jolokia, $scope, {
      type: 'exec', mbean: getSelectionBundleMBean(workspace),
      operation: 'listBundles()'
    }, Core.onSuccess(render));

  }]);
}
