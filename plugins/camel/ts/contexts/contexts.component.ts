/// <reference path="context.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  export class ContextsController {

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedContexts = this.getSelectedContexts();
        this.contextsService.startContexts(selectedContexts)
          .then(response => {
            Core.notification('success', `Started ${Core.maybePlural(selectedContexts.length, 'Camel context')} successfully`);
            this.updateContexts();
          })
          .catch(error => {
            Core.notification('danger', error);
          });
      },
      isDisabled: true
    };
    private suspendAction = {
      name: 'Suspend',
      actionFn: action => {
        let selectedContexts = this.getSelectedContexts();
        this.contextsService.suspendContexts(selectedContexts)
        .then(response => {
          Core.notification('success', `Suspended ${Core.maybePlural(selectedContexts.length, 'Camel context')} successfully`);
          this.updateContexts();
        })
        .catch(error => {
          Core.notification('danger', error);
        });
      },
      isDisabled: true
    }
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        this.$uibModal.open({
          templateUrl: 'plugins/camel/html/deleteContextWarningModal.html'
        })
        .result.then(() => {
          let selectedContexts = this.getSelectedContexts();
          this.contextsService.stopContexts(selectedContexts)
          .then(response => {
            Core.notification('success', `Deleted ${Core.maybePlural(selectedContexts.length, 'Camel context')} successfully`);
            this.removeSelectedContexts();
          })
          .catch(error => {
            Core.notification('danger', error);
          });
        });
      },
      isDisabled: true
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

    contexts: Context[];
    showTable = true;

    constructor(private $timeout: ng.ITimeoutService, private $uibModal, private workspace: Jmx.Workspace,
      private contextsService: ContextsService) {
      'ngInject';
    }

    $onInit() {
      this.contextsService.getContexts()
        .then(contexts => this.contexts = contexts);
    }

    private getSelectedContexts(): Context[] {
      return this.contexts.filter(context => context.selected);
    }

    private enableDisableActions() {
      let selectedContexts = this.getSelectedContexts();
      this.startAction.isDisabled = !selectedContexts.some(context => context.state === 'Suspended');
      this.suspendAction.isDisabled = !selectedContexts.some(context => context.state === 'Started');
      this.deleteAction.isDisabled = selectedContexts.length === 0;
    }

    private updateContexts() {
      this.contextsService.getContexts()
        .then(contexts => {
          for (let i = 0; i < contexts.length; i++) {
            if (this.contexts[i].state !== contexts[i].state) {
              this.contexts[i] = angular.extend({}, this.contexts[i], {state: contexts[i].state});
            }
          }
          this.enableDisableActions();
          this.repaintTable();
        });
    }

    private removeSelectedContexts() {
      _.remove(this.contexts, context => context.selected);
      this.workspace.loadTree();
      this.enableDisableActions();
    }

    // This is a hack to keep the 'select all' checkbox working after starting/suspending contexts
    private repaintTable() {
      this.showTable = false;
      this.$timeout(() => this.showTable = true);
    }
  }

  export const contextsComponent = <angular.IComponentOptions>{
    template: `
      <h2>Contexts</h2>
      <p ng-if="!$ctrl.contexts">Loading...</p>
      <div ng-if="$ctrl.contexts">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <div ng-if="$ctrl.showTable">
          <pf-table-view config="$ctrl.tableConfig" columns="$ctrl.tableColumns" items="$ctrl.contexts"></pf-table-view>
        </div>
      </div>
    `,
    controller: ContextsController
  };

}
