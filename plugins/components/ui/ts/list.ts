/**
 * @module UI
 */
/// <reference path="./uiPlugin.ts"/>
namespace UI {

  export function hawtioList($templateCache, $compile) {
    return {
      restrict: '',
      replace: true,
      templateUrl: UI.templatePath + 'list.html',
      scope: {
        'config': '=hawtioList'
      },
      link: ($scope, $element, $attr) => {

        $scope.rows = [];
        $scope.name = "hawtioListScope";

        if (!$scope.config.selectedItems) {
          $scope.config.selectedItems = [];
        }

        $scope.$watch('rows', (newValue, oldValue) => {
          if (newValue !== oldValue) {
            $scope.config.selectedItems.length = 0;
            var selected = _.filter($scope.rows, (row:any) => row.selected);
            selected.forEach((row:any) => {
              $scope.config.selectedItems.push(row.entity);
            });
          }
        }, true);

        $scope.cellTemplate = $templateCache.get('cellTemplate.html');
        $scope.rowTemplate = $templateCache.get('rowTemplate.html');

        var columnDefs = $scope.config['columnDefs'];
        var fieldName = 'name';
        var displayName = 'Name';
        if (columnDefs && columnDefs.length > 0) {
          var def = _.first(columnDefs);
          fieldName = def['field'] || fieldName;
          displayName = def['displayName'] || displayName;
          if (def['cellTemplate']) {
            $scope.cellTemplate = def['cellTemplate'];
          }
        }

        var configName = $attr['hawtioList'];
        var dataName = $scope.config['data'];

        if (Core.isBlank(configName) || Core.isBlank(dataName)) {
          return;
        }

        $scope.listRoot = () => {
          return $element.find('.hawtio-list-root');
        };

        $scope.getContents = (row) => {
          //first make our row
          var innerScope = <any>$scope.$new();
          innerScope.row = row;
          var rowEl = $compile($scope.rowTemplate)(innerScope);


          //now compile the cell but use the parent scope
          var innerParentScope = <any>$scope.parentScope.$new();
          innerParentScope.row = row;
          innerParentScope.col = {
            field: fieldName
          };
          var cellEl = $compile($scope.cellTemplate)(innerParentScope);
          $(rowEl).find('.hawtio-list-row-contents').append(cellEl);
          return rowEl;
        };


        $scope.setRows = (data) => {
          $scope.rows = [];
          var list = $scope.listRoot();
          list.empty();
          if (data) {
            data.forEach((row) => {
              var newRow = {
                entity: row,
                getProperty: (name:string) => {
                  if (!angular.isDefined(name)) {
                    return null;
                  }
                  return row[name];
                }
              };
              list.append($scope.getContents(newRow));
              $scope.rows.push(newRow);
            });
          }
        };

        // find the parent scope that has our configuration
        var parentScope = findParentWith($scope, configName);
        if (parentScope) {
          $scope.parentScope = parentScope;
          parentScope.$watch(dataName, $scope.setRows, true)
        }
      }
    };
  }

  _module.directive('hawtioList', ["$templateCache", "$compile", UI.hawtioList]);

}
