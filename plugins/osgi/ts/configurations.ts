/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>

namespace Osgi {

  _module.controller("Osgi.ConfigurationsController", ["$scope", "$routeParams", "$location", "workspace", "jolokia",
    "$uibModal", (
      $scope,
      $routeParams: angular.route.IRouteParamsService,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      $uibModal) => {

      $scope.configurations = null;
      $scope.filteredConfigurations = [];
            
      /** the kinds of config */
      const configKinds = {
        factory: {
          class: "fa fa-cubes",
          title: "Configuration factory used to create separate instances of the configuration"
        },
        pid: {
          class: "fa fa-check list-view-pf-icon-success",
          title: "Configuration which has a set of properties associated with it"
        },
        pidNoValue: {
          class: "fa fa-exclamation list-view-pf-icon-warning",
          title: "Configuration which does not yet have any bound values"
        }
      };

      $scope.toolbarConfig = {
        filterConfig: {
          fields: [
            {
              id: 'name',
              title: 'Name',
              placeholder: 'Filter by name...',
              filterType: 'text'
            },
            {
              id: 'description',
              title: 'Description',
              placeholder: 'Filter by description...',
              filterType: 'text'
            }
          ],
          resultsCount: 0,
          totalCount: 0,
          appliedFilters: [],
          onFilterChange: filters => {
            applyFilters(filters);
            updateResultCount();
          }
        },
        actionsConfig: {
          primaryActions: [
            {
              name: 'Add configuration',
              actionFn: openAddPidDialog
            }
          ]
        }
      };

      $scope.listViewConfig = {
        showSelectBox: false
      }

      $scope.listViewMenuItems = [
        {
          name: 'Delete',
          actionFn: (action, item) => {
            const modalScope = $scope.$new(true);
            modalScope.item = item;
            $uibModal.open({
              templateUrl: 'deletePidDialog.html',
              scope: modalScope
            })
            .result.then(() => {
              var mbean = getSelectionConfigAdminMBean(workspace);
              if (mbean) {
                jolokia.request({
                  type: "exec",
                  mbean: mbean,
                  operation: 'delete',
                  arguments: [item.pid]
                }, {
                  success: (response) => {
                    const i = $scope.configurations.indexOf(item);
                    $scope.configurations.splice(i, 1);
                    Core.notification("success", "Successfully deleted pid: " + item.pid);
                  },
                  error: (response) => Core.notification("error", response.error)
                });
              }
        
            })
            .catch(() => undefined);
          }
        }
      ]

      function applyFilters(filters) {
        let filteredConfigurations = $scope.configurations;
        filters.forEach(filter => {
          const regExp = new RegExp(filter.value, 'i');
          if (filter.id === 'name') {
            filteredConfigurations = filteredConfigurations.filter(configuration => regExp.test(configuration.name));
          } else if (filter.id === 'description') {
            filteredConfigurations = filteredConfigurations.filter(configuration => regExp.test(configuration.description));
          }
        });
        $scope.filteredConfigurations = filteredConfigurations;
      }
  
      function updateResultCount() {
        $scope.toolbarConfig.filterConfig.totalCount = $scope.configurations.length;
        $scope.toolbarConfig.filterConfig.resultsCount = $scope.filteredConfigurations.length;
      }
        
      function openAddPidDialog() {
        $uibModal.open({
          templateUrl: 'addPidDialog.html',
          scope: $scope
        })
        .result.then((newPid) => {
          if ($scope.configurations.some((c) => c['pid'] == newPid)) {
            Core.notification("error", "pid \"" + newPid + "\" already exists.");
            return;
          }
          var mbean = getHawtioConfigAdminMBean(workspace);
          if (mbean && newPid) {
            var json = JSON.stringify({});
            jolokia.execute(mbean, "configAdminUpdate", newPid, json, Core.onSuccess(response => {
              Core.notification("success", "Successfully created pid: " + newPid);
              updateTableContents();
            }));
          }
        })
        .catch(() => undefined);
      }

      function onConfigPids(response) {
        var pids = {};
        angular.forEach(response, (row) => {
          var pid = row[0];
          var bundle = row[1];
          var config = createPidConfig(pid, bundle);
          if (!ignorePid(pid)) {
            config["hasValue"] = true;
            config["kind"] = configKinds.pid;
            pids[pid] = config;
          }
        });
        $scope.pids = pids;

        // lets load the factory pids
        var mbean = getSelectionConfigAdminMBean(workspace);
        if (mbean) {
          jolokia.execute(mbean, 'getConfigurations', '(service.factoryPid=*)',
            Core.onSuccess(onConfigFactoryPids, errorHandler("Failed to load factory PID configurations: ")));
        }
        loadMetaType();
      }

      /**
       * For each factory PID lets find the underlying PID to use to edit it, then lets make a link between them
       */
      function onConfigFactoryPids(response) {
        var mbean = getSelectionConfigAdminMBean(workspace);
        var pids = $scope.pids;
        if (pids && mbean) {
          angular.forEach(response, (row) => {
            var pid = row[0];
            var bundle = row[1];
            if (pid && !ignorePid(pid)) {
              var config = pids[pid];
              if (config) {
                config["isFactoryInstance"] = true;
                jolokia.execute(mbean, 'getFactoryPid', pid, Core.onSuccess(factoryPid => {
                  config["factoryPid"] = factoryPid;
                  config["name"] = removeFactoryPidPrefix(pid, factoryPid);
                  if (factoryPid) {
                    var factoryConfig = getOrCreatePidConfig(factoryPid, bundle, pids);
                    if (factoryConfig) {
                      configureFactoryPidConfig(pid, factoryConfig, config);
                      if ($scope.inFabricProfile) {
                        Osgi.getConfigurationProperties(workspace, jolokia, pid, (configValues) => {
                          var zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);
                          if (zkPid) {
                            config["name"] = removeFactoryPidPrefix(zkPid, factoryPid);
                            config["zooKeeperPid"] = zkPid;
                            Core.$apply($scope);
                          }
                        });
                      }
                      updateConfigurations();
                    }
                  }
                }));
              }
            }
          });
        }
        updateMetaType();
      }

      function onMetaType(response) {
        $scope.metaType = response;
        updateMetaType();
      }

      function updateConfigurations() {
        var configurations = [];
        // add parent configurations to array
        angular.forEach($scope.pids, (config, pid) => {
          if (!config.isFactoryInstance) {
            configurations.push(config);
          }
        });
        // sort configurations by name        
        configurations = _.sortBy(configurations, configuration => configuration.name.toLowerCase());
        // add children under their parents in array
        for (let i = configurations.length - 1; i > -1; i--) {
          let config = configurations[i];
          if (config.isFactory) {
            angular.forEach(config.children, child => {
              configurations.splice(i + 1, 0, child);
            });
          }
        }
        // update UI
        $scope.configurations = configurations;
        applyFilters($scope.toolbarConfig.filterConfig.appliedFilters);
        updateResultCount();
        Core.$apply($scope);
      }

      function updateMetaType(lazilyCreateConfigs = true) {
        var metaType = $scope.metaType;
        if (metaType) {
          var pidMetadata = Osgi.configuration.pidMetadata;
          var pids = $scope.pids || {};
          angular.forEach(metaType.pids, (value, pid) => {
            var bundle = null;
            var config = lazilyCreateConfigs ? getOrCreatePidConfig(pid, bundle) : pids[pid];
            if (config) {
              var factoryPidBundleIds = value.factoryPidBundleIds;
              if (factoryPidBundleIds && factoryPidBundleIds.length) {
                setFactoryPid(config);
              }
              config["name"] = Core.pathGet(pidMetadata, [pid, "name"]) || trimUnnecessaryPrefixes(value.name) || pid;
              var description = Core.pathGet(pidMetadata, [pid, "description"]) || value.description;
              /*
                          if (description) {
                            description = description + "\n" + pidBundleDescription(pid, config.bundle);
                          }
              */
              config["description"] = description;
            }
          });
        }
        updateConfigurations();
      }

      function loadMetaType() {
        if ($scope.pids) {
          if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
            jolokia.execute($scope.profileMetadataMBean, "metaTypeSummary", $scope.versionId, $scope.profileId, Core.onSuccess(onMetaType));
          } else {
            var metaTypeMBean = getMetaTypeMBean(workspace);
            if (metaTypeMBean) {
              jolokia.execute(metaTypeMBean, "metaTypeSummary", Core.onSuccess(onMetaType));
            }
          }
        }
      }

      function updateTableContents() {
        $scope.configurations = [];
        if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
          jolokia.execute($scope.profileMetadataMBean, "metaTypeSummary",
            $scope.versionId, $scope.profileId, Core.onSuccess(onProfileMetaType, { silent: true }));
        } else {
          if (jolokia) {
            var mbean = getSelectionConfigAdminMBean(workspace);
            if (mbean) {
              jolokia.execute(mbean, 'getConfigurations', '(service.pid=*)', Core.onSuccess(onConfigPids, errorHandler("Failed to load PID configurations: ")));
            }
          }
        }
      }

