/// <reference path="rest-service.ts"/>
/// <reference path="rest-services.service.ts"/>

namespace Camel {

  export class RestServicesController {
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
            id: 'method',
            title: 'Method',
            placeholder: 'Filter by method...',
            filterType: 'select',
            filterValues: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
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
            id: 'routeId',
            title: 'Route ID',
            placeholder: 'Filter by route ID...',
            filterType: 'text'
          }
        ],
        onFilterChange: () => {
          this.tableItems = Pf.filter(this.restServices, this.toolbarConfig.filterConfig);
        },
        resultsCount: 0
      },
      isTableView: true
    };
    tableConfig = {
      selectionMatchProp: "url",
      showCheckboxes: false
    };
    tableOptions = {
      order: [[1, "asc"], [2, "asc"]]
    };
    tableColumns = [
      { header: "URL", itemField: "url" },
      { header: "Method", itemField: "method" },
      { header: "Consumes", itemField: "consumes" },
      { header: "Produces", itemField: "produces" },
      { header: "Route ID", itemField: "routeId" }
    ];
    tableItems: RestService[];
    restServices: RestService[];

    constructor(private restServicesService: RestServicesService) {
      'ngInject';
    }

    $onInit() {
      this.restServicesService.getRestServices()
        .then(restServices => {
          this.restServices = restServices;
          this.tableItems = Pf.filter(this.restServices, this.toolbarConfig.filterConfig);
        });
    }
  }

  export const restServicesComponent: angular.IComponentOptions = {
    template: `
      <h2>REST Services</h2>
      <p ng-if="!$ctrl.tableItems">Loading...</p>
      <div ng-if="$ctrl.tableItems">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig" dt-options="$ctrl.tableOptions" columns="$ctrl.tableColumns"
                       items="$ctrl.tableItems"></pf-table-view>
      </div>
    `,
    controller: RestServicesController
  };

}
