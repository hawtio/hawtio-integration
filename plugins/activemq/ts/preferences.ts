/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {

  _module.controller("ActiveMQ.PreferencesController", ["$scope", "localStorage", "userDetails", "$rootScope", (
      $scope,
      localStorage: Storage,
      userDetails: Core.UserDetails,
      $rootScope: ng.IRootScopeService) => {

    $scope.messageBodyDisplayOptions = {
      'Hex and text': 1,
      'Decimal and text': 2,
      'Hex': 4,
      'Decimal': 8,
      'Off': 99
    };

    Core.initPreferenceScope($scope, localStorage, {
      'activemqUserName': {
        'value': userDetails.username ? userDetails.username : ""
      },
      'activemqPassword': {
        'value': userDetails.password ? userDetails.password : ""
      },
      'activemqBrowseBytesMessages': {
        'value': 1,
        'converter': parseInt
      },
      'activemqFilterAdvisoryTopics': {
        'value': false,
        'converter': Core.parseBooleanValue,
        'post': (newValue) => {
          $rootScope.$broadcast('jmxTreeUpdated');
        }
      }
    });
  }]);
}
