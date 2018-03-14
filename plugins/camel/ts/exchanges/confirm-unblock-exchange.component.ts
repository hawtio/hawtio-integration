namespace Camel {

  export const confirmUnblockExchangeComponent: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Unblock Exchange</h4>
      </div>
      <div class="modal-body">
        <p>You are about to unblock the selected thread.</p>
        <p>This operation cannot be undone so please be careful.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
        <button type="button" class="btn btn-danger" ng-click="$ctrl.close()">Unblock</button>
      </div>
    `
  };

}
