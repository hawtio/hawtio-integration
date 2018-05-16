/// <reference path="scr-component.ts"/>
/// <reference path="scr-components.service.ts"/>

namespace Karaf {

  export class ScrComponentsController {

    private static FILTER_FUNCTIONS = {
      state: (components, state) => components.filter(component => component.state === state),
      name: (components, name) => {
        var regExp = new RegExp(name, 'i');
        return components.filter(component => regExp.test(component.name));
      }
    };

    private readonly enableAction = {
      name: 'Enable',
      actionFn: action => {
        let selectedComponents = this.getSelectedComponents();
        this.scrComponentsService.enableComponents(selectedComponents)
          .then(response => {
            Core.notification('success', response);
            this.loadComponents();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private readonly disableAction = {
      name: 'Disable',
      actionFn: action => {
        let selectedComponents = this.getSelectedComponents();
        this.scrComponentsService.disableComponents(selectedComponents)
          .then(response => {
            Core.notification('success', response);
            this.loadComponents();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private toolbarActions(): any[] {
      let actions = [];
      let scrMBean = getSelectionScrMBean(this.workspace);
      if (this.workspace.hasInvokeRightsForName(scrMBean, 'enableComponent')) {
        actions.push(this.enableAction);
      }
      if (this.workspace.hasInvokeRightsForName(scrMBean, 'disableComponent')) {
        actions.push(this.disableAction);
      }
      log.debug("RBAC - Rendered SCR actions:", actions);
      return actions;
    }

    private toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'name',
            title: 'Name',
            placeholder: 'Filter by name...',
            filterType: 'text'
          },
          {
            id: 'state',
            title: 'State',
            placeholder: 'Filter by state...',
            filterType: 'select',
            filterValues: [
              'Enabled',
              'Disabled'
            ]
          }
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        resultsCount: 0
      },
      actionsConfig: {
        primaryActions: this.toolbarActions()
      },
      isTableView: true
    };

    private tableConfig = {
      selectionMatchProp: 'name',
      onCheckBoxChange: item => this.enableDisableActions()
    };

    private tableColumns = [
      { header: 'Name', itemField: 'name', templateFn: value => `<a href="osgi/scr-components/${value}">${value}</a>` },
      { header: 'State', itemField: 'state' }
    ];

    private tableItems = null;

    private components: ScrComponent[];

    private loading = true;

    constructor(private scrComponentsService: ScrComponentsService, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    $onInit() {
      this.loadComponents();
    }

    private loadComponents() {
      this.scrComponentsService.getComponents()
        .then(components => {
          this.components = components;
          this.tableItems = components;
          this.toolbarConfig.filterConfig.resultsCount = components.length;
          this.enableDisableActions();
          this.loading = false;
        });
    }

    private applyFilters(filters: any[]) {
      let filteredComponents = this.components;
      filters.forEach(filter => {
        filteredComponents = ScrComponentsController.FILTER_FUNCTIONS[filter.id](filteredComponents, filter.value);
      });
      this.tableItems = filteredComponents;
      this.toolbarConfig.filterConfig.resultsCount = filteredComponents.length;
    }

    private enableDisableActions() {
      const selectedComponents = this.getSelectedComponents();
      const noComponentsSelected = selectedComponents.length === 0;
      this.enableAction.isDisabled = noComponentsSelected || selectedComponents.every(component => component.state === 'Enabled');
      this.disableAction.isDisabled = noComponentsSelected || selectedComponents.every(component => component.state !== 'Enabled');
    }

    private getSelectedComponents(): ScrComponent[] {
      return this.tableItems
        .filter(component => component.selected);
    }

  }

  export const scrListComponent: angular.IComponentOptions = {
    template: `
      <div class="table-view">
        <h1>Declarative Services</h1>
        <p ng-if="$ctrl.loading">Loading...</p>
        <div ng-if="!$ctrl.loading">
          <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
          <pf-table-view config="$ctrl.tableConfig"
                         columns="$ctrl.tableColumns"
                         items="$ctrl.tableItems"></pf-table-view>
        </div>
      </div>
    `,
    controller: ScrComponentsController
  };
}
