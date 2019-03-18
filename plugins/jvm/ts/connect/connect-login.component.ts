namespace JVM {

  export class ConnectLoginController {

    constructor(
      private $location: ng.ILocationService,
      private $window: ng.IWindowService,
      private $uibModal: angular.ui.bootstrap.IModalService,
      private userDetails: Core.AuthService,
      private postLoginTasks: Core.Tasks,
      private postLogoutTasks: Core.Tasks) {
      'ngInject';
    }

    $onInit() {
      this.$uibModal.open({
        backdrop: 'static',
        component: 'connectLoginModal'
      })
      .result.then(credentials => {
        this.registerTaskToPersistCredentials(credentials);
        this.userDetails.login(credentials.username, credentials.password);
        this.$window.location.href = this.$location.search().redirect;
      })
      .catch(error => {
        this.$window.close();
      });
    }
    
    private registerTaskToPersistCredentials(credentials) {
      this.postLoginTasks.addTask('set-credentials-in-session-storage', () => {
        this.$window.sessionStorage.setItem('username', credentials.username);
        this.$window.sessionStorage.setItem('password', credentials.password);
      });
      this.postLogoutTasks.addTask('remove-credentials-from-session-storage', () => {
        this.$window.sessionStorage.removeItem('username');
        this.$window.sessionStorage.removeItem('password');
      });
    }
  }

  export const connectLoginComponent: angular.IComponentOptions = {
    controller: ConnectLoginController
  };

}
