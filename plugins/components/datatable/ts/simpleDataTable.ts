/// <reference path="datatablePlugin.ts"/>
/**
 * @module DataTable
 */
namespace DataTable {

  _module.directive('hawtioSimpleTable', ["$compile", "$timeout", ($compile, $timeout) => {
    return {
      restrict: 'A',
      scope: {
        config: '=hawtioSimpleTable'
      },
      link: ($scope: any, $element, $attrs) => {

        $element.addClass('hawtio-simple-table');

        var defaultPrimaryKeyFn = (entity) => {
          // default function to use id/_id/_key/name as primary key, and fallback to use all property values
          var primaryKey = entity["id"] || entity["_id"] || entity["_key"] || entity["name"];
          if (primaryKey === undefined) {
            throw new Error("Missing primary key. Please add a property called 'id', '_id', '_key', or 'name' " +
              "to your entities. Alternatively, set the 'primaryKeyFn' configuration option.");
          }
          return primaryKey;
        };

        var config = $scope.config;

        var dataName = config.data || "data";
        // need to remember which rows has been selected as the config.data / config.selectedItems
        // so we can re-select them when data is changed/updated, and entity may be new instances
        // so we need a primary key function to generate a 'primary key' of the entity
        var primaryKeyFn = config.primaryKeyFn || defaultPrimaryKeyFn;
        $scope.rows = [];

        var scope = $scope.$parent || $scope;

        var listener = () => {
          var value = Core.pathGet(scope, dataName);
          if (value && !angular.isArray(value)) {
            value = [value];
            Core.pathSet(scope, dataName, value);
          }

          if (!('sortInfo' in config) && 'columnDefs' in config) {
            // an optional defaultSort can be used to indicate a column
            // should not automatic be the default sort
            var ds = _.first(config.columnDefs)['defaultSort'];
            var sortField;
            if (angular.isUndefined(ds) || ds === true) {
              sortField = _.first(config.columnDefs)['field'];
            } else {
              sortField = _.first(config.columnDefs.slice(1))['field']
            }
            config['sortInfo'] = {
              sortBy: sortField,
              ascending: isFieldSortedAscendingByDefault(sortField, config)
            };
          }

          // any custom sort function on the field?
          var customSort:any = _.find(config.columnDefs, (e) => {
            if (e['field'] === config['sortInfo'].sortBy) {
              return e;
            }
          });
          // the columnDefs may have a custom sort function in the key named customSortField
          if (angular.isDefined(customSort)) {
            customSort = customSort['customSortField']
          }

          // sort data
          var sortInfo = $scope.config.sortInfo || { sortBy: '', ascending: true };
          var sortAsString = value.filter(v => !Core.isBlank(v[sortInfo.sortBy]) && !angular.isNumber(v[sortInfo.sortBy])).length > 0;
          var sortedData = _.sortBy(value || [], customSort || ((item) => {
            if (sortAsString === true) {
              return ((item[sortInfo.sortBy] || '') + '').toLowerCase();
            } else {
              return item[sortInfo.sortBy];
            }
          }));

          if (!sortInfo.ascending) {
            sortedData.reverse();
          }

          // enrich the rows with information about their index
          var idx = -1;
          var rows = _.map(sortedData, (entity) => {
            idx++;
            return {
              entity: entity,
              index: idx,
              getProperty: (name) => {
                return entity[name];
              }
            };
          });

          // okay the data was changed/updated so we need to re-select previously selected items
          // and for that we need to evaluate the primary key function so we can match new data with old data.
          var reSelectedItems = [];
          rows.forEach((row:any, idx:number) => {
            var rpk = primaryKeyFn(row.entity);
            var selected = _.some(config.selectedItems, (s:any) => {
              var spk = primaryKeyFn(s);
              return angular.equals(rpk, spk);
            });
            if (selected) {
              // need to enrich entity with index, as we push row.entity to the re-selected items
              row.entity.index = row.index;
              reSelectedItems.push(row.entity);
              row.selected = true;
              log.debug("Data changed so keep selecting row at index " + row.index);
            }
          });
          config.selectedItems.length = 0;
          config.selectedItems.push(...reSelectedItems);

          Core.pathSet(scope, ['hawtioSimpleTable', dataName, 'rows'], rows);
          $scope.rows = rows;
        };

        scope.$watchCollection(dataName, listener);

        // lets add a separate event so we can force updates
        // if we find cases where the delta logic doesn't work
        // (such as for nested hawtioinput-input-table)
        scope.$on("hawtio.datatable." + dataName, listener);

        function getSelectionArray() {
          var selectionArray = config.selectedItems;
          if (!selectionArray) {
            selectionArray = [];
            config.selectedItems = selectionArray;
          }
          if (angular.isString(selectionArray)) {
            var name = selectionArray;
            selectionArray =  Core.pathGet(scope, name);
            if (!selectionArray) {
              selectionArray = [];
              scope[name] = selectionArray;
            }
          }
          return selectionArray;
        }

        function isMultiSelect() {
          var multiSelect = $scope.config.multiSelect;
          if (angular.isUndefined(multiSelect)) {
            multiSelect = true;
          }
          return multiSelect;
        }

        $scope.toggleAllSelections = () => {
          var allRowsSelected = $scope.config.allRowsSelected;
          var newFlag = allRowsSelected;
          var selectionArray = getSelectionArray();
          selectionArray.splice(0, selectionArray.length);
          angular.forEach($scope.rows, (row) => {
            row.selected = newFlag;
            if (allRowsSelected && $scope.showRow(row)) {
              selectionArray.push(row.entity);
            }
          });
        };

        $scope.toggleRowSelection = (row) => {
          if (row) {
            var selectionArray = getSelectionArray();
            if (!isMultiSelect()) {
              // lets clear all other selections
              selectionArray.splice(0, selectionArray.length);
              angular.forEach($scope.rows, (r) => {
                if (r !== row) {
                  r.selected = false;
                }
              });
            }
            var entity = row.entity;
            if (entity) {
              var idx = selectionArray.indexOf(entity);
              if (row.selected) {
                if (idx < 0) {
                  selectionArray.push(entity);
                }
              } else {
                // clear the all selected checkbox
                $scope.config.allRowsSelected = false;
                if (idx >= 0) {
                  selectionArray.splice(idx, 1);
                }
              }
            }
          }
        };

        $scope.sortBy = (field) => {
          if ($scope.config.sortInfo.sortBy === field) {
            $scope.config.sortInfo.ascending = !$scope.config.sortInfo.ascending;
          } else {
            $scope.config.sortInfo.sortBy = field;
            $scope.config.sortInfo.ascending = isFieldSortedAscendingByDefault(field, $scope.config);
          }
          scope.$broadcast("hawtio.datatable." + dataName);
        };

        $scope.getClass = (field) => {
          if ('sortInfo' in $scope.config) {
            if ($scope.config.sortInfo.sortBy === field) {
              if ($scope.config.sortInfo.ascending) {
                return 'sorting_asc';
              } else {
                return 'sorting_desc';
              }
            }
          }

          return '';
        };

        $scope.showRow = (row) => {
          var filter = Core.pathGet($scope, ['config', 'filterOptions', 'filterText']);
          if (Core.isBlank(filter)) {
            return true;
          }

          var data = null;

          // it may be a node selection (eg JMX plugin with Folder tree structure) then use the title
          try {
              data = row['entity']['title'];
          } catch (e) {
            // ignore
          }

          if (!data) {
            // use the row as-is
            data = row.entity;
          }

          var match = FilterHelpers.search(data, filter);
          return match;
        };

        $scope.isSelected = (row) => {
          return row && _.some(config.selectedItems, row.entity);
        };

        $scope.onRowClicked = (row) => {
          var id = $scope.config.gridKey;
          if (id) {
            var func = $scope.config.onClickRowHandlers[id];
            if (func) {
              func(row);
            }
          }
        };

        $scope.onRowSelected = (row) => {
          var idx = config.selectedItems.indexOf(row.entity);
          if (idx >= 0) {
            log.debug("De-selecting row at index " + row.index);
            config.selectedItems.splice(idx, 1);
            delete row.selected;
          } else {
            if (!config.multiSelect) {
              config.selectedItems.length = 0;
            }
            log.debug("Selecting row at index " + row.index);
            // need to enrich entity with index, as we push row.entity to the selected items
            row.entity.index = row.index;
            config.selectedItems.push(row.entity);
            if (!angular.isDefined(row.selected) || !row.selected) {
              row.selected = true;
            }
          }
        };

        $scope.$watchCollection('rows', () => {
          // lets add the header and row cells
          var rootElement = $element;
          rootElement.empty();
          rootElement.addClass('dataTable');

          var showCheckBox = firstValueDefined(config, ["showSelectionCheckbox", "displaySelectionCheckbox"], true);
          var enableRowClickSelection = firstValueDefined(config, ["enableRowClickSelection"], false);
          var scrollable = config.maxBodyHeight !== undefined;

          var headHtml = buildHeadHtml(config.columnDefs, showCheckBox, isMultiSelect(), scrollable);
          var bodyHtml = buildBodyHtml(config.columnDefs, showCheckBox, enableRowClickSelection);

          if (scrollable) {
            var head = $compile(headHtml)($scope);
            var body = $compile(bodyHtml)($scope);
            buildScrollableTable(rootElement, head, body, $timeout, config.maxBodyHeight);
          } else {
            var html = headHtml + bodyHtml;
            var newContent = $compile(html)($scope);
            rootElement.html(newContent);
          }
        });

      }
    };
  }]);

