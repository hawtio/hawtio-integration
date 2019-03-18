namespace JVM {

  export class ConnectLoginModalController {
    modalInstance: any;
    invalidCredentials = false;

    constructor(private ConnectOptions: ConnectOptions, private connectService: ConnectService) {
      'ngInject';
    }

    cancel() {
      this.modalInstance.dismiss();
    }

    login(username: string, password: string) {
      this.connectService.checkCredentials(this.ConnectOptions, username, password)
        .then(ok => {
          if (ok) {
            this.modalInstance.close({username: username, password: password});
          } else {
            this.invalidCredentials = true;
          }
        });
    }
  }

  export const connectLoginModalComponent: angular.IComponentOptions = {
    bindings: {
      modalInstance: '<'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.cancel()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Log In</h4>
      </div>
      <form name="connectForm" class="form-horizontal" ng-submit="$ctrl.login(username, password)">
        <div class="modal-body">
          <div class="alert alert-danger" ng-show="$ctrl.invalidCredentials">
            <span class="pficon pficon-error-circle-o"></span> Incorrect username or password
          </div>    
          <div class="form-group">
            <label class="col-sm-3 control-label" for="connection-username">Username</label>
            <div class="col-sm-8">
              <input type="text" id="connection-username" class="form-control" ng-model="username" pf-focused="true">
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-3 control-label" for="connection-password">Password</label>
            <div class="col-sm-8">
              <input type="password" id="connection-password" class="form-control" ng-model="password">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
          <button type="submit" class="btn btn-primary">Log In</button>
        </div>
      </form>
    `,
    controller: ConnectLoginModalController
  };

}
