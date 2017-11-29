/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  interface BundleGroup {
    id: string,
    name: string
  }

  _module.controller("Osgi.BundleListController", ["$scope", "workspace", "jolokia", "localStorage", "$location", (
      $scope,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      localStorage: Storage,
      $location: ng.ILocationService) => {

    const ACTIVEMQ_SERVICE = {id: 'ACTIVEMQ', name: 'ActiveMQ'};
    const CAMEL_SERVICE = {id: 'CAMEL', name: 'Camel'};
    const CXF_SERVICE = {id: 'CXF', name: 'CXF'};
    const PLATFORM_SERVICE = {id: 'PLATFORM', name: 'Platform'};

    $scope.availableServices = [
      ACTIVEMQ_SERVICE,
      CAMEL_SERVICE,
      CXF_SERVICE,
      PLATFORM_SERVICE
    ];
    $scope.result = {};
    $scope.bundles = [];
    $scope.bundleUrl = "";
    $scope.display = {
      bundleField: "Name",
      sortField: "Identifier",
      bundleFilter: "",
      startLevelFilter: 0,
      showBundleGroups: []
    };
    $scope.listViewUrl = Core.url('/osgi/bundle-list' + workspace.hash());
    $scope.tableViewUrl = Core.url('/osgi/bundles' + workspace.hash());

    if ('bundleList' in localStorage) {
      $scope.display = angular.fromJson(localStorage['bundleList']);
      if ($scope.display.showBundleGroups === undefined) {
        $scope.display.showBundleGroups = [];
      }
    }

    $scope.$watch('display', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        localStorage['bundleList'] = angular.toJson(newValue);
      }
    }, true);

    $scope.installDisabled = function () {
      return $scope.bundleUrl === "";
    };

    $scope.install = function () {
      jolokia.request({
        type: 'exec',
        mbean: getSelectionFrameworkMBean(workspace),
        operation: "installBundle(java.lang.String)",
        arguments: [$scope.bundleUrl]
      }, {
        success: function (response) {
          var bundleID = response.value;
          jolokia.request({
            type: 'exec',
            mbean: getSelectionBundleMBean(workspace),
            operation: "isFragment(long)",
            arguments: [bundleID]
          }, {
            success: function (response) {
              var isFragment = response.value;
              if (isFragment) {
                Core.notification("success", "Fragment installed successfully.");
                $scope.bundleUrl = "";
                Core.$apply($scope);
              } else {
                jolokia.request({
                  type: 'exec',
                  mbean: getSelectionFrameworkMBean(workspace),
                  operation: "startBundle(long)",
                  arguments: [bundleID]
                }, {
                  success: function (response) {
                    Core.notification("success", "Bundle installed and started successfully.");
                    $scope.bundleUrl = "";
                    Core.$apply($scope);
                  },
                  error: function (response) {
                    Core.notification("error", response.error)
                  }
                });
              }
            },
            error: function (response) {
              Core.notification("error", response.error)
            }
          });
        },
        error: function (response) {
          Core.notification("error", response.error);
        }
      });
    };

    $scope.$watch('display.sortField', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        $scope.bundles = _.sortBy($scope.bundles, newValue); 
      }
    });

    $scope.getStateStyle = (state) => {
      return Osgi.getStateStyle("badge", state);
    };

    $scope.getLabel = (bundleObject) => {
      var labelText;
      if ($scope.display.bundleField === "Name") {
        labelText = bundleObject.Name;
        if (labelText === "") {
          labelText = bundleObject.SymbolicName;
        }
      } else {
        labelText = bundleObject.SymbolicName;
      }
      return labelText;
    };

    $scope.filterBundle = (bundle) => {
      if ($scope.display.startLevelFilter > 0 && bundle.StartLevel < $scope.display.startLevelFilter) {
        return false;
      }
      var labelText = $scope.getLabel(bundle);
      if ($scope.display.bundleFilter) {
        if (labelText.toLowerCase().indexOf($scope.display.bundleFilter.toLowerCase()) === -1) {
          return false;
        } else {
          return $scope.display.showBundleGroups.length === 0 ||
            ($scope.display.showBundleGroups.length > 0 && matchesCheckedBundle(bundle));
        }
      } else {
        return $scope.display.showBundleGroups.length === 0 ||
          ($scope.display.showBundleGroups.length > 0 && matchesCheckedBundle(bundle));
      }
    };

    $scope.showDetails = (bundle) => {
      $location.path(bundle.Url);
    }

    function matchesCheckedBundle(bundle) {
      return (shouldShowBundleGroup(ACTIVEMQ_SERVICE) && Karaf.isActiveMQBundle(bundle['SymbolicName'])) ||
        (shouldShowBundleGroup(CAMEL_SERVICE) && Karaf.isCamelBundle(bundle['SymbolicName'])) ||
        (shouldShowBundleGroup(CXF_SERVICE) && Karaf.isCxfBundle(bundle['SymbolicName'])) ||
        (shouldShowBundleGroup(PLATFORM_SERVICE) && Karaf.isPlatformBundle(bundle['SymbolicName']));
    }

    function shouldShowBundleGroup(bundleGroup: BundleGroup) {
      for (let i = 0; i < $scope.display.showBundleGroups.length; i++) {
        if ($scope.display.showBundleGroups[i].id === bundleGroup.id) {
          return true;
        }
      }
      return false;
    }

    function processResponse(response) {

      var value = response['value'];

      var responseJson = angular.toJson(value);

      if ($scope.responseJson !== responseJson) {
        $scope.responseJson = responseJson;
        let bundles = [];
        angular.forEach(value, function (value, key) {
          var obj = {
            Identifier: value.Identifier,
            Name: "",
            SymbolicName: value.SymbolicName,
            Fragment: value.Fragment,
            State: value.State,
            Version: value.Version,
            LastModified: new Date(Number(value.LastModified)),
            Location: value.Location,
            StartLevel: undefined,
            Url: Core.url("/osgi/bundle/" + value.Identifier)
          };
          if (value.Headers['Bundle-Name']) {
            obj.Name = value.Headers['Bundle-Name']['Value'];
          }
          bundles.push(obj);
        });

        $scope.bundles = _.sortBy(bundles, $scope.display.sortField);

        Core.$apply($scope);

        // Obtain start level information for all the bundles, let's do this async though
        setTimeout(() => {

          var requests = [];

          for (var i = 0; i < $scope.bundles.length; i++) {
            var b = $scope.bundles[i];
            requests.push({
              type: 'exec', mbean: getSelectionBundleMBean(workspace),
              operation: 'getStartLevel(long)',
              arguments: [b.Identifier]
            });
          }

          var outstanding = requests.length;

          jolokia.request(requests, Core.onSuccess((response) => {
            var id = response['request']['arguments'][0];
            if (angular.isDefined(id)) {
              var bundle = $scope.bundles[id];
              if (bundle) {
                log.debug("Setting bundle: ", bundle['Identifier'], " start level to: ", response['value']);
                bundle['StartLevel'] = response['value'];
              }
            }
            outstanding = outstanding - 1;
            log.debug("oustanding responses: ", outstanding);
            if (outstanding === 0) {
              log.debug("Updating page...");
              Core.$apply($scope);
            }
          }, { error: (response) => {
            // let's ignore the error - maybe the bundle is no longer available?
          } }));

        }, 500);
      }
    }

    Core.register(jolokia, $scope, {
      type: 'exec', mbean: getSelectionBundleMBean(workspace),
      operation: 'listBundles()'
    }, Core.onSuccess(processResponse));
  }]);
}
