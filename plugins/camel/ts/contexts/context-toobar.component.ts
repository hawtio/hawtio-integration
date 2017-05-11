/// <reference path="contexts.service.ts"/>
/// <reference path="context.ts"/>

namespace Camel {

  export class ContextToolbarController {

    private context: Context;

    private startAction = {
      name: 'Start',
      actionFn: action => {
        this.contextsService.startContext(this.context)
          .then(response => this.updateContext());
      },
      isDisabled: true
    };
    private suspendAction = {
      name: 'Suspend',
      actionFn: action => {
        this.contextsService.suspendContext(this.context)
          .then(response => this.updateContext());
      },
      isDisabled: true
    }
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        this.$uibModal.open({
          templateUrl: 'deleteContextModal.html'
        })
        .result.then(() => {
          this.contextsService.stopContext(this.context)
            .then(response => this.workspace.removeAndSelectParentNode());
        });
      }
    };

    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          this.startAction,
          this.suspendAction
        ],
        moreActions: [
          this.deleteAction
        ]
      }
    };

    constructor($rootScope, private $uibModal, private $timeout, private workspace: Jmx.Workspace,
        private contextsService: ContextsService) {
      'ngInject';
      $rootScope.$on('jmxTreeClicked', (event, selectedNode) => {
        if (selectedNode.typeName === 'context' && selectedNode.id !== 'camelContexts') {
          this.contextsService.getContext(selectedNode.objectName)
            .then(context => {
              this.context = context;
              this.enableDisableActions();
            });
        } else {
          this.context = null;
        }
      });
    }

    isVisible() {
      return this.context !== null;
    }

    private enableDisableActions() {
      this.startAction.isDisabled = this.context.state !== 'Suspended';
      this.suspendAction.isDisabled = this.context.state !== 'Started';
    }

    private updateContext() {
      this.contextsService.getContext(this.context.mbean)
        .then(context => {
          this.context = context;
          this.enableDisableActions();
        });
    }

  }

  export const contextToolbarComponent = {
    template: `<pf-toolbar class="camel-context-toolbar" config="$ctrl.toolbarConfig" ng-show="$ctrl.isVisible()"></pf-toolbar>`,
    controller: ContextToolbarController
  };

}
