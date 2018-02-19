/// <reference path="../../../pf-utils.ts"/>
/// <reference path="endpoints-statistics.service.ts"/>

namespace Camel {

  export class EndpointsStatisticsController {

    allItems: any[];
    filteredItems: any[];

    toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'url',
            title: 'URL',
            placeholder: 'Filter by URL...',
            filterType: 'text'
          },
          {
            id: 'routeId',
            title: 'Route ID',
            placeholder: 'Filter by route ID...',
            filterType: 'text'
          },
          {
            id: 'direction',
            title: 'Direction',
            placeholder: 'Filter by direction...',
            filterType: 'text'
          }
        ],
        onFilterChange: (filters: any[]) => {
          this.filteredItems = Pf.filter(this.allItems, this.toolbarConfig.filterConfig);
        },
        appliedFilters: [],
        resultsCount: 0
      },
      isTableView: true
    };

    tableConfig = {
      selectionMatchProp: 'url',
      showCheckboxes: false
    };
    
    tableDtOptions = {
      order: [[0, "asc"]],
    };

    tableColumns = [
      { itemField: 'url', header: 'URL' },
      { itemField: 'routeId', header: 'Route ID' },
      { itemField: 'direction', header: 'Direction' },
      { itemField: 'static', header: 'Static' },
      { itemField: 'dynamic', header: 'Dynamic' },
      { itemField: 'hits', header: 'Hits' }
    ];
    
    constructor(private endpointsStatisticsService: EndpointsStatisticsService) {
      'ngInject';
    }

    $onInit() {
      this.endpointsStatisticsService.getStatistics()
        .then(items => {
          this.allItems = items;
          this.filteredItems = items;
          this.toolbarConfig.filterConfig.resultsCount = items.length;
        });
    }

  }

  export const endpointsStatisticsComponent: angular.IComponentOptions = {
    template: `
      <h2>Endpoints (in/out)</h2>
      <p ng-if="!$ctrl.filteredItems">Loading...</p>
      <div ng-if="$ctrl.filteredItems">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig"
                       dt-options="$ctrl.tableDtOptions"
                       columns="$ctrl.tableColumns"
                       items="$ctrl.filteredItems"></pf-table-view>
      </div>
    `,
    controller: EndpointsStatisticsController
  };  

}
