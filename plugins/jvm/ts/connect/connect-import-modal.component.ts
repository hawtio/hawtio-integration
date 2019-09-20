namespace JVM {

  export class ConnectImportController {
    close: Function;
    input: HTMLInputElement;
    fileSelected = false;
    updateFileSelectedFlag: () => void;
    errorMessage: string;

    constructor(private $timeout: ng.ITimeoutService, private connectService: ConnectService) {
      'ngInject';
    }

    $onInit() {
      this.input = <HTMLInputElement> document.getElementById('connectionsFile');
      this.updateFileSelectedFlag = () => this.$timeout(() => this.fileSelected = this.input.files.length > 0);
      this.input.addEventListener('change', this.updateFileSelectedFlag);
    }

    $onDestroy() {
      this.input.removeEventListener('change', this.updateFileSelectedFlag);
    }

    import() {
      if (this.input.files.length > 0) {
        const file = this.input.files.item(0);
        const fileReader = new FileReader();
        fileReader.onload = () => {
          try {
            const connections = JSON.parse(<string> fileReader.result);
            this.connectService.importConnections(connections);
            this.close();
            Core.notification("success", 'Connections imported successfully');
          } catch (e) {
            this.$timeout(() => this.errorMessage = e.message);
          }
        };
        fileReader.readAsText(file);
      }
    }
  }

  export const connectImportModalComponent: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Import connections</h4>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger" ng-if="$ctrl.errorMessage">
          <span class="pficon pficon-error-circle-o"></span>
          {{ $ctrl.errorMessage }}
        </div>
        <form>
          <div class="form-group">
            <input type="file" id="connectionsFile" accept="application/json" ng-model="$ctrl.myfile">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
        <button type="button" class="btn btn-primary" ng-click="$ctrl.import()" ng-disabled="!$ctrl.fileSelected">Import</button>
      </div>
    `,
    controller: ConnectImportController
  };

}
