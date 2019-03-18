/// <reference path="../jvmPlugin.ts"/>

namespace JVM {

  const SHOW_ALERT = 'showJolokiaPreferencesAlert';
  
  export function JolokiaPreferences($scope, localStorage, jolokiaParams, $window) {
    'ngInject';

    // Initialize tooltips
    (<any>$('[data-toggle="tooltip"]')).tooltip();
    
    Core.initPreferenceScope($scope, localStorage, {
      'updateRate': {
        'value': 5000,
        'post': (newValue) => {
          $scope.$emit('UpdateRate', newValue);
        }
      },
      'maxDepth': {
        'value': DEFAULT_MAX_DEPTH,
        'converter': parseInt,
        'formatter': parseInt,
        'post': (newValue) => {
          jolokiaParams.maxDepth = newValue;
          localStorage['jolokiaParams'] = angular.toJson(jolokiaParams);
        }
      },
      'maxCollectionSize': {
        'value': DEFAULT_MAX_COLLECTION_SIZE,
        'converter': parseInt,
        'formatter': parseInt,
        'post': (newValue) => {
          jolokiaParams.maxCollectionSize = newValue;
          localStorage['jolokiaParams'] = angular.toJson(jolokiaParams);
        }
      }
    });

    $scope.showAlert = !!$window.sessionStorage.getItem(SHOW_ALERT);
    $window.sessionStorage.removeItem(SHOW_ALERT);
    
    $scope.reboot = () => {
      $window.sessionStorage.setItem(SHOW_ALERT, 'true');
      $window.location.reload();
    }
  }

}