      function onProfileMetaType(response) {
        var metaType = response;
        if (metaType) {
          var pids = {};
          angular.forEach(metaType.pids, (value, pid) => {
            if (value && !ignorePid(pid)) {
              // TODO we don't have a bundle ID
              var bundle = "mvn:" + pid;
              var config = {
                pid: pid,
                name: value.name,
                class: 'pid',
                description: value.description,
                bundle: bundle,
                kind: configKinds.pid,
                pidLink: createPidLink(pid)
              };
              pids[pid] = config;
            }
          });
          angular.forEach(pids, (config, pid) => {
            var idx = pid.indexOf('-');
            if (idx > 0) {
              var factoryPid = pid.substring(0, idx);
              var name = pid.substring(idx + 1, pid.length);
              var factoryConfig = pids[factoryPid];
              if (!factoryConfig) {
                var bundle = config['bundle'];
                factoryConfig = getOrCreatePidConfig(factoryPid, bundle, pids);
              }
              if (factoryConfig) {
                configureFactoryPidConfig(pid, factoryConfig, config, factoryPid);
                config['name'] = name;
                pids[factoryPid] = factoryConfig;

                // lets remove the pid instance as its now a child of the factory
                delete pids[pid];
              }
            }
          });
          $scope.pids = pids;
        }

        // now lets process the response and replicate the getConfigurations / getProperties API
        // calls on the OSGi API
        // to get the tree of factory pids or pids
        $scope.metaType = metaType;
        updateMetaType(false);
      }

