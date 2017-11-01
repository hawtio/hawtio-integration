/// <reference path="scr-component.ts"/>
/// <reference path="../karafHelpers.ts"/>

namespace Karaf {

  export class ScrComponentsService {

    private log: Logging.Logger = Logger.get("Karaf");
    
    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getComponents(): ng.IPromise<ScrComponent[]> {
      return this.execute(getSelectionScrMBean(this.workspace), undefined, undefined, 'read')
        .then(value => {
          const components: ScrComponent[] = [];
          angular.forEach(value['Components'].values, (item, key) => {
            var component: ScrComponent = {
              id: item.Id,
              name: item.Name,
              state: item.State,
              properties: item.Properties,
              references: item.References
            };
            components.push(component);
          });
          return components;
      });
    }

    activateComponents(components: ScrComponent[]): ng.IPromise<string> {
      const mbean = getSelectionScrMBean(this.workspace);
      let promises:ng.IPromise<String>[] = []
      angular.forEach(components, (component) => {
        promises.push(this.execute(mbean, 'activateComponent(java.lang.String)', component.name))
      });

      return this.$q.all(promises).then(this.handleResponse);
    }

    activateComponent(component: ScrComponent): ng.IPromise<string> {
      return this.activateComponents([component]);
    }

    deactivateComponents(components: ScrComponent[]): ng.IPromise<string> {
      const mbean = getSelectionScrMBean(this.workspace);
      let promises:ng.IPromise<string>[] = []
      angular.forEach(components, (component) => {
        promises.push(this.execute(mbean, 'deactivateComponent(java.lang.String)', component.name))
      });

      return this.$q.all(promises).then(this.handleResponse);
    }

    deactivateComponent(component: ScrComponent): ng.IPromise<string> {
      return this.deactivateComponents([component]);
    }

    private execute(mbean: string, operation: string, args = undefined, type: string = "exec"): ng.IPromise<string> {
      const request = {
        type: type,
        mbean: mbean,
      };

      if (operation) {
        request['operation'] = operation;
      }

      if (args) {
        request['arguments'] = [args];
      } else {
        request['arguments'] = [];
      }

      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          method: "post",
          success: response => resolve(response.value),
          error: response => {
            this.log.error(`ScrComponentsService.execute() failed. ${response}`);
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
