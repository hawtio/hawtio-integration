/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export function formatServiceName(objClass:any):string {
    if (angular.isArray(objClass)) {
      return formatServiceNameArray(objClass);
    }
    var name = objClass.toString();
    var idx = name.lastIndexOf('.');
    return name.substring(idx + 1);
  }

  function formatServiceNameArray(objClass:string[]):string {
    var rv = [];
    for (var i = 0; i < objClass.length; i++) {
      rv.push(formatServiceName(objClass[i]));
    }
    rv = _.filter(rv, (elem, pos, self:Array<any>) => self.indexOf(elem) === pos);
    rv.sort();
    return rv.toString();
  }

  interface Alert {
    type: 'danger' | 'warning' | 'success' | 'info',
    icon: 'pficon-error-circle-o' | 'pficon-warning-triangle-o' | 'pficon-ok' | 'pficon-info',
    message: string
  }

  _module.controller("Osgi.BundleController", ["$scope", "$location", "workspace", "$routeParams", "jolokia", ($scope, $location, workspace: Jmx.Workspace, $routeParams, jolokia) => {
    
    $scope.bundleId = $routeParams.bundleId;
    $scope.classLoadingAlert = null;

    updateTableContents();

    $scope.showValue = (key) => {
      switch (key) {
        case "Bundle-Name":
        case "Bundle-SymbolicName":
        case "Bundle-Version":
        case "Export-Package":
        case "Import-Package":
          return false;
        default:
          return true;
      }
    };

    $scope.unsatisfiedPackages = {};

    $scope.thereAreUnsatisfiedPackages = () => Object.keys($scope.unsatisfiedPackages).length > 0;

    $scope.dismissClassLoadingAlert = () => $scope.classLoadingAlert = null;

    $scope.executeLoadClass = (clazz) => {
      var mbean = getHawtioOSGiToolsMBean(workspace);
      if (mbean) {
        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'getLoadClassOrigin', arguments: [$scope.bundleId, clazz]},
                {
                  success: function (response) {
                    var resultBundle = response.value;
                    if (resultBundle === -1) {
                      $scope.classLoadingAlert = <Alert>{
                        type: 'warning',
                        icon: 'pficon-warning-triangle-o',
                        message: `Loading class <strong>${clazz}</strong> in Bundle ${$scope.bundleId}.
                                  Class can not be loaded from this bundle.`
                      };
                    } else {
                      $scope.classLoadingAlert = <Alert>{
                        type: 'success',
                        icon: 'pficon-ok',
                        message: `Loading class <strong>${clazz}</strong> in Bundle ${$scope.bundleId}.
                                  Class is served from Bundle ${bundleLinks(workspace, resultBundle)}`
                      };
                    }
                    Core.$apply($scope);
                  },
                  error: function (response) {
                    inspectReportError(response);
                    Core.$apply($scope);
                  }
                });
      } else {
        inspectReportNoMBeanFound();
      }
    };

    $scope.executeFindResource = (resource) => {
      var mbean = getHawtioOSGiToolsMBean(workspace);
      if (mbean) {
        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'getResourceURL', arguments: [$scope.bundleId, resource]},
                {
                  success: function (response) {
                    var resultURL = response.value;
                    if (resultURL === null) {
                      $scope.classLoadingAlert = <Alert>{
                        type: 'warning',
                        icon: 'pficon-warning-triangle-o',
                        message: `Finding resource <strong>${resource}</strong> in Bundle ${$scope.bundleId}.
                                  Resource can not be found from this bundle.`
                      };
                    } else {
                      $scope.classLoadingAlert = <Alert>{
                        type: 'success',
                        icon: 'pficon-ok',
                        message: `Finding resource <strong>${resource}</strong> in Bundle ${$scope.bundleId}.
                                  Resource is available from: ${resultURL}`
                      };
                    }
                    Core.$apply($scope);
                  },
                  error: function (response) {
                    inspectReportError(response);
                    Core.$apply($scope);
                  }
                }
        )
      } else {
        inspectReportNoMBeanFound();
      }
    };

    $scope.startBundle = (bundleId) => {
      jolokia.request([
        {type: 'exec', mbean: getSelectionFrameworkMBean(workspace), operation: 'startBundle', arguments: [bundleId]}
      ],
              Core.onSuccess(updateTableContents));
    };

    $scope.stopBundle = (bundleId) => {
      jolokia.request([
        {type: 'exec', mbean: getSelectionFrameworkMBean(workspace), operation: 'stopBundle', arguments: [bundleId]}
      ],
              Core.onSuccess(updateTableContents));
    };

    $scope.updatehBundle = (bundleId) => {
      jolokia.request([
        {type: 'exec', mbean: getSelectionFrameworkMBean(workspace), operation: 'updateBundle', arguments: [bundleId]}
      ],
              Core.onSuccess(updateTableContents));
    };

    $scope.refreshBundle = (bundleId) => {
      jolokia.request([
        {type: 'exec', mbean: getSelectionFrameworkMBean(workspace), operation: 'refreshBundle', arguments: [bundleId]}
      ],
              Core.onSuccess(updateTableContents));
    };

    $scope.uninstallBundle = (bundleId) => {
      jolokia.request([{
        type: 'exec', 
        mbean: getSelectionFrameworkMBean(workspace), 
        operation: 'uninstallBundle', 
        arguments: [bundleId]
        }], Core.onSuccess(function() {
          $location.path("/osgi/bundles");
          Core.$apply($scope); 
        }));
    };

    function inspectReportNoMBeanFound() {
      $scope.classLoadingAlert = <Alert>{
        type: 'danger',
        icon: 'pficon-error-circle-o',
        message: `The hawtio.OSGiTools MBean is not available. Please contact technical support.`
      };
    }

    function inspectReportError(response) {
      $scope.classLoadingAlert = <Alert>{
        type: 'danger',
        icon: 'pficon-error-circle-o',
        message: `<strong>Problem invoking hawtio.OSGiTools MBean:</strong> ${response.error}`
      };
    }

    function populateTable(response) {
      var values = response.value;
      $scope.bundles = values;
      
      // now find the row based on the selection ui
      Osgi.defaultBundleValues(workspace, $scope, values);
      $scope.row = Osgi.findBundle($scope.bundleId, values);

      createImportPackageSection();
      createExportPackageSection();
      populateServicesSection();

      Core.$apply($scope);
    }

    function createImportPackageSection():void {
      var importPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Import-Package");
      
      for (var pkg in $scope.row.ImportData) {
        var data = importPackageHeaders[pkg];
        if (data !== undefined) {
          $scope.row.ImportData[pkg].headers = data;
        } else {
          var reason = $scope.row.Headers["DynamicImport-Package"];
          if (reason !== undefined) {
            reason = reason.Value;
            $scope.row.ImportData[pkg].headers = { reason: 'Imported due to ' + reason.Value };
          }
        }
        // Delete data so we can see whether there are any unbound optional imports left...
        delete importPackageHeaders[pkg];
      }

      for (let pkg in importPackageHeaders) {
        // Ignore imported packages that are also exported because they are satisfied from the bundle
        // itself and should not be listed as unsatisfied.
        if ($scope.row.ExportData[pkg] === undefined) {
          $scope.unsatisfiedPackages[pkg] = importPackageHeaders[pkg];
        }
      }
    }

    function createExportPackageSection():void {
      var exportPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Export-Package");
      for (var pkg in $scope.row.ExportData) {
        // replace commas with comma + whitespace so names wrap nicely in the UI
        if (exportPackageHeaders[pkg] && exportPackageHeaders[pkg].Duses) {
          exportPackageHeaders[pkg].Duses = exportPackageHeaders[pkg].Duses.replace(/,/g, ', ');
        }
        $scope.row.ExportData[pkg].headers = exportPackageHeaders[pkg];
      }
    }

    function populateServicesSection():void {
      if (($scope.row.RegisteredServices === undefined || $scope.row.RegisteredServices.length === 0) &&
              ($scope.row.ServicesInUse === undefined || $scope.row.ServicesInUse === 0)) {
        // no services for this bundle
        return;
      }

      var mbean = getSelectionServiceMBean(workspace);
      if (mbean) {
        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'listServices()'},
                Core.onSuccess(updateServices));
      }
    }

    function updateServices(result) {
      var data = result.value;
      for (var id in data) {
        var reg = document.getElementById("registers.service." + id);
        var uses = document.getElementById("uses.service." + id);

        if ((reg === undefined || reg === null) && (uses === undefined || uses === null)) {
          continue;
        }

        jolokia.request({
                  type: 'exec', mbean: getSelectionServiceMBean(workspace),
                  operation: 'getProperties', arguments: [id]},
                Core.onSuccess(function (svcId, regEl, usesEl) {
                  return function (resp) {
                    var props = resp.value;
                    var sortedKeys = Object.keys(props).sort();
                    var po = "<small><table>";
                    for (var i = 0; i < sortedKeys.length; i++) {
                      var value = props[sortedKeys[i]];
                      if (value !== undefined) {
                        var fval = value.Value;
                        if (fval.length > 15) {
                          fval = fval.replace(/[,]/g, ",<br/>&nbsp;&nbsp;");
                        }

                        po += "<tr><td valign='top'>" + sortedKeys[i] + "</td><td>" + fval + "</td></tr>"
                      }
                    }

                    var regBID = data[svcId].BundleIdentifier;
                    po += "<tr><td>Registered&nbsp;by</td><td>Bundle " + regBID + " <div class='less-big label'>" + $scope.bundles[regBID].SymbolicName
                            + "</div></td></tr>";
                    po += "</table></small>";

                    if (regEl !== undefined && regEl !== null) {
                      regEl.innerText = " " + formatServiceName(data[svcId].objectClass);
                      (<any> $)(regEl).popover({title: "service properties", content: po, trigger: "hover", html: true});
                    }
                    if (usesEl !== undefined && usesEl !== null) {
                      usesEl.innerText = " " + formatServiceName(data[svcId].objectClass);
                      (<any> $)(usesEl).popover({title: "service properties", content: po, trigger: "hover", html: true});
                    }
                  }
                }(id, reg, uses)));
      }
    }

    function updateTableContents() {
      //console.log("Loading the bundles");
      var mbean = getSelectionBundleMBean(workspace);
      if (mbean) {
        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'listBundles()'},
                Core.onSuccess(populateTable));
      }
    }

  }]);

}
