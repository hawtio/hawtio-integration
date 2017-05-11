/// <reference path="../includes.ts"/>
/// <reference path="routes.service.ts"/>
/// <reference path="route.ts"/>

namespace Camel {

  export class RouteToolbarController {

    private route: Route;

    private startAction = {
      name: 'Start',
      actionFn: action => {
        this.routesService.startRoute(this.route)
          .then(response => this.updateRoute());
      },
      isDisabled: true
    };
    private stopAction = {
      name: 'Stop',
      actionFn: action => {
        this.routesService.stopRoute(this.route)
          .then(response => this.updateRoute());
      },
      isDisabled: true
    }
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteRouteModal.html'
        })
        .result.then(() => {
          this.routesService.removeRoute(this.route)
            .then(response => {
              this.workspace.loadTree();
            });
        });
      },
      isDisabled: true
    };

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

    constructor($rootScope, private $uibModal, private $timeout, private workspace: Jmx.Workspace,
        private routesService: RoutesService) {
      'ngInject';
      $rootScope.$on('jmxTreeClicked', (event, selectedNode) => {
        if (this.workspace.isRoute()) {
          this.routesService.getRoute(selectedNode.objectName)
            .then(route => {
              this.route = route;
              this.enableDisableActions();
            });
        } else {
          this.route = null;
        }
      });
    }

    isVisible() {
      return this.route !== null;
    }

    private enableDisableActions() {
      this.startAction.isDisabled = this.route.state !== 'Stopped';
      this.stopAction.isDisabled = this.route.state !== 'Started';
      this.deleteAction.isDisabled = this.route.state !== 'Stopped';
    }

    private updateRoute() {
      this.routesService.getRoute(this.route.mbean)
        .then(route => {
          this.route = route;
          this.enableDisableActions();
        });
    }

  }

  export const routeToolbarComponent = {
    template: `
      <pf-toolbar class="pf-toolbar-unstyled" config="$ctrl.toolbarConfig" ng-show="$ctrl.isVisible()"></pf-toolbar>
    `,
    controller: RouteToolbarController
  };

}
