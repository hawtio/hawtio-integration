/// <reference path="formPlugin.ts"/>
/// <reference path="formInterfaces.ts"/>
namespace Forms {

  interface FormGridScope extends ng.IScope {
    configuration: Forms.FormGridConfiguration;
    removeThing: (index:number) => void;
    addThing: () => void;
    getHeading: () => String;
  }

  var formGrid = _module.directive("hawtioFormGrid", ['$templateCache', '$interpolate', '$compile', ($templateCache:ng.ITemplateCacheService, $interpolate:ng.IInterpolateService, $compile:ng.ICompileService) => {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        configuration: '=hawtioFormGrid'
      },
      templateUrl: Forms.templateUrl + 'formGrid.html',
      link: (scope:FormGridScope, element:ng.IAugmentedJQuery, attrs:ng.IAttributes) => {

        function createColumns() {
          return <Array<FormGridElement>> [];
        }

        function createColumnSequence() {
          var columns = createColumns();
          if (angular.isDefined(scope.configuration.rowSchema.columnOrder)) {
            var order = scope.configuration.rowSchema.columnOrder;
            order.forEach((column) => {
              var property = Core.pathGet(scope.configuration.rowSchema.properties, [column]);
              Core.pathSet(property, ['key'], column);
              columns.push(property);
            });
          }
          angular.forEach(scope.configuration.rowSchema.properties, (property, key) => {
            if (!columns.some((c:FormGridElement) => { return c.key === key })) {
              property.key = key;
              columns.push(property);
            }

          });
          //log.debug("Created columns: ", columns);
          return columns;
        }

        function newHeaderRow() {
          var header = element.find('thead');
          header.empty();
          return header.append($templateCache.get<string>('rowTemplate.html')).find('tr');
        }

        function buildTableHeader(columns:Array<FormGridElement>) {
          var headerRow = newHeaderRow();
          // Build the table header
          columns.forEach((property) => {
            //log.debug("Adding heading for : ", property);
            var headingName = property.label || property.key;
            if (!scope.configuration.rowSchema.disableHumanizeLabel) {
              headingName = _.startCase(headingName);
            }
            var headerTemplate = property.headerTemplate || $templateCache.get<string>('headerCellTemplate.html');
            var interpolateFunc = $interpolate(headerTemplate);
            headerRow.append(interpolateFunc({label: headingName}));
          });
          headerRow.append($templateCache.get<string>("emptyHeaderCellTemplate.html"));
        }

        function clearBody() {
          var body = element.find('tbody');
          body.empty();
          return body;
        }

        function newBodyRow() {
          return angular.element($templateCache.get<string>('rowTemplate.html'));
        }

        function buildTableBody(columns:Array<FormGridElement>, parent:JQuery) {
          var rows = scope.configuration.rows;
          rows.forEach((row, index) => {
            var tr = newBodyRow();
            columns.forEach((property:FormGridElement) => {
              var type = Forms.mapType(property.type);
              if (type === "number" && "input-attributes" in property) {
                var template = property.template || $templateCache.get<string>('cellNumberTemplate.html');
                var interpolateFunc = $interpolate(template);

                var conf = {
                  row: 'configuration.rows[' + index + ']',
                  type: type,
                  key: property.key,
                  min: Core.pathGet(property, ['input-attributes', 'min']),
                  max: Core.pathGet(property, ['input-attributes', 'max'])
                };
                tr.append(interpolateFunc(conf));
              } else {
                var template = property.template || $templateCache.get<string>('cellTemplate.html');
                var interpolateFunc = $interpolate(template);
                tr.append(interpolateFunc({
                  row: 'configuration.rows[' + index + ']',
                  type: type,
                  key: property.key
                }));
              }
            });
            var func = $interpolate($templateCache.get<string>("deleteRowTemplate.html"));
            tr.append(func({
              index: index
            }));
            parent.append(tr);
          });
        }

        scope.removeThing = (index:number) => {
          scope.configuration.rows.slice(index, index + 1);
        };

        scope.addThing = () => {
          scope.configuration.rows.push(scope.configuration.onAdd());
        };

        scope.getHeading = ():String => {
          if (Core.isBlank(<string>scope.configuration.rowName)) {
            return 'Items';
          }
          // TODO
          return _.startCase(scope.configuration.rowName + 's');
        };

        scope.$watch('configuration.noDataTemplate', (newValue, oldValue) => {
          var noDataTemplate = scope.configuration.noDataTemplate || $templateCache.get<string>('heroUnitTemplate.html');
          element.find('.nodata').html(<any>$compile(noDataTemplate)(scope));
        });

        scope.$watch('configuration.rowSchema', (newValue, oldValue) => {
          if (newValue !== oldValue) {
            var columns = createColumnSequence();
            buildTableHeader(columns);
          }
        }, true);

        scope.$watchCollection('configuration.rows', (newValue, oldValue) => {
          if (newValue !== oldValue) {
            var body = clearBody();
            var columns = createColumnSequence();
            // append all the rows to a temporary element so we can $compile in one go
            var tmp = angular.element('<div></div>');
            buildTableBody(columns, tmp);
            body.append($compile(tmp.children())(scope));
          }
        });

      }
    }
  }]);

}
