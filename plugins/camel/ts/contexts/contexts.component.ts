/// <reference path="context.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  export class ContextsController {

    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          {
            name: 'Start',
            actionFn: action => {
              let selectedContexts = this.getSelectedContexts();
              if (selectedContexts.length > 0) {
                this.contextsService.startContexts(selectedContexts)
                  .then(response => this.updateContexts());
              }
            }
          },
          {
            name: 'Suspend',
            actionFn: action => {
              let selectedContexts = this.getSelectedContexts();
              if (selectedContexts.length > 0) {
                this.contextsService.suspendContexts(selectedContexts)
                  .then(response => this.updateContexts());
              }
            }
          }
        ],
        moreActions: [
          {
            name: 'Delete',
            actionFn: action => {
              let selectedContexts = this.getSelectedContexts();
              if (selectedContexts.length > 0) {
                this.$uibModal.open({
                  templateUrl: 'deleteContextModal.html'
                })
                .result.then(() => {
                  this.contextsService.deleteContexts(selectedContexts)
                    .then(response => this.removeSelectedContexts());
                });
              }
            }
          }
        ]
      }
    };

    tableConfig = {
      selectionMatchProp: "name"
    };

    tableColummns = [
      { header: "Name", itemField: "name" },
      { header: "State", itemField: "state" }
    ];

    tableItems = [{ name: null, state: null }];
    
    contexts: Context[];

    constructor(private $uibModal, private workspace: Jmx.Workspace, private contextsService: ContextsService) {
      'ngInject';
    }

    $onInit() {
      this.loadContexts();
    }

    private getSelectedContexts() {
      return this.tableItems
        .map((tableItem, i) => angular.extend(this.contexts[i], { selected: tableItem['selected'] }))
        .filter(context => context.selected);
    }

    private loadContexts() {
      if (this.workspace.selection) {
        var typeNames = Jmx.getUniqueTypeNames(this.workspace.selection.children);
        if (typeNames.length > 1) {
          console.error("Child nodes aren't of the same type. Found types: " + typeNames);
        }
        let mbeans = this.workspace.selection.children.map(node => node.objectName);
        this.contextsService.getContexts(mbeans)
          .then(contexts => {
            this.tableItems = contexts.map(context => ({
              name: context.name,
              state: context.state
            }));
            this.contexts = contexts;
          });
      }
    }

    private updateContexts() {
      let mbeans = this.contexts.map(context => context.mbean);
      this.contextsService.getContexts(mbeans)
        .then(contexts => {
          this.contexts = contexts;
          contexts.forEach((context, i) => this.tableItems[i].state = context.state);
        });
    }

    private removeSelectedContexts() {
      this.tableItems.forEach((tableItem, i) => angular.extend(this.contexts[i], { selected: tableItem['selected'] }));
      _.remove(this.contexts, context => context.selected);
      _.remove(this.tableItems, tableItem => tableItem['selected']);
      this.workspace.loadTree();
    }

  }

  export const contextsComponent = {
    templateUrl: 'plugins/camel/html/contexts.html',
    controller: ContextsController
  };

}