  /**
   * Returns the first property value defined in the given object or the default value if none are defined
   *
   * @param object the object to look for properties
   * @param names the array of property names to look for
   * @param defaultValue the value if no property values are defined
   * @return {*} the first defined property value or the defaultValue if none are defined
   */
  function firstValueDefined(object, names, defaultValue) {
    var answer = defaultValue;
    var found = false;
    angular.forEach(names, (name) => {
      var value = object[name];
      if (!found && angular.isDefined(value)) {
        answer = value;
        found = true;
      }
    });
    return answer;
  }

  /**
   * Returns true if the field's default sorting is ascending
   *
   * @param field the name of the field
   * @param config the config object, which contains the columnDefs values
   * @return true if the field's default sorting is ascending, false otherwise
   */
  function isFieldSortedAscendingByDefault(field, config) {
    if (config.columnDefs) {
      for (let columnDef of config.columnDefs) {
        if (columnDef.field === field && columnDef.ascending !== undefined) {
          return columnDef.ascending;
        }
      }
    }
    return true;
  }

  /**
   * Builds the thead HTML.
   *
   * @param columnDefs column definitions
   * @param showCheckBox add extra column for checkboxes
   * @param multiSelect show "select all" checkbox
   * @param scrollable table with fixed height and scrollbar
   */
  function buildHeadHtml(columnDefs, showCheckBox, multiSelect, scrollable) {
    var headHtml = "<thead><tr>";

    if (showCheckBox) {
      headHtml += "\n<th class='simple-table-checkbox'>";
      if (multiSelect) {
        headHtml += "<input type='checkbox' ng-show='rows.length' ng-model='config.allRowsSelected' " +
          "ng-change='toggleAllSelections()'>";
      }
      headHtml += "</th>";
    }

    for (var i = 0, len = columnDefs.length; i < len; i++) {
      let columnDef = columnDefs[i];
      let sortingArgs = '';
      if (columnDef.sortable === undefined || columnDef.sortable) {
        sortingArgs = "class='sorting' ng-click=\"sortBy('" + columnDef.field + "')\" ";
      }
      headHtml += "\n<th " + sortingArgs +
        " ng-class=\"getClass('" + columnDef.field + "')\">{{config.columnDefs[" + i +
        "].displayName}}</th>";
    }

    if (scrollable) {
      headHtml += "\n<th></th>";
    }

    headHtml += "\n</tr></thead>\n";

    return headHtml;
  }

