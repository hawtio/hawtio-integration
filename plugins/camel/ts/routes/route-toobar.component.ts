/// <reference path="../includes.ts"/>
/// <reference path="routes.service.ts"/>
/// <reference path="route.ts"/>

namespace Camel {

  export class RouteToolbarController {

    private startAction = {
      name: 'Start',
      run: action => {
        this.routesService.startRoute(this.route)
          .then(response => {
            this.routesService.getRoute(this.route.mbean)
              .then(route => {
                this.route = route;
                this.actions[0] = this.stopAction;
                this.selected = null;
              });
          });
      }
    };
    private stopAction = {
      name: 'Stop',
      run: action => {
        this.routesService.stopRoute(this.route)
          .then(response => {
            this.routesService.getRoute(this.route.mbean)
              .then(route => {
                this.route = route;
                this.actions[0] = this.startAction;
                this.selected = null;
              });
          });
      }
    }
    private deleteAction = {
      name: 'Delete',
      run: action => {
        if (this.route.state === 'Started') {
          this.$uibModal.open({
            templateUrl: 'plugins/camel/html/deleteRouteErrorModal.html'
          })
          .result.then(() => {
            this.selected = null;
          });
        } else {
          this.$uibModal.open({
            templateUrl: 'plugins/camel/html/deleteRouteWarningModal.html'
          })
          .result
            .then(() => {
              this.routesService.removeRoute(this.route)
                .then(response => {
                  this.route = null;
                  this.workspace.loadTree();
                });
            })
            .catch(() => this.selected = null);
        }
      }
    };

    route: Route;
    selected = null;
    actions = [];

    constructor($rootScope, private $uibModal, private $timeout, private workspace: Jmx.Workspace,
        private routesService: RoutesService) {
      'ngInject';
      $rootScope.$on('jmxTreeClicked', (event, selectedNode) => {
        if (this.workspace.isRoute()) {
          this.routesService.getRoute(selectedNode.objectName)
            .then(route => {
              this.route = route;
              this.actions = [
                route.state === 'Started' ? this.stopAction : this.startAction,
                this.deleteAction
              ];
              this.selected = null;
            });
        } else {
          this.route = null;
        }
      });
    }

    isVisible() {
      return this.route !== null;
    }

    onSelect(action) {
      action.run();
    }

  }

  export const routeToolbarComponent = {
    template: `
      <pf-select selected="$ctrl.selected" options="$ctrl.actions" display-field="name"
        empty-value="{{$ctrl.route.state}}" on-select="$ctrl.onSelect" ng-show="$ctrl.isVisible()"
        class="camel-main-actions">
      </pf-select>
    `,
    controller: RouteToolbarController
  };

}
