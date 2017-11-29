/// <reference path="activemqHelpers.ts"/>
/// <reference path="activemqPlugin.ts"/>

namespace ActiveMQ {

  _module.controller("ActiveMQ.PreferencesController", ["$scope", "localStorage", "userDetails", "$rootScope", (
      $scope,
      localStorage: Storage,
      userDetails: Core.UserDetails,
      $rootScope: ng.IRootScopeService) => {

    var config = {
      properties: {
        activemqUserName: {
          type: 'string',
          description: 'The user name to be used when connecting to the broker'
        },
        activemqPassword: {
          type: 'password',
          description: 'Password to be used when connecting to the broker'
        },
        activemqFilterAdvisoryTopics: {
          type: 'boolean',
          default: 'false',
          description: 'Whether to exclude advisory topics in tree/table'
        },
        activemqBrowseBytesMessages: {
          type: 'number',
          enum: {
            'Hex and text': 1,
            'Decimal and text': 2,
            'Hex': 4,
            'Decimal': 8,
            'Off': 99
          },
          description: 'Browsing byte messages should display the message body as'
        }
      }
    };

    $scope.entity = $scope;
    $scope.config = config;

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
