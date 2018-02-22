/// <reference path="bundle.ts"/>

namespace Osgi {

  export class InstallBundleController {

    loading: boolean = false;
    frameworkMBean: string;
    bundles: Bundle[] = [];

    constructor(private bundlesService: BundlesService, private workspace: Jmx.Workspace) {
      'ngInject';
      this.frameworkMBean = getSelectionFrameworkMBean(this.workspace);
    }

    install(bundleUrl: string) {
      let bundle: Bundle = this.findBundleByUrl(bundleUrl);
      if (bundle) {
        Core.notification('warning',`Bundle ${bundle.name} ${bundle.version} is already installed`);
        return;
      }

      this.loading = true;
      this.bundlesService.installBundle(bundleUrl)
      .then(response => {
        this.loading = false;
        Core.notification('success', response);
        this['onInstall']();
      })
      .catch(error => {
        this.loading = false;
        Core.notification('danger', error);
      });
    }

    findBundleByUrl(bundleUrl: string): Bundle {
      return this.bundles.filter((bundle) => {return bundle.location === bundleUrl.trim()})[0];
    }

    installDisabled(bundleUrl: string): boolean {
      return this.loading || (!bundleUrl || bundleUrl.trim().length === 0);
    }
  }

  export const installBundleComponent: angular.IComponentOptions = {
    template: `
      <div class="row install-bundle"
          hawtio-show object-name="{{$ctrl.frameworkMBean}}" method-name="installBundle">
        <div class="col-lg-6">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="Bundle URL..." ng-model="bundleUrl">
            <span class="input-group-btn">
              <button type="button" class="btn btn-default" ng-click="$ctrl.install(bundleUrl)" ng-disabled="$ctrl.installDisabled(bundleUrl)">
                Install
              </button>
            </span>
          </div>
        </div>
        <div class="col-lg-6">
        </div>
      </div>
    `,
    controller: InstallBundleController,
    bindings: {
      onInstall: '&',
      bundles: '<'
    }
  };
}
