/// <reference path="configuration.ts"/>
/// <reference path="configuration-property.ts"/>

namespace Osgi {

  export class ConfigurationController {
    toolbarConfig = {
      actionsConfig: {
        primaryActions: []
      },
      isTableView: true
    }
    tableConfig = {
      selectionMatchProp: 'key',
      showCheckboxes: false
    };
    tableColumns = [
      { header: 'Key', itemField: 'key' },
      { header: 'Value', itemField: 'value' }
    ];
    tableMenuActions: any[];
    configuration: Configuration;

    constructor(private $routeParams: ng.route.IRouteParamsService,
      private $uibModal: angular.ui.bootstrap.IModalService,
      private configurationService: ConfigurationService) {
      'ngInject';
      this.toolbarConfig.actionsConfig.primaryActions = this.getToolbarActions();
      this.tableMenuActions = this.getTableMenuActions();
    }

    $onInit() {
      this.loadConfiguration();
    }

    loadConfiguration(): void {
      const id = this.$routeParams.id;
      this.configurationService.getConfiguration(id)
        .then(configuration => this.configuration = configuration);
    }

    getToolbarActions(): any[] {
      let actions = [];
      if (this.configurationService.hasRightsToAddProperty()) {
        actions.push({ name: 'Add property', actionFn: this.addAction });
      }
      return actions;
    }

    getTableMenuActions(): any[] {
      let actions = [];
      if (this.configurationService.hasRightsToEditProperties()) {
        actions.push({ name: 'Edit', actionFn: this.editAction });
      }
      if (this.configurationService.hasRightsToDeleteProperties()) {
        actions.push({ name: 'Delete', actionFn: this.deleteAction });
      }
      return actions;
    }

    addAction = () => {
      this.$uibModal.open({
        component: 'configurationPropertyAddModal'
      })
        .result.then(property => {
          this.configurationService.addProperty(this.configuration, property)
            .then(configuration => {
              this.configuration = configuration;
              Core.notification('success', 'Successfully added property');
            });
        });
    }

    editAction = (action, property: ConfigurationProperty) => {
      this.$uibModal.open({
        component: 'configurationPropertyEditModal',
        resolve: { property: () => new ConfigurationProperty(property.key, property.value) }
      })
        .result.then(editedProperty => {
          this.configurationService.replaceProperty(this.configuration, property, editedProperty)
            .then(configuration => {
              this.configuration = configuration;
              Core.notification('success', 'Successfully updated property');
            });
        });
    }

    deleteAction = (action, property: ConfigurationProperty) => {
      this.$uibModal.open({
        component: 'configurationPropertyDeleteModal',
        resolve: { property: () => property }
      })
        .result.then(() => {
          this.configurationService.deleteProperty(this.configuration, property)
            .then(configuration => {
              this.configuration = configuration;
              Core.notification('success', 'Successfully deleted property');
            });
        });
    }
  }

  export const configurationComponent: angular.IComponentOptions = {
    template: `
      <div class="table-view">
        <ol class="breadcrumb">
          <li><a ng-href="osgi/configurations">Configuration</a></li>
          <li class="page-title">{{$ctrl.configuration.id}}</li>
        </ol>
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig" columns="$ctrl.tableColumns" items="$ctrl.configuration.properties"
          menu-actions="$ctrl.tableMenuActions"></pf-table-view>
      </div>
    `,
    controller: ConfigurationController
  };

}
