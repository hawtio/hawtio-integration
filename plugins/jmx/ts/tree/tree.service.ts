/// <reference path="../workspace.ts"/>

namespace Jmx {

  export class TreeService {

    constructor(private $rootScope: ng.IRootScopeService, private $q: ng.IQService, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    public treeContainsDomainAndProperties(domainName: string, properties = null): ng.IPromise<boolean> {
      return this.runWhenTreeReady(() => this.workspace.treeContainsDomainAndProperties(domainName, properties));
    }

    public findMBeanWithProperties(domainName: string, properties = null, propertiesCount = null): ng.IPromise<any> {
      return this.runWhenTreeReady(() => this.workspace.findMBeanWithProperties(domainName, properties, propertiesCount));
    }

    public getSelectedMBean(): ng.IPromise<NodeSelection> {
      return this.runWhenTreeSelectionReady(() => this.workspace.getSelectedMBean());
    }
    
    public getSelectedMBeanName(): ng.IPromise<string> {
      return this.runWhenTreeSelectionReady(() => this.workspace.getSelectedMBeanName());
    }
    
    public runWhenTreeReady(fn: () => any): ng.IPromise<any> {
      return this.$q((resolve, reject) => {
        if (this.workspace.treeFetched) {
          resolve(fn());
        } else {
          const unsubscribe = this.$rootScope.$on(TreeEvent.Updated, () => {
            unsubscribe();
            resolve(fn());
          });
        }
      });
    }

    private runWhenTreeSelectionReady(fn: () => any): ng.IPromise<any> {
      return this.$q((resolve, reject) => {
        if (this.workspace.selection) {
          resolve(fn());
        } else {
          const unsubscribe = this.$rootScope.$on(TreeEvent.NodeSelected, () => {
            unsubscribe();
            resolve(fn());
          });
        }
      });
    }
  }

}
