/// <reference path="scr-component.ts"/>
/// <reference path="../karafHelpers.ts"/>

namespace Karaf {

  export class ScrComponentsService {

    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getComponents(): ng.IPromise<ScrComponent[]> {
      return getSelectionScrMBeanAsync(this.workspace, this.$q)
        .then(mbean => this.execute(mbean, undefined, 'read'))
        .then(value => {
          const components: ScrComponent[] = [];
          angular.forEach(value['Components'].values, (item, key) => {
            let id = -1;
            let state = 'Disabled';
            let properties = item.Properties;

            // Fetch additional info from the ComponentConfigs attribute to avoid making additional Jolokia calls
            let componentConfig = value['ComponentConfigs'].values.filter((component) => {
              return component.Name === item.Name;
            });

            if (componentConfig && componentConfig.length > 0) {
              id = componentConfig[0].Id;
              state = 'Enabled';
              properties = componentConfig[0].Properties;

              angular.forEach(componentConfig[0].SatisfiedReferences, (reference) => {
                if (item.References[reference.Name]) {
                  // Augment references with BoundServices info
                  item.References[reference.Name]['BoundServices'] = reference.BoundServices;
                }
              });
            }

            let component: ScrComponent = {
              id: id,
              bundleId: item.BundleId,
              name: item.Name,
              state: state,
              properties: properties,
              references: item.References
            };
            components.push(component);
          });
          return components;
      });
    }

    enableComponents(components: ScrComponent[]): ng.IPromise<string> {
      const mbean = getSelectionScrMBean(this.workspace);
      let promises:ng.IPromise<string>[] = []
      angular.forEach(components, (component) => {
        promises.push(this.execute(mbean, 'enableComponent(long, java.lang.String)', 'exec', component.bundleId, component.name))
      });

      return this.$q.all(promises).then(this.handleResponse);
    }

    enableComponent(component: ScrComponent): ng.IPromise<string> {
      return this.enableComponents([component]);
    }

    disableComponents(components: ScrComponent[]): ng.IPromise<string> {
      const mbean = getSelectionScrMBean(this.workspace);
      let promises:ng.IPromise<string>[] = []
      angular.forEach(components, (component) => {
        promises.push(this.execute(mbean, 'disableComponent(long, java.lang.String)', 'exec', component.bundleId, component.name))
      });

      return this.$q.all(promises).then(this.handleResponse);
    }

    disableComponent(component: ScrComponent): ng.IPromise<string> {
      return this.disableComponents([component]);
    }

    private execute(mbean: string, operation: string, type: string, ...args: any[]): ng.IPromise<string> {
      const request = {
        type: type,
        mbean: mbean,
      };

      if (operation) {
        request['operation'] = operation;
      }

      if (args) {
        request['arguments'] = args;
      } else {
        request['arguments'] = [];
      }

      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          method: "post",
          success: response => resolve(response.value),
          error: response => {
            log.error('ScrComponentsService.execute() failed:', response);
            reject(response.error);
          }
        });
      });
    }

    private handleResponse(response) {
      if (response && response['Error']) {
        throw response['Error'];
      } else {
        return `The operation completed successfully`;
      }
    }
  } 
}
