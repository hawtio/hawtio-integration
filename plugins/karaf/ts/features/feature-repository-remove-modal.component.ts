/// <reference path="feature.ts"/>

namespace Karaf {

  export class FeatureRepositoryRemoveModalController {

    private modalInstance: any;

    private resolve: { repositories:FeatureRepository[] };

    private repositories: FeatureRepository[];

    constructor() {
      'ngInject';
    }

    $onInit() {
      this.repositories = this.resolve.repositories;
    }

    removeRepository(repository: FeatureRepository) {
      this.modalInstance.close(repository);
    }
  }

  export const featureRepositoryRemoveModalComponent: angular.IComponentOptions = {
    bindings: {
      dismiss: '&',
      modalInstance: '<',
      resolve: '<'
    },
    template: `
      <form name="removeRepository" class="form-horizontal" ng-submit="$ctrl.removeRepository(repository)">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
            <span class="pficon pficon-close" aria-hidden="true"></span>
          </button>
          <h4 class="modal-title">Remove feature repository</h4>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="col-sm-3 control-label" for="repository">Repository</label>
            <div class="col-sm-9">
              <select id="repository" class="form-control" ng-model="repository"
                      ng-options="repository.name for repository in $ctrl.repositories"></select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" ng-disabled="!repository">Remove</button>
        </div>
      </form>
    `,
    controller: FeatureRepositoryRemoveModalController
  };
}
