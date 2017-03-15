/// <reference path="../../includes.ts"/>
/// <reference path="camelPlugin.ts"/>

interface JQuery {
  tooltip(): JQuery;
}

module Camel {

  _module.controller("Camel.PropertiesController", ["$scope", "$rootScope", "workspace", "localStorage", "jolokia",
    ($scope, $rootScope, workspace: Workspace, localStorage: WindowLocalStorage, jolokia) => {

      var log: Logging.Logger = Logger.get("Camel");

      // $scope.labels = [];

      $scope.$on("$routeChangeSuccess", function (event, current, previous) {
        // lets do this asynchronously to avoid Error: $digest already in progress
        setTimeout(updateData, 50);
      });

      function isDefaultValue(id) {
        var defaultValue = Core.pathGet($scope.model, ["properties", id, "defaultValue"]);
        if (angular.isDefined(defaultValue)) {
          // get the value
          var value = Core.pathGet($scope.nodeData, id);
          if (angular.isDefined(value)) {
            // default value is always a String type, so try to convert value to a String
            var str: string = value.toString();
            // is it a default value
            return str.localeCompare(defaultValue) === 0;
          }
        }
        return false;
      }

      function hasValue(id) {
        var value = Core.pathGet($scope.nodeData, id);
        if (angular.isUndefined(value) || Core.isBlank(value)) {
          return false;
        }
        if (angular.isString(value)) {
          // to show then must not be blank
          return !Core.isBlank(value);
        }
        return true;
      }

      function updateData() {
        let routeXmlNode = getSelectedRouteNode(workspace);

        if (routeXmlNode) {
          let data = getRouteNodeJSON(routeXmlNode);
          let schema = getCamelSchema(routeXmlNode.nodeName);
          let definedProperties = [];
          let defaultProperties = [];
          let undefinedProperties = [];

          for (let propertyName in data) {
            if (propertyName in schema.properties) {
              definedProperties.push(buildProperty(propertyName, data[propertyName], schema.properties[propertyName], false));
            }
          }

          for (let propertyName in schema.properties) {
            if (!(propertyName in data)) {
              let propertySchema = schema.properties[propertyName];
              if ('defaultValue' in propertySchema) {
                defaultProperties.push(buildProperty(propertyName, propertySchema['defaultValue'], propertySchema, true));
              } else {
                undefinedProperties.push(buildProperty(propertyName, data[propertyName], propertySchema, false));
              }
            }
          }

          definedProperties.sort(sortByName);
          undefinedProperties.sort(sortByName);

          if (log.enabledFor(Logger.DEBUG)) {
            log.debug("Properties - data: " + JSON.stringify($scope.data, null, "  "));
            log.debug("Properties - schema: " + JSON.stringify($scope.schema, null, "  "));
          }

          // // labels is named group in camelModel.js
          // var labels = [];
          // if ($scope.model.group) {
          //   labels = $scope.model.group.split(",");
          // }
          // $scope.labels = labels;

          $scope.title = schema.title;
          $scope.description = schema.description;
          $scope.definedProperties = definedProperties;
          $scope.defaultProperties = defaultProperties;
          $scope.undefinedProperties = undefinedProperties;
          $scope.icon = getRouteNodeIcon(routeXmlNode);
          $scope.viewTemplate = "plugins/camel/html/nodePropertiesView.html";

          Core.$apply($scope);
        }
      }

      function buildProperty(name: string, value: string, schema: Object, isDefaultValue: boolean) {
        return {
          name: schema['title'],
          value: value,
          description: schema['description'],
          isDefaultValue: isDefaultValue
        }
      }

      function sortByName(a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }

      setTimeout(function() {
        $('[data-toggle=tooltip]').tooltip();
      },1000);

    }]);

  _module.component('propertyList', {
    template: `
      <div ng-show="$ctrl.properties.length > 0">
        <h3>{{$ctrl.title}}</h3>
        <dl class="dl-horizontal">
          <dt ng-repeat-start="property in $ctrl.properties">
            {{property.name}}
            <span class="fa fa-info-circle camel-properties-info-circle" data-toggle="tooltip" data-placement="right" title="{{property.description}}"></span>
          </dt>
          <dd ng-repeat-end>
            <samp>{{property.value}}</samp>
          </dd>
        </dl>
      </div>`,
    bindings: {
      title: '@',
      properties: '<'
    }
  });

}
