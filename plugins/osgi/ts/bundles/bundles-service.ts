/// <reference path="../osgiHelpers.ts"/>
/// <reference path="bundle.ts"/>

namespace Osgi {

  export class BundlesService {

    private log: Logging.Logger = Logger.get("Osgi");
    
    constructor(
      private $q: ng.IQService,
      private jolokia: Jolokia.IJolokia,
      private workspace: Jmx.Workspace
    ) {
      'ngInject';
    }

    getBundles(): ng.IPromise<Bundle[]> {
      const request = {
        type: 'exec',
        mbean: getSelectionBundleMBean(this.workspace),
        operation: 'listBundles()'
      };
      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          success: response => {
            const bundles: Bundle[] = [];
            angular.forEach(response.value, (value, key) => {
              var bundle: Bundle = {
                id: value.Identifier,
                name: value.Headers['Bundle-Name'] ? value.Headers['Bundle-Name']['Value'] : '',
                symbolicName: value.SymbolicName,
                state: value.State.toLowerCase(),
                version: value.Version
              };
              bundles.push(bundle);
            });
            resolve(bundles);
          },
          error: response => {
            this.log.error(`BundlesService.getBundles() failed. ${response.error}`);
            reject(response.error);
          }
        });
      });
    }

    stopBundles(bundles: Bundle[]): ng.IPromise<string> {
      return this.execute('stopBundles([J)', bundles);
    }

    startBundles(bundles: Bundle[]): ng.IPromise<string> {
      return this.execute('startBundles([J)', bundles);
    }

    updateBundles(bundles: Bundle[]): ng.IPromise<string> {
      return this.execute('updateBundles([J)', bundles);
    }

    refreshBundles(bundles: Bundle[]): ng.IPromise<string> {
      return this.execute('refreshBundles([J)', bundles);
    }

    uninstallBundles(bundles: Bundle[]): ng.IPromise<string> {
      return this.execute('uninstallBundles([J)', bundles);
    }

    private execute(operation: string, bundles: Bundle[]): ng.IPromise<string> {
      const bundleIds = bundles.map(bundle => bundle.id);
      const request = {
        type: 'exec',
        mbean: getSelectionFrameworkMBean(this.workspace),
        operation: operation,
        arguments: [bundleIds]
      };
      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          success: () => resolve(),
          error: response => {
            this.log.error(`BundlesService.execute() failed. Operation: ${operation}. ${response.error}`);
            reject(response.error);
          }
        });
      });
    }
    
    installBundle(bundleUrl: string): ng.IPromise<string> {
      const request = {
        type: 'exec',
        mbean: getSelectionFrameworkMBean(this.workspace),
        operation: "installBundle(java.lang.String)",
        arguments: [bundleUrl]
      };
      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          success: response => resolve(response.value),
          error: response => {
            this.log.error(`BundlesService.installBundle() failed. ${response.error}`);
            reject(response.error);
          }
        });
      });
    }
    
  }

}
