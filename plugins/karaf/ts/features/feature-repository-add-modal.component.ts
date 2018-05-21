/// <reference path="feature.ts"/>

namespace Karaf {

  export class FeatureRepositoryAddModalController {

    private modalInstance: any;

    constructor(private featuresService: FeaturesService) {
      'ngInject';
    }

    addRepository(uri: string) {
      this.modalInstance.close({uri: uri});
    }
  }

  export const featureRepositoryAddModalComponent: angular.IComponentOptions = {
    bindings: {
      dismiss: '&',
      modalInstance: '<',
    },
    template: `
      <form name="addRepository" class="form-horizontal" ng-submit="$ctrl.addRepository(uri)">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
            <span class="pficon pficon-close" aria-hidden="true"></span>
          </button>
          <h4 class="modal-title">Add feature repository</h4>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="col-sm-3 control-label" for="uri">Repository URI</label>
            <div class="col-sm-9">
              <input type="text" class="form-control" id="uri" ng-model="uri" placeholder="mvn:foo/bar/1.0/xml/features">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" ng-disabled="!(uri !== undefined && uri.trim().length > 0)">Add</button>
        </div>
      </form>
    `,
    controller: FeatureRepositoryAddModalController
  };
}