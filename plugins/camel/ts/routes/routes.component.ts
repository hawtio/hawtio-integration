/// <reference path="route.ts"/>
/// <reference path="routes.service.ts"/>

namespace Camel {

  export class RoutesController {

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.startRoutes(selectedRoutes)
          .then(response => this.updateRoutes())
          .catch(error => console.error(error));
      },
      isDisabled: true
    };
    private stopAction = {
      name: 'Stop',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.stopRoutes(selectedRoutes)
          .then(response => this.updateRoutes())
          .catch(error => console.error(error));
      },
      isDisabled: true
    };
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteRouteModal.html'
        })
        .result.then(() => {
          this.routesService.removeRoutes(selectedRoutes)
            .then(response => this.removeSelectedRoutes())
            .catch(error => console.error(error));
        });
      },
      isDisabled: true
    }
  
    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          this.startAction,
          this.stopAction
        ],
        moreActions: [
          this.deleteAction
        ]
      }
    };

    tableConfig = {
      selectionMatchProp: "name",
      onCheckBoxChange: item => this.enableDisableActions()
    };

    tableColummns = [
      { header: "Name", itemField: "name" },
      { header: "State", itemField: "state" }
    ];

    tableItems = [{ name: null, state: null }];
    
    routes: Route[];

    constructor(private $uibModal, private workspace: Jmx.Workspace, private routesService: RoutesService) {
      'ngInject';
    }

    $onInit() {
      this.loadRoutes();
    }

    private getSelectedRoutes() {
      return _.map(this.tableItems, (tableItem, i) => angular.extend(this.routes[i], { selected: tableItem['selected'] }))
        .filter(route => route.selected);
    }

    private enableDisableActions() {
      let selectedRoutes = this.getSelectedRoutes();
      this.startAction.isDisabled = !selectedRoutes.some((route: Route) => route.state === 'Stopped');
      this.stopAction.isDisabled = !selectedRoutes.some((route: Route) => route.state === 'Started');
      this.deleteAction.isDisabled = !selectedRoutes.every((route: Route) => route.state === 'Stopped');
    }

    private loadRoutes() {
      if (this.workspace.selection) {
        var typeNames = Jmx.getUniqueTypeNames(this.workspace.selection.children);
        if (typeNames.length > 1) {
          console.error("Child nodes aren't of the same type. Found types: " + typeNames);
        }
        let mbeans = _.map(this.workspace.selection.children, node => node.objectName);
        this.routesService.getRoutes(mbeans)
          .then(routes => {
            this.tableItems = _.map(routes, route => ({
              name: route.name,
              state: route.state
            }));
            this.routes = routes;
          })
          .catch(error => console.error(error));
      }
    }

    private updateRoutes() {
      let mbeans = _.map(this.routes, route => route.mbean);
      this.routesService.getRoutes(mbeans)
        .then(routes => {
          this.routes = routes;
          routes.forEach((route, i) => this.tableItems[i].state = route.state);
          this.enableDisableActions();
        })
        .catch(error => console.error(error));
    }

    private removeSelectedRoutes() {
      this.tableItems.forEach((tableItem, i) => angular.extend(this.routes[i], { selected: tableItem['selected'] }));
      _.remove(this.routes, route => route.selected);
      _.remove(this.tableItems, tableItem => tableItem['selected']);
      this.workspace.loadTree();
      this.enableDisableActions();
    }

  }

  export const routesComponent = <angular.IComponentOptions>{
    template: `
      <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
      <pf-table-view config="$ctrl.tableConfig" colummns="$ctrl.tableColummns" items="$ctrl.tableItems"></pf-table-view>
    `,
    controller: RoutesController
  };

}
