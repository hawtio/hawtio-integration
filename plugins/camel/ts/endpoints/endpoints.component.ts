/// <reference path="endpoint.ts"/>
/// <reference path="endpoints.service.ts"/>

namespace Camel {

  export class EndpointsController {

    private addAction = {
    name: 'Add',
      actionFn: action => {
        this.$location.path('/camel/createEndpoint');
      },
      isDisabled: true
    };
    
    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          this.addAction
        ]
      },
      isTableView: true
    };

    tableConfig = {
      selectionMatchProp: 'uri',
      showCheckboxes: false
    };
    
    tableDtOptions = {
      order: [[0, "asc"]],
    };

    tableColumns = [
      { header: 'URI', itemField: 'uri' },
      { header: 'State', itemField: 'state' }
    ];
    
    endpoints: Endpoint[];

    constructor(private $location: ng.ILocationService, private endpointsService: EndpointsService) {
      'ngInject';
    }

    $onInit() {
      this.endpointsService.getEndpoints()
        .then(endpoints => this.endpoints = endpoints);
      this.addAction.isDisabled = !this.endpointsService.canCreateEndpoints();
    }

  }

  export const endpointsComponent: angular.IComponentOptions = {
    template: `
      <h2>Endpoints</h2>
      <p ng-if="!$ctrl.endpoints">Loading...</p>
      <div ng-if="$ctrl.endpoints">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig"
                       dt-options="$ctrl.tableDtOptions"
                       columns="$ctrl.tableColumns"
                       items="$ctrl.endpoints"></pf-table-view>
      </div>
    `,
    controller: EndpointsController
  };

}
