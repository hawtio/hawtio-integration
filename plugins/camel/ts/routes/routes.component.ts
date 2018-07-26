/// <reference path="route.ts"/>
/// <reference path="routes.service.ts"/>

namespace Camel {

  export class RoutesController {

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.startRoutes(selectedRoutes)
          .then(response => {
            Core.notification('success', `Started ${Core.maybePlural(selectedRoutes.length, 'route')} successfully`);
            this.updateRoutes()
          })
          .catch(error => {
            Core.notification('danger', error);
            this.updateRoutes();
          });
      },
      isDisabled: true
    };
    private stopAction = {
      name: 'Stop',
      actionFn: action => {
        let selectedRoutes = this.getSelectedRoutes();
        this.routesService.stopRoutes(selectedRoutes)
        .then(response => {
          Core.notification('success', `Stopped ${Core.maybePlural(selectedRoutes.length, 'route')} successfully`);
          this.updateRoutes()
        })
        .catch(error => {
          Core.notification('danger', error);
          this.updateRoutes();
        });
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
          .then(response => {
            Core.notification('success', `Deleted ${Core.maybePlural(selectedRoutes.length, 'route')} successfully`);
            this.removeSelectedRoutes()
          })
          .catch(error => {
            Core.notification('danger', error);
            this.updateRoutes();
          });
        });
      },
      isDisabled: true
    }

    toolbarConfig = null;

    tableConfig = {
      selectionMatchProp: "name",
      onCheckBoxChange: item => this.enableDisableActions()
    };

    tableColumns = [
      { header: "Name", itemField: "name" },
      { header: "State", itemField: "state" }
    ];

    routes: Route[];
    showTable = true;

    constructor(private $timeout: ng.ITimeoutService, private $uibModal, private workspace: Jmx.Workspace,
      private treeService: Jmx.TreeService, private routesService: RoutesService) {
      'ngInject';
    }

    $onInit() {
      this.loadRoutes()
        .then(() => this.configureToolbar());
    }

    private configureToolbar(): void {
      const primaryActions = [];
      const moreActions = [];
      if (this.routesService.canStartRoutes(this.routes)) {
        primaryActions.push(this.startAction);
      }
      if (this.routesService.canStopRoutes(this.routes)) {
        primaryActions.push(this.stopAction);
      }
      if (this.routesService.canDeleteRoutes(this.routes)) {
        moreActions.push(this.deleteAction);
      }
      log.debug("RBAC - Rendered routes actions:", primaryActions.concat(moreActions));
      if (primaryActions.length > 0 || moreActions.length > 0) {
        this.toolbarConfig = {
          actionsConfig: {
            primaryActions: primaryActions,
            moreActions: moreActions
          },
          isTableView: true
        };
      }
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

    private loadRoutes(): ng.IPromise<Route[]> {
      return this.treeService.getSelectedMBean()
        .then(mbean => {
          if (mbean.children) {
            let children = mbean.children.filter(node => {return node.objectName != null})
            let mbeanNames = _.map(children, node => node.objectName);
            return this.routesService.getRoutes(mbeanNames)
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
          this.repaintTable();
        });
    }

    private removeSelectedRoutes() {
      _.remove(this.routes, route => route.selected);
      this.workspace.loadTree();
      this.enableDisableActions();
    }

    // This is a hack to keep the 'select all' checkbox working after starting/stopping routes
    private repaintTable() {
      this.showTable = false;
      this.$timeout(() => this.showTable = true);
    }
  }

  export const routesComponent: angular.IComponentOptions = {
    template: `
      <h2>Routes</h2>
      <p ng-if="!$ctrl.routes">Loading...</p>
      <div ng-if="$ctrl.routes">
        <div ng-if="$ctrl.toolbarConfig">
          <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        </div>
        <div ng-if="$ctrl.showTable">
          <pf-table-view config="$ctrl.tableConfig" columns="$ctrl.tableColumns" items="$ctrl.routes"></pf-table-view>
        </div>
      </div>
    `,
    controller: RoutesController
  };

}
