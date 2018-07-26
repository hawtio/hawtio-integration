/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  export function formatServiceName(objClass: any): string {
    if (angular.isArray(objClass)) {
      return formatServiceNameArray(objClass);
    }
    let name = objClass.toString();
    let idx = name.lastIndexOf('.');
    return name.substring(idx + 1);
  }

  function formatServiceNameArray(objClass: string[]): string {
    let rv = [];
    for (let i = 0; i < objClass.length; i++) {
      rv.push(formatServiceName(objClass[i]));
    }
    rv = _.filter(rv, (elem, pos, self: Array<any>) => self.indexOf(elem) === pos);
    rv.sort();
    return rv.toString();
  }

  interface Alert {
    type: 'danger' | 'warning' | 'success' | 'info',
    icon: 'pficon-error-circle-o' | 'pficon-warning-triangle-o' | 'pficon-ok' | 'pficon-info',
    message: string
  }

  _module.controller("Osgi.BundleController", ["$scope", "$location", "workspace", "$routeParams", "jolokiaService", "$q", (
    $scope,
    $location: ng.ILocationService,
    workspace: Jmx.Workspace,
    $routeParams,
    jolokiaService: JVM.JolokiaService,
    $q: ng.IQService) => {

    $scope.frameworkMBean = getSelectionFrameworkMBean(workspace);
    $scope.osgiToolsMBean = getHawtioOSGiToolsMBean(workspace);
    $scope.bundleId = $routeParams.bundleId;
    $scope.classLoadingAlert = null;
    const notificationMsg = 'The operation completed successfully';

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
      let mbean = getHawtioOSGiToolsMBean(workspace);
      if (mbean) {
        jolokiaService.execute(mbean, 'getLoadClassOrigin', $scope.bundleId, clazz)
          .then((response) => {
            if (response === -1) {
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
                                Class is served from ${bundleLinks(workspace, response)}.`
              };
            }
            Core.$apply($scope);
          })
          .catch((error) => {
            inspectReportError(error);
            Core.$apply($scope);
          });
      } else {
        inspectReportNoMBeanFound();
      }
    };

    $scope.executeFindResource = (resource) => {
      let mbean = getHawtioOSGiToolsMBean(workspace);
      if (mbean) {
        jolokiaService.execute(mbean, 'getResourceURL', $scope.bundleId, resource)
          .then((response) => {
            if (response === null) {
              $scope.classLoadingAlert = <Alert>{
                type: 'warning',
                icon: 'pficon-warning-triangle-o',
                message: `Resource <strong>${resource}</strong> can not be found in Bundle ${$scope.bundleId}.`
              };
            } else {
              $scope.classLoadingAlert = <Alert>{
                type: 'success',
                icon: 'pficon-ok',
                message: `Resource <strong>${resource}</strong> in Bundle ${$scope.bundleId} is available from ${response}.`
              };
            }
            Core.$apply($scope);
          })
          .catch((error) => {
            inspectReportError(error);
            Core.$apply($scope);
          });
      } else {
        inspectReportNoMBeanFound();
      }
    };

    $scope.startBundle = (bundleId) => {
      jolokiaService.execute(getSelectionFrameworkMBean(workspace), 'startBundle', bundleId)
        .then((response) => {
          Core.notification('success', notificationMsg);
          updateTableContents();
        })
        .catch((error) => {
          Core.notification('danger', error);
        });
    };

    $scope.stopBundle = (bundleId) => {
      jolokiaService.execute(getSelectionFrameworkMBean(workspace), 'stopBundle', bundleId)
        .then((response) => {
          Core.notification('success', notificationMsg);
          updateTableContents();
        })
        .catch((error) => {
          Core.notification('danger', error);
        });
    };

    $scope.updateBundle = (bundleId) => {
      jolokiaService.execute(getSelectionFrameworkMBean(workspace), 'updateBundle', bundleId)
        .then((response) => {
          Core.notification('success', notificationMsg);
          updateTableContents();
        })
        .catch((error) => {
          Core.notification('danger', error);
        });
    };

    $scope.refreshBundle = (bundleId) => {
      jolokiaService.execute(getSelectionFrameworkMBean(workspace), 'refreshBundle', bundleId)
        .then((response) => {
          Core.notification('success', notificationMsg);
          // delay reloading because some bundles change their state for a moment after a refresh
          setTimeout(() => updateTableContents(), 2000);
        })
        .catch((error) => {
          Core.notification('danger', error);
        });
    };

    $scope.uninstallBundle = (bundleId) => {
      jolokiaService.execute(getSelectionFrameworkMBean(workspace), 'uninstallBundle', bundleId)
        .then((response) => {
          Core.notification('success', notificationMsg);
          $location.path("/osgi/bundles");
          Core.$apply($scope);
        })
        .catch((error) => {
          Core.notification('danger', error);
        });
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
        message: `<strong>Problem invoking hawtio.OSGiTools MBean:</strong> ${response}`
      };
    }

    function populateTable(response) {
      $scope.bundles = response;

      // now find the row based on the selection ui
      Osgi.defaultBundleValues(workspace, $scope, response);
      $scope.row = Osgi.findBundle($scope.bundleId, response);

      if ($scope.row) {
        createImportPackageSection();
        createExportPackageSection();
        populateServicesSection();

        Core.$apply($scope);
      }
    }

    function createImportPackageSection(): void {
      let importPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Import-Package");

      for (let pkg in $scope.row.ImportData) {
        let data = importPackageHeaders[pkg];
        if (data !== undefined) {
          $scope.row.ImportData[pkg].headers = data;
        } else {
          let reason = $scope.row.Headers["DynamicImport-Package"];
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

    function createExportPackageSection(): void {
      let exportPackageHeaders = Osgi.parseManifestHeader($scope.row.Headers, "Export-Package");
      for (let pkg in $scope.row.ExportData) {
        // replace commas with comma + whitespace so names wrap nicely in the UI
        if (exportPackageHeaders[pkg] && exportPackageHeaders[pkg].Duses) {
          exportPackageHeaders[pkg].Duses = exportPackageHeaders[pkg].Duses.replace(/,/g, ', ');
        }
        $scope.row.ExportData[pkg].headers = exportPackageHeaders[pkg];
      }
    }

    function populateServicesSection(): void {
      if (($scope.row.RegisteredServices === undefined || $scope.row.RegisteredServices.length === 0) &&
        ($scope.row.ServicesInUse === undefined || $scope.row.ServicesInUse === 0)) {
        // no services for this bundle
        return;
      }

      let mbean = getSelectionServiceMBean(workspace);
      if (mbean) {
        jolokiaService.execute(mbean, 'listServices()')
          .then((response) => {
            updateServices(response);
          })
          .catch((error) => {
            Core.notification('danger', error);
          });
      }
    }

    function updateServices(result) {
      let data = result;
      for (let id in data) {
        let reg = document.getElementById("registers.service." + id);
        let uses = document.getElementById("uses.service." + id);

        if ((reg === undefined || reg === null) && (uses === undefined || uses === null)) {
          continue;
        }

        jolokiaService.execute(getSelectionServiceMBean(workspace), 'getProperties', id)
          .then((response) => {
            let props = response;
            let sortedKeys = Object.keys(props).sort();
            let po = "<small><table>";
            for (let i = 0; i < sortedKeys.length; i++) {
              let value = props[sortedKeys[i]];
              if (value !== undefined) {
                let fval = value.Value;
                if (fval.length > 15) {
                  fval = fval.replace(/[,]/g, ",<br/>&nbsp;&nbsp;");
                }

                po += "<tr><td valign='top'>" + sortedKeys[i] + "</td><td>" + fval + "</td></tr>"
              }
            }

            let regBID = data[id].BundleIdentifier;
            po += "<tr><td>Registered&nbsp;by</td><td>Bundle " + regBID + " <div class='less-big label'>" + $scope.bundles[regBID].SymbolicName
              + "</div></td></tr>";
            po += "</table></small>";

            if (reg !== undefined && reg !== null) {
              reg.innerText = " " + formatServiceName(data[id].objectClass);
              (<any>$)(reg).popover({ title: "service properties", content: po, trigger: "hover", html: true });
            }
            if (uses !== undefined && uses !== null) {
              uses.innerText = " " + formatServiceName(data[id].objectClass);
              (<any>$)(uses).popover({ title: "service properties", content: po, trigger: "hover", html: true });
            }
          })
          .catch((error) => {
            log.error(error);
          })
      }
    }

    function updateTableContents() {
      runWhenTreeReady(() => {
        let mbean = getSelectionBundleMBean(workspace);
        jolokiaService.execute(mbean, 'listBundles()')
          .then((response) => {
            populateTable(response);
          })
          .catch((error) => {
            Core.notification('danger', error);
          })
      }, workspace, $q);
    }
  }]);
}
