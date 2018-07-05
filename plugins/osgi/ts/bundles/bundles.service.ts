/// <reference path="../osgiHelpers.ts"/>
/// <reference path="bundle.ts"/>

namespace Osgi {

  export class BundlesService {

    constructor(private workspace: Jmx.Workspace, private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getBundles(): ng.IPromise<Bundle[]> {
      const objectName = getSelectionBundleMBean(this.workspace);
      return this.jolokiaService.execute(objectName, 'listBundles()')
        .then(result => _.values(result).map(item => ({
            id: item.Identifier,
            name: item.Headers['Bundle-Name'] ? item.Headers['Bundle-Name']['Value'] : '',
            location: item.Location,
            symbolicName: item.SymbolicName,
            state: item.State.toLowerCase(),
            version: item.Version,
            startLevel: item.StartLevel,
            fragment: item.Fragment
          })));
    }

    startBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.jolokiaService.execute(mbean, 'startBundles([J)', ids)
        .then(this.handleResponse);
    }

    stopBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.jolokiaService.execute(mbean, 'stopBundles([J)', ids)
        .then(this.handleResponse);
    }

    updateBundles(bundles: Bundle[]): ng.IPromise<string> {
    const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.jolokiaService.execute(mbean, 'updateBundles([J)', ids)
        .then(this.handleResponse);
    }

    refreshBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.jolokiaService.execute(mbean, 'refreshBundles([J)', ids)
        .then(this.handleResponse);
    }

    uninstallBundles(bundles: Bundle[]): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      const ids = bundles.map(bundle => bundle.id);
      return this.jolokiaService.execute(mbean, 'uninstallBundles([J)', ids)
        .then(this.handleResponse);
    }

    installBundle(bundleUrl: string): ng.IPromise<string> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      return this.jolokiaService.execute(mbean, 'installBundle(java.lang.String)', bundleUrl)
        .then(response => this.jolokiaService.execute(mbean, 'startBundles([J)', response))
        .then(this.handleResponse);
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
