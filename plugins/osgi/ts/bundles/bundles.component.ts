/// <reference path="bundle.ts"/>
/// <reference path="bundles.service.ts"/>

namespace Osgi {

  export class BundlesController {

    private static FILTER_FUNCTIONS = {
      state: (bundles, state) => bundles.filter(bundle => bundle.state === state),
      name: (bundles, name) => {
        var regExp = new RegExp(name, 'i');
        return bundles.filter(bundle => regExp.test(bundle.name));
      },
      symbolicName: (bundles, symbolicName) => {
        return bundles.filter(bundle => bundle.symbolicName.indexOf(symbolicName) !== -1);
      },
      version: (bundles, version) => {
        return bundles.filter(bundle => bundle.version.indexOf(version) !== -1);
      }
    };

    private readonly startAction = {
      name: 'Start',
      actionFn: action => {
        const selectedBundles = this.getSelectedBundles();
        const fragmentBundles = selectedBundles.filter(bundle => bundle.fragment);
        if (fragmentBundles.length > 0) {
          Core.notification('warning', 'Fragment bundles cannot be started');
        } else {
          this.bundlesService.startBundles(selectedBundles)
            .then(response => {
              Core.notification('success', response);
              this.loadBundles();
            })
            .catch(error => Core.notification('danger', error));
        }
      },
      isDisabled: true
    }

    private readonly stopAction = {
      name: 'Stop',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.stopBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            this.loadBundles();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private readonly refreshAction = {
      name: 'Refresh',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.refreshBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            // delay reloading because some bundles change their state for a moment after a refresh
            setTimeout(() => this.loadBundles(), 2000);
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private readonly updateAction = {
      name: 'Update',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.updateBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            this.loadBundles();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private readonly uninstallAction = {
      name: 'Uninstall',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.uninstallBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            this.loadBundles();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }

    private readonly tableConfig = {
      selectionMatchProp: 'id',
      showCheckboxes: true,
      onCheckBoxChange: item => this.enableDisableActions()
    };

    private readonly toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'state',
            title: 'State',
            placeholder: 'Filter by state...',
            filterType: 'select',
            filterValues: [
              'active',
              'installed',
              'resolved',
              'signers_all',
              'signers_trusted',
              'start_activation_policy',
              'start_transient',
              'starting',
              'stop_transient',
              'stopping',
              'uninstalled'
            ]
          },
          {
            id: 'name',
            title: 'Name',
            placeholder: 'Filter by name...',
            filterType: 'text'
          },
          {
            id: 'symbolicName',
            title: 'Symbolic Name',
            placeholder: 'Filter by symbolic name...',
            filterType: 'text'
          },
          {
            id: 'version',
            title: 'Version',
            placeholder: 'Filter by version...',
            filterType: 'text'
          }
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        appliedFilters: [],
        resultsCount: 0
      },
      actionsConfig: {
        primaryActions: this.toolbarActions()
      },
      isTableView: true
    };

    private readonly tableColumns = [
      { header: 'ID', itemField: 'id', templateFn: value => `<a href="osgi/bundle/${value}">${value}</a>` },
      { header: 'State', itemField: 'state' },
      { header: 'Name', itemField: 'name' },
      { header: 'Symbolic Name', itemField: 'symbolicName' },
      { header: 'Version', itemField: 'version' }
    ];

    private tableItems = null;

    private bundles: Bundle[];

    private loading = true;

    constructor(private bundlesService: BundlesService, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    $onInit() {
      this.loadBundles();
    }

    private loadBundles() {
      this.bundlesService.getBundles()
        .then(bundles => {
          this.bundles = bundles;
          this.applyFilters(this.toolbarConfig.filterConfig.appliedFilters);
          this.enableDisableActions();
          this.loading = false;
        });
    }

    private toolbarActions(): any[] {
      let actions = [];
      let frameworkMBean = getSelectionFrameworkMBean(this.workspace);
      if (this.workspace.hasInvokeRightsForName(frameworkMBean, 'startBundle')) {
        actions.push(this.startAction);
      }
      if (this.workspace.hasInvokeRightsForName(frameworkMBean, 'stopBundle')) {
        actions.push(this.stopAction);
      }
      if (this.workspace.hasInvokeRightsForName(frameworkMBean, 'refreshBundle')) {
        actions.push(this.refreshAction);
      }
      if (this.workspace.hasInvokeRightsForName(frameworkMBean, 'updateBundle')) {
        actions.push(this.updateAction);
      }
      if (this.workspace.hasInvokeRightsForName(frameworkMBean, 'uninstallBundle')) {
        actions.push(this.uninstallAction);
      }
      log.debug("RBAC - Rendered bundles actions:", actions);

      if (_.isEmpty(actions)) {
        log.debug("RBAC - Disable checkboxes");
        this.tableConfig.showCheckboxes = false;
      }

      return actions;
    }

    private applyFilters(filters: any[] = []) {
      let filteredBundles = this.bundles;
      filters.forEach(filter => {
        filteredBundles = BundlesController.FILTER_FUNCTIONS[filter.id](filteredBundles, filter.value);
      });
      this.tableItems = filteredBundles;
      this.toolbarConfig.filterConfig.resultsCount = filteredBundles.length;
    }

    private getSelectedBundles(): Bundle[] {
      return this.tableItems
        .filter(tableItem => tableItem.selected);
    }

    private enableDisableActions() {
      const selectedBundles = this.getSelectedBundles();
      const noBundlesSelected = selectedBundles.length === 0;
      this.startAction.isDisabled = noBundlesSelected || selectedBundles.every(bundle => bundle.state === 'active');
      this.stopAction.isDisabled = noBundlesSelected || selectedBundles.every(bundle => bundle.state !== 'active');
      this.refreshAction.isDisabled = noBundlesSelected;
      this.updateAction.isDisabled = noBundlesSelected;
      this.uninstallAction.isDisabled = noBundlesSelected;
    }
  }

  export const bundlesComponent: angular.IComponentOptions = {
    template: `
      <div class="table-view">
        <h1>Bundles</h1>
        <p ng-if="$ctrl.loading">Loading...</p>
        <div ng-if="!$ctrl.loading">
          <install-bundle bundles="$ctrl.bundles" on-install="$ctrl.loadBundles()"></install-bundle>
          <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
          <pf-table-view config="$ctrl.tableConfig"
                         columns="$ctrl.tableColumns"
                         items="$ctrl.tableItems"></pf-table-view>
        </div>
      </div>
    `,
    controller: BundlesController
  };

}
