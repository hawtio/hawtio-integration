/// <reference path="forms2Plugin.ts"/>
/// <reference path="forms2Interfaces.ts"/>

namespace HawtioForms {
  var directiveName = "hawtioForms2Map";

  _module.directive(directiveName, ['$compile', '$templateCache', '$interpolate', 'SchemaRegistry', 'ControlMappingRegistry', '$uibModal', ($compile:ng.ICompileService, $templateCache:ng.ITemplateCacheService, $interpolate:ng.IInterpolateService, schemas:SchemaRegistry, mappings:ControlMappingRegistry, $uibModal) => {

    function clearBody(context, table) {
      var body = table.find('tbody');
      body.empty();
      return body;
    }

    function findSchema(name: string, type:string, control):any {
      var answer = <any> {
        properties: {},
        control: control
      };
      if ('items' in control) {
        answer.properties[name] = {
          noLabel: true,
          type: type,
          items: {
            type: control.items.type
          }
        };
      } else if (mappings.hasMapping(type)) {
        answer.properties[name] = {
          noLabel: true,
          type: mappings.getMapping(type)
        };
      } else {
        answer = schemas.getSchema(type);
      }
      if (angular.isObject(answer)) {
        answer.control = control;
      }
      return answer;
    }


    function buildMap(context, entity, keySchema, valueSchema, body) {
      var s = context.s;
      s.keys = {}
      s.values = {};
      _.forIn(entity, (value, key) => {
        s.keys[key] = {
          key: key
        };
        if (valueSchema.control.items || mappings.hasMapping(valueSchema.control.type)) {
          s.values[key] = {
            value: value
          };
        } else {
          s.values[key] = value;
        }
        var template = <any>context.$templateCache.get('mapRowTemplate.html');
        var func = $interpolate(template);
        template = func({
          key: key
        });
        body.append(template);
      });
    }

    return {
      restrict: 'A',
      replace: true,
      templateUrl: UrlHelpers.join(templatePath, 'forms2Map.html'),
      scope: {
        config: '=' + directiveName,
        entity: '=?'
      },
      link: (scope: HawtioFormScope, element, attrs) => {
        scope.$watch('config', (newConfig: FormConfiguration) => {
          var context = {
            postInterpolateActions: {},
            maybeHumanize: undefined,
            config: undefined,
            s: undefined,
            element: element,
            attrs: attrs,
            mappings: mappings,
            schemas: schemas,
            $templateCache: $templateCache,
            $interpolate: $interpolate,
            $compile: $compile,
            directiveName: directiveName
          };
          var config = <any> initConfig(context, _.cloneDeep(<FormConfiguration>newConfig), false);
          context.config = config;
          context.maybeHumanize = createMaybeHumanize(context);
          if (!scope.entity) {
            scope.entity = {};
          }
          if (!config || !config.items) {
            log.debug("Invalid map config, no 'items' configured");
            return;
          }
          if (!config.items.key) {
            log.debug("Invalid map config, no 'key' attribute configured in 'items'");
              return;
          }
          if (!config.items.value) {
            log.debug("Invalid map config, no 'value' attribute configured in 'items'");
            return;
          }
          var entity = scope.entity;
          // log.debug("In map, config: ", config, " entity: ", entity);
          var s = <HawtioFormScope>scope.$new();
          context.s = s;
          var keySchema = findSchema('key', config.items.key.type, config.items.key);
          var valueSchema = findSchema('value', config.items.value.type, config.items.value);

          var table = angular.element($templateCache.get('table.html'));
          var body = table.find('tbody');

          s.config = config;
          s.entity = entity;
          s.keySchema = _.cloneDeep(keySchema);
          s.valueSchema = _.cloneDeep(valueSchema);
          if (s.keySchema) {
            s.keySchema.mode = FormMode.VIEW;
            s.keySchema.style =  FormStyle.UNWRAPPED;
            s.keySchema.hideLegend = true;
          }
          if (s.valueSchema) {
            s.valueSchema.mode = FormMode.VIEW;
            s.valueSchema.style = FormStyle.UNWRAPPED;
            s.valueSchema.hideLegend = true;
          }

          function initSchema(schema) {
            var answer = _.cloneDeep(schema);
            answer.style = FormStyle.STANDARD;
            _.forIn(answer.properties, (value, key) => {
              if ('noLabel' in value) {
                delete value['noLabel'];
              } 
            });
            log.debug("Schema: ", schema);
            return answer;
          }

          s.editRow = (key:string) => {
            log.debug("Edit row: ", key);
          }

          s.deleteRow = (key:string) => {
            log.debug("Delete row: ", key);
          }

          s.createRow = () => {
            log.debug("create row");
            $uibModal.open({
              templateUrl: "mapItemModal.html",
              controller: ['$scope', '$uibModalInstance', ($scope, $uibModalInstance) => {
                $scope.header = "Create Entry";
                $scope.description = "<p>Add a new entry to the map by filling in the details for the key and value</p>";
                $scope.keySchema = initSchema(keySchema);
                $scope.valueSchema = initSchema(valueSchema);
                $scope.ok = () => {
                  $uibModalInstance.close();
                  var key = $scope.newKeyEntity.key;
                  var value = $scope.newValueEntity;
                  if (valueSchema.control.items || mappings.hasMapping(valueSchema.control.type)) {
                    value = $scope.newValueEntity.value;
                  }
                  log.debug("New key: ", key);
                  log.debug("New value: ", value);
                  entity[key] = value;
                }
                $scope.cancel = () => {
                  $uibModalInstance.dismiss();
                }
              }]
            });
          }

          s.$watch('entity', (entity, old) => {
            scope.entity = entity;
            var body = clearBody(context, table);
            var tmp = angular.element('<div></div>');
            buildMap(context, entity, keySchema, valueSchema, tmp);
            body.append($compile(tmp.children())(s));
          }, true);

          element.append($compile(table)(s));
        });

      }
    };
  }]);
} 
