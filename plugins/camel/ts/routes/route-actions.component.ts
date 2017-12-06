/// <reference path="routes.service.ts"/>
/// <reference path="route.ts"/>

namespace Camel {

  export class RouteActionsController {

    route: Route = null;

    constructor(private $scope, private $uibModal, private $timeout: ng.ITimeoutService,
      private workspace: Jmx.Workspace, private routesService: RoutesService) {
      'ngInject';
      $scope.$on('jmxTreeClicked', (event, selectedNode) => {
        if (workspace.isRoute()) {
          routesService.getRoute(selectedNode.objectName)
            .then(route => this.route = route);
        } else {
          this.route = null;
        }
      });
    }

    isVisible(): boolean {
      return this.route !== null;
    }

    start(): void {
      this.routesService.startRoute(this.route)
        .then(response => {
          this.routesService.getRoute(this.route.mbean)
            .then(route => this.route = route);
        });
    }

    stop(): void {
      this.routesService.stopRoute(this.route)
        .then(response => {
          this.routesService.getRoute(this.route.mbean)
            .then(route => this.route = route);
        });
    }

    delete(): void {
      this.$uibModal.open({
        templateUrl: 'plugins/camel/html/deleteRouteWarningModal.html'
      })
        .result.then(() => {
          this.routesService.removeRoute(this.route)
            .then(response => {
              this.route = null;
              this.workspace.loadTree();
            });
        });
    }
  }

  export const routeActionsComponent = <angular.IComponentOptions>{
    template: `
      <div class="dropdown camel-main-actions" ng-show="$ctrl.isVisible()"
        hawtio-show object-name-model="$ctrl.route.mbean" method-name="stop" mode="remove">
        <button type="button" id="dropdownMenu1" class="btn btn-default dropdown-toggle"
          data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          <span class="fa" ng-class="{'fa-play': $ctrl.route.isStarted(), 'fa-stop': $ctrl.route.isStopped()}"></span>
          &nbsp;
          {{$ctrl.route.state}}
          &nbsp;
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenu1">
          <li ng-class="{disabled: $ctrl.route.isStarted()}">
            <a href="#" ng-click="$ctrl.start()">Start</a>
          </li>
          <li ng-class="{disabled: $ctrl.route.isStopped()}">
            <a href="#" ng-click="$ctrl.stop()">Stop</a>
          </li>
          <li ng-class="{disabled: $ctrl.route.isStarted()}">
            <a href="#" ng-click="$ctrl.delete()">Delete</a>
          </li>
        </ul>
      </div>
    `,
    controller: RouteActionsController
  };

}
