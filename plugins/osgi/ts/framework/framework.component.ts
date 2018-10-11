/// <reference path="framework.ts"/>
/// <reference path="framework.service.ts"/>
/// <reference path="../bundles/bundles.service.ts"/>

namespace Osgi {

  export class FrameworkController {

    private framework: Framework = null;
    private maxBundleStartLevel: number = null;
    private loading: boolean = false;
    private saveInProgress: boolean = false;
    private canSave: boolean = false;

    constructor(
      public frameworkService: FrameworkService,
      public bundlesService: BundlesService,
      private attributesService: Jmx.AttributesService,
      private workspace: Jmx.Workspace,
      private $q: ng.IQService,
    ) {
      'ngInject';
    }

    $onInit() {
      this.loading = true;
      this.frameworkService.getFramework()
        .then(framework => this.framework = framework)
        .catch(error => Core.notification('danger', error));

      this.bundlesService.getBundles()
        .then(bundles => {
          const bundleStartLevels = bundles.filter(bundle => bundle.state === 'active').map(bundle => bundle.startLevel)
          this.maxBundleStartLevel = Math.max.apply(Math, bundleStartLevels);
        })
        .then(_ => this.fetchPermissions())
        .then(permissions => {
          this.canSave = _.every(permissions);
          this.loading = false;
        })
        .catch(error => {
          this.loading = false;
          log.error(error);
        });
    }

    private fetchPermissions(): ng.IPromise<boolean[]> {
      const mbean = getSelectionFrameworkMBean(this.workspace);
      return this.$q.all(FrameworkService.FRAMEWORK_MBEAN_ATTRIBUTES
        .map(attribute => this.attributesService.canInvoke(mbean, attribute, 'Int')))
    }

    updateFrameworkConfiguration() {
      if (this.framework.startLevel < this.framework.initialBundleStartLevel) {
        Core.notification('danger', 'Cannot set framework start level below initial bundle start level');
      } else if (this.maxBundleStartLevel !== null && this.framework.startLevel < this.maxBundleStartLevel) {
        Core.notification('danger', `Cannot set framework start level to ${this.framework.startLevel}.\n\nSome installed bundles require a start level of ${this.maxBundleStartLevel}.`)
      } else {
        this.saveInProgress = true;
        this.frameworkService.updateConfiguration(this.framework)
          .then(response => {
            this.saveInProgress = false;
            Core.notification('success', 'Configuration updated')
          })
          .catch(error => {
            this.saveInProgress = false;
            Core.notification('danger', error)
          });
      }
    }

    saveDisabled(): boolean {
      return this.framework === null ||
             this.framework.initialBundleStartLevel === null ||
             this.framework.startLevel === null ||
             this.saveInProgress === true;
    }

    hasEditPermission(): boolean {
      return this.canSave;
    }
  }

  export const frameworkComponent: angular.IComponentOptions = {
    template: `
      <div class="framework-main">
        <h1>Framework Configuration</h1>
        <p ng-if="$ctrl.loading">Loading...</p>
        <div ng-if="!$ctrl.loading">
          <form class="form-horizontal framework-form" ng-submit="$ctrl.updateFrameworkConfiguration()">
            <div class="form-group">
              <label class="col-sm-3 control-label" for="startLevel">Current Framework Start Level</label>
              <div class="col-sm-2">
                <input id="startLevel" class="form-control" type="number" min="0" max="100" ng-model="$ctrl.framework.startLevel">
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label" for="initialBundleStartLevel">Initial Bundle Start Level</label>
              <div class="col-sm-2">
                <input id="initialBundleStartLevel" class="form-control" type="number" min="0" max="100" ng-model="$ctrl.framework.initialBundleStartLevel">
              </div>
            </div>
            <div ng-if="$ctrl.hasEditPermission()" class="form-group">
              <div class="col-sm-offset-3 col-sm-2">
                <button type="submit" class="btn btn-primary" ng-disabled="$ctrl.saveDisabled()">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `,
    controller: FrameworkController
  };
}
