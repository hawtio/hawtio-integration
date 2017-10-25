/// <reference path="bundle.ts"/>

namespace Osgi {
  
  export class InstallBundleController {

    constructor(private bundlesService: BundlesService) {
      'ngInject';
    }  

    install(bundleLocation: string) {
      this.bundlesService.installBundle(bundleLocation)
        .then(value => Core.notification('success', 'Bundle installed successfully'))
        .catch(error => Core.notification('error', error));
    }

  }

  export const installBundleComponent: angular.IComponentOptions = {
    template: `
      <div class="row install-bundle">
        <div class="col-lg-6">
        </div>
        <div class="col-lg-6">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="Bundle location..." ng-model="bundleLocation">
            <span class="input-group-btn">
              <button type="button" class="btn btn-default" ng-click="$ctrl.install(bundleLocation)">
                Install
              </button>
            </span>
          </div>
        </div>
      </div>
    `,
    controller: InstallBundleController
  };

}
