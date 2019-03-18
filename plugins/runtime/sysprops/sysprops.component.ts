/// <reference path="sysprops.service.ts"/>
/// <reference path="sysprop.ts"/>

namespace Runtime {

  export class SystemPropertiesController {

    private toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'name',
            title: 'Name',
            placeholder: 'Filter by name...',
            filterType: 'text'
          },
          {
            id: 'value',
            title: 'Value',
            placeholder: 'Filter by value...',
            filterType: 'text'
          },
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        resultsCount: 0
      },
      isTableView: true
    };

    private tableConfig = {
      selectionMatchProp: 'name',
      showCheckboxes: false
    };

    private pageConfig = {
      pageSize: 20
    };

    private tableColumns = [
      {
        header: 'Property',
        itemField: 'name',
      },
      {
        header: 'Value',
        itemField: 'value',
      }
    ];

    private tableDtOptions = {
      order: [[0, "asc"]]
    };

    private sysprops: SystemProperty[] = [];

    private tableItems: SystemProperty[] = [];

    constructor(private systemPropertiesService: SystemPropertiesService) {
      'ngInject';
    }

    $onInit() {
      this.loadData();
    }

    private loadData(): void {
      this.systemPropertiesService.getSystemProperties()
        .then(sysprops =>  {
          this.sysprops = sysprops;
          this.tableItems = sysprops;
          this.toolbarConfig.filterConfig.resultsCount = sysprops.length;
        }).catch(error => Core.notification('danger', error));;
    }

    private applyFilters(filters: any[]) {
      let filteredSysProps = this.sysprops;

      filters.forEach(filter => {
        let regExp = new RegExp(filter.value, 'i');
        switch (filter.id) {
          case 'name':
            filteredSysProps = filteredSysProps.filter(sysprop => sysprop.name.match(regExp) !== null);
            break;
          case 'value':
            filteredSysProps = filteredSysProps.filter(sysprop => sysprop.value.match(regExp) !== null);
            break;
        }
      });

      this.tableItems = filteredSysProps;
      this.toolbarConfig.filterConfig.resultsCount = filteredSysProps.length;
    }
  }

  export const systemPropertiesComponent: angular.IComponentOptions = {
    template: `
      <div class="table-view runtime-sysprops-main">
        <h1>System Properties</h1>
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig"
                       columns="$ctrl.tableColumns"
                       items="$ctrl.tableItems"
                       page-config="$ctrl.pageConfig"
                       dt-options="$ctrl.tableDtOptions">
        </pf-table-view>
      </div>
    `,
    controller: SystemPropertiesController
  }
}
