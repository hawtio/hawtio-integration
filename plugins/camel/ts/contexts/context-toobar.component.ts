/// <reference path="../includes.ts"/>
/// <reference path="contexts.service.ts"/>
/// <reference path="context.ts"/>

namespace Camel {

  export interface Action {
    name: string,
    run: () => void
  }

  export class ContextToolbarController {

    private context: Context;
    private startAction: Action = {
      name: 'Start',
      run: () => {
        this.contextsService.startContext(this.context)
          .then(response => {
            this.contextsService.getContext(this.context.mbean)
              .then(context => {
                this.context = context;
                this.actions[0] = this.suspendAction;
                this.selected = null;
              });
          });
      }
    };
    private suspendAction: Action = {
      name: 'Suspend',
      run: () => {
        this.contextsService.suspendContext(this.context)
          .then(response => {
            this.contextsService.getContext(this.context.mbean)
              .then(context => {
                this.context = context;
                this.actions[0] = this.startAction;
                this.selected = null;
              });
          });
      }
    };
    private deleteAction: Action = {
      name: 'Delete',
      run: () => {
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteContextModal.html'
        })
        .result.then(() => {
          this.contextsService.stopContext(this.context)
            .then(response => this.workspace.removeAndSelectParentNode());
        });
      }
    };

    selected = null;

    actions: Action[];

    constructor($rootScope, private $uibModal, private $timeout, private workspace: Jmx.Workspace,
        private contextsService: ContextsService) {
      'ngInject';
      $rootScope.$on('jmxTreeClicked', (event, selectedNode) => {
        if (this.workspace.isCamelContext()) {
          this.contextsService.getContext(selectedNode.objectName)
            .then(context => {
              this.context = context;
              this.actions = [
                context.state === 'Started' ? this.suspendAction : this.startAction,
                this.deleteAction
              ];
            });
        } else {
          this.context = null;
        }
      });
    }

    isVisible() {
      return this.context !== null;
    }

    onActionSelection(action) {
      action.run();
    }

  }

  export const contextToolbarComponent = {
    template: `
      <pf-select selected="$ctrl.selected" options="$ctrl.actions" display-field="name"
        empty-value="{{$ctrl.context.state}}" on-select="$ctrl.onActionSelection" ng-show="$ctrl.isVisible()"
        class="camel-main-actions">
      </pf-select>
    `,
    controller: ContextToolbarController
  };

}
