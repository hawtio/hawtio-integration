/// <reference path="../../includes.ts"/>
/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

/**
 * @module Osgi
 */
module Osgi {

  export var ServiceController = _module.controller("Osgi.ServiceController", ["$scope", "$filter", "workspace", "$templateCache", "$compile", ($scope, $filter:ng.IFilterService, workspace:Workspace, $templateCache:ng.ITemplateCacheService, $compile:ng.IAttributes) => {

    var dateFilter = $filter('date');

    $scope.workspace = workspace;
    $scope.services = [];
    $scope.selectedItems = [];

    $scope.mygrid = {
      data: 'services',
      showFilter: false,
      showColumnMenu: false,
      filterOptions: {
        filterText: "",
        useExternalFilter: false
      },
      selectedItems: [],
      rowHeight: 32,
      selectWithCheckboxOnly: true,
      columnDefs: [
    /*
        {
          field: 'Identifier',
          displayName: 'ID'
          //width: "***"
          //width: 300
        },
        */
        {
          field: 'BundleIdentifier',
          displayName: 'Bundle',
          cellTemplate: `
            <div class="ngCellText">
              <a ng-href="{{row.entity.Url}}">{{row.entity.Identifier}}</a>
            </div>`
          //width: "***"
          //width: 300
        },
        {
          field: 'objectClass',
          displayName: 'Object Class(es)',
          cellTemplate: `
            <div class="ngCellText">
              <div ng-repeat="clazz in row.entity.objectClass">
                <span>
                  {{clazz}}
                </span>
              </div>
            </div>`

          //width: "***"
          //width: 300
        },
        {
          field: 'UsingBundles',
          displayName: 'Used by',
          cellTemplate: `
            <div class="ngCellText">
              <div ng-repeat="bundle in row.entity.UsingBundles">
                <a ng-href="{{bundle.Url}}">{{bundle.Name || bundle.SymbolicName || bundle.Identifier}}</a>
                <!--
                <pre>
                  {{bundle}}
                </pre>
                  -->
              </div>
            </div>`
        }
      ],
      primaryKeyFn: entity => entity.BundleIdentifier
    };

    $scope.selectedItems = $scope.mygrid.selectedItems;
/*
    $scope.widget = new DataTable.TableWidget($scope, $templateCache, $compile, [
      <DataTable.TableColumnConfig> {
        "mDataProp": null,
        "sClass": "control center",
        "sDefaultContent": '<i class="fa fa-plus"></i>'
      },
      <DataTable.TableColumnConfig> { "mDataProp": "Identifier" },
      <DataTable.TableColumnConfig> { "mDataProp": "BundleIdentifier" },
      <DataTable.TableColumnConfig> { "mDataProp": "objectClass" }
    ], {
      rowDetailTemplateId: 'osgiServiceTemplate',
      disableAddColumns: true
    });
*/

    $scope.$watch('workspace.selection', function() {
      var mbean = getSelectionServiceMBean(workspace);
      if (mbean) {
        var jolokia = workspace.jolokia;
        jolokia.request({
              type: 'exec',
              mbean: mbean,
              operation: 'listServices()'
            },
            Core.onSuccess(populateTable));
      }
    });

    var populateTable = function(response) {
      var services = Osgi.defaultServiceValues(workspace, $scope, response.value);
      augmentServicesInfo(services);
    };

    function augmentServicesInfo(services) {
      var bundleMap = {};
      var createBundleMap = function(response) {
        angular.forEach(response.value, function(value, key) {
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
          bundleMap[obj.Identifier] = obj;
        });
        var servicesArray = [];
        angular.forEach(services, function(s, key) {
          s.Url = Core.url("/osgi/bundle/" + s.Identifier + workspace.hash())
          angular.forEach(s["UsingBundles"], function(b, key) {
            s["UsingBundles"][key] = bundleMap[b];
          });
          servicesArray.push(s);
        });
        $scope.services = servicesArray;
        Core.$apply($scope);
      };
      workspace.jolokia.request({
            type: 'exec',
            mbean: getSelectionBundleMBean(workspace),
            operation: 'listBundles()'
          },
          {
            success: createBundleMap,
            error: createBundleMap
          });
    }

  }]);
}
