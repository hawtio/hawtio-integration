/// <reference path="bundle.ts"/>

namespace Osgi {

  export class InstallBundleController {

    frameworkMBean: string;

    constructor(private bundlesService: BundlesService, private workspace: Jmx.Workspace) {
      'ngInject';
      this.frameworkMBean = getSelectionFrameworkMBean(this.workspace);
    }

    install(bundleUrl: string) {
      this.bundlesService.installBundle(bundleUrl)
        .then(response => {
          Core.notification('success', response);
          this['onInstall']();
        })
        .catch(error => Core.notification('danger', error));
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
              <button type="button" class="btn btn-default" ng-click="$ctrl.install(bundleUrl)">
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
      onInstall: '&'
    }
  };

}
