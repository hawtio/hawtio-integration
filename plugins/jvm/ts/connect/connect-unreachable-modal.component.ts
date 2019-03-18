namespace JVM {

  export const connectUnreachableModalComponent: angular.IComponentOptions = {
    bindings: {
      close: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.close()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Endpoint Unreachable</h4>
      </div>
      <div class="modal-body">
        <p>This Jolokia endpoint is unreachable. Please check the connection details and try again.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" ng-click="$ctrl.close()">OK</button>
      </div>
    `
  };

}
