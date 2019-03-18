namespace JVM {

  export const connectDeleteModalComponent: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Are you sure?</h4>
      </div>
      <div class="modal-body">
        <p>You are about to delete this connection.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
        <button type="button" class="btn btn-danger" ng-click="$ctrl.close()">Delete</button>
      </div>
    `
  };

}
