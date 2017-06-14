/// <reference path="karafPlugin.ts"/>

namespace Karaf {

  _module.controller("Karaf.FeaturesController", ["$scope", "$location", "workspace", "jolokia", (
      $scope,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia) => {

    $scope.responseJson = '';
    $scope.filter = '';

    $scope.installedFeatures = [];

    $scope.features = [];
    $scope.repositories = [];
    $scope.selectedRepositoryId = '';
    $scope.selectedRepository = {};

    $scope.newRepositoryURI = '';


    $scope.init = () => {

      var selectedRepositoryId = $location.search()['repositoryId'];
      if (selectedRepositoryId) {
        $scope.selectedRepositoryId = selectedRepositoryId;
      }

      var filter = $location.search()['filter'];
      if (filter) {
        $scope.filter = filter;
      }

    };

    $scope.init();

    $scope.$watch('selectedRepository', (newValue, oldValue) => {
      //log.debug("selectedRepository: ", $scope.selectedRepository);
      if (newValue !== oldValue) {
        if (!newValue) {
          $scope.selectedRepositoryId = '';
        } else {
          $scope.selectedRepositoryId = newValue['repository'];
        }
        $location.search('repositoryId', $scope.selectedRepositoryId);
      }
    }, true);

    $scope.$watch('filter', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        $location.search('filter', newValue);
      }
    });

    var featuresMBean = Karaf.getSelectionFeaturesMBean(workspace);

    log.debug("Features mbean: ", featuresMBean);

    if (featuresMBean) {
      Core.register(jolokia, $scope, {
        type: 'read', mbean: featuresMBean
      }, Core.onSuccess(render));
    }

    $scope.inSelectedRepository = (feature) => {
      if (!$scope.selectedRepository || !('repository' in $scope.selectedRepository)) {
        return "";
      }
      if (!feature  || !('RepositoryName' in feature)) {
        return "";
      }
      if (feature['RepositoryName'] === $scope.selectedRepository['repository']) {
        return "in-selected-repository";
      }
      return "";
    };

    $scope.isValidRepository = () => {
      return Core.isBlank($scope.newRepositoryURI);
    };

    $scope.installRepository = () => {
      var repoURL = $scope.newRepositoryURI;
      Core.notification('info', 'Adding feature repository URL');
      Karaf.installRepository(workspace, jolokia, repoURL, () => {
        Core.notification('success', 'Added feature repository URL');
        $scope.selectedRepository = {};
        $scope.selectedRepositoryId = '';
        $scope.responseJson = null;
        $scope.triggerRefresh();
      }, (response) => {
        log.error('Failed to add feature repository URL ', repoURL, ' due to ', response.error);
        log.info('stack trace: ', response.stacktrace);
        Core.$apply($scope);
      });
    };

    $scope.uninstallRepository = () => {
      var repoURI = $scope.selectedRepository['uri'];
      Core.notification('info', 'Removing feature repository ' + repoURI);
      Karaf.uninstallRepository(workspace, jolokia, repoURI, () => {
        Core.notification('success', 'Removed feature repository ' + repoURI);
        $scope.responseJson = null;
        $scope.selectedRepositoryId = '';
        $scope.selectedRepository = {};
        $scope.triggerRefresh();
      }, (response) => {
        log.error('Failed to remove feature repository ', repoURI, ' due to ', response.error);
        log.info('stack trace: ', response.stacktrace);
        Core.$apply($scope);
      });
    };

    $scope.triggerRefresh = () => {
      jolokia.request({
        type: 'read',
        method: 'POST',
        mbean: featuresMBean
      }, Core.onSuccess(render));
    };

    $scope.install = (feature) => {
      //$('.popover').remove();
      Core.notification('info', 'Installing feature ' + feature.Name);
      installFeature(workspace, jolokia, feature.Name, feature.Version, () => {
        Core.notification('success', 'Installed feature ' + feature.Name);
        $scope.installedFeatures.add(feature);
        $scope.responseJson = null;
        $scope.triggerRefresh();
        //Core.$apply($scope);
      }, (response) => {
        log.error('Failed to install feature ', feature.Name, ' due to ', response.error);
        log.info('stack trace: ', response.stacktrace);
        Core.$apply($scope);
      });
    };

    $scope.uninstall = (feature) => {
      //$('.popover').remove();
      Core.notification('info', 'Uninstalling feature ' + feature.Name);
      uninstallFeature(workspace, jolokia, feature.Name, feature.Version, () => {
        Core.notification('success', 'Uninstalled feature ' + feature.Name);
        $scope.installedFeatures.remove(feature);
        $scope.responseJson = null;
        $scope.triggerRefresh();
        //Core.$apply($scope);
      }, (response) => {
        log.error('Failed to uninstall feature ', feature.Name, ' due to ', response.error);
        log.info('stack trace: ', response.stacktrace);
        Core.$apply($scope);
      });
    };

    $scope.filteredRows = ['Bundles', 'Configurations', 'Configuration Files', 'Dependencies'];

    $scope.showRow = (key, value) => {
      
      if ($scope.filteredRows.indexOf(key) !== -1) {
        return false;
      }

      if (angular.isArray(value)) {
        if (value.length === 0) {
          return false;
        }
      }

      if (angular.isString(value)) {
        if (Core.isBlank(value)) {
          return false;
        }
      }

      if (angular.isObject(value)) {
        if (!value || angular.equals(value, {})) {
          return false;
        }
      }

      return true;
    };

    $scope.installed = (installed) => {
      var answer = Core.parseBooleanValue(installed);
      return answer;
    };

    $scope.showValue = (value) => {
      if (angular.isArray(value)) {
        var answer = ['<ul class="zebra-list">']
        value.forEach((v) => { answer.push('<li>' + v + '</li>')});
        answer.push('</ul>');
        return answer.join('\n');
      }
      if (angular.isObject(value)) {
        var answer = ['<table class="table">', '<tbody>']

        angular.forEach(value, (value, key) => {
          answer.push('<tr>');
          answer.push('<td>' + key + '</td>')
          answer.push('<td>' + value + '</td>')
          answer.push('</tr>');
        });

        answer.push('</tbody>');
        answer.push('</table>');

        return answer.join('\n');
      }
      return "" + value;
    };

    $scope.getStateStyle = (feature) => {
      if (Core.parseBooleanValue(feature.Installed)) {
        return "badge badge-success";
      }
      return "badge";
    };

    $scope.filterFeature = (feature) => {
      if (Core.isBlank($scope.filter)) {
        return true;
      }
      if (feature.Id.has($scope.filter)) {
        return true;
      }
      return false;
    };

    function render(response) {
      var responseJson = angular.toJson(response.value);
      if ($scope.responseJson !== responseJson) {
        $scope.responseJson = responseJson;
        //log.debug("Got response: ", response.value);

        if (response['value']['Features'] === null) {
          $scope.featuresError = true;
        } else {
          $scope.featuresError = false;
        }

        $scope.features = [];
        $scope.repositories = [];

        var features = [];
        var repositories = [];

        populateFeaturesAndRepos(response.value, features, repositories);

        var installedFeatures = features.filter((f) => { return Core.parseBooleanValue(f.Installed); });
        var uninstalledFeatures = features.filter((f) => { return !Core.parseBooleanValue(f.Installed); });

        //log.debug("repositories: ", repositories);

        $scope.installedFeatures = _.sortBy(installedFeatures, (f) => f['Name']);
        uninstalledFeatures = _.sortBy(uninstalledFeatures, (f) => f['Name']);

        _.sortBy(repositories, 'id').forEach((repo) => {
          $scope.repositories.push({
            repository: repo['id'],
            uri: repo['uri'],
            features: _.filter(uninstalledFeatures, (f) => f['RepositoryName'] === repo['id'])
          });
        });

        if (!Core.isBlank($scope.newRepositoryURI)) {
          var selectedRepo = _.find(repositories, (r) => r['uri'] === $scope.newRepositoryURI);
          if (selectedRepo) {
            $scope.selectedRepositoryId = selectedRepo['id'];
          }
          $scope.newRepositoryURI = '';
        }

        if (Core.isBlank($scope.selectedRepositoryId)) {
          $scope.selectedRepository = _.first($scope.repositories);
        } else {
          $scope.selectedRepository = _.find($scope.repositories, (r:any) => r.repository === $scope.selectedRepositoryId);
        }

        Core.$apply($scope);
      }
    }
  }]);
}
