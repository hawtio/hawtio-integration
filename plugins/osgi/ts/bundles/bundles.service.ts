/// <reference path="../osgiHelpers.ts"/>
/// <reference path="bundle.ts"/>

namespace Osgi {

  export class BundlesService {

    private log: Logging.Logger = Logger.get("Osgi");
    
    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getBundles(): ng.IPromise<Bundle[]> {
      return this.execute(getSelectionBundleMBean(this.workspace), 'listBundles()')
        .then(value => {
          const bundles: Bundle[] = [];
          angular.forEach(value, (item, key) => {
            var bundle: Bundle = {
              id: item.Identifier,
              name: item.Headers['Bundle-Name'] ? item.Headers['Bundle-Name']['Value'] : '',
              symbolicName: item.SymbolicName,
              state: item.State.toLowerCase(),
              version: item.Version
            };
            bundles.push(bundle);
          });
          return bundles;
      });
    }

    startBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.execute(mbean, 'startBundles([J)', ids)
        .then(this.handleResponse);
    }
    
    stopBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.execute(mbean, 'stopBundles([J)', ids)
        .then(this.handleResponse);
    }

    updateBundles(bundles: Bundle[]): ng.IPromise<string> {
    const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.execute(mbean, 'updateBundles([J)', ids)
        .then(this.handleResponse);
    }

    refreshBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.execute(mbean, 'refreshBundles([J)', ids)
        .then(this.handleResponse);
    }

    uninstallBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.execute(mbean, 'uninstallBundles([J)', ids)
        .then(this.handleResponse);
    }
    
    installBundle(bundleUrl: string): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      return this.execute(mbean, 'installBundle(java.lang.String)', bundleUrl)
        .then(response => this.execute(mbean, 'startBundles([J)', response))
        .then(this.handleResponse);
      }

    private execute(mbean: string, operation: string, args = undefined): ng.IPromise<string> {
      const request = {
        type: 'exec',
        mbean: mbean,
        operation: operation
      };
      if (args) {
        request['arguments'] = [args];
      }
      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          method: "post",
          success: response => resolve(response.value),
          error: response => {
            this.log.error(`BundlesService.execute() failed. ${response}`);
            reject(response.error);
          }
        });
      });
    }
    
    private handleResponse(response) {
      console.log(response);
      if (response && response['Error']) {
        throw response['Error'];
      } else {
        return `The operation completed successfully`;
      }
    }
  }

}
