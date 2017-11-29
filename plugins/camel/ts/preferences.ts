/// <reference path="camelPlugin.ts"/>

namespace Camel {

  _module.controller("Camel.PreferencesController", ["$scope", "localStorage", (
      $scope,
      localStorage: Storage) => {

    var config = {
      properties: {
        camelHideOptionDocumentation: {
          type: 'boolean',
          default: Camel.defaultHideOptionDocumentation,
          description: 'Whether to hide documentation in the properties view and Camel route editor'
        },
        camelHideOptionDefaultValue: {
          type: 'boolean',
          default: Camel.defaultHideOptionDefaultValue,
          description: 'Whether to hide options that are using a default value in the properties view'
        },
        camelHideOptionUnusedValue: {
          type: 'boolean',
          default: Camel.defaultHideOptionUnusedValue,
          description: 'Whether to hide unused/empty options in the properties view'
        },
        camelTraceOrDebugIncludeStreams: {
          type: 'boolean',
          default: Camel.defaultCamelTraceOrDebugIncludeStreams,
          description: 'Whether to include stream based message body when using the tracer and debugger'
        },
        camelMaximumTraceOrDebugBodyLength: {
          type: 'number',
          default: Camel.defaultCamelMaximumTraceOrDebugBodyLength,
          description: 'The maximum length of the body before its clipped when using the tracer and debugger'
        },
        camelMaximumLabelWidth: {
          type: 'number',
          description: 'The maximum length of a label in Camel diagrams before it is clipped'
        },
        camelIgnoreIdForLabel: {
          type: 'boolean',
          default: false,
          description: 'If enabled then we will ignore the ID value when viewing a pattern in a Camel diagram; otherwise we will use the ID value as the label (the tooltip will show the actual detail)'
        },
        camelShowInflightCounter: {
          type: 'boolean',
          default: true,
          description: 'Whether to show inflight counter in route diagram'
        },
        camelRouteMetricMaxSeconds: {
          type: 'number',
          min: '1',
          max: '100',
          description: 'The maximum value in seconds used by the route metrics duration and histogram charts'
        }
      }
    };

    $scope.entity = $scope;
    $scope.config = config;

    Core.initPreferenceScope($scope, localStorage, {
      'camelIgnoreIdForLabel': {
        'value': false,
        'converter': Core.parseBooleanValue,
        'post': (newValue) => {
          $scope.$emit('ignoreIdForLabel', newValue);
        }
      },
      'camelShowInflightCounter': {
        'value': true,
        'converter': Core.parseBooleanValue
      },
      'camelMaximumLabelWidth': {
        'value': Camel.defaultMaximumLabelWidth,
        'converter': parseInt
      },
      'camelMaximumTraceOrDebugBodyLength': {
        'value': Camel.defaultCamelMaximumTraceOrDebugBodyLength,
        'converter': parseInt
      },
      'camelTraceOrDebugIncludeStreams': {
        'value': Camel.defaultCamelTraceOrDebugIncludeStreams,
        'converter': Core.parseBooleanValue
      },
      'camelRouteMetricMaxSeconds': {
        'value': Camel.defaultCamelRouteMetricMaxSeconds,
        'converter': parseInt
      },
      'camelHideOptionDocumentation': {
        'value': Camel.defaultHideOptionDocumentation,
        'converter': Core.parseBooleanValue,
        'post': (newValue) => {
          $scope.$emit('hideOptionDocumentation', newValue);
        }
      },
      'camelHideOptionDefaultValue': {
        'value': Camel.defaultHideOptionDefaultValue,
        'converter': Core.parseBooleanValue,
        'post': (newValue) => {
          $scope.$emit('hideOptionDefaultValue', newValue);
        }
      },
      'camelHideOptionUnusedValue': {
        'value': Camel.defaultHideOptionUnusedValue,
        'converter': Core.parseBooleanValue,
        'post': (newValue) => {
          $scope.$emit('hideOptionUnusedValue', newValue);
        }
      }
    });
  }]);
}
