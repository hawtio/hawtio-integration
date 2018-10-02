namespace Osgi {

  export const configurationPropertyDeleteModal: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&',
      resolve: '<'
    },
    template: `
      <form class="form-horizontal" ng-submit="$ctrl.close()">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
            <span class="pficon pficon-close" aria-hidden="true"></span>
          </button>
          <h4 class="modal-title">Delete property</h4>
        </div>
        <div class="modal-body">
          <p>Delete property '{{$ctrl.resolve.property.key}}'?</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-danger">Delete</button>
        </div>
      </form>
    `
  };
}
