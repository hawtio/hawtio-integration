/// <reference path="bundle.ts"/>
/// <reference path="bundles-service.ts"/>

namespace Osgi {
  
  export class BundlesController {

    private static FILTER_FUNCTIONS = {
      state: (bundles, state) => bundles.filter(bundle => bundle.state === state),
      name: (bundles, name) => {
        var regExp = new RegExp(name, 'i');
        return bundles.filter(bundle => regExp.test(bundle.name));
      },
      symbolicName: (bundles, symbolicName) => {
        var regExp = new RegExp(symbolicName, 'i');
        return bundles.filter(bundle => regExp.test(bundle.symbolicName));
      },
      version: (bundles, version) => {
        var regExp = new RegExp(version, 'i');
        return bundles.filter(bundle => regExp.test(bundle.version));
      }
    };

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.startBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            this.loadBundles();
          })
          .catch(error => Core.notification('danger', error));
        },
      isDisabled: true
    }

    private stopAction = {
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
    
    private refreshAction = {
      name: 'Refresh',
      actionFn: action => {
        let selectedBundles = this.getSelectedBundles();
        this.bundlesService.refreshBundles(selectedBundles)
          .then(response => {
            Core.notification('success', response);
            this.loadBundles();
          })
          .catch(error => Core.notification('danger', error));
      },
      isDisabled: true
    }
    
    private updateAction = {
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
    
    private uninstallAction = {
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
    
    private toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'state',
            title:  'State',
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
        resultsCount: 0
      },
      actionsConfig: {
        primaryActions: [
          this.startAction,
          this.stopAction,
          this.refreshAction,
          this.updateAction,
          this.uninstallAction
        ]
      },
      isTableView: true
    };

    private tableConfig = {
      selectionMatchProp: 'id',
      onCheckBoxChange: item => this.enableDisableActions()
    };

    private tableColumns = [
      { header: 'ID', itemField: 'id', templateFn: value => `<a href="osgi/bundle/${value}">${value}</a>` },
      { header: 'State', itemField: 'state' },
      { header: 'Name', itemField: 'name' },
      { header: 'Symbolic Name', itemField: 'symbolicName' },
      { header: 'Version', itemField: 'version' }
    ];

    private tableItems = null;

    private bundles: Bundle[];

    private loading = true;

    constructor(private bundlesService: BundlesService) {
      'ngInject';
    }  

    $onInit() {
      this.loadBundles();
    }

    private loadBundles() {
      this.bundlesService.getBundles()
        .then(bundles => {
          this.bundles = bundles;
          this.tableItems = bundles;
          this.toolbarConfig.filterConfig.resultsCount = bundles.length;
          this.enableDisableActions();
          this.loading = false;
        });
    }

    private applyFilters(filters: any[]) {
      let filteredBundles = this.bundles;
      filters.forEach(filter => {
        filteredBundles = BundlesController.FILTER_FUNCTIONS[filter.id](filteredBundles, filter.value);
      });
      this.tableItems = filteredBundles;
      this.toolbarConfig.filterConfig.resultsCount = filteredBundles.length;
    }

    private getSelectedBundles(): Bundle[] {
      return this.tableItems
        .map((tableItem, i) => angular.extend(this.bundles[i], { selected: tableItem['selected'] }))
        .filter(bundle => bundle.selected);
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
        <div ng-if="!$ctrl.loading">
          <install-bundle on-install="$ctrl.loadBundles()"></install-bundle>
          <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
          <pf-table-view config="$ctrl.tableConfig"
                         colummns="$ctrl.tableColumns"
                         items="$ctrl.tableItems"></pf-table-view>
        </div>
        <div class="spinner spinner-lg loading-page" ng-if="$ctrl.loading"></div>
      </div>
    `,
    controller: BundlesController
  };

}
