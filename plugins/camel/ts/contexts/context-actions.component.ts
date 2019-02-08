/// <reference path="contexts.service.ts"/>
/// <reference path="context.ts"/>

namespace Camel {

  export class ContextActionsController {
    context: Context = null;
    unsubscribe;

    constructor(private $scope, private $uibModal, private workspace: Jmx.Workspace,
      private contextsService: ContextsService) {
      'ngInject';
    }

    $onInit() {
      this.unsubscribe = this.$scope.$on(Jmx.TreeEvent.NodeSelected, (event, selectedNode: Jmx.NodeSelection) => {
        if (selectedNode.typeName === 'context' && selectedNode.objectName) {
          this.contextsService.getContext(selectedNode.objectName)
            .then(context => this.context = context);
        } else {
          this.context = null;
        }
      });
    }

    $onDestroy() {
      this.unsubscribe();
    }

    start(): void {
      if (!this.context.isStarted()) {
        this.contextsService.startContext(this.context)
          .then(response => {
            Core.notification('success', 'Camel context started successfully');
            this.contextsService.getContext(this.context.mbeanName)
              .then(context => this.context = context);
          })
          .catch(error => {
            Core.notification('danger', error);
          });
      }
    }

    suspend(): void {
      if (!this.context.isSuspended()) {
        this.contextsService.suspendContext(this.context)
          .then(response => {
            Core.notification('success', 'Camel context suspended successfully');
            this.contextsService.getContext(this.context.mbeanName)
              .then(context => this.context = context);
          })
          .catch(error => {
            Core.notification('danger', error);
          });
      }
    }

    delete(): void {
      this.$uibModal.open({
        templateUrl: 'plugins/camel/html/deleteContextWarningModal.html'
      })
      .result.then(() => {
        this.contextsService.stopContext(this.context)
          .then(response => {
            Core.notification('success', 'Camel context deleted successfully');
            this.context = null;
            this.workspace.loadTree();
          });
      })
      .catch(error => {
        Core.notification('danger', error);
      });
    }
  }

  export const contextActionsComponent = <angular.IComponentOptions>{
    template: `
      <div class="dropdown camel-main-actions" ng-show="$ctrl.context"
        hawtio-show object-name-model="$ctrl.context.mbeanName" method-name="stop" mode="remove">
        <button type="button" id="dropdownMenu1" class="btn btn-default dropdown-toggle"
          data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          <span class="fa" ng-class="{'fa-play': $ctrl.context.isStarted(), 'fa-pause': $ctrl.context.isSuspended()}"></span>
          &nbsp;
          {{$ctrl.context.state}}
          &nbsp;
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenu1">
          <li ng-class="{disabled: $ctrl.context.isStarted()}">
            <a href="#" ng-click="$ctrl.start()">Start</a>
          </li>
          <li ng-class="{disabled: $ctrl.context.isSuspended()}">
            <a href="#" ng-click="$ctrl.suspend()">Suspend</a>
          </li>
          <li>
            <a href="#" ng-click="$ctrl.delete()">Delete</a>
          </li>
        </ul>
      </div>
    `,
    controller: ContextActionsController
  };

}
