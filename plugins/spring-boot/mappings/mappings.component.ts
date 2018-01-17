/// <reference path="mappings.service.ts"/>

namespace SpringBoot {

  export class MappingsController {

    private static FILTER_FUNCTIONS = {
      method: (mappings, method) => {
        let regExp = new RegExp(method, 'i');
        return mappings.filter(mapping => regExp.test(mapping.methods));
      },
      path: (mappings, path) => {
        let regExp = new RegExp(path, 'i');
        return mappings.filter(mapping => regExp.test(mapping.paths));
      },
      consumes: (mappings, consumes) => {
        let regExp = new RegExp(consumes, 'i');
        return mappings.filter(mapping => regExp.test(mapping.consumes));
      },
      produces: (mappings, produces) => {
        let regExp = new RegExp(produces, 'i');
        return mappings.filter(mapping => regExp.test(mapping.produces));
      },
      beanMethod: (mappings, beanMethod) => {
        let regExp = new RegExp(beanMethod, 'i');
        return mappings.filter(mapping => regExp.test(mapping.getClassMethod()));
      }
    };

    private toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'method',
            title: 'HTTP Method',
            placeholder: 'Filter by HTTP method...',
            filterType: 'select',
            filterValues: ['*', 'GET', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE']
          },
          {
            id: 'path',
            title: 'Path',
            placeholder: 'Filter by path...',
            filterType: 'text'
          },
          {
            id: 'consumes',
            title: 'Consumes',
            placeholder: 'Filter by consumes...',
            filterType: 'text'
          },
          {
            id: 'produces',
            title: 'Produces',
            placeholder: 'Filter by produces...',
            filterType: 'text'
          },
          {
            id: 'beanMethod',
            title: 'Bean Method',
            placeholder: 'Filter by bean method...',
            filterType: 'text'
          },
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        appliedFilters: [],
        resultsCount: 0
      },
      isTableView: true
    };


    private tableConfig = {
      selectionMatchProp: 'beanMethod',
      showCheckboxes: false
    };

    private tableColumns = [
      { header: 'HTTP Method', itemField: 'methods', templateFn: values => this.renderByLine(values) },
      { header: 'Paths', itemField: 'paths', templateFn: values => this.renderByLine(values) },
      { header: 'Produces', itemField: 'produces', templateFn: values => this.renderByLine(values) },
      { header: 'Consumes', itemField: 'consumes', templateFn: values => this.renderByLine(values) },
      { header: 'Bean Method', itemField: 'beanMethod', templateFn: (value, item) => `${item.getClassMethod()}` }
    ];

    loading = true;

    mappings = [];

    tableItems = [];

    constructor(private mappingsService: MappingsService) {
      'ngInject';
    }

    $onInit() {
      this.loadMappings();
    }

    loadMappings(): void {
      this.mappingsService.getMappings().then((mappings) => {
        this.mappings = mappings;
        this.tableItems = mappings;
        this.toolbarConfig.filterConfig.resultsCount = mappings.length;
        this.loading = false;
      });
    }

    applyFilters(filters: any[]) {
      let filteredMappings = this.mappings;
      filters.forEach(filter => {
        let sanitizedFilter = filter.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        filteredMappings = MappingsController.FILTER_FUNCTIONS[filter.id](filteredMappings, sanitizedFilter);
      });
      this.tableItems = filteredMappings;
      this.toolbarConfig.filterConfig.resultsCount = filteredMappings.length;
    }

    private renderByLine(values: string) {
      if (values) {
        return `${values.split(",").join("<br/>")}`
      }
      return "";
    }
  }

  export const mappingsComponent: angular.IComponentOptions = {
    template:`
      <div class="table-view">
        <h1>Mappings</h1>
        <p ng-if="$ctrl.loading">Loading...</p>
        <div ng-if="!$ctrl.loading">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig"
                       columns="$ctrl.tableColumns"
                       items="$ctrl.tableItems">
          </pf-table-view>
        </div>
      </div>
    `,
    controller: MappingsController
  }

}
