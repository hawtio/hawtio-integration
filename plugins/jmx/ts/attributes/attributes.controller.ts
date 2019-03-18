namespace Jmx {

  const PROPERTIES_COLUMN_DEFS = [
    {
      field: 'name',
      displayName: 'Attribute',
      cellTemplate: `
        <div class="ngCellText" title="{{row.entity.attrDesc}}" data-placement="bottom">
          <a href="" ng-click="row.entity.onViewAttribute()">{{row.entity.name}}</a>
        </div>
      `
    },
    {
      field: 'value',
      displayName: 'Value',
      cellTemplate: `
        <div class="ngCellText mouse-pointer"
             ng-click="row.entity.onViewAttribute()"
             title="{{row.entity.tooltip}}"
             ng-bind-html="row.entity.summary"></div>
      `
    }
  ];

  const FOLDERS_COLUMN_DEFS = [
    {
      displayName: 'Name',
      cellTemplate: `
        <div class="ngCellText">
          <a href="" ng-click="row.entity.gotoFolder(row)">
            <i class="{{row.entity.folderIconClass(row)}}"></i> {{row.getProperty("title")}}
          </a>
        </div>
      `
    }
  ];

  export function AttributesController(
    $scope,
    $location: ng.ILocationService,
    workspace: Workspace,
    $templateCache: ng.ITemplateCacheService,
    localStorage: Storage,
    $uibModal: angular.ui.bootstrap.IModalService,
    attributesService: AttributesService) {
    'ngInject';

    let gridData = [];

    $scope.searchText = '';
    $scope.nid = 'empty';
    $scope.selectedItems = [];
    $scope.lastKey = null;
    $scope.attributesInfoCache = null;
    $scope.entity = {};
    $scope.attributeSchema = {};
    $scope.gridData = [];
    $scope.attributes = "";

    $scope.$watch('gridData.length', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if (newValue > 0) {
          $scope.attributes = $templateCache.get('gridTemplate');
        } else {
          $scope.attributes = "";
        }
      }
    });

    const ATTRIBUTE_SCHEMA_BASIC = {
      properties: {
        'key': {
          type: 'string',
          readOnly: 'true'
        },
        'description': {
          description: 'Description',
          type: 'string',
          formTemplate: "<textarea class='form-control' rows='2' readonly='true'></textarea>"
        },
        'type': {
          type: 'string',
          readOnly: 'true'
        },
        'jolokia': {
          label: 'Jolokia&nbsp;URL',
          type: 'string',
          formTemplate: `
            <div class="hawtio-clipboard-container">
              <button hawtio-clipboard="#attribute-jolokia-url" class="btn btn-default">
                <i class="fa fa-clipboard" aria-hidden="true"></i>
              </button>
              <input type="text" id="attribute-jolokia-url" class='form-control' style="padding-right: 26px" value="{{entity.jolokia}}" readonly='true'>
            </div>
          `
        }
      }
    };

    $scope.gridOptions = {
      scope: $scope,
      selectedItems: [],
      showFilter: false,
      canSelectRows: false,
      enableRowSelection: false,
      enableRowClickSelection: false,
      keepLastSelected: false,
      multiSelect: false,
      showColumnMenu: true,
      displaySelectionCheckbox: false,
      filterOptions: {
        filterText: ''
      },
      data: 'gridData',
      columnDefs: PROPERTIES_COLUMN_DEFS
    };

    $scope.$watch(
      (scope) => scope.gridOptions.selectedItems.map((item) => item.key || item),
      (newValue, oldValue) => {
        if (newValue !== oldValue) {
          log.debug("Selected items:", newValue);
          $scope.selectedItems = newValue;
        }
      },
      true);

    // clear selection if we clicked the jmx nav bar button
    // otherwise we may show data from Camel/ActiveMQ or other plugins that
    // reuse the JMX plugin for showing tables (#884)
    let currentUrl = $location.url();
    if (_.endsWith(currentUrl, "/jmx/attributes")) {
      log.debug("Reset selection in JMX plugin");
      workspace.selection = null;
      $scope.lastKey = null;
    }
    $scope.nid = $location.search()['nid'];
    log.debug("attribute - nid: ", $scope.nid);

    let updateTable = _.debounce(updateTableContents, 50, { leading: false, trailing: true });

    $scope.$on(TreeEvent.Updated, updateTable);

    updateTable();

    function onViewAttribute(
      row: { summary: string, key: string, attrDesc: string, type: string, rw: boolean }): void {
      if (!row.summary) {
        return;
      }
      if (row.rw) {
        // for writable attribute, we need to check RBAC
        attributesService.canInvoke(workspace.getSelectedMBeanName(), row.key, row.type)
          .then((canInvoke) => showAttributeDialog(row, canInvoke));
      } else {
        showAttributeDialog(row, false);
      }
    }

    function showAttributeDialog(
      row: { summary: string, key: string, attrDesc: string, type: string },
      rw: boolean): void {
      // create entity and populate it with data from the selected row
      $scope.entity = {
        key: row.key,
        description: row.attrDesc,
        type: row.type,
        jolokia: attributesService.buildJolokiaUrl(workspace.getSelectedMBeanName(), row.key),
        rw: rw
      };

      let rows = numberOfRows(row);
      let readOnly = !$scope.entity.rw;
      if (readOnly) {
        // if the value is empty its a &nbsp; as we need this for the table to allow us to click on the empty row
        if (row.summary === '&nbsp;') {
          $scope.entity["attrValueView"] = '';
        } else {
          $scope.entity["attrValueView"] = row.summary;
        }
        initAttributeSchemaView($scope, rows);
      } else {
        // if the value is empty its a &nbsp; as we need this for the table to allow us to click on the empty row
        if (row.summary === '&nbsp;') {
          $scope.entity["attrValueEdit"] = '';
        } else {
          $scope.entity["attrValueEdit"] = row.summary;
        }
        initAttributeSchemaEdit($scope, rows);
      }

      $uibModal.open({
        templateUrl: 'attributeModal.html',
        scope: $scope,
        size: 'lg'
      })
      .result.then(() => {
        // update the attribute on the mbean
        let mbean = workspace.getSelectedMBeanName();
        if (mbean) {
          let value = $scope.entity["attrValueEdit"];
          let key = $scope.entity["key"];
          attributesService.update(mbean, key, value);
        }
        $scope.entity = {};
      })
      .catch(() => {
        $scope.entity = {};
      });
    }

    function numberOfRows(row: { summary: string }): number {
      // calculate a textare with X number of rows that usually fit the value to display
      let len = row.summary.length;
      let rows = (len / 40) + 1;
      if (rows > 10) {
        // cap at most 10 rows to not make the dialog too large
        rows = 10;
      }
      return rows;
    }

    function initAttributeSchemaView($scope, rows: number): void {
      // clone from the basic schema to the new schema we create on-the-fly
      // this is needed as the dialog have problems if reusing the schema, and changing the schema afterwards
      // so its safer to create a new schema according to our needs
      $scope.attributeSchemaView = {};
      for (let key in ATTRIBUTE_SCHEMA_BASIC) {
        $scope.attributeSchemaView[key] = ATTRIBUTE_SCHEMA_BASIC[key];
      }
      // and add the new attrValue which is dynamic computed
      $scope.attributeSchemaView.properties.attrValueView = {
        description: 'Value',
        label: "Value",
        type: 'string',
        formTemplate: `<textarea id="attribute-value" class='form-control' style="overflow-y: scroll" rows='${rows}' readonly='true'></textarea>
        `
      };
      // just to be safe, then delete not needed part of the schema
      if ($scope.attributeSchemaView) {
        delete $scope.attributeSchemaView.properties.attrValueEdit;
      }
    }

    function initAttributeSchemaEdit($scope, rows: number): void {
      // clone from the basic schema to the new schema we create on-the-fly
      // this is needed as the dialog have problems if reusing the schema, and changing the schema afterwards
      // so its safer to create a new schema according to our needs
      $scope.attributeSchemaEdit = {};
      for (let key in ATTRIBUTE_SCHEMA_BASIC) {
        $scope.attributeSchemaEdit[key] = ATTRIBUTE_SCHEMA_BASIC[key];
      }
      // and add the new attrValue which is dynamic computed
      $scope.attributeSchemaEdit.properties.attrValueEdit = {
        description: 'Value',
        label: "Value",
        type: 'string',
        formTemplate: `<textarea id="attribute-value" class='form-control' style="overflow-y: scroll" rows='${rows}'></textarea>`
      };
      // just to be safe, then delete not needed part of the schema
      if ($scope.attributeSchemaEdit) {
        delete $scope.attributeSchemaEdit.properties.attrValueView;
      }
    }

    function updateTableContents(): void {
      let mbean = workspace.getSelectedMBeanName();
      if (mbean && $scope.attributesInfoCache === null) {
        attributesService.listMBean(mbean, Core.onSuccess((response) => {
          $scope.attributesInfoCache = response.value;
          log.debug("Updated attributes info cache for mbean", mbean, $scope.attributesInfoCache);
          updateScope();
        }));
      } else {
        updateScope();
      }
    }

    function updateScope(): void {
      // lets clear any previous queries just in case!
      attributesService.unregisterJolokia($scope);

      $scope.gridData = [];
      $scope.mbeanIndex = null;
      let mbean = workspace.getSelectedMBeanName();
      let node = workspace.selection;
      let request = null;
      if (mbean) {
        request = { type: 'read', mbean: mbean };
        if (_.isNil(node) || node.key !== $scope.lastKey) {
          $scope.gridOptions.columnDefs = PROPERTIES_COLUMN_DEFS;
        }
      } else if (node) {
        if (node.key !== $scope.lastKey) {
          $scope.gridOptions.columnDefs = [];
        }
        // lets query each child's details
        let children = node.children;
        if (children) {
          let childNodes = children.map((child) => child.objectName);
          let mbeans = childNodes.filter((mbean) => FilterHelpers.search(mbean, $scope.gridOptions.filterOptions.filterText));
          let maxFolderSize = localStorage["jmxMaxFolderSize"];
          mbeans = mbeans.slice(0, maxFolderSize);
          if (mbeans) {
            let typeNames = Jmx.getUniqueTypeNames(children);
            if (typeNames.length <= 1) {
              let query = mbeans.map((mbean) => {
                return { type: "READ", mbean: mbean, ignoreErrors: true };
              });
              if (query.length > 0) {
                request = query;

                // deal with multiple results
                $scope.mbeanIndex = {};
                $scope.mbeanRowCounter = 0;
                $scope.mbeanCount = mbeans.length;
              }
            } else {
              log.debug("Too many type names ", typeNames);
            }
          }
        }
      }
      if (request) {
        $scope.request = request;
        attributesService.registerJolokia($scope, request, Core.onSuccess(render));
      } else if (node) {
        if (node.key !== $scope.lastKey) {
          $scope.gridOptions.columnDefs = FOLDERS_COLUMN_DEFS;
        }
        $scope.gridData = node.children;
        addHandlerFunctions($scope.gridData);
      }
      if (node) {
        $scope.lastKey = node.key;
        $scope.title = node.text;
      }
      Core.$apply($scope);
    }

    function render(response: { request: any, value: any }): void {
      let data = response.value;
      let mbeanIndex = $scope.mbeanIndex;
      let mbean = response.request['mbean'];

      if (mbean) {
        // lets store the mbean in the row for later
        data["_id"] = mbean;
      }
      if (mbeanIndex) {
        if (mbean) {

          let idx = mbeanIndex[mbean];
          if (!angular.isDefined(idx)) {
            idx = $scope.mbeanRowCounter;
            mbeanIndex[mbean] = idx;
            $scope.mbeanRowCounter += 1;
          }
          if (idx === 0) {
            // this is to force the table to repaint
            $scope.selectedIndices = $scope.selectedItems.map((item) => $scope.gridData.indexOf(item));
            gridData = [];

            if (!$scope.gridOptions.columnDefs.length) {
              // lets update the column definitions based on any configured defaults

              let key = workspace.selectionConfigKey();
              $scope.gridOptions.gridKey = key;
              $scope.gridOptions.onClickRowHandlers = workspace.onClickRowHandlers;
              let defaultDefs = _.clone(workspace.attributeColumnDefs[key]) || [];
              let defaultSize = defaultDefs.length;
              let map = {};
              angular.forEach(defaultDefs, (value, key) => {
                let field = value.field;
                if (field) {
                  map[field] = value
                }
              });

              let extraDefs = [];
              _.forEach(data, (value, key) => {
                if (includePropertyValue(key, value)) {
                  if (!map[key]) {
                    extraDefs.push({
                      field: key,
                      displayName: key === '_id' ? 'Object name' : Core.humanizeValue(key),
                      visible: defaultSize === 0
                    });
                  }
                }
              });

              // the additional columns (which are not pre-configured), should be sorted
              // so the column menu has a nice sorted list instead of random ordering
              extraDefs = extraDefs.sort((def, def2) => {
                // make sure _id is last
                if (_.startsWith(def.field, '_')) {
                  return 1;
                } else if (_.startsWith(def2.field, '_')) {
                  return -1;
                }
                return def.field.localeCompare(def2.field);
              });
              extraDefs.forEach(e => defaultDefs.push(e));

              if (extraDefs.length > 0) {
                $scope.hasExtraColumns = true;
              }

              $scope.gridOptions.columnDefs = defaultDefs;
            }
          }
          // mask attribute read error
          _.forEach(data, (value, key) => {
            if (includePropertyValue(key, value)) {
              data[key] = maskReadError(value);
            }
          });
          // assume 1 row of data per mbean
          gridData[idx] = data;
          addHandlerFunctions(gridData);

          let count = $scope.mbeanCount;
          if (!count || idx + 1 >= count) {
            // only cause a refresh on the last row
            let newSelections = $scope.selectedIndices.map((idx) => $scope.gridData[idx]).filter((row) => row);
            $scope.selectedItems.splice(0, $scope.selectedItems.length);
            $scope.selectedItems.push.apply($scope.selectedItems, newSelections);
            $scope.gridData = gridData;
            Core.$apply($scope);
          }
          // if the last row, then fire an event
        } else {
          log.info("No mbean name in request", JSON.stringify(response.request));
        }
      } else {
        $scope.gridOptions.columnDefs = PROPERTIES_COLUMN_DEFS;
        $scope.gridOptions.enableRowClickSelection = false;
        let showAllAttributes = true;
        if (_.isObject(data)) {
          let properties = [];
          _.forEach(data, (value, key) => {
            if (showAllAttributes || includePropertyValue(key, value)) {
              // always skip keys which start with _
              if (!_.startsWith(key, "_")) {
                // lets format the ObjectName nicely dealing with objects with
                // nested object names or arrays of object names
                if (key === "ObjectName") {
                  value = unwrapObjectName(value);
                }
                // lets unwrap any arrays of object names
                if (_.isArray(value)) {
                  value = value.map((v) => unwrapObjectName(v));
                }
                // the value must be string as the sorting/filtering of the table relies on that
                let type = lookupAttributeType(key);
                let data = {
                  key: key,
                  name: Core.humanizeValue(key),
                  value: maskReadError(Core.safeNullAsString(value, type))
                };

                generateSummaryAndDetail(key, data);
                properties.push(data);
              }
            }
          });
          if (!_.some(properties, (p) => {
            return p['key'] === 'ObjectName';
          })) {
            let objectName = {
              key: "ObjectName",
              name: "Object Name",
              value: mbean
            };
            generateSummaryAndDetail(objectName.key, objectName);
            properties.push(objectName);
          }
          properties = _.sortBy(properties, 'name');
          $scope.selectedItems = [data];
          data = properties;
        }
        $scope.gridData = data;
        addHandlerFunctions($scope.gridData);
        Core.$apply($scope);
      }
    }

    function maskReadError(value: any): any {
      if (typeof value !== 'string') {
        return value;
      }
      let forbidden = /^ERROR: Reading attribute .+ \(class java\.lang\.SecurityException\)$/;
      let unsupported = /^ERROR: java\.lang\.UnsupportedOperationException: .+ \(class javax\.management\.RuntimeMBeanException\)$/;
      if (value.match(forbidden)) {
        return "**********";
      } else if (value.match(unsupported)) {
        return "(Not supported)";
      } else {
        return value;
      }
    }

    function addHandlerFunctions(data: any[]): void {
      if (!data) {
        return;
      }
      data.forEach((item) => {
        item['onViewAttribute'] = () => onViewAttribute(item);
        item['folderIconClass'] = (row) => folderIconClass(row);
        item['gotoFolder'] = (row) => gotoFolder(row);
      });
    }

    function folderIconClass(row: any): string {
      if (!row.getProperty) {
        return '';
      }
      if (!row.getProperty('objectName')) {
        return 'pficon pficon-folder-close';
      }
      let mbean = row.getProperty('mbean');
      return _.isNil(mbean) || _.isNil(mbean.canInvoke) || mbean.canInvoke ? 'fa fa-cog' : 'fa fa-lock';
    }

    function gotoFolder(row: any): void {
      if (row.getProperty) {
        let key = row.getProperty('key');
        if (key) {
          $location.search('nid', key);
        }
      }
    }

    function unwrapObjectName(value: any): any {
      if (!_.isObject(value)) {
        return value;
      }
      let keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === "objectName") {
        return value["objectName"];
      }
      return value;
    }

    function generateSummaryAndDetail(key, data): void {
      let value = Core.escapeHtml(data.value);
      if (!angular.isArray(value) && angular.isObject(value)) {
        let detailHtml = "<table class='table table-striped'>";
        let summary = "";
        let object = value;
        let keys = Object.keys(value).sort();
        angular.forEach(keys, (key) => {
          let value = object[key];
          detailHtml += `<tr><td>${Core.humanizeValue(key)}</td><td>${value}</td></tr>`;
          summary += `${Core.humanizeValue(key)}: ${value}  `;
        });
        detailHtml += "</table>";
        data.summary = summary;
        data.detailHtml = detailHtml;
        data.tooltip = summary;
      } else {
        let text = value;
        // if the text is empty then use a no-break-space so the table allows us to click on the row,
        // otherwise if the text is empty, then you cannot click on the row
        if (text === '') {
          text = '&nbsp;';
          data.tooltip = "";
        } else {
          data.tooltip = text;
        }
        data.summary = `${text}`;
        data.detailHtml = `<pre>${text}</pre>`;
        if (angular.isArray(value)) {
          let html = "<ul>";
          angular.forEach(value, (item) => html += `<li>${item}</li>`);
          html += "</ul>";
          data.detailHtml = html;
        }
      }

      // enrich the data with information if the attribute is read-only/read-write, and the JMX attribute description (if any)
      data.rw = false;
      data.attrDesc = data.name;
      data.type = "string";
      if ($scope.attributesInfoCache != null && 'attr' in $scope.attributesInfoCache) {
        let info = $scope.attributesInfoCache.attr[key];
        if (angular.isDefined(info)) {
          data.rw = info.rw;
          data.attrDesc = info.desc;
          data.type = info.type;
        }
      }
    }

    function lookupAttributeType(key: string): string {
      if ($scope.attributesInfoCache != null && 'attr' in $scope.attributesInfoCache) {
        let info = $scope.attributesInfoCache.attr[key];
        if (angular.isDefined(info)) {
          return info.type;
        }
      }
      return null;
    }

    function includePropertyValue(key: string, value: any): boolean {
      return !_.isObject(value);
    }

  }

}
