/// <reference path="route.ts"/>
/// <reference path="routes.service.ts"/>

namespace Camel {

  export class RoutesController {

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.startRoutes(selectedRoutes)
          .then(response => this.updateRoutes());
      },
      isDisabled: true
    };
    private stopAction = {
      name: 'Stop',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.stopRoutes(selectedRoutes)
          .then(response => this.updateRoutes());
      },
      isDisabled: true
    };
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteRouteWarningModal.html'
        })
        .result.then(() => {
          this.routesService.removeRoutes(selectedRoutes)
            .then(response => this.removeSelectedRoutes());
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
      },
      isTableView: true
    };

    tableConfig = {
      selectionMatchProp: "name",
      onCheckBoxChange: item => this.enableDisableActions()
    };

    tableColumns = [
      { header: "Name", itemField: "name" },
      { header: "State", itemField: "state" }
    ];

    routes: Route[];

    constructor(private $uibModal, private workspace: Jmx.Workspace, private treeService: Jmx.TreeService,
      private routesService: RoutesService) {
      'ngInject';
    }

    $onInit() {
      this.loadRoutes();
    }

    private getSelectedRoutes() {
      return this.routes.filter(route => route.selected);
    }

    private enableDisableActions() {
      let selectedRoutes = this.getSelectedRoutes();
      this.startAction.isDisabled = !selectedRoutes.some((route: Route) => route.state === 'Stopped');
      this.stopAction.isDisabled = !selectedRoutes.some((route: Route) => route.state === 'Started');
      this.deleteAction.isDisabled = !selectedRoutes.every((route: Route) => route.state === 'Stopped');
    }

    private loadRoutes() {
      this.treeService.getSelectedMBean()
        .then(mbean => {
          if (mbean.children) {
            let children = mbean.children.filter(node => {return node.objectName != null})
            let mbeanNames = _.map(children, node => node.objectName);
            this.routesService.getRoutes(mbeanNames)
              .then(routes => this.routes = routes);
          }
        });
    }

    private updateRoutes() {
      let mbeans = _.map(this.routes, route => route.mbean);
      this.routesService.getRoutes(mbeans)
        .then(routes => {
          for (let i = 0; i < routes.length; i++) {
            if (this.routes[i].state !== routes[i].state) {
              this.routes[i] = angular.extend({}, this.routes[i], {state: routes[i].state});
            }
          }
          this.enableDisableActions();
        });
    }

    private removeSelectedRoutes() {
      _.remove(this.routes, route => route.selected);
      this.workspace.loadTree();
      this.enableDisableActions();
    }

  }

  export const routesComponent = <angular.IComponentOptions>{
    template: `
      <h2>Routes</h2>
      <p ng-if="!$ctrl.routes">Loading...</p>
      <div ng-if="$ctrl.routes">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig" columns="$ctrl.tableColumns" items="$ctrl.routes"></pf-table-view>
      </div>
    `,
    controller: RoutesController
  };

}
