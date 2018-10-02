namespace Osgi {

  export const configurationPropertyEditModal: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&',
      resolve: '<'
    },
    template: `
      <form name="addPropertyForm" class="form-horizontal" ng-submit="$ctrl.close({$value: $ctrl.resolve.property})">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
            <span class="pficon pficon-close" aria-hidden="true"></span>
          </button>
          <h4 class="modal-title">Edit property</h4>
        </div>
        <div class="modal-body">
          <div class="form-group" ng-class="{'has-error': addPropertyForm.propKey.$invalid}">
            <label class="col-sm-2 control-label" for="propKey">Key</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="propKey" name="propKey" ng-model="$ctrl.resolve.property.key" ng-pattern="/^\\S+$/">
              <span class="help-block" ng-show="addPropertyForm.propKey.$invalid">Spaces are not allowed</span>
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label" for="propValue">Value</label>
            <div class="col-sm-10">
              <textarea class="form-control" id="propValue" name="propValue" rows="5" ng-model="$ctrl.resolve.property.value"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" ng-disabled="!$ctrl.resolve.property.key">Save</button>
        </div>
      </form>
    `
  };
}
