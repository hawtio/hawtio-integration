/// <reference path="uiPlugin.ts"/>

namespace UI {

  var objectView = _module.directive("hawtioObject", ["$templateCache", "$interpolate", "$compile", ($templateCache: ng.ITemplateCacheService, $interpolate: ng.IInterpolateService, $compile: ng.ICompileService) => {
    return {
      restrict: "A",
      replace: true,
      templateUrl: templatePath + "object.html",
      scope: {
        "entity": "=?hawtioObject",
        "config": "=?",
        "path": "=?",
        "row": "=?"
      },
      link: ($scope: any, $element, $attr) => {

        function interpolate(template, path, key, value) {
          var interpolateFunc = $interpolate(template);
          if (!key) {
            return interpolateFunc({
              data: value,
              path: path
            });
          } else {
            return interpolateFunc({
              key: _.startCase(key),
              data: value,
              path: path
            });
          }
        }

        function getEntityConfig(path, config) {
          var answer = undefined;
          var properties = Core.pathGet(config, ['properties']);
          if (!answer && properties) {
            angular.forEach(properties, (config, propertySelector: string) => {
              var regex = new RegExp(propertySelector);
              if (regex.test(path)) {
                // log.debug("Matched selector: ", propertySelector, " for path: ", path);
                if (answer && !answer.override && !config.override) {
                  // log.debug("Merged config");
                  answer = _.merge(answer, config);
                } else {
                  // log.debug("Set config");
                  answer = _.cloneDeep(config);
                }
              }
            });
          }
          // log.debug("Answer for path: ", path, " : ", answer);
          return answer;
        }

        function getTemplate(path, config, def) {
          var answer = def;
          var config = getEntityConfig(path, config);
          if (config && config.template) {
            answer = config.template;
          }
          return answer;
        }

        function compile(template, path: string, key, value, config) {
          var config = getEntityConfig(path, config);
          if (config && config.hidden) {
            return;
          }
          var interpolated = null;
          // avoid interpolating custom templates
          if (config && config.template) {
            interpolated = config.template;
          } else {
            interpolated = interpolate(template, path, key, value);
          }
          var scope = $scope.$new();
          scope.row = $scope.row;
          scope.entityConfig = config;
          scope.data = value;
          scope.path = path;
          return $compile(interpolated)(scope);
        }

        function renderPrimitiveValue(path: string, entity, config) {
          var template = getTemplate(path, config, $templateCache.get('primitiveValueTemplate.html'));
          return compile(template, path, undefined, entity, config);
        }

        function renderDateValue(path: string, entity, config) {
          var template = getTemplate(path, config, $templateCache.get('dateValueTemplate.html'));
          return compile(template, path, undefined, entity, config);
        }

        function renderObjectValue(path: string, entity, config) {
          var isArray = false;
          var el = undefined;
          angular.forEach(entity, (value, key: string) => {
            if (angular.isNumber(key) && "length" in entity) {
              isArray = true;
            }
            if (isArray) {
              return;
            }
            if (_.startsWith(key, "$")) {
              return;
            }
            if (!el) {
              el = angular.element('<span></span>');
            }
            if (angular.isArray(value)) {
              el.append(renderArrayAttribute(path + '/' + key, key, value, config));
            } else if (angular.isObject(value)) {
              if (_.size(value) === 0) {
                el.append(renderPrimitiveAttribute(path + '/' + key, key, 'empty', config));
              } else {
                el.append(renderObjectAttribute(path + '/' + key, key, value, config));
              }
            } else if (StringHelpers.isDate(value)) {
              el.append(renderDateAttribute(path + '/' + key, key, new Date(value), config));
            } else {
              el.append(renderPrimitiveAttribute(path + '/' + key, key, value, config));
            }
          });
          if (el) {
            return el.children();
          } else {
            return el;
          }
        }

        function getColumnHeaders(path: string, entity: Array<any>, config) {
          var answer = <Array<string>>undefined;
          if (!entity) {
            return answer;
          }
          var hasPrimitive = false;
          entity.forEach((item) => {
            if (!hasPrimitive && angular.isObject(item)) {
              if (!answer) {
                answer = [];
              }
              var keys = _.keys(item);
              var notFunctions = _.filter(keys, (key) => !angular.isFunction(item[key]));
              var notHidden = _.filter(notFunctions, (key) => {
                var conf = getEntityConfig(path + '/' + key, config);
                if (conf && conf.hidden) {
                  return false;
                }
                return true;
              });
              return _.union(answer, notHidden);
            } else {
              answer = <Array<string>>undefined;
              hasPrimitive = true;
            }
          });
          if (answer) {
            answer = <Array<string>>_.reject(answer, (item) => _.startsWith("" + item, '$'));
          }
          //log.debug("Column headers: ", answer);
          return answer;
        }

        function renderTable(template, path: string, key, value, headers, config) {
          var el = angular.element(interpolate(template, path, key, value));
          var thead = el.find('thead');
          var tbody = el.find('tbody');

          var headerTemplate = $templateCache.get('headerTemplate.html');
          var cellTemplate = $templateCache.get('cellTemplate.html');
          var rowTemplate = $templateCache.get('rowTemplate.html');
          var headerRow = angular.element(interpolate(rowTemplate, path, undefined, undefined));

          headers.forEach((header) => {
            headerRow.append(interpolate(headerTemplate, path + '/' + header, header, undefined));
          });
          thead.append(headerRow);
          value.forEach((item, index) => {
            var tr = angular.element(interpolate(rowTemplate, path + '/' + index, undefined, undefined));
            headers.forEach((header) => {
              var td = angular.element(interpolate(cellTemplate, path + '/' + index + '/' + header, undefined, undefined));
              td.append(renderThing(path + '/' + index + '/' + header, item[header], config));
              tr.append(td);
            });
            tbody.append(tr);
          });
          return el;
        }

        function renderArrayValue(path: string, entity: any, config): any {
          var headers = getColumnHeaders(path, entity, config);
          if (!headers) {
            var template = getTemplate(path, config, $templateCache.get('arrayValueListTemplate.html'));
            return compile(template, path, undefined, entity, config);
          } else {
            var template = getTemplate(path, config, $templateCache.get('arrayValueTableTemplate.html'));
            return renderTable(template, path, undefined, entity, headers, config);
          }
        }

        function renderPrimitiveAttribute(path: string, key: string, value: any, config) {
          var template = getTemplate(path, config, $templateCache.get('primitiveAttributeTemplate.html'));
          return compile(template, path, key, value, config);
        }

        function renderDateAttribute(path: string, key: string, value: any, config) {
          var template = getTemplate(path, config, $templateCache.get('dateAttributeTemplate.html'));
          return compile(template, path, key, value, config);
        }

        function renderObjectAttribute(path: string, key: string, value: any, config) {
          var template = getTemplate(path, config, $templateCache.get('objectAttributeTemplate.html'));
          return compile(template, path, key, value, config);
        }

        function renderArrayAttribute(path: string, key: string, value: any, config): any {
          var headers = getColumnHeaders(path, value, config);
          if (!headers) {
            var template = getTemplate(path, config, $templateCache.get('arrayAttributeListTemplate.html'));
            return compile(template, path, key, value, config);
          } else {
            var template = getTemplate(path, config, $templateCache.get('arrayAttributeTableTemplate.html'));
            return renderTable(template, path, key, value, headers, config);
          }
        }

        function renderThing(path: string, entity, config) {
          if (angular.isArray(entity)) {
            return renderArrayValue(path, entity, config);
          } else if (angular.isObject(entity)) {
            return renderObjectValue(path, entity, config);
          } else if (StringHelpers.isDate(entity)) {
            return renderDateValue(path, (<any>Date).create(entity), config);
          } else {
            return renderPrimitiveValue(path, entity, config);
          }
        }

        $scope.$watch('entity', (entity) => {
          if (!entity) {
            $element.empty();
            return;
          }
          if (!$scope.path) {
            // log.debug("Setting entity: ", $scope.entity, " as the root element");
            $scope.path = "";
          }
          /*
          if (angular.isDefined($scope.$index)) {
            log.debug("$scope.$index: ", $scope.$index);
          }
          */
          if (!angular.isDefined($scope.row)) {
            // log.debug("Setting entity: ", entity);
            $scope.row = {
              entity: entity
            }
          }
          $element.html(renderThing($scope.path, entity, $scope.config));
        }, true);
      }
    };
  }]);

}