  /**
   * Builds the tbody HTML.
   *
   * @param columnDefs column definitions
   * @param showCheckBox show selection checkboxes
   * @param enableRowClickSelection enable row click selection
   */
  function buildBodyHtml(columnDefs, showCheckBox, enableRowClickSelection) {
    // use a function to check if a row is selected so the UI can be kept up to date asap
    var bodyHtml = "<tbody><tr ng-repeat='row in rows track by $index' ng-show='showRow(row)' " +
      "ng-class=\"{'active': isSelected(row)}\" >";

    if (showCheckBox) {
      bodyHtml += "\n<td class='simple-table-checkbox'><input type='checkbox' ng-model='row.selected' " +
        "ng-change='toggleRowSelection(row)'></td>";
    }

    var onMouseDown = enableRowClickSelection ? "ng-click='onRowSelected(row)' " : "";

    for (var i = 0, len = columnDefs.length; i < len; i++) {
      var columnDef = columnDefs[i];
      var cellTemplate = columnDef.cellTemplate || '<div class="ngCellText" title="{{row.entity.' +
        columnDef.field + '}}">{{row.entity.' + columnDef.field + '}}</div>';
      bodyHtml += "\n<td + " + onMouseDown + ">" + cellTemplate + "</td>";
    }

    bodyHtml += "\n</tr></tbody>";

    return bodyHtml;
  }

  /**
   * Transform original table into a scrollable table.
   *
   * @param $table jQuery object referencing the DOM table element
   * @param head thead HTML
   * @param body tbody HTML
   * @param $timeout Angular's $timeout service
   * @param maxBodyHeight maximum tbody height
   */
  function buildScrollableTable($table, head, body, $timeout, maxBodyHeight) {
    $table.html(body);
    $table.addClass('scroll-body-table');

    if ($table.parent().hasClass('scroll-body-table-wrapper')) {
      $table.parent().scrollTop(0);
    } else {
      var $headerTable = $table.clone();
      $headerTable.html(head);
      $headerTable.removeClass('scroll-body-table');
      $headerTable.addClass('scroll-header-table');

      $table.wrap('<div class="scroll-body-table-wrapper"></div>');
      var $bodyTableWrapper = $table.parent();
      $bodyTableWrapper.css('max-height', maxBodyHeight);

      $bodyTableWrapper.wrap('<div></div>');
      var $tableWrapper = $bodyTableWrapper.parent();
      $tableWrapper.addClass('table');
      $tableWrapper.addClass('table-bordered');

      var scrollBarWidth = $bodyTableWrapper.width() - $table.width();
      $headerTable.find('th:last-child').width(scrollBarWidth);
      $headerTable.insertBefore($bodyTableWrapper);

      $timeout(function () {
        $(window).resize(function () {
          // Get the tbody columns width array
          var colWidths = $table.find('tr:first-child td').map(function () {
            return $(this).width();
          }).get();

          // Set the width of thead columns
          $headerTable.find('th').each(function (i, th) {
            $(th).width(colWidths[i]);
          });

          // Set the width of tbody columns
          $table.find('tr').each(function (i, tr) {
            $(tr).find('td').each(function (j, td) {
              $(td).width(colWidths[j]);
            });
          });
        }).resize(); // Trigger resize handler
      });
    }
  }

}

