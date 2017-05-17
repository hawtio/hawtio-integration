/// <reference path="../includes.ts"/>
/// <reference path="contexts.service.ts"/>
/// <reference path="context.ts"/>

namespace Camel {

  export class ContextToolbarController {

    private startAction = {
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
    private suspendAction = {
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
    private deleteAction = {
      name: 'Delete',
      run: () => {
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteContextWarningModal.html'
        })
        .result
          .then(() => {
            this.contextsService.stopContext(this.context)
              .then(response => {
                this.context = null;
                this.workspace.removeAndSelectParentNode();
              });
          })
          .catch(() => this.selected = null);
      }
    };

    context: Context;
    selected = null;
    actions = [];

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

    onSelect(action) {
      action.run();
    }

  }

  export const contextToolbarComponent = {
    template: `
      <pf-select selected="$ctrl.selected" options="$ctrl.actions" display-field="name"
        empty-value="{{$ctrl.context.state}}" on-select="$ctrl.onSelect" ng-show="$ctrl.isVisible()"
        class="camel-main-actions">
      </pf-select>
    `,
    controller: ContextToolbarController
  };

}