      function trimUnnecessaryPrefixes(name) {
        angular.forEach(["Fabric8 ", "Apache "], (prefix) => {
          if (name && _.startsWith(name, prefix) && name.length > prefix.length) {
            name = name.substring(prefix.length);
          }
        });
        return name;
      }

      function pidBundleDescription(pid, bundle) {
        var pidMetadata = Osgi.configuration.pidMetadata;
        return Core.pathGet(pidMetadata, [pid, "description"]) || "pid: " + pid + "\nbundle: " + bundle;
      }

      function createPidConfig(pid, bundle) {
        var pidMetadata = Osgi.configuration.pidMetadata;
        var config = {
          pid: pid,
          name: Core.pathGet(pidMetadata, [pid, "name"]) || pid,
          class: 'pid',
          description: Core.pathGet(pidMetadata, [pid, "description"]) || pidBundleDescription(pid, bundle),
          bundle: bundle,
          kind: configKinds.pidNoValue,
          pidLink: createPidLink(pid)
        };
        return config;
      }

      function ignorePid(pid) {
        var answer = false;
        angular.forEach(Osgi.configuration.ignorePids, (pattern) => {
          if (_.startsWith(pid, pattern)) {
            answer = true;
          }
        });
        return answer;
      }

      function getOrCreatePidConfig(pid, bundle, pids = null) {
        if (ignorePid(pid)) {
          log.info("ignoring pid " + pid);
          return null;
        } else {
          if (!pids) {
            pids = $scope.pids;
          }
          var factoryConfig = pids[pid];
          if (!factoryConfig) {
            factoryConfig = createPidConfig(pid, bundle);
            pids[pid] = factoryConfig;
            updateConfigurations();
          }
          return factoryConfig;
        }
      }

      function configureFactoryPidConfig(pid, factoryConfig, config, factoryPid = null) {
        setFactoryPid(factoryConfig, factoryPid, pid);
        //config["pidLink"] = createPidLink(pid, factoryPid);
        var children = factoryConfig.children;
        if (factoryPid) {
          factoryConfig.pidLink = createPidLink(factoryPid, true);
        }
        if (!children) {
          children = {};
          factoryConfig["children"] = children;
        }
        children[pid] = config;
      }


      function setFactoryPid(factoryConfig, factoryPid = null, pid = null) {
        factoryConfig["isFactory"] = true;
        factoryConfig["class"] = "factoryPid";
        factoryConfig["kind"] = configKinds.factory;
        if (!factoryPid) {
          factoryPid = factoryConfig["factoryPid"] || "";
        }
        if (!pid) {
          pid = factoryConfig["pid"] || "";
        }
        if (!factoryPid) {
          factoryPid = pid;
          pid = null;
        }
        factoryConfig["pidLink"] = createPidLink(factoryPid);
      }

      function createPidLink(pid, isFactory = false) {
        return createConfigPidLink($scope, workspace, pid, isFactory);
      }

      function errorHandler(message) {
        return {
          error: (response) => {
            Core.notification("error", message + response['error'] || response);
            Core.defaultJolokiaErrorHandler(response);
          }
        };
      }

      $scope.goTo = (pidLink) => {
        $location.path(pidLink);
      };

      // load the data
      updateTableContents();

    }]);
}
